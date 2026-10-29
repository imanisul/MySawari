import React, { useState, useRef, useEffect } from 'react';
import { useTrackTripProgress } from '@/hooks/useTrackTripProgress';
import { ScrollView, StyleSheet, View, Text, Pressable, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { LoginBottomSheet } from '@/components';
import { cars, getAvailability, splitDateRange, parseDayLabel, dayNumToLabel } from '@/utils/sawari';

import { VehicleHeader } from '@/components/vehicle/details/VehicleHeader';
import { VehicleHeroGallery } from '@/components/vehicle/details/VehicleHeroGallery';
import { VehicleSummary, DriverCard } from '@/components/vehicle/details/VehicleSummary';
import {
  MileageLimits, SectionPills, MainSpecification, Benefits, MembershipPicker, MembershipUpgrade, ReviewsStrip, RealTrips, FeatureList,
  WhyRent, LocationCard, CancellationPolicy, Inclusions, PaymentSchedule, Faqs, HelpCard, PolicyAgreement,
} from '@/components/vehicle/details/CarDetailsSections';
import { StickyBookingBar } from '@/components/vehicle/details/StickyBookingBar';
import { longAvail } from '@/components/vehicle/CarListCard';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { BlurHost } from '@/components/common/BottomBlur';
import { BlurTargetView } from 'expo-blur';
import { BlurTargetProvider } from '@/components/common/BlurTargetContext';
import Reanimated from 'react-native-reanimated';
import { rise } from '@/components/common/motion';

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
// Index of the section pills among the ScrollView's direct children (top block, pills, …).
const STICKY_INDEX = 1;

export default function CarDetailsScreen() {
  useTrackTripProgress('car'); // Recent searches resume this trip on this page
  const p = useDetailsPalette();
  const blurTarget = useRef<View | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id: paramCarId } = useLocalSearchParams<{ id?: string }>();
  const { data: fetchedVehicles = [], isLoading: isFleetLoading } = useVehicles();
  const { selectedCar, selectCar, pickup, dropoff, dateRange, isDeliveryRequested, setFuelEstimate, isAuthenticated, customer, duration, pickupTime, returnTime, membership, setDates } = useSawari();

  // If a specific car ID was passed or selectedCar is the dummy placeholder, select the real vehicle
  useEffect(() => {
    if (paramCarId && fetchedVehicles.length > 0) {
      const match = fetchedVehicles.find((v) => String(v.id) === String(paramCarId));
      if (match && match.id !== selectedCar?.id) selectCar(match);
    } else if ((!selectedCar || selectedCar === cars[0] || selectedCar.id === 'seltos') && fetchedVehicles.length > 0) {
      selectCar(fetchedVehicles[0]);
    }
  }, [paramCarId, fetchedVehicles, selectedCar, selectCar]);

  // CarListCard already syncs the Explore page's date to dateRange before navigation.
  const effectiveDateRange = dateRange;

  // Same rule as the lists: free for the chosen dates (or today if none chosen).
  const [startStr, endStr] = splitDateRange(effectiveDateRange);
  const availability = getAvailability(selectedCar, startStr, endStr);
  const isAvailable = availability.available;

  // Enrich the car with the computed availability so child components can access nextAvailableFrom etc.
  const enrichedCar = selectedCar ? { ...selectedCar, availability, isAvailable } : selectedCar;

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
  const tripDays = hasTrip ? Math.max(1, parseInt(duration, 10) || requestedEnd! - requestedStart!) : 1;
  const freeCancelUntil = requestedStart !== null ? `${dayNumToLabel(requestedStart - 1)}, ${pickupTime}` : null;

  const year = selectedCar?.modelYear || selectedCar?.registrationYear;
  const title = selectedCar ? (year && !selectedCar.name.includes(year) ? `${selectedCar.name} ${year}` : selectedCar.name) : 'Vehicle Details';

  const unavailableNote = `${availability.reason === 'service' ? 'Under maintenance' : 'Booked'} for ${requestedLabel}`
    + (availability.nextAvailableFrom ? ` · Next available ${availability.nextAvailableFrom}` : '');
  // Busy car: other bookings already hold it around the chosen dates.
  const highDemand = (selectedCar?.bookedRanges?.length ?? 0) >= 2;

  const hasMembership = !!membership?.plan && (!membership.expiresAt || new Date(membership.expiresAt) > new Date());
  const canUpgrade = hasMembership && (membership?.plan === 'starter' || membership?.plan === 'plus');

  const [showLogin, setShowLogin] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [agreed, setAgreed] = useState(false); // the customer ticks it themselves
  const [barHeight, setBarHeight] = useState(165 + Math.max(insets.bottom, 12));

  const openDates = () => {
    Haptics.selectionAsync();
    router.push({ pathname: '/dates', params: { forSpecificCar: 'true' } });
  };

  // Figma flow: Check Availability → date & time → back here with the price → Book Now.
  // Book Now only asks for the trip destination if it is still missing, then opens the booking.
  const handleBookingProceed = () => {
    const isMissingEnd = !endStr || endStr.includes('Select');
    if (!hasTrip || isMissingEnd) {
      openDates();
    } else if (!dropoff?.name) {
      router.push({ pathname: '/dropoff', params: { forSpecificCar: 'true' } });
    } else {
      router.push('/booking');
    }
  };

  // One-day trip → two days (unlimited km). Availability re-checks for the new dates on the next render.
  // With no dates chosen yet, it opens the date picker instead.
  const handleAddDay = () => {
    if (!hasTrip) {
      openDates();
      return;
    }
    Haptics.selectionAsync();
    const nextEnd = requestedEnd! + 1;
    const days = tripDays + 1;
    setDates(`${dayNumToLabel(requestedStart!)} – ${dayNumToLabel(nextEnd)}`, `${days} Days`);
  };

  useEffect(() => {
    setFuelEstimate(null);
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      if (selectedCar && selectedCar !== cars[0]) {
        ActivityAPI.logActivity('view_car', 'CarDetailsScreen', { carId: selectedCar.id, carName: selectedCar.name });
        // Shown again on Home under "Recently viewed".
        addRecentlyViewed(isAuthenticated ? customer?.id : null, {
          vehicleId: String(selectedCar.id),
          dropoff: dropoff || undefined,
          dateRange,
          pickupTime,
          returnTime,
          duration,
        }).catch(() => {});
      }
    }, [selectedCar, isAuthenticated, customer?.id])
  );

  const mainScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ y: 0, animated: true });
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

  // Show loading indicator if fleet is still loading and no real car is selected yet
  if ((!selectedCar || selectedCar === cars[0] || selectedCar.id === 'seltos') && isFleetLoading) {
    return (
      <View style={[styles.screen, { backgroundColor: p.page, justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={p.navy} />
      </View>
    );
  }

  // If after loading no real vehicle is available
  if (!selectedCar || selectedCar === cars[0] || selectedCar.id === 'seltos') {
    return (
      <View style={[styles.screen, { backgroundColor: p.page, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: p.fg, fontFamily: 'PlusJakartaSans_500Medium' }}>Car not found</Text>
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} style={{ marginTop: 20, padding: 12, backgroundColor: p.navy, borderRadius: 8 }}>
          <Text style={{ color: p.onNavy }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <BlurTargetProvider target={blurTarget}>
      <BlurHost style={[styles.screen, { backgroundColor: p.page }]}>
        <VehicleHeader title={title} tripLabel={tripLabel} onEditTrip={openDates} />

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
        <Reanimated.View entering={rise(0)}>
          <VehicleSummary car={enrichedCar} isAvailable={isAvailable} unavailableNote={unavailableNote} highDemand={highDemand} availableOn={availability.nextAvailableFrom ? longAvail(availability.nextAvailableFrom) : undefined} />
          <View style={{ height: 16 }} />
          <VehicleHeroGallery car={enrichedCar} />
          {/* Figma: 8 below the photos, 8 above the "Need a driver?" card, then 8 and the mileage block's own 8. */}
          <View style={{ height: 16 }} />
          <DriverCard />
          <View style={{ height: 8 }} />
          {/* Marks which rule this trip falls under; "Add 1 day" is hidden for 2+ day trips, which are already unlimited. */}
          <MileageLimits
            tripDays={hasTrip ? tripDays : undefined}
            onAddDay={!hasTrip || tripDays === 1 ? handleAddDay : undefined}
          />
          <View style={{ height: 8 }} />
        </Reanimated.View>

        {/* 1 — sticky section pills */}
        <View onLayout={(e) => { pillsHeight.current = e.nativeEvent.layout.height; }} style={{ backgroundColor: p.page }}>
          <SectionPills sections={SECTIONS} active={activeSection} onPress={scrollToSection} />
        </View>

        <View onLayout={onSectionLayout('specification')}>
          <MainSpecification car={enrichedCar} />
        </View>

        <View onLayout={onSectionLayout('benefits')}>
          <Benefits />
          {!hasMembership && <MembershipPicker tripRent={selectedCar.perDay * tripDays} />}
          {canUpgrade && <MembershipUpgrade tripRent={selectedCar.perDay * tripDays} currentPlan={membership!.plan as 'starter' | 'plus'} />}
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
        <PolicyAgreement agreed={agreed} onToggle={() => setAgreed((v) => !v)} />
      </ScrollView>
      </BlurTargetView>

      <StickyBookingBar
        isAvailable={isAvailable}
        agreed={agreed}
        onHeight={setBarHeight}
        hasTrip={hasTrip}
        onCheckAvailability={openDates}
        onNeedLogin={() => {
          setPendingAction(() => handleBookingProceed);
          setShowLogin(true);
        }}
        onBookNow={handleBookingProceed}
      />
      <LoginBottomSheet
        visible={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={() => {
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }}
      />
      </BlurHost>
    </BlurTargetProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});