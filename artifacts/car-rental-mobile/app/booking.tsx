import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { KeyboardAwareScrollViewCompat } from '@/components/KeyboardAwareScrollViewCompat';

export default function BookingScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectedCar, mode, pickup, dateRange, duration, pickupTime, returnTime, customer, updateCustomer } = useSawari();
  const rental = selectedCar.perDay * 3;
  const additional = mode === 'With Driver' ? 2400 : 500;
  const payToday = rental + additional - 300;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        bottomOffset={72}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.content}
      >
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={[styles.circle, { borderColor: colors.border }]}>
            <Feather name="arrow-left" size={17} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Review booking</Text>
        </View>
        <View style={[styles.carSummary, { backgroundColor: colors.card }]}>
          <View style={[styles.carThumb, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.carThumbText, { color: colors.foreground }]}>{selectedCar.name.split(' ')[1]?.slice(0, 2) ?? 'CA'}</Text>
          </View>
          <View style={styles.carCopy}>
            <Text style={[styles.carName, { color: colors.foreground }]}>{selectedCar.name}</Text>
            <Text style={[styles.carMeta, { color: colors.mutedForeground }]}>{selectedCar.seats} · {selectedCar.transmission}</Text>
            <Text style={[styles.carMode, { color: colors.foreground }]}>{mode}</Text>
          </View>
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Trip details</Text>
        <View style={styles.tripDetails}>
          <DetailRow icon="map-pin" label="Pickup" value={pickup} />
          <DetailRow icon="calendar" label="Dates" value={`${dateRange} · ${duration}`} />
          <DetailRow icon="clock" label="Time" value={`${pickupTime} – ${returnTime}`} />
          <DetailRow icon="disc" label="Driving option" value={`${mode} · ${mode === 'Self Drive' ? 'No driver charges' : '₹800/day'}`} last />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Customer details</Text>
        <Input label="Full name" value={customer.name} onChangeText={(value) => updateCustomer('name', value)} />
        <Input label="Mobile number" value={customer.mobile} placeholder="10-digit mobile number" keyboardType="phone-pad" onChangeText={(value) => updateCustomer('mobile', value)} />
        <Input label="Email" value={customer.email} keyboardType="email-address" onChangeText={(value) => updateCustomer('email', value)} />
        <Input label="Driving licence number" value={customer.license} placeholder="e.g. RJ0620230001234" onChangeText={(value) => updateCustomer('license', value)} />
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
          onPress={() => router.push('/payment')}
          style={({ pressed }) => [styles.paymentButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
        >
          <Text style={[styles.paymentButtonText, { color: colors.primaryForeground }]}>Continue to payment</Text>
          <Feather name="arrow-right" size={17} color={colors.primaryForeground} />
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function DetailRow({ icon, label, value, last = false }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string; last?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.detailRow, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <Feather name={icon} size={13} color={colors.mutedForeground} />
      <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function Input({ label, value, placeholder, keyboardType, onChangeText }: { label: string; value: string; placeholder?: string; keyboardType?: 'default' | 'phone-pad' | 'email-address'; onChangeText: (value: string) => void }) {
  const colors = useColors();
  return (
    <View style={styles.inputGroup}>
      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        value={value}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
      />
    </View>
  );
}

function PriceRow({ label, value, accent = false }: { label: string; value: string; accent?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.priceRow}>
      <Text style={[styles.priceLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.priceText, { color: accent ? colors.blue : colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 30, paddingHorizontal: 31, paddingTop: 18 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 13 },
  circle: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  carSummary: { alignItems: 'center', borderRadius: 18, flexDirection: 'row', marginTop: 20, padding: 12 },
  carThumb: { alignItems: 'center', borderRadius: 12, height: 61, justifyContent: 'center', width: 74 },
  carThumbText: { fontFamily: 'Inter_700Bold', fontSize: 17 },
  carCopy: { marginLeft: 13 },
  carName: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  carMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  carMode: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 4 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginTop: 24 },
  tripDetails: { marginTop: 10 },
  detailRow: { alignItems: 'center', minHeight: 42, flexDirection: 'row', gap: 8 },
  detailLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, flex: 1 },
  detailValue: { fontFamily: 'Inter_500Medium', fontSize: 10, maxWidth: '65%', textAlign: 'right' },
  inputGroup: { marginTop: 12 },
  inputLabel: { fontFamily: 'Inter_400Regular', fontSize: 10, marginBottom: 5 },
  input: { borderRadius: 10, borderWidth: 1, fontFamily: 'Inter_400Regular', fontSize: 12, height: 42, paddingHorizontal: 12 },
  priceSummary: { marginTop: 12 },
  priceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  priceLabel: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  priceText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  payRow: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 3, paddingTop: 15 },
  payLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  payValue: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  paymentButton: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', height: 53, justifyContent: 'center', marginTop: 22 },
  paymentButtonText: { fontFamily: 'Inter_500Medium', fontSize: 13, marginRight: 9 },
  pressed: { opacity: 0.7 },
});