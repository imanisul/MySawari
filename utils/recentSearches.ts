import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationResult, parseDayLabel, splitDateRange, todayDayNum } from '@/utils/sawari';

/**
 * The trips someone searched for, newest first, so Home can offer them again with one tap instead of
 * filling destination and dates from scratch. Kept on the device per account (or per install for a
 * guest) — no database change. Also logged as a `trip_search` activity for the server-side profile.
 */
export type RecentSearch = {
  id: string;
  dropoff: LocationResult;
  dateRange: string;    // "12 Oct – 15 Oct"
  duration: string;
  pickupTime: string;
  returnTime: string;
  vehicleType: 'car' | 'bike';
  savedAt: number;
};

const MAX_RECENT = 6;
const keyFor = (userId?: string | null) => `@recent_searches_${userId || 'guest'}`;

export async function getRecentSearches(userId?: string | null): Promise<RecentSearch[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((s) => s && s.dropoff?.name && s.dateRange) : [];
  } catch {
    return [];
  }
}

export async function saveRecentSearch(userId: string | null | undefined, s: Omit<RecentSearch, 'id' | 'savedAt'>): Promise<RecentSearch[]> {
  const id = `${s.dropoff.name.toLowerCase()}|${s.dateRange}|${s.vehicleType}`;
  const list = (await getRecentSearches(userId)).filter((x) => x.id !== id);
  const next = [{ ...s, id, savedAt: Date.now() }, ...list].slice(0, MAX_RECENT);
  try { await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next)); } catch {}
  return next;
}

export async function removeRecentSearch(userId: string | null | undefined, id: string): Promise<RecentSearch[]> {
  const next = (await getRecentSearches(userId)).filter((x) => x.id !== id);
  try { await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next)); } catch {}
  return next;
}

/** A guest's searches become theirs when they log in on this phone. */
export async function adoptGuestSearches(userId: string): Promise<void> {
  const guest = await getRecentSearches(null);
  if (!guest.length) return;
  const mine = await getRecentSearches(userId);
  const seen = new Set(mine.map((x) => x.id));
  const merged = [...mine, ...guest.filter((x) => !seen.has(x.id))].sort((a, b) => b.savedAt - a.savedAt).slice(0, MAX_RECENT);
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(merged));
    await AsyncStorage.removeItem(keyFor(null));
  } catch {}
}

/** Its start date has already gone by, so it can only be reused with new dates. */
export function isPastSearch(s: RecentSearch): boolean {
  const [start] = splitDateRange(s.dateRange);
  // Labels carry no year ("12 Oct"): it is the first such date on/after the day the search was saved.
  const saved = new Date(s.savedAt || Date.now());
  const savedDay = Math.floor(Date.UTC(saved.getFullYear(), saved.getMonth(), saved.getDate()) / 86400000);
  const day = parseDayLabel(start, savedDay);
  return day === null || day < todayDayNum();
}
