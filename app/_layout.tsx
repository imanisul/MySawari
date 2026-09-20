import React, { useEffect, useState } from 'react';
import { LogBox } from 'react-native';

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
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SawariProvider, useSawari } from '@/context/SawariContext';
import { useAppUpdates } from '@/hooks/useAppUpdates';
import { PostTripReviewPrompt } from '@/components/booking/PostTripReviewPrompt';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

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
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back', headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
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
      <Stack.Screen name="bookings" />
      <Stack.Screen name="booking-detail" />
      <Stack.Screen name="login" />
      <Stack.Screen name="profile" />
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
  // Start loading vehicles straight away (saved copy first, then the network) — before any screen asks.
  useEffect(() => {
    primeVehicles(queryClient);
  }, []);

  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <SawariProvider>
                <SplashHider fontsLoaded={fontsLoaded}>
                  <RootLayoutNav />
                  <FloatingSupport />
                  <OTAUpdateChecker />
                  <PostTripReviewPrompt />
                  <ThemedStatusBar />
                </SplashHider>
              </SawariProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

function SplashHider({ children, fontsLoaded }: { children: React.ReactNode, fontsLoaded: boolean }) {
  const { isAuthLoading } = useSawari();

  useEffect(() => {
    if (fontsLoaded && !isAuthLoading) {
      SplashScreen.hideAsync().catch(console.warn);
    }
  }, [fontsLoaded, isAuthLoading]);

  return <AnimatedSplash isReady={fontsLoaded && !isAuthLoading}>{children}</AnimatedSplash>;
}
