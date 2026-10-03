import Constants, { ExecutionEnvironment } from 'expo-constants';

let Notifications: any = null;

const mockNotifications = {
  addNotificationReceivedListener: () => ({ remove: () => {} }),
  addNotificationResponseReceivedListener: () => ({ remove: () => {} }),
  scheduleNotificationAsync: async () => 'mock-id',
  requestPermissionsAsync: async () => ({ status: 'granted' }),
  getPermissionsAsync: async () => ({ status: 'granted' }),
  getExpoPushTokenAsync: async () => ({ data: 'mock-token' }),
  setNotificationHandler: () => {},
};

const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

if (isExpoGo) {
  console.warn('expo-notifications is mocked because it is not available in Expo Go SDK 53');
  Notifications = mockNotifications;
} else {
  try {
    Notifications = require('expo-notifications');
  } catch (e) {
    console.warn('Failed to require expo-notifications, using mock');
    Notifications = mockNotifications;
  }
}

export default Notifications;
