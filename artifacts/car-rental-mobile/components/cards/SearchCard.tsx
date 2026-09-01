import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { DriverMode } from '@/lib/sawari';
import { useSawari } from '@/context/SawariContext';

export function SearchCard({
  pickup,
  mode,
  onModeChange,
  onSearch,
}: {
  pickup: string;
  mode: DriverMode;
  onModeChange: (mode: DriverMode) => void;
  onSearch: () => void;
}) {
  const colors = useColors();
  const { dateRange, pickupTime } = useSawari();
  return (
    <View style={[styles.searchCard, { backgroundColor: colors.card }]}>
      <View style={styles.searchTopRow}>
        <View style={styles.locationCopy}>
          <View style={styles.labelRow}>
            <Feather name="map-pin" size={13} color={colors.mutedForeground} />
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Pickup</Text>
          </View>
          <Text style={[styles.locationName, { color: colors.foreground }]}>{pickup}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          testID="driver-mode-toggle"
          onPress={() => {
            Haptics.selectionAsync();
            onModeChange(mode === 'Self Drive' ? 'With Driver' : 'Self Drive');
          }}
          style={({ pressed }) => [
            styles.modePill,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.modePillText, { color: colors.primaryForeground }]}>{mode}</Text>
        </Pressable>
      </View>
      <View style={[styles.tripMetaRow, { borderBottomColor: colors.border }]}>
        <View style={styles.tripMeta}>
          <Feather name="calendar" size={14} color={colors.mutedForeground} />
          <Text style={[styles.tripMetaText, { color: colors.foreground }]}>{dateRange}</Text>
        </View>
        <View style={styles.tripMeta}>
          <Feather name="clock" size={14} color={colors.mutedForeground} />
          <Text style={[styles.tripMetaText, { color: colors.foreground }]}>{pickupTime}</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        testID="search-cars"
        onPress={onSearch}
        style={({ pressed }) => [styles.searchAction, pressed && styles.pressed]}
      >
        <Text style={[styles.searchActionText, { color: colors.foreground }]}>Search cars</Text>
        <View style={[styles.actionCircle, { backgroundColor: colors.primary }]}>
          <Feather name="arrow-right" size={17} color={colors.primaryForeground} />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  searchCard: { borderRadius: 23, marginTop: 24, paddingHorizontal: 20, paddingTop: 20 },
  searchTopRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  locationCopy: { flex: 1 },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  fieldLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  locationName: { fontFamily: 'Inter_600SemiBold', fontSize: 24, letterSpacing: -0.7, marginTop: 3 },
  modePill: { borderRadius: 99, marginTop: 1, paddingHorizontal: 12, paddingVertical: 6 },
  modePillText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  tripMetaRow: { borderBottomWidth: 1, flexDirection: 'row', gap: 22, marginTop: 17, paddingBottom: 20 },
  tripMeta: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  tripMetaText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  searchAction: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 64 },
  searchActionText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  actionCircle: { alignItems: 'center', borderRadius: 99, height: 35, justifyContent: 'center', width: 35 },
  pressed: { opacity: 0.65 },
});
