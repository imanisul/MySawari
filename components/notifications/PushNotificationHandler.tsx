import { useEffect, useRef } from 'react';
import { router, useRootNavigationState } from 'expo-router';
import Notifications from '@/utils/notifications';
import { useSawari } from '@/context/SawariContext';

type PushData = Record<string, unknown> | null | undefined;

const asString = (v: unknown) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

/**
 * Makes pushes behave as expected:
 *  - a push that arrives while the app is open is shown as a banner (the handler set in pushNotification.ts);
 *  - tapping a push (app open, in the background, or closed) opens the booking it is about, or the
 *    notifications list, and marks it read.
 * Must be rendered inside the navigation tree.
 */
export function PushNotificationHandler() {
  const navReady = !!useRootNavigationState()?.key;
  const { isAuthenticated, syncNotifications, markNotificationRead, selectCar } = useSawari();

  // Listeners are registered once, so they read the latest values from here.
  const latest = useRef({ isAuthenticated, syncNotifications, markNotificationRead, navReady, selectCar });
  latest.current = { isAuthenticated, syncNotifications, markNotificationRead, navReady, selectCar };

  const pending = useRef<PushData>(null);
  // A tap can be reported both live and as the "last response" at launch — act on it once.
  const handled = useRef(new Set<string>());

  const navigateFor = (data: PushData) => {
    const { isAuthenticated: authed, syncNotifications: sync, markNotificationRead: markRead, selectCar } = latest.current;
    const notificationId = asString(data?.notificationId);
    const bookingId = asString(data?.bookingId);
    const carId = asString(data?.carId);
    const link = asString(data?.link);

    if (notificationId) markRead(notificationId).catch(() => {});
    sync().catch(() => {});

    if (bookingId && authed) {
      router.push({ pathname: '/booking-detail', params: { id: bookingId } });
    } else if (carId) {
      import('@/services/backend/api').then(({ API }) => {
        API.getVehiclesWithAvailability().then((cars: any[]) => {
          const car = cars.find(c => String(c.id) === carId);
          if (car) {
            selectCar(car);
            router.push('/car-details');
          } else {
            router.push('/explore');
          }
        }).catch(() => router.push('/explore'));
      });
    } else if (link && link.startsWith('/') && !link.startsWith('//')) {
      // Only in-app routes; a push must never be able to send the app to an outside address.
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

    if (fallbackKey) {
      Notifications.dismissNotificationAsync?.(fallbackKey).catch(() => {});
    } else if (key) {
      Notifications.dismissNotificationAsync?.(key).catch(() => {});
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

    // Taps on notifications (system tray, or the banner shown while the app is open).
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

    return () => unsubscribers.forEach((off) => off());
  }, []);

  return null;
}
