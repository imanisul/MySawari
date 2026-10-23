import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationResult, parseDayLabel, splitDateRange, todayDayNum } from '@/utils/sawari';

/**
 * The trips someone searched for, newest first, so Home can offer them again with one tap instead of
 * filling destination and dates from scratch. Kept on the device per account (or per install for a
 * guest) — no database change. Also logged as a `trip_search` activity for the server-side profile.
 */
/** The last page of the booking journey this trip reached — tapping it on Home resumes right there. */
export type SearchStage = 'results' | 'car' | 'booking' | 'payment';

/** Trip choices made along the way (delivery, driver), so a resumed checkout has everything filled in. */
export type TripChoices = {
  mode?: 'Self Drive' | 'With Driver';
  isDeliveryRequested?: boolean;
  deliveryMode?: 'delivery' | 'return' | 'both';
  pickup?: LocationResult | null;
  returnAddress?: LocationResult | null;
};

export type RecentSearch = {
  id: string;
  stage?: SearchStage;
  carId?: string;
  carName?: string;
  trip?: TripChoices;
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

export const searchIdFor = (dropoffName: string, dateRange: string, vehicleType: string) =>
  `${dropoffName.toLowerCase()}|${dateRange}|${vehicleType}`;

type SearchBase = Omit<RecentSearch, 'id' | 'savedAt' | 'stage' | 'carId' | 'carName' | 'trip'>;

export async function saveRecentSearch(userId: string | null | undefined, s: SearchBase): Promise<RecentSearch[]> {
  const id = searchIdFor(s.dropoff.name, s.dateRange, s.vehicleType);
  const list = await getRecentSearches(userId);
  const prev = list.find((x) => x.id === id);
  // A repeated search keeps how far that trip got (car chosen, checkout reached).
  const entry: RecentSearch = { ...prev, ...s, id, savedAt: Date.now(), stage: prev?.stage || 'results' };
  const next = [entry, ...list.filter((x) => x.id !== id)].slice(0, MAX_RECENT);
  try { await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next)); } catch {}
  return next;
}

/**
 * Records the page this trip has just reached (results → car → booking → payment). The most recent page
 * wins, so Home resumes exactly where the customer left. Creates the entry if the trip wasn't saved yet.
 */
export async function markSearchProgress(
  userId: string | null | undefined,
  s: SearchBase,
  stage: SearchStage,
  extra: { carId?: string; carName?: string; trip?: TripChoices } = {},
): Promise<void> {
  if (!s.dropoff?.name || !s.dateRange || s.dateRange.includes('Select')) return;
  const id = searchIdFor(s.dropoff.name, s.dateRange, s.vehicleType);
  const list = await getRecentSearches(userId);
  const prev = list.find((x) => x.id === id);
  const entry: RecentSearch = {
    ...prev, ...s, id, savedAt: Date.now(), stage,
    carId: stage === 'results' ? undefined : extra.carId ?? prev?.carId,
    carName: stage === 'results' ? undefined : extra.carName ?? prev?.carName,
    trip: extra.trip ?? prev?.trip,
  };
  const next = [entry, ...list.filter((x) => x.id !== id)].slice(0, MAX_RECENT);
  try { await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next)); } catch {}
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
  // Labels carry no year ("12 Oct"): the trip is the first such date on/after the day it was searched.
  const saved = new Date(s.savedAt || Date.now());
  const savedDay = Math.floor(Date.UTC(saved.getFullYear(), saved.getMonth(), saved.getDate()) / 86400000);
  const sameYear = parseDayLabel(start ? `${start} ${saved.getFullYear()}` : null);
  if (sameYear === null) return true;
  const day = sameYear >= savedDay ? sameYear : parseDayLabel(`${start} ${saved.getFullYear() + 1}`);
  return day === null || day < todayDayNum();
}
