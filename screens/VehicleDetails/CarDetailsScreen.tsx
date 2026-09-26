import React, { useState, useRef, useEffect } from 'react';
import { ScrollView, StyleSheet, View, Text, Pressable, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useSawari } from '@/context/SawariContext';
import { CarTile, LoginBottomSheet } from '@/components';
import { TripEditorModal } from '@/components/home/TripEditorModal';
import { cars, getAvailability, splitDateRange } from '@/utils/sawari';

import { VehicleHeader } from '@/components/vehicle/details/VehicleHeader';
import { VehicleHeroGallery } from '@/components/vehicle/details/VehicleHeroGallery';
import { VehicleSummary } from '@/components/vehicle/details/VehicleSummary';
import { DetailsTabs } from '@/components/vehicle/details/DetailsTabs';
import { StickyBookingBar } from '@/components/vehicle/details/StickyBookingBar';
import { PriceBreakdownSheet } from '@/components/vehicle/details/PriceBreakdownSheet';
import { SearchSheet } from '@/components/booking/SearchSheet';
import Reanimated from 'react-native-reanimated';
import { rise } from '@/components/common/motion';

export default function CarDetailsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedCar, pickup, dropoff, dateRange, selectedDate, bookingSource, isDeliveryRequested, setFuelEstimate } = useSawari();
  
  // CarListCard already syncs the Explore page's date to dateRange before navigation.
  const effectiveDateRange = dateRange;
  
  // Same rule as the lists: free for the chosen dates (or today if none chosen).
  const [startStr, endStr] = splitDateRange(effectiveDateRange);
  const availability = getAvailability(selectedCar, startStr, endStr);
  const isAvailable = availability.available;

  // Enrich the car with the computed availability so child components can access nextAvailableFrom etc.
  const enrichedCar = selectedCar ? { ...selectedCar, availability, isAvailable } : selectedCar;

  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [showSearchSheet, setShowSearchSheet] = useState(false);


  useEffect(() => {
    setFuelEstimate(null);
  }, []);

  const mainScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [selectedCar?.id]);

  // The app starts with a sample car selected. Reaching this screen without picking a real one
  // (a stale link, a web refresh) must not show that sample as if it were bookable.
  if (!selectedCar || selectedCar === cars[0]) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>Car not found</Text>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={{ marginTop: 20, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}>
          <Text style={{ color: colors.primaryForeground }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <VehicleHeader carName={selectedCar?.name || 'Vehicle Details'} />

      <ScrollView 
        ref={mainScrollRef} 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.content, { paddingBottom: 70 + Math.max(insets.bottom, 16) + 24 }]}
      >
        <Reanimated.View entering={rise(0)}>
          <VehicleHeroGallery car={enrichedCar} />
        </Reanimated.View>
        
        <Reanimated.View entering={rise(100)}>
          <VehicleSummary car={enrichedCar} isAvailable={isAvailable} availabilityNote={availability.label} />
        </Reanimated.View>

        <Reanimated.View entering={rise(200)}>
          <DetailsTabs car={enrichedCar} />
        </Reanimated.View>

        {/* Location Card */}
        {isAvailable && (
          <Reanimated.View entering={rise(300)} style={styles.fuelSection}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {isDeliveryRequested ? 'Delivery Details' : 'Vehicle Location'}
            </Text>
            
            {/* Always show Vehicle Location */}
            <Pressable 
              style={({ pressed }) => [
                styles.locationCard, 
                { backgroundColor: colors.card, borderColor: colors.border },
                pressed && { opacity: 0.8 }
              ]}
              onPress={() => {
                Haptics.selectionAsync();
                import('react-native').then(({ Linking }) => {
                  Linking.openURL('https://www.google.com/maps/search/?api=1&query=MySawari+-+Self+Drive+Car+Rental+Guwahati,+Kahilipara,+Assam');
                });
              }}
            >
              <View style={[styles.mapPlaceholder, { backgroundColor: colors.tintLight }]}>
                <Feather name="map" size={32} color={colors.primaryText} />
                <View style={styles.mapPinShadow} />
                <Feather name="map-pin" size={24} color={colors.destructive} style={styles.mapPin} />
              </View>
              <View style={styles.locationDetails}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.locationTitle, { color: colors.foreground }]}>Currently Present At</Text>
                  <Text style={[styles.locationDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    Ganesh Turning, Bongshar, Kahilipara, Guwahati, Assam 781019
                  </Text>
                </View>
                <View style={[styles.mapBtn, { backgroundColor: colors.primary }]}>
                  <Feather name="navigation" size={16} color={colors.primaryForeground} />
                  <Text style={[styles.mapBtnText, { color: colors.primaryForeground }]}>Directions</Text>
                </View>
              </View>
            </Pressable>

            {/* Show Delivery details if requested */}
            {isDeliveryRequested && (
              <View style={[styles.locationCard, { backgroundColor: colors.card, borderColor: colors.border, padding: 16, marginTop: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <View style={[styles.mapPlaceholder, { backgroundColor: colors.tintLight, height: 48, width: 48, borderRadius: 24 }]}>
                    <Feather name="map-pin" size={20} color={colors.primaryText} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.locationTitle, { color: colors.foreground, fontSize: 14 }]}>Delivery Scheduled To</Text>
                    <Text style={[styles.locationDesc, { color: colors.mutedForeground, fontSize: 12 }]} numberOfLines={2}>
                      {pickup?.name || 'Your vehicle will be delivered to your selected address.'}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </Reanimated.View>
        )}

      </ScrollView>
      
      <StickyBookingBar 
        isAvailable={isAvailable} 
        onViewBreakdown={() => setShowBreakdown(true)} 
        onNeedLogin={() => setShowLogin(true)} 
        onBookNow={() => {
          const isMissingEnd = !endStr || endStr.includes('Select');
          if (bookingSource === 'explore' || !dropoff?.name || isMissingEnd) {
            setShowSearchSheet(true);
          } else {
            router.push('/booking');
          }
        }}
      />
      <PriceBreakdownSheet
        visible={showBreakdown}
        onClose={() => setShowBreakdown(false)}
      />
      <SearchSheet
        visible={showSearchSheet}
        onClose={() => setShowSearchSheet(false)}
        onContinue={() => {
          setShowSearchSheet(false);
          router.push('/booking');
        }}
      />
      <LoginBottomSheet 
        visible={showLogin} onClose={() => setShowLogin(false)} />
      <TripEditorModal
        visible={isEditingTrip}
        onClose={() => setIsEditingTrip(false)}
        onSave={() => setIsEditingTrip(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {},
  pressed: { opacity: 0.7 },
  notAvailableBox: { margin: 16, padding: 24, borderRadius: 16, borderWidth: 1, alignItems: 'center' },
  notAvailableTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, textAlign: 'center' },
  notAvailableDesc: { fontFamily: 'Inter_500Medium', fontSize: 13, textAlign: 'center', marginTop: 8 },
  bottomButton: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', height: 48, justifyContent: 'center', paddingHorizontal: 20 },
  bottomButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginRight: 8 },
  
  // Location Card
  locationCard: { borderRadius: 16, marginHorizontal: 16, borderWidth: 1, overflow: 'hidden' },
  mapPlaceholder: { height: 120, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  mapPin: { position: 'absolute', top: 38 },
  mapPinShadow: { position: 'absolute', top: 62, width: 12, height: 4, backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 10 },
  locationDetails: { padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  locationTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginBottom: 4 },
  locationDesc: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },
  mapBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 12 },
  mapBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  
  fuelSection: { marginTop: 24 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, marginLeft: 16, marginBottom: 12, letterSpacing: -0.2 },
  infoCard: { borderRadius: 16, marginHorizontal: 16, paddingVertical: 14, paddingHorizontal: 16 },
  fuelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  fuelLabel: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  stepper: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, padding: 2 },
  stepBtn: { width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', minWidth: 70, justifyContent: 'center' },
  fuelInput: { fontFamily: 'Inter_600SemiBold', fontSize: 14, textAlign: 'center', paddingVertical: 8, paddingHorizontal: 4, minWidth: 40 },
  fuelUnit: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  fuelResultRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  fuelHint: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  fuelHintText: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  estCostText: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  fuelInfoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'transparent' },
  fuelInfoLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  fuelInfoValue: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  fuelUnavailableText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 17, marginTop: 10 },
  fuelUpdatedText: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 6, textAlign: 'right' },
  fuelDisclaimer: { fontFamily: 'Inter_400Regular', fontSize: 10, lineHeight: 14, marginTop: 10, fontStyle: 'italic' },
  
  similarSection: { marginTop: 32 },
  similarScroll: { paddingHorizontal: 16, paddingVertical: 16, gap: 16 },

  quickNav: { gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  quickNavChip: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  quickNavChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },

  trustSection: { paddingHorizontal: 16, marginTop: 20 },
  trustCard: { borderRadius: 16, borderWidth: 1, padding: 16 },
  trustTitle: { fontFamily: 'Inter_700Bold', fontSize: 15, marginBottom: 12, letterSpacing: -0.2 },
  trustGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  trustItem: { flexDirection: 'row', alignItems: 'center', gap: 6, width: '50%', marginBottom: 10, paddingRight: 8 },
  trustItemText: { fontFamily: 'Inter_500Medium', fontSize: 12, flexShrink: 1 },
});
