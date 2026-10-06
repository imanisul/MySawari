import * as Device from 'expo-device';
import { Platform } from 'react-native';

import * as SecureStore from '@/utils/secureStore';
import { BACKEND_URL } from '@/services/backend/api';
import Constants from 'expo-constants';

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

  // 1. Request Permission
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

  // 2. Setup Android Channel (Required for Android 8.0+)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  try {
    // 3. Get the unique Expo Push Token
    const projectId = Constants.expoConfig?.extra?.eas?.projectId || Constants.easConfig?.projectId;
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const expoPushToken = tokenData.data;

    // 4. Send it to your Customer Backend!
    const endpoint = authToken ? '/notifications/register-device' : '/notifications/register-anonymous-device';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const guestSessionId = await SecureStore.getItemAsync('guest_session_id');

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
