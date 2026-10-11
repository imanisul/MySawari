import { QueryClient } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { offersQueryOptions } from '@/services/api/offers';
import { vehiclesQueryOptions, hasLiveVehicles, waitForCardImages } from '@/hooks/useVehicles';
import { getRecentSearches } from '@/utils/recentSearches';
import { getRecentlyViewed } from '@/utils/recentlyViewed';

/** This person's recent trip searches (Home's one-tap "Recent searches"). */
/** Ids of the cars / bikes this person opened recently (Home's "Recently viewed"). */
export const recentlyViewedQueryOptions = (userId?: string | null) => ({
  queryKey: ['recentlyViewed', userId || 'guest'] as const,
  queryFn: () => getRecentlyViewed(userId),
  staleTime: 5 * 60 * 1000,
});

export const recentSearchesQueryOptions = (userId?: string | null) => ({
  queryKey: ['recentSearches', userId || 'guest'] as const,
  queryFn: () => getRecentSearches(userId),
  staleTime: 5 * 60 * 1000,
});

/** The signed-in customer's bookings (Home's "Your next trip" card). Shared with HomeScreen. */
export const bookingsQueryOptions = {
  queryKey: ['bookings'] as const,
  queryFn: async () => {
    const userBookings = await API.getAllBookings();
    return userBookings.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  staleTime: 5 * 60 * 1000,
  refetchInterval: 5 * 60 * 1000,
  refetchOnWindowFocus: true,
};

// Safety net only: every request has its own timeout and retries, and the loading screen offers
// Retry / Continue after a few seconds of waiting. (It used to give up after 4 s, so Home often opened on the
// saved copy of the fleet with offers, trips, wallet and photos still popping in afterwards.)
const HOME_DATA_MAX_WAIT_MS = 8 * 1000;
// Card photos are plate-processed on the server; after a deploy that can be slow, so they get a shorter wait.
const CARD_IMAGES_MAX_WAIT_MS = 6 * 1000;

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
 * Everything the Home screen shows for this person, loaded quickly:
 * live vehicles (or primed disk cache), offers and special deals, and — when signed in —
 * their bookings and wallet / membership. Secondary tasks run without blocking.
 */
export async function loadHomeData(
  queryClient: QueryClient,
  { isAuthenticated, fetchWallet, syncNotifications, userId, onStep }: {
    isAuthenticated: boolean; fetchWallet: () => Promise<void>; syncNotifications?: () => Promise<void>;
    userId?: string | null; onStep?: (key: HomeLoadStep['key']) => void;
  },
): Promise<void> {
  const step = <T,>(key: HomeLoadStep['key'], p: Promise<T>) => p.finally(() => onStep?.(key));

  // Background non-blocking syncs
  if (syncNotifications) {
    syncNotifications().catch(() => {});
  }
  queryClient.fetchQuery(recentSearchesQueryOptions(isAuthenticated ? userId : null)).catch(() => {});
  queryClient.fetchQuery(recentlyViewedQueryOptions(isAuthenticated ? userId : null)).catch(() => {});

  const tasks: Promise<unknown>[] = [
    step('vehicles', queryClient.fetchQuery(vehiclesQueryOptions)),
    step('offers', queryClient.fetchQuery(offersQueryOptions)),
  ];
  if (isAuthenticated) {
    tasks.push(step('trips', queryClient.fetchQuery(bookingsQueryOptions)));
    tasks.push(step('wallet', fetchWallet()));
  }
  await Promise.race([
    Promise.allSettled(tasks),
    new Promise((resolve) => setTimeout(resolve, HOME_DATA_MAX_WAIT_MS)),
  ]);
}
