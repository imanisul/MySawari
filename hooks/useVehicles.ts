import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { offersQueryOptions } from '@/services/api/offers';

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

function prefetchVehicleImages(vehicles: any[]) {
  try {
    const urlsToPrefetch: string[] = [];
    vehicles.forEach(car => {
      if (car.image && typeof car.image === 'string') urlsToPrefetch.push(car.image);
      if (car.images && Array.isArray(car.images)) {
        car.images.forEach((img: any) => {
          if (typeof img === 'string') urlsToPrefetch.push(img);
        });
      }
    });
    const uniqueUrls = [...new Set(urlsToPrefetch)].filter(Boolean);
    if (uniqueUrls.length > 0) {
      Image.prefetch(uniqueUrls);
    }
  } catch (e) {
    console.warn('Failed to prefetch images', e);
  }
}

export const vehiclesQueryOptions = {
  queryKey: VEHICLES_KEY,
  queryFn: async () => {
    const raw = await API.getVehiclesRaw();
    const mapped = API.mapVehicles(raw);
    liveVehiclesAt = Date.now();
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(raw)).catch(() => {});
    
    // Aggressively cache all images in the background
    prefetchVehicleImages(mapped);
    
    return mapped;
  },
  staleTime: 5 * 60 * 1000, // fresh for 5 min
  refetchInterval: 5 * 60 * 1000, // re-check every 5 min
  refetchOnWindowFocus: true, // re-checked when the app comes back to the foreground
  refetchOnReconnect: true,
} as const;

export function useVehicles() {
  return useQuery(vehiclesQueryOptions);
}

/**
 * Called once at app start: loads the last known vehicles from disk instantly,
 * then starts the live fetch from the database so Home updates with real data.
 */
export function primeVehicles(queryClient: QueryClient) {
  AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => {});
  // Offers start loading now too, so Exclusive Offers / Special Deals are already there when Home
  // appears instead of popping in (and pushing the page down) a moment later.
  queryClient.prefetchQuery(offersQueryOptions).catch(() => {});
  
  AsyncStorage.getItem(STORAGE_KEY).then((cached) => {
    if (cached) {
      try {
        const raw = JSON.parse(cached);
        if (Array.isArray(raw)) {
          const mapped = API.mapVehicles(raw);
          queryClient.setQueryData(VEHICLES_KEY, mapped);
          prefetchVehicleImages(mapped);
        }
      } catch (e) {}
    }
  }).finally(() => {
    queryClient.prefetchQuery(vehiclesQueryOptions).catch(() => {});
  });
}
