import React, { useState, useRef, useEffect } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, Dimensions, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SearchSheet, CarTile } from '@/components';
import { cars } from '@/utils/sawari';

export default function CarDetailsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { explore } = useLocalSearchParams();
  const { selectedCar, mode, setMode, pickup, dateRange, duration, pickupTime, returnTime, pricingQuote, isQuoteLoading, isAuthenticated, dropoff } = useSawari();
  
  // Explore mode: user came from Explore page (no trip context) OR dates are not yet selected.
  // Search mode: user came from Search page with valid dates + destination already chosen.
  const hasValidDates = dateRange && !dateRange.includes('Select');
  const hasDestination = !!dropoff?.name;
  const cameFromExplore = explore === 'true';
  const isExplore = cameFromExplore || !hasValidDates;
  
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  
  const similarCars = cars.filter(c => c.category === selectedCar.category && c.id !== selectedCar.id).slice(0, 5);
  
  // Fuel calculator
  const [estimatedKm, setEstimatedKm] = useState('200');
  const fuelEfficiency = selectedCar.category === 'SUV' ? 12 : 16; 
  const fuelPrice = 100;
  const estFuelLiters = estimatedKm ? parseFloat(estimatedKm) / fuelEfficiency : 0;
  const estFuelCost = estFuelLiters * fuelPrice;

  const handleIncreaseKm = () => {
    const current = parseInt(estimatedKm) || 0;
    setEstimatedKm((current + 1).toString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };
  
  const handleDecreaseKm = () => {
    const current = parseInt(estimatedKm) || 0;
    const next = Math.max(0, current - 1);
    setEstimatedKm(next.toString());
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const mainScrollRef = useRef<ScrollView>(null);
  const scrollRef = useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;
  const [activeIndex, setActiveIndex] = useState(0);
  const images = (selectedCar as any).images || [selectedCar.image, selectedCar.image, selectedCar.image];

  // Reset scroll position when a new car is selected (e.g. from similar cars)
  useEffect(() => {
    mainScrollRef.current?.scrollTo({ y: 0, animated: true });
    scrollRef.current?.scrollTo({ x: 0, animated: false });
    setActiveIndex(0);
  }, [selectedCar.id]);

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(current => {
        const next = (current + 1) % images.length;
        scrollRef.current?.scrollTo({ x: next * screenWidth, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(interval);
  }, [images.length, screenWidth]);

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Sticky Header */}
      <View style={[styles.customHeader, { paddingTop: insets.top, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.headerBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>{selectedCar.name}</Text>
          <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>
            {selectedCar.seats} · {selectedCar.transmission} · {selectedCar.fuel}
          </Text>
        </View>
        <Pressable accessibilityLabel="Share" onPress={() => Haptics.selectionAsync()} style={styles.headerBtn}>
          <Feather name="share-2" size={18} color={colors.foreground} />
        </Pressable>
      </View>

      <ScrollView ref={mainScrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, isExplore && { paddingBottom: 40 }]}>
        <View style={[styles.heroWrap, { backgroundColor: colors.muted }]}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={(e) => {
              const x = e.nativeEvent.contentOffset.x;
              setActiveIndex(Math.round(x / screenWidth));
            }}
          >
            {images.map((img: any, i: number) => (
              <View key={i} style={{ width: screenWidth, height: '100%' }}>
                <Image source={img} resizeMode="cover" style={styles.hero} />
              </View>
            ))}
          </ScrollView>

          {images.length > 1 && (
            <View style={styles.paginationDots}>
              {images.map((_: any, i: number) => (
                <View 
                  key={i} 
                  style={[
                    styles.dot, 
                    activeIndex === i ? styles.activeDot : {}
                  ]} 
                />
              ))}
            </View>
          )}
        </View>
        <View style={styles.identityRow}>
          <View>
            <View style={styles.ratingRow}>
              <Feather name="star" size={12} color={colors.foreground} />
              <Text style={[styles.rating, { color: colors.mutedForeground }]}>4.8 · 214 trips</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 }}>
              <Feather name="map-pin" size={12} color={colors.mutedForeground} />
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.mutedForeground }}>MySawari Office, Downtown</Text>
            </View>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <View style={[styles.availableBadge, { backgroundColor: colors.optionSurface, marginBottom: isExplore ? 4 : 0 }]}>
              <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.badgeText, { color: colors.foreground }]}>Available</Text>
            </View>
            {isExplore && (
              <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.foreground }}>
                ₹{selectedCar.perDay.toLocaleString('en-IN')} / day
              </Text>
            )}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>About this car</Text>
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          The {selectedCar.name} is a premium {selectedCar.category} perfect for your next journey. Experience a smooth and comfortable ride with its {selectedCar.transmission.toLowerCase()} transmission and highly efficient {selectedCar.fuel.toLowerCase()} engine. It comfortably seats {parseInt(selectedCar.seats)} passengers with ample space for luggage.
        </Text>
        
        {!isExplore && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Driving option</Text>
        <View style={styles.driverModes}>
          {(['Self Drive', 'With Driver'] as const).map((option) => {
            const active = mode === option;
            return (
              <Pressable
                key={option}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => setMode(option)}
                style={[styles.driverChoice, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.tintLight : colors.card }]}
              >
                <View style={styles.driverChoiceTop}>
                  <Feather name={option === 'Self Drive' ? 'aperture' : 'user'} size={16} color={colors.foreground} />
                  <Text style={[styles.driverChoiceName, { color: colors.foreground }]}>{option}</Text>
                  <View style={[styles.radio, { backgroundColor: active ? colors.navy : colors.card, borderColor: active ? colors.navy : colors.border }]}>
                    {active && <Feather name="check" size={12} color={colors.card} />}
                  </View>
                </View>
                <Text style={[styles.driverPrice, { color: colors.mutedForeground }]}>{option === 'Self Drive' ? 'No driver charges' : '₹800/day'}</Text>
              </Pressable>
            );
          })}
        </View>
          </>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Features</Text>
        <View style={styles.features}>
          {['Sunroof', 'Rear camera', 'Bluetooth', 'Cruise control'].map((feature) => (
            <View key={feature} style={styles.feature}>
              <Feather name="check" size={16} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{feature}</Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fuel Cost Estimator</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.card, paddingVertical: 12 }]}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.foreground }}>Expected trip distance</Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 2 }}>
              <Pressable 
                onPress={handleDecreaseKm} 
                style={({ pressed }) => [{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }, pressed && { backgroundColor: colors.muted }]}
              >
                <Feather name="minus" size={14} color={colors.foreground} />
              </Pressable>
              
              <View style={{ flexDirection: 'row', alignItems: 'center', minWidth: 70, justifyContent: 'center' }}>
                <TextInput 
                  value={estimatedKm}
                  onChangeText={setEstimatedKm}
                  keyboardType="numeric"
                  maxLength={4}
                  returnKeyType="done"
                  style={{ fontFamily: 'Inter_600SemiBold', fontSize: 14, color: colors.foreground, textAlign: 'center', paddingVertical: 8, paddingHorizontal: 4, minWidth: 40 }}
                />
                <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 12, color: colors.mutedForeground }}>km</Text>
              </View>

              <Pressable 
                onPress={handleIncreaseKm} 
                style={({ pressed }) => [{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center', borderRadius: 8 }, pressed && { backgroundColor: colors.muted }]}
              >
                <Feather name="plus" size={14} color={colors.foreground} />
              </Pressable>
            </View>
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: 10 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Feather name="droplet" size={12} color={colors.mutedForeground} />
              <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: colors.mutedForeground }}>Based on ~{fuelEfficiency} km/l</Text>
            </View>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.foreground }}>Est. Cost: ₹{Math.round(estFuelCost || 0).toLocaleString('en-IN')}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Important Policies</Text>
        <View style={styles.features}>
          <View style={[styles.feature, { width: '100%' }]}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.mutedForeground, flexShrink: 1 }]}>Valid Original DL & Govt ID required at pickup.</Text>
          </View>
          <View style={[styles.feature, { width: '100%' }]}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.mutedForeground, flexShrink: 1 }]}>Fuel is not included. Please return with same fuel level.</Text>
          </View>
          <View style={[styles.feature, { width: '100%' }]}>
            <Feather name="info" size={14} color={colors.primary} />
            <Text style={[styles.featureText, { color: colors.mutedForeground, flexShrink: 1 }]}>Speed limit is 100 km/h. Penalties apply for overspeeding.</Text>
          </View>
        </View>

        {!isExplore && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rental information</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <InfoRow label="Pickup" value={`${pickup?.name || 'Current Location'}, ${pickupTime}`} />
          <InfoRow label="Duration" value={`${dateRange} · ${duration}`} />
          <InfoRow label="Return" value={`${pickup?.name || 'Current Location'}, ${returnTime}`} last />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Price details</Text>
        <View style={styles.priceDetails}>
          {isQuoteLoading || !pricingQuote ? (
            <Text style={{ color: colors.mutedForeground, marginVertical: 12 }}>Calculating price...</Text>
          ) : (
            <>
              <PriceRow label={`Trip Distance · ${pricingQuote.distanceKm} km (₹${pricingQuote.ratePerKm}/km)`} value={`₹${(pricingQuote.rentalAmount - pricingQuote.driverCharge).toLocaleString('en-IN')}`} />
              
              {pricingQuote.driverCharge > 0 && (
                <PriceRow label="Driver charges" value={`₹${pricingQuote.driverCharge.toLocaleString('en-IN')}`} />
              )}
              
              {pricingQuote.pickupCharge > 0 ? (
                <PriceRow label={`${pricingQuote.pickupLocationName} Delivery`} value={`₹${pricingQuote.pickupCharge.toLocaleString('en-IN')}`} />
              ) : (
                <PriceRow label="MySawari Office Pickup" value="FREE" accent={false} />
              )}
              
              <View style={[styles.payTodayRow, { borderTopColor: colors.border, marginTop: 12, paddingTop: 12 }]}>
                <Text style={[styles.payTodayLabel, { color: colors.foreground, fontFamily: 'Inter_600SemiBold' }]}>Total Trip Cost</Text>
                <Text style={[styles.payTodayValue, { color: colors.foreground, fontFamily: 'Inter_700Bold' }]}>₹{(pricingQuote.discountedRentalAmount + pricingQuote.pickupCharge).toLocaleString('en-IN')}</Text>
              </View>
              
              <View style={[styles.payTodayRow, { borderTopColor: colors.border, marginTop: 12, paddingTop: 12 }]}>
                <Text style={[styles.payTodayLabel, { color: colors.mutedForeground }]}>Booking Advance (Pay today)</Text>
                <Text style={[styles.payTodayValue, { color: colors.foreground }]}>₹{pricingQuote.onlinePayableNow.toLocaleString('en-IN')}</Text>
              </View>
              {pricingQuote.remainingRentalAmount > 0 && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 }}>
                  <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>Payable at {pricingQuote.pickupType === 'OFFICE' ? 'Office' : 'Handover'}</Text>
                  <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>₹{pricingQuote.remainingRentalAmount.toLocaleString('en-IN')}</Text>
                </View>
              )}
            </>
          )}
        </View>
          </>
        )}

        {similarCars.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 24 }]}>Similar Cars</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false} 
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 16 }}
            >
              {similarCars.map(car => (
                <CarTile key={car.id} car={car} />
              ))}
            </ScrollView>
          </>
        )}
      </ScrollView>
      {!isExplore && (
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 14) }]}>
        <View>
          <Text style={[styles.bottomLabel, { color: colors.mutedForeground }]}>Pay today</Text>
          <Text style={[styles.bottomPrice, { color: colors.foreground }]}>₹{pricingQuote?.onlinePayableNow.toLocaleString('en-IN') || 0}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          testID="confirm-booking"
          onPress={() => router.push(isAuthenticated ? '/booking' : '/login')}
          style={({ pressed }) => [styles.bottomButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
        >
          <Text style={[styles.bottomButtonText, { color: colors.primaryForeground }]}>Confirm Booking</Text>
          <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
        </Pressable>
      </View>
      )}
      
      {isExplore && (
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 14) }]}>
          <View>
            <Text style={[styles.bottomLabel, { color: colors.mutedForeground }]}>Starting from</Text>
            <Text style={[styles.bottomPrice, { color: colors.foreground }]}>{selectedCar.price}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            testID="book-now"
            onPress={() => {
              Haptics.selectionAsync();
              setShowSearchSheet(true);
            }}
            style={({ pressed }) => [styles.bottomButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
          >
            <Text style={[styles.bottomButtonText, { color: colors.primaryForeground }]}>Book Now</Text>
            <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
          </Pressable>
        </View>
      )}

      <SearchSheet 
        visible={showSearchSheet} 
        onClose={() => setShowSearchSheet(false)} 
        onContinue={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowSearchSheet(false);
          router.push(isAuthenticated ? '/booking' : '/login');
        }}
      />
    </View>
  );
}


function InfoRow({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.infoRow, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function PriceRow({ label, value, accent = false, strong = false, last = false }: { label: string; value: string; accent?: boolean; strong?: boolean; last?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.priceRow, !last && { marginBottom: 12 }]}>
      <Text style={[strong ? styles.priceLabelStrong : styles.priceLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[strong ? styles.priceValueStrong : styles.priceValue, { color: accent ? colors.success : colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 116 },
  customHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 10, borderBottomWidth: 1 },
  headerBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, textAlign: 'center' },
  heroWrap: { height: 220, position: 'relative' },
  hero: { height: '100%', width: '100%' },
  identityRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12 },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 2 },
  rating: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  availableBadge: { alignItems: 'center', borderRadius: 99, flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6 },
  badgeDot: { borderRadius: 99, height: 6, marginRight: 5, width: 6 },
  badgeText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginLeft: 16, marginTop: 20, marginBottom: 4 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20, marginHorizontal: 16, marginTop: 4 },
  driverModes: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, paddingTop: 8 },
  driverChoice: { borderRadius: 14, borderWidth: 1, flex: 1, minHeight: 74, padding: 12 },
  driverChoiceTop: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  driverChoiceName: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  driverPrice: { fontFamily: 'Inter_400Regular', fontSize: 11, marginLeft: 24, marginTop: 6 },
  radio: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 16, justifyContent: 'center', width: 16 },
  features: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, paddingTop: 8, rowGap: 10 },
  feature: { alignItems: 'center', flexDirection: 'row', width: '50%' },
  featureText: { fontFamily: 'Inter_400Regular', fontSize: 13, marginLeft: 8 },
  infoCard: { borderRadius: 14, marginHorizontal: 16, marginTop: 8, paddingHorizontal: 14 },
  infoRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 46 },
  infoLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  infoValue: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  priceDetails: { marginHorizontal: 16, marginTop: 12 },
  priceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  priceLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  priceValue: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  priceLabelStrong: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  priceValueStrong: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  payTodayRow: { alignItems: 'baseline', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12 },
  payTodayLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  payTodayValue: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.5 },
  bottomBar: { alignItems: 'center', borderTopWidth: 1, bottom: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, position: 'absolute', width: '100%' },
  bottomLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  bottomPrice: { fontFamily: 'Inter_700Bold', fontSize: 20, marginTop: 2, letterSpacing: -0.5 },
  bottomButton: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', height: 48, justifyContent: 'center', paddingHorizontal: 20 },
  bottomButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginRight: 8 },
  pressed: { opacity: 0.7 },
  paginationDots: { position: 'absolute', bottom: 16, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.4)' },
  activeDot: { width: 16, height: 6, backgroundColor: '#FFF' },
});