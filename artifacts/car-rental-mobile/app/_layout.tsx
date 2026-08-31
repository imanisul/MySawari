import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SawariProvider } from '@/context/SawariContext';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: 'Back', headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="explore" />
      <Stack.Screen name="search" />
      <Stack.Screen name="car-details" />
      <Stack.Screen name="booking" />
      <Stack.Screen name="planner" options={{ presentation: 'modal' }} />
      <Stack.Screen name="location" options={{ presentation: 'modal' }} />
      <Stack.Screen name="dates" options={{ presentation: 'modal' }} />
      <Stack.Screen name="times" options={{ presentation: 'modal' }} />
      <Stack.Screen name="driver-option" options={{ presentation: 'modal' }} />
      <Stack.Screen name="driver-charges" options={{ presentation: 'modal' }} />
      <Stack.Screen name="payment" />
      <Stack.Screen name="payment-processing" />
      <Stack.Screen name="payment-error" options={{ presentation: 'modal' }} />
      <Stack.Screen name="confirmation" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="booking-detail" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView>
            <KeyboardProvider>
              <SawariProvider>
                <RootLayoutNav />
              </SawariProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
