import React, { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, useQuery, useQueryClient } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { offersQueryOptions, hydrateOffers, exclusiveOffersQueryOptions, hydrateExclusiveOffers } from '@/services/api/offers';

import { Image } from 'expo-image';

/** The one place vehicles are fetched: Home, Explore and Search all share this query (and its cache). */
export const VEHICLES_KEY = ['vehicles'] as const;

// Older builds kept a copy of the fleet on the device and showed it at launch. Only live data is shown now.
const LEGACY_STORAGE_KEY = '@vehicles_cache_v1';

const STORAGE_KEY = '@vehicles_cache_v2';

// When the vehicles last arrived from the server (0 = only the saved copy so far). The loading screen
// waits for this, so the saved copy is never mistaken for live data.
let liveVehiclesAt = 0;
export const hasLiveVehicles = () => liveVehiclesAt > 0;

// Each photo is asked for once per app session (the saved copy and the live list carry the same URLs).
const prefetchedImages = new Set<string>();
// Settles when every card photo asked for so far has downloaded (or failed) — the loading screen waits on it.
let cardImagesPromise: Promise<unknown> = Promise.resolve();

/** Resolves once the vehicle card photos are on the device, or after `maxWaitMs` — never rejects. */
export function waitForCardImages(maxWaitMs: number): Promise<void> {
  return Promise.race([
    cardImagesPromise.then(() => undefined, () => undefined),
    new Promise<void>((resolve) => setTimeout(resolve, maxWaitMs)),
  ]);
}

/**
 * Warms only the card photo of each vehicle. Every photo is plate-processed by the backend (CPU-heavy, two at
 * a time), so prefetching every gallery photo of the whole fleet at launch queued dozens of jobs ahead of the
 * cards on screen and slowed the API (login, bookings) running on the same server. Gallery photos load when
 * the vehicle is opened.
 */
function prefetchVehicleImages(vehicles: any[]) {
  try {
    const uniqueUrls = vehicles
      .map((car) => car?.image)
      .filter((url): url is string => typeof url === 'string' && !!url && !prefetchedImages.has(url));
    if (uniqueUrls.length > 0) {
      uniqueUrls.forEach((url) => prefetchedImages.add(url));
      const batch = Image.prefetch(uniqueUrls, 'memory-disk').catch(() => false);
      cardImagesPromise = Promise.all([cardImagesPromise, batch]);
    }
  } catch (e: any) {
    if (__DEV__) console.warn('Failed to prefetch images:', e?.message);
  }
}

/** Warms every photo of one car (its gallery), called when the car is tapped so they are ready as its page opens. */
export function prefetchCarGallery(car: any) {
  try {
    const urls = ((car?.images as any[]) || [])
      .map((i) => (typeof i === 'string' ? i : i?.uri))
      .filter((u): u is string => typeof u === 'string' && !!u && !prefetchedImages.has(u));
    if (!urls.length) return;
    urls.forEach((u) => prefetchedImages.add(u));
    Image.prefetch(urls, 'memory-disk').catch(() => false);
  } catch {}
}

export const vehiclesQueryOptions = {
  queryKey: VEHICLES_KEY,
  queryFn: async () => {
    try {
      const raw = await API.getVehiclesRaw();
      const mapped = API.mapVehicles(raw);
      liveVehiclesAt = Date.now();
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(raw)).catch(() => {});
      
      // Aggressively cache all images in the background
      prefetchVehicleImages(mapped);
      
      return mapped;
    } catch (err: any) {
      if (__DEV__) console.warn('vehiclesQueryOptions queryFn error, attempting cache recovery:', err?.message);
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          const raw = JSON.parse(cached);
          if (Array.isArray(raw) && raw.length > 0) {
            return API.mapVehicles(raw);
          }
        }
      } catch {}
      throw err;
    }
  },
  staleTime: 10 * 1000, // 10 seconds: quick stale time so bookings reflect in real time
  refetchInterval: 15 * 1000, // 15 seconds: live polling keeps vehicle availability in real time
  refetchOnWindowFocus: true, // re-checked when the app comes back to the foreground
  refetchOnMount: true,
  refetchOnReconnect: true,
} as const;

export function useVehicles() {
  return useQuery(vehiclesQueryOptions);
}

/**
 * The car with its bookings read live from the server for this one vehicle (refreshed every 10 s while open), so the
 * car page and checkout agree with the bookings table. Also synchronizes the live availability facts back into the
 * global vehicles list cache so other screens don't show stale availability.
 */
export function useLiveCar<T extends { id: string } | null | undefined>(car: T): T {
  const id = car?.id ? String(car.id) : '';
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['vehicle-availability', id],
    queryFn: () => API.getVehicleAvailability(id),
    enabled: /^[a-f0-9]{24}$/i.test(id),
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  });

  // Sync this vehicle's live availability back into the global vehicles list
  useEffect(() => {
    if (data && id) {
      queryClient.setQueryData<any[]>(VEHICLES_KEY, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((v) => {
          if (String(v.id) === id || (v as any)._id === id) {
            return {
              ...v,
              bookedRanges: data.bookedRanges,
              dbStatus: data.status || (v as any).dbStatus,
              maintenanceUntil: data.maintenanceUntil,
            };
          }
          return v;
        });
      });
    }
  }, [data, id, queryClient]);

  if (!car || !data) return car;
  return { ...car, bookedRanges: data.bookedRanges, dbStatus: data.status || (car as any).dbStatus, maintenanceUntil: data.maintenanceUntil } as T;
}

/**
 * Called once at app start: loads the last known vehicles from disk instantly,
 * then starts the live fetch from the database so Home updates with real data.
 */
export function primeVehicles(queryClient: QueryClient) {
  AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => {});
  // Offers start loading now too, so Exclusive Offers / Special Deals are already there when Home
  // appears instead of popping in (and pushing the page down) a moment later.
  hydrateOffers(queryClient).finally(() => queryClient.prefetchQuery({ ...offersQueryOptions, staleTime: 0 }).catch(() => {}));
  hydrateExclusiveOffers(queryClient).finally(() => queryClient.prefetchQuery({ ...exclusiveOffersQueryOptions, staleTime: 0 }).catch(() => {}));
  
  AsyncStorage.getItem(STORAGE_KEY).then((cached) => {
    if (cached) {
      try {
        const raw = JSON.parse(cached);
        if (Array.isArray(raw)) {
          const mapped = API.mapVehicles(raw);
          queryClient.setQueryData(VEHICLES_KEY, mapped);
          liveVehiclesAt = Date.now();
          prefetchVehicleImages(mapped);
        }
      } catch (e) {}
    }
  }).finally(() => {
    // staleTime 0: the saved copy was just written into the cache and would count as fresh for 5 min.
    queryClient.prefetchQuery({ ...vehiclesQueryOptions, staleTime: 0 }).catch(() => {});
  });
}
