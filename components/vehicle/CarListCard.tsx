import React, { useState } from 'react';
import { NativeScrollEvent, NativeSyntheticEvent, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoadingImage } from '@/components/common/LoadingImage';
import { Car, getAvailability, MIN_PUBLIC_REVIEW_RATING, parseDayLabel } from '@/utils/sawari';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { API } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';
import { ActivityAPI } from '@/services/api/activity';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

/**
 * Vehicle card (Figma "Explore": photo carousel with a "Best for …" tag and heart, name with the rating pill,
 * specs with the review count, price, and "View Details" or "Available on …").
 * Used by Explore, Search results and Wishlist. Everything shown comes from the vehicle record, its reviews and
 * nothing else — the price is the vehicle's real day rate.
 */
type CarListCardProps = {
  car: Car;
  isExplore?: boolean;
  effectiveDateRange?: string;
  onIntercept?: () => void;
  onPressOverride?: () => void;
  style?: any;
};

const MONTH_FULL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
/** "13 Oct" -> "13 oct." as in the design's card link. */
const shortAvail = (label?: string) => (label ? `${label.split(' ')[0]} ${(label.split(' ')[1] || '').toLowerCase()}.` : '');
/** "13 Oct" -> "13 October" (car details strip). */
export const longAvail = (label?: string) => {
  const n = parseDayLabel(label);
  if (n === null) return label || '';
  const d = new Date(n * 86400000);
  return `${d.getUTCDate()} ${MONTH_FULL[d.getUTCMonth()]}`;
};

/** The one-word "Best for …" tag on the photo (design: "Best for Comfort"), from the vehicle's own details. */
export function bestFor(car: Pick<Car, 'category' | 'type' | 'transmission' | 'seats' | 'fuel'>): string | null {
  const fuel = String(car.fuel || '').toLowerCase();
  if (car.type === 'Bike' || car.category === 'Bike') {
    if (fuel === 'ev' || fuel.includes('electric')) return 'Eco Rides';
    return car.transmission === 'Automatic' ? 'City Rides' : 'Long Rides';
  }
  if (fuel === 'ev' || fuel.includes('electric')) return 'Eco Trips';
  const seats = parseInt(String(car.seats), 10);
  switch (car.category) {
    case 'Luxury': return 'Luxury';
    case 'Off-road': return 'Adventure';
    case 'MUV': return 'Family';
    case 'Hatchback': return 'City';
    case 'SUV':
    case 'Sedan': return !isNaN(seats) && seats >= 7 ? 'Family' : 'Comfort';
  }
  if (!isNaN(seats) && seats >= 7) return 'Family';
  return car.transmission === 'Automatic' ? 'City' : 'Comfort';
}

const CarListCardUI = React.memo(function CarListCardUI({ car, style, onCarPress }: CarListCardProps & { onCarPress: () => void }) {
  const p = useDetailsPalette();
  const { favorites, toggleFavorite } = useSawari();
  const { width: windowWidth } = useWindowDimensions();
  // Photo width known synchronously (screen − 16 margins − 4 card padding each side).
  // Calculated once on render without onLayout state jumps so scrolling never stutters.
  const width = Math.max(0, windowWidth - 40);
  const [slide, setSlide] = useState(0);

  const availability = car.availability ?? getAvailability(car);
  const unavailable = car.isAvailable === false || !availability.available;
  const images = ((car.images && car.images.length ? car.images : [car.image]) as any[]).slice(0, 5);
  const fav = favorites.includes(car.id);
  const tag = bestFor(car);

  // Rating from real reviews (only fetched if car lacks rating to avoid 30 background calls during scroll).
  const needsReviews = car.rating === undefined && car.reviewCount === undefined;
  const { data: dbReviews = [] } = useQuery({
    queryKey: ['carReviews', car.id],
    queryFn: () => API.reviews.fetchByCarId(car.id),
    staleTime: 10 * 60 * 1000,
    enabled: needsReviews,
  });
  const reviews = [...(car.reviews || []), ...dbReviews].filter((r) => r.rating >= MIN_PUBLIC_REVIEW_RATING);
  const rating = car.rating ?? (reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null);
  const reviewCount = car.reviewCount ? car.reviewCount + dbReviews.length : reviews.length;

  // The real day rate (the vehicle's pricePerDay from the server), never discounted here: membership and
  // coupon savings are applied only to the trip price on car details and payment.
  const seatsNum = parseInt(String(car.seats || ''), 10);
  const seats = car.type === 'Bike' ? null : (seatsNum ? `${seatsNum} Seater` : (car.seats ? String(car.seats) : null));
  const meta = [car.transmission, car.fuel, seats].filter(Boolean) as string[];

  const onSwipe = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!width) return;
    setSlide(Math.round(e.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={[styles.wrap, style]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${car.name}, ${formatCurrency(car.perDay)} per day${unavailable && availability.nextAvailableFrom ? `, available on ${availability.nextAvailableFrom}` : ''}`}
        testID={`list-car-${car.id}`}
        onPress={onCarPress}
        style={({ pressed }) => [styles.card, { backgroundColor: p.summary, borderColor: p.deliveryBorder, opacity: pressed ? 0.92 : 1 }]}
      >
        {/* Photos */}
        <View style={[styles.photo, { backgroundColor: p.iconBg }]}>
          {width > 0 && (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={onSwipe}
              scrollEnabled={images.length > 1}
              nestedScrollEnabled={true}
              directionalLockEnabled={true}
              scrollEventThrottle={16}
              decelerationRate="fast"
            >
              {images.map((img, i) => {
                const shouldRender = i === 0 || Math.abs(slide - i) <= 1;
                return (
                  <Pressable key={i} onPress={onCarPress} style={{ width, height: '100%' }}>
                    {shouldRender ? (
                      <LoadingImage source={img} contentFit="cover" transition={150} recyclingKey={`${car.id}-${i}`} style={StyleSheet.absoluteFill} />
                    ) : (
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: p.iconBg }]} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
          {!!tag && (
            <View style={[styles.tag, { backgroundColor: p.navy }]}>
              <Text style={styles.tagText} numberOfLines={1}>Best for {tag}</Text>
            </View>
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={fav ? 'Remove from wishlist' : 'Add to wishlist'}
            hitSlop={8}
            onPress={() => { Haptics.selectionAsync(); toggleFavorite(car.id); }}
            style={[styles.heart, { backgroundColor: p.summary }]}
          >
            <Ionicons name={fav ? 'heart' : 'heart-outline'} size={16} color={fav ? p.red : p.muted} />
          </Pressable>
          {images.length > 1 && (
            <View style={styles.dots} pointerEvents="none">
              {images.map((_, i) => (
                <View key={i} style={[styles.dot, i === slide ? styles.dotOn : null]} />
              ))}
            </View>
          )}
        </View>

        {/* Details */}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <Text style={[styles.name, { color: p.fg }]} numberOfLines={1}>{car.name}</Text>
              <View style={styles.metaRow}>
                {meta.map((m, i) => (
                  <React.Fragment key={m}>
                    {i > 0 && <View style={[styles.metaDot, { backgroundColor: p.muted }]} />}
                    <Text style={[styles.meta, { color: p.muted }]} numberOfLines={1}>{m}</Text>
                  </React.Fragment>
                ))}
              </View>
            </View>
            {rating !== null && reviewCount > 0 && (
              <View style={styles.ratingCol}>
                <View style={[styles.ratingPill, { backgroundColor: p.navy }]}>
                  <Text style={[styles.ratingText, { color: p.onNavy }]}>{Number(rating || 0).toFixed(1)}</Text>
                  <Ionicons name="star" size={14} color={p.star} />
                </View>
                <Text style={[styles.reviews, { color: p.sub }]}>({reviewCount} Reviews)</Text>
              </View>
            )}
          </View>
          <View style={styles.priceBar}>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: p.fg }]}>{formatCurrency(car.perDay)}</Text>
              <Text style={[styles.perDay, { color: p.muted }]}>/day</Text>
            </View>
            {unavailable ? (
              <View style={styles.linkRow}>
                <Text style={[styles.availText, { color: availability.nextAvailableFrom ? p.green : p.red }]}>
                  {availability.nextAvailableFrom ? `Available on ${shortAvail(availability.nextAvailableFrom)}` : availability.headline}
                </Text>
                <Feather name="chevron-right" size={13} color={availability.nextAvailableFrom ? p.green : p.red} />
              </View>
            ) : (
              <View style={styles.linkRow}>
                <Text style={[styles.viewText, { color: p.muted }]}>View Details</Text>
                <Feather name="chevron-right" size={13} color={p.muted} />
              </View>
            )}
          </View>
        </View>
      </Pressable>
    </View>
  );
});

export const CarListCard = React.memo(function CarListCard(props: CarListCardProps) {
  const { selectCar, dateRange: globalDateRange, setDateRange } = useSawari();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const handleCarPress = React.useCallback(() => {
    if (busy) return;
    setBusy(true);
    setTimeout(() => setBusy(false), 500);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    ActivityAPI.logActivity('click_car', 'CarListCard', { carId: props.car.id, carName: props.car.name });
    if (props.onPressOverride) {
      props.onPressOverride();
      return;
    }
    selectCar(props.car);
    const dateRange = props.effectiveDateRange ?? globalDateRange;
    const isDateSelected = !!dateRange && !dateRange.includes('Select') && dateRange !== 'All Dates';

    if (!isDateSelected && props.onIntercept) {
      props.onIntercept();
    } else {
      if (props.isExplore || (props.effectiveDateRange && props.effectiveDateRange !== globalDateRange)) {
        setDateRange(props.effectiveDateRange || '');
      }
      router.push('/car-details');
    }
  }, [busy, props.car, selectCar, props.onIntercept, props.onPressOverride, props.effectiveDateRange, globalDateRange, setDateRange, router, props.isExplore]);

  return <CarListCardUI {...props} onCarPress={handleCarPress} />;
});

const styles = StyleSheet.create({
  wrap: { marginBottom: 12, marginHorizontal: 16 },
  // Figma: card padding 4/4/8, 8 between the photo and the details (351×212 photo, 8px radius, 8 inset for tag, heart and dots).
  card: { borderWidth: 1, borderRadius: 12, paddingTop: 4, paddingHorizontal: 4, paddingBottom: 8 },
  photo: { height: 212, borderRadius: 8, overflow: 'hidden' },
  tag: { position: 'absolute', top: 8, left: 8, borderRadius: 20, paddingHorizontal: 8, height: 29, justifyContent: 'center', maxWidth: '70%' },
  tagText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5, color: '#FFFFFF' },
  heart: { position: 'absolute', top: 8, right: 8, width: 29, height: 29, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  // Dots: the current one is a 16×4 white pill, the others 4×4 Neutral/300, 5 apart.
  dots: { position: 'absolute', bottom: 8, alignSelf: 'center', flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 4, height: 4, borderRadius: 20, backgroundColor: '#D4D4D4' },
  dotOn: { width: 16, backgroundColor: '#FFFFFF' },
  body: { marginTop: 8, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4, gap: 8 },
  name: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 26 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaDot: { width: 3, height: 3, borderRadius: 2 },
  meta: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, flexShrink: 1 },
  ratingCol: { alignItems: 'center', gap: 4 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 2, borderRadius: 20, height: 28, paddingTop: 4, paddingRight: 9, paddingBottom: 4, paddingLeft: 10 },
  ratingText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },
  reviews: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5 },
  // Price row: 4 padding around a 17px line; the price and the struck rate are trimmed to cap height (Figma leading-trim: cap).
  priceBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 4 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  price: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28.5, marginTop: -7.85, marginBottom: -6.5, includeFontPadding: false },
  strike: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 16, textDecorationLine: 'line-through', marginTop: -3.6, marginBottom: -2.7, includeFontPadding: false },
  perDay: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 16, marginTop: -3.6, marginBottom: -2.7, includeFontPadding: false },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5, textDecorationLine: 'underline' },
  availText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5 },
});