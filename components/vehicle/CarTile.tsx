import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Car } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';

export const CarTile = React.memo(function CarTile({ car, onPress, onIntercept }: { car: Car; onPress?: () => void; onIntercept?: () => void }) {
  const colors = useColors();
  const router = useRouter();
  const { selectCar, dateRange } = useSawari();
  
  const isDateSelected = !!(dateRange && !dateRange.includes('Select'));

  return (
    <Pressable
      accessibilityRole="button"
      testID={`car-${car.id}`}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        selectCar(car);
        onPress?.();
        if (!isDateSelected && onIntercept) {
          onIntercept();
        } else {
          router.push('/car-details');
        }
      }}
      style={({ pressed }) => [styles.carTile, pressed && styles.cardPressed]}
    >
      <Image source={car.image} resizeMode="cover" style={styles.carImage} />
      <View style={[styles.carTileCopy]}>
        <View style={styles.carHeader}>
          <Text numberOfLines={1} style={[styles.carName, { color: colors.foreground }]}>
            {car.name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={[styles.carPrice, { color: colors.foreground }]}>{car.price}</Text>
            <Text style={[styles.carPriceSuffix, { color: colors.mutedForeground, marginLeft: 2 }]}>/day</Text>
          </View>
        </View>
        <View style={styles.carSubHeader}>
          <Text style={[styles.carType, { color: colors.mutedForeground }]}>
            {car.category} · {car.transmission} · {car.seats}
          </Text>
        </View>
        <View style={styles.availableRow}>
          <View style={[styles.availableDot, { backgroundColor: colors.primary }]} />
          <Text style={[styles.availableText, { color: colors.foreground }]}>
            {(() => {
              if (car.availabilityDate && car.availabilityDate !== 'Available Now') {
                return car.availableToDate ? `Avail ${car.availabilityDate} - ${car.availableToDate}` : `From ${car.availabilityDate}`;
              } else if (car.availableToDate) {
                return `Until ${car.availableToDate}`;
              }
              return 'Available Now';
            })()}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  carTile: { overflow: 'hidden', width: 270 },
  carImage: { borderRadius: 16, height: 160, width: '100%' },
  carTileCopy: { paddingVertical: 11 },
  carHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  carName: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  carPrice: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  carSubHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  carType: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  carPriceSuffix: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  availableRow: { alignItems: 'center', flexDirection: 'row', marginTop: 6 },
  availableDot: { borderRadius: 99, height: 6, marginRight: 6, width: 6 },
  availableText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
});
