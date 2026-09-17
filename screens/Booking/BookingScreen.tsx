import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { checkCarAvailability } from '@/utils/sawari';
import { KeyboardAwareScrollViewCompat } from '@/components';

export default function BookingScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedCar, mode, pickup, dropoff, returnAddress, isDeliveryRequested, deliveryMode, dateRange, duration, pickupTime, returnTime, customer, updateCustomer } = useSawari();

  const [errors, setErrors] = useState<{name?: string; mobile?: string; email?: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // The pricing quote is automatically managed in SawariContext now based on these details

  // A pickup/drop address is only required when the customer actually asked for
  // that service — Self Pickup / Self Drop (the default) never needs an address.
  const needsPickupAddress = isDeliveryRequested && (deliveryMode === 'delivery' || deliveryMode === 'both');
  const needsDropAddress = isDeliveryRequested && (deliveryMode === 'return' || deliveryMode === 'both');
  const isMissingPickup = needsPickupAddress && !pickup?.name;
  const isMissingDrop = needsDropAddress && !returnAddress?.name;
  const isMissingDates = !dateRange || dateRange.includes('Select');
  const isMissingDestination = !dropoff?.name;
  
  const [startStr] = (dateRange || '').split(' – ');
  const isVehicleAvailable = isMissingDates ? true : checkCarAvailability(selectedCar?.availabilityDate, startStr);

  const validateAndProceed = () => {
    if (isMissingPickup || isMissingDrop || isMissingDates || isMissingDestination) {
      Alert.alert('Missing Details', 'Please select your trip locations and travel dates before continuing.');
      return;
    }
    
    if (!isVehicleAvailable) {
      Alert.alert('Not Available', 'Sorry, this vehicle is no longer available for your selected dates.');
      return;
    }

    const newErrors: typeof errors = {};
    if (!customer.name.trim()) newErrors.name = 'Name is required';
    if (!customer.mobile.trim() || !/^\d{10}$/.test(customer.mobile)) newErrors.mobile = 'Enter a valid 10-digit mobile number';
    if (customer.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) newErrors.email = 'Enter a valid email';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
    } else {
      setErrors({});
      setIsSubmitting(true);
      router.push('/payment');
      setTimeout(() => setIsSubmitting(false), 1000);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <KeyboardAwareScrollViewCompat
        bottomOffset={72}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
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
          <DetailRow
            icon="map-pin"
            label="Destination"
            value={dropoff?.name || 'Select Destination'}
            isMissing={!dropoff?.name}
            onPress={() => router.push('/dropoff')}
          />
          {isDeliveryRequested && (
            <>
              {(deliveryMode === 'both' || deliveryMode === 'delivery') && (
                <DetailRow
                  icon="map-pin"
                  label="Drop off"
                  value={pickup?.name || 'Select Location'}
                  isMissing={isMissingPickup}
                  onPress={() => router.push('/location')}
                />
              )}
              {(deliveryMode === 'both' || deliveryMode === 'return') && (
                <DetailRow
                  icon="map-pin"
                  label="Pick up"
                  value={returnAddress?.name || 'Select Location'}
                  isMissing={isMissingDrop}
                  onPress={() => router.push('/return-location')}
                />
              )}
            </>
          )}
          <DetailRow
            icon="calendar"
            label="Dates & Time"
            value={isMissingDates ? 'Select Dates' : `${dateRange} · ${duration}\n${pickupTime} – ${returnTime}`}
            isMissing={isMissingDates}
            onPress={() => router.push('/dates')}
          />
          <DetailRow
            icon={mode === 'Self Drive' ? 'aperture' : 'user'}
            label="Driving option"
            value={`${mode} · ${mode === 'Self Drive' ? 'No driver charges' : '₹800/day'}`}
            last
          />
        </View>

        {!isVehicleAvailable && !isMissingDates && (
          <View style={{ backgroundColor: '#FEE2E2', padding: 16, borderRadius: 12, marginTop: 16 }}>
            <Text style={{ color: '#DC2626', fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Not Available</Text>
            <Text style={{ color: '#991B1B', fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4 }}>
              Sorry, this vehicle is no longer available for your selected dates. Please change your dates.
            </Text>
          </View>
        )}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Customer details</Text>
        <Input label="Full name" value={customer.name} error={errors.name} onChangeText={(value) => updateCustomer('name', value)} />
        <Input label="Mobile number" value={customer.mobile} placeholder="10-digit mobile number" keyboardType="phone-pad" error={errors.mobile} onChangeText={(value) => updateCustomer('mobile', value)} />
        <Input label="Email (Optional)" value={customer.email} keyboardType="email-address" error={errors.email} onChangeText={(value) => updateCustomer('email', value)} />
        <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 8, marginBottom: 16, fontStyle: 'italic', lineHeight: 16 }}>
          Note: Original Driving Licence and Aadhar Card verification is mandatory at the time of vehicle handover.
        </Text>
        <Pressable
          accessibilityRole="button"
          testID="continue-to-payment"
          onPress={validateAndProceed}
          disabled={isSubmitting}
          style={({ pressed }) => [
            styles.paymentButton,
            { backgroundColor: (isMissingPickup || isMissingDrop || isMissingDates || isMissingDestination || !isVehicleAvailable || isSubmitting) ? colors.muted : colors.primary },
            pressed && !isSubmitting && styles.pressed
          ]}
        >
          <Text style={[styles.paymentButtonText, { color: (isMissingPickup || isMissingDrop || isMissingDates || isMissingDestination || !isVehicleAvailable || isSubmitting) ? colors.mutedForeground : colors.primaryForeground }]}>
            {(isMissingPickup || isMissingDrop || isMissingDates || isMissingDestination) ? 'Missing Trip Details' : !isVehicleAvailable ? 'Vehicle Not Available' : 'Continue to payment'}
          </Text>
          {(!isMissingPickup && !isMissingDrop && !isMissingDates && !isMissingDestination && isVehicleAvailable) && (
            <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
          )}
        </Pressable>
      </KeyboardAwareScrollViewCompat>
    </View>
  );
}

function DetailRow({ icon, label, value, last = false, isMissing = false, onPress }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string; last?: boolean; isMissing?: boolean; onPress?: () => void }) {
  const colors = useColors();
  const content = (
    <View style={[styles.detailRow]}>
      <Feather name={icon} size={16} color={isMissing ? colors.destructive : colors.mutedForeground} />
      <Text style={[styles.detailLabel, { color: isMissing ? colors.destructive : colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: isMissing ? colors.destructive : colors.foreground }]}>{value}</Text>
      {onPress && <Feather name="chevron-right" size={16} color={isMissing ? colors.destructive : colors.mutedForeground} style={{ marginLeft: 4 }} />}
    </View>
  );
  
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({pressed}) => [pressed && {opacity: 0.7}]}>
        {content}
      </Pressable>
    );
  }
  
  return content;
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


const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 40, paddingHorizontal: 24 },
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