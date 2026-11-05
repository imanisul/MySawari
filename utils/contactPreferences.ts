import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Settings → "Recommendations & Reminder": whether the customer wants offers and reminders by SMS and by
 * WhatsApp. Both on by default. Kept on the device per account — the server has no field for these yet, so
 * the messaging side must read them from the backend once one is added.
 */
export type ContactPrefs = { sms: boolean; whatsapp: boolean };
const DEFAULTS: ContactPrefs = { sms: true, whatsapp: true };
const keyFor = (userId?: string | null) => `@contact_prefs_${userId || 'guest'}`;

export async function getContactPrefs(userId?: string | null): Promise<ContactPrefs> {
  try {
    const raw = await AsyncStorage.getItem(keyFor(userId));
    return raw ? { ...DEFAULTS, ...JSON.parse(raw) } : DEFAULTS;
  } catch {
    return DEFAULTS;
  }
}

export async function setContactPrefs(userId: string | null | undefined, prefs: ContactPrefs): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(userId), JSON.stringify(prefs));
  } catch {}
}