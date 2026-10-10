import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationResult } from '@/utils/sawari';

export type RecentlyViewedItem = {
  vehicleId: string;
  dropoff?: LocationResult;
  dateRange?: string;
  pickupTime?: string;
  returnTime?: string;
  duration?: string;
  stage?: 'car' | 'booking' | 'payment';
  trip?: {
    mode: any;
    isDeliveryRequested: boolean;
    deliveryMode: any;
    pickup: any;
    returnAddress: any;
  };
};

/**
 * Cars and bikes this person opened recently, along with the search context, so Home can show them again
 * and restore the user's progress. Kept on the device per account (or per install for a guest).
 */
const MAX_VIEWED = 10;
const keyFor = (userId?: string | null) => `@recently_viewed_v2_${userId || 'guest'}`;
const oldKeyFor = (userId?: string | null) => `@recently_viewed_${userId || 'guest'}`;

export async function getRecentlyViewed(userId?: string | null): Promise<RecentlyViewedItem[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    if (!raw) {
      // Migrate old string-only items if present
      const oldRaw = await AsyncStorage.getItem(oldKeyFor(userId));
      if (oldRaw) {
        const oldList = JSON.parse(oldRaw);
        if (Array.isArray(oldList)) {
          const mapped = oldList.filter((id) => typeof id === 'string' && id).map(id => ({ vehicleId: id }));
          await AsyncStorage.setItem(keyFor(userId), JSON.stringify(mapped));
          return mapped;
        }
      }
      return [];
    }
    const list = JSON.parse(raw);
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function addRecentlyViewed(userId: string | null | undefined, item: RecentlyViewedItem): Promise<void> {
  if (!item.vehicleId) return;
  const list = await getRecentlyViewed(userId);
  const next = [item, ...list.filter((x) => x.vehicleId !== item.vehicleId)].slice(0, MAX_VIEWED);
  try { await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next)); } catch {}
}

/** What a guest looked at stays with them when they log in on this phone. */
export async function adoptGuestViewed(userId: string): Promise<void> {
  const guest = await getRecentlyViewed(null);
  if (!guest.length) return;
  const mine = await getRecentlyViewed(userId);
  const seen = new Set(mine.map((x) => x.vehicleId));
  const merged = [...guest, ...mine.filter((x) => !seen.has(x.vehicleId))].slice(0, MAX_VIEWED);
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(merged));
    await AsyncStorage.removeItem(keyFor(null));
    await AsyncStorage.removeItem(oldKeyFor(null));
  } catch {}
}
