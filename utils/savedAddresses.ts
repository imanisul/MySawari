import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationResult } from '@/utils/sawari';

/**
 * Delivery / collection addresses the customer has used, newest first, offered again as "Saved Locations"
 * in the car details address sheet. Kept on the device per account (or per install for a guest) — no
 * database change, same approach as utils/recentSearches.ts.
 */
export type SavedAddress = LocationResult & {
  /** Short tag shown before the name, e.g. "Airport". */
  label?: string;
  /** Contact number for the person at this address. */
  phone?: string;
  savedAt: number;
};

const MAX_SAVED = 5;
const keyFor = (userId?: string | null) => `@saved_addresses_${userId || 'guest'}`;

// Same place = same id, or within ~50 m (a search result and a quick pick for the same spot).
const samePlace = (a: LocationResult, b: LocationResult) =>
  a.id === b.id || (Math.abs(a.latitude - b.latitude) < 0.0005 && Math.abs(a.longitude - b.longitude) < 0.0005);

export async function getSavedAddresses(userId?: string | null): Promise<SavedAddress[]> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list.filter((a) => a && a.name && Number.isFinite(a.latitude) && Number.isFinite(a.longitude)) : [];
  } catch {
    return [];
  }
}

/** Remembers an address the customer chose. GPS auto-detected spots are not saved — they weren't chosen. */
export async function saveAddress(userId: string | null | undefined, loc: LocationResult, label?: string): Promise<SavedAddress[]> {
  if (!loc?.name || loc.source === 'gps') return getSavedAddresses(userId);
  const list = await getSavedAddresses(userId);
  const prev = list.find((a) => samePlace(a, loc));
  const entry: SavedAddress = { ...loc, label: label ?? prev?.label, savedAt: Date.now() };
  const next = [entry, ...list.filter((a) => !samePlace(a, loc))].slice(0, MAX_SAVED);
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next));
  } catch { }
  return next;
}

/** Forgets one saved address (Profile → Saved Addresses). */
export async function removeSavedAddress(userId: string | null | undefined, id: string): Promise<SavedAddress[]> {
  const next = (await getSavedAddresses(userId)).filter((a) => a.id !== id);
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next));
  } catch { }
  return next;
}

/** Patches fields on a saved address (e.g. phone number) without replacing the whole entry. */
export async function updateSavedAddress(userId: string | null | undefined, id: string, patch: Partial<Pick<SavedAddress, 'label' | 'phone'>>): Promise<SavedAddress[]> {
  const list = await getSavedAddresses(userId);
  const next = list.map((a) => (a.id === id ? { ...a, ...patch } : a));
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next));
  } catch { }
  return next;
}

/** Replaces an existing saved address when editing an address. */
export async function replaceSavedAddress(userId: string | null | undefined, id: string, loc: LocationResult, label?: string): Promise<SavedAddress[]> {
  const list = await getSavedAddresses(userId);
  const existing = list.find((a) => a.id === id);
  const updated: SavedAddress = {
    ...loc,
    id,
    label: label ?? existing?.label,
    phone: existing?.phone,
    savedAt: Date.now(),
  };
  const next = list.map((a) => (a.id === id ? updated : a));
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(next));
  } catch { }
  return next;
}