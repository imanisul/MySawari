import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Car } from '@/utils/sawari';

export function VehicleSummary({ car, isAvailable, availabilityNote }: { car: Car, isAvailable: boolean, availabilityNote?: string }) {
  const colors = useColors();

  const rating = car.rating || 4.8;
  const reviewCount = car.reviewCount || 126;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { color: colors.foreground }]}>{car.name}</Text>
      </View>
      
      <View style={styles.subRow}>
        <Text style={[styles.category, { color: colors.mutedForeground }]}>{car.category}</Text>
        
        <View style={styles.dot} />
        
        <View style={styles.ratingRow}>
          <Feather name="star" size={15} color="#F59E0B" style={{ marginTop: -1 }} />
          <Text style={[styles.ratingText, { color: colors.foreground }]}>{rating}</Text>
          <Text style={[styles.reviewCount, { color: colors.mutedForeground }]}>({reviewCount} reviews)</Text>
        </View>
      </View>

      {!!availabilityNote && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
          <Feather name={isAvailable ? 'calendar' : 'x-circle'} size={14} color={isAvailable ? colors.primaryText : colors.destructive} />
          <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: isAvailable ? colors.foreground : colors.destructive }}>
            {availabilityNote}
          </Text>
        </View>
      )}

      {isAvailable && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 }}>
          <Feather name="map-pin" size={14} color={colors.primaryText} />
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.mutedForeground }}>
            MySawari, Kahilipara, Guwahati
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 26,
    letterSpacing: -0.8,
    lineHeight: 32,
  },
  subRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  category: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 10,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  reviewCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  }
});
