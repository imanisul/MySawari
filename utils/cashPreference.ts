import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Profile → "My Sawari Cash" switch: when on, the Payment Option page starts with Sawari Cash applied (the
 * customer can still turn it off for one trip there). Kept on the device per account; off by default.
 */
const keyFor = (userId?: string | null) => `@auto_apply_sawari_cash_${userId || 'guest'}`;

export async function getAutoApplyCash(userId?: string | null): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(keyFor(userId))) === '1';
  } catch {
    return false;
  }
}

export async function setAutoApplyCash(userId: string | null | undefined, on: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(keyFor(userId), on ? '1' : '0');
  } catch {}
}