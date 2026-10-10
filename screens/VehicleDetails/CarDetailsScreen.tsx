import React, { useState, useRef, useEffect } from 'react';
import { useTrackTripProgress } from '@/hooks/useTrackTripProgress';
import { ScrollView, StyleSheet, View, Text, Pressable, Linking, NativeSyntheticEvent, NativeScrollEvent, Animated, Easing } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSawari } from '@/context/SawariContext';
import { CarTile, LoginBottomSheet } from '@/components';
import { TripEditorModal } from '@/components/home/TripEditorModal';
import { cars, getAvailability, splitDateRange, parseDayLabel, dayNumToLabel, MIN_PUBLIC_REVIEW_RATING } from '@/utils/sawari';

import { VehicleHeader } from '@/components/vehicle/details/VehicleHeader';
import { VehicleHeroGallery } from '@/components/vehicle/details/VehicleHeroGallery';
import { VehicleSummary } from '@/components/vehicle/details/VehicleSummary';
import { AboutSection, GallerySection, ReviewsSection, SpecsSection, FeaturesSection } from '@/components/vehicle/details/DetailsTabs';
import { VehicleSpecs } from '@/components/vehicle/details/VehicleSpecs';
import { StickyBookingBar } from '@/components/vehicle/details/StickyBookingBar';
import { SearchSheet } from '@/components/booking/SearchSheet';
import Reanimated from 'react-native-reanimated';
import { rise } from '@/components/common/motion';

import { ActivityAPI } from '@/services/api/activity';
import { addRecentlyViewed } from '@/utils/recentlyViewed';

type SectionKey = 'gallery' | 'about' | 'specifications' | 'features' | 'location' | 'reviews';
const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'about', label: 'About' },
  { key: 'gallery', label: 'Gallery' },
  { key: 'specifications', label: 'Specs' },
  { key: 'features', label: 'Features' },
  { key: 'location', label: 'Location' },
  { key: 'reviews', label: 'Reviews' },
];
// Index of the section bar among the ScrollView's direct children (photos, summary, bar, …).
const STICKY_INDEX = 2;

export default function CarDetailsScreen() {
  useTrackTripProgress('car'); // Recent searches resume this trip on this page
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { selectedCar, pickup, dropoff, dateRange, selectedDate, bookingSource, isDeliveryRequested, setFuelEstimate, isAuthenticated, customer, duration, pickupTime, returnTime } = useSawari();
  
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
  const requestedLabel = requestedStart !== null
    ? `${dayNumToLabel(requestedStart)}${requestedEnd !== null && requestedEnd > requestedStart ? ` – ${dayNumToLabel(requestedEnd)}` : ''}`
    : 'Today';

  const [isEditingTrip, setIsEditingTrip] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [showSearchSheet, setShowSearchSheet] = useState(false);

  const handleBookingProceed = () => {
    const isMissingEnd = !endStr || endStr.includes('Select');
    if (bookingSource === 'explore' || !dropoff?.name || isMissingEnd) {
      Haptics.selectionAsync(); 
      router.push({ pathname: '/dates', params: { forSpecificCar: 'true' } });
    } else {
      router.push('/booking');
    }
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
    setActiveSection('about');
  }, [selectedCar?.id]);

  // ── One scrolling page with a sticky section bar (About · Gallery · Reviews) ──
  // The bar highlights the section being read as the page scrolls; tapping a tab scrolls to it.
  const [activeSection, setActiveSection] = useState<SectionKey>('about');
  const sectionTops = useRef<Record<SectionKey, number>>({ gallery: 0, about: 0, specifications: 0, features: 0, location: 0, reviews: 0 });
  const tabBarHeight = useRef(48);
  const jumpingUntil = useRef(0); // ignore scroll updates while a tap-scroll animation is running

  const onSectionLayout = (key: SectionKey) => (e: { nativeEvent: { layout: { y: number } } }) => {
    sectionTops.current[key] = e.nativeEvent.layout.y;
  };

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (Date.now() < jumpingUntil.current) return;
    const { contentOffset, layoutMeasurement, contentSize } = e.nativeEvent;
    const line = contentOffset.y + tabBarHeight.current + 24;
    let next: SectionKey = 'about';
    for (const key of SECTIONS.map((x) => x.key)) if (sectionTops.current[key] > 0 && sectionTops.current[key] <= line) next = key;
    // At the very bottom the last (often short) section is the one being read.
    if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 8) next = 'reviews';
    if (next !== activeSection) setActiveSection(next);
  };

  // Sliding underline on the tab line: follows the active section.
  const tabLayouts = useRef<Partial<Record<SectionKey, { x: number; width: number }>>>({});
  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorW = useRef(new Animated.Value(0)).current;
  const moveIndicator = (key: SectionKey, animated = true) => {
    const l = tabLayouts.current[key];
    if (!l) return;
    const cfg = { duration: animated ? 220 : 0, easing: Easing.out(Easing.cubic), useNativeDriver: false };
    Animated.parallel([Animated.timing(indicatorX, { toValue: l.x, ...cfg }), Animated.timing(indicatorW, { toValue: l.width, ...cfg })]).start();
  };
  useEffect(() => { moveIndicator(activeSection); }, [activeSection]);

  // Counts next to the tab labels (same reviews query as the Reviews section, so no extra request).
  const { data: dbReviews = [] } = useQuery({
    queryKey: ['carReviews', selectedCar?.id],
    queryFn: () => API.reviews.fetchByCarId(selectedCar!.id),
    enabled: !!selectedCar?.id,
    staleTime: 60 * 1000,
  });
  const reviewCount = [...(selectedCar?.reviews || []), ...(dbReviews as any[])].filter((r: any) => r.rating >= MIN_PUBLIC_REVIEW_RATING).length;
  const photoCount = (selectedCar?.images || (selectedCar?.image ? [selectedCar.image] : [])).length;
  const tabCount: Record<SectionKey, number | null> = { gallery: photoCount || null, about: null, specifications: null, features: null, location: null, reviews: reviewCount || null };

  const scrollToSection = (key: SectionKey) => {
    Haptics.selectionAsync();
    setActiveSection(key);
    jumpingUntil.current = Date.now() + 450;
    mainScrollRef.current?.scrollTo({ y: Math.max(0, sectionTops.current[key] - tabBarHeight.current), animated: true });
  };

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
        onScroll={onScroll}
        scrollEventThrottle={32}
        stickyHeaderIndices={[STICKY_INDEX]}
        contentContainerStyle={[styles.content, { paddingBottom: 70 + Math.max(insets.bottom, 16) + 24 }]}
      >
        {/* 0 — photos */}
        <Reanimated.View entering={rise(0)}>
          <VehicleHeroGallery car={enrichedCar} />
        </Reanimated.View>

        {/* 1 — what it is, whether it is free, the key specs at a glance */}
        <Reanimated.View entering={rise(80)}>
          <VehicleSummary car={enrichedCar} isAvailable={isAvailable} availabilityNote={availability.label} />
          <VehicleSpecs car={enrichedCar} />
          {!isAvailable && (
            <View style={[styles.block, { paddingTop: 4 }]}>
              <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.infoIcon, { backgroundColor: colors.destructive + '12' }]}>
                  <Feather name={availability.reason === 'service' ? 'tool' : 'calendar'} size={18} color={colors.destructive} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoTitle, { color: colors.foreground }]}>Not available for {requestedLabel}</Text>
                  <Text style={[styles.infoDesc, { color: colors.mutedForeground }]}>
                    {availability.reason === 'service' ? 'Under maintenance.' : 'Booked on these dates.'}
                    {availability.nextAvailableFrom ? ` Next available from ${availability.nextAvailableFrom}.` : ''}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </Reanimated.View>

        {/* 2 — sticky section bar: one horizontal line of tabs with a sliding underline */}
        <View
          onLayout={(e) => { tabBarHeight.current = e.nativeEvent.layout.height; }}
          style={[styles.sectionBar, { backgroundColor: colors.background }]}
        >
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View>
              <View style={styles.sectionTabs}>
                {SECTIONS.map(({ key, label }) => {
                  const active = activeSection === key;
                  const count = tabCount[key];
                  return (
                    <Pressable
                      key={key}
                      accessibilityRole="tab"
                      accessibilityState={{ selected: active }}
                      accessibilityLabel={count ? `${label}, ${count}` : label}
                      onPress={() => scrollToSection(key)}
                      onLayout={(e) => {
                        tabLayouts.current[key] = { x: e.nativeEvent.layout.x, width: e.nativeEvent.layout.width };
                        if (key === activeSection) moveIndicator(key, false);
                      }}
                      style={styles.sectionTab}
                    >
                      <Text style={[styles.sectionTabText, { color: active ? colors.foreground : colors.mutedForeground }, active && { fontFamily: 'Inter_700Bold' }]}>
                        {label}
                      </Text>
                      {count != null && (
                        <View style={[styles.tabCount, { backgroundColor: active ? colors.primary : colors.surfaceSoft }]}>
                          <Text style={[styles.tabCountText, { color: active ? colors.primaryForeground : colors.mutedForeground }]}>{count}</Text>
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
              {/* the line, with the underline sliding along it */}
              <View style={[styles.tabLine, { backgroundColor: colors.border }]}>
                <Animated.View style={[styles.tabIndicator, { backgroundColor: colors.primary, left: indicatorX, width: indicatorW }]} />
              </View>
            </View>
          </ScrollView>
        </View>

        {/* About */}
        <View onLayout={onSectionLayout('about')}>
          <AboutSection car={enrichedCar} />
        </View>

        {/* Gallery: photos from hosts and guests */}
        <View onLayout={onSectionLayout('gallery')}>
          <GallerySection car={enrichedCar} />
        </View>

        {/* Specifications */}
        <View onLayout={onSectionLayout('specifications')}>
          <SpecsSection car={enrichedCar} />
        </View>

        {/* Features */}
        {(!!enrichedCar.features?.length) && (
          <View onLayout={onSectionLayout('features')}>
            <FeaturesSection car={enrichedCar} />
          </View>
        )}

        {/* Location */}
        <View onLayout={onSectionLayout('location')} style={styles.block}>

          <View style={styles.block}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginLeft: 0 }]}>{isDeliveryRequested ? 'Pickup & delivery' : 'Pickup location'}</Text>
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.tintLight }]}>
                <Feather name="map-pin" size={18} color={colors.primaryText} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoTitle, { color: colors.foreground }]}>MySawari, Kahilipara</Text>
                <Text style={[styles.infoDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  Ganesh Turning, Bongshar, Kahilipara, Guwahati, Assam 781019
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Directions to the pickup location"
                onPress={() => {
                  Haptics.selectionAsync();
                  Linking.openURL('https://www.google.com/maps/search/?api=1&query=MySawari+-+Self+Drive+Car+Rental+Guwahati,+Kahilipara,+Assam');
                }}
                style={({ pressed }) => [styles.directionsBtn, { borderColor: colors.primary }, pressed && { opacity: 0.7 }]}
              >
                <Feather name="navigation" size={14} color={colors.primaryText} />
                <Text style={[styles.directionsText, { color: colors.primaryText }]}>Directions</Text>
              </Pressable>
            </View>

            {isDeliveryRequested && (
              <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border, marginTop: 10 }]}>
                <View style={[styles.infoIcon, { backgroundColor: colors.tintLight }]}>
                  <Feather name="truck" size={18} color={colors.primaryText} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.infoTitle, { color: colors.foreground }]}>Delivered to you</Text>
                  <Text style={[styles.infoDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {pickup?.name || 'Your selected address'}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>

        <View onLayout={onSectionLayout('reviews')}>
          <ReviewsSection car={enrichedCar} />
        </View>
      </ScrollView>
      
      <StickyBookingBar 
        isAvailable={isAvailable} 
        onCheckAvailability={() => { 
          Haptics.selectionAsync(); 
          router.push({ pathname: '/dates', params: { forSpecificCar: 'true' } });
        }}
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
      <TripEditorModal
        visible={isEditingTrip}
        onClose={() => setIsEditingTrip(false)}
        onSave={() => setIsEditingTrip(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  block: { paddingHorizontal: 16, paddingTop: 20 },
  sectionBar: { marginTop: 12 },
  sectionTabs: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 24 },
  sectionTab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 13 },
  sectionTabText: { fontFamily: 'Inter_500Medium', fontSize: 14.5 },
  tabCount: { minWidth: 20, height: 18, borderRadius: 9, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center' },
  tabCountText: { fontFamily: 'Inter_700Bold', fontSize: 10.5 },
  tabLine: { height: StyleSheet.hairlineWidth * 2, marginHorizontal: 0 },
  tabIndicator: { position: 'absolute', bottom: 0, height: 3, borderRadius: 2 },
  infoCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 14, padding: 14 },
  infoIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  infoTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  infoDesc: { fontFamily: 'Inter_400Regular', fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  directionsBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 7 },
  directionsText: { fontFamily: 'Inter_600SemiBold', fontSize: 12.5 },
  screen: { flex: 1 },
  content: {},
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 17, marginLeft: 16, marginBottom: 12, letterSpacing: -0.2 },
});
