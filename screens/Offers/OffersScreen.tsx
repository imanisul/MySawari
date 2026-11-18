import React from 'react';
import { ListSkeleton } from '@/components/loading/ListSkeleton';
import { safeBack } from '@/utils/navigation';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { couponsQueryOptions } from '@/services/api/offers';
import { useSawari, useQuote } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import { calculateCouponDiscount, isCouponApplicableToVehicle, type Coupon } from '@/services/backend/pricingEngine';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { ScreenHeader, Dashes, PF } from '@/components/profile/ProfileParts';
import { CouponNotApplicableModal } from '@/components/common/CouponNotApplicableModal';
import { getIndiaDateParts, istDayMonth, formatTime12 } from '@/utils/sawari';

/**
 * Design wording, built from the coupon's own rules: "100 Rupees off on your first trip on selected
 * vehicles" style — "100 Rupees off on your trip", "10% off (up to 500 Rupees) on bookings above 2,000 Rupees".
 */
function couponTitle(c: Coupon) {
  const n = (v: number) => Number(v).toLocaleString('en-IN');
  let off: string;
  if (c.discountType === 'FLAT') {
    off = `Flat ₹${n(c.discountValue)} off`;
  } else {
    const bounds: string[] = [];
    if (c.minimumDiscount && Number(c.minimumDiscount) > 0) bounds.push(`min ₹${n(c.minimumDiscount)}`);
    if (c.maximumDiscount && Number(c.maximumDiscount) > 0) bounds.push(`up to ₹${n(c.maximumDiscount)}`);
    off = `${c.discountValue}% off${bounds.length ? ` (${bounds.join(' · ')})` : ''}`;
  }
  return c.minimumBooking > 0 ? `${off} on bookings above ₹${n(c.minimumBooking)}` : `${off} on your trip`;
}

/** Formats exact date and time e.g. "Valid until 15th nov'26 · 11:59 PM" */
function until(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const p = getIndiaDateParts(d); // India time
  const day = p.date;
  const suf = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  const dateStr = `${day}${suf} ${istDayMonth(d).split(' ')[1].toLowerCase()}’${String(p.year).slice(2)}`;
  const timeStr = formatTime12(d);
  return `${dateStr} · ${timeStr}`;
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
  const { applyCoupon, appliedCouponCode, selectedCar } = useSawari();
  const { pricingQuote } = useQuote();
  const [toast, setToast] = React.useState(false);
  const [toastMsg, setToastMsg] = React.useState('Coupon Applied');
  const [notApplicable, setNotApplicable] = React.useState<{ code: string; reason: string } | null>(null);
  const { data: rawCoupons = [], isLoading, refetch, isRefetching } = useQuery(couponsQueryOptions);

  const currentVehicleId = selectedCar?.id || (selectedCar as any)?._id;
  const currentVehicleCategory = selectedCar?.category || (selectedCar as any)?.segment;

  // Always hide expired coupons; when opened from checkout (?mode=apply) for a specific car, ONLY show coupons valid for that car!
  const coupons = React.useMemo(() => {
    const now = Date.now();
    const live = rawCoupons.filter((c) => !c.expiryDate || new Date(c.expiryDate).getTime() > now);
    if (!applyMode || !currentVehicleId) return live;
    return live.filter((c) => isCouponApplicableToVehicle(c, currentVehicleId, currentVehicleCategory));
  }, [rawCoupons, applyMode, currentVehicleId, currentVehicleCategory]);

  const copyCode = (code: string) => {
    Clipboard.setStringAsync(code);
    Haptics.selectionAsync();
    setToastMsg(`Code ${code} Copied!`);
    setToast(true);
    setTimeout(() => setToast(false), 1200);
  };

  const use = async (c: Coupon) => {
    Haptics.selectionAsync();
    const vehicleId = currentVehicleId;
    const vehicleContext = {
      vehicleId,
      vehicleCategory: currentVehicleCategory,
    };

    if (applyMode) {
      const serverCheck = await API.validateCoupon(c.code, pricingQuote?.rentalAmount ?? 0, vehicleId);
      if (!serverCheck.offline) {
        if (!serverCheck.valid || serverCheck.discount <= 0) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setNotApplicable({
            code: c.code,
            reason: serverCheck.reason || `${c.code} cannot be applied to this booking.`,
          });
          return;
        }
      } else {
        const requiresServerVerification =
          (c.customerEligibility && c.customerEligibility !== 'all') ||
          (typeof c.firstNCustomers === 'number' && c.firstNCustomers > 0);
        if (requiresServerVerification) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setNotApplicable({
            code: c.code,
            reason: `Please connect to the internet to verify eligibility for ${c.code}.`,
          });
          return;
        }
        if (pricingQuote && calculateCouponDiscount(pricingQuote.rentalAmount, pricingQuote.driverCharge, c.code, vehicleContext) <= 0) {
          let msg = `${c.code} can't be used on this booking.`;
          if (c.expiryDate && new Date(c.expiryDate).getTime() <= Date.now()) {
            msg = `${c.code} has expired.`;
          } else if (c.minimumBooking > 0 && pricingQuote.rentalAmount < c.minimumBooking) {
            msg = `${c.code} needs a booking of at least ₹${c.minimumBooking.toLocaleString('en-IN')}.`;
          } else if (c.applicableType === 'specific_vehicles' || c.vehicleId || (c.applicableVehicleIds && c.applicableVehicleIds.length > 0)) {
            msg = `${c.code} is only valid for selected cars and cannot be applied to this vehicle.`;
          } else if (c.applicableType === 'category') {
            msg = `${c.code} is only valid for ${c.applicableCategories?.join(', ')} vehicles.`;
          }
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          setNotApplicable({ code: c.code, reason: msg });
          return;
        }
      }
      applyCoupon(c.code);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Design: a "Coupon Applied" toast, then back to the Payment Option page.
      setToastMsg('Coupon Applied');
      setToast(true);
      setTimeout(() => { setToast(false); safeBack(router); }, 900);
      return;
    }

    // Do NOT auto-apply when browsing from Profile: let the customer explicitly apply at checkout!
    const targetCarId = c.vehicleId || (Array.isArray(c.applicableVehicleIds) && c.applicableVehicleIds.length === 1 ? c.applicableVehicleIds[0] : undefined);
    if (targetCarId) {
      router.push({ pathname: '/car-details', params: { id: targetCarId, vehicleId: targetCarId } });
    } else {
      router.push('/explore');
    }
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
      <ScreenHeader title="Offers and Coupons" divider={!applyMode} />
      {isLoading ? (
        <ListSkeleton />
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
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Coupon code ${c.code}. Tap to copy`}
                      onPress={() => copyCode(c.code)}
                      style={({ pressed }) => [styles.codeBadge, { marginBottom: 0, backgroundColor: p.soft, borderColor: p.border }, pressed && { opacity: 0.7 }]}
                    >
                      <Text style={[styles.codeBadgeText, { color: p.fg }]}>{c.code}</Text>
                      <Feather name="copy" size={11} color={p.muted} />
                    </Pressable>
                    {c.isPersonalForYou && (
                      <View style={{ paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6, backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE' }}>
                        <Text style={{ fontFamily: PF.semibold || PF.medium, fontSize: 10, color: '#4338CA' }}>✨ Exclusive For You</Text>
                      </View>
                    )}
                    {typeof c.firstNCustomers === 'number' && c.firstNCustomers > 0 && (
                      <View style={{ paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6, backgroundColor: '#FEF3C7', borderWidth: 1, borderColor: '#FDE68A' }}>
                        <Text style={{ fontFamily: PF.semibold || PF.medium, fontSize: 10, color: '#B45309' }}>
                          🔥 {typeof c.remainingCustomerSlots === 'number' ? `${c.remainingCustomerSlots} of ${c.firstNCustomers} left` : `First ${c.firstNCustomers} users`}
                        </Text>
                      </View>
                    )}
                    {c.customerEligibility === 'new_customers' && (
                      <View style={{ paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6, backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0' }}>
                        <Text style={{ fontFamily: PF.semibold || PF.medium, fontSize: 10, color: '#047857' }}>First Trip Only</Text>
                      </View>
                    )}
                    {c.customerEligibility === 'members_only' && (
                      <View style={{ paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6, backgroundColor: '#F5F3FF', borderWidth: 1, borderColor: '#DDD6FE' }}>
                        <Text style={{ fontFamily: PF.semibold || PF.medium, fontSize: 10, color: '#6D28D9' }}>Members Only</Text>
                      </View>
                    )}
                    {(c.applicableType === 'specific_vehicles' || Boolean(c.vehicleId) || (Array.isArray(c.applicableVehicleIds) && c.applicableVehicleIds.length > 0 && !c.allVehicles)) && (
                      <View style={{ paddingHorizontal: 7, paddingVertical: 2.5, borderRadius: 6, backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BFDBFE' }}>
                        <Text style={{ fontFamily: PF.semibold || PF.medium, fontSize: 10, color: '#1D4ED8' }}>Selected Car Only</Text>
                      </View>
                    )}
                  </View>
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
          <View style={[styles.toast, { backgroundColor: p.iconBg, borderColor: p.border, borderWidth: 1 }]}>
            <Text style={[styles.toastText, { color: p.fg }]}>{toastMsg}</Text>
          </View>
        </View>
      )}
      <CouponNotApplicableModal
        visible={Boolean(notApplicable)}
        code={notApplicable?.code || ''}
        reason={notApplicable?.reason || ''}
        carName={selectedCar?.name}
        onClose={() => setNotApplicable(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 40 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  icon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  codeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    marginBottom: 4,
  },
  codeBadgeText: { fontFamily: PF.bold || PF.medium, fontSize: 11.5, letterSpacing: 0.5 },
  title: { fontFamily: PF.medium, fontSize: 15, lineHeight: 22 },
  sub: { fontFamily: PF.regular, fontSize: 12, marginTop: 3 },
  btn: { height: 34, paddingHorizontal: 17, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: PF.medium, fontSize: 12 },
  toastWrap: { position: 'absolute', left: 0, right: 0, bottom: 48, alignItems: 'center' },
  toast: { paddingHorizontal: 16, height: 34, borderRadius: 8, justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6, elevation: 4 },
  toastText: { fontFamily: PF.regular, fontSize: 12.5 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 },
  emptyTitle: { fontFamily: PF.medium, fontSize: 17, marginTop: 10 },
  emptySub: { fontFamily: PF.regular, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
});