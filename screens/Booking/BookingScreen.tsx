import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BlurHost, BottomBlur } from '@/components/common/BottomBlur';
import { BlurTargetView } from 'expo-blur';
import { BlurTargetProvider } from '@/components/common/BlurTargetContext';
import { Alert, LayoutAnimation, Pressable, ScrollView, StyleSheet, Text, TextInput, View, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useTrackTripProgress } from '@/hooks/useTrackTripProgress';
import { useSawari } from '@/context/SawariContext';
import { checkCarAvailability } from '@/utils/sawari';
import { LoadingImage } from '@/components/common/LoadingImage';
import { API } from '@/services/backend/api';
import { ActivityAPI } from '@/services/api/activity';
import { useVehicles } from '@/hooks/useVehicles';
import { calculateCouponDiscount, formatCurrency, MYSAWARI_HUB_NAME } from '@/services/backend/pricingEngine';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { useTripPrice } from '@/components/vehicle/details/useTripPrice';
import { getAutoApplyCash } from '@/utils/cashPreference';
import { StickyBookingBar } from '@/components/vehicle/details/StickyBookingBar';
import { MembershipSavedPopup, MembershipCelebration } from '@/components/vehicle/details/MembershipSavedPopup';
import { DesignToggle } from '@/components/profile/ProfileParts';
import { LoginBottomSheet } from '@/components';

/**
 * "Payment Option" (Figma): opened by Book Now on the car page. Review the car and trip, choose pickup /
 * return, apply a coupon, use SawariCash, see membership savings, then "Pay ₹500 & Book" goes straight to
 * the secure payment (payment-processing: vehicle hold → Razorpay → booking), as "Continue to payment" did.
 * Every price is the shared pricing quote, the same one the server re-checks when the booking is saved.
 */

const FONT = { regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold', bold: 'PlusJakartaSans_700Bold' };
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Same plans as the Membership page (rate, per-trip cap and annual cap as the server applies them).
const PLANS = [
  { key: 'starter', name: 'Starter', price: 999, pct: 0.05, pctLabel: '5%', perTripCap: 499, annual: '10K', icon: require('@/assets/images/plan_starter.png'), iconSize: 16 },
  { key: 'plus', name: 'Plus', price: 1999, pct: 0.10, pctLabel: '10%', perTripCap: 799, annual: '15K', icon: require('@/assets/images/plan_plus.png'), iconSize: 17 },
  { key: 'pro', name: 'Pro', price: 2999, pct: 0.125, pctLabel: '12.5%', perTripCap: 999, annual: '20K', icon: require('@/assets/images/plan_pro.png'), iconSize: 16 },
] as const;

/** "10 Aug" + "12:00 PM" → "Thu, 10 Aug '26, 12:00PM" (a month already behind us belongs to next year). */
function longWhen(label?: string, time?: string) {
  const [d, m] = (label || '').trim().split(' ');
  const mi = MONTHS.indexOf((m || '').slice(0, 3));
  if (!d || mi < 0) return label || '';
  const now = new Date();
  const year = now.getFullYear() + (mi < now.getMonth() ? 1 : 0);
  const date = new Date(year, mi, parseInt(d, 10));
  const t = (time || '').replace(/^0/, '').replace(' ', '');
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[mi]} '${String(year).slice(2)}${t ? `, ${t}` : ''}`;
}
/** "10 Aug", "10:00 AM" → "Fri, 10:00 AM". */
function dayAndTime(label?: string, time?: string) {
  const full = longWhen(label, '');
  const day = full.split(',')[0];
  return [day, (time || '').replace(/^0/, '')].filter(Boolean).join(', ');
}

export default function BookingScreen() {
  const blurTarget = useRef<View | null>(null);
  useTrackTripProgress('booking'); // Recent searches resume this trip on this page
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    mode, setMode, selectedCar, pickup, dropoff, returnAddress, isDeliveryRequested, setIsDeliveryRequested,
    deliveryMode, setDeliveryMode, dateRange, pickupTime, returnTime, customer, isAuthenticated,
    pricingQuote, isQuoteLoading, applyCoupon, appliedCouponCode, sawariCash, sawariCashToApply, applySawariCash, membership,
    refreshQuote, planToBuy, setPlanToBuy,
  } = useSawari();
  const [celebrate, setCelebrate] = useState<{ name: string; price: number; save: number; pctLabel: string } | null>(null);
  const price = useTripPrice(!!dateRange && !dateRange.includes('Select'));

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Profile → "My Sawari Cash" switched on: start this checkout with the cash applied (once; the switch
  // below still turns it off for this trip).
  const cashPrefDone = React.useRef(false);
  useEffect(() => {
    if (cashPrefDone.current || !isAuthenticated || sawariCash <= 0) return;
    cashPrefDone.current = true;
    getAutoApplyCash(customer?.id).then((on) => { if (on && sawariCashToApply === 0) applySawariCash(sawariCash); });
  }, [isAuthenticated, sawariCash]); // eslint-disable-line react-hooks/exhaustive-deps
  const [couponInput, setCouponInput] = useState('');
  const [couponError, setCouponError] = useState<string | null>(null);
  const [coupons, setCoupons] = useState<{ code: string }[]>([]);
  // Membership plans stay folded until the row is tapped (design).
  const [showPlans, setShowPlans] = useState(() => !!planToBuy); // open when a plan was already picked on car details

  useEffect(() => {
    ActivityAPI.logActivity('initiate_checkout', 'BookingScreen', { carId: selectedCar?.id });
    API.getCoupons().then((list) => setCoupons(list || [])).catch(() => setCoupons([]));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // A plausible full number, settled briefly, so a lead isn't sent per keystroke.
    if (!selectedCar || !/^\d{10}$/.test(customer?.mobile || '')) return;
    const timer = setTimeout(() => {
      API.trackLead({ mobileNumber: customer.mobile, customerName: customer.name, vehicleId: selectedCar.id, vehicleName: selectedCar.name, lastPageVisited: 'checkout' });
    }, 600);
    return () => clearTimeout(timer);
  }, [customer?.mobile, selectedCar?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // A pickup/drop address is only needed when that service is chosen; picking up at the hub needs none.
  const deliverPickup = isDeliveryRequested && (deliveryMode === 'delivery' || deliveryMode === 'both');
  const collectReturn = isDeliveryRequested && (deliveryMode === 'return' || deliveryMode === 'both');
  const isMissingPickup = deliverPickup && !pickup?.name;
  const isMissingDrop = collectReturn && !returnAddress?.name;
  const isMissingDates = !dateRange || dateRange.includes('Select');
  const isMissingDestination = !dropoff?.name;

  const [startStr, endStr] = (dateRange || '').split(' – ');
  // Checked against the live fleet, not the copy saved when the car was tapped.
  const { data: liveVehicles } = useVehicles();
  const liveCar = liveVehicles?.find((v) => v.id === selectedCar.id) || selectedCar;
  const isVehicleAvailable = isMissingDates ? true : checkCarAvailability(liveCar, startStr, endStr);
  const highDemand = (liveCar?.bookedRanges?.length ?? 0) >= 2;

  /** Pickup at the hub or delivered; return at the hub or collected — kept in the context's delivery mode. */
  const setService = (pick: boolean, ret: boolean) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (!pick && !ret) { setIsDeliveryRequested(false); return; }
    setIsDeliveryRequested(true);
    setDeliveryMode(pick && ret ? 'both' : pick ? 'delivery' : 'return');
  };
  const choosePickup = () => {
    Haptics.selectionAsync();
    Alert.alert('Pickup', 'Where would you like to get the car?', [
      { text: `Pick up at ${MYSAWARI_HUB_NAME}`, onPress: () => setService(false, collectReturn) },
      { text: 'Deliver to my location', onPress: () => { setService(true, collectReturn); router.push({ pathname: '/address-search', params: { kind: 'pickup' } }); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
  const chooseReturn = () => {
    Haptics.selectionAsync();
    Alert.alert('Return', 'Where will you return the car?', [
      { text: `Return at ${MYSAWARI_HUB_NAME}`, onPress: () => setService(deliverPickup, false) },
      { text: 'Collect from my location', onPress: () => { setService(deliverPickup, true); router.push({ pathname: '/address-search', params: { kind: 'return' } }); } },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
  const chooseDriver = () => {
    Haptics.selectionAsync();
    Alert.alert('Driving option', undefined, [
      { text: 'Self Drive', onPress: () => setMode('Self Drive') },
      { text: 'With Driver (₹1,400/day)', onPress: () => setMode('With Driver') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // A code that gives nothing off is refused here, with the same rule the booking uses.
  const handleApplyCoupon = async (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    Haptics.selectionAsync();
    setCouponError(null);
    await API.getCoupons().catch(() => []);
    if (pricingQuote && calculateCouponDiscount(pricingQuote.rentalAmount, pricingQuote.driverCharge, code) <= 0) {
      setCouponError(`${code} isn't valid for this booking.`);
      return;
    }
    setCouponInput(code);
    applyCoupon(code);
  };
  const removeCoupon = () => { applyCoupon(null); setCouponInput(''); setCouponError(null); };

  const isMember = !!membership?.plan && (!membership.expiresAt || new Date(membership.expiresAt) > new Date());
  const tripRent = (pricingQuote?.rentalAmount || 0) + (pricingQuote?.driverCharge || 0);

  // "Pay & Book" never does nothing silently: a guest gets the login sheet, and a price still loading is
  // waited for (the payment opens by itself once it arrives).
  const [showLogin, setShowLogin] = useState(false);
  const [waitingForPrice, setWaitingForPrice] = useState(false);

  // Booking requires an authenticated session
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated === false) {
        setShowLogin(true);
      }
    }, [isAuthenticated])
  );

  useEffect(() => {
    if (!waitingForPrice || isQuoteLoading || !pricingQuote) return;
    setWaitingForPrice(false);
    payAndBook();
  }, [waitingForPrice, isQuoteLoading, pricingQuote]); // eslint-disable-line react-hooks/exhaustive-deps

  const payAndBook = () => {
    if (isMissingDates || isMissingDestination || isMissingPickup || isMissingDrop) {
      Alert.alert('Missing Details', isMissingDates || isMissingDestination
        ? 'Please select your destination and travel dates before continuing.'
        : 'Please choose the address for delivery / collection, or pick up and return at the hub.');
      return;
    }
    if (!isVehicleAvailable) {
      Alert.alert('Not Available', 'Sorry, this vehicle is no longer available for your selected dates. Please change your dates.');
      return;
    }
    if (isAuthenticated !== true) { setShowLogin(true); return; }
    // "+91 98765 43210" or "919876543210" is a valid number too: only the last 10 digits matter.
    const mobile10 = String(customer.mobile || '').replace(/\D/g, '').slice(-10);
    if (!String(customer.name || '').trim() || mobile10.length !== 10) {
      Alert.alert('Complete your profile', 'Add your name and mobile number so we can confirm the booking.', [
        { text: 'Edit profile', onPress: () => router.push('/edit-profile') },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    if (!pricingQuote || isQuoteLoading) {
      // Price still being worked out: wait for it, then continue to payment automatically.
      setWaitingForPrice(true);
      if (!isQuoteLoading) refreshQuote().catch(() => {
        setWaitingForPrice(false);
        Alert.alert("Couldn't get the price", 'Please check your connection and try again.');
      });
      return;
    }
    setIsSubmitting(true);
    ActivityAPI.logActivity('payment_started', 'BookingScreen', { amount: pricingQuote.onlinePayableNow });
    router.push('/payment-processing');
    setTimeout(() => setIsSubmitting(false), 1000);
  };

  const ready = price.state === 'ready' ? price : null;
  const days = ready?.days ?? pricingQuote?.rentalDays ?? 1;
  const name = [selectedCar.model, selectedCar.variant].filter(Boolean).join(' ') || selectedCar.displayName || selectedCar.name;
  const year = selectedCar.modelYear || selectedCar.registrationYear;
  const title = year && !String(name).includes(String(year)) ? `${name} ${year}` : name;
  const meta = [selectedCar.transmission, selectedCar.fuel, selectedCar.type === 'Bike' ? null : (/seat/i.test(String(selectedCar.seats)) ? selectedCar.seats : `${selectedCar.seats} seats`)].filter(Boolean) as string[];
  const pickupWhere = deliverPickup ? (pickup?.name || 'Choose delivery address') : MYSAWARI_HUB_NAME;
  const returnWhere = collectReturn ? (returnAddress?.name || 'Choose collection address') : MYSAWARI_HUB_NAME;
  const destinationWhere = dropoff?.name || 'Select your destination';
  const payable = ready?.payableNow ?? pricingQuote?.onlinePayableNow ?? 500;

  return (
    <BlurTargetProvider target={blurTarget}>
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <BlurHost style={[styles.screen, { backgroundColor: p.page }]}>
       <BlurTargetView ref={blurTarget} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: 260 + insets.bottom }]}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={8} style={[styles.circle, { backgroundColor: p.iconBg }]}>
              <Feather name="chevron-left" size={18} color={p.sub} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: p.fg }]}>Payment Option</Text>
              <Text style={[styles.headerSub, { color: p.sub }]}>Secure & encrypted payment</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Booking policies" onPress={() => router.push('/terms')} hitSlop={8} style={[styles.circle, { backgroundColor: p.iconBg }]}>
              <Feather name="info" size={16} color={p.sub} />
            </Pressable>
          </View>

          {highDemand && (
            <View style={[styles.demand, { backgroundColor: p.demandBg, borderColor: p.demandBorder }]}>
              <Text style={[styles.demandText, { color: p.amber }]}>🔥 High Demand for these dates</Text>
            </View>
          )}

          {/* Car */}
          <View style={[styles.carCard, { borderColor: p.deliveryBorder }]}>
            <View style={[styles.carImage, { backgroundColor: p.iconBg }]}>
              <LoadingImage source={selectedCar.image} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  {!!selectedCar.manufacturer && <Text style={[styles.brand, { color: p.muted }]}>{selectedCar.manufacturer}</Text>}
                  <Text style={[styles.carName, { color: p.fg }]} numberOfLines={1}>{title}</Text>
                </View>
                {!!selectedCar.rating && (
                  <View style={[styles.rating, { backgroundColor: p.navy }]}>
                    <Text style={styles.ratingText}>{Number(selectedCar.rating).toFixed(1)}</Text>
                    <Ionicons name="star" size={12} color={p.star} />
                  </View>
                )}
              </View>
              <Text style={[styles.carMeta, { color: p.muted }]} numberOfLines={1}>{meta.join('  •  ')}</Text>
              <Pressable accessibilityRole="button" accessibilityLabel={`${mode}, change driving option`} onPress={chooseDriver} hitSlop={6}>
                <Text style={[styles.carMeta, { color: p.muted }]}>{mode}  •  {days} day{days === 1 ? '' : 's'}</Text>
              </Pressable>
              {ready && (
                <View style={styles.priceRow}>
                  <Text style={[styles.carPrice, { color: p.fg }]}>{formatCurrency(ready.final)}</Text>
                  {ready.original > ready.final && <Text style={[styles.carStrike, { color: p.muted }]}>{formatCurrency(ready.original)}</Text>}
                </View>
              )}
            </View>
          </View>

          {/* Rental duration */}
          <View style={[styles.duration, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.durationTitle, { color: p.fg }]}>{isMissingDates ? 'Select your dates' : `${days} Day${days === 1 ? '' : 's'} Rental Duration`}</Text>
              {!isMissingDates && (
                <Text style={[styles.durationSub, { color: p.sub }]} numberOfLines={1}>
                  {longWhen(startStr, pickupTime)}  →  {longWhen(endStr, returnTime)}
                </Text>
              )}
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Edit dates" onPress={() => router.push({ pathname: '/dates', params: { returnBack: 'true' } })} hitSlop={8} style={styles.edit}>
              <Feather name="edit" size={14} color={p.navy} />
              <Text style={[styles.editText, { color: p.navy }]}>Edit</Text>
            </Pressable>
          </View>

          {!isVehicleAvailable && !isMissingDates && (
            <View style={[styles.notice, { backgroundColor: p.redBg, borderColor: p.redBorder }]}>
              <Text style={[styles.noticeTitle, { color: p.red }]}>Not available for these dates</Text>
              <Text style={[styles.noticeText, { color: p.sub }]}>This vehicle was booked for part of your trip. Please change your dates.</Text>
            </View>
          )}

          {/* Pickup & drop-off: Pickup -> Destination (in-between) -> Return, connected seamlessly */}
          <Text style={[styles.section, { color: p.fg }]}>Pickup & drop-off</Text>
          <View style={styles.journeyContainer}>
            {/* Continuous vertical route line connecting Pickup, Destination and Return */}
            <View style={[styles.journeyLine, { backgroundColor: p.deliveryBorder }]} pointerEvents="none" />

            {/* 1. Pickup */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Pickup ${pickupWhere}. Change`}
              onPress={choosePickup}
              style={({ pressed }) => [styles.stop, pressed && { opacity: 0.6 }]}
            >
              <View style={[styles.ring, { borderColor: p.green, backgroundColor: p.page }]}>
                <View style={[styles.innerDot, { backgroundColor: p.green }]} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.stopTitle, { color: p.fg }]}>Pickup{!isMissingDates ? ` · ${dayAndTime(startStr, pickupTime)}` : ''}</Text>
                <Text style={[styles.stopSub, { color: isMissingPickup ? p.red : p.sub }]} numberOfLines={1}>
                  {deliverPickup ? `Doorstep delivery · ${pickupWhere}` : pickupWhere}
                </Text>
              </View>
              <Text style={[styles.changeText, { color: p.navy }]}>Change</Text>
            </Pressable>

            {/* 2. Destination (In-between Pickup and Return) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Destination ${destinationWhere}. Change`}
              onPress={() => {
                Haptics.selectionAsync();
                router.push({ pathname: '/dropoff', params: { returnBack: 'true' } });
              }}
              style={({ pressed }) => [styles.stop, pressed && { opacity: 0.6 }]}
            >
              <View style={[styles.ring, { borderColor: isMissingDestination ? p.red : p.navy, backgroundColor: p.page }]}>
                <View style={[styles.innerDot, { backgroundColor: isMissingDestination ? p.red : p.navy }]} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.stopTitle, { color: p.fg }]}>Destination</Text>
                <Text style={[styles.stopSub, { color: isMissingDestination ? p.red : p.sub }]} numberOfLines={1}>
                  {destinationWhere}
                </Text>
              </View>
              <Text style={[styles.changeText, { color: isMissingDestination ? p.red : p.navy }]}>
                {isMissingDestination ? 'Choose' : 'Change'}
              </Text>
            </Pressable>

            {/* 3. Return */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Return ${returnWhere}. Change`}
              onPress={chooseReturn}
              style={({ pressed }) => [styles.stop, pressed && { opacity: 0.6 }]}
            >
              <View style={[styles.ring, { borderColor: p.red, backgroundColor: p.page }]}>
                <View style={[styles.innerDot, { backgroundColor: p.red }]} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={[styles.stopTitle, { color: p.fg }]}>Return{!isMissingDates ? ` · ${dayAndTime(endStr, returnTime)}` : ''}</Text>
                <Text style={[styles.stopSub, { color: isMissingDrop ? p.red : p.sub }]} numberOfLines={1}>
                  {collectReturn ? `Doorstep collection · ${returnWhere}` : returnWhere}
                </Text>
              </View>
              <Text style={[styles.changeText, { color: p.navy }]}>Change</Text>
            </Pressable>
          </View>

          {/* Offers & Coupon */}
          <View style={styles.sectionRow}>
            <Text style={[styles.section, { color: p.fg }]}>Offers & Coupon</Text>
            <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/offers', params: { mode: 'apply' } } as any)} hitSlop={8}>
              <Text style={[styles.viewAll, { color: p.navy }]}>View all</Text>
            </Pressable>
          </View>
          {appliedCouponCode ? (
            <View style={[styles.couponApplied, { backgroundColor: p.greenBg, borderColor: p.greenBorder }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.couponAppliedTitle, { color: p.green }]}>{appliedCouponCode} applied</Text>
                {!!pricingQuote?.couponDiscount && <Text style={[styles.couponAppliedSub, { color: p.sub }]}>You save {formatCurrency(pricingQuote.couponDiscount)} on this trip</Text>}
              </View>
              <Pressable accessibilityRole="button" onPress={removeCoupon} hitSlop={8}>
                <Text style={[styles.apply, { color: p.red }]}>Remove</Text>
              </Pressable>
            </View>
          ) : (
            <View style={[styles.couponField, { borderColor: couponError ? p.red : p.deliveryBorder }]}>
              <TextInput
                value={couponInput}
                onChangeText={(t) => { setCouponInput(t.toUpperCase()); setCouponError(null); }}
                placeholder="Enter Coupon Code"
                placeholderTextColor={p.muted}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="done"
                onSubmitEditing={() => handleApplyCoupon(couponInput)}
                style={[styles.couponInput, { color: p.fg }]}
              />
              <Pressable accessibilityRole="button" onPress={() => handleApplyCoupon(couponInput)} disabled={!couponInput.trim()} hitSlop={8}>
                <Text style={[styles.apply, { color: couponInput.trim() ? p.navy : p.muted }]}>Apply</Text>
              </Pressable>
            </View>
          )}
          {!!couponError && <Text style={[styles.couponError, { color: p.red }]}>{couponError}</Text>}
          {!appliedCouponCode && coupons.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {coupons.map((c) => (
                <Pressable key={c.code} accessibilityRole="button" accessibilityLabel={`Apply ${c.code}`} onPress={() => handleApplyCoupon(c.code)} style={({ pressed }) => [styles.chip, { backgroundColor: p.summary, borderColor: p.deliveryBorder }, pressed && { opacity: 0.7 }]}>
                  <Text style={[styles.chipText, { color: p.navy }]}>{c.code}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Save on your booking */}
          <Text style={[styles.section, { color: p.fg }]}>Save on your booking</Text>
          <View style={[styles.saveCard, { borderColor: p.deliveryBorder }]}>
            <View style={styles.saveRow}>
              <View style={[styles.saveIcon, { backgroundColor: p.iconBg }]}>
                <MaterialCommunityIcons name="cash" size={18} color={p.sub} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.saveTitle, { color: p.fg }]}>My Sawari Cash</Text>
                <View style={[styles.cashChip, { backgroundColor: p.chipBg }]}>
                  <Text style={[styles.cashChipText, { color: p.navy }]}>{formatCurrency(sawariCash)} available</Text>
                </View>
              </View>
              <DesignToggle
                accessibilityLabel="Use My Sawari Cash"
                value={sawariCashToApply > 0}
                disabled={sawariCash <= 0}
                onValueChange={(on) => { Haptics.selectionAsync(); applySawariCash(on ? sawariCash : 0); }}
              />
            </View>
            {sawariCashToApply > 0 && !!pricingQuote && (
              <Text style={[styles.cashNote, { color: p.green }]}>
                {pricingQuote.sawariCashUsed > 0 ? `${formatCurrency(pricingQuote.sawariCashUsed)} used on this trip (up to ₹50 or 10% of the rent).` : 'Not usable on this trip.'}
              </Text>
            )}

            <View style={[styles.divider, { backgroundColor: p.divider }]} />

            <Pressable accessibilityRole="button" accessibilityState={{ expanded: showPlans }} onPress={() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setShowPlans((v) => !v); }} style={styles.saveRow}>
              <View style={[styles.saveIcon, { backgroundColor: p.iconBg }]}>
                <MaterialCommunityIcons name="crown-outline" size={18} color={p.sub} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.saveTitle, { color: p.fg }]}>Membership</Text>
                <Text style={[styles.saveSub, { color: p.sub }]}>
                  {planToBuy
                    ? `${PLANS.find((x) => x.key === planToBuy)?.name} membership added · ${formatCurrency(PLANS.find((x) => x.key === planToBuy)?.price || 0)} with this payment`
                    : isMember
                      ? `${PLANS.find((x) => x.key === membership!.plan)?.name ?? 'Member'} member${pricingQuote?.subscriptionDiscount ? ` · ${formatCurrency(pricingQuote.subscriptionDiscount)} off this trip` : ''}`
                      : 'Explore plans and trip savings'}
                </Text>
              </View>
              <Feather name={showPlans ? 'chevron-up' : 'chevron-down'} size={16} color={p.sub} />
            </Pressable>

            {showPlans && (
              <View style={{ gap: 8, marginTop: 4 }}>
                {PLANS.filter((pl) => !isMember || PLANS.findIndex((x) => x.key === pl.key) > PLANS.findIndex((x) => x.key === membership!.plan)).map((pl) => {
                  const save = Math.min(pl.perTripCap, Math.round(tripRent * pl.pct));
                  const purple = pl.key === 'plus';
                  const bg = purple ? p.purple : pl.key === 'pro' ? p.greenBg : p.page;
                  const border = purple ? p.purple : pl.key === 'pro' ? p.proBorder : p.memberBorder;
                  const text = purple ? '#FFFFFF' : p.fg;
                  const sub = purple ? 'rgba(255,255,255,0.85)' : p.sub;
                  return (
                    <Pressable
                      key={pl.key}
                      accessibilityRole="button"
                      accessibilityLabel={`${isMember ? 'Upgrade to' : 'Get'} ${pl.name}, ${formatCurrency(pl.price)} a year${save > 0 ? `, save ${formatCurrency(save)} on this trip` : ''}`}
                      // Picking a plan adds it to this booking (one payment) with a celebration; tapping it again removes it.
                      onPress={() => {
                        if (planToBuy === pl.key) { Haptics.selectionAsync(); setPlanToBuy(null); return; }
                        setPlanToBuy(pl.key);
                        setCelebrate({ name: pl.name, price: pl.price, save, pctLabel: pl.pctLabel });
                      }}
                      style={({ pressed }) => [styles.plan, { backgroundColor: bg, borderColor: border }, pressed && { opacity: 0.9 }]}
                    >
                      <View style={[styles.radio, planToBuy === pl.key
                        ? { borderColor: purple ? '#FFFFFF' : pl.key === 'pro' ? p.green : p.purple, backgroundColor: purple ? '#FFFFFF' : pl.key === 'pro' ? p.green : p.purple, alignItems: 'center', justifyContent: 'center' }
                        : { borderColor: purple ? '#FFFFFF' : p.radioRing }]}>
                        {planToBuy === pl.key && <View style={{ width: 5.5, height: 5.5, borderRadius: 3, backgroundColor: purple ? p.purple : '#FFFFFF' }} />}
                      </View>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <View style={styles.planNameRow}>
                          <Image source={pl.icon} style={{ width: pl.iconSize, height: pl.iconSize }} contentFit="contain" />
                          <Text style={[styles.planName, { color: text }]}>{pl.name}</Text>
                          {save > 0 && (
                            <View style={[styles.saveChip, { backgroundColor: p.green }]}>
                              <Text style={styles.saveChipText}>{planToBuy === pl.key ? `${formatCurrency(save)} Saved` : `Save ${formatCurrency(save)} on this trip`}</Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.planSub, { color: sub }]} numberOfLines={1}>{pl.pctLabel} off every trip  •  Save up to ₹{pl.annual}/year</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={[styles.planPrice, { color: text }]}>{formatCurrency(pl.price)}</Text>
                        <Text style={[styles.planSub, { color: sub }]}>/year</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>

          <Text style={[styles.note, { color: p.sub }]}>
            *Note : Original Driving License and Aadhaar Card verification is Mandatory at the time of vehicle handover
          </Text>
        </ScrollView>
       </BlurTargetView>

        <StickyBookingBar
          hasTrip={!isMissingDates}
          isAvailable={isVehicleAvailable}
          agreed={!isSubmitting && !waitingForPrice}
          bookLabel={waitingForPrice ? 'Getting price…' : `Pay ${formatCurrency(payable)} & Book`}
          onNeedLogin={() => setShowLogin(true)}
          onBookNow={payAndBook}
          onCheckAvailability={() => router.push({ pathname: '/dates', params: { returnBack: 'true' } })}
        />
        {/* "You're saving ₹X — <Plan> Membership Applied!": highlights member savings on the Payment Option page. */}
        <MembershipSavedPopup
          hasTrip={!isMissingDates}
          tripKey={`${selectedCar?.id || 'car'}|${dateRange}|${pickupTime}|${returnTime}`}
          screen="booking"
          forceShow={true}
        />
        {celebrate && (
          <MembershipCelebration
            visible
            confetti
            plan={celebrate.name}
            amount={celebrate.save > 0 ? celebrate.save : null}
            title={`${celebrate.name} Membership Applied!`}
            note={celebrate.save > 0 ? `${formatCurrency(celebrate.price)} for 1 year, paid with your booking` : `${celebrate.pctLabel} off every trip · ${formatCurrency(celebrate.price)}/year with your booking`}
            onClose={() => setCelebrate(null)}
          />
        )}
        <LoginBottomSheet
          visible={showLogin}
          showSkip={false}
          required={isAuthenticated === false}
          onClose={() => {
            setShowLogin(false);
            if (isAuthenticated === false) {
              router.back();
            }
          }}
          onLoginSuccess={() => setShowLogin(false)}
        />
      </BlurHost>
    </KeyboardAvoidingView>
    </BlurTargetProvider>
  );
}

const styles = StyleSheet.create({
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  viewAll: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12.5, marginTop: 12 },
  screen: { flex: 1 },
  content: { paddingHorizontal: 16 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  circle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONT.semibold, fontSize: 14, lineHeight: 20 },
  headerSub: { fontFamily: FONT.regular, fontSize: 11, lineHeight: 16 },

  demand: { borderWidth: 1, borderRadius: 8, height: 38, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  demandText: { fontFamily: FONT.medium, fontSize: 11 },

  carCard: { flexDirection: 'row', gap: 12, borderWidth: 1, borderRadius: 12, padding: 8 },
  carImage: { width: 120, minHeight: 100, alignSelf: 'stretch', borderRadius: 8, overflow: 'hidden' },
  brand: { fontFamily: FONT.regular, fontSize: 11, lineHeight: 16 },
  carName: { fontFamily: FONT.semibold, fontSize: 16, lineHeight: 22 },
  rating: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 24, paddingHorizontal: 8, borderRadius: 12, marginTop: 6 },
  ratingText: { fontFamily: FONT.semibold, fontSize: 13, color: '#FFFFFF' },
  carMeta: { fontFamily: FONT.regular, fontSize: 11, lineHeight: 17, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 2 },
  carPrice: { fontFamily: FONT.bold, fontSize: 18, lineHeight: 24 },
  carStrike: { fontFamily: FONT.regular, fontSize: 12, textDecorationLine: 'line-through' },

  duration: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 14, marginTop: 16 },
  durationTitle: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 19 },
  durationSub: { fontFamily: FONT.regular, fontSize: 10.5, lineHeight: 16, marginTop: 2 },
  edit: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 8 },
  editText: { fontFamily: FONT.medium, fontSize: 12 },

  notice: { borderWidth: 1, borderRadius: 10, padding: 12, marginTop: 12 },
  noticeTitle: { fontFamily: FONT.semibold, fontSize: 13 },
  noticeText: { fontFamily: FONT.regular, fontSize: 12, marginTop: 2 },

  section: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 22, marginTop: 22, marginBottom: 10 },
  journeyContainer: { position: 'relative', gap: 10 },
  journeyLine: { position: 'absolute', left: 5, top: 12, bottom: 12, width: 2, borderRadius: 1 },
  stop: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  ring: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  innerDot: { width: 4, height: 4, borderRadius: 2 },
  stopTitle: { fontFamily: FONT.medium, fontSize: 11.5, lineHeight: 17 },
  stopSub: { fontFamily: FONT.regular, fontSize: 11, lineHeight: 16 },
  changeText: { fontFamily: FONT.medium, fontSize: 12, paddingLeft: 8 },

  couponField: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, height: 48, paddingHorizontal: 12 },
  couponInput: { flex: 1, fontFamily: FONT.regular, fontSize: 13, padding: 0 },
  apply: { fontFamily: FONT.medium, fontSize: 13 },
  couponError: { fontFamily: FONT.medium, fontSize: 11, marginTop: 6 },
  couponApplied: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, minHeight: 48, paddingHorizontal: 12, paddingVertical: 8 },
  couponAppliedTitle: { fontFamily: FONT.semibold, fontSize: 13 },
  couponAppliedSub: { fontFamily: FONT.regular, fontSize: 11, marginTop: 2 },
  chips: { gap: 8, paddingTop: 8 },
  chip: { borderWidth: 1, borderRadius: 6, height: 26, paddingHorizontal: 10, justifyContent: 'center' },
  chipText: { fontFamily: FONT.medium, fontSize: 10.5 },

  saveCard: { borderWidth: 1, borderRadius: 12, padding: 12 },
  saveRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  saveIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveTitle: { fontFamily: FONT.medium, fontSize: 13, lineHeight: 19 },
  saveSub: { fontFamily: FONT.regular, fontSize: 11, lineHeight: 16 },
  cashChip: { alignSelf: 'flex-start', borderRadius: 4, paddingHorizontal: 6, height: 18, justifyContent: 'center', marginTop: 2 },
  cashChipText: { fontFamily: FONT.medium, fontSize: 10.5 },
  cashNote: { fontFamily: FONT.medium, fontSize: 10.5, marginTop: 6, marginLeft: 48 },
  divider: { height: 1, marginVertical: 12, marginHorizontal: -12 },

  plan: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 10, paddingVertical: 10, paddingLeft: 9, paddingRight: 9 },
  radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, backgroundColor: '#FFFFFF' },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  planName: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 20 },
  saveChip: { height: 19, paddingHorizontal: 8, borderRadius: 10, justifyContent: 'center' },
  saveChipText: { fontFamily: FONT.semibold, fontSize: 8, color: '#FFFFFF' },
  planSub: { fontFamily: FONT.regular, fontSize: 11, lineHeight: 16, marginTop: 4 },
  planPrice: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 20 },

  note: { fontFamily: FONT.regular, fontSize: 10.5, lineHeight: 16, textAlign: 'center', marginTop: 18, paddingHorizontal: 8 },
});