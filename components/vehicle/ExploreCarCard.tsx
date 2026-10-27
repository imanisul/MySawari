import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { LoadingImage } from '@/components/common/LoadingImage';
import { Car, carTitle, getAvailability, getCarHighlights } from '@/utils/sawari';
import { formatCurrency, memberDayPrice } from '@/services/backend/pricingEngine';
import { useSawari } from '@/context/SawariContext';
import { ActivityAPI } from '@/services/api/activity';

/**
 * Explore's vehicle card (Figma "Vehicle Card", 361px wide). It is its own component so the shared
 * CarListCard keeps its layout on the other screens.
 */
export const ExploreCarCard = React.memo(function ExploreCarCard({ car, dateRange, index }: { car: Car; dateRange: string; index: number }) {
  const { selectCar, setDateRange, membership } = useSawari();
  const router = useRouter();

  const images: any[] = (car as any).images?.length ? (car as any).images : [car.image];
  const tag = getCarHighlights(car)[0];
  // Members see their day rate, with the list rate struck through beside it.
  const memberPrice = memberDayPrice(car.perDay, membership as any);
  const availability = car.availability ?? getAvailability(car);
  const available = car.isAvailable !== false && availability.available;
  // startDate is 'Today' when no dates are chosen, so the line reads "Available today".
  const availLabel = !available
    ? ''
    : availability.startDate === 'Today'
      ? 'Available today'
      : `Available on ${availability.startDate}`;
  const title = carTitle(car);
  const meta = [car.transmission, car.fuel, car.type === 'Bike' ? null : (/seat/i.test(car.seats) ? car.seats : `${car.seats} Seater`)].filter(Boolean) as string[];
  // Figma's list repeats blue, green, green, blue for the tag colour.
  const tagGreen = [1, 2].includes(index % 4);

  const open = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    ActivityAPI.logActivity('click_car', 'ExploreCarCard', { carId: car.id, carName: car.name });
    selectCar(car);
    setDateRange(dateRange);
    router.push('/car-details');
  };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${formatCurrency(car.perDay)} per day`}
      testID={`explore-car-${car.id}`}
      onPress={open}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.imageWrap}>
        <LoadingImage source={images[0]} contentFit="cover" transition={200} recyclingKey={car.id} style={StyleSheet.absoluteFill} />
        <View style={styles.topRow}>
          {!!tag && (
            <View style={[styles.tag, { backgroundColor: tagGreen ? '#008758' : '#2F3E75' }]}>
              <Text style={styles.tagText}>Best for {tag}</Text>
            </View>
          )}
          <View style={styles.heart}>
            <Feather name="heart" size={16} color="#737373" />
          </View>
        </View>
        {images.length > 1 && (
          <View style={styles.dots}>
            {images.slice(0, 4).map((_, i) => (
              <View key={i} style={[styles.dot, i === 0 ? styles.dotOn : styles.dotOff]} />
            ))}
          </View>
        )}
      </View>

      <View style={styles.body}>
        {/* Figma: title and specs on the left, the rating stacked on the right. */}
        <View style={styles.titleRow}>
          <View style={styles.titleCol}>
            <Text numberOfLines={1} style={styles.title}>{title}</Text>
            {/* Figma Frame 132: each spec is its own node, 3px dots between them at gap 4. */}
            <View style={styles.metaRow}>
              {meta.map((m, i) => (
                <React.Fragment key={m}>
                  {i > 0 && <View style={styles.metaDot} />}
                  <Text numberOfLines={1} style={styles.meta}>{m}</Text>
                </React.Fragment>
              ))}
            </View>
          </View>
          {(car.rating != null || car.reviewCount != null) && (
            <View style={styles.ratingCol}>
              {car.rating != null && (
                <View style={styles.ratingPill}>
                  <Text style={styles.ratingText}>{car.rating.toFixed(1)}</Text>
                  <FontAwesome5 name="star" size={14} color="#FBBC04" solid />
                </View>
              )}
              {car.reviewCount != null && <Text style={styles.reviews}>({car.reviewCount} Reviews)</Text>}
            </View>
          )}
        </View>

        {/* Figma: price (with the list rate struck through for members) on the left, the link on the right. */}
        <View style={styles.bottomRow}>
          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatCurrency(memberPrice ?? car.perDay)}</Text>
          </View>
          {/* Figma: free cars show the date they are available on; otherwise the View Details link. */}
          <View style={styles.details}>
            <Text numberOfLines={1} style={available ? styles.availText : styles.detailsText}>
              {available ? availLabel : 'View Details'}
            </Text>
            <Feather name="chevron-right" size={13} color={available ? '#008758' : '#737373'} />
          </View>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    alignSelf: 'stretch',
    backgroundColor: '#F4F6FA',
    borderColor: '#E7EAF4',
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginBottom: 12, // Figma: 12px between cards
    padding: 4,
    paddingBottom: 8,
  },
  imageWrap: { backgroundColor: '#FFFFFF', borderRadius: 8, height: 212, overflow: 'hidden' },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', margin: 8 },
  tag: { alignItems: 'center', borderRadius: 20, paddingHorizontal: 8, paddingVertical: 6 },
  tagText: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16 },
  heart: { alignItems: 'center', backgroundColor: '#F4F6FA', borderRadius: 15, height: 29, justifyContent: 'center', width: 29 },
  dots: { alignSelf: 'center', bottom: 8, flexDirection: 'row', gap: 5, position: 'absolute' },
  dot: { borderRadius: 20, height: 4 },
  dotOn: { backgroundColor: '#FFFFFF', width: 16 },
  dotOff: { backgroundColor: '#D4D4D4', width: 4 },
  body: { gap: 6 },
  titleRow: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 4 },
  titleCol: { flex: 1, gap: 4 },
  title: { color: '#262626', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 26 },
  metaRow: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  metaDot: { backgroundColor: '#737373', borderRadius: 1.5, flexShrink: 0, height: 3, width: 3 },
  meta: { color: '#737373', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, flexShrink: 1, lineHeight: 20 },
  ratingCol: { alignItems: 'center', gap: 4 },
  ratingPill: { alignItems: 'center', backgroundColor: '#2F3E75', borderRadius: 20, flexDirection: 'row', gap: 2, paddingHorizontal: 10, paddingVertical: 4 },
  ratingText: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },
  reviews: { color: '#525252', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16 },
  bottomRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', padding: 4 },
  priceRow: { alignItems: 'flex-end', flexDirection: 'row', gap: 2 },
  price: { color: '#262626', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28 },
  strike: { color: '#737373', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, textDecorationLine: 'line-through' },
  details: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  availText: { color: '#339F79', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16 },
  detailsText: { color: '#737373', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16, textDecorationLine: 'underline' },
});
