import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export default function PaymentScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectedCar, dateRange, mode, paymentMethod, setPaymentMethod, payBooking } = useSawari();
  const total = selectedCar.perDay * 3 + (mode === 'With Driver' ? 2400 : 500) - 300;
  const methods = [
    { name: 'UPI' as const, description: 'Pay by any UPI app', icon: 'credit-card' as const },
    { name: 'Card' as const, description: 'Credit or debit card', icon: 'credit-card' as const },
    { name: 'Net banking' as const, description: 'All major banks', icon: 'credit-card' as const },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={[styles.circle, { borderColor: colors.border }]}>
            <Feather name="arrow-left" size={17} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Payment</Text>
        </View>
        <View style={[styles.totalCard, { backgroundColor: colors.navy }]}>
          <Text style={[styles.totalLabel, { color: colors.mutedForeground }]}>Pay today</Text>
          <Text style={[styles.total, { color: colors.warmWhite }]}>₹{total.toLocaleString('en-IN')}</Text>
          <Text style={[styles.tripCopy, { color: colors.mutedForeground }]}>{selectedCar.name} · {dateRange} · {mode}</Text>
        </View>
        <Text style={[styles.methodTitle, { color: colors.foreground }]}>Payment method</Text>
        {methods.map((method) => {
          const selected = paymentMethod === method.name;
          return (
            <Pressable
              key={method.name}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => setPaymentMethod(method.name)}
              style={[styles.methodCard, { backgroundColor: selected ? colors.tintLight : colors.surfaceSoft, borderColor: selected ? colors.navy : colors.border }]}
            >
              <Feather name={method.icon} size={19} color={colors.foreground} />
              <View style={styles.methodCopy}>
                <Text style={[styles.methodName, { color: colors.foreground }]}>{method.name}</Text>
                <Text style={[styles.methodDescription, { color: colors.mutedForeground }]}>{method.description}</Text>
              </View>
              <View style={[styles.radio, { backgroundColor: selected ? 'transparent' : 'transparent', borderColor: selected ? colors.navy : colors.border }]}>
                {selected && <Feather name="check" size={13} color={colors.navy} />}
              </View>
            </Pressable>
          );
        })}
        <View style={styles.secureRow}>
          <Feather name="check" size={14} color={colors.success} />
          <Text style={[styles.secureText, { color: colors.mutedForeground }]}>Secure payment · Deposit refunded after return</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        testID="pay-booking"
        onPress={() => {
          payBooking();
          router.push('/payment-processing');
        }}
        style={({ pressed }) => [styles.payButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
      >
        <Text style={[styles.payButtonText, { color: colors.primaryForeground }]}>Pay {total.toLocaleString('en-IN')}</Text>
        <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 39, paddingTop: 18 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 13 },
  circle: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  totalCard: { borderRadius: 25, marginTop: 28, padding: 19 },
  totalLabel: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  total: { fontFamily: 'Inter_600SemiBold', fontSize: 31, marginTop: 3 },
  tripCopy: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 8 },
  methodTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginTop: 29 },
  methodCard: { alignItems: 'center', borderRadius: 16, borderWidth: 1, flexDirection: 'row', marginTop: 12, minHeight: 76, paddingHorizontal: 20 },
  methodCopy: { flex: 1, marginLeft: 19 },
  methodName: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  methodDescription: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  radio: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 24, justifyContent: 'center', width: 24 },
  secureRow: { alignItems: 'center', flexDirection: 'row', gap: 10, marginTop: 19 },
  secureText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  payButton: { alignItems: 'center', borderRadius: 16, bottom: 22, flexDirection: 'row', height: 54, justifyContent: 'center', left: 39, position: 'absolute', right: 39 },
  payButtonText: { fontFamily: 'Inter_500Medium', fontSize: 15, marginRight: 10 },
  pressed: { opacity: 0.7 },
});