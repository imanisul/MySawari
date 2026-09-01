import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export default function PaymentProcessingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { paymentAttempts, confirmBooking } = useSawari();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (paymentAttempts > 1) {
        confirmBooking();
        router.replace('/confirmation');
      } else {
        router.replace('/payment-error');
      }
    }, 1100);
    return () => clearTimeout(timer);
  }, [confirmBooking, paymentAttempts, router]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.lockCircle, { borderColor: colors.navy }]}>
        <Feather name="lock" size={25} color={colors.foreground} />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>Confirming your payment</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>This usually takes a few seconds.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  lockCircle: { alignItems: 'center', borderRadius: 99, borderWidth: 4, height: 86, justifyContent: 'center', width: 86 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 20, marginTop: 32 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, marginTop: 8 },
});