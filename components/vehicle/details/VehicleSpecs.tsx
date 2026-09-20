import React from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Car } from '@/utils/sawari';

export function VehicleSpecs({ car }: { car: Car }) {
  const colors = useColors();

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="users" size={15} color={colors.primaryText} />
          <Text style={[styles.specText, { color: colors.foreground }]}>{car.seats}</Text>
        </View>
        
        <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="settings" size={15} color={colors.primaryText} />
          <Text style={[styles.specText, { color: colors.foreground }]}>{car.transmission}</Text>
        </View>

        <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="droplet" size={15} color={colors.primaryText} />
          <Text style={[styles.specText, { color: colors.foreground }]}>{car.fuel}</Text>
        </View>

        {car.mileage && (
          <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="bar-chart-2" size={15} color={colors.primaryText} />
            <Text style={[styles.specText, { color: colors.foreground }]}>{car.mileage}</Text>
          </View>
        )}

        {car.luggage && (
          <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="briefcase" size={15} color={colors.primaryText} />
            <Text style={[styles.specText, { color: colors.foreground }]}>{car.luggage}</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  specPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  specText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  }
});
