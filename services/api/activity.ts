import { fetchWithAuth, BACKEND_URL } from '../backend/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

let guestSessionId: string | null = null;

const getSessionId = async () => {
  if (guestSessionId) return guestSessionId;
  guestSessionId = await AsyncStorage.getItem('guest_session_id');
  if (!guestSessionId) {
    guestSessionId = 'session_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    await AsyncStorage.setItem('guest_session_id', guestSessionId);
  }
  return guestSessionId;
};

export const ActivityAPI = {
  logActivity: async (action: string, screen?: string, details?: any) => {
    try {
      const sessionId = await getSessionId();
      await fetchWithAuth(`${BACKEND_URL}/activity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, screen, details, sessionId }),
      });
    } catch (error) {
      // Ignore errors so tracking doesn't break the app
      console.log('Activity logging failed:', error);
    }
  }
};
