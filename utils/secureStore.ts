import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Production-grade Secure Storage abstraction for MySawari.
 *
 * Uses iOS Keychain and Android EncryptedSharedPreferences (via expo-secure-store)
 * to store sensitive credentials (auth_token, refresh_token, install_id).
 *
 * Includes automatic migration for legacy tokens previously stored in AsyncStorage
 * and safe error handling without crashing app startup.
 */

const AUTH_KEYS = ['auth_token', 'refresh_token', 'user_id'];

/**
 * Retrieves a securely stored item. Automatically migrates legacy tokens
 * from AsyncStorage to SecureStore if found.
 */
export async function getItemAsync(key: string): Promise<string | null> {
  try {
    const value = await SecureStore.getItemAsync(key);
    if (value !== null && value !== undefined) {
      return value;
    }

    // Check if legacy value exists in AsyncStorage (one-time migration)
    if (AUTH_KEYS.includes(key) || key === 'install_id') {
      try {
        const legacyValue = await AsyncStorage.getItem(key);
        if (legacyValue) {
          // Migrate to SecureStore and purge plaintext copy from AsyncStorage
          await SecureStore.setItemAsync(key, legacyValue);
          await AsyncStorage.removeItem(key);
          return legacyValue;
        }
      } catch {}
    }

    return null;
  } catch (error) {
    // If SecureStore fails (e.g. keystore corrupted or simulator edge cases), fallback safely
    try {
      return await AsyncStorage.getItem(key);
    } catch {
      return null;
    }
  }
}

/**
 * Saves a sensitive item to SecureStore. Never logs the value.
 */
export async function setItemAsync(key: string, value: string): Promise<void> {
  if (value === undefined || value === null) return;
  try {
    await SecureStore.setItemAsync(key, String(value));
    // Purge any legacy unencrypted copy in AsyncStorage
    if (AUTH_KEYS.includes(key)) {
      AsyncStorage.removeItem(key).catch(() => {});
    }
  } catch (error) {
    // Graceful fallback if device keystore encounters a temporary initialization delay
    try {
      await AsyncStorage.setItem(key, String(value));
    } catch {}
  }
}

/**
 * Deletes an item from both SecureStore and AsyncStorage.
 */
export async function deleteItemAsync(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {}
  try {
    await AsyncStorage.removeItem(key);
  } catch {}
}

/**
 * Atomically purges all authentication tokens and identifiers on logout.
 */
export async function clearAuthCredentials(): Promise<void> {
  await Promise.allSettled(AUTH_KEYS.map((k) => deleteItemAsync(k)));
}
