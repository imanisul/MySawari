import { fetchWithAuth, BACKEND_URL } from '../backend/api';

export interface BackendNotification {
  id: string;
  target: 'all' | 'specific';
  title: string;
  body: string;
  data: any;
  isRead: boolean;
  createdAt: string;
}

export const NotificationsAPI = {
  getNotifications: async (): Promise<BackendNotification[]> => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/notifications`);
      const data = await res.json();
      if (res.ok && data.success) {
        return data.data.map((n: any) => ({
          id: n.id || n._id,
          target: n.target,
          title: n.title,
          body: n.body,
          data: n.data,
          isRead: n.isRead,
          createdAt: n.createdAt
        }));
      }
      return [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  markAsRead: async (id: string): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/notifications/${id}/read`, {
        method: 'PUT'
      });
      const data = await res.json();
      return !!data.success;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  },

  registerDevice: async (expoPushToken: string, deviceType: string): Promise<boolean> => {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/notifications/register-device`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expoPushToken, deviceType })
      });
      const data = await res.json();
      return !!data.success;
    } catch (error) {
      console.error('Error registering device token:', error);
      return false;
    }
  }
};
