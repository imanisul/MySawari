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
const HOME_DATA_MAX_WAIT_MS = 45 * 1000;
// Card photos are plate-processed on the server; after a deploy that can be slow, so they get a shorter wait.
const CARD_IMAGES_MAX_WAIT_MS = 8 * 1000;

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
  { isAuthenticated, fetchWallet, syncNotifications, userId, onStep }: {
    isAuthenticated: boolean; fetchWallet: () => Promise<void>; syncNotifications?: () => Promise<void>;
    userId?: string | null; onStep?: (key: HomeLoadStep['key']) => void;
  },
): Promise<void> {
  const step = <T,>(key: HomeLoadStep['key'], p: Promise<T>) => p.finally(() => onStep?.(key));
  const tasks: Promise<unknown>[] = [
    // staleTime 0 when only the saved copy is there, so a live fetch is made (or the running one joined).
    // Then the card photos, so Home opens with its pictures instead of grey placeholders.
    step('vehicles', queryClient.fetchQuery({ ...vehiclesQueryOptions, staleTime: hasLiveVehicles() ? vehiclesQueryOptions.staleTime : 0 })),
    step('offers', queryClient.fetchQuery(offersQueryOptions)),
    // The bell's unread count is right from the first frame.
    ...(syncNotifications ? [syncNotifications().catch(() => {})] : []),
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
