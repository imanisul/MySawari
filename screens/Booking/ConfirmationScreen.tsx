import React from 'react';
import { BlurHost, BlurTarget, BottomBlur } from '@/components/common/BottomBlur';
import { Animated, BackHandler, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadingImage } from '@/components/common/LoadingImage';
import { useSawari } from '@/context/SawariContext';
import { bookingsQueryOptions } from '@/hooks/useHomeData';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { PricingSummary, tripTotal, shortDate } from '@/components/booking/TripDetailParts';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

const FONT = { regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold' };

const NEXT = [
  'Host contact details are available in your booking.',
  "We'll notify you about your booking and pickup instructions.",
  'You can extend, manage or cancel your trip from My Trips.',
];

/**
 * Figma "Your car is booked!": shown once the server has confirmed the booking (payment-processing). The
 * booking itself (code, dates, prices) is the server's saved booking (`lastBooking`).
 */
export default function ConfirmationScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { selectedCar, mode, dateRange, duration, pickupTime, returnTime, pricingQuote, lastBooking } = useSawari();

  // The new booking shows on Home and in My Trips straight away.
  React.useEffect(() => {
    queryClient.invalidateQueries({ queryKey: ['bookings'] });
  }, [queryClient]);

  const b = lastBooking;
  const { data: allBookings } = useQuery(bookingsQueryOptions);
  const matched = (allBookings || []).find((x) => (b?.id && x.id === b.id) || (b?.bookingCode && x.bookingCode === b.bookingCode));
  const effective = matched ? { ...b, ...matched } : b;
  const rawCode = (effective?.bookingCode || b?.bookingCode || (effective?.id || b?.id)?.slice(-6).toUpperCase() || '').replace(/^#/, '');
  const displayId = rawCode ? `#${rawCode}` : '—';

  const [startLabel, endLabel] = (dateRange || '').split(' – ');
  const from = `${shortDate(effective?.pickupDate || b?.pickupDate || startLabel)}, ${(effective?.pickupTime || b?.pickupTime || pickupTime || '').replace(/^0/, '')}`;
  const to = `${shortDate(effective?.returnDate || b?.returnDate || endLabel)}, ${(effective?.dropTime || b?.dropTime || returnTime || '').replace(/^0/, '')}`;
  const days = effective?.rentalDays || b?.rentalDays || parseInt(String(duration), 10) || pricingQuote?.rentalDays || 1;
  const driver = (effective as any)?.driverMode === 'with-driver' || (b as any)?.driverMode === 'with-driver' || mode === 'With Driver' ? 'With Driver' : 'Self Drive';
  const total = effective ? tripTotal(effective) : (b ? tripTotal(b) : Math.max(0, (pricingQuote?.onlinePayableNow || 0) + (pricingQuote?.remainingRentalAmount || 0)));

  // The tick pops in, then the rest of the page rises in under it.
  const pop = React.useRef(new Animated.Value(0)).current;
  const rise = React.useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.sequence([
      Animated.spring(pop, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }),
      Animated.timing(rise, { toValue: 1, duration: 360, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [pop, rise]);
  const riseStyle = { opacity: rise, transform: [{ translateY: rise.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] };

  const openBooking = React.useCallback(() => {
    const targetId = effective?.id || b?.id || (effective as any)?._id || (b as any)?._id;
    if (targetId) {
      router.replace({ pathname: '/booking-detail', params: { id: targetId, fromConfirmation: 'true' } } as any);
    } else {
      router.replace('/bookings');
    }
  }, [effective, b, router]);

  // Handle hardware back press: navigate directly to booking view instead of returning to payment/booking checkout
  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      openBooking();
      return true;
    });
    return () => sub.remove();
  }, [openBooking]);

  return (
    <BlurHost style={[styles.screen, { backgroundColor: p.page }]}>
     <BlurTarget style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 62, paddingBottom: 130 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.check, { backgroundColor: p.green, opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]}>
          <Feather name="check" size={46} color="#FFFFFF" />
        </Animated.View>
        <Animated.View style={riseStyle}>
          <Text style={[styles.title, { color: p.fg }]} accessibilityRole="header">Your car is booked!</Text>
          <Text style={[styles.sub, { color: p.sub }]}>Your booking is confirmed. Get ready to hit the road!</Text>

          <Pressable onPress={openBooking} style={[styles.idPill, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]} accessibilityRole="button" accessibilityLabel={`Booking ID ${displayId}`}>
            <Text style={[styles.idText, { color: p.navy }]} selectable>Booking ID: {displayId}</Text>
          </Pressable>

          <View style={[styles.card, { borderColor: p.deliveryBorder }]}>
            <Pressable onPress={openBooking} style={styles.carRow} accessibilityRole="button" accessibilityLabel="View booking details">
              <View style={[styles.carImage, { backgroundColor: p.iconBg }]}>
                <LoadingImage source={selectedCar.image} style={StyleSheet.absoluteFill} contentFit="cover" />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                {!!selectedCar.manufacturer && <Text style={[styles.brand, { color: p.muted }]} numberOfLines={1}>{selectedCar.manufacturer}</Text>}
                <Text style={[styles.carName, { color: p.fg }]} numberOfLines={1}>{b?.vehicleName || selectedCar.name}</Text>
                <Text style={[styles.meta, { color: p.muted }]} numberOfLines={2}>{from} → {to}</Text>
                <Text style={[styles.meta, { color: p.muted }]}>{driver}  •  {days} day{days === 1 ? '' : 's'}</Text>
                <Text style={[styles.price, { color: p.fg }]}>{formatCurrency(total)}</Text>
              </View>
            </Pressable>

            <View style={[styles.next, { borderColor: p.deliveryBorder }]}>
              <Text style={[styles.nextTitle, { color: p.fg }]}>What’s next</Text>
              <View style={styles.dashes}>
                {Array.from({ length: 70 }, (_, i) => <View key={i} style={[styles.dash, { backgroundColor: p.deliveryBorder }]} />)}
              </View>
              <View style={{ gap: 10 }}>
                {NEXT.map((t) => (
                  <View key={t} style={styles.nextRow}>
                    <View style={[styles.tick, { backgroundColor: p.green }]}>
                      <Feather name="check" size={8} color="#FFFFFF" />
                    </View>
                    <Text style={[styles.nextText, { color: p.sub }]}>{t}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {b && (
            <>
              <Text style={[styles.section, { color: p.fg }]}>Pricing Summary</Text>
              <PricingSummary booking={b} />
            </>
          )}
        </Animated.View>
      </ScrollView>
     </BlurTarget>

      <View pointerEvents="box-none" style={styles.footerWrap}>
        <View pointerEvents="none" style={styles.fade}><BottomBlur height={64} fadeTo={p.page} /></View>
        <View style={[styles.footer, { backgroundColor: p.page, borderTopColor: p.deliveryBorder, paddingBottom: Math.max(insets.bottom, 12) + 4 }]}>
          <Pressable accessibilityRole="button" onPress={openBooking} style={({ pressed }) => [styles.cta, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}>
            <Text style={styles.ctaText}>View my booking</Text>
          </Pressable>
        </View>
      </View>
    </BlurHost>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, alignItems: 'stretch' },
  check: { alignSelf: 'center', width: 79, height: 79, borderRadius: 39.5, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONT.semibold, fontSize: 24, lineHeight: 32, textAlign: 'center', marginTop: 34, letterSpacing: -0.2 },
  sub: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 6 },
  idPill: { borderWidth: 1, borderRadius: 8, height: 38, alignItems: 'center', justifyContent: 'center', marginTop: 26 },
  idText: { fontFamily: FONT.medium, fontSize: 14 },
  card: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 12, gap: 12 },
  carRow: { flexDirection: 'row', gap: 12 },
  carImage: { width: 120, height: 99, borderRadius: 6, overflow: 'hidden' },
  brand: { fontFamily: FONT.regular, fontSize: 11, lineHeight: 16 },
  carName: { fontFamily: FONT.medium, fontSize: 14, lineHeight: 20, marginTop: 1 },
  meta: { fontFamily: FONT.regular, fontSize: 11, lineHeight: 16, marginTop: 3 },
  price: { fontFamily: FONT.semibold, fontSize: 14, lineHeight: 20, marginTop: 4 },
  next: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingTop: 12, paddingBottom: 14 },
  nextTitle: { fontFamily: FONT.medium, fontSize: 13, lineHeight: 19 },
  dashes: { flexDirection: 'row', gap: 3, overflow: 'hidden', marginTop: 10, marginBottom: 14 },
  dash: { width: 4, height: 1 },
  nextRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tick: { width: 10, height: 10, borderRadius: 5, alignItems: 'center', justifyContent: 'center', marginTop: 3.5 },
  nextText: { flex: 1, fontFamily: FONT.regular, fontSize: 11, lineHeight: 17 },
  section: { fontFamily: FONT.medium, fontSize: 16, lineHeight: 22, marginTop: 24, marginBottom: 10 },
  footerWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  fade: { height: 64 },
  footer: { paddingHorizontal: 16, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, boxShadow: '0px -6px 18px rgba(47, 62, 117, 0.07)' },
  cta: { height: 53, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: FONT.medium, fontSize: 16, color: '#FFFFFF' },
});