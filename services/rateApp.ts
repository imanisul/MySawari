import { Platform, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ANDROID_PACKAGE = 'com.mysawari.customer';
// Numeric App Store id (ascAppId in eas.json); the bundle id does not work in App Store URLs.
const IOS_APP_ID = '6829408836';

const STORAGE_KEY_PREFIX = '@mysawari_membership_rating_prompt_';

/**
 * Checks whether the rating prompt has already been shown to this customer.
 */
export async function hasPromptedMembershipRating(customerId?: string): Promise<boolean> {
  if (!customerId) return false;
  try {
    const val = await AsyncStorage.getItem(`${STORAGE_KEY_PREFIX}${customerId}`);
    return val === 'rated' || val === 'dismissed';
  } catch {
    return false;
  }
}

/**
 * Records that the customer either rated or dismissed the rating prompt so they aren't nagged again.
 */
export async function recordMembershipRatingAction(
  customerId: string | undefined,
  action: 'rated' | 'dismissed'
): Promise<void> {
  if (!customerId) return;
  try {
    await AsyncStorage.setItem(`${STORAGE_KEY_PREFIX}${customerId}`, action);
  } catch (err) {
    console.warn('[RateApp] Failed to save rating prompt state:', err);
  }
}

/**
 * Evaluates whether we should show the membership rating prompt for this customer.
 */
export async function shouldPromptMembershipRating(customerId?: string): Promise<boolean> {
  if (!customerId) return false;
  const alreadyPrompted = await hasPromptedMembershipRating(customerId);
  return !alreadyPrompted;
}

/**
 * Launches the native in-app review dialog (via expo-store-review if available),
 * and falls back gracefully to platform app store URLs (Google Play Store on Android, App Store on iOS).
 */
export async function requestStoreReview(): Promise<void> {
  // 1. Try native expo-store-review if linked
  try {
    // Dynamic require prevents build-time crash if native module is absent
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const StoreReview = require('expo-store-review');
    if (StoreReview && typeof StoreReview.isAvailableAsync === 'function') {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable && typeof StoreReview.requestReview === 'function') {
        await StoreReview.requestReview();
        return;
      }
    }
  } catch {
    // Continue to store URL fallbacks
  }

  // 2. Platform-specific store deep-links with web fallback
  if (Platform.OS === 'android') {
    const marketUrl = `market://details?id=${ANDROID_PACKAGE}`;
    const webUrl = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
    try {
      const canOpen = await Linking.canOpenURL(marketUrl);
      if (canOpen) {
        await Linking.openURL(marketUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Linking.openURL(webUrl).catch(() => {});
    }
  } else if (Platform.OS === 'ios') {
    const storeReviewUrl = `itms-apps://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`;
    const webUrl = `https://apps.apple.com/app/${IOS_APP_ID}`;
    try {
      const canOpen = await Linking.canOpenURL(storeReviewUrl);
      if (canOpen) {
        await Linking.openURL(storeReviewUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } catch {
      await Linking.openURL(webUrl).catch(() => {});
    }
  }
}


/** "Rate us": opens this app's page straight in Google Play (Android) or the App Store review screen (iPhone). */
export async function openStorePage(): Promise<void> {
  const [store, web] = Platform.OS === 'ios'
    ? [`itms-apps://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`, `https://apps.apple.com/app/id${IOS_APP_ID}?action=write-review`]
    : [`market://details?id=${ANDROID_PACKAGE}`, `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`];
  await Linking.openURL(store).catch(() => Linking.openURL(web)).catch(() => {});
}
