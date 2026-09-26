import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * OTA Update states
 */
export type UpdateStatus =
  | 'idle'
  | 'checking'
  | 'available'
  | 'downloading'
  | 'downloaded'
  | 'restarting'
  | 'error';

export type UpdateInfo = {
  status: UpdateStatus;
  errorMessage: string | null;
  /** True if update check has been performed this session */
  hasChecked: boolean;
};

/**
 * Checks whether we're in a context where expo-updates can actually run.
 * Returns false for:
 *  - __DEV__ mode (Metro bundler)
 *  - Expo Go (no native expo-updates module)
 *  - Web platform
 */
function canCheckForUpdates(): boolean {
  // Dev mode — expo-updates APIs throw in dev
  if (__DEV__) return false;

  // Web doesn't support OTA
  if (Platform.OS === 'web') return false;

  // Expo Go doesn't have the native expo-updates module
  const appOwnership = Constants.appOwnership;
  if (appOwnership === 'expo') return false;

  return true;
}

/**
 * useAppUpdates — Clean hook for OTA update lifecycle.
 *
 * Usage:
 *   const { status, errorMessage, checkForUpdate, downloadUpdate, restartApp } = useAppUpdates();
 *
 * Call `checkForUpdate()` once after app is ready.
 * If status becomes 'available', show the update modal.
 * User taps "Update Now" → call `downloadUpdate()`.
 * After status becomes 'downloaded' → call `restartApp()`.
 */
export function useAppUpdates() {
  const [status, setStatus] = useState<UpdateStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const hasCheckedRef = useRef(false);

  const checkForUpdate = useCallback(async () => {
    // Guard: only check once per session
    if (hasCheckedRef.current) return;

    // Guard: environment check
    if (!canCheckForUpdates()) {
      if (__DEV__) {
        console.log('[MySawari Updates] Skipping update check in development mode');
      }
      return;
    }

    hasCheckedRef.current = true;
    setStatus('checking');
    setErrorMessage(null);

    try {
      // Dynamic import so it doesn't crash in Expo Go
      const Updates = await import('expo-updates');

      const result = await Updates.checkForUpdateAsync();

      if (result.isAvailable) {
        setStatus('available');
      } else {
        setStatus('idle');
      }
    } catch (e: any) {
      // Don't crash the app — just log and continue
      if (__DEV__) {
        console.warn('[MySawari Updates] Check failed:', e.message);
      }
      setStatus('idle');
      // Don't show error to user for check failures — just silently continue
    }
  }, []);

  const downloadUpdate = useCallback(async () => {
    if (!canCheckForUpdates()) return;

    setStatus('downloading');
    setErrorMessage(null);

    try {
      const Updates = await import('expo-updates');
      await Updates.fetchUpdateAsync();
      setStatus('downloaded');
    } catch (e: any) {
      const msg = e.message || 'Download failed. Please try again later.';
      if (__DEV__) {
        console.warn('[MySawari Updates] Download failed:', msg);
      }
      setErrorMessage(msg);
      setStatus('error');
    }
  }, []);

  const restartApp = useCallback(async () => {
    if (!canCheckForUpdates()) return;

    setStatus('restarting');

    try {
      const Updates = await import('expo-updates');
      // Small delay so the user sees "Restarting..." text
      await new Promise(resolve => setTimeout(resolve, 800));
      await Updates.reloadAsync();
    } catch (e: any) {
      if (__DEV__) {
        console.warn('[MySawari Updates] Reload failed:', e.message);
      }
      // If reload fails, just go back to idle — app continues working
      setStatus('idle');
    }
  }, []);

  const dismissUpdate = useCallback(() => {
    setStatus('idle');
    setErrorMessage(null);
  }, []);

  return {
    status,
    errorMessage,
    hasChecked: hasCheckedRef.current,
    checkForUpdate,
    downloadUpdate,
    restartApp,
    dismissUpdate,
  };
}
