import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Share,
  Platform,
  Alert,
  FlatList,
  Animated,
  PanResponder,
  TextInput,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '@/utils/haptics';
import { safeBack } from '@/utils/navigation';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { formatCurrency, memberDayPrice, MYSAWARI_HUB_NAME } from '@/services/backend/pricingEngine';
import { dayNumToLabel, todayDayNum, getAvailability, isInService, Car } from '@/utils/sawari';
import { LoginBottomSheet } from '@/components';

import { VehicleSummary, DriverCard } from '@/components/vehicle/details/VehicleSummary';
import { VehicleHeroGallery } from '@/components/vehicle/details/VehicleHeroGallery';
import {
  MileageLimits,
  SectionPills,
  MainSpecification,
  Benefits,
  ReviewsStrip,
  RealTrips,
  FeatureList,
  WhyRent,
  LocationCard,
  CancellationPolicy,
  Inclusions,
  PaymentSchedule,
  Faqs,
  HelpCard,
} from '@/components/vehicle/details/CarDetailsSections';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Side padding that lets the first and last 60px round reach the middle of the strip (round + 14 gap = 74 apart).
const THUMB_PAD = (SCREEN_WIDTH - 60) / 2;

type SectionKey =
  | 'specification'
  | 'benefits'
  | 'reviews'
  | 'features'
  | 'why'
  | 'location'
  | 'policy'
  | 'inclusions'
  | 'schedule'
  | 'faqs'
  | 'support';

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'specification', label: 'Specification' },
  { key: 'benefits', label: 'Benefits' },
  { key: 'reviews', label: 'Reviews' },
  { key: 'features', label: 'Features' },
  { key: 'why', label: 'Why Rent?' },
  { key: 'location', label: 'Location' },
  { key: 'policy', label: 'Policies' },
  { key: 'inclusions', label: 'Inclusions' },
  { key: 'schedule', label: 'Payment Schedule' },
  { key: 'faqs', label: 'FAQs' },
  { key: 'support', label: 'Support' },
];

interface DealSlot {
  id: string;
  title: string;
  badge: string;
  discountPct: number;
  durationHours: number;
  pickupTime: string;
  returnTime: string;
  daysSpan: number; // 0 = same day, 1 = overnight/next day
  isOvernight?: boolean;
  basePrice: number;
  dealPrice: number;
  memberPrice: number;
  hourlyRate: number;
  startLabel: string;
  endLabel: string;
}

const HOUR = 3600000;
// A Top Deal is a short gap: free for at most this many hours, ending at a booking that is already on the calendar.
const MAX_DEAL_HOURS = 18;
const dayWord = (offset: number) => (offset === 0 ? 'Today' : offset === 1 ? 'Tomorrow' : dayNumToLabel(todayDayNum() + offset));
const INACTIVE = ['cancelled', 'canceled', 'failed', 'rejected', 'completed', 'complete', 'returned', 'closed'];
const clock = (ms: number) => {
  const d = new Date(ms);
  const h = d.getHours();
  return `${String(h % 12 || 12).padStart(2, '0')}:00 ${h < 12 ? 'AM' : 'PM'}`;
};
const dayOffset = (ms: number) => {
  const a = new Date(); a.setHours(0, 0, 0, 0);
  const b = new Date(ms); b.setHours(0, 0, 0, 0);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
};

/**
 * The free window of a vehicle: from the next whole hour until the next booking starts (at most 24 h).
 * null when it is on a trip right now, in the workshop, or the gap is shorter than an hour.
 */
function freeWindow(car: any, now: number): { startMs: number; endMs: number; hours: number; bounded: boolean } | null {
  const st = String(car?.dbStatus || car?.status || '').toLowerCase();
  if (st === 'service' || st === 'maintenance') return null;
  const ranges = (car?.bookedRanges || [])
    .filter((r: any) => !r.status || !INACTIVE.includes(String(r.status).toLowerCase()))
    .map((r: any) => ({ a: new Date(r.start).getTime(), b: new Date(r.end).getTime() }))
    .filter((r: any) => !isNaN(r.a) && !isNaN(r.b));
  if (ranges.some((r: any) => r.a <= now && r.b > now)) return null;
  const startMs = Math.ceil(now / HOUR) * HOUR;
  const next = Math.min(Infinity, ...ranges.filter((r: any) => r.a > now).map((r: any) => r.a));
  const endMs = Math.min(startMs + 24 * HOUR, isFinite(next) ? Math.floor(next / HOUR) * HOUR : Infinity);
  const hours = (endMs - startMs) / HOUR;
  return hours >= 1 ? { startMs, endMs, hours, bounded: isFinite(next) && next - startMs <= 24 * HOUR } : null;
}

export default function TopDealsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const p = useDetailsPalette();
  const { data: vehicles = [], isLoading } = useVehicles();
  const {
    selectCar,
    setDates,
    setTimes,
    setDropoff,
    setPickup,
    pickup,
    dropoff,
    membership,
    favorites,
    toggleFavorite,
    isDeliveryRequested,
    setIsDeliveryRequested,
    isAuthenticated,
  } = useSawari();

  const [activeCarIndex, setActiveCarIndex] = useState(0);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('overnight');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  // The free window moves on with the clock, so the price is refreshed every minute.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 60000); return () => clearInterval(t); }, []);
  const [activeSection, setActiveSection] = useState<SectionKey>('specification');

  const expandAnim = useRef(new Animated.Value(0)).current;
  const thumbsRef = useRef<FlatList<any>>(null);
  const mainScrollRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Record<string, number>>({});

  // Slide open / close animations
  const openFullDetails = () => openCarPageRef.current();

  const closeFullDetails = () => {
    Haptics.selectionAsync();
    Animated.spring(expandAnim, {
      toValue: 0,
      friction: 8,
      tension: 50,
      useNativeDriver: false,
    }).start(() => {
      setIsExpanded(false);
    });
  };

  // Drag up anywhere on the sheet (fast or slow) opens the full car details; drag down on the header closes them.
  // Created once, so the current state is read through refs (a captured isExpanded would stay false).
  const openCarPageRef = useRef<() => void>(() => {});
  const expandedRef = useRef(false);
  expandedRef.current = isExpanded;
  const actionsRef = useRef({ open: openFullDetails, close: closeFullDetails });
  actionsRef.current = { open: () => openCarPageRef.current(), close: closeFullDetails };
  const vertical = (g: { dx: number; dy: number }) => Math.abs(g.dy) > 12 && Math.abs(g.dy) > 1.5 * Math.abs(g.dx);
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => vertical(g) && expandedRef.current && g.dy > 0,
      // Captured in preview mode so the body's own scrolling doesn't swallow the upward drag.
      onMoveShouldSetPanResponderCapture: (_, g) => vertical(g) && !expandedRef.current && g.dy < 0,
      onPanResponderRelease: (_, g) => {
        if (!expandedRef.current && g.dy < -30) actionsRef.current.open();
        else if (expandedRef.current && g.dy > 45) actionsRef.current.close();
      },
    })
  ).current;

  // Horizontal swipe on the photo: left -> next car/bike, right -> previous. The responder is created once, so it
  // reads the current list size from a ref (a captured value would stay at the first render's empty list).
  const carCount = useRef(0);
  const slideX = useRef(new Animated.Value(0)).current;
  const sliding = useRef(false);
  // The current car slides out the way it was swiped, the next one slides in from the other side.
  const swipeCar = (step: number) => {
    if (carCount.current < 2 || sliding.current) return;
    sliding.current = true;
    Haptics.selectionAsync();
    Animated.timing(slideX, { toValue: -step * SCREEN_WIDTH, duration: 140, useNativeDriver: true }).start(() => {
      setActiveCarIndex((prev) => (prev + step + carCount.current) % carCount.current);
      setActivePhotoIndex(0);
      slideX.setValue(step * SCREEN_WIDTH);
      Animated.timing(slideX, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => { sliding.current = false; });
    });
  };
  const swipeRef = useRef(swipeCar);
  swipeRef.current = swipeCar;
  const horizontalSwipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > 2 * Math.abs(g.dy),
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 20 && Math.abs(g.dx) > 2 * Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (g.dx < -40) swipeRef.current(1);
        else if (g.dx > 40) swipeRef.current(-1);
      },
    })
  ).current;

  // Available cars with gap slots: show available cars and cars returning today
  const dealCars = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];
    const filtered = vehicles.filter((v: any) => {
      if (isInService(v)) return false;
      const st = String(v.dbStatus || v.status || '').toLowerCase();
      if (st === 'service' || st === 'maintenance') return false;

      const avail = getAvailability(v);
      if (avail.available) return true;
      if (avail.availableFrom && !avail.availableFrom.toLowerCase().includes('service')) return true;
      if (avail.nextAvailableFrom) return true;
      return false;
    });

    return filtered.length > 0 ? filtered : vehicles.filter((v: any) => !isInService(v));
  }, [vehicles]);

  const filteredCars = useMemo(() => {
    if (!searchQuery.trim()) return dealCars;
    const q = searchQuery.toLowerCase();
    return dealCars.filter(
      (c: any) =>
        (c.displayName || c.name || c.vehicleName || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.fuelType || c.fuel || '').toLowerCase().includes(q)
    );
  }, [dealCars, searchQuery]);

  useEffect(() => {
    setActiveCarIndex(0);
    setActivePhotoIndex(0);
  }, [searchQuery]);

  carCount.current = filteredCars.length;
  // The highlighted round always slides to the middle of the strip.
  useEffect(() => {
    if (filteredCars.length) thumbsRef.current?.scrollToIndex({ index: Math.min(activeCarIndex, filteredCars.length - 1), viewPosition: 0.5, animated: true });
  }, [activeCarIndex, filteredCars.length, isExpanded]);
  const rawActiveCar = filteredCars[activeCarIndex] || dealCars[0] || null;

  // Build a fully compliant Car object identical to what CarDetailsScreen expects
  const activeCar: Car | null = useMemo(() => {
    if (!rawActiveCar) return null;
    return {
      ...rawActiveCar,
      id: String(rawActiveCar.id || (rawActiveCar as any)._id || 'deal_car'),
      name: rawActiveCar.displayName || rawActiveCar.name || rawActiveCar.vehicleName || 'Vehicle',
      displayName: rawActiveCar.displayName || rawActiveCar.name || rawActiveCar.vehicleName || 'Vehicle',
      vehicleName: rawActiveCar.vehicleName || rawActiveCar.displayName || rawActiveCar.name || 'Vehicle',
      category: rawActiveCar.category || 'SUV',
      fuel: rawActiveCar.fuel || (rawActiveCar as any).fuelType || 'Diesel',
      transmission: rawActiveCar.transmission || 'Automatic',
      seats: rawActiveCar.seats || (rawActiveCar as any).seatingCapacity || '5 Seater',
      perDay: rawActiveCar.perDay || (rawActiveCar as any).pricePerDay || 2200,
      pricePerDay: (rawActiveCar as any).pricePerDay || rawActiveCar.perDay || 2200,
      price: rawActiveCar.price || `₹${rawActiveCar.perDay || 2200}`,
      type: rawActiveCar.type || 'Car',
      image: rawActiveCar.image,
      images: rawActiveCar.images || [rawActiveCar.image],
    };
  }, [rawActiveCar]);

  // Realistic gap slots computed from car's availability and day rate
  const slots: DealSlot[] = useMemo(() => {
    if (!rawActiveCar) return [];
    const perDay = Number(rawActiveCar.perDay || (rawActiveCar as any).pricePerDay || 2000);
    const hourlyBase = Math.max(45, Math.round(perDay / 24));

    const todayNum = todayDayNum();
    const todayStr = dayNumToLabel(todayNum);
    const tmrwStr = dayNumToLabel(todayNum + 1);

    const avail = getAvailability(rawActiveCar);
    const returnTimeStr = avail.availableFrom ? avail.availableFrom.split(',')[0].trim() : '03:00 PM';
    const gapPickup = avail.availableFrom && !avail.available ? returnTimeStr : '03:00 PM';

    // Slot 1: Overnight Slot (8:00 PM - 8:00 AM next day, 12h)
    const s1Hours = 12;
    const s1Base = s1Hours * hourlyBase;
    const s1Deal = Math.round(s1Base * 0.75); // 25% off
    const s1Member = memberDayPrice(s1Deal, membership) ?? Math.round(s1Deal * 0.88);

    // Slot 2: Full Gap Slot (from return time or 3 PM - 8:00 AM next day, 17h)
    const s2Hours = 17;
    const s2Base = s2Hours * hourlyBase;
    const s2Deal = Math.round(s2Base * 0.70); // 30% off
    const s2Member = memberDayPrice(s2Deal, membership) ?? Math.round(s2Deal * 0.85);

    // Slot 3: Evening Drive (from return time or 3 PM - 10:00 PM, 7h)
    const s3Hours = 7;
    const s3Base = s3Hours * hourlyBase;
    const s3Deal = Math.round(s3Base * 0.82); // 18% off
    const s3Member = memberDayPrice(s3Deal, membership) ?? Math.round(s3Deal * 0.90);

    return [
      {
        id: 'overnight',
        title: 'Overnight Slot',
        badge: '8 PM – 8 AM (12 hrs)',
        discountPct: 25,
        durationHours: s1Hours,
        pickupTime: '08:00 PM',
        returnTime: '08:00 AM',
        daysSpan: 1,
        isOvernight: true,
        basePrice: s1Base,
        dealPrice: s1Deal,
        memberPrice: s1Member,
        hourlyRate: Number((s1Deal / s1Hours).toFixed(1)),
        startLabel: todayStr,
        endLabel: tmrwStr,
      },
      {
        id: 'full_gap',
        title: 'Full Gap Slot',
        badge: `${gapPickup} – 8 AM (17 hrs)`,
        discountPct: 30,
        durationHours: s2Hours,
        pickupTime: gapPickup.includes(':') ? gapPickup : '03:00 PM',
        returnTime: '08:00 AM',
        daysSpan: 1,
        isOvernight: true,
        basePrice: s2Base,
        dealPrice: s2Deal,
        memberPrice: s2Member,
        hourlyRate: Number((s2Deal / s2Hours).toFixed(1)),
        startLabel: todayStr,
        endLabel: tmrwStr,
      },
      {
        id: 'evening',
        title: 'Evening Drive',
        badge: `${gapPickup} – 10 PM (7 hrs)`,
        discountPct: 18,
        durationHours: s3Hours,
        pickupTime: gapPickup.includes(':') ? gapPickup : '03:00 PM',
        returnTime: '10:00 PM',
        daysSpan: 0,
        isOvernight: false,
        basePrice: s3Base,
        dealPrice: s3Deal,
        memberPrice: s3Member,
        hourlyRate: Number((s3Deal / s3Hours).toFixed(1)),
        startLabel: todayStr,
        endLabel: todayStr,
      },
    ];
  }, [rawActiveCar, membership]);

  const activeSlot = slots.find((s) => s.id === selectedSlotId) || slots[0];

  const isMember = !!membership?.plan && (!membership.expiresAt || new Date(membership.expiresAt) > new Date());
  const isFav = activeCar ? favorites.includes(String(activeCar.id)) : false;

  const handleShare = async () => {
    Haptics.selectionAsync();
    if (!activeCar) return;
    try {
      const carName = activeCar.displayName || activeCar.name || 'Special Car';
      await Share.share({
        title: `Top Deal: ${carName}`,
        message: `Check out the Top Deal on ${carName} on MySawari! Rent from ₹${activeSlot?.hourlyRate || 69}/hr. Book now on the MySawari App!`,
      });
    } catch {
      // share dismissed
    }
  };

  // Locks the car, the free window and the pickup/drop defaults, ready for the booking or the car page.
  const applyDeal = () => {
    if (!activeCar || !activeSlot) return;
    selectCar(activeCar);
    setDates(
      `${activeSlot.startLabel} – ${activeSlot.endLabel}`,
      activeSlot.daysSpan === 0 ? 'Same Day' : '1 Day'
    );
    setTimes(activeSlot.pickupTime, activeSlot.returnTime);
    setIsDeliveryRequested(false);

    if (!pickup?.name) {
      setPickup({
        id: 'hub_pickup',
        name: MYSAWARI_HUB_NAME,
        address: 'MySawari Hub, Kahilipara',
        latitude: 26.1412,
        longitude: 91.7645,
        source: 'database',
      });
    }

    if (!dropoff?.name) {
      setDropoff({
        id: 'city_trip',
        name: 'Local City Trip',
        address: 'City limits / Self-drive destination',
        latitude: 26.1412,
        longitude: 91.7645,
        source: 'database',
      });
    }
  };

  // Sliding up opens the car's regular details page for the free window.
  const openCarPage = () => {
    if (!activeCar || !activeSlot) return;
    Haptics.selectionAsync();
    applyDeal();
    router.push({
      pathname: '/car-details',
      params: {
        id: String(activeCar.id), vehicleId: String(activeCar.id),
        lockDates: 'true', isFixedDates: 'true', isTopDeal: 'true',
        pickupTime: activeSlot.pickupTime, returnTime: activeSlot.returnTime,
        isOvernight: activeSlot.isOvernight ? 'true' : 'false',
      },
    });
  };
  openCarPageRef.current = openCarPage;

  const handleBookDeal = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!activeCar || !activeSlot) return;
    applyDeal();

    const proceed = () => {
      router.push({
        pathname: '/booking',
        params: {
          lockDates: 'true',
          isFixedDates: 'true',
          isTopDeal: 'true',
          isOvernight: activeSlot.isOvernight ? 'true' : 'false',
          dealPrice: String(isMember ? activeSlot.memberPrice : activeSlot.dealPrice),
          hourlyRate: String(activeSlot.hourlyRate),
          slotTitle: activeSlot.title,
        },
      });
    };

    if (!isAuthenticated) {
      setPendingAction(() => proceed);
      setShowLogin(true);
      return;
    }

    proceed();
  };

  const scrollToSection = (key: SectionKey) => {
    setActiveSection(key);
    const y = sectionPositions.current[key];
    if (typeof y === 'number') {
      mainScrollRef.current?.scrollTo({ y: Math.max(0, y - 60), animated: true });
    }
  };

  // Car images
  const carImages: any[] = useMemo(() => {
    if (!activeCar) return [];
    const anyCar = activeCar as any;
    if (Array.isArray(anyCar.images) && anyCar.images.length > 0) {
      return anyCar.images.map((im: any) =>
        typeof im === 'string' ? { uri: im } : (im?.url ? { uri: im.url } : im)
      );
    }
    if (typeof activeCar.image === 'string') return [{ uri: activeCar.image }];
    if ((activeCar.image as any)?.url) return [{ uri: (activeCar.image as any).url }];
    if (activeCar.image) return [activeCar.image];
    return [];
  }, [activeCar]);

  // Auto-slide vehicle photos every 3 seconds
  useEffect(() => {
    if (carImages.length <= 1) return;
    const timer = setInterval(() => {
      setActivePhotoIndex((prev) => (prev + 1) % carImages.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [carImages.length, activeCarIndex]);

  const carName = activeCar?.displayName || activeCar?.name || 'Premium Vehicle';
  const category = activeCar?.category || 'SUV';
  const fuel = activeCar?.fuel || 'Diesel';
  const transmission = activeCar?.transmission || 'Automatic';
  const seats = activeCar?.seats
    ? activeCar.seats.includes('Seater')
      ? activeCar.seats
      : `${activeCar.seats} Seater`
    : '5 Seater';

  // Animation values
  const sheetTopMargin = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, insets.top],
  });

  const sheetBorderRadius = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [26, 0],
  });

  const sheetMarginHorizontal = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [18, 0],
  });

  const bottomCarouselHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [80, 0],
  });

  const bottomCarouselOpacity = expandAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 0, 0],
  });

  const topBarOpacity = expandAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [1, 0, 0],
  });

  if (!isLoading && dealCars.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: '#323E71', alignItems: 'center', justifyContent: 'center', padding: 32 }]}>
        <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: '#FFFFFF', textAlign: 'center' }}>No Top Deals right now</Text>
        <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, color: '#D5D9EA', textAlign: 'center', marginTop: 8 }}>
          Cars that are free for the next few hours show up here. Check back soon.
        </Text>
        <Pressable onPress={() => safeBack(router)} style={{ marginTop: 20, paddingHorizontal: 24, height: 44, borderRadius: 22, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#323E71' }}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Dimmed Background Backdrop (Modal overlay effect matching screenshot) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#323E71' }]} />

      {/* Top Header Bar (Visible when in preview mode) */}
      {!isExpanded && (
        <Animated.View style={[styles.topHeader, { paddingTop: insets.top + 8, opacity: topBarOpacity }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => safeBack(router)}
            style={styles.headerIconBtn}
          >
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.headerTitle}>Top Deals</Text>

          <View style={styles.headerRightActions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Search deals"
              onPress={() => {
                Haptics.selectionAsync();
                setIsSearching((prev) => {
                  if (prev) setSearchQuery('');
                  return !prev;
                });
              }}
              style={styles.headerIconBtn}
            >
              <Feather name={isSearching ? 'x' : 'search'} size={20} color="#FFFFFF" />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share deal"
              onPress={handleShare}
              style={styles.headerIconBtn}
            >
              <Feather name="external-link" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </Animated.View>
      )}

      {!isExpanded && isSearching && (
        <View style={styles.searchBarWrap}>
          <Feather name="search" size={16} color="#94A3B8" />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search car model, SUV, Sedan..."
            placeholderTextColor="#94A3B8"
            style={styles.searchBarInput}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Feather name="x-circle" size={16} color="#94A3B8" />
            </Pressable>
          )}
        </View>
      )}

      {/* Main Sliding Sheet Card (Preview mode matches image, slides open to reveal full car details) */}
      <Animated.View
        style={[
          styles.sheetCard,
          {
            backgroundColor: p.page,
            marginTop: sheetTopMargin,
            borderRadius: sheetBorderRadius,
            marginHorizontal: sheetMarginHorizontal,
          },
        ]}
        {...panResponder.panHandlers}
      >
        {/* Card Header: Down chevron, Heart, Share (external-link) */}
        <View style={styles.cardHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? 'Slide down to preview' : 'Close'}
            onPress={isExpanded ? closeFullDetails : () => safeBack(router)}
            style={[styles.circleActionBtn, { backgroundColor: p.iconBg }]}
          >
            <Feather name="chevron-down" size={22} color={p.muted} />
          </Pressable>

          {isExpanded ? (
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: p.fg }} numberOfLines={1}>
                {carName}
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: '#323E71' }}>
                ⚡ TOP DEAL • LOCKED DATES
              </Text>
            </View>
          ) : (
            <Pressable onPress={openFullDetails} style={styles.swipeHintPill}>
              <Feather name="chevrons-up" size={14} color="#323E71" />
              <Text style={styles.swipeHintText}>Slide up for full details</Text>
            </Pressable>
          )}

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={isFav ? 'Remove from favourites' : 'Add to favourites'}
              onPress={() => {
                if (activeCar) {
                  Haptics.selectionAsync();
                  toggleFavorite(String(activeCar.id));
                }
              }}
              style={[styles.circleActionBtn, { backgroundColor: p.iconBg }]}
            >
              {isFav
                ? <Ionicons name="heart" size={20} color={p.red} />
                : <Feather name="heart" size={20} color={p.muted} />}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share"
              onPress={handleShare}
              style={[styles.circleActionBtn, { backgroundColor: p.iconBg }]}
            >
              <Feather name="external-link" size={19} color={p.muted} />
            </Pressable>
          </View>
        </View>

        {/* Scrollable Body: In preview mode it shows the card from image; on slide up it reveals full car details page */}
        <ScrollView
          ref={mainScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardScroll}
          scrollEventThrottle={32}
        >
          {/* ==================== PREVIEW HERO SECTION (Matching image) ==================== */}
          <Animated.View style={{ transform: [{ translateX: slideX }] }} {...horizontalSwipeResponder.panHandlers}>
            {/* Large Vehicle Photo Gallery */}
            <View style={styles.photoContainer}>
              {carImages.length > 0 ? (
                <Image
                  source={carImages[activePhotoIndex] || carImages[0]}
                  style={styles.photo}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.photo, styles.photoPlaceholder]}>
                  <Ionicons name="car-outline" size={64} color="#9CA3AF" />
                </View>
              )}

              {/* Photo Bottom Controls: Pagination dots + Time badge + Rating */}
              <View style={styles.photoMetaRow}>
                {/* Pagination dots */}
                <View style={styles.dotsRow}>
                  {(carImages.length > 1 ? carImages : [1, 2, 3]).map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.dot,
                        idx === activePhotoIndex ? styles.dotActive : styles.dotInactive,
                      ]}
                    />
                  ))}
                </View>

                <View style={styles.photoBadges}>
                  <View style={styles.timeBadge}>
                    <Text style={styles.timeBadgeText}>⚡ {activeSlot ? `${activeSlot.pickupTime.replace(':00', '')} – ${activeSlot.returnTime.replace(':00', '')}` : ''}</Text>
                  </View>

                  <View style={styles.ratingBadge}>
                    <Ionicons name="star" size={11} color="#059669" />
                    <Text style={styles.ratingText}>4.8 (120)</Text>
                  </View>
                </View>
              </View>

              {/* Expand / View photo button on bottom right */}
              <Pressable
                style={styles.expandBtn}
                onPress={() => {
                  Haptics.selectionAsync();
                  if (carImages.length > 1) {
                    setActivePhotoIndex((prev) => (prev + 1) % carImages.length);
                  }
                }}
              >
                <Ionicons name="copy-outline" size={15} color="#374151" />
              </Pressable>
            </View>

            {/* Category Breadcrumb (Tapping slides open the full car details page) */}
            <Pressable accessibilityRole="link" onPress={openFullDetails} style={styles.categoryLink}>
              <Text style={styles.categoryLinkText}>Explore all {category}s & full details</Text>
              <Feather name="chevron-right" size={14} color="#323E71" />
            </Pressable>

            {/* Car Title */}
            <Pressable onPress={openFullDetails}>
              <Text style={[styles.carTitle, { color: p.fg }]} numberOfLines={2}>
                {carName}
              </Text>
            </Pressable>

            {/* Vehicle Specs / Subtitle */}
            <Text style={[styles.carSpecsSubtitle, { color: p.muted }]}>
              Free for {activeSlot?.durationHours ?? 0} hrs • {seats} • {transmission} • {fuel}
            </Text>
          </Animated.View>

          {/* Package Selector Cards (Overnight, Full Gap, Evening Drive) matching design */}
          {slots.length > 0 && (
            <View style={{ marginTop: 4, marginBottom: 6 }}>
              <Text style={[styles.slotSectionHeader, { color: p.fg }]}>
                Duration: {activeSlot?.durationHours || 12} hrs ({activeSlot?.badge})
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.slotsRow}
              >
                {slots.map((s) => {
                  const isSelected = s.id === (activeSlot?.id || 'overnight');
                  return (
                    <Pressable
                      key={s.id}
                      accessibilityRole="button"
                      accessibilityLabel={s.title}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setSelectedSlotId(s.id);
                      }}
                      style={[
                        styles.slotCard,
                        { borderColor: '#E5E7EB', borderWidth: 1 },
                        isSelected && {
                          borderColor: '#323E71',
                          borderWidth: 2,
                          backgroundColor: '#FFFFFF',
                        },
                      ]}
                    >
                      <Text style={styles.slotTitle} numberOfLines={1}>
                        {s.title}
                      </Text>

                      <View style={styles.discountRow}>
                        <Text style={styles.discountBadgeText}>{s.discountPct}% OFF</Text>
                        <View style={styles.discountDivider} />
                      </View>

                      <View style={styles.slotPriceRow}>
                        <Text style={styles.slotDealPrice}>{formatCurrency(s.dealPrice)}</Text>
                        <View style={styles.memberLockBadge}>
                          <Ionicons name="lock-closed" size={9} color="#065F46" />
                          <Text style={styles.memberLockText}>₹{s.memberPrice}</Text>
                        </View>
                      </View>

                      <View style={styles.slotStrikeRow}>
                        <Text style={styles.slotStrikePrice}>{formatCurrency(s.basePrice)}</Text>
                        <Text style={styles.memberSubText}>MEMBER SAVINGS</Text>
                      </View>

                      <Text style={styles.slotHourlyText}>
                        ₹{s.hourlyRate}/hr
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </View>
          )}

          {/* Slide Up Button Pill in Preview Mode */}
          {!isExpanded && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View full car details"
              onPress={openFullDetails}
              style={styles.expandCarDetailsBtn}
            >
              <Text style={styles.expandCarDetailsBtnText}>
                View Full Specifications & Policies
              </Text>
              <Feather name="chevron-up" size={16} color="#323E71" />
            </Pressable>
          )}

          {/* ==================== FULL CAR DETAILS SECTIONS (Exact design as app car details page) ==================== */}
          {isExpanded && activeCar && (
            <View style={styles.fullCarDetailsContainer}>
              <View style={styles.dividerLine} />

              {/* 1. Vehicle Summary Card */}
              <VehicleSummary
                car={activeCar}
                isAvailable={true}
                availableOn="Today 3:00 PM – Tomorrow 8:00 AM (Top Deal)"
              />
              <View style={{ height: 16 }} />
              <VehicleHeroGallery car={activeCar} />
              <View style={{ height: 16 }} />

              {/* 2. Driver option */}
              <DriverCard />
              <View style={{ height: 10 }} />

              {/* 3. Mileage Limits (Clean unlimited policy) */}
              <MileageLimits />
              <View style={{ height: 10 }} />

              {/* 4. Sticky Section Pills */}
              <View style={{ backgroundColor: p.page, marginVertical: 6 }}>
                <SectionPills
                  sections={SECTIONS}
                  active={activeSection}
                  onPress={scrollToSection}
                />
              </View>

              {/* 5. Main Specifications */}
              <View
                onLayout={(e) => {
                  sectionPositions.current['specification'] = e.nativeEvent.layout.y;
                }}
              >
                <MainSpecification car={activeCar} />
              </View>

              {/* 6. Benefits */}
              <View
                onLayout={(e) => {
                  sectionPositions.current['benefits'] = e.nativeEvent.layout.y;
                }}
              >
                <Benefits />
              </View>

              {/* 7. Reviews Strip & Real Trips */}
              <View
                onLayout={(e) => {
                  sectionPositions.current['reviews'] = e.nativeEvent.layout.y;
                }}
              >
                <ReviewsStrip car={activeCar} />
                <RealTrips car={activeCar} />
              </View>

              {/* 8. Feature List */}
              <View
                onLayout={(e) => {
                  sectionPositions.current['features'] = e.nativeEvent.layout.y;
                }}
              >
                <FeatureList car={activeCar} />
              </View>

              {/* 9. Why Rent From MySawari */}
              <View
                onLayout={(e) => {
                  sectionPositions.current['why'] = e.nativeEvent.layout.y;
                }}
              >
                <WhyRent />
              </View>

              {/* 10. Location Card */}
              <View
                onLayout={(e) => {
                  sectionPositions.current['location'] = e.nativeEvent.layout.y;
                }}
              >
                <LocationCard deliveryAddress={isDeliveryRequested ? pickup?.name : null} />
              </View>

              {/* 11. Policies & Cancellation */}
              <View
                onLayout={(e) => {
                  sectionPositions.current['policy'] = e.nativeEvent.layout.y;
                }}
              >
                <CancellationPolicy freeCancelUntil="Till 24h before trip" />
              </View>

              {/* 12. Inclusions */}
              <View
                onLayout={(e) => {
                  sectionPositions.current['inclusions'] = e.nativeEvent.layout.y;
                }}
              >
                <Inclusions />
              </View>

              {/* 13. Payment Schedule */}
              <View
                onLayout={(e) => {
                  sectionPositions.current['schedule'] = e.nativeEvent.layout.y;
                }}
              >
                <PaymentSchedule />
              </View>

              {/* 14. FAQs & Support */}
              <View
                onLayout={(e) => {
                  sectionPositions.current['faqs'] = e.nativeEvent.layout.y;
                }}
              >
                <Faqs />
                <HelpCard />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Fixed Sticky Bottom Action Bar inside Sheet */}
        <View style={[styles.fixedBottomBar, { borderTopColor: '#E5E7EB', backgroundColor: p.page }]}>
          <View style={styles.bottomPriceInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.bottomSlotLabel}>{activeSlot ? `${activeSlot.durationHours} hrs` : 'Top Deal'}</Text>
              {activeSlot && <Text style={{ color: '#CBD5E1' }}>|</Text>}
              {activeSlot && <Text style={styles.bottomDiscountBadge}>{activeSlot.discountPct}% OFF</Text>}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
              <Text style={styles.bottomPrice}>{formatCurrency((isMember ? activeSlot?.memberPrice : activeSlot?.dealPrice) || 0)}</Text>
              {!!activeSlot && (
                <View style={styles.bottomMemberBadge}>
                  <Ionicons name="lock-closed" size={10} color="#065F46" />
                  <Text style={styles.bottomMemberText}>₹{activeSlot.memberPrice}</Text>
                </View>
              )}
              {!!activeSlot && (
                <Text style={styles.bottomStrikePrice}>{formatCurrency(activeSlot.basePrice)}</Text>
              )}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Book Deal"
            onPress={handleBookDeal}
            style={({ pressed }) => [styles.bookDealBtn, pressed && { opacity: 0.88 }]}
          >
            <Text style={styles.bookDealBtnText}>BOOK DEAL</Text>
          </Pressable>
        </View>
      </Animated.View>

      {/* Bottom Circular Vehicle Thumbnails Carousel (Visible in preview mode, smoothly hides when slid open) */}
      {!isExpanded && (
        <Animated.View
          style={[
            styles.bottomCarouselContainer,
            {
              paddingBottom: Math.max(insets.bottom, 12),
              height: bottomCarouselHeight,
              opacity: bottomCarouselOpacity,
            },
          ]}
        >
          <FlatList
            ref={thumbsRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            data={filteredCars}
            keyExtractor={(item: any, idx: number) => String(item.id || idx)}
            getItemLayout={(_, i) => ({ length: 60, offset: THUMB_PAD + i * 74, index: i })}
            onScrollToIndexFailed={() => {}}
            contentContainerStyle={[styles.bottomCarouselContent, { paddingHorizontal: THUMB_PAD }]}
            renderItem={({ item, index }) => {
              const isSelected = index === activeCarIndex;
              const anyItem = item as any;
              const rawImg =
                (Array.isArray(anyItem.images) && anyItem.images[0]) || anyItem.image;
              const imgSrc =
                typeof rawImg === 'string'
                  ? { uri: rawImg }
                  : (rawImg?.url ? { uri: rawImg.url } : rawImg);

              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={item.displayName || item.name || item.vehicleName}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setActiveCarIndex(index);
                    setActivePhotoIndex(0);
                  }}
                  style={[
                    styles.circleThumbWrap,
                    isSelected && styles.circleThumbWrapActive,
                  ]}
                >
                  {imgSrc ? (
                    <Image source={imgSrc} style={styles.circleThumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.circleThumb, styles.circleThumbPlaceholder]}>
                      <Ionicons name="car" size={24} color="#6B7280" />
                    </View>
                  )}
                </Pressable>
              );
            }}
          />
        </Animated.View>
      )}

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
    </View>
  );
}

const styles = StyleSheet.create({
  dealBox: { marginHorizontal: 16, marginTop: 4, marginBottom: 6, padding: 14, borderRadius: 14, backgroundColor: '#EEF0F7', borderWidth: 1, borderColor: '#D5D9EA', gap: 2 },
  dealWindow: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, lineHeight: 18, color: '#323E71' },
  dealPriceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 10 },
  dealPriceText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 30, lineHeight: 38, color: '#323E71' },
  dealStrike: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, lineHeight: 22, color: '#737373', textDecorationLine: 'line-through' },
  dealNote: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 18, color: '#525252' },
  container: {
    flex: 1,
    backgroundColor: '#374151',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 18,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sheetCard: {
    flex: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  circleActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swipeHintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EEF0F7',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  swipeHintText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#323E71',
  },
  cardScroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  photoContainer: {
    position: 'relative',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 6,
    backgroundColor: '#F3F4F6',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoMetaRow: {
    position: 'absolute',
    bottom: 8,
    left: 10,
    right: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 14,
    backgroundColor: '#323E71',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#CBD5E1',
  },
  photoBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  timeBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: '#1E293B',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  ratingText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: '#059669',
  },
  expandBtn: {
    position: 'absolute',
    bottom: 8,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 2,
  },
  categoryLinkText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#323E71',
  },
  carTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 19,
    lineHeight: 25,
    marginTop: 6,
  },
  carSpecsSubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 4,
    marginBottom: 8,
  },
  slotSectionHeader: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 4,
  },
  slotsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 4,
  },
  slotCard: {
    width: 146,
    padding: 10,
    borderRadius: 14,
    backgroundColor: '#FAFAFA',
  },
  slotTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#1E293B',
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 6,
  },
  discountBadgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#059669',
  },
  discountDivider: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
    marginLeft: 6,
  },
  slotPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  slotDealPrice: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 16,
    color: '#0F172A',
  },
  memberLockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  memberLockText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: '#065F46',
  },
  slotStrikeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 2,
  },
  slotStrikePrice: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  memberSubText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 8,
    color: '#059669',
  },
  slotHourlyText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
  },
  expandCarDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#EEF0F7',
    borderWidth: 1,
    borderColor: '#D5D9EA',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  expandCarDetailsBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#323E71',
  },
  fullCarDetailsContainer: {
    marginTop: 16,
  },
  dividerLine: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  fixedBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  bottomPriceInfo: {
    flex: 1,
  },
  bottomSlotLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
    color: '#475569',
  },
  bottomDiscountBadge: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#059669',
  },
  bottomPrice: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 18,
    color: '#0F172A',
  },
  bottomStrikePrice: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  bottomMemberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#A7F3D0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bottomMemberText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    color: '#065F46',
  },
  bookDealBtn: {
    backgroundColor: '#323E71',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#323E71',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 4,
  },
  bookDealBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  bottomCarouselContainer: {
    paddingTop: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomCarouselContent: {
    paddingHorizontal: 20,
    gap: 14,
    alignItems: 'center',
  },
  circleThumbWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    backgroundColor: '#323E71',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  circleThumbWrapActive: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.08 }],
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 6,
  },
  circleThumb: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
  },
  circleThumbPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#374151',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 18,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  searchBarInput: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
  },
});
