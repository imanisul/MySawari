import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Car } from '@/utils/sawari';

export function VehicleSummary({ car }: { car: Car }) {
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
