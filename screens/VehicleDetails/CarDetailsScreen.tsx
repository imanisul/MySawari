import React, { useState, useRef, useEffect } from 'react';
import { useTrackTripProgress } from '@/hooks/useTrackTripProgress';
import { Animated, Dimensions, Easing, ScrollView, StyleSheet, View, Text, Pressable, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator, InteractionManager, Alert } from 'react-native';
import * as Haptics from '@/utils/haptics';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSawari } from '@/context/SawariContext';
import { useVehicles, useLiveCar } from '@/hooks/useVehicles';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { offersQueryOptions, Offer } from '@/services/api/offers';
import { Feather } from '@expo/vector-icons';
import { LoginBottomSheet } from '@/components';
import { cars, getAvailability, splitDateRange, parseDayLabel, dayNumToLabel, isHighDemand } from '@/utils/sawari';

import { VehicleHeader } from '@/components/vehicle/details/VehicleHeader';
import { VehicleHeroGallery } from '@/components/vehicle/details/VehicleHeroGallery';
import { VehicleSummary, DriverCard } from '@/components/vehicle/details/VehicleSummary';
import {
  MileageLimits, SectionPills, MainSpecification, Benefits, MembershipPicker, MembershipUpgrade, ReviewsStrip, RealTrips, FeatureList,
  WhyRent, LocationCard, CancellationPolicy, Inclusions, PaymentSchedule, Faqs, HelpCard, PolicyAgreement,
} from '@/components/vehicle/details/CarDetailsSections';
import { StickyBookingBar } from '@/components/vehicle/details/StickyBookingBar';
import { useTripPrice } from '@/components/vehicle/details/useTripPrice';
import { longAvail } from '@/components/vehicle/CarListCard';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { BlurHost } from '@/components/common/BottomBlur';
import { BlurTargetView } from 'expo-blur';
import { BlurTargetProvider } from '@/components/common/BlurTargetContext';
import { Skeleton } from '@/components/common/Skeleton';
import { LoadingImage, AnimatedVehiclePlaceholder } from '@/components/common/LoadingImage';

import { ActivityAPI } from '@/services/api/activity';
import { addRecentlyViewed } from '@/utils/recentlyViewed';

// Layout follows the Figma "Car Detail Page" frame (My Sawari Customer App V-1, node 852-7608).
type SectionKey = 'overview' | 'specification' | 'benefits' | 'features' | 'location';
const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'overview', label: 'Overview' },
  { key: 'specification', label: 'Specification' },
  { key: 'benefits', label: 'Benefits' },
  { key: 'features', label: 'Features' },
  { key: 'location', label: 'Location' },
];
// Same sizes as VehicleHeroGallery, so the loading placeholder lines up with the real photo.
const GALLERY_W = Dimensions.get('window').width - 32;
const GALLERY_H = Math.round(GALLERY_W * 0.587);
const THUMB_SK_W = (GALLERY_W - 6 * 4) / 5;

// Index of the section pills among the ScrollView's direct children (top block, pills, …).
const STICKY_INDEX = 1;

export default function CarDetailsScreen() {
  useTrackTripProgress('car'); // Recent searches resume this trip on this page
  const p = useDetailsPalette();
  const blurTarget = useRef<View | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    id?: string;
    vehicleId?: string;
    offerId?: string;
    promoCode?: string;
    isOvernight?: string;
    pickupTime?: string;
    returnTime?: string;
    isFixedDates?: string;
    lockDates?: string;
    isTopDeal?: string;
    allowExtend?: string;
    dealPrice?: string;
    hourlyPrice?: string;
    rentalHours?: string;
  }>();
  const { id: paramCarId, vehicleId: paramVehicleId, offerId: paramOfferId, promoCode: paramPromoCode } = params;
  const targetCarId = paramCarId || paramVehicleId;
  const isDatesLocked = params.isFixedDates === 'true' || params.lockDates === 'true' || !!paramOfferId || params.isTopDeal === 'true';
  const { data: fetchedVehicles = [], isLoading: isFleetLoading } = useVehicles();
  const {
    selectedCar, selectCar, pickup, dropoff, dateRange, isDeliveryRequested, setFuelEstimate,
    isAuthenticated, customer, duration, pickupTime, returnTime, membership, setDates, isDarkMode,
    applyCoupon, appliedCouponCode,
  } = useSawari();

  const { data: offers = [] } = useQuery(offersQueryOptions);

  // Identify targeted offer if passed via push/deep-link
  const targetOffer = (paramOfferId || paramPromoCode)
    ? offers.find(
        (o: Offer) =>
          (paramOfferId && (o._id === paramOfferId || o.id === paramOfferId)) ||
          (paramPromoCode && o.code === paramPromoCode)
      )
    : null;

  const isParamOfferExpired = Boolean(
    (paramOfferId || paramPromoCode) &&
      (!targetOffer || (targetOffer.expiryDate && new Date(targetOffer.expiryDate) < new Date()))
  );

  // The Top Deal's hourly price belongs only to a booking opened from Top Deals: a normal booking of the same car
  // (Explore, Search) must not keep it.
  useEffect(() => {
    if (params.isTopDeal !== 'true' && /^TOPDEAL-/i.test(appliedCouponCode || '')) applyCoupon(null);
  }, [params.isTopDeal, appliedCouponCode, applyCoupon]);

  // Auto-apply promo code if valid and not yet applied
  useEffect(() => {
    if (targetOffer?.code && appliedCouponCode !== targetOffer.code && !isParamOfferExpired) {
      applyCoupon(targetOffer.code);
    } else if (paramPromoCode && !appliedCouponCode && !isParamOfferExpired) {
      applyCoupon(paramPromoCode);
    }
  }, [targetOffer, paramPromoCode, appliedCouponCode, isParamOfferExpired, applyCoupon]);

  // If a specific car ID was passed or selectedCar is the dummy placeholder, select the real vehicle
  useEffect(() => {
    if (targetCarId && fetchedVehicles.length > 0) {
      const match = fetchedVehicles.find((v) => String(v.id) === String(targetCarId));
      if (match && match.id !== selectedCar?.id) selectCar(match);
    } else if (!targetCarId && (!selectedCar || selectedCar === cars[0] || selectedCar.id === 'seltos')) {
      // Opened with no car chosen (the app was reloaded on this page): back to Home, not a random car.
      router.replace('/');
    }
  }, [targetCarId, fetchedVehicles, selectedCar, selectCar, router]);

  // CarListCard already syncs the Explore page's date to dateRange before navigation.
  const effectiveDateRange = dateRange;

  // Same rule as the lists: free for the chosen dates (or today if none chosen).
  const [startStr, endStr] = splitDateRange(effectiveDateRange);
  const liveCar = useLiveCar(selectedCar);
  const availability = getAvailability(liveCar, startStr, endStr, pickupTime, returnTime);
  const isAvailable = availability.available;

  // Enrich the car with the computed availability so child components can access nextAvailableFrom etc.
  const enrichedCar = liveCar ? { ...liveCar, availability, isAvailable } : liveCar;

  // Keep selectedCar in context synchronized with live availability facts
  useEffect(() => {
    if (liveCar && selectedCar && liveCar !== selectedCar && liveCar.bookedRanges !== selectedCar.bookedRanges) {
      selectCar(liveCar);
    }
  }, [liveCar, selectedCar, selectCar]);

  const requestedStart = parseDayLabel(startStr);
  const requestedEnd = requestedStart !== null ? parseDayLabel(endStr, requestedStart) : null;
  // A same-day trip (e.g. 8 AM → 8 PM) is a real trip: requiring end > start sent Book Now back to the dates.
  const hasTrip = requestedStart !== null && requestedEnd !== null && requestedEnd >= requestedStart;
  const requestedLabel = requestedStart !== null
    ? `${dayNumToLabel(requestedStart)}${requestedEnd !== null && requestedEnd > requestedStart ? ` – ${dayNumToLabel(requestedEnd)}` : ''}`
    : 'Today';
  // Figma shows "14 Nov, 10:00 AM – 16 Nov, 10:00 AM": two-digit hour, so pad single-digit times the
  // way the date picker displays them.
  const hhmm = (t: string) => t.replace(/^(\d):/, '0$1:');
  const tripLabel = hasTrip
    ? `${dayNumToLabel(requestedStart!)}, ${hhmm(pickupTime)} – ${dayNumToLabel(requestedEnd!)}, ${hhmm(returnTime)}`
    : 'Select your trip dates';
  // Rent for the plan options' "Save ₹X": the quote's own rental amount (it counts the 8 AM-to-8 AM days), so what the
  // options promise is what the quote then applies. Before the quote arrives, the day rate × days.
  const tripPrice = useTripPrice(hasTrip);
  const tripDays = hasTrip ? Math.max(1, parseInt(duration, 10) || requestedEnd! - requestedStart!) : 1;
  // "Add 1 day" (Figma card): only on a 1-day trip with free dates; 2+ days are already unlimited km.
  // From the Flash Sale (allowExtend) a locked deal trip can still get more days; the server prices the longer trip.
  const canAddDay = hasTrip && tripDays === 1 && (!isDatesLocked || params.allowExtend === 'true');
  const addOneDay = () => {
    if (requestedStart === null || requestedEnd === null) return;
    const end = requestedEnd + 1;
    setDates(`${dayNumToLabel(requestedStart)} – ${dayNumToLabel(end)}`, `${tripDays + 1} Days`);
  };
  // "Add more days" (floating card): if the car is also free the day after, add it, then open this car's calendar
  // with the longer trip selected so more days can be picked (the calendar only lets free days be chosen).
  const addMoreDays = () => {
    if (requestedStart === null || requestedEnd === null || !selectedCar) return;
    Haptics.selectionAsync();
    const nextEnd = dayNumToLabel(requestedEnd + 1);
    if (getAvailability(selectedCar, dayNumToLabel(requestedStart), nextEnd, pickupTime, returnTime).available) {
      setDates(`${dayNumToLabel(requestedStart)} – ${nextEnd}`, `${tripDays + 1} Days`);
    }
    router.push({ pathname: '/dates', params: { forSpecificCar: 'true', returnBack: 'true' } });
  };
  const freeCancelUntil = requestedStart !== null ? `${dayNumToLabel(requestedStart - 1)}, ${pickupTime}` : null;

  const year = selectedCar?.modelYear || selectedCar?.registrationYear;
  const title = selectedCar ? (year && !selectedCar.name.includes(year) ? `${selectedCar.name} ${year}` : selectedCar.name) : 'Vehicle Details';

  const unavailableNote = `${availability.reason === 'service' ? 'Under maintenance' : 'Booked'} for ${requestedLabel}`
    + (availability.availableFrom ? ` · Available from ${availability.availableFrom}` : (availability.nextAvailableFrom ? ` · Next available ${availability.nextAvailableFrom}` : ''));
  // Busy car: other bookings already hold it around the chosen dates — never before dates are chosen.
  const highDemand = hasTrip && isHighDemand(selectedCar, requestedStart, requestedEnd);

  const hasMembership = !!membership?.plan && (!membership.expiresAt || new Date(membership.expiresAt) > new Date());
  const canUpgrade = hasMembership && (membership?.plan === 'starter' || membership?.plan === 'plus');

  const [showLogin, setShowLogin] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [agreed, setAgreed] = useState(true); // pre-ticked; the customer can untick it
  const [barHeight, setBarHeight] = useState(165 + Math.max(insets.bottom, 12));
  // "Want to keep it longer?" floats above the bar once the in-page "Need more time on the road?" card has scrolled
  // up out of view, and goes away again at the Policy Agreement (and when scrolling back up to that card).
  const [floatAddDay, setFloatAddDay] = useState(false);
  const [floatClosed, setFloatClosed] = useState(false); // ✕ hides it for the rest of this visit
  const floatShown = floatAddDay && !floatClosed;
  const policyTop = useRef(0);
  const mileageEnd = useRef(0);
  const floatFade = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    // Rises 16px while it fades in, sinks while it fades out — one smooth native-driven motion.
    Animated.timing(floatFade, {
      toValue: floatShown ? 1 : 0,
      duration: floatShown ? 260 : 200,
      easing: floatShown ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [floatShown, floatFade]);

  const openDates = () => {
    if (isDatesLocked) {
      Alert.alert(
        'Fixed Schedule Deal',
        'The travel dates and times are locked for this special deal and cannot be modified.'
      );
      return;
    }
    Haptics.selectionAsync();
    router.push({ pathname: '/dates', params: { forSpecificCar: 'true', returnBack: 'true' } });
  };

  // "Check Availability": date & time first, then the location page, then back here with the price. The policy
  // tick and Book Now come after that; it never jumps ahead to the payment page.
  const checkAvailability = () => {
    if (isDatesLocked) {
      Alert.alert(
        'Fixed Schedule Deal',
        'The travel dates and times are locked for this special deal and cannot be modified.'
      );
      return;
    }
    Haptics.selectionAsync();
    router.push({ pathname: '/dates', params: { forSpecificCar: 'true', returnBack: 'true' } });
  };

  // Check Availability → date & time → back here with the price → Book Now.
  // Straight to booking (payment option page) without asking for destination.
  const handleBookingProceed = () => {
    if (!isAuthenticated) {
      setPendingAction(() => handleBookingProceed);
      setShowLogin(true);
      return;
    }
    const isMissingEnd = !endStr || endStr.includes('Select');
    if ((!hasTrip || isMissingEnd) && !isDatesLocked) {
      router.push({ pathname: '/dates', params: { forSpecificCar: 'true', returnBack: 'true', thenBook: 'true' } });
    } else {
      router.push({
        pathname: '/booking',
        params: {
          couponCode: appliedCouponCode || paramPromoCode || targetOffer?.code || '',
          isOvernight: params.isOvernight || '',
          lockDates: isDatesLocked ? 'true' : undefined,
          isFixedDates: isDatesLocked ? 'true' : undefined,
          isTopDeal: params.isTopDeal || undefined,
          offerId: paramOfferId || '',
          dealPrice: params.dealPrice || undefined,
          hourlyPrice: params.hourlyPrice || undefined,
          rentalHours: params.rentalHours || undefined,
        },
      });
    }
  };

  useEffect(() => {
    setFuelEstimate(null);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (selectedCar && selectedCar !== cars[0]) {
        const storageKey = isAuthenticated ? customer?.id : null;
        ActivityAPI.logActivity('view_car', 'CarDetailsScreen', { carId: selectedCar.id, carName: selectedCar.name });
        // Shown again on Home under "Recently Viewed".
        addRecentlyViewed(storageKey, {
          vehicleId: String(selectedCar.id),
          dropoff: dropoff || undefined,
          dateRange,
          pickupTime,
          returnTime,
          duration,
        })
          .then(() => {
            queryClient.invalidateQueries({ queryKey: ['recentlyViewed', storageKey || 'guest'] });
          })
          .catch(() => {});
      }
    }, [selectedCar, isAuthenticated, customer?.id, dropoff, dateRange, pickupTime, returnTime, duration, queryClient])
  );

  const mainScrollRef = useRef<ScrollView>(null);

  // Everything under the section pills mounts after the screen has finished sliding in: building the whole long page
  // during the transition is what made it stutter and jump. Nothing above the fold depends on it, so no layout shifts.
  const [showRest, setShowRest] = useState(false);
  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => setShowRest(true));
    return () => task.cancel();
  }, []);
  // The skeleton shows while the screen slides in; the real page then fades in over it.
  const fadeIn = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (showRest) Animated.timing(fadeIn, { toValue: 1, duration: 250, useNativeDriver: true }).start();
  }, [showRest, fadeIn]);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ y: 0, animated: false });
    setActiveSection('overview');
  }, [selectedCar?.id]);

  // ── One scrolling page with sticky section pills ──
  // The pills highlight the section being read as the page scrolls; tapping one scrolls to it.
  const [activeSection, setActiveSection] = useState<SectionKey>('overview');
  const sectionTops = useRef<Record<SectionKey, number>>({ overview: 0, specification: 0, benefits: 0, features: 0, location: 0 });
  const pillsHeight = useRef(51);
  const jumpingUntil = useRef(0); // ignore scroll updates while a tap-scroll animation is running

  const onSectionLayout = (key: SectionKey) => (e: { nativeEvent: { layout: { y: number } } }) => {
    sectionTops.current[key] = e.nativeEvent.layout.y;
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    const pastCard = mileageEnd.current > 0 && y > mileageEnd.current - pillsHeight.current;
    const reached = policyTop.current > 0 && y + e.nativeEvent.layoutMeasurement.height >= policyTop.current + 24;
    const show = pastCard && !reached;
    if (show !== floatAddDay) setFloatAddDay(show);
    if (Date.now() < jumpingUntil.current) return;
    const line = e.nativeEvent.contentOffset.y + pillsHeight.current + 24;
    let next: SectionKey = 'overview';
    for (const { key } of SECTIONS) if (sectionTops.current[key] > 0 && sectionTops.current[key] <= line) next = key;
    if (next !== activeSection) setActiveSection(next);
  };

  const scrollToSection = (key: SectionKey) => {
    Haptics.selectionAsync();
    setActiveSection(key);
    jumpingUntil.current = Date.now() + 450;
    const y = key === 'overview' ? 0 : Math.max(0, sectionTops.current[key] - pillsHeight.current);
    mainScrollRef.current?.scrollTo({ y, animated: true });
  };

  // Animated skeleton while the screen is sliding in, or while the fleet loads and no real car is selected yet
  if (!showRest || ((!selectedCar || selectedCar === cars[0] || selectedCar.id === 'seltos') && isFleetLoading)) {
    return (
      <View style={[styles.screen, { backgroundColor: p.page }]}>
        {/* Mirrors the real page block for block (header, name card, photo, thumbnails, driver card) so nothing jumps when it appears. */}
        <View style={{ paddingTop: insets.top }}>
          <View style={{ minHeight: 64, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 16 }}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <View style={{ flex: 1, gap: 6 }}>
              <Skeleton width="65%" height={16} borderRadius={4} />
              <Skeleton width="45%" height={12} borderRadius={4} />
            </View>
            <Skeleton width={32} height={32} borderRadius={16} />
            <Skeleton width={32} height={32} borderRadius={16} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 16 }}>
          <Skeleton width="100%" height={82} borderRadius={10} />
          <View style={{ height: 16 }} />
          <View style={{ width: '100%', height: GALLERY_H, borderRadius: 10, overflow: 'hidden' }}>
            <AnimatedVehiclePlaceholder colors={p} isDark={isDarkMode} />
          </View>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 6 }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={{ width: THUMB_SK_W, height: Math.round(THUMB_SK_W * (45 / 67.5)), borderRadius: 3, overflow: 'hidden' }}>
                <AnimatedVehiclePlaceholder colors={p} isDark={isDarkMode} />
              </View>
            ))}
          </View>
          <View style={{ height: 16 }} />
          <Skeleton width="100%" height={84} borderRadius={10} />
        </View>
      </View>
    );
  }

  // If after loading no real vehicle is available
  if (!selectedCar || selectedCar === cars[0] || selectedCar.id === 'seltos') {
    return (
      <View style={[styles.screen, { backgroundColor: p.page, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: p.fg, fontFamily: 'PlusJakartaSans_500Medium' }}>Car not found</Text>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={{ marginTop: 20, padding: 12, backgroundColor: p.button, borderRadius: 8 }}>
          <Text style={{ color: p.onNavy }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <Animated.View style={{ flex: 1, opacity: fadeIn }}>
    <BlurTargetProvider target={blurTarget}>
      <BlurHost style={[styles.screen, { backgroundColor: p.page }]}>
        <VehicleHeader title={title} tripLabel={tripLabel} onEditTrip={openDates} isDatesLocked={isDatesLocked} />

      <BlurTargetView ref={blurTarget} style={{ flex: 1 }}>
      <ScrollView
        ref={mainScrollRef}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={32}
        stickyHeaderIndices={[STICKY_INDEX]}
        contentContainerStyle={{ paddingBottom: barHeight }}
      >
        {/* 0 — status, name card, delivery switch, photos, mileage */}
        {/* No entrance animation here: the screen is already sliding in, and a second motion on top of it read as a shake. */}
        <View>
          <VehicleSummary
            car={enrichedCar}
            isAvailable={isAvailable}
            unavailableNote={unavailableNote}
            highDemand={highDemand}
            availableOn={availability.availableFrom ? availability.availableFrom : (availability.nextAvailableFrom ? longAvail(availability.nextAvailableFrom) : undefined)}
          />
          <View style={{ height: 16 }} />
          <VehicleHeroGallery car={enrichedCar} />
          {/* Figma: 8 below the photos, 8 above the "Need a driver?" card, then 8 and the mileage block's own 8. */}
          <View style={{ height: 16 }} />
          <DriverCard />
          <View style={{ height: 8 }} />

          <View onLayout={(e) => { mileageEnd.current = e.nativeEvent.layout.y + e.nativeEvent.layout.height; }}>
            <MileageLimits onAddDay={canAddDay ? addMoreDays : undefined} />
          </View>
          <View style={{ height: 8 }} />
        </View>

        {/* 1 — sticky section pills */}
        <View onLayout={(e) => { pillsHeight.current = e.nativeEvent.layout.height; }} style={{ backgroundColor: p.page }}>
          <SectionPills sections={SECTIONS} active={activeSection} onPress={scrollToSection} />
        </View>

        {showRest && (
          <>
        <View onLayout={onSectionLayout('specification')}>
          <MainSpecification car={enrichedCar} />
        </View>

        <View onLayout={onSectionLayout('benefits')}>
          <Benefits />
          {!hasMembership && <MembershipPicker tripRent={tripPrice.state === 'ready' ? tripPrice.rentalAmount : selectedCar.perDay * tripDays} />}
          {canUpgrade && <MembershipUpgrade tripRent={tripPrice.state === 'ready' ? tripPrice.rentalAmount : selectedCar.perDay * tripDays} currentPlan={membership!.plan as 'starter' | 'plus'} />}
        </View>

        <ReviewsStrip car={enrichedCar} />
        <RealTrips car={enrichedCar} />

        <View onLayout={onSectionLayout('features')}>
          <FeatureList car={enrichedCar} />
        </View>

        <WhyRent />
        <View onLayout={onSectionLayout('location')}>
          <LocationCard deliveryAddress={isDeliveryRequested ? pickup?.name : null} />
        </View>
        <CancellationPolicy freeCancelUntil={freeCancelUntil} />
        <Inclusions />
        <PaymentSchedule />
        <Faqs />
        <HelpCard />
        <View onLayout={(e) => { policyTop.current = e.nativeEvent.layout.y; }}>
          <PolicyAgreement agreed={agreed} onToggle={() => setAgreed((v) => !v)} />
        </View>
          </>
        )}
      </ScrollView>
      </BlurTargetView>

      {/* Figma "Add 1 more day": 297 × 45 floating card above the bottom bar */}
      {canAddDay && (
        <Animated.View pointerEvents={floatShown ? 'box-none' : 'none'} style={[styles.floatWrap, { bottom: barHeight + 8, opacity: floatFade, transform: [{ translateY: floatFade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>
          <View style={[styles.floatCard, { borderColor: p.deliveryBorder }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.floatTitle, { color: p.fg }]} numberOfLines={1}>Want to keep it longer?</Text>
              <Text style={[styles.floatSub, { color: p.muted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Extend your booking at {formatCurrency(selectedCar.perDay)}/day.</Text>
            </View>
            <Pressable
              onPress={addMoreDays}
              accessibilityRole="button"
              accessibilityLabel="Add more days"
              style={({ pressed }) => [styles.floatBtn, { backgroundColor: p.button }, pressed && { opacity: 0.85 }]}
            >
              <Text style={[styles.floatBtnText, { color: p.onNavy }]} numberOfLines={1} allowFontScaling={false}>Add more days</Text>
            </Pressable>
            <Pressable
              onPress={() => { Haptics.selectionAsync(); setFloatClosed(true); }}
              accessibilityRole="button"
              accessibilityLabel="Close"
              hitSlop={10}
            >
              <Feather name="x" size={16} color={p.muted} />
            </Pressable>
          </View>
        </Animated.View>
      )}

      <StickyBookingBar
        isAvailable={isAvailable}
        agreed={agreed}
        onHeight={setBarHeight}
        hasTrip={hasTrip}
        onCheckAvailability={checkAvailability}
        onNeedLogin={() => {
          setPendingAction(() => handleBookingProceed);
          setShowLogin(true);
        }}
        onBookNow={handleBookingProceed}
      />
      <LoginBottomSheet
        visible={showLogin}
        onClose={() => {
          setShowLogin(false);
          setPendingAction(null);
        }}
        onLoginSuccess={() => {
          setShowLogin(false);
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
      />
      </BlurHost>
    </BlurTargetProvider>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatWrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center', paddingHorizontal: 16 },
  floatCard: { width: 325, maxWidth: '100%', height: 45, flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: 6, paddingBottom: 6, paddingRight: 8, paddingLeft: 10, backgroundColor: '#FFFFFF', borderWidth: 1, borderRadius: 10, shadowColor: '#2F3E75', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 4 },
  floatTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5, includeFontPadding: false },
  floatSub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 9, lineHeight: 14, includeFontPadding: false },
  floatBtn: { flexShrink: 0, minWidth: 96, height: 31, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 8, borderRadius: 6 },
  floatBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5, includeFontPadding: false },
  screen: { flex: 1 },
});