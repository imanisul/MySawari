import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SheetFrame, SheetHeader } from '../layout/SheetFrame';
import { TripField } from '../ui/TripField';
import { PrimaryButton } from '../ui/PrimaryButton';

export function PlannerSheet() {
  const colors = useColors();
  const router = useRouter();
  const { pickup, dateRange, pickupTime, returnTime, mode } = useSawari();
  return (
    <SheetFrame height={660}>
      <SheetHeader title="Where do you want to go?" subtitle="Find the right car for your journey." />
      <View style={styles.fields}>
        <TripField icon="map-pin" label="Pickup location" value={pickup} onPress={() => router.push('/location')} />
        <TripField icon="calendar" label="Dates" value={dateRange} onPress={() => router.push('/dates')} />
        <TripField icon="clock" label="Time" value={`${pickupTime} – ${returnTime}`} onPress={() => router.push('/times')} />
        <TripField icon="aperture" label="Driving Option" value={mode} onPress={() => router.push('/driver-option')} />
      </View>
      <Pressable
        accessibilityRole="button"
        testID="driver-charges"
        onPress={() => router.push('/driver-charges')}
        style={[styles.driverHint, { backgroundColor: colors.secondary }]}
      >
        <View style={[styles.hintDot, { backgroundColor: colors.success }]} />
        <Text style={[styles.driverHintText, { color: colors.foreground }]}>
          {mode === 'Self Drive' ? 'No driver charges' : 'Driver charges apply'}
        </Text>
      </Pressable>
      <PrimaryButton label="Search cars" onPress={() => router.replace('/search')} />
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  fields: { marginTop: 28 },
  driverHint: { alignItems: 'center', borderRadius: 22, flexDirection: 'row', marginTop: 16, minHeight: 54, paddingHorizontal: 20 },
  hintDot: { borderRadius: 99, height: 10, marginRight: 10, width: 10 },
  driverHintText: { fontFamily: 'Inter_400Regular', fontSize: 15 },
});
