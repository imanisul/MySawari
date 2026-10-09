// App entry. Push handling that must work while the app is closed is set up here, before the router loads:
// when a push arrives for a killed app, Android starts this bundle headless (no screens), so anything that
// lives in app/_layout.tsx would never run.
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  let Notifications = null;
  try {
    Notifications = require('expo-notifications');
    // The channel every push is posted to (the backend's Expo pushes name it). It must exist before the
    // permission prompt: Android 13+ does not show the prompt until the app has a notification channel.
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        sound: 'default',
      }).catch(() => {});
    }
  } catch (e) {
    Notifications = null;
  }

  // Removed @react-native-firebase/messaging conflict.
  // expo-notifications will handle background pushes natively.

require('expo-router/entry');
