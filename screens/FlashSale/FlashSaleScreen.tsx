import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { safeBack } from '@/utils/navigation';
import {
  exclusiveOffersQueryOptions,
  nextFlashSaleQueryOptions,
  recordOfferView,
} from '@/services/api/offers';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { formatTime12, getIndiaDateParts } from '@/utils/sawari';
import { Bolt, Lettering } from '@/components/home/FlashSaleBanner';
import { formatCurrency } from '@/services/backend/pricingEngine';
import * as Haptics from '@/utils/haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BG = '#3E2DC8';
const FONT = 'PlusJakartaSans_700Bold';
const FONT_SEMI = 'PlusJakartaSans_600SemiBold';
const FONT_MED = 'PlusJakartaSans_500Medium';
const GOLD = '#FBC422';
const GOLD_AMBER = '#F5BD47';
const PINK_SHADOW = { dx: -3.44, dy: 3.44, color: '#FF008B' };
const BLACK_SHADOW = { dx: -1.15, dy: 1.15, color: '#000000' };
const FROST_OVERLAY = 'rgba(28, 28, 30, 0.4)';
const STAR_PATH = 'M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z';
const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Default fallback vehicles so the ticket card and 5-circle arc always render in crisp high quality */
const FALLBACK_VEHICLES = [
  {
    id: 'thar_2025',
    displayName: 'Thar 2025 RWD',
    vehicleName: 'Thar 2025 RWD',
    transmission: 'Manual',
    fuelType: 'Petrol',
    seatingCapacity: 5,
    dealPrice: 5073,
    originalPrice: 5073,
    ratings: { averageRating: 4.2, reviewCount: 48 },
    images: [{ url: 'https://res.cloudinary.com/duyuzd9ra/image/upload/v1779773847/my-sawari/vehicles/vehicle-1779773846844-5b6cp5.jpg' }],
  },
  {
    id: 'nexon_ev',
    displayName: 'Nexon EV',
    vehicleName: 'Nexon EV',
    transmission: 'Automatic',
    fuelType: 'Electric',
    seatingCapacity: 5,
    dealPrice: 4200,
    originalPrice: 4800,
    ratings: { averageRating: 4.5, reviewCount: 32 },
    images: [{ url: 'https://res.cloudinary.com/duyuzd9ra/image/upload/v1791272042/my-sawari/vehicles/vehicle-1791272042393-1msi5f.jpg' }],
  },
  {
    id: 'dzire_vxi',
    displayName: 'Swift Dzire',
    vehicleName: 'Swift Dzire',
    transmission: 'Manual',
    fuelType: 'Petrol',
    seatingCapacity: 5,
    dealPrice: 1700,
    originalPrice: 2200,
    ratings: { averageRating: 4.4, reviewCount: 65 },
    images: [{ url: 'https://res.cloudinary.com/duyuzd9ra/image/upload/v1779773847/my-sawari/vehicles/vehicle-1779773846844-5b6cp5.jpg' }],
  },
  {
    id: 'alto_k10',
    displayName: 'Alto K10',
    vehicleName: 'Alto K10',
    transmission: 'Manual',
    fuelType: 'Petrol',
    seatingCapacity: 4,
    dealPrice: 1000,
    originalPrice: 1400,
    ratings: { averageRating: 4.1, reviewCount: 19 },
    images: [{ url: 'https://res.cloudinary.com/duyuzd9ra/image/upload/v1791177935/my-sawari/vehicles/vehicle-1791177934459-v5r5vh.jpg' }],
  },
  {
    id: 'seltos_gt',
    displayName: 'Kia Seltos',
    vehicleName: 'Kia Seltos',
    transmission: 'Automatic',
    fuelType: 'Diesel',
    seatingCapacity: 5,
    dealPrice: 3800,
    originalPrice: 4500,
    ratings: { averageRating: 4.6, reviewCount: 54 },
    images: [{ url: 'https://res.cloudinary.com/duyuzd9ra/image/upload/v1779773847/my-sawari/vehicles/vehicle-1779773846844-5b6cp5.jpg' }],
  },
];

/** Light rays from center: white 8% at the outer edge fading inward */
function Rays({ width, height }: { width: number; height: number }) {
  const cx = width / 2;
  const cy = height / 2 + 5;
  const r = Math.hypot(width, height);
  const n = 32;
  const d = Array.from({ length: n / 2 }, (_, i) => {
    const a0 = ((i * 2) / n) * Math.PI * 2;
    const a1 = ((i * 2 + 1) / n) * Math.PI * 2;
    return `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} L${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`;
  }).join(' ');

  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="flashRays" cx={cx} cy={cy} r={565} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.08} />
        </RadialGradient>
      </Defs>
      <Path d={d} fill="url(#flashRays)" />
    </Svg>
  );
}

/** 4-pointed golden sparkle star at ticket corners */
function Sparkle({ size, left, top }: { size: number; left: number; top: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={{ position: 'absolute', left, top }} pointerEvents="none">
      <Path d={STAR_PATH} fill={GOLD} />
    </Svg>
  );
}

/** 3-layer drop underline (white top, black middle shadow, pink bottom shadow) */
function TripleUnderline({ width = 160 }: { width?: number }) {
  return (
    <View style={{ width, height: 6, alignSelf: 'center', marginTop: 4 }}>
      <View style={{ position: 'absolute', left: 0, right: 0, top: 4, height: 2.3, backgroundColor: '#FF008B', borderRadius: 2 }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 2, height: 2.3, backgroundColor: '#000000', borderRadius: 2 }} />
      <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: 2.3, backgroundColor: '#FFFFFF', borderRadius: 2 }} />
    </View>
  );
}

/** Live ticking countdown timer box in top header (Images 6 & 7) */
function LiveCountdownHeader({ expiryMs }: { expiryMs: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diffMs = Math.max(0, expiryMs - now);
  const totalSecs = Math.floor(diffMs / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <View style={styles.liveHeaderWrap}>
      {/* Left: Bolt + stacked FLASH SALE 3D Lettering */}
      <View style={styles.liveTitleCol}>
        <Bolt width={16} line={0.6} near={0.5} far={1.5} style={{ left: -14, top: 10 }} />
        <View style={{ marginLeft: 6 }}>
          <Lettering text="FLASH" size={26} shadow={PINK_SHADOW} font={FONT} near={1.15} outline={1.3} skew="0deg" scaleY={1.12} />
          <Lettering text="SALE" size={34} shadow={PINK_SHADOW} font={FONT} near={1.15} outline={1.3} skew="0deg" scaleY={1.12} />
        </View>
      </View>

      {/* Right: ENDS IN + 3 white square boxes */}
      <View style={styles.liveTimerCol}>
        <Text style={styles.endsInLabel}>ENDS IN</Text>
        <View style={styles.timerRow}>
          <View style={styles.timerUnit}>
            <View style={styles.timerBox}>
              <Text style={styles.timerNum}>{pad(hrs)}</Text>
            </View>
            <Text style={styles.timerUnitText}>Hrs</Text>
          </View>
          <View style={styles.timerUnit}>
            <View style={styles.timerBox}>
              <Text style={styles.timerNum}>{pad(mins)}</Text>
            </View>
            <Text style={styles.timerUnitText}>Min</Text>
          </View>
          <View style={styles.timerUnit}>
            <View style={styles.timerBox}>
              <Text style={styles.timerNum}>{pad(secs)}</Text>
            </View>
            <Text style={styles.timerUnitText}>Sec</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function FlashSaleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { membership, selectCar, setDates, setTimes, applyCoupon, setPickup, setDropoff } = useSawari();
  const { data: fleetVehicles = [] } = useVehicles();

  // Queries
  const { data: offers = [], isLoading: offersLoading } = useQuery(exclusiveOffersQueryOptions);
  const liveOffer = offers[0] || null;
  const isLive = Boolean(liveOffer);

  const { data: nextSale, isLoading: nextLoading } = useQuery({
    ...nextFlashSaleQueryOptions,
    enabled: !isLive,
  });

  const scheduledStartsMs = nextSale?.startsAt ? new Date(nextSale.startsAt).getTime() : 0;
  const isScheduled = !isLive && scheduledStartsMs > Date.now();
  const isComingSoon = !isLive && !isScheduled && !offersLoading && !nextLoading;

  // Membership status
  const userTier = (membership?.plan || '').toLowerCase().trim();
  const isMember = Boolean(
    userTier &&
    userTier !== 'none' &&
    (!membership?.expiresAt || new Date(membership.expiresAt).getTime() > Date.now())
  );

  // Early access window state
  const earlyAccessMinutes = isLive
    ? (liveOffer?.earlyAccessHours ? Math.round(liveOffer.earlyAccessHours * 60) : 10)
    : (nextSale?.earlyAccessMinutes || 10);

  const earlyAccessEndsMs = useMemo(() => {
    if (isLive && liveOffer?.earlyAccessEndsAt) {
      return new Date(liveOffer.earlyAccessEndsAt).getTime();
    }
    return 0;
  }, [isLive, liveOffer]);

  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const isEarlyAccessActive = isLive && (
    Boolean(liveOffer?.isEarlyAccessLocked) ||
    Boolean(liveOffer?.isEarlyAccessUnlocked) ||
    (earlyAccessEndsMs > nowMs)
  );

  // Can the customer book now?
  const canBook = isLive && (
    !liveOffer?.isEarlyAccessLocked &&
    (liveOffer?.isEligible !== false || isMember)
  );

  // View state for scheduled sale: allow toggle or previewing
  const [previewLocked, setPreviewLocked] = useState(!isMember);
  useEffect(() => {
    if (isMember) setPreviewLocked(false);
  }, [isMember]);

  // Cars list construction
  const currentOffer = liveOffer || nextSale?.offer || null;
  const displayCars = useMemo(() => {
    const list: any[] = [];
    const pushCar = (c: any, dPrice?: number, origPrice?: number) => {
      if (!c) return;
      const id = String(c.id || c._id);
      if (list.some((item) => String(item.id || item._id) === id)) return;
      list.push({
        ...c,
        dealPrice: dPrice || currentOffer?.promotionalPrice || (c.pricePerDay ? Math.round(c.pricePerDay * 0.7) : 399),
        originalPrice: origPrice || (c.pricePerDay ? c.pricePerDay * (currentOffer?.rentalDays || 1) : 1000),
      });
    };

    // 1. Vehicle prices array
    if (Array.isArray(currentOffer?.vehiclePrices) && currentOffer.vehiclePrices.length > 0) {
      currentOffer.vehiclePrices.forEach((vp: any) => {
        const v = typeof vp.vehicleId === 'object' && vp.vehicleId ? vp.vehicleId : fleetVehicles.find((fv: any) => String(fv.id || fv._id) === String(vp.vehicleId));
        if (v) pushCar(v, vp.dealPrice, vp.originalPrice);
      });
    }

    // 2. Applicable vehicle IDs
    if (Array.isArray(currentOffer?.applicableVehicleIds) && currentOffer.applicableVehicleIds.length > 0) {
      currentOffer.applicableVehicleIds.forEach((av: any) => {
        const id = typeof av === 'object' && av ? String(av._id || av.id) : String(av);
        const v = typeof av === 'object' && av ? av : fleetVehicles.find((fv: any) => String(fv.id || fv._id) === id);
        if (v) pushCar(v);
      });
    }

    // 3. Single vehicleId
    if (currentOffer?.vehicleId) {
      const v = typeof currentOffer.vehicleId === 'object' && currentOffer.vehicleId
        ? currentOffer.vehicleId
        : fleetVehicles.find((fv: any) => String(fv.id || fv._id) === String(currentOffer.vehicleId));
      if (v) pushCar(v);
    }

    // 4. Fill from fleet vehicles
    fleetVehicles.forEach((fv) => {
      if (list.length < 5) pushCar(fv);
    });

    // 5. Fill from fallback vehicles if fleet is empty
    FALLBACK_VEHICLES.forEach((fb) => {
      if (list.length < 5) pushCar(fb);
    });

    return list.slice(0, 5);
  }, [currentOffer, fleetVehicles]);

  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const activeCar = displayCars[selectedCarIndex] || displayCars[0] || FALLBACK_VEHICLES[0];

  // Helper to extract safe photo URL
  const getCarImage = useCallback((car: any, fallbackIdx = 0): string => {
    const raw = car?.images?.[0];
    const url = typeof raw === 'string' ? raw : raw?.url;
    if (url && typeof url === 'string' && (url.startsWith('http') || url.startsWith('/uploads'))) {
      return url;
    }
    const fb = FALLBACK_VEHICLES[fallbackIdx % FALLBACK_VEHICLES.length];
    return (fb.images[0] as any).url;
  }, []);

  // Swiping card gesture
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dx) > 15 && Math.abs(gesture.dy) < 30,
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dx < -40) {
            // Swipe left -> next car
            Haptics.selectionAsync();
            setSelectedCarIndex((prev) => (prev + 1) % displayCars.length);
          } else if (gesture.dx > 40) {
            // Swipe right -> prev car
            Haptics.selectionAsync();
            setSelectedCarIndex((prev) => (prev - 1 + displayCars.length) % displayCars.length);
          }
        },
      }),
    [displayCars.length]
  );

  // Booking action
  const handleBookNow = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (liveOffer) {
      recordOfferView(liveOffer._id || liveOffer.id);
    }

    // 1. Select vehicle
    if (activeCar) {
      selectCar(activeCar);
    }

    // 2. Pre-fill dates and duration
    const today = new Date();
    const daysCount = currentOffer?.rentalDays || 1;
    const endD = new Date(today.getTime() + daysCount * 24 * 3600 * 1000);
    const travelRange = `${today.getDate()} ${MONTHS_SHORT[today.getMonth()]} – ${endD.getDate()} ${MONTHS_SHORT[endD.getMonth()]}`;

    const isOvernight = Boolean(currentOffer?.isOvernight);
    const pickupT = currentOffer?.pickupTime || (isOvernight ? '08:00 PM' : '08:00 AM');
    const returnT = currentOffer?.returnTime || (isOvernight ? '08:00 AM' : '08:00 AM');

    setDates(travelRange, `${daysCount} ${daysCount === 1 ? 'Day' : 'Days'}`);
    setTimes(currentOffer?.rentalStartTime || pickupT, currentOffer?.rentalEndTime || returnT);

    // 3. Set pickup/dropoff default to hub
    setPickup({ id: 'hub', name: 'MySawari Hub', address: 'Silchar Main Hub', latitude: 24.8333, longitude: 92.7789, source: 'database' });
    setDropoff({ id: 'hub', name: 'MySawari Hub', address: 'Silchar Main Hub', latitude: 24.8333, longitude: 92.7789, source: 'database' });

    // 4. Apply coupon
    const code = (liveOffer as any)?.userClaim?.couponCode || liveOffer?.code || currentOffer?.code;
    if (code) {
      applyCoupon(code);
    }

    // 5. Navigate to booking
    router.push({
      pathname: '/booking',
      params: {
        exclusiveOfferId: String(liveOffer?._id || liveOffer?.id || ''),
        dealPrice: String(activeCar?.dealPrice || currentOffer?.promotionalPrice || ''),
      },
    });
  }, [activeCar, currentOffer, liveOffer, router, selectCar, setDates, setTimes, setPickup, setDropoff, applyCoupon]);

  // View details action
  const handleViewDetails = useCallback(() => {
    Haptics.selectionAsync();
    if (activeCar) {
      selectCar(activeCar);
      router.push({
        pathname: '/car-details',
        params: { id: String(activeCar.id || activeCar._id) },
      });
    }
  }, [activeCar, router, selectCar]);

  // Schedule text calculations
  const scheduleInfo = useMemo(() => {
    if (!scheduledStartsMs) return { weekday: 'SATURDAY', timeStr: '8 AM', fullLabel: 'STARTS SATURDAY 8AM' };
    const p = getIndiaDateParts(scheduledStartsMs);
    const day = WEEKDAYS[new Date(Date.UTC(p.year, p.month, p.date)).getUTCDay()];
    const hour12 = p.hours % 12 === 0 ? 12 : p.hours % 12;
    const ampm = p.hours >= 12 ? 'PM' : 'AM';
    const timeStr = p.minutes > 0 ? `${hour12}:${String(p.minutes).padStart(2, '0')} ${ampm}` : `${hour12} ${ampm}`;
    return {
      weekday: day,
      timeStr,
      fullLabel: `STARTS ${day} ${timeStr}`,
    };
  }, [scheduledStartsMs]);

  // Expiry timestamp for live sale
  const expiryMs = useMemo(() => {
    if (liveOffer?.expiryDate) {
      return new Date(liveOffer.expiryDate).getTime();
    }
    // Default to midnight tonight
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end.getTime();
  }, [liveOffer]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <Rays width={windowWidth} height={windowHeight} />

      {/* Top Header */}
      <View style={styles.navRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => safeBack(router)}
          style={styles.backBtn}
        >
          <Feather name="chevron-left" size={24} color="#FFFFFF" />
        </Pressable>

        {isLive && <LiveCountdownHeader expiryMs={expiryMs} />}
      </View>

      {/* Content depending on state */}
      {isComingSoon ? (
        // State 1 & 2: COMING SOON / NO ACTIVE SALE
        <View style={styles.centerComingSoon} accessible accessibilityRole="header" accessibilityLabel="Flash Sale Coming Soon">
          <View style={styles.comingSoonGroup}>
            <View style={[styles.csLine, { top: 4 }]}>
              <Lettering text="FLASH" width={160} size={42} shadow={PINK_SHADOW} near={1.42} outline={1.7} skew="0deg" scaleY={1.15} font={FONT} />
            </View>
            <View style={[styles.csLine, { top: 46 }]}>
              <Lettering text="SALE" width={190} size={66} shadow={PINK_SHADOW} near={1.42} outline={1.7} skew="0deg" scaleY={1.15} font={FONT} />
            </View>
            <View style={[styles.csLine, { top: 132 }]}>
              <Lettering text="COMING" width={370} size={38} shadow={BLACK_SHADOW} near={1.15} outline={1.37} skew="0deg" scaleY={1.15} font={FONT} />
            </View>
            <View style={[styles.csLine, { top: 174 }]}>
              <Lettering text="SOON" width={370} size={38} shadow={BLACK_SHADOW} near={1.15} outline={1.37} skew="0deg" scaleY={1.15} font={FONT} />
            </View>
            <Bolt width={32} style={{ left: 52, top: 0 }} />
            <Bolt width={32} style={{ left: 298, top: 80 }} />
          </View>
        </View>
      ) : (
        // States 3, 4, 5, 6, 7: SCHEDULED or LIVE SALE
        <View style={styles.mainContainer}>
          {/* Scheduled Header (Images 3, 4, 5) */}
          {isScheduled && (
            <View style={styles.scheduledHeaderWrap}>
              <View style={styles.scheduledTitleRow}>
                <Bolt width={18} line={0.61} near={0.51} far={1.53} style={{ position: 'relative' }} />
                <Lettering text="FLASH SALE" size={32} shadow={PINK_SHADOW} near={1.15} outline={1.37} skew="0deg" scaleY={1.15} font={FONT} />
                <Bolt width={18} line={0.61} near={0.51} far={1.53} style={{ position: 'relative' }} />
              </View>

              <View style={styles.scheduledSubRow}>
                <Lettering text={scheduleInfo.fullLabel} size={32} shadow={BLACK_SHADOW} near={1.15} outline={1.37} skew="0deg" scaleY={1.15} font={FONT} />
                <TripleUnderline width={220} />
              </View>
            </View>
          )}

          {/* Ticket Card + Sparkles */}
          <View style={styles.ticketSection}>
            <Sparkle size={14} left={-10} top={-10} />
            <Sparkle size={7} left={-14} top={-16} />
            <Sparkle size={14} left={348} top={-10} />
            <Sparkle size={7} left={358} top={-16} />

            <View style={styles.ticketCard} {...panResponder.panHandlers}>
              {/* Notches */}
              <View style={[styles.notch, { left: -14 }]} />
              <View style={[styles.notch, { right: -14 }]} />
              <View style={styles.dashedDivider} />

              {/* Photo Area */}
              <View style={styles.photoContainer}>
                <Image
                  source={{ uri: getCarImage(activeCar, selectedCarIndex) }}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  blurRadius={isScheduled && previewLocked ? 24 : 0}
                  transition={200}
                />

                {/* If locked preview: frosted overlay + members access card */}
                {isScheduled && previewLocked ? (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: FROST_OVERLAY, alignItems: 'center', justifyContent: 'center' }]}>
                    <View style={styles.lockedCardOverlay}>
                      <Text style={styles.lockedCardTitle}>
                        Members Get {earlyAccessMinutes} Minutes.{'\n'}
                        <Text style={{ color: '#3E2DC8' }}>Exclusive Access.</Text>
                      </Text>
                      <Pressable
                        onPress={() => {
                          Haptics.selectionAsync();
                          setPreviewLocked(false);
                        }}
                        style={styles.previewToggleBtn}
                      >
                        <Text style={styles.previewToggleText}>Tap to Preview Cars 👆</Text>
                      </Pressable>
                    </View>
                  </View>
                ) : (
                  // Revealed mode photo contents (Images 5, 6, 7)
                  <>
                    {/* Top-left Amber Duration Badge */}
                    <View style={styles.durationBadge}>
                      <Text style={styles.durationBadgeText}>
                        {currentOffer?.rentalDays ? `${currentOffer.rentalDays} ${currentOffer.rentalDays === 1 ? 'Day' : 'Days'}` : '3 Days'}
                      </Text>
                    </View>

                    {/* Member Early Access Frosted Pill */}
                    {(isScheduled || isEarlyAccessActive) && (
                      <View style={styles.earlyAccessOverlayPill}>
                        <View style={styles.earlyAccessRow}>
                          <Image
                            source={require('@/assets/images/crown_deal.png')}
                            style={styles.earlyAccessCrown}
                            contentFit="contain"
                          />
                          <Text style={styles.earlyAccessWhiteText}>
                            Members get <Text style={styles.earlyAccessGoldText}>early access</Text>
                          </Text>
                        </View>
                        <Text style={styles.earlyAccessSub}>
                          Unlock this offer {earlyAccessMinutes} minutes early with Membership.
                        </Text>
                      </View>
                    )}

                    {/* Carousel Dots */}
                    <View style={styles.dotsRow}>
                      {[0, 1, 2, 3].map((dotIdx) => (
                        <View
                          key={dotIdx}
                          style={[styles.dot, dotIdx === (selectedCarIndex % 4) && styles.dotActive]}
                        />
                      ))}
                    </View>
                  </>
                )}
              </View>

              {/* Bottom Details Section */}
              {isScheduled && previewLocked ? (
                // Locked times cards (Images 3 & 4)
                <View style={styles.lockedTimesRow}>
                  <View style={[styles.timeBox, styles.timeBoxGold]}>
                    <Text style={styles.timeBoxMain} numberOfLines={1}>
                      {formatTime12(scheduledStartsMs - earlyAccessMinutes * 60000)} – {formatTime12(scheduledStartsMs)}
                    </Text>
                    <Text style={[styles.timeBoxSub, { color: '#E58900' }]} numberOfLines={1}>
                      Exclusive Member Access
                    </Text>
                  </View>
                  <View style={styles.timeBox}>
                    <Text style={styles.timeBoxMain} numberOfLines={1}>
                      {formatTime12(scheduledStartsMs)} onwards
                    </Text>
                    <Text style={styles.timeBoxSub} numberOfLines={1}>
                      Open to Everyone
                    </Text>
                  </View>
                </View>
              ) : (
                // Revealed Vehicle Details (Images 5, 6, 7)
                <View style={styles.detailsContainer}>
                  {/* Row 1: Car Name & Rating */}
                  <View style={styles.detailsRow1}>
                    <Text style={styles.carTitle} numberOfLines={1}>
                      {activeCar.displayName || activeCar.vehicleName || 'Thar 2025 RWD'}
                    </Text>

                    <View style={styles.ratingCol}>
                      <View style={styles.ratingBadge}>
                        <Text style={styles.ratingNum}>
                          {(activeCar.ratings?.averageRating || 4.2).toFixed(1)}
                        </Text>
                        <Text style={styles.ratingStar}> ★</Text>
                      </View>
                      <Text style={styles.reviewCount}>
                        ({activeCar.ratings?.reviewCount || 48} Reviews)
                      </Text>
                    </View>
                  </View>

                  {/* Row 2: Specs */}
                  <Text style={styles.specsText} numberOfLines={1}>
                    {[
                      activeCar.transmission || 'Manual',
                      activeCar.fuelType || 'Petrol',
                      `${activeCar.seatingCapacity || 5} Seater`,
                    ].join(' • ')}
                  </Text>

                  {/* Row 3: Deal Price + Original Struck Price + View Details */}
                  <View style={styles.detailsRow3}>
                    <View style={styles.priceRow}>
                      <Text style={styles.dealPriceText}>
                        {formatCurrency(activeCar.dealPrice || currentOffer?.promotionalPrice || 5073)}
                      </Text>
                      <Text style={styles.struckPriceText}>
                        {formatCurrency(activeCar.originalPrice || 5073)}
                      </Text>
                    </View>

                    <Pressable
                      hitSlop={10}
                      onPress={handleViewDetails}
                      style={({ pressed }) => pressed && { opacity: 0.7 }}
                    >
                      <Text style={styles.viewDetailsText}>View Details &gt;</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>

            {/* Main CTA Button */}
            {isScheduled ? (
              // Scheduled State CTA Button (Images 3, 4, 5)
              previewLocked ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push('/membership');
                  }}
                  style={({ pressed }) => [styles.mainCtaBtn, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.mainCtaText}>Get Membership &amp; Unlock Early Access</Text>
                </Pressable>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (!isMember) {
                      router.push('/membership');
                    }
                  }}
                  style={({ pressed }) => [styles.mainCtaBtn, pressed && { opacity: 0.9 }]}
                >
                  <View style={styles.ctaLockRow}>
                    <Text style={styles.lockEmoji}>🔒</Text>
                    <Text style={styles.mainCtaText}>
                      Unlocks {scheduleInfo.weekday.charAt(0) + scheduleInfo.weekday.slice(1).toLowerCase()} at {scheduleInfo.timeStr}
                    </Text>
                  </View>
                </Pressable>
              )
            ) : isLive && !canBook ? (
              // Live Early Access Window for non-member (Image 6)
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/membership');
                }}
                style={({ pressed }) => [styles.mainCtaBtn, pressed && { opacity: 0.9 }]}
              >
                <View style={styles.ctaLockRow}>
                  <Text style={styles.mainCtaText}>Buy Membership to </Text>
                  <Text style={styles.lockEmoji}>🔒</Text>
                  <Text style={styles.mainCtaText}> Unlock</Text>
                </View>
              </Pressable>
            ) : (
              // Live Open to Member / Everyone -> BOOK NOW (Image 7)
              <Pressable
                accessibilityRole="button"
                onPress={handleBookNow}
                style={({ pressed }) => [styles.mainCtaBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={[styles.mainCtaText, styles.bookNowText]}>BOOK NOW</Text>
              </Pressable>
            )}
          </View>

          {/* Interactive Bottom Arc with 5 Circular Thumbnails */}
          <View style={styles.arcWrap}>
            <Svg width={SCREEN_WIDTH} height={120} style={StyleSheet.absoluteFill} pointerEvents="none">
              <Ellipse
                cx={SCREEN_WIDTH / 2}
                cy={150}
                rx={SCREEN_WIDTH * 0.46}
                ry={110}
                stroke="rgba(255,255,255,0.4)"
                strokeWidth={1}
                strokeDasharray="6 6"
                fill="none"
              />
            </Svg>

            <View style={styles.arcThumbnailsRow}>
              {displayCars.map((car, idx) => {
                const isSelected = idx === selectedCarIndex;
                const uri = getCarImage(car, idx);

                // Slot geometry: center is at idx === selectedCarIndex
                const size = isSelected ? 56 : idx === 1 || idx === 3 ? 46 : 40;
                const ring = size + (isSelected ? 4 : 2);

                return (
                  <Pressable
                    key={String(car.id || car._id || idx)}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSelectedCarIndex(idx);
                      if (previewLocked) setPreviewLocked(false);
                    }}
                    style={[
                      styles.arcThumbBtn,
                      { width: ring, height: ring, borderRadius: ring / 2 },
                      isSelected && styles.arcThumbActive,
                    ]}
                  >
                    <Image
                      source={{ uri }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      blurRadius={isScheduled && previewLocked ? 12 : 0}
                      transition={150}
                    />
                    {isScheduled && previewLocked && (
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: FROST_OVERLAY }]} />
                    )}

                    {/* Floating Gold Crown on selected thumbnail */}
                    {isSelected && (
                      <Image
                        source={require('@/assets/images/crown_deal.png')}
                        style={styles.crownDealIcon}
                        contentFit="contain"
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  navRow: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  /* Live header with ticking countdown timer (Images 6 & 7) */
  liveHeaderWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  liveTitleCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveTimerCol: {
    alignItems: 'center',
  },
  endsInLabel: {
    fontFamily: FONT,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  timerRow: {
    flexDirection: 'row',
    gap: 6,
  },
  timerUnit: {
    alignItems: 'center',
  },
  timerBox: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  timerNum: {
    fontFamily: FONT,
    fontSize: 17,
    color: '#3E2DC8',
  },
  timerUnitText: {
    fontFamily: FONT_SEMI,
    fontSize: 10,
    color: '#FFFFFF',
    marginTop: 2,
  },

  /* Coming Soon Screen (Images 1 & 2) */
  centerComingSoon: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 56,
  },
  comingSoonGroup: {
    width: 378,
    maxWidth: '100%',
    height: 224,
  },
  csLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },

  /* Main Container */
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },

  /* Scheduled Header (Images 3, 4, 5) */
  scheduledHeaderWrap: {
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  scheduledTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduledSubRow: {
    alignItems: 'center',
  },

  /* Ticket Section */
  ticketSection: {
    alignSelf: 'center',
    width: 353,
    marginTop: 10,
  },
  ticketCard: {
    width: 353,
    height: 360,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: '#FEFDF0',
    overflow: 'hidden',
  },
  notch: {
    position: 'absolute',
    top: 226,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: GOLD,
    zIndex: 2,
  },
  dashedDivider: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 240,
    borderTopWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(107,90,237,0.5)',
    zIndex: 1,
  },

  /* Photo inside ticket */
  photoContainer: {
    position: 'absolute',
    left: 12,
    top: 12,
    width: 329,
    height: 216,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
  },
  durationBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    backgroundColor: GOLD_AMBER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    zIndex: 3,
  },
  durationBadgeText: {
    fontFamily: FONT,
    fontSize: 12,
    color: '#262626',
  },
  earlyAccessOverlayPill: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 22,
    backgroundColor: 'rgba(28, 28, 30, 0.86)',
    borderWidth: 1,
    borderColor: 'rgba(251, 196, 34, 0.65)',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  earlyAccessRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  earlyAccessCrown: {
    width: 16,
    height: 16,
    marginRight: 6,
    transform: [{ rotate: '-18deg' }],
  },
  earlyAccessWhiteText: {
    fontFamily: FONT,
    fontSize: 13,
    color: '#FFFFFF',
  },
  earlyAccessGoldText: {
    fontFamily: FONT,
    color: GOLD_AMBER,
  },
  earlyAccessSub: {
    fontFamily: FONT_MED,
    fontSize: 10.5,
    color: '#FFFFFF',
    marginTop: 2,
    textAlign: 'center',
  },
  dotsRow: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 18,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#FFFFFF',
  },

  /* Locked overlay card (Images 3 & 4) */
  lockedCardOverlay: {
    width: 290,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(251,196,34,0.6)',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  lockedCardTitle: {
    fontFamily: FONT,
    fontSize: 16,
    lineHeight: 24,
    color: '#262626',
    textAlign: 'center',
  },
  previewToggleBtn: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  previewToggleText: {
    fontFamily: FONT_SEMI,
    fontSize: 12,
    color: '#3E2DC8',
  },

  /* Locked times row (Images 3 & 4) */
  lockedTimesRow: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    width: 329,
    height: 90,
    flexDirection: 'row',
    gap: 6,
    padding: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,196,34,0.52)',
    backgroundColor: '#FFFFFF',
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  timeBoxGold: {
    backgroundColor: '#FEFEF5',
    borderWidth: 1,
    borderColor: 'rgba(251,196,34,0.52)',
    borderRadius: 6,
  },
  timeBoxMain: {
    fontFamily: FONT,
    fontSize: 13,
    color: '#262626',
  },
  timeBoxSub: {
    fontFamily: FONT_SEMI,
    fontSize: 11,
    color: '#737373',
    marginTop: 2,
  },

  /* Revealed vehicle details (Images 5, 6, 7) */
  detailsContainer: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 10,
    height: 104,
    justifyContent: 'space-between',
  },
  detailsRow1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  carTitle: {
    fontFamily: FONT,
    fontSize: 18,
    color: '#1E1E1E',
    flex: 1,
    marginRight: 8,
  },
  ratingCol: {
    alignItems: 'flex-end',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#24366A',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: 10,
  },
  ratingNum: {
    fontFamily: FONT,
    fontSize: 12,
    color: '#FFFFFF',
  },
  ratingStar: {
    fontFamily: FONT,
    fontSize: 11,
    color: GOLD_AMBER,
  },
  reviewCount: {
    fontFamily: FONT_MED,
    fontSize: 10,
    color: '#737373',
    marginTop: 2,
  },
  specsText: {
    fontFamily: FONT_MED,
    fontSize: 12.5,
    color: '#737373',
  },
  detailsRow3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  dealPriceText: {
    fontFamily: FONT,
    fontSize: 22,
    color: '#1E1E1E',
  },
  struckPriceText: {
    fontFamily: FONT_MED,
    fontSize: 13,
    color: '#8E8E93',
    textDecorationLine: 'line-through',
    marginLeft: 8,
  },
  viewDetailsText: {
    fontFamily: FONT_SEMI,
    fontSize: 13,
    color: '#737373',
  },

  /* Main CTA Button */
  mainCtaBtn: {
    width: 353,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 12,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 3,
  },
  mainCtaText: {
    fontFamily: FONT,
    fontSize: 16,
    color: '#3E2DC8',
  },
  bookNowText: {
    fontSize: 17,
    letterSpacing: 0.6,
  },
  ctaLockRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockEmoji: {
    fontSize: 16,
    marginRight: 6,
  },

  /* Bottom Arc with 5 Circular Thumbnails */
  arcWrap: {
    alignSelf: 'center',
    width: SCREEN_WIDTH,
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arcThumbnailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingTop: 10,
  },
  arcThumbBtn: {
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: GOLD,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
  },
  arcThumbActive: {
    borderWidth: 2,
    borderColor: GOLD_AMBER,
    shadowOpacity: 0.35,
    shadowRadius: 5,
  },
  crownDealIcon: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 20,
    height: 20,
    transform: [{ rotate: '-24deg' }],
  },
});
