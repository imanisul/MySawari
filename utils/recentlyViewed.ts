import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Cars and bikes this person opened recently (ids, newest first), so Home can show them again with their
 * live price and availability from the server. Kept on the device per account (or per install for a guest).
 */
const MAX_VIEWED = 10;
const keyFor = (userId?: string | null) => `@recently_viewed_${userId || 'guest'}`;

export async function getRecentlyViewed(userId?: string | null): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((id) => typeof id === 'string' && id) : [];
  } catch {
    return [];
  }
}

export async function addRecentlyViewed(userId: string | null | undefined, vehicleId: string): Promise<void> {
  if (!vehicleId) return;
  const next = [vehicleId, ...(await getRecentlyViewed(userId)).filter((id) => id !== vehicleId)].slice(0, MAX_VIEWED);
  try { await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next)); } catch {}
}

/** What a guest looked at stays with them when they log in on this phone. */
export async function adoptGuestViewed(userId: string): Promise<void> {
  const guest = await getRecentlyViewed(null);
  if (!guest.length) return;
  const mine = await getRecentlyViewed(userId);
  const merged = [...guest, ...mine.filter((id) => !guest.includes(id))].slice(0, MAX_VIEWED);
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(merged));
    await AsyncStorage.removeItem(keyFor(null));
  } catch {}
}
