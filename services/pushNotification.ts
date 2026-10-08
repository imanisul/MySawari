import * as Device from 'expo-device';
import { Platform } from 'react-native';

import * as SecureStore from '@/utils/secureStore';
import { BACKEND_URL } from '@/services/backend/api';
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

export async function registerDeviceForPushNotifications(authToken?: string) {
  if (!Notifications) {
    console.log('Push notifications are not supported in this environment.');
    return;
  }

  if (!authToken) {
    authToken = await SecureStore.getItemAsync('auth_token') || '';
  }
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

  try {
    // 3. Get the unique Expo Push Token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoPushToken = tokenData.data;
    lastExpoPushToken = expoPushToken;

    // 4. Send it to your Customer Backend!
    const endpoint = authToken ? '/notifications/register-device' : '/notifications/register-anonymous-device';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    // The guest session id lives in AsyncStorage (services/api/activity.ts), not SecureStore — reading it from
    // SecureStore always returned null, so guest-targeted pushes never found this device.
    const guestSessionId = await getSessionId().catch(() => null);

    await fetch(`${BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        expoPushToken: expoPushToken,
        deviceType: Platform.OS,
        guestSessionId: guestSessionId || undefined
      })
    });

    console.log("Device successfully registered for push notifications!");

  } catch (error) {
    console.log("Failed to register device token or push notifications unsupported:", error);
  }
}

/**
 * Detaches this phone from the account on logout, so the next person using it never receives the previous
 * customer's booking pushes. Must run while the auth token still exists. Best effort, never throws.
 */
export async function unregisterDeviceForPushNotifications(authToken: string | null) {
  if (!authToken || !lastExpoPushToken) return;
  try {
    await Promise.race([
      fetch(`${BACKEND_URL}/notifications/unregister-device`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ expoPushToken: lastExpoPushToken }),
      }),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch (error) {
    console.log('Failed to unregister push device:', error);
  }
}
