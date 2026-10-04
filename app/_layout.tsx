import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LogBox, View, Platform } from 'react-native';

LogBox.ignoreLogs([
  'ProgressBarAndroid has been extracted from react-native core',
  'SafeAreaView has been deprecated',
  'Clipboard has been extracted from react-native core',
  'PushNotificationIOS has been extracted from react-native core'
]);

import { QueryClient, QueryClientProvider, focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';
import { primeVehicles } from '@/hooks/useVehicles';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { ErrorBoundary, FloatingSupport, UpdateModal, AnimatedSplash, CustomAlertProvider } from '@/components';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Feather, FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Stack, DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import Notifications from '@/utils/notifications';
import { SawariProvider, useSawari } from '@/context/SawariContext';
import { useAppUpdates } from '@/hooks/useAppUpdates';
import { useColors } from '@/hooks/useColors';
import { PostTripReviewPrompt } from '@/components/booking/PostTripReviewPrompt';
import { PushNotificationHandler } from '@/components/notifications/PushNotificationHandler';
import * as Location from 'expo-location';
import { API } from '@/services/backend/api';

// The native splash is the only splash. It stays up until the first usable screen is ready (see AppGate).
SplashScreen.preventAutoHideAsync().catch(() => {});

// Set up how foreground notifications are handled
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Register background handler for Firebase Cloud Messaging when the app is killed
import Constants, { ExecutionEnvironment } from 'expo-constants';
if (Constants.executionEnvironment !== ExecutionEnvironment.StoreClient) {
  try {
    const messaging = require('@react-native-firebase/messaging').default;
    messaging().setBackgroundMessageHandler(async (remoteMessage: any) => {
      console.log('Message handled in the background!', remoteMessage);
    });
  } catch (error) {
    console.log('Firebase messaging not available for background handler');
  }
}

/** booting: splash stays up, nothing renders · ready: app is shown · error: fonts failed, app still opens on system fonts. */
type AppStatus = 'booting' | 'ready' | 'error';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30 * 1000,
      gcTime: 10 * 60 * 1000, // keep screens' data for 10 min so going back is instant
      retry: 2,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 8000),
      refetchOnReconnect: true,
    },
  },
});

// Tell React Query when the app is in the foreground: it re-checks stale data when you come back
// and pauses background polling while the app is not in use.
focusManager.setEventListener((handleFocus) => {
  const sub = AppState.addEventListener('change', (state) => handleFocus(state === 'active'));
  return () => sub.remove();
});

function RootLayoutNav() {
  const colors = useColors();
  const { isDarkMode } = useSawari();

  // React Navigation's own NavigationContainer (which expo-router's <Stack> wraps) is never told about
  // our palette otherwise, so it silently falls back to its built-in DefaultTheme — whose `card` colour
  // (the native screen surface every Stack.Screen paints behind React's content) is plain white,
  // regardless of the app's own dark/light state. That native-level white is what was still showing
  // through on screen mount/transition even after contentStyle was set below: contentStyle only styles
  // the JS content view, not the underlying native screen surface. Reusing our own colours here for
  // `background`/`card` is what actually removes it.
  const navTheme = React.useMemo(() => {
    const base = isDarkMode ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDarkMode,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.background,
        text: colors.foreground,
        border: colors.border,
        notification: colors.destructive,
      },
    };
  }, [isDarkMode, colors]);

  return (
    <ThemeProvider value={navTheme}>
    {/* contentStyle: the screen behind a transition is the app background, never a blank white frame. */}
    <Stack screenOptions={{ headerBackTitle: 'Back', headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      {/* Bottom-tab screens swap instantly (no cross-fade), so no half-faded ghost of the old screen shows. */}
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="explore" options={{ animation: 'none' }} />
      <Stack.Screen name="wishlist" />
      <Stack.Screen name="search" />
      <Stack.Screen name="car-details" />
      <Stack.Screen name="booking" />
      <Stack.Screen name="planner" options={{ presentation: 'modal' }} />
      <Stack.Screen name="location" options={{ presentation: 'modal' }} />
      <Stack.Screen name="dates" options={{ presentation: 'modal' }} />
      <Stack.Screen name="times" options={{ presentation: 'modal' }} />
      <Stack.Screen name="dropoff" options={{ presentation: 'modal' }} />
      <Stack.Screen name="return-location" options={{ presentation: 'modal' }} />
      <Stack.Screen name="driver-option" options={{ presentation: 'modal' }} />
      <Stack.Screen name="driver-charges" options={{ presentation: 'modal' }} />
      <Stack.Screen name="payment" />
      <Stack.Screen name="payment-processing" />
      <Stack.Screen name="payment-error" options={{ presentation: 'modal' }} />
      <Stack.Screen name="confirmation" />
      <Stack.Screen name="bookings" options={{ animation: 'none' }} />
      <Stack.Screen name="booking-detail" />
      <Stack.Screen name="login" />
      <Stack.Screen name="profile" options={{ animation: 'none' }} />
      <Stack.Screen name="edit-profile" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="payments" />
      <Stack.Screen name="refer" />
      <Stack.Screen name="rewards" />
      <Stack.Screen name="help" />
      <Stack.Screen name="safety" />
    </Stack>
    </ThemeProvider>
  );
}

function ThemedStatusBar() {
  const { isDarkMode } = useSawari();
  return <StatusBar style={isDarkMode ? 'light' : 'dark'} />;
}

/**
 * OTA Update Checker — runs after splash completes.
 * Renders UpdateModal when an update is available.
 */
function OTAUpdateChecker() {
  const {
    status,
    errorMessage,
    checkForUpdate,
    downloadUpdate,
    restartApp,
    dismissUpdate,
  } = useAppUpdates();

  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);

  // Check for updates once after the component mounts (splash is done)
  useEffect(() => {
    if (!hasCheckedOnce) {
      setHasCheckedOnce(true);
      // Small delay so the app has time to fully render before checking
      const timer = setTimeout(() => {
        checkForUpdate();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [hasCheckedOnce, checkForUpdate]);

  // Auto-restart after successful download
  useEffect(() => {
    if (status === 'downloaded') {
      restartApp();
    }
  }, [status, restartApp]);

  const showModal = status === 'available' || status === 'downloading' || status === 'downloaded' || status === 'restarting' || status === 'error';

  return (
    <UpdateModal
      visible={showModal}
      status={status}
      errorMessage={errorMessage}
      onUpdateNow={downloadUpdate}
      onLater={dismissUpdate}
      onRetry={downloadUpdate}
    />
  );
}

export default function RootLayout() {
  // Restore the saved vehicles before the splash lifts, so Home/Explore open with content instead of
  // a flash of placeholders. The network refresh starts in the background and is not waited for.
  const [cacheReady, setCacheReady] = useState(false);
  useEffect(() => {
    primeVehicles(queryClient).finally(() => setCacheReady(true));
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    // Icon fonts load with the splash still up, so no screen ever shows empty circles where icons belong.
    ...Feather.font,
    ...Ionicons.font,
    ...FontAwesome.font,
    ...FontAwesome5.font,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SawariProvider>
              <AppGate fontError={!!fontError && !fontsLoaded} cacheReady={cacheReady}>
                <RootLayoutNav />
                <FloatingSupport />
                <OTAUpdateChecker />
                <PostTripReviewPrompt />
                <LocationTracker />
                <PushNotificationHandler />
                <ThemedStatusBar />
              </AppGate>
            </SawariProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

/**
 * The single readiness gate. Nothing is rendered while booting (fonts, saved session and settings,
 * saved vehicles), and the native splash is hidden exactly once, after the first ready frame is laid out.
 */
function AppGate({
  children,
  fontError,
  cacheReady,
}: {
  children: React.ReactNode;
  fontError: boolean;
  cacheReady: boolean;
}) {
  const { isAuthLoading } = useSawari();
  const colors = useColors();
  const splashHidden = useRef(false);

  const status: AppStatus = isAuthLoading || !cacheReady ? 'booting' : fontError ? 'error' : 'ready';

  const onLayout = useCallback(() => {
    // AnimatedSplash handles its own visual lifecycle, so we only need to hide the native splash
    // exactly once, when the app gate (the headless logic root) becomes ready.
    if (status === 'booting' || splashHidden.current) return;
    splashHidden.current = true;
    SplashScreen.hideAsync().catch(() => {});
    import('expo-system-ui').then(SystemUI => {
      SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
    });

  }, [status, colors.background]);

  if (status === 'booting') return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayout}>
      <AnimatedSplash isReady={status === 'ready' || status === 'error'}>
        {children}
      </AnimatedSplash>
      <CustomAlertProvider />
    </View>
  );
}

function LocationTracker() {
  const { isAuthenticated } = useSawari();

  useEffect(() => {
    if (!isAuthenticated) return;
    
    let isMounted = true;
    
    const sendLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return;
        
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        if (isMounted) {
          await API.updateLocation(location.coords.latitude, location.coords.longitude);
        }
      } catch (e) {
        console.warn('Location Tracker Error:', e);
      }
    };

    sendLocation();
    
    // Update every 5 minutes while app is in foreground
    const interval = setInterval(sendLocation, 5 * 60 * 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated]);
  
  return null;
}
