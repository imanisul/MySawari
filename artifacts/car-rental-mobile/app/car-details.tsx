import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export default function CarDetailsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectedCar, mode, setMode, pickup, dateRange, duration, pickupTime, returnTime } = useSawari();
  const rental = selectedCar.perDay * 3;
  const additional = mode === 'With Driver' ? 2400 : 500;
  const discount = 300;
  const payToday = rental + additional - discount;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.heroWrap}>
          <Image source={selectedCar.image} resizeMode="cover" style={styles.hero} />
          <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={[styles.circleButton, { backgroundColor: colors.card }]}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </Pressable>
          <Pressable accessibilityLabel="Share" onPress={() => Haptics.selectionAsync()} style={[styles.shareButton, { backgroundColor: colors.card }]}>
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
          <View style={[styles.availableBadge, { backgroundColor: colors.optionSurface }]}>
            <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.badgeText, { color: colors.foreground }]}>Available</Text>
          </View>
        </View>
        <View style={styles.specRow}>
          <Spec icon="users" label={selectedCar.seats} />
          <Spec icon="settings" label={selectedCar.transmission} />
          <Spec icon="database" label={selectedCar.fuel} />
        </View>
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
                style={[styles.driverChoice, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.optionSurface : colors.card }]}
              >
                <View style={styles.driverChoiceTop}>
                  <Feather name={option === 'Self Drive' ? 'disc' : 'user'} size={14} color={colors.foreground} />
                  <Text style={[styles.driverChoiceName, { color: colors.foreground }]}>{option}</Text>
                  <View style={[styles.radio, { backgroundColor: active ? colors.navy : colors.card, borderColor: active ? colors.navy : colors.border }]}>
                    {active && <Feather name="check" size={11} color={colors.primary} />}
                  </View>
                </View>
                <Text style={[styles.driverPrice, { color: colors.mutedForeground }]}>{option === 'Self Drive' ? 'No driver charges' : '₹800/day'}</Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Features</Text>
        <View style={styles.features}>
          {['Sunroof', 'Rear camera', 'Bluetooth', 'Cruise control'].map((feature) => (
            <View key={feature} style={styles.feature}>
              <Feather name="check" size={14} color={colors.success} />
              <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{feature}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Rental information</Text>
        <View style={[styles.infoCard, { backgroundColor: colors.card }]}>
          <InfoRow label="Pickup" value={`${pickup}, ${pickupTime}`} />
          <InfoRow label="Duration" value={`${dateRange} · ${duration}`} />
          <InfoRow label="Return" value={`${pickup}, ${returnTime}`} last />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Price details</Text>
        <View style={styles.priceDetails}>
          <PriceRow label={`Vehicle rental · ${duration}`} value={`₹${rental.toLocaleString('en-IN')}`} />
          <PriceRow label="Additional charges" value={`₹${additional.toLocaleString('en-IN')}`} />
          <PriceRow label="Discount" value={`-₹${discount.toLocaleString('en-IN')}`} accent />
          <PriceRow label="Security deposit (refundable)" value="₹2,000" />
          <PriceRow label="Pay today" value={`₹${payToday.toLocaleString('en-IN')}`} strong last />
        </View>
      </ScrollView>
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <View>
          <Text style={[styles.bottomLabel, { color: colors.mutedForeground }]}>Pay today</Text>
          <Text style={[styles.bottomPrice, { color: colors.foreground }]}>₹{payToday.toLocaleString('en-IN')}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          testID="confirm-booking"
          onPress={() => router.push('/booking')}
          style={({ pressed }) => [styles.bottomButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
        >
          <Text style={[styles.bottomButtonText, { color: colors.primaryForeground }]}>Confirm Booking</Text>
          <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
        </Pressable>
      </View>
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
  name: { fontFamily: 'Inter_600SemiBold', fontSize: 20 },
  ratingRow: { alignItems: 'center', flexDirection: 'row', gap: 5, marginTop: 6 },
  rating: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  availableBadge: { alignItems: 'center', borderRadius: 99, flexDirection: 'row', paddingHorizontal: 10, paddingVertical: 6 },
  badgeDot: { borderRadius: 99, height: 6, marginRight: 5, width: 6 },
  badgeText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  specRow: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingTop: 18 },
  spec: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flex: 1, gap: 8, paddingVertical: 14 },
  specText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginLeft: 18, marginTop: 24 },
  driverModes: { flexDirection: 'row', gap: 12, paddingHorizontal: 18, paddingTop: 11 },
  driverChoice: { borderRadius: 13, borderWidth: 1, flex: 1, minHeight: 74, padding: 10 },
  driverChoiceTop: { alignItems: 'center', flexDirection: 'row', gap: 8 },
  driverChoiceName: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 12 },
  driverPrice: { fontFamily: 'Inter_400Regular', fontSize: 10, marginLeft: 22, marginTop: 9 },
  radio: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 17, justifyContent: 'center', width: 17 },
  features: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, paddingTop: 10, rowGap: 10 },
  feature: { alignItems: 'center', flexDirection: 'row', width: '50%' },
  featureText: { fontFamily: 'Inter_400Regular', fontSize: 11, marginLeft: 7 },
  infoCard: { borderRadius: 13, marginHorizontal: 18, marginTop: 10, paddingHorizontal: 12 },
  infoRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 42 },
  infoLabel: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  infoValue: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  priceDetails: { marginHorizontal: 18, marginTop: 12 },
  priceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  priceLabel: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  priceValue: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  priceLabelStrong: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  priceValueStrong: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  bottomBar: { alignItems: 'center', borderTopWidth: 1, bottom: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 11, position: 'absolute', width: '100%' },
  bottomLabel: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  bottomPrice: { fontFamily: 'Inter_600SemiBold', fontSize: 17, marginTop: 3 },
  bottomButton: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', height: 50, justifyContent: 'center', paddingHorizontal: 18 },
  bottomButtonText: { fontFamily: 'Inter_500Medium', fontSize: 12, marginRight: 8 },
  pressed: { opacity: 0.7 },
});