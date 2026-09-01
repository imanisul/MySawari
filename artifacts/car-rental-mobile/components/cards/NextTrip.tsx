import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Car } from '@/lib/sawari';

export function NextTrip({ car }: { car: Car }) {
  const colors = useColors();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      testID="next-trip"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/car-details');
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
        <Text style={[styles.nextTripName, { color: colors.warmWhite }]}>{car.name}</Text>
        <Text style={[styles.nextTripDate, { color: colors.mutedForeground }]}>17 Aug → 20 Aug</Text>
      </View>
      <Feather name="arrow-right" size={20} color={colors.warmWhite} />
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
