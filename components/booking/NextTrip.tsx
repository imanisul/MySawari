import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { Car } from '@/utils/sawari';

export function NextTrip({ car, dateRangeStr }: { car: Car, dateRangeStr?: string }) {
  const colors = useColors();
  const router = useRouter();
  const { dateRange } = useSawari();
  const displayDate = dateRangeStr || dateRange || '';
  return (
    <Pressable
      accessibilityRole="button"
      testID="next-trip"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/bookings'); // Go to bookings screen instead of car-details
      }}
      style={({ pressed }) => [
        styles.nextTrip,
        { backgroundColor: colors.navy },
        pressed && styles.cardPressed,
      ]}
    >
      <Image source={car.image} resizeMode="cover" style={styles.tripImage} />
      <View style={styles.nextTripCopy}>
        <Text style={[styles.nextTripLabel, { color: colors.primary }]}>Your next trip</Text>
        <Text style={[styles.nextTripName, { color: '#FFFFFF' }]}>{car.name}</Text>
        <Text style={[styles.nextTripDate, { color: colors.walletMuted }]}>{displayDate.replace('–', '→')}</Text>
      </View>
      <Feather name="arrow-right" size={20} color="#FFFFFF" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nextTrip: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', marginTop: 24, minHeight: 80, padding: 10 },
  tripImage: { borderRadius: 11, height: 60, width: 78 },
  nextTripCopy: { flex: 1, marginLeft: 10 },
  nextTripLabel: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  nextTripName: { fontFamily: 'Inter_500Medium', fontSize: 14, marginTop: 3 },
  nextTripDate: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
});
