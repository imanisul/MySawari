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

        {car.type !== 'Bike' && (car.ac !== false) && (
          <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="wind" size={15} color={colors.primaryText} />
            <Text style={[styles.specText, { color: colors.foreground }]}>Air Conditioning</Text>
          </View>
        )}

        {car.mileage && car.mileage !== 'N/A' && (
          <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="bar-chart-2" size={15} color={colors.primaryText} />
            <Text style={[styles.specText, { color: colors.foreground }]}>{car.mileage}</Text>
          </View>
        )}

        {car.carPlay && (
          <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="smartphone" size={15} color={colors.primaryText} />
            <Text style={[styles.specText, { color: colors.foreground }]}>Apple CarPlay / Android Auto</Text>
          </View>
        )}

        {car.touchscreen && (
          <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="tv" size={15} color={colors.primaryText} />
            <Text style={[styles.specText, { color: colors.foreground }]}>Touchscreen</Text>
          </View>
        )}

        {car.sunroof && (
          <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="sun" size={15} color={colors.primaryText} />
            <Text style={[styles.specText, { color: colors.foreground }]}>Sunroof</Text>
          </View>
        )}

        {(car.airbagsEquipped || !!car.airbags) && (
          <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="shield" size={15} color={colors.primaryText} />
            <Text style={[styles.specText, { color: colors.foreground }]}>
              {car.airbags ? (car.airbags.includes('Airbag') ? car.airbags : `${car.airbags} Airbags`) : 'Airbags'}
            </Text>
          </View>
        )}

        {car.absEbd && (
          <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="check-circle" size={15} color={colors.primaryText} />
            <Text style={[styles.specText, { color: colors.foreground }]}>ABS + EBD</Text>
          </View>
        )}

        {car.rearCamera && (
          <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="video" size={15} color={colors.primaryText} />
            <Text style={[styles.specText, { color: colors.foreground }]}>Rear Camera</Text>
          </View>
        )}

        {car.rearParkingSensors && (
          <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="radio" size={15} color={colors.primaryText} />
            <Text style={[styles.specText, { color: colors.foreground }]}>Parking Sensors</Text>
          </View>
        )}

        {car.gps && (
          <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="navigation" size={15} color={colors.primaryText} />
            <Text style={[styles.specText, { color: colors.foreground }]}>GPS Navigation</Text>
          </View>
        )}

        {car.usbCharging && (
          <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="battery-charging" size={15} color={colors.primaryText} />
            <Text style={[styles.specText, { color: colors.foreground }]}>USB Charging</Text>
          </View>
        )}

        {car.bluetooth && (
          <View style={[styles.specPill, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="bluetooth" size={15} color={colors.primaryText} />
            <Text style={[styles.specText, { color: colors.foreground }]}>Bluetooth</Text>
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
