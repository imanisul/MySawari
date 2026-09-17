import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { SawariProvider, useSawari } from '@/context/SawariContext';
import { useAppUpdates } from '@/hooks/useAppUpdates';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

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
