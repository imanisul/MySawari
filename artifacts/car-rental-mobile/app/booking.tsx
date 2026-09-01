import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

export default function BookingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectedCar, mode, pickup, dateRange, duration, durationDays, pickupTime, returnTime, customer, updateCustomer } = useSawari();
  
  const [errors, setErrors] = useState<{name?: string; mobile?: string; email?: string; license?: string}>({});

  const rental = selectedCar.perDay * (durationDays || 1);
  const additional = mode === 'With Driver' ? 2400 : 500;
  const payToday = rental + additional - 300;

  const validateAndProceed = () => {
    const newErrors: typeof errors = {};
    if (!customer.name.trim()) newErrors.name = 'Name is required';
    if (!customer.mobile.trim() || !/^\d{10}$/.test(customer.mobile)) newErrors.mobile = 'Enter a valid 10-digit mobile number';
    if (!customer.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) newErrors.email = 'Enter a valid email';
    if (!customer.license.trim()) newErrors.license = 'Driving licence is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      router.push('/payment');
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        bottomOffset={72}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={[styles.circle, { borderColor: colors.border }]}>
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Review booking</Text>
        </View>
        <View style={[styles.carSummary, { backgroundColor: colors.card }]}>
          <Image source={selectedCar.image} style={styles.carThumb} resizeMode="cover" />
          <View style={styles.carCopy}>
            <Text style={[styles.carName, { color: colors.foreground }]}>{selectedCar.name}</Text>
            <Text style={[styles.carMeta, { color: colors.mutedForeground }]}>{selectedCar.category} · {selectedCar.seats} · {selectedCar.transmission}</Text>
            <Text style={[styles.carMode, { color: colors.foreground }]}>{mode}</Text>
          </View>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trip details</Text>
        <View style={styles.tripDetails}>
          <DetailRow icon="map-pin" label="Pickup" value={pickup} />
          <DetailRow icon="calendar" label="Dates" value={`${dateRange} · ${duration}`} />
          <DetailRow icon="clock" label="Time" value={`${pickupTime} – ${returnTime}`} />
          <DetailRow icon={mode === 'Self Drive' ? 'aperture' : 'user'} label="Driving option" value={`${mode} · ${mode === 'Self Drive' ? 'No driver charges' : '₹800/day'}`} last />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Customer details</Text>
        <Input label="Full name" value={customer.name} error={errors.name} onChangeText={(value) => updateCustomer('name', value)} />
        <Input label="Mobile number" value={customer.mobile} placeholder="10-digit mobile number" keyboardType="phone-pad" error={errors.mobile} onChangeText={(value) => updateCustomer('mobile', value)} />
        <Input label="Email" value={customer.email} keyboardType="email-address" error={errors.email} onChangeText={(value) => updateCustomer('email', value)} />
        <Input label="Driving licence number" value={customer.license} placeholder="e.g. RJ0620230001234" error={errors.license} onChangeText={(value) => updateCustomer('license', value)} />
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Price summary</Text>
        <View style={styles.priceSummary}>
          <PriceRow label="Vehicle rental" value={`₹${rental.toLocaleString('en-IN')}`} />
          <PriceRow label="Additional charges" value={`₹${additional.toLocaleString('en-IN')}`} />
          <PriceRow label="Discount" value="- ₹300" accent />
          <PriceRow label="Security deposit (refundable)" value="₹2,000" />
          <View style={[styles.payRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.payLabel, { color: colors.foreground }]}>Pay today</Text>
            <Text style={[styles.payValue, { color: colors.foreground }]}>₹{payToday.toLocaleString('en-IN')}</Text>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          testID="continue-to-payment"
          onPress={validateAndProceed}
          style={({ pressed }) => [styles.paymentButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
        >
          <Text style={[styles.paymentButtonText, { color: colors.primaryForeground }]}>Continue to payment</Text>
          <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function DetailRow({ icon, label, value, last = false }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string; last?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.detailRow]}>
      <Feather name={icon} size={16} color={colors.mutedForeground} />
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function Input({ label, value, placeholder, keyboardType, error, onChangeText }: { label: string; value: string; placeholder?: string; keyboardType?: 'default' | 'phone-pad' | 'email-address'; error?: string; onChangeText: (value: string) => void }) {
  const colors = useColors();
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        style={[styles.input, { backgroundColor: colors.card, borderColor: error ? colors.destructive : colors.border, color: colors.foreground }]}
      />
      {error && <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>}
    </View>
  );
}

function PriceRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, { color: colors.foreground }]}>{label}</Text>
      <Text style={[styles.priceText, { color: accent ? colors.success : colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 40, paddingHorizontal: 24, paddingTop: 18 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  circle: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 20 },
  carSummary: { alignItems: 'center', borderRadius: 20, flexDirection: 'row', marginTop: 24, padding: 16 },
  carThumb: { borderRadius: 12, height: 70, width: 90 },
  carCopy: { marginLeft: 16, flex: 1 },
  carName: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  carMeta: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4 },
  carMode: { fontFamily: 'Inter_600SemiBold', fontSize: 12, marginTop: 6 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginTop: 32 },
  tripDetails: { marginTop: 12 },
  detailRow: { alignItems: 'center', minHeight: 46, flexDirection: 'row', gap: 12 },
  detailLabel: { fontFamily: 'Inter_400Regular', fontSize: 14, flex: 1 },
  detailValue: { fontFamily: 'Inter_500Medium', fontSize: 14, maxWidth: '65%', textAlign: 'right' },
  inputGroup: { marginTop: 16 },
  inputLabel: { fontFamily: 'Inter_500Medium', fontSize: 13, marginBottom: 8 },
  input: { borderRadius: 12, borderWidth: 1, fontFamily: 'Inter_400Regular', fontSize: 14, height: 52, paddingHorizontal: 16 },
  priceSummary: { marginTop: 16 },
  priceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 },
  priceLabel: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  priceText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  payRow: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 8, paddingTop: 20 },
  payLabel: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  payValue: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.5 },
  paymentButton: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', height: 56, justifyContent: 'center', marginTop: 24 },
  paymentButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginRight: 8 },
  pressed: { opacity: 0.7 },
  errorText: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 6 },
});