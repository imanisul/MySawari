import { QueryClient } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { offersQueryOptions } from '@/services/api/offers';
import { vehiclesQueryOptions, hasLiveVehicles } from '@/hooks/useVehicles';

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

/**
 * Everything the Home screen shows for this person, loaded from the server while the loading screen is up:
 * live vehicles (not the saved copy), offers and special deals, and — when signed in — their bookings and
 * their wallet / membership. Requests already in flight are joined, not repeated. Never throws.
 */
export async function loadHomeData(
  queryClient: QueryClient,
  { isAuthenticated, fetchWallet }: { isAuthenticated: boolean; fetchWallet: () => Promise<void> },
): Promise<void> {
  const tasks: Promise<unknown>[] = [
    // staleTime 0 when only the saved copy is there, so a live fetch is made (or the running one joined).
    queryClient.fetchQuery({ ...vehiclesQueryOptions, staleTime: hasLiveVehicles() ? vehiclesQueryOptions.staleTime : 0 }),
    queryClient.fetchQuery(offersQueryOptions),
  ];
  if (isAuthenticated) {
    tasks.push(queryClient.fetchQuery(bookingsQueryOptions));
    tasks.push(fetchWallet()); // membership card + SawariCash, applied to the app state
  }
  await Promise.race([
    Promise.allSettled(tasks),
    new Promise((resolve) => setTimeout(resolve, HOME_DATA_MAX_WAIT_MS)),
  ]);
}
