import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Share,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Image as CachedImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, RadialGradient, Stop, Ellipse, Circle } from 'react-native-svg';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '@/utils/haptics';
import { safeBack } from '@/utils/navigation';
import { useSawari } from '@/context/SawariContext';
import { useDealCars, dealPricing } from '@/hooks/useDealCars';
import { formatCurrency, MYSAWARI_HUB_NAME } from '@/services/backend/pricingEngine';
import {
  dayNumToLabel,
  todayDayNum,
  isInService,
  buildBlocks,
  parseTimeToMinutes,
  toDayNum,
  dayNumAndTimeToMs,
  parseDayLabel,
  formatTime12,
  getIndiaDateParts,
  bestFor,
  MONTH_NAMES,
} from '@/utils/sawari';
import { useQuery } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { HeartIcon } from '@/components/vehicle/HeartIcon';
import { MIN_PUBLIC_REVIEW_RATING } from '@/utils/sawari';
import { memberPriceFor } from '@/screens/Membership/MembershipScreen';
import { exclusiveOffersQueryOptions } from '@/services/api/offers';
import { LoadingImage } from '@/components/common/LoadingImage';
import { getVehicleImage } from '@/utils/vehicleImages';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

/** Formats "Available till 8:00 AM" or "Available till Tomorrow, 8:00 AM" in Indian Standard Time */
function formatAvailableTill(endMs: number, nowMs: number): string {
  const endParts = getIndiaDateParts(endMs);
  const nowParts = getIndiaDateParts(nowMs);
  const timeStr = formatTime12(endMs);

  const isSameDay =
    endParts.year === nowParts.year &&
    endParts.month === nowParts.month &&
    endParts.date === nowParts.date;

  const endDayNum = toDayNum(endParts.year, endParts.month, endParts.date);
  const nowDayNum = toDayNum(nowParts.year, nowParts.month, nowParts.date);
  const isTomorrow = endDayNum === nowDayNum + 1;

  if (isSameDay || isTomorrow) {
    return `Available till ${timeStr}`;
  } else {
    const month = MONTH_NAMES[endParts.month] || '';
    const monthCap = month ? month[0].toUpperCase() + month.slice(1) : '';
    return `Available till ${endParts.date} ${monthCap}, ${timeStr}`;
  }
}

/** 4-pointed sparkle star matching Figma spec */
function FourPointStar({ size = 12, color = '#FBC422' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 0C12 6.627 6.627 12 0 12C6.627 12 12 17.373 12 24C12 17.373 17.373 12 24 12C17.373 12 12 6.627 12 0Z"
        fill={color}
      />
    </Svg>
  );
}

/** Crisp golden crown icon tilted on top-left of Today's Deal badge */
function CrownDealIcon({ size = 14, color = '#FBC422' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M2.5 19h19c.8 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.5-1.1L19 7l-5 6.5L12 3l-2 10.5L5 7 1.5 16.4c-.3.3-.5.7-.5 1.1 0 .8.7 1.5 1.5 1.5z"
        fill={color}
      />
      <Circle cx="12" cy="2.5" r="1.5" fill={color} />
      <Circle cx="5" cy="6.5" r="1.5" fill={color} />
      <Circle cx="19" cy="6.5" r="1.5" fill={color} />
    </Svg>
  );
}

interface VehicleCardProps {
  car: any;
  nowMs: number;
  targetEndMs: number;
  isMember: boolean;
  memberPlan: string | null;
  isFav: boolean;
  onToggleFav: () => void;
  onPress: () => void;
  onPressExtend?: () => void;
}

/** Vehicle Card matching Figma Frame 2147226289 design */
function VehicleCard({
  car,
  nowMs,
  targetEndMs,
  isMember,
  memberPlan,
  isFav,
  onToggleFav,
  onPress,
  onPressExtend,
}: VehicleCardProps) {
  const [photoIndex, setPhotoIndex] = useState(0);

  // Fast, multi-source image resolution handling Cloudinary URLs, plate proxy strings, and local require numbers
  const imageSources = useMemo(() => {
    const list: any[] = [];
    const seenUris = new Set<string>();

    const add = (im: any) => {
      if (!im) return;
      if (typeof im === 'number') {
        list.push(im);
        return;
      }
      let uri = '';
      if (typeof im === 'string') {
        uri = im.trim();
      } else if (typeof im === 'object') {
        uri = (im.url || im.uri || '').trim();
      }
      if (uri && !seenUris.has(uri)) {
        seenUris.add(uri);
        list.push({ uri });
      }
    };

    if (Array.isArray(car.images)) car.images.forEach(add);
    add(car.image);
    add(car.vehicleImage);
    add(car.imageUrl);
    add(car.coverImage);

    // If no valid image found, fall back to high-res local asset
    if (list.length === 0) {
      const isBike =
        car.type === 'Bike' ||
        car.category === 'Bike' ||
        (car.seatingCapacity && car.seatingCapacity <= 2);
      const fallback = getVehicleImage(
        car.displayName || car.vehicleName || car.name || '',
        isBike
      );
      if (fallback) list.push(fallback);
    }
    return list;
  }, [car]);

  // Hourly pricing & live decreasing price
  const startMs = (car.dealStartMs || 0) > nowMs ? car.dealStartMs : Math.floor(nowMs / 60000) * 60000;
  const endMs = car.dealEndMs || targetEndMs;
  const hoursRemaining = Math.max(1, Math.ceil(Math.max(0, endMs - startMs) / (3600 * 1000)));

  const { perDay, price: dealPrice } = dealPricing(car, hoursRemaining);

  const carName = car.displayName || car.vehicleName || car.name || 'Vehicle';
  const seatsNum = parseInt(String(car.seats || ''), 10);
  const specs = [
    car.transmission,
    car.fuel || car.fuelType,
    car.type === 'Bike' || !seatsNum ? null : `${seatsNum} Seater`,
  ].filter(Boolean) as string[];

  // Only real reviews from server or car
  const needsReviews = car.rating === undefined && car.reviewCount === undefined;
  const { data: dbReviews = [] } = useQuery({
    queryKey: ['carReviews', car.id],
    queryFn: () => API.reviews.fetchByCarId(car.id),
    staleTime: 10 * 60 * 1000,
    enabled: needsReviews,
  });
  const reviews = [...(car.reviews || []), ...dbReviews].filter((r: any) => r.rating >= MIN_PUBLIC_REVIEW_RATING);
  const ratingNum = car.rating ?? (reviews.length ? reviews.reduce((s: number, r: any) => s + r.rating, 0) / reviews.length : null);
  const reviewCount = car.reviewCount ? car.reviewCount + dbReviews.length : reviews.length;

  const currentSource = imageSources[photoIndex] || imageSources[0];

  const handleNextPhoto = () => {
    if (imageSources.length > 1) {
      Haptics.selectionAsync();
      setPhotoIndex((prev) => (prev + 1) % imageSources.length);
    }
  };

  return (
    <View style={styles.outerCard}>
      {/* Vehicle Card (Frame 2147226289 -> Vehicle Card) */}
      <Pressable onPress={onPress} style={styles.vehicleCard}>
        {/* Frame 20: Photo Container */}
        <View style={styles.photoBox}>
          {currentSource ? (
            <LoadingImage
              source={currentSource}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              recyclingKey={`${car.id}-${photoIndex}`}
              transition={150}
            />
          ) : (
            <View style={[StyleSheet.absoluteFill, styles.placeholderPhoto]}>
              <Ionicons name="car-outline" size={54} color="#94A3B8" />
            </View>
          )}

          {/* Frame 2147225882: Top Header Row in Photo (Today’s Deal + Heart) */}
          <View style={styles.photoTopRow}>
            {/* Pill Badge (Frame 2147225777) */}
            <View style={styles.comfortPill}>
              {/* Crown Deal Icon (Figma image 588256529) */}
              <View style={styles.crownWrap} pointerEvents="none">
                <CrownDealIcon size={14} color="#FBC422" />
              </View>
              <Text style={styles.comfortText} numberOfLines={1}>Today’s Deal</Text>
            </View>

            {/* Heart button (Frame 22) */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Toggle Favorite"
              hitSlop={8}
              onPress={(e) => {
                e.stopPropagation();
                onToggleFav();
              }}
              style={styles.heartBtn}
            >
              <HeartIcon width={20} height={20} color={isFav ? '#EF4444' : '#737373'} filled={isFav} strokeWidth={1.5} />
            </Pressable>
          </View>

          {/* Photo tap area to cycle photos */}
          {imageSources.length > 1 && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleNextPhoto();
              }}
              style={styles.photoTapOverlay}
            />
          )}

          {/* Bottom Pagination Dots (Frame 25) */}
          {imageSources.length > 1 && (
            <View style={styles.dotsRow}>
              {imageSources.slice(0, 5).map((_: unknown, idx: number) => (
                <Pressable
                  key={idx}
                  onPress={(e) => {
                    e.stopPropagation();
                    setPhotoIndex(idx);
                  }}
                  style={[
                    styles.dot,
                    idx === photoIndex ? styles.dotActive : styles.dotInactive,
                  ]}
                />
              ))}
            </View>
          )}
        </View>

        {/* Frame 2147225778: Details Section */}
        <View style={styles.detailsBox}>
          {/* Row 1: Frame 2147225757 */}
          <View style={styles.titleRatingRow}>
            {/* Left: Frame 2147225756 */}
            <View style={styles.titleCol}>
              <Text style={styles.carNameText} numberOfLines={1}>
                {carName}
              </Text>
              {/* Frame 132: Specs */}
              <View style={styles.specsRow}>
                {specs.map((m, i) => (
                  <React.Fragment key={m}>
                    {i > 0 && <View style={styles.bulletDot} />}
                    <Text style={styles.specText} numberOfLines={1}>{m}</Text>
                  </React.Fragment>
                ))}
              </View>
            </View>

            {/* Right: Frame 88 Rating */}
            {ratingNum !== null && reviewCount > 0 && (
            <View style={styles.ratingCol}>
              <View style={styles.ratingPill}>
                <Text style={styles.ratingVal}>{Number(ratingNum).toFixed(1)}</Text>
                <Ionicons name="star" size={14} color="#FBBC04" />
              </View>
              <Text style={styles.reviewsText}>({reviewCount} Reviews)</Text>
            </View>
            )}
          </View>

          {/* Row 2: Frame 2147225762 */}
          <View style={styles.priceActionRow}>
            {/* Left: Frame 2147225771 (Price + for X hours) */}
            <View style={styles.priceGroup}>
              <Text style={styles.dealPriceText}>{formatCurrency(dealPrice)}</Text>
              <Text style={styles.hoursText}>for {hoursRemaining} {hoursRemaining === 1 ? 'hour' : 'hours'}</Text>
            </View>

            {/* Right: Frame 51 View Details */}
            <Pressable onPress={onPress} hitSlop={6} style={styles.viewDetailsBtn}>
              <Text style={styles.viewDetailsText}>View Details</Text>
              <Feather name="chevron-right" size={13} color="#737373" />
            </Pressable>
          </View>
        </View>
      </Pressable>

      {/* Frame 2147226290: Bottom Extension Bar */}
      <Pressable
        onPress={onPressExtend || onPress}
        style={styles.extensionBar}
        hitSlop={4}
      >
        <Text style={styles.extendText} numberOfLines={1}>
          Need more time? Extend your booking
        </Text>
        <View style={styles.extendRateRow}>
          <Text style={styles.extendRateText}>{formatCurrency(perDay)}/day</Text>
          <Feather name="chevron-right" size={13} color="#737373" />
        </View>
      </Pressable>
    </View>
  );
}

export default function TopDealsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
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
    setIsDeliveryRequested,
    applyCoupon,
  } = useSawari();

  const [searchQuery, setSearchQuery] = useState('');
  const [nowMs, setNowMs] = useState(() => Date.now());

  // Second-by-second live countdown & price decrease
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const memberPlan = (membership?.plan || '').toLowerCase().trim() || null;
  const isMember = Boolean(
    membership?.plan &&
      membership.plan.toLowerCase() !== 'none' &&
      (!membership.expiresAt || new Date(membership.expiresAt) > new Date())
  );

  const { dealCars, targetEndMs, isLoading } = useDealCars(nowMs);
  // Live countdown timer calculations for Frame 2147226222
  const msRemaining = Math.max(0, targetEndMs - nowMs);
  const timerHrs = Math.floor(msRemaining / 3600000);
  const timerMins = Math.floor((msRemaining % 3600000) / 60000);
  const timerSecs = Math.floor((msRemaining % 60000) / 1000);
  const hoursRemaining = Math.max(1, Math.ceil(msRemaining / (3600 * 1000)));

  // Prefetch card photos for all deal cars so image loading is instant
  useEffect(() => {
    if (dealCars && dealCars.length > 0) {
      const uris = dealCars
        .flatMap((c: any) => [c.image, ...(Array.isArray(c.images) ? c.images : [])])
        .map((im: any) => (typeof im === 'string' ? im : im?.url || im?.uri))
        .filter((u: any): u is string => typeof u === 'string' && u.startsWith('http'));
      if (uris.length > 0) {
        CachedImage.prefetch(Array.from(new Set(uris)), 'memory-disk').catch(() => {});
      }
    }
  }, [dealCars]);

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

  const handleSelectDeal = (car: any) => {
    Haptics.selectionAsync();
    // The booking prices this trip by the hour: hourly rate × hours left, applied like a coupon.
    const startMs = (car.dealStartMs || 0) > nowMs ? car.dealStartMs : Math.floor(nowMs / 60000) * 60000; // whole minutes, as booked
    const endMs = car.dealEndMs || targetEndMs;
    const hours = Math.max(1, Math.ceil(Math.max(0, endMs - startMs) / (3600 * 1000)));
    selectCar({ ...car, hourlyRate: dealPricing(car, hours).rate });
    applyCoupon(`TOPDEAL-${hours}`);

    const { rate: dealHourlyRate, price: dealPrice } = dealPricing(car, hours);

    const dayLabel = (ms: number) => {
      const p = getIndiaDateParts(ms);
      return dayNumToLabel(toDayNum(p.year, p.month, p.date));
    };
    const pickupLabel = formatTime12(startMs);
    const returnLabel = formatTime12(endMs);
    setDates(`${dayLabel(startMs)} – ${dayLabel(endMs)}`, '1 Day');
    setTimes(pickupLabel, returnLabel);
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

    router.push({
      pathname: '/car-details',
      params: {
        id: String(car.id || car._id),
        vehicleId: String(car.id || car._id),
        lockDates: 'true',
        isFixedDates: 'true',
        isTopDeal: 'true',
        pickupTime: pickupLabel,
        returnTime: returnLabel,
        dealPrice: String(dealPrice), // the quote applies the member discount itself
        hourlyPrice: String(dealHourlyRate),
        rentalHours: String(hours),
      },
    });
  };

  const handleExtendBooking = (car: any) => {
    Haptics.selectionAsync();
    // Extending is a normal booking at the full day rate: from when the deal starts to 8 AM the day after the deal ends.
    selectCar(car);
    const dayLabel = (ms: number) => {
      const p = getIndiaDateParts(ms);
      return dayNumToLabel(toDayNum(p.year, p.month, p.date));
    };
    // The calendar's pickup times are whole hours/half hours: start at the next whole hour the car is free.
    const startMs = Math.ceil(((car.dealStartMs || 0) > nowMs ? car.dealStartMs : nowMs) / 3600000) * 3600000;
    const endMs = targetEndMs + 24 * 3600 * 1000;

    setDates(`${dayLabel(startMs)} – ${dayLabel(endMs)}`, '2 Days');
    setTimes(formatTime12(startMs), formatTime12(endMs));
    setIsDeliveryRequested(false);
    if (!pickup?.name) {
      setPickup({ id: 'hub_pickup', name: MYSAWARI_HUB_NAME, address: 'MySawari Hub, Kahilipara', latitude: 26.1412, longitude: 91.7645, source: 'database' });
    }
    if (!dropoff?.name) {
      setDropoff({ id: 'city_trip', name: 'Local City Trip', address: 'City limits / Self-drive destination', latitude: 26.1412, longitude: 91.7645, source: 'database' });
    }

    // The date & time calendar opens for this car: days it cannot be booked are off, and Apply goes on to car details.
    router.push({ pathname: '/dates', params: { forSpecificCar: 'true' } });
  };

  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        title: `MySawari Today's Deals`,
        message: `Book top self-drive cars in Today's Deals on MySawari starting at discounted hourly rates! Check it out in the app now!`,
      });
    } catch {
      // dismissed
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={[styles.headerBar, { height: 64 + insets.top, paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={() => safeBack(router)}
            style={styles.headerIconBtn}
          >
            <Feather name="chevron-left" size={24} color="#737373" />
          </Pressable>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Today’s Deals</Text>
            <Text style={styles.headerSub}>
              Showing {filteredCars.length} {filteredCars.length === 1 ? 'Car' : 'Cars'} available
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share deal"
          onPress={handleShare}
          style={styles.headerIconBtn}
        >
          <Feather name="external-link" size={17} color="#737373" />
        </Pressable>
      </View>

      {/* Main Content Feed */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Frame 2147226218: Today's Deals Banner */}
        <LinearGradient
          colors={['#6152D8', '#ADA4F4']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.bannerContainer}
        >
          {/* Frame 2147226221 */}
          <View style={styles.bannerRow}>
            {/* Left: Frame 2147226220 (Today's Deals + Stars) */}
            <View style={styles.bannerLeft}>
              {/* Ellipse 13: Glow */}
              <Svg style={styles.bannerGlow} width={160} height={110} pointerEvents="none">
                <Defs>
                  <RadialGradient id="tdGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                    <Stop offset="0" stopColor="#FCDF8A" stopOpacity={0.45} />
                    <Stop offset="1" stopColor="#FCDF8A" stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Ellipse cx={80} cy={55} rx={80} ry={55} fill="url(#tdGlow)" />
              </Svg>

              {/* Sparkle Stars matching exact positions */}
              <View style={styles.sparkleTopLeft} pointerEvents="none">
                <FourPointStar size={11} color="#FBC422" />
              </View>
              <View style={styles.sparkleTopRight} pointerEvents="none">
                <FourPointStar size={11} color="#FBC422" />
              </View>
              <View style={styles.sparkleBottomLeft} pointerEvents="none">
                <FourPointStar size={14} color="#FFFFFF" />
              </View>
              <View style={styles.sparkleBottomRight} pointerEvents="none">
                <FourPointStar size={12} color="#FFFFFF" />
              </View>

              <Text style={styles.todaysText}>Today’s</Text>
              <Text style={styles.dealsText}>Deals</Text>
            </View>

            {/* Right: Frame 2147226222 (ENDS IN + Timer) */}
            <View style={styles.bannerRight}>
              <Text style={styles.endsInText}>ENDS IN</Text>
              {/* Frame 2147226219: Timer row */}
              <View style={styles.timerRow}>
                {/* Frame 2147226216: Hrs */}
                <View style={styles.timerCol}>
                  <View style={styles.timerBox}>
                    <Text style={styles.timerNum}>{pad2(timerHrs)}</Text>
                  </View>
                  <Text style={styles.timerLbl}>Hrs</Text>
                </View>

                {/* Frame 2147226217: Min */}
                <View style={styles.timerCol}>
                  <View style={styles.timerBox}>
                    <Text style={styles.timerNum}>{pad2(timerMins)}</Text>
                  </View>
                  <Text style={styles.timerLbl}>Min</Text>
                </View>

                {/* Frame 2147226218: Sec */}
                <View style={styles.timerCol}>
                  <View style={styles.timerBox}>
                    <Text style={styles.timerNum}>{pad2(timerSecs)}</Text>
                  </View>
                  <Text style={styles.timerLbl}>Sec</Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Vehicles Feed */}
        {isLoading ? (
          <View style={styles.emptyBox}>
            <ActivityIndicator size="large" color="#6152D8" />
            <Text style={[styles.emptySubtitle, { marginTop: 12 }]}>
              Loading available cars...
            </Text>
          </View>
        ) : filteredCars.length === 0 ? (
          <View style={styles.emptyBox}>
            <Feather name="clock" size={38} color="#6152D8" />
            <Text style={styles.emptyTitle}>No Cars Available Right Now</Text>
            <Text style={styles.emptySubtitle}>
              Cars and bikes that are free until 8:00 AM will appear here
              automatically. Check back soon!
            </Text>
            <Pressable
              onPress={() => safeBack(router)}
              style={styles.exploreBtn}
            >
              <Text style={styles.exploreBtnText}>Explore All Fleet</Text>
            </Pressable>
          </View>
        ) : (
          filteredCars.map((car) => {
            const carId = String(car.id || car._id);
            const isFav = favorites.includes(carId);

            return (
              <VehicleCard
                key={carId}
                car={car}
                nowMs={nowMs}
                targetEndMs={targetEndMs}
                isMember={isMember}
                memberPlan={memberPlan}
                isFav={isFav}
                onToggleFav={() => {
                  Haptics.selectionAsync();
                  toggleFavorite(carId);
                }}
                onPress={() => handleSelectDeal(car)}
                onPressExtend={() => handleExtendBooking(car)}
              />
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 16,
    paddingBottom: 4,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#D4D4D4',
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F5F5',
  },
  headerTextCol: {
    flex: 1,
    gap: 2,
  },
  headerTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    lineHeight: 20,
    color: '#262626',
  },
  headerSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    lineHeight: 17,
    color: '#525252',
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchBarInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: '#1E293B',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 40,
    alignItems: 'center',
  },

  // ── Today's Deals Banner (Frame 2147226218) ──
  bannerContainer: {
    width: '100%',
    maxWidth: 361,
    height: 103,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 20,
    justifyContent: 'center',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#6152D8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    width: '100%',
  },
  bannerLeft: {
    position: 'relative',
    width: 131.41,
    height: 59.46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerGlow: {
    position: 'absolute',
    left: -9.3,
    top: -28.8,
  },
  sparkleTopLeft: {
    position: 'absolute',
    left: 14.31,
    top: 3.88,
  },
  sparkleTopRight: {
    position: 'absolute',
    left: 108.87,
    top: 5,
  },
  sparkleBottomLeft: {
    position: 'absolute',
    left: 10.98,
    top: 28.36,
  },
  sparkleBottomRight: {
    position: 'absolute',
    left: 111.1,
    top: 30.58,
  },
  todaysText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 24,
    lineHeight: 29,
    color: '#FBC422',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 3.28 },
    textShadowRadius: 3.28,
  },
  dealsText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 34,
    lineHeight: 34,
    color: '#FFFFFF',
    letterSpacing: -0.5,
    marginTop: -4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 4.45 },
    textShadowRadius: 4.45,
  },

  // ── Timer Box (Frame 2147226222) ──
  bannerRight: {
    width: 114,
    height: 63,
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endsInText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    lineHeight: 16,
    color: '#FFFFFF',
    alignSelf: 'stretch',
    textAlign: 'center',
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  timerCol: {
    alignItems: 'center',
    width: 34,
  },
  timerBox: {
    width: 34,
    height: 34,
    borderRadius: 7,
    backgroundColor: '#FFFBF0',
    borderWidth: 1.5,
    borderColor: '#FBC422',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerNum: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 14,
    lineHeight: 18,
    color: '#6152D8',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  timerLbl: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    color: '#FFFFFF',
    alignSelf: 'stretch',
    textAlign: 'center',
    marginTop: 2,
  },

  // ── Vehicle Card (Figma Frame 2147226289) ──
  outerCard: {
    width: '100%',
    maxWidth: 361,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF4',
    borderRadius: 16,
    paddingBottom: 8,
    gap: 4,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  vehicleCard: {
    width: '100%',
    backgroundColor: '#F4F6FA',
    borderWidth: 1,
    borderColor: '#E7EAF4',
    borderRadius: 12,
    padding: 4,
    paddingBottom: 6,
    gap: 8,
  },
  photoBox: {
    width: '100%',
    height: 212,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#E2E8F0',
  },
  placeholderPhoto: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E2E8F0',
  },
  photoTopRow: {
    position: 'absolute',
    top: 6,
    left: 6,
    right: 6,
    height: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  comfortPill: {
    height: 28,
    paddingHorizontal: 12,
    backgroundColor: '#6B5AED',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  comfortText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    lineHeight: 16,
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  crownWrap: {
    position: 'absolute',
    left: -4,
    top: -6,
    width: 14,
    height: 14,
    transform: [{ rotate: '-30deg' }],
  },
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoTapOverlay: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    bottom: 24,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    zIndex: 2,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  dotActive: {
    width: 16,
    backgroundColor: '#FFFFFF',
  },
  dotInactive: {
    width: 4,
    backgroundColor: '#D4D4D4',
  },

  // ── Details Section (Frame 2147225778) ──
  detailsBox: {
    gap: 6,
  },
  titleRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    height: 50,
  },
  titleCol: {
    flex: 1,
    gap: 4,
    justifyContent: 'center',
  },
  carNameText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 17,
    color: '#262626',
    lineHeight: 26,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 20,
  },
  specText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    lineHeight: 20,
    color: '#737373',
    flexShrink: 1,
    includeFontPadding: false,
  },
  bulletDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#737373',
  },
  ratingCol: {
    alignItems: 'center',
    gap: 4,
    width: 67,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    width: 56,
    height: 28,
    paddingLeft: 10,
    paddingRight: 9,
    backgroundColor: '#2F3E75',
    borderRadius: 20,
  },
  ratingVal: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    lineHeight: 20,
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  reviewsText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    lineHeight: 17,
    color: '#525252',
    textAlign: 'center',
  },

  // ── Price & Action Row (Frame 2147225762) ──
  priceActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    height: 28,
    paddingHorizontal: 4,
    alignSelf: 'stretch',
  },
  priceGroup: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  dealPriceText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 19,
    lineHeight: 24,
    includeFontPadding: false,
    color: '#262626',
  },
  hoursText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    lineHeight: 18,
    includeFontPadding: false,
    color: '#737373',
  },
  viewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 25,
  },
  viewDetailsText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    lineHeight: 16.5,
    includeFontPadding: false,
    color: '#737373',
    textDecorationLine: 'underline',
  },

  // ── Bottom Extension Bar (Frame 2147226290) ──
  extensionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 12,
    height: 17,
    alignSelf: 'stretch',
  },
  extendText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    lineHeight: 16.5,
    includeFontPadding: false,
    color: '#737373',
    flexShrink: 1,
  },
  extendRateRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  extendRateText: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11,
    lineHeight: 16.5,
    includeFontPadding: false,
    textAlign: 'right',
    color: '#737373',
  },

  // Empty state
  emptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
    width: '100%',
    maxWidth: 361,
  },
  emptyTitle: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 17,
    color: '#1E293B',
    marginTop: 12,
  },
  emptySubtitle: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  exploreBtn: {
    marginTop: 18,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#2F3E75',
  },
  exploreBtnText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
