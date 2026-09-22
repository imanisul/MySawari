import React, { useCallback, useEffect, useRef, useState } from 'react';
import { LogBox, View } from 'react-native';

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
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary, FloatingSupport, UpdateModal, AnimatedSplash } from '@/components';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Feather, FontAwesome, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { SawariProvider, useSawari } from '@/context/SawariContext';
import { useAppUpdates } from '@/hooks/useAppUpdates';
import { useColors } from '@/hooks/useColors';
import { PostTripReviewPrompt } from '@/components/booking/PostTripReviewPrompt';

// The native splash is the only splash. It stays up until the first usable screen is ready (see AppGate).
SplashScreen.preventAutoHideAsync().catch(() => {});

// Set up how foreground notifications are handled
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

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
  return (
    // contentStyle: the screen behind a transition is the app background, never a blank white frame.
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
  );
}

/** Status-bar icons follow the app's own theme (not just the system's). */
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
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <SawariProvider>
                <AppGate fontError={!!fontError && !fontsLoaded} cacheReady={cacheReady}>
                  <RootLayoutNav />
                  <FloatingSupport />
                  <OTAUpdateChecker />
                  <PostTripReviewPrompt />
                  <ThemedStatusBar />
                </AppGate>
              </SawariProvider>
            </KeyboardProvider>
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
  }, [status]);

  if (status === 'booting') return null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }} onLayout={onLayout}>
      <AnimatedSplash isReady={status === 'ready' || status === 'error'}>
        {children}
      </AnimatedSplash>
    </View>
  );
}
