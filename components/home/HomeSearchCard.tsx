import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export function HomeSearchCard({
  onSearch,
  onOpenEditor
}: {
  onSearch: () => void;
  onOpenEditor: () => void;
}) {
  const colors = useColors();
  const { vehicleType, setVehicleType, dateRange, duration, pickup, dropoff } = useSawari();

  const [startStr, endStr] = (dateRange || '').split(' – ');
  const hasValidDates = startStr && endStr && startStr !== 'Select' && endStr !== 'Select';
  const isSearchDisabled = !hasValidDates || !dropoff?.name;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, shadowColor: '#000' }]}>
      
      {/* Vehicle Type Toggle */}
      <View style={styles.segmentContainer}>
        <Pressable 
          style={[styles.segmentItem, vehicleType === 'car' && styles.segmentItemActive, { backgroundColor: vehicleType === 'car' ? colors.primary : 'transparent' }]} 
          onPress={() => {
            Haptics.selectionAsync();
            setVehicleType('car');
          }}
        >
          <Text style={[styles.segmentText, { color: vehicleType === 'car' ? '#000' : colors.mutedForeground }]}>Cars</Text>
        </Pressable>
        <Pressable 
          style={[styles.segmentItem, vehicleType === 'bike' && styles.segmentItemActive, { backgroundColor: vehicleType === 'bike' ? colors.primary : 'transparent' }]} 
          onPress={() => {
            Haptics.selectionAsync();
            setVehicleType('bike');
          }}
        >
          <Text style={[styles.segmentText, { color: vehicleType === 'bike' ? '#000' : colors.mutedForeground }]}>Bikes</Text>
        </Pressable>
      </View>

      {/* Trip Context (Opens Modal) */}
      <Pressable 
        onPress={() => {
          Haptics.selectionAsync();
          onOpenEditor();
        }}
        style={({ pressed }) => [
          styles.contextInner, 
          { backgroundColor: colors.background, borderColor: colors.border },
          pressed && { opacity: 0.7 }
        ]}
      >
        <View style={{ flex: 1 }}>
          <Text style={[styles.contextLabel, { color: colors.mutedForeground }]}>Pick-up & Drop-off</Text>
          <Text style={[styles.contextValue, { color: colors.foreground }]} numberOfLines={1}>
            {pickup?.name || dropoff?.name || 'Set Location'}
          </Text>
          
          <Text style={[styles.contextLabel, { color: colors.mutedForeground, marginTop: 12 }]}>Duration</Text>
          <Text style={[styles.contextValue, { color: colors.foreground }]} numberOfLines={1}>
            {hasValidDates ? `${dateRange} · ${duration}` : 'Select Dates'}
          </Text>
        </View>
        <View style={[styles.changeBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Text style={[styles.changeBtnText, { color: colors.primaryText }]}>EDIT TRIP</Text>
        </View>
      </Pressable>

      {/* Search Button */}
      <Pressable
        accessibilityRole="button"
        disabled={isSearchDisabled}
        onPress={() => {
          Haptics.selectionAsync();
          onSearch();
        }}
        style={({ pressed }) => [
          styles.searchButton,
          { backgroundColor: isSearchDisabled ? colors.muted : colors.primary },
          pressed && !isSearchDisabled && styles.searchButtonPressed,
        ]}
      >
        <Text style={[
          styles.searchButtonText,
          { color: isSearchDisabled ? colors.mutedForeground : '#000' }
        ]}>
          Search {vehicleType === 'car' ? 'Cars' : 'Bikes'}
        </Text>
        <Feather name="arrow-right" size={18} color={isSearchDisabled ? colors.mutedForeground : '#000'} style={{ marginLeft: 8 }} />
      </Pressable>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 4,
    elevation: 8,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 2,
    marginBottom: 16,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  segmentItemActive: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  contextInner: { 
    borderRadius: 12, 
    padding: 16, 
    flexDirection: 'row', 
    alignItems: 'center', 
    borderWidth: 1,
    marginBottom: 16,
  },
  contextLabel: { 
    fontFamily: 'Inter_500Medium', 
    fontSize: 11, 
    textTransform: 'uppercase', 
    letterSpacing: 0.5 
  },
  contextValue: { 
    fontFamily: 'Inter_600SemiBold', 
    fontSize: 14, 
    marginTop: 4 
  },
  changeBtn: { 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8, 
    borderWidth: 1 
  },
  changeBtnText: { 
    fontFamily: 'Inter_700Bold', 
    fontSize: 11 
  },
  searchButton: {
    height: 52,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  searchButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});
