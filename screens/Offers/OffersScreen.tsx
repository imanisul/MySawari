import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import { calculateCouponDiscount, type Coupon } from '@/services/backend/pricingEngine';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { ScreenHeader, Dashes, PF } from '@/components/profile/ProfileParts';

/**
 * Design wording, built from the coupon's own rules: "100 Rupees off on your first trip on selected
 * vehicles" style — "100 Rupees off on your trip", "10% off (up to 500 Rupees) on bookings above 2,000 Rupees".
 */
function couponTitle(c: Coupon) {
  const n = (v: number) => Number(v).toLocaleString('en-IN');
  const off = c.discountType === 'FLAT'
    ? `${n(c.discountValue)} Rupees off`
    : `${c.discountValue}% off${c.maximumDiscount ? ` (up to ${n(c.maximumDiscount)} Rupees)` : ''}`;
  return c.minimumBooking > 0 ? `${off} on bookings above ${n(c.minimumBooking)} Rupees` : `${off} on your trip`;
}

/** "30th Feb '26" */
function until(iso: string) {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const suf = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  return `${day}${suf} ${d.toLocaleString('en-GB', { month: 'short' }).toLowerCase()}’${String(d.getFullYear()).slice(2)}`;
}

/**
 * Figma "Offers and Coupons". Two variations:
 *  - from Profile: each coupon has "Book Now" — it is kept for the next checkout and Explore opens;
 *  - from the Payment Option page (?mode=apply): "Apply" puts it on this booking (checked against the trip
 *    first) and goes back.
 */
export default function OffersScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const applyMode = mode === 'apply';
  const { applyCoupon, appliedCouponCode, pricingQuote } = useSawari();
  const [toast, setToast] = React.useState(false);
  const { data: coupons = [], isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => API.getCoupons(true),
    staleTime: 5 * 60 * 1000,
  });

  const use = (c: Coupon) => {
    Haptics.selectionAsync();
    if (applyMode) {
      if (pricingQuote && calculateCouponDiscount(pricingQuote.rentalAmount, pricingQuote.driverCharge, c.code) <= 0) {
        Alert.alert('Not valid for this trip', c.minimumBooking > 0 ? `${c.code} needs a booking of at least ₹${c.minimumBooking.toLocaleString('en-IN')}.` : `${c.code} can't be used on this booking.`);
        return;
      }
      applyCoupon(c.code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Design: a "Coupon Applied" toast, then back to the Payment Option page.
      setToast(true);
      setTimeout(() => { setToast(false); router.back(); }, 900);
      return;
    }
    applyCoupon(c.code); // checked again against the trip at checkout
    router.push('/explore');
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
      <ScreenHeader title="Offers and Coupons" divider={!applyMode} />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={p.muted} />
      ) : (
        <FlatList
          data={coupons}
          keyExtractor={(c) => c.code}
          contentContainerStyle={[styles.content, coupons.length === 0 && { flexGrow: 1 }]}
          ItemSeparatorComponent={() => <Dashes style={{ marginVertical: 12 }} />}
          initialNumToRender={12}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          renderItem={({ item: c }) => {
            const applied = appliedCouponCode === c.code;
            const btn = (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${applyMode ? 'Apply' : 'Book now with'} coupon ${c.code}, ${couponTitle(c)}`}
                onPress={() => use(c)}
                disabled={applyMode && applied}
                style={({ pressed }) => [styles.btn, { backgroundColor: applied ? p.greenBg : p.soft, borderColor: applied ? p.greenBorder : p.border }, pressed && { opacity: 0.8 }]}
              >
                <Text style={[styles.btnText, { color: applied ? p.green : p.navy }]}>{applied ? 'Applied' : applyMode ? 'Apply' : 'Book Now'}</Text>
              </Pressable>
            );
            return (
              <View style={styles.row}>
                <View style={[styles.icon, { backgroundColor: p.iconBg }]}>
                  <MaterialCommunityIcons name="ticket-percent-outline" size={18} color={p.fg} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.title, { color: p.fg }]}>{couponTitle(c)}</Text>
                  <Text style={[styles.sub, { color: p.muted }]}>Use until {until(c.expiryDate)}</Text>
                  {!applyMode && <View style={{ marginTop: 8, alignSelf: 'flex-start' }}>{btn}</View>}
                </View>
                {applyMode && btn}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="tag" size={22} color={p.fg} />
              <Text style={[styles.emptyTitle, { color: p.fg }]}>No offers right now</Text>
              <Text style={[styles.emptySub, { color: p.muted }]}>New coupons show up here. Pull down to check again.</Text>
            </View>
          }
        />
      )}
      {toast && (
        <View pointerEvents="none" style={styles.toastWrap} accessibilityLiveRegion="polite">
          <View style={[styles.toast, { backgroundColor: p.iconBg }]}>
            <Text style={[styles.toastText, { color: p.fg }]}>Coupon Applied</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: PF.medium, fontSize: 15, lineHeight: 23 },
  sub: { fontFamily: PF.regular, fontSize: 12.5, marginTop: 3 },
  btn: { height: 34, paddingHorizontal: 17, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: PF.medium, fontSize: 12 },
  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 48, alignItems: 'center' },
  toast: { paddingHorizontal: 16, height: 32, borderRadius: 8, justifyContent: 'center' },
  toastText: { fontFamily: PF.regular, fontSize: 12.5 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 },
  emptyTitle: { fontFamily: PF.medium, fontSize: 17, marginTop: 10 },
  emptySub: { fontFamily: PF.regular, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
});