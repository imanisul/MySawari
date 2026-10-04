import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { API } from '@/services/backend/api';

/** The one place vehicles are fetched: Home, Explore and Search all share this query (and its cache). */
export const VEHICLES_KEY = ['vehicles'] as const;

// Older builds kept a copy of the fleet on the device and showed it at launch. Only live data is shown now.
const LEGACY_STORAGE_KEY = '@vehicles_cache_v1';

export const vehiclesQueryOptions = {
  queryKey: VEHICLES_KEY,
  queryFn: async () => API.mapVehicles(await API.getVehiclesRaw()),
  staleTime: 15 * 1000, // fresh for 15 s: moving between screens never re-downloads
  refetchInterval: 30 * 1000, // and quietly re-checked every 30 s while the app is open (paused in the background)
  refetchOnWindowFocus: true, // re-checked when the app comes back to the foreground
  refetchOnReconnect: true,
} as const;

export function useVehicles() {
  return useQuery(vehiclesQueryOptions);
}

/**
 * Called once at app start: starts the live fetch from the database straight away, while the
 * loading screen is up, so Home opens with real vehicles.
 */
export function primeVehicles(queryClient: QueryClient) {
  AsyncStorage.removeItem(LEGACY_STORAGE_KEY).catch(() => {});
  queryClient.prefetchQuery(vehiclesQueryOptions).catch(() => {});
}
