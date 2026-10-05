import { useEffect, useRef } from 'react';
import { router, useRootNavigationState } from 'expo-router';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import Notifications from '@/utils/notifications';
import { useSawari } from '@/context/SawariContext';

let messaging: any = null;
if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  try {
    messaging = require('@react-native-firebase/messaging').default;
  } catch (e) {
    console.warn('Firebase messaging not available');
  }
}

type PushData = Record<string, unknown> | null | undefined;

const asString = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

/**
 * Makes pushes behave as expected:
 *  - a push that arrives while the app is open is shown as a banner (FCM doesn't show those on its own);
 *  - tapping a push (app open, in the background, or closed) opens the booking it is about, or the
 *    notifications list, and marks it read.
 * Must be rendered inside the navigation tree.
 */
export function PushNotificationHandler() {
  const navReady = !!useRootNavigationState()?.key;
  const { isAuthenticated, syncNotifications, markNotificationRead } = useSawari();

  // Listeners are registered once, so they read the latest values from here.
  const latest = useRef({ isAuthenticated, syncNotifications, markNotificationRead, navReady });
  latest.current = { isAuthenticated, syncNotifications, markNotificationRead, navReady };

  const pending = useRef<PushData>(null);
  // One tap can be reported by both expo-notifications and Firebase — act on it once.
  const handled = useRef(new Set<string>());

  const navigateFor = (data: PushData) => {
    const { isAuthenticated: authed, syncNotifications: sync, markNotificationRead: markRead } = latest.current;
    const notificationId = asString(data?.notificationId);
    const bookingId = asString(data?.bookingId);

    const link = asString(data?.link);

    if (notificationId) markRead(notificationId).catch(() => {});
    sync().catch(() => {});

    if (bookingId && authed) {
      router.push({ pathname: '/booking-detail', params: { id: bookingId } });
    } else if (link) {
      router.push(link as any);
    } else {
      router.push('/notifications');
    }
  };

  const openFromPush = (data: PushData, fallbackKey?: string) => {
    const key = asString(data?.notificationId) || fallbackKey;
    if (key) {
      if (handled.current.has(key)) return;
      handled.current.add(key);
    }
    if (!latest.current.navReady) {
      pending.current = data || {}; // cold start: navigate once the app's screens exist
      return;
    }
    navigateFor(data);
  };

  // A tap that launched the app is handled as soon as navigation is ready.
  useEffect(() => {
    if (!navReady || !pending.current) return;
    const data = pending.current;
    pending.current = null;
    navigateFor(data);
  }, [navReady]);

  useEffect(() => {
    const unsubscribers: (() => void)[] = [];

    // Taps on notifications shown by expo-notifications (including the foreground banners below).
    const responseSub = Notifications.addNotificationResponseReceivedListener((response: any) => {
      const request = response?.notification?.request;
      openFromPush(request?.content?.data, request?.identifier);
    });
    unsubscribers.push(() => responseSub.remove());

    if (typeof Notifications.getLastNotificationResponseAsync === 'function') {
      Notifications.getLastNotificationResponseAsync()
        .then((response: any) => {
          if (!response) return;
          const request = response.notification?.request;
          openFromPush(request?.content?.data, request?.identifier);
          // Otherwise the same tap is reported again on every later launch.
          Notifications.clearLastNotificationResponseAsync?.().catch(() => {});
        })
        .catch(() => {});
    }

    if (messaging) {
      try {
        const m = messaging();

        // Foreground FCM message: show it as a banner (the received-listener in SawariContext adds it to the
        // list) and refresh the list from the server.
        unsubscribers.push(
          m.onMessage(async (message: any) => {
            const title = message?.notification?.title || asString(message?.data?.title);
            const body = message?.notification?.body || asString(message?.data?.body);
            if (title || body) {
              await Notifications.scheduleNotificationAsync({
                content: { title: title || 'MySawari', body: body || '', data: message?.data || {}, sound: 'default' },
                trigger: null,
              }).catch((e: any) => console.warn('Could not show foreground notification', e));
            }
            latest.current.syncNotifications().catch(() => {});
          })
        );

        // Tap on a system-tray push while the app was in the background.
        unsubscribers.push(m.onNotificationOpenedApp((message: any) => openFromPush(message?.data, message?.messageId)));

        // Tap on a push that started the app from a closed state.
        m.getInitialNotification()
          .then((message: any) => message && openFromPush(message.data, message.messageId))
          .catch(() => {});
      } catch (e) {
        console.warn('Firebase messaging listeners failed', e);
      }
    }

    return () => unsubscribers.forEach((off) => off());
  }, []);

  return null;
}
