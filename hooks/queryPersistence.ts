import AsyncStorage from '@react-native-async-storage/async-storage';
import type { QueryClient } from '@tanstack/react-query';

/**
 * Stale-while-revalidate across launches: the customer's own lists (trips, rewards, reviews) are saved on the phone
 * under their id, shown at once on the next launch, and refreshed in the background. Public data (vehicles, offers)
 * has its own saved copy. Removed at logout. One slot per list (the first part of its query key).
 */
const USER_QUERIES = ['bookings', 'ride-journey', 'myReviews'];

let userId: string | null = null;
let unsubscribe: (() => void) | null = null;
const timers = new Map<string, ReturnType<typeof setTimeout>>();

const slot = (root: string) => `@qcache_${userId}_${root}`;

/** Puts this customer's saved lists into the cache, marked stale so each refreshes straight away. */
export async function hydrateUserQueries(client: QueryClient, uid: string): Promise<void> {
  await Promise.all(USER_QUERIES.map(async (root) => {
    try {
      const saved = await AsyncStorage.getItem(`@qcache_${uid}_${root}`);
      if (!saved) return;
      const { key, data } = JSON.parse(saved);
      if (Array.isArray(key) && data !== undefined && client.getQueryData(key) === undefined) {
        client.setQueryData(key, data, { updatedAt: 0 });
      }
    } catch {}
  }));
}

/** From now on, every successful load of those lists is saved for this customer (call once per signed-in session). */
export function startQueryPersistence(client: QueryClient, uid: string) {
  stopQueryPersistence();
  userId = uid;
  unsubscribe = client.getQueryCache().subscribe((event: any) => {
    if (event?.type !== 'updated' || event.action?.type !== 'success') return;
    const query = event.query;
    const root = String(query.queryKey[0]);
    if (!USER_QUERIES.includes(root) || !userId) return;
    // A burst of updates is written once.
    clearTimeout(timers.get(root));
    timers.set(root, setTimeout(() => {
      timers.delete(root);
      if (userId) AsyncStorage.setItem(slot(root), JSON.stringify({ key: query.queryKey, data: query.state.data })).catch(() => {});
    }, 400));
  });
}

/** Stops saving and deletes this customer's saved lists (logout). */
export function clearQueryPersistence() {
  const uid = userId;
  stopQueryPersistence();
  if (uid) AsyncStorage.multiRemove(USER_QUERIES.map((root) => `@qcache_${uid}_${root}`)).catch(() => {});
}

function stopQueryPersistence() {
  unsubscribe?.();
  unsubscribe = null;
  timers.forEach(clearTimeout);
  timers.clear();
  userId = null;
}
