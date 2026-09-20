import AsyncStorage from '@react-native-async-storage/async-storage';
import { QueryClient, useQuery } from '@tanstack/react-query';
import { API } from '@/services/backend/api';

/** The one place vehicles are fetched: Home, Explore and Search all share this query (and its cache). */
export const VEHICLES_KEY = ['vehicles'] as const;

const STORAGE_KEY = '@vehicles_cache_v1';
// A saved copy older than this isn't shown at all (availability would be too out of date).
const MAX_SAVED_AGE_MS = 6 * 60 * 60 * 1000;

export const vehiclesQueryOptions = {
  queryKey: VEHICLES_KEY,
  queryFn: async () => {
    const raw = await API.getVehiclesRaw();
    // Keep a copy on the device so the next app launch has vehicles on screen instantly.
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ at: Date.now(), raw })).catch(() => {});
    return API.mapVehicles(raw);
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
 * Called once at app start: shows the saved copy immediately (marked with its real age, so it is
 * refreshed straight away) and starts the network fetch without waiting for any screen to ask.
 */
export async function primeVehicles(queryClient: QueryClient) {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && !queryClient.getQueryData(VEHICLES_KEY)) {
      const { at, raw } = JSON.parse(saved);
      if (Array.isArray(raw) && Date.now() - at < MAX_SAVED_AGE_MS) {
        queryClient.setQueryData(VEHICLES_KEY, API.mapVehicles(raw), { updatedAt: at });
      }
    }
  } catch (e) {
    // A bad or missing saved copy just means we wait for the network.
  }
  queryClient.prefetchQuery(vehiclesQueryOptions).catch(() => {});
}
