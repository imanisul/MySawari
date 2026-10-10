import * as Device from 'expo-device';
import { Platform } from 'react-native';

import * as SecureStore from '@/utils/secureStore';
import { BACKEND_URL, fetchWithAuth, timedFetch } from '@/services/backend/api';
import Constants from 'expo-constants';
import { getSessionId } from '@/services/api/activity';

// The token this install registered last, so logout can detach it from the account.
let lastExpoPushToken: string | null = null;

let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.log('expo-notifications not available (likely Expo Go on Android SDK 53+)');
}

// A failed registration (server waking up, weak signal) is retried, so the phone isn't left without pushes
// until the next launch.
const REGISTER_RETRY_DELAYS_MS = [5000, 20000, 60000];

// Bumped by every new registration request, so an older one still retrying (e.g. as a guest, from before a
// login) stops instead of overwriting the newer one.
let registrationGeneration = 0;
let registrationQueue: Promise<void> = Promise.resolve();
let tokenListener: { remove: () => void } | null = null;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Tells the backend which customer (or guest) this phone's Expo push token belongs to. Closed-app pushes are
 * delivered to this token only, so a failed registration means no pushes at all. Returns true once saved.
 */
async function sendRegistration(expoPushToken: string): Promise<boolean> {
  // The guest session id lives in AsyncStorage (services/api/activity.ts), not SecureStore.
  const guestSessionId = await getSessionId().catch(() => null);
  const body = JSON.stringify({ expoPushToken, deviceType: Platform.OS, guestSessionId: guestSessionId || undefined });
  const headers = { 'Content-Type': 'application/json' };

  if (await SecureStore.getItemAsync('auth_token')) {
    // fetchWithAuth renews the access token first. It lasts only 15 minutes, and a plain fetch with the saved
    // (usually expired) one was rejected on almost every launch, so the phone was never linked to the
    // customer and booking pushes had nowhere to go. A session that has really ended throws; the retry
    // after that registers the phone as a guest.
    const res = await fetchWithAuth(`${BACKEND_URL}/notifications/register-device`, { method: 'POST', headers, body });
    return res.ok;
  }

  const res = await timedFetch(`${BACKEND_URL}/notifications/register-anonymous-device`, { method: 'POST', headers, body });
  return res.ok;
}

async function registerOnce(generation: number) {
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true
      }),
    });
  } catch (error) {
    console.log('Push notifications handler setup failed:', error);
  }
  if (!Device.isDevice) {
    console.log('Must use a physical device for Push Notifications');
    return;
  }

  // 1. Android channel first (Android 8+). On Android 13+ the permission prompt is not shown at all until
  // the app has a channel, so creating it after asking left new installs without notifications.
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });
  }

  // 2. Request Permission
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('User denied push notification permissions!');
    return;
  }

  // 3. Get the unique Expo Push Token
  const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  const expoPushToken: string = tokenData.data;
  lastExpoPushToken = expoPushToken;

  // Firebase can replace the phone's token at any time (app data cleared, restore, token refresh). The new
  // one must be registered too, or pushes stop until the next launch.
  if (!tokenListener && typeof Notifications.addPushTokenListener === 'function') {
    let lastDeviceToken: string | null = null;
    tokenListener = Notifications.addPushTokenListener(({ data }: { data: string }) => {
      if (!data || data === lastDeviceToken) return; // only a real change, never the same token twice
      lastDeviceToken = data;
      registerDeviceForPushNotifications();
    });
  }

  // 4. Send it to the Customer Backend, retrying a failed attempt.
  for (let attempt = 0; ; attempt++) {
    if (generation !== registrationGeneration) return; // a newer registration (e.g. after login) took over
    try {
      if (await sendRegistration(expoPushToken)) {
        console.log('Device successfully registered for push notifications!');
        return;
      }
    } catch (error) {
      console.log('Push registration attempt failed:', error);
    }
    if (attempt >= REGISTER_RETRY_DELAYS_MS.length) {
      console.log('Push registration failed after retries; will try again on the next launch or login.');
      return;
    }
    await sleep(REGISTER_RETRY_DELAYS_MS[attempt]);
  }
}

/**
 * Links this phone's push token to the signed-in customer (or to the guest session). Called at launch and
 * whenever the login state changes. Never throws.
 */
export function registerDeviceForPushNotifications(): Promise<void> {
  if (!Notifications) {
    console.log('Push notifications are not supported in this environment.');
    return Promise.resolve();
  }
  const generation = ++registrationGeneration;
  // One registration at a time, in order: the newest always runs last, with the current login state.
  registrationQueue = registrationQueue
    .then(() => registerOnce(generation))
    .catch((error) => console.log('Failed to register device token or push notifications unsupported:', error));
  return registrationQueue;
}

/**
 * Detaches this phone from the account on logout, so the next person using it never receives the previous
 * customer's booking pushes. Must run while the auth token still exists. Best effort, never throws.
 */
export async function unregisterDeviceForPushNotifications(authToken: string | null) {
  if (!authToken || !lastExpoPushToken) return;
  try {
    await Promise.race([
      // fetchWithAuth: the saved access token is often expired by the time someone logs out.
      fetchWithAuth(`${BACKEND_URL}/notifications/unregister-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expoPushToken: lastExpoPushToken }),
      }),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch (error) {
    console.log('Failed to unregister push device:', error);
  }
}
