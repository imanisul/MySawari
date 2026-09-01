import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Car } from '@/lib/sawari';
import { useSawari } from '@/context/SawariContext';

export function CarListCard({ car }: { car: Car }) {
  const colors = useColors();
  const router = useRouter();
  const { selectCar } = useSawari();
  return (
    <View style={styles.cardContainer}>
      <Pressable
        accessibilityRole="button"
        testID={`list-car-${car.id}`}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          selectCar(car);
          router.push('/car-details');
        }}
        style={({ pressed }) => [styles.imageContainer, pressed && styles.cardPressed]}
      >
        <Image source={car.image} resizeMode="cover" style={styles.carImage} />
        <View style={[styles.availableBadge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.primaryForeground }]}>Available</Text>
        </View>
      </Pressable>
      <View style={styles.cardCopy}>
        <View style={styles.titleRow}>
          <Text style={[styles.carName, { color: colors.foreground }]}>{car.name}</Text>
          <Text style={[styles.carPrice, { color: colors.foreground }]}>{car.price}</Text>
        </View>
        <View style={styles.titleRow}>
          <Text style={[styles.carMeta, { color: colors.mutedForeground }]}>{car.category} · {car.seats} seats · {car.transmission}</Text>
          <Text style={[styles.carPriceSuffix, { color: colors.mutedForeground }]}>per day</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          selectCar(car);
          router.push('/car-details');
        }}
        style={({ pressed }) => [styles.viewButton, { borderColor: colors.foreground }, pressed && styles.cardPressed]}
      >
        <Text style={[styles.viewButtonText, { color: colors.foreground }]}>View Details</Text>
        <Feather name="arrow-right" size={15} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: { marginBottom: 30 },
  imageContainer: { borderRadius: 16, overflow: 'hidden' },
  carImage: { height: 210, width: '100%' },
  availableBadge: { alignItems: 'center', borderRadius: 99, justifyContent: 'center', left: 14, paddingHorizontal: 12, paddingVertical: 6, position: 'absolute', top: 14 },
  badgeText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  cardCopy: { marginTop: 14, paddingHorizontal: 2 },
  titleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  carName: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  carPrice: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  carMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  carPriceSuffix: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  viewButton: { alignItems: 'center', borderRadius: 14, borderWidth: 1, flexDirection: 'row', height: 48, justifyContent: 'center', marginTop: 16 },
  viewButtonText: { fontFamily: 'Inter_500Medium', fontSize: 14, marginRight: 8 },
  cardPressed: { opacity: 0.8 },
});
