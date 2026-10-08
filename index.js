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

  try {
    const messaging = require('@react-native-firebase/messaging').default;
    // Background / closed app. A push with a `notification` part is shown by Android itself; a data-only
    // push is not, so it is shown here (same as the operations app).
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      if (!Notifications || remoteMessage?.notification || !remoteMessage?.data) return;
      const { title, body } = remoteMessage.data;
      if (!title && !body) return;
      try {
        await Notifications.scheduleNotificationAsync({
          content: { title: String(title || 'MySawari'), body: String(body || ''), data: remoteMessage.data, sound: 'default' },
          trigger: null,
        });
      } catch (e) {
        console.warn('Background notification failed', e);
      }
    });
  } catch (e) {
    console.log('Firebase messaging not available for background handler');
  }
}

require('expo-router/entry');
