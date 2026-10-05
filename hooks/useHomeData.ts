import { QueryClient } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { offersQueryOptions } from '@/services/api/offers';
import { vehiclesQueryOptions, hasLiveVehicles } from '@/hooks/useVehicles';
import { getRecentSearches } from '@/utils/recentSearches';
import { getRecentlyViewed } from '@/utils/recentlyViewed';

/** This person's recent trip searches (Home's one-tap "Recent searches"). */
/** Ids of the cars / bikes this person opened recently (Home's "Recently viewed"). */
export const recentlyViewedQueryOptions = (userId?: string | null) => ({
  queryKey: ['recentlyViewed', userId || 'guest'] as const,
  queryFn: () => getRecentlyViewed(userId),
  staleTime: 0,
});

export const recentSearchesQueryOptions = (userId?: string | null) => ({
  queryKey: ['recentSearches', userId || 'guest'] as const,
  queryFn: () => getRecentSearches(userId),
  staleTime: 0,
});

/** The signed-in customer's bookings (Home's "Your next trip" card). Shared with HomeScreen. */
export const bookingsQueryOptions = {
  queryKey: ['bookings'] as const,
  queryFn: async () => {
    const userBookings = await API.getAllBookings();
    return userBookings.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  staleTime: 15 * 1000,
  refetchInterval: 60 * 1000,
  refetchOnWindowFocus: true,
};

// The loading screen never waits longer than this; anything still missing then loads on the Home screen.
const HOME_DATA_MAX_WAIT_MS = 10 * 1000;

export type HomeLoadStep = { key: 'vehicles' | 'offers' | 'trips' | 'wallet'; label: string; done: boolean };

/** What the loading page lists for this person (a guest has no trips or wallet yet). */
export function homeLoadSteps(isAuthenticated: boolean): HomeLoadStep[] {
  const steps: HomeLoadStep[] = [
    { key: 'vehicles', label: 'Finding cars & bikes available for you', done: false },
    { key: 'offers', label: 'Loading offers & special deals', done: false },
  ];
  if (isAuthenticated) {
    steps.push({ key: 'trips', label: 'Getting your trips', done: false });
    steps.push({ key: 'wallet', label: 'Your SawariCash & membership', done: false });
  }
  return steps;
}

/**
 * Everything the Home screen shows for this person, loaded from the server while the loading screen is up:
 * live vehicles (not the saved copy), offers and special deals, their recent searches and — when signed in —
 * their bookings and wallet / membership. Requests already in flight are joined, not repeated. Never throws.
 * `onStep` is told as each part arrives, so the loading page can tick it off.
 */
export async function loadHomeData(
  queryClient: QueryClient,
  { isAuthenticated, fetchWallet, userId, onStep }: {
    isAuthenticated: boolean; fetchWallet: () => Promise<void>; userId?: string | null;
    onStep?: (key: HomeLoadStep['key']) => void;
  },
): Promise<void> {
  const step = <T,>(key: HomeLoadStep['key'], p: Promise<T>) => p.finally(() => onStep?.(key));
  const tasks: Promise<unknown>[] = [
    // staleTime 0 when only the saved copy is there, so a live fetch is made (or the running one joined).
    step('vehicles', queryClient.fetchQuery({ ...vehiclesQueryOptions, staleTime: hasLiveVehicles() ? vehiclesQueryOptions.staleTime : 0 })),
    step('offers', queryClient.fetchQuery(offersQueryOptions)),
    queryClient.fetchQuery(recentSearchesQueryOptions(isAuthenticated ? userId : null)),
    queryClient.fetchQuery(recentlyViewedQueryOptions(isAuthenticated ? userId : null)),
  ];
  if (isAuthenticated) {
    tasks.push(step('trips', queryClient.fetchQuery(bookingsQueryOptions)));
    tasks.push(step('wallet', fetchWallet())); // membership card + SawariCash, applied to the app state
  }
  await Promise.race([
    Promise.allSettled(tasks),
    new Promise((resolve) => setTimeout(resolve, HOME_DATA_MAX_WAIT_MS)),
  ]);
}
