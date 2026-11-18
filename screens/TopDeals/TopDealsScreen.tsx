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
  RefreshControl,
  ActivityIndicator,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { Image as CachedImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, RadialGradient, Stop, Ellipse, Circle } from 'react-native-svg';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '@/utils/haptics';
import { safeBack } from '@/utils/navigation';
import { useAfterSlideIn } from '@/hooks/useAfterSlideIn';
import { useSawari } from '@/context/SawariContext';
import { useDealCars, dealPricing, useOpenTopDeal, dealDayTime, nextIstHourMs } from '@/hooks/useDealCars';
import { VEHICLES_KEY } from '@/hooks/useVehicles';
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
  type Car,
} from '@/utils/sawari';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { HeartIcon } from '@/components/vehicle/HeartIcon';
import { MIN_PUBLIC_REVIEW_RATING } from '@/utils/sawari';
import { exclusiveOffersQueryOptions } from '@/services/api/offers';
import { LoadingImage } from '@/components/common/LoadingImage';
import { CarCardSkeleton } from '@/components/loading/CarCardSkeleton';
import { getVehicleImage } from '@/utils/vehicleImages';
import {
  ExploreFilterSheet,
  EMPTY_FILTERS,
  chipsFor,
  chipOn,
  toggleChip,
  countActive,
  matchesFilters,
  useVehicleRatings,
  type ExploreFilters,
} from '@/components/explore/ExploreFilters';
import TopDealsBackIcon from '@/assets/images/top_deals_back.svg';
import TopDealsShareIcon from '@/assets/images/top_deals_share.svg';
import TopDealsSearchIcon from '@/assets/images/top_deals_search.svg';
import TopDealsSortIcon from '@/assets/images/top_deals_sort.svg';
import TopDealsFilterIcon from '@/assets/images/top_deals_filter.svg';
import TopDealsBannerSparkleLeft from '@/assets/images/top_deals_banner_sparkle_left.svg';
import TopDealsBannerSparkleRight from '@/assets/images/top_deals_banner_sparkle_right.svg';
import TopDealsRatingStar from '@/assets/images/top_deals_rating_star.svg';
import TopDealsChevron from '@/assets/images/top_deals_chevron.svg';
import TopDealsTitleArtwork from '@/assets/images/top_deals_title.svg';

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
  isFav: boolean;
  onToggleFav: () => void;
  onPress: () => void;
  /** "Need more time? Extend your booking": the car's calendar with the deal day marked OFF. */
  onPressExtend?: () => void;
}

const PHOTO_PEEK = 0; // full photo per swipe (no peek of the next one)
const PHOTO_GAP = 0;

/** Vehicle Card matching Figma Frame 2147226289 design */
function VehicleCard({
  car,
  nowMs,
  targetEndMs,
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

  const { price: dealPrice, perDay } = dealPricing(car, hoursRemaining);

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
  const tag = bestFor(car) || 'Comfort';

  // Swipeable photos (same as the car cards): the next one peeks in at the edge and each swipe moves exactly one.
  const photos = imageSources.slice(0, 5);
  const many = photos.length > 1;
  const [boxW, setBoxW] = useState(0);
  const photoRef = useRef<ScrollView>(null);
  const itemW = many ? boxW - PHOTO_PEEK : boxW;
  const step = itemW + PHOTO_GAP;
  const maxX = Math.max(0, photos.length * step - PHOTO_GAP - boxW);
  const offsets = photos.map((_, i) => Math.min(i * step, maxX));
  const onPhotoScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!step) return;
    const x = e.nativeEvent.contentOffset.x;
    const next = x >= maxX - 1 ? photos.length - 1 : Math.min(photos.length - 1, Math.max(0, Math.round(x / step)));
    if (next !== photoIndex) setPhotoIndex(next);
  };
  const goToPhoto = (i: number) => photoRef.current?.scrollTo({ x: offsets[i] ?? 0, animated: true });

  // The "Need more time?" bar only when the car is also free after the deal ends (the next day), Figma 2147226289:
  // then the card sits in a white 16-radius frame with the bar under it; otherwise just the card.
  const extendable = Boolean(onPressExtend && car.canExtend);
  return (
    <View style={[styles.outerCard, extendable && styles.outerCardExtend]}>
      {/* Vehicle Card (Frame 2147226289 -> Vehicle Card) */}
      <Pressable onPress={onPress} style={styles.vehicleCard}>
        {/* Frame 20: Photo Container */}
        <View style={styles.photoBox} onLayout={(e) => setBoxW(e.nativeEvent.layout.width)}>
          {photos.length && boxW > 0 ? (
            <ScrollView
              ref={photoRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              onScroll={onPhotoScroll}
              onMomentumScrollEnd={onPhotoScroll}
              scrollEventThrottle={16}
              scrollEnabled={many}
              nestedScrollEnabled
              directionalLockEnabled
              snapToOffsets={offsets}
              snapToEnd={false}
              disableIntervalMomentum
              decelerationRate="fast"
              contentContainerStyle={{ gap: PHOTO_GAP }}
            >
              {photos.map((src, i) => (
                <Pressable key={i} onPress={onPress} style={[{ width: itemW, height: '100%' }, many && { borderRadius: 8, overflow: 'hidden' }]}>
                  {i === 0 || Math.abs(photoIndex - i) <= 1 ? (
                    <LoadingImage source={src} style={StyleSheet.absoluteFill} contentFit="cover" recyclingKey={`${car.id}-${i}`} transition={150} />
                  ) : (
                    <View style={[StyleSheet.absoluteFill, styles.placeholderPhoto]} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          ) : photos.length ? null : (
            <View style={[StyleSheet.absoluteFill, styles.placeholderPhoto]}>
              <Ionicons name="car-outline" size={54} color="#94A3B8" />
            </View>
          )}

          {/* Frame 2147225882: Top Header Row in Photo (Today’s Deal + Heart) */}
          <View style={styles.photoTopRow}>
            {/* Pill Badge (Frame 2147225777) */}
            <View style={styles.comfortPill}>
              <Text style={styles.comfortText} numberOfLines={1}>Best for {tag}</Text>
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

          {/* Bottom Pagination Dots (Frame 25) */}
          {many && (
            <View style={styles.dotsRow}>
              {photos.map((_: unknown, idx: number) => (
                <Pressable
                  key={idx}
                  onPress={(e) => {
                    e.stopPropagation();
                    Haptics.selectionAsync();
                    goToPhoto(idx);
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
                <View style={styles.ratingStar}>
                  <TopDealsRatingStar />
                </View>
              </View>
              <Text style={styles.reviewsText}>({reviewCount} Reviews)</Text>
            </View>
            )}
          </View>

          {/* When the deal runs (India time), as a trip: Start · Today 3:00 PM → End · Tmrw 8:00 AM */}
          <View style={styles.whenRow} accessible accessibilityLabel={`Starts ${dealDayTime(startMs, nowMs)}, ends ${dealDayTime(endMs, nowMs)}`}>
            <View style={styles.whenCol}>
              <Text style={styles.whenLbl}>Start</Text>
              <Text style={styles.whenVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{dealDayTime(startMs, nowMs)}</Text>
            </View>
            <Feather name="arrow-right" size={12} color="#6152D8" />
            <View style={[styles.whenCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.whenLbl}>End</Text>
              <Text style={styles.whenVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{dealDayTime(endMs, nowMs)}</Text>
            </View>
          </View>

          {/* Row 2: Frame 2147225762 */}
          <View style={styles.priceActionRow}>
            {/* Left: Frame 2147225771 (Price + for X hours) */}
            <View style={styles.priceGroup}>
              <Text style={styles.dealPriceText}>{formatCurrency(dealPrice)}</Text>
            </View>

            {/* Right: Frame 51 View Details */}
            <Pressable onPress={onPress} hitSlop={6} style={styles.viewDetailsBtn}>
              <Text style={styles.viewDetailsText}>View Details</Text>
              <TopDealsChevron />
            </Pressable>
          </View>
        </View>
      </Pressable>

      {/* Frame 2147226290: "Need more time? Extend your booking" · the day rate (an extension is a normal full-day booking) */}
      {extendable && (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Need more time? Extend your booking at ${formatCurrency(perDay)} per day`}
        onPress={onPressExtend || onPress}
        hitSlop={{ top: 8, bottom: 8 }}
        style={({ pressed }) => [styles.extensionBar, pressed && { opacity: 0.7 }]}
      >
        <Text style={styles.extendText} numberOfLines={1}>Need more time? Extend your booking</Text>
        {perDay > 0 && (
          <View style={styles.extendRateRow}>
            <Text style={styles.extendRateText} numberOfLines={1}>{formatCurrency(perDay)}/day</Text>
            <TopDealsChevron />
          </View>
        )}
      </Pressable>
      )}
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
    favorites,
    toggleFavorite,
    setIsDeliveryRequested,
    applyCoupon,
  } = useSawari();

  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleType, setVehicleType] = useState<'car' | 'bike'>('car');
  const isBike = vehicleType === 'bike';
  const quickFilters = chipsFor(isBike);
  const [filters, setFilters] = useState<ExploreFilters>(EMPTY_FILTERS);
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useFocusEffect(
    React.useCallback(() => {
      queryClient.invalidateQueries({ queryKey: VEHICLES_KEY });
    }, [queryClient])
  );

  // Second-by-second live countdown & price decrease
  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const { dealCars, targetEndMs, isOpen, isLoading, refetch } = useDealCars(nowMs);
  const slidIn = useAfterSlideIn(); // deal cards mount after the slide, so it stays smooth
  // Top Deals exist only 2 PM → 8 AM: outside that (opened from a link / notification, or still open at 8 AM) the page
  // closes itself.
  useEffect(() => {
    if (!isOpen) safeBack(router);
  }, [isOpen, router]);
  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    try { await refetch(); } finally { setRefreshing(false); }
  };
  // Live countdown timer calculations for Frame 2147226222
  // This hour's prices end at the next whole hour (then every deal is an hour shorter and cheaper): at most 1 hour.
  const msRemaining = Math.max(0, Math.min(targetEndMs, nextIstHourMs(nowMs)) - nowMs);
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

  const vehicleCars = useMemo(
    () => dealCars.filter((car: Car) => (isBike ? car.type === 'Bike' : car.type !== 'Bike')),
    [dealCars, isBike],
  );
  const ratingOf = useVehicleRatings(vehicleCars, showFilterSheet || !!filters.rating);

  const filteredCars = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return vehicleCars.filter((car: Car) => {
      const name = String((car as any).displayName || car.name || (car as any).vehicleName || '').toLowerCase();
      const categories = [car.category, car.type, (car as any).bodyType, (car as any).segment, (car as any).vehicleCategory]
        .map((value) => String(value || '').toLowerCase());
      const fuel = String(car.fuel || (car as any).fuelType || '').toLowerCase();
      const manufacturer = String(car.manufacturer || '').toLowerCase();
      if (query && ![name, ...categories, fuel, manufacturer].some((value) => value.includes(query))) return false;
      return matchesFilters(car, filters, ratingOf);
    });
  }, [vehicleCars, filters, searchQuery, ratingOf]);
  const noun = isBike
    ? (filteredCars.length === 1 ? 'Bike' : 'Bikes')
    : (filteredCars.length === 1 ? 'Car' : 'Cars');
  const activeFilterCount = countActive(filters);

  const handleVehicleTypeChange = (nextType: 'car' | 'bike') => {
    if (nextType === vehicleType) return;
    Haptics.selectionAsync();
    setVehicleType(nextType);
    setFilters(EMPTY_FILTERS);
  };

  // Fills the deal's trip (dates, times, places, hourly price) and opens the car — shared with the Home deals card.
  const openTopDeal = useOpenTopDeal();
  const handleSelectDeal = (car: any) => openTopDeal(car, targetEndMs, nowMs);

  const handleExtendBooking = (car: any) => {
    Haptics.selectionAsync();
    // Extending is a normal booking at the full day rate: the customer picks the days in this car's calendar.
    selectCar(car);
    setIsDeliveryRequested(false);
    if (!pickup?.name) {
      setPickup({ id: 'hub_pickup', name: MYSAWARI_HUB_NAME, address: 'MySawari Hub, Kahilipara', latitude: 26.1412, longitude: 91.7645, source: 'database' });
    }
    if (!dropoff?.name) {
      setDropoff({ id: 'city_trip', name: 'Local City Trip', address: 'City limits / Self-drive destination', latitude: 26.1412, longitude: 91.7645, source: 'database' });
    }

    // The deal itself, so the calendar can mark its day "OFF" and still book it at the hourly deal price when that
    // day alone is chosen (any longer trip is a normal full-day-rate booking).
    const dealStartMs = (car.dealStartMs || 0) > nowMs ? car.dealStartMs : Math.floor(nowMs / 60000) * 60000;
    const dp = getIndiaDateParts(dealStartMs);
    const deal = {
      day: toDayNum(dp.year, dp.month, dp.date),
      startMs: dealStartMs,
      endMs: car.dealEndMs || targetEndMs,
      rate: dealPricing(car, 1).rate,
    };

    // The date & time calendar opens for this car: days it cannot be booked are off, and Apply goes on to car details.
    // Nothing pre-picked: the customer chooses the days (the deal day shows its OFF tag, unavailable days are off).
    router.push({ pathname: '/dates', params: { forSpecificCar: 'true', fresh: 'true', deal: JSON.stringify(deal) } });
  };

  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      // Branded smart link: auto-redirects iPhone -> App Store & Android -> Play Store
      const appLinkBase = (process.env.EXPO_PUBLIC_APP_LINK_URL || 'https://app.mysawari.in').replace(/\/+$/, '');
      await Share.share({
        title: `MySawari Today's Deals`,
        message: `Book top self-drive cars in Today's Deals on MySawari starting at discounted hourly rates!\n\n📲 Download the MySawari App:\n${appLinkBase}`,
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
            <View style={styles.backIconFlip}>
              <TopDealsBackIcon />
            </View>
          </Pressable>
          <View style={styles.headerTextCol}>
            <Text style={styles.headerTitle}>Today’s Deals</Text>
            <Text style={styles.headerSub}>
              Showing {filteredCars.length} {noun} available
            </Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Share deal"
          onPress={handleShare}
          style={styles.headerIconBtn}
        >
          <TopDealsShareIcon />
        </Pressable>
      </View>

      {/* Main Content Feed */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6152D8" colors={['#6152D8']} />}
      >
        <View style={styles.searchSection}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrap}>
              <TopDealsSearchIcon />
              <TextInput
                accessibilityLabel="Search cars and bike"
                placeholder="Search cars and bike"
                placeholderTextColor="#737373"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchBarInput}
                returnKeyType="search"
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open filters"
              onPress={() => setShowFilterSheet(true)}
              style={styles.sortButton}
            >
              <TopDealsSortIcon />
            </Pressable>
          </View>
        </View>

        <View style={styles.vehicleTypeSection}>
          {(['car', 'bike'] as const).map((type) => {
            const selected = vehicleType === type;
            return (
              <Pressable
                key={type}
                accessibilityRole="tab"
                accessibilityState={{ selected }}
                onPress={() => handleVehicleTypeChange(type)}
                style={[styles.vehicleTypeChip, selected && styles.vehicleTypeChipSelected]}
              >
                <Text style={[styles.vehicleTypeText, selected && styles.vehicleTypeTextSelected]}>
                  {type === 'car' ? 'Cars' : 'Bikes & Scooters'}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.quickFilterSection}>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickFilterRow}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Filter${activeFilterCount ? ` (${activeFilterCount} active)` : ''}`}
              onPress={() => setShowFilterSheet(true)}
              style={[styles.filterChip, activeFilterCount > 0 && styles.filterChipActive]}
            >
              <TopDealsFilterIcon />
              <Text style={styles.filterChipText}>Filter{activeFilterCount ? ` (${activeFilterCount})` : ''}</Text>
            </Pressable>
            {quickFilters.map((chip) => {
              const selected = chipOn(filters, chip);
              return (
                <Pressable
                  key={chip.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setFilters((current) => toggleChip(current, chip));
                  }}
                  style={[styles.quickFilterChip, selected && styles.quickFilterChipActive]}
                >
                  <Text style={[styles.quickFilterText, selected && styles.quickFilterTextActive]}>
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Frame 2147226218: Today's Deals Banner */}
        <View style={styles.bannerSection}>
          <LinearGradient
            colors={['#6152D8', '#ADA4F4']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.bannerContainer}
          >
            <View style={styles.bannerRow}>
              <TopDealsBannerSparkleLeft style={styles.bannerSparkleLeft} pointerEvents="none" />
              <TopDealsBannerSparkleRight style={styles.bannerSparkleRight} pointerEvents="none" />
              <View style={styles.bannerLeft}>
                <TopDealsTitleArtwork style={styles.bannerTitleArtwork} pointerEvents="none" />
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
        </View>

        <View style={styles.vehicleFeed}>
          {(isLoading && !dealCars.length) || !slidIn ? (
            // First load: card-shaped placeholders where the deals will appear
            <View style={{ width: '100%', maxWidth: 361, gap: 12 }}>
              {[0, 1, 2].map((i) => <CarCardSkeleton key={i} index={i} variant="deal" />)}
            </View>
          ) : filteredCars.length === 0 ? (
            <View style={styles.emptyBox}>
              <Feather name="clock" size={38} color="#6152D8" />
              <Text style={styles.emptyTitle}>No {noun} Available Right Now</Text>
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
        </View>
      </ScrollView>
      <ExploreFilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        value={filters}
        onApply={setFilters}
        cars={vehicleCars}
        bike={isBike}
        ratingOf={ratingOf}
      />
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
  backIconFlip: { transform: [{ rotate: '180deg' }] },
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
  searchSection: {
    width: '100%',
    paddingHorizontal: 0,
    paddingTop: 12,
    paddingBottom: 4,
  },
  vehicleTypeSection: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  vehicleTypeChip: {
    height: 32,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF4',
  },
  vehicleTypeChipSelected: {
    backgroundColor: '#6D52ED',
    borderColor: '#6D52ED',
  },
  vehicleTypeText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    lineHeight: 20,
    color: '#737373',
  },
  vehicleTypeTextSelected: {
    color: '#FFFFFF',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 45,
  },
  searchInputWrap: {
    flex: 1,
    height: 45,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF1',
  },
  sortButton: {
    width: 54,
    height: 45,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#F9F9FB',
    borderWidth: 1,
    borderColor: '#EAECF1',
  },
  searchBarInput: {
    flex: 1,
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 15,
    lineHeight: 22.5,
    color: '#737373',
    paddingVertical: 0,
  },
  quickFilterSection: {
    width: '100%',
    paddingTop: 4,
    paddingBottom: 8,
  },
  quickFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    minWidth: 68,
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF1',
  },
  filterChipActive: {
    borderColor: '#6B5AED',
  },
  filterChipText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: '#1E293B',
  },
  quickFilterChip: {
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EAECF1',
  },
  quickFilterChipActive: {
    backgroundColor: '#6B5AED',
    borderColor: '#6B5AED',
  },
  quickFilterText: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    color: '#737373',
  },
  quickFilterTextActive: {
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 12,
    paddingTop: 0, // the search block on top brings its own 12
    paddingBottom: 40,
    alignItems: 'center',
    width: '100%',
  },
  vehicleFeed: {
    width: '100%',
    paddingHorizontal: 0,
    paddingVertical: 8,
    gap: 12,
    alignItems: 'center',
  },
  bannerSection: {
    width: '100%',
    paddingHorizontal: 0,
    paddingVertical: 8,
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
    overflow: 'hidden',
  },
  bannerRow: {
    position: 'relative',
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
    overflow: 'visible',
  },
  bannerSparkleLeft: {
    position: 'absolute',
    left: 60,
    top: -7,
  },
  bannerSparkleRight: {
    position: 'absolute',
    left: 148,
    top: -8,
  },
  bannerTitleArtwork: {
    position: 'absolute',
    left: 0,
    top: -1.676,
  },

  // ── Timer Box (Frame 2147226222) ──
  bannerRight: {
    width: 106,
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
    gap: 8,
  },
  timerCol: {
    alignItems: 'center',
    width: 30,
  },
  timerBox: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#FBBC04',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerNum: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    lineHeight: 19.5,
    color: '#6152D8',
    textAlign: 'center',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  timerLbl: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 9,
    lineHeight: 13.5,
    color: '#FFFFFF',
    alignSelf: 'stretch',
    textAlign: 'center',
    marginTop: 2,
  },

  // ── Vehicle Card (Figma Frame 2147226289) ──
  outerCard: {
    width: '100%',
    maxWidth: 361,
    marginBottom: 0,
  },
  // Frame 2147226289: white, 1px #E7EAF4, radius 16, 8 under the bar, 4 between the card and the bar.
  outerCardExtend: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7EAF4',
    borderRadius: 16,
    paddingBottom: 8,
    gap: 4,
  },
  vehicleCard: {
    width: '100%',
    maxWidth: 361,
    backgroundColor: '#F4F6FA',
    borderWidth: 1,
    borderColor: '#E7EAF4',
    borderRadius: 12,
    paddingTop: 4,
    paddingHorizontal: 4,
    paddingBottom: 8,
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
    paddingHorizontal: 10,
    backgroundColor: '#6B5AED',
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  comfortText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    lineHeight: 16,
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  heartBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F6FA',
    alignItems: 'center',
    justifyContent: 'center',
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
    backgroundColor: '#6B5AED',
    borderRadius: 20,
  },
  ratingStar: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
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
  whenRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, borderColor: '#DEDAFB', backgroundColor: '#FBFAFE' },
  whenCol: { flex: 1, minWidth: 0 },
  whenLbl: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 14, color: '#737373' },
  whenVal: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 18, color: '#6B5AED' },
  priceActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    height: 25,
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
    backgroundColor: '#6B5AED',
  },
  exploreBtnText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
});
