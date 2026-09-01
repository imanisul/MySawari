import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SheetFrame, SheetHeader } from '../layout/SheetFrame';

export function LocationSheet() {
  const colors = useColors();
  const { pickup, setPickup } = useSawari();
  const locations = [
    'Guwahati',
    'Shillong',
    'Bikaner',
    'Jaipur',
    'Delhi',
    'Jodhpur',
    'Mumbai',
    'Bangalore',
    'Hyderabad',
    'Chennai',
    'Kolkata',
  ];
  return (
    <SheetFrame height={700}>
      <SheetHeader title="Pickup location" />
      <View style={[styles.searchInput, { backgroundColor: colors.secondary }]}>
        <Feather name="search" size={21} color={colors.mutedForeground} />
        <TextInput
          placeholder="Search city or location"
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchText, { color: colors.foreground }]}
          testID="location-search"
        />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setPickup('Bikaner')}
          style={({ pressed }) => [styles.currentLocation, pressed && styles.pressed]}
        >
          <View style={[styles.currentLocationIcon, { backgroundColor: colors.tintLight }]}>
            <Feather name="crosshair" size={22} color={colors.foreground} />
          </View>
          <Text style={[styles.currentLocationText, { color: colors.foreground }]}>Use current location</Text>
        </Pressable>
        <Text style={[styles.listLabel, { color: colors.mutedForeground }]}>Recent</Text>
        {locations.slice(0, 2).map((location) => (
          <LocationRow key={location} location={location} selected={pickup === location} onPress={() => setPickup(location)} />
        ))}
        <Text style={[styles.listLabel, { color: colors.mutedForeground, marginTop: 23 }]}>Popular locations</Text>
        {locations.map((location) => (
          <LocationRow key={`popular-${location}`} location={location} selected={pickup === location} onPress={() => setPickup(location)} />
        ))}
      </ScrollView>
    </SheetFrame>
  );
}

function LocationRow({ location, selected, onPress }: { location: string; selected: boolean; onPress: () => void }) {
  const colors = useColors();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        onPress();
        router.back();
      }}
      style={({ pressed }) => [styles.locationRow, { borderBottomColor: colors.border }, pressed && styles.pressed]}
    >
      <Feather name="map-pin" size={19} color={selected ? colors.foreground : colors.mutedForeground} />
      <Text style={[styles.locationText, { color: colors.foreground }]}>{location}</Text>
      {selected && <View style={[styles.locationDot, { backgroundColor: colors.primary }]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchInput: { alignItems: 'center', borderRadius: 20, flexDirection: 'row', height: 60, marginTop: 22, paddingHorizontal: 20 },
  searchText: { flex: 1, fontFamily: 'Inter_400Regular', fontSize: 17, marginLeft: 14 },
  currentLocation: { alignItems: 'center', flexDirection: 'row', marginTop: 27, paddingVertical: 16 },
  currentLocationIcon: { alignItems: 'center', borderRadius: 99, height: 49, justifyContent: 'center', width: 49 },
  currentLocationText: { fontFamily: 'Inter_600SemiBold', fontSize: 18, marginLeft: 17 },
  listLabel: { fontFamily: 'Inter_400Regular', fontSize: 16, marginTop: 24 },
  locationRow: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', minHeight: 60 },
  locationText: { fontFamily: 'Inter_400Regular', fontSize: 17, marginLeft: 19 },
  locationDot: { borderRadius: 99, height: 10, marginLeft: 'auto', width: 10 },
  pressed: { opacity: 0.65 },
});
