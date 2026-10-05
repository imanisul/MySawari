import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { offersQueryOptions } from '@/services/api/offers';

/** The one place vehicles are fetched: Home, Explore and Search all share this query (and its cache). */
export const VEHICLES_KEY = ['vehicles'] as const;

// Older builds kept a copy of the fleet on the device and showed it at launch. Only live data is shown now.
const LEGACY_STORAGE_KEY = '@vehicles_cache_v1';

const STORAGE_KEY = '@vehicles_cache_v2';

export const vehiclesQueryOptions = {
  queryKey: VEHICLES_KEY,
  queryFn: async () => {
    const raw = await API.getVehiclesRaw();
    const mapped = API.mapVehicles(raw);
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(raw)).catch(() => {});
    return mapped;
  },
  staleTime: 15 * 1000, // fresh for 15 s: moving between screens never re-downloads
  refetchInterval: 30 * 1000, // and quietly re-checked every 30 s while the app is open (paused in the background)
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
          queryClient.setQueryData(VEHICLES_KEY, API.mapVehicles(raw));
        }
      } catch (e) {}
    }
  }).finally(() => {
    queryClient.prefetchQuery(vehiclesQueryOptions).catch(() => {});
  });
}
