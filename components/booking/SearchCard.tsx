import React from 'react';
import { Pressable, StyleSheet, Text, View, Switch, LayoutAnimation } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { DriverMode } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';

export function SearchCard({
  mode,
  onModeChange,
  onSearch,
  isModal = false,
}: {
  mode: DriverMode;
  onModeChange: (mode: DriverMode) => void;
  onSearch: () => void;
  isModal?: boolean;
}) {
  const colors = useColors();
  const router = useRouter();
  const { vehicleType, setVehicleType, dateRange, duration, pickup, dropoff, pickupTime, returnTime, isAuthenticated, isDeliveryRequested, setIsDeliveryRequested, deliveryMode, setDeliveryMode, returnAddress, pricingQuote } = useSawari();
  
  const [startStr, endStr] = dateRange.split(' – ');
  const hasValidDates = startStr && endStr && startStr !== 'Select' && endStr !== 'Select';
  
  let isSearchDisabled = !dropoff?.name || !hasValidDates;
  if (isDeliveryRequested) {
    if ((deliveryMode === 'delivery' || deliveryMode === 'both') && !pickup?.name) isSearchDisabled = true;
    if ((deliveryMode === 'return' || deliveryMode === 'both') && !returnAddress?.name) isSearchDisabled = true;
  }

  const toggleDelivery = (val: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDeliveryRequested(val);
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.card }, isModal && styles.modalCard]}>
      
      {/* Vehicle Type Toggle */}
      {!isModal && (
        <View style={styles.segmentContainer}>
          <Pressable 
            style={[styles.segmentItem, vehicleType === 'car' && styles.segmentItemActive, { backgroundColor: vehicleType === 'car' ? colors.primary : 'transparent' }]} 
            onPress={() => {
              Haptics.selectionAsync();
              setVehicleType('car');
            }}
          >
            <Text style={[styles.segmentText, { color: vehicleType === 'car' ? colors.primaryForeground : '#FFFFFF' }]}>Cars</Text>
          </Pressable>
          <Pressable 
            style={[styles.segmentItem, vehicleType === 'bike' && styles.segmentItemActive, { backgroundColor: vehicleType === 'bike' ? colors.primary : 'transparent' }]} 
            onPress={() => {
              Haptics.selectionAsync();
              setVehicleType('bike');
            }}
          >
            <Text style={[styles.segmentText, { color: vehicleType === 'bike' ? colors.primaryForeground : '#FFFFFF' }]}>Bikes</Text>
          </Pressable>
        </View>
      )}

      {/* 1. Destination Location (Primary) */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Where are you going?</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/dropoff');
          }}
          style={({ pressed }) => [
            styles.field,
            styles.largeField,
            { borderColor: colors.border, backgroundColor: pressed ? colors.tintLight : colors.background }
          ]}
        >
          <Feather name="flag" size={18} color={colors.blue} />
          <View style={styles.fieldContent}>
            <Text numberOfLines={1} style={[styles.fieldValue, styles.largeFieldValue, { color: !dropoff?.name ? colors.mutedForeground : colors.foreground }]}>
              {dropoff?.name || 'Select destination'}
            </Text>
          </View>
        </Pressable>
      </View>

      <View style={{ height: 16 }} />

      {/* 3. Start & Return Journey (Side by Side) */}
      <View style={[styles.section, { flexDirection: 'row', gap: 12 }]}>
        
        {/* Start Date + Time */}
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Start Sawari</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/dates');
            }}
            style={({ pressed }) => [
              styles.field,
              { paddingHorizontal: 8, borderColor: colors.border, backgroundColor: pressed ? colors.tintLight : colors.background }
            ]}
          >
            <Feather name="calendar" size={14} color={colors.blue} />
            <View style={styles.fieldContent}>
              <Text numberOfLines={1} style={[styles.fieldValue, { color: startStr && startStr !== 'Select' ? colors.foreground : colors.mutedForeground }]}>
                {startStr && startStr !== 'Select' ? `${startStr}, ${pickupTime.replace(' AM', '').replace(' PM', '')}` : 'Start'}
              </Text>
            </View>
          </Pressable>
        </View>

        {/* Return Date + Time */}
        <View style={{ flex: 1 }}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>End Sawari</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/dates');
            }}
            style={({ pressed }) => [
              styles.field,
              { paddingHorizontal: 8, borderColor: colors.border, backgroundColor: pressed ? colors.tintLight : colors.background }
            ]}
          >
            <Feather name="calendar" size={14} color={colors.blue} />
            <View style={styles.fieldContent}>
              <Text numberOfLines={1} style={[styles.fieldValue, { color: endStr && endStr !== 'Select' ? colors.foreground : colors.mutedForeground }]}>
                {endStr && endStr !== 'Select' ? `${endStr}, ${returnTime.replace(' AM', '').replace(' PM', '')}` : 'Return'}
              </Text>
            </View>
          </Pressable>
        </View>

      </View>

      {/* 3. Delivery Service Toggle */}
      <View style={[styles.deliveryToggleRow, { borderTopColor: colors.border }]}>
        <View style={{ flex: 1, paddingRight: 16 }}>
          <Text style={[styles.deliveryToggleTitle, { color: colors.foreground }]}>Get car delivered?</Text>
          <Text style={[styles.deliveryToggleDesc, { color: colors.mutedForeground }]}>We will drop and pick up the car at your location</Text>
        </View>
        <Switch 
          value={isDeliveryRequested} 
          onValueChange={toggleDelivery}
          trackColor={{ false: colors.border, true: colors.primary }}
          thumbColor={isDeliveryRequested ? '#FFF' : '#FFF'}
        />
      </View>

      {/* Conditional Delivery Fields */}
      {isDeliveryRequested && (
        <View style={styles.deliveryFieldsContainer}>
          {/* Segment Control for Delivery Mode */}
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {(['delivery', 'return', 'both'] as const).map(m => {
              const label = m === 'delivery' ? 'Drop off' : m === 'return' ? 'Pick up' : 'Both';
              return (
                <Pressable
                  key={m}
                  onPress={() => {
                    Haptics.selectionAsync();
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setDeliveryMode(m);
                  }}
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    alignItems: 'center',
                    backgroundColor: deliveryMode === m ? colors.primary : 'transparent',
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: deliveryMode === m ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 12, fontFamily: deliveryMode === m ? 'Inter_600SemiBold' : 'Inter_500Medium', color: deliveryMode === m ? '#000' : colors.mutedForeground }}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <View style={{ flexDirection: 'row', gap: 16 }}>
            {/* Get Delivered: show only Pickup address */}
            {(deliveryMode === 'delivery' || deliveryMode === 'both') && (
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Deliver To</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push('/location');
                  }}
                  style={({ pressed }) => [
                    styles.field,
                    { paddingHorizontal: 8, borderColor: colors.border, backgroundColor: pressed ? colors.tintLight : colors.background }
                  ]}
                >
                  <Feather name="map-pin" size={14} color={colors.primary} />
                  <View style={styles.fieldContent}>
                    <Text numberOfLines={1} style={[styles.fieldValue, { color: pickup?.name ? colors.foreground : colors.mutedForeground }]}>
                      {pickup?.name || 'Search address'}
                    </Text>
                  </View>
                </Pressable>
                {!!pickup?.name && !!pricingQuote?.pickupCharge && (
                  <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.primaryText, marginTop: 4, marginLeft: 4 }}>
                    {pricingQuote.pickupDistanceKm} km × ₹20 = ₹{pricingQuote.pickupCharge}
                  </Text>
                )}
              </View>
            )}

            {/* Pickup Only: show only Drop address */}
            {(deliveryMode === 'return' || deliveryMode === 'both') && (
              <View style={{ flex: 1 }}>
                <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Collect From</Text>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push('/return-location');
                  }}
                  style={({ pressed }) => [
                    styles.field,
                    { paddingHorizontal: 8, borderColor: colors.border, backgroundColor: pressed ? colors.tintLight : colors.background }
                  ]}
                >
                  <Feather name="map-pin" size={14} color={colors.primary} />
                  <View style={styles.fieldContent}>
                    <Text numberOfLines={1} style={[styles.fieldValue, { color: returnAddress?.name ? colors.foreground : colors.mutedForeground }]}>
                      {returnAddress?.name || 'Search address'}
                    </Text>
                  </View>
                </Pressable>
                {!!returnAddress?.name && !!pricingQuote?.dropCharge && (
                  <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: colors.primaryText, marginTop: 4, marginLeft: 4 }}>
                    {pricingQuote.dropDistanceKm} km × ₹20 = ₹{pricingQuote.dropCharge}
                  </Text>
                )}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Search Button */}
      <Pressable
        accessibilityRole="button"
        testID="search-button"
        disabled={isSearchDisabled}
        onPress={onSearch}
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
          Continue to Choose Vehicle
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 14,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 4,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
  },
  modalCard: {
    marginTop: 0,
    marginHorizontal: 0,
    borderRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
    padding: 0,
  },
  segmentContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 2,
    marginBottom: 14,
  },
  segmentItem: {
    flex: 1,
    paddingVertical: 6,
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
  section: {
    marginBottom: 0,
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 10,
    marginBottom: 2,
    marginLeft: 4,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
  },
  largeField: {
    height: 42,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  fieldContent: {
    marginLeft: 8,
    flex: 1,
  },
  fieldValue: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  largeFieldValue: {
    fontSize: 14,
  },
  deliveryToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
  },
  deliveryToggleTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginBottom: 4,
  },
  deliveryToggleDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    lineHeight: 16,
  },
  deliveryFieldsContainer: {
    flexDirection: 'column',
    marginTop: 16,
  },

  searchButton: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
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
