import React, { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SearchSheet } from '@/components';

export default function CarDetailsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { explore } = useLocalSearchParams();
  const isExplore = explore === 'true';
  const [showSearchSheet, setShowSearchSheet] = useState(false);
  const { selectedCar, mode, setMode, pickup, dateRange, duration, pickupTime, returnTime, pricingQuote, isQuoteLoading, isAuthenticated } = useSawari();

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, isExplore && { paddingBottom: 40 }]}>
        <View style={[styles.heroWrap, { backgroundColor: colors.muted, height: 250 + insets.top, paddingTop: insets.top }]}>
          <Image source={selectedCar.image} resizeMode="contain" style={styles.hero} />
          <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={[styles.circleButton, { backgroundColor: colors.card, top: Math.max(insets.top + 10, 20) }]}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <Pressable accessibilityLabel="Share" onPress={() => Haptics.selectionAsync()} style={[styles.shareButton, { backgroundColor: colors.card, top: Math.max(insets.top + 10, 20) }]}>
            <Feather name="share-2" size={18} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.identityRow}>
          <View>
            <Text style={[styles.name, { color: colors.foreground }]}>{selectedCar.name}</Text>
            <View style={styles.ratingRow}>
              <Feather name="star" size={12} color={colors.foreground} />
              <Text style={[styles.rating, { color: colors.mutedForeground }]}>4.8 · 214 trips</Text>
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
        <View style={styles.specRow}>
          <Spec icon="users" label={selectedCar.seats} />
          <Spec icon="settings" label={selectedCar.transmission} />
          <Spec icon="database" label={selectedCar.fuel} />
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
      </ScrollView>
      {!isExplore && (
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
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
        <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
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

function Spec({ icon, label }: { icon: React.ComponentProps<typeof Feather>['name']; label: string }) {
  const colors = useColors();
  return (
    <View style={[styles.spec, { backgroundColor: colors.surfaceSoft, borderColor: colors.border }]}>
      <Feather name={icon} size={15} color={colors.mutedForeground} />
      <Text style={[styles.specText, { color: colors.foreground }]}>{label}</Text>
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
  heroWrap: { height: 250, position: 'relative' },
  hero: { height: '100%', width: '100%' },
  circleButton: { alignItems: 'center', borderRadius: 99, height: 40, justifyContent: 'center', left: 16, position: 'absolute', top: 50, width: 40 },
  shareButton: { alignItems: 'center', borderRadius: 99, height: 40, justifyContent: 'center', position: 'absolute', right: 16, top: 50, width: 40 },
  identityRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingTop: 16 },
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 24 },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 6 },
  rating: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  availableBadge: { alignItems: 'center', borderRadius: 99, flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6 },
  badgeDot: { borderRadius: 99, height: 6, marginRight: 5, width: 6 },
  badgeText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  specRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingTop: 18 },
  spec: { alignItems: 'center', borderRadius: 16, borderWidth: 1, flex: 1, gap: 10, paddingVertical: 18 },
  specText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginLeft: 18, marginTop: 28, marginBottom: 4 },
  description: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22, marginHorizontal: 18, marginTop: 8 },
  driverModes: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingTop: 11 },
  driverChoice: { borderRadius: 16, borderWidth: 1, flex: 1, minHeight: 84, padding: 14 },
  driverChoiceTop: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  driverChoiceName: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  driverPrice: { fontFamily: 'Inter_400Regular', fontSize: 12, marginLeft: 24, marginTop: 10 },
  radio: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 18, justifyContent: 'center', width: 18 },
  features: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, paddingTop: 10, rowGap: 14 },
  feature: { alignItems: 'center', flexDirection: 'row', width: '50%' },
  featureText: { fontFamily: 'Inter_400Regular', fontSize: 14, marginLeft: 10 },
  infoCard: { borderRadius: 16, marginHorizontal: 18, marginTop: 10, paddingHorizontal: 16 },
  infoRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 52 },
  infoLabel: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  infoValue: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  priceDetails: { marginHorizontal: 18, marginTop: 16 },
  priceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  priceValue: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  priceLabelStrong: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  priceValueStrong: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  payTodayRow: { alignItems: 'baseline', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, paddingTop: 18 },
  payTodayLabel: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  payTodayValue: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.5 },
  disclaimer: { fontFamily: 'Inter_400Regular', fontSize: 11, lineHeight: 16, marginTop: 12 },
  bottomBar: { alignItems: 'center', borderTopWidth: 1, bottom: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 14, position: 'absolute', width: '100%' },
  bottomLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  bottomPrice: { fontFamily: 'Inter_700Bold', fontSize: 20, marginTop: 2, letterSpacing: -0.5 },
  bottomButton: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', height: 54, justifyContent: 'center', paddingHorizontal: 22 },
  bottomButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginRight: 8 },
  pressed: { opacity: 0.7 },
});