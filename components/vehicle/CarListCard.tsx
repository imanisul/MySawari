import React, { useState } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { LoadingImage } from '@/components/common/LoadingImage';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { usePressAnimation } from '@/hooks/usePressAnimation';
import { Car, getAvailability, dayNumToLabel, todayDayNum } from '@/utils/sawari';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { useSawari } from '@/context/SawariContext';
import { shadows } from '@/constants/shadows';

/**
 * Vehicle result card: photo (with the type badge and ONE availability badge),
 * then name + price, a spec row, and an optional secondary availability line.
 * Availability comes from `car.availability` (set by the list screen for the
 * dates being viewed) or the shared getAvailability() — nothing is invented here.
 */
type CarListCardProps = {
  car: Car;
  isExplore?: boolean;
  effectiveDateRange?: string;
  onIntercept?: () => void;
  style?: any;
};

const CarListCardUI = React.memo(function CarListCardUI({
  car,
  effectiveDateRange,
  style,
  globalDateRange,
  onCarPress
}: CarListCardProps & { globalDateRange: string; onCarPress: () => void }) {
  const colors = useColors();
  const { scaleAnim, opacityAnim, onPressIn, onPressOut } = usePressAnimation();
  const [isNavigating, setIsNavigating] = useState(false);

  const availability = car.availability ?? getAvailability(car);
  const unavailable = car.isAvailable === false || !availability.available;
  // Badge: "Avail · [start date] – [end date]" for available, or the unavailability headline.
  const badgeText = !unavailable
    ? (availability.freeUntil
        ? (availability.startDate === availability.freeUntil || (availability.startDate === 'Today' && availability.freeUntil === dayNumToLabel(todayDayNum())))
          ? (availability.startDate === 'Today' ? 'Avail only for today' : `Avail only for ${availability.startDate}`)
          : `Avail · ${availability.startDate} – ${availability.freeUntil}`
        : `Avail · ${availability.startDate} – Onwards`)
    : availability.headline;

  const image = (car as any).images?.[0] ?? car.image;
  const price = car.perDay ? formatCurrency(car.perDay) : car.price;

  const handlePress = () => {
    if (isNavigating) return;
    setIsNavigating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onCarPress();
    setTimeout(() => setIsNavigating(false), 500);
  };

  return (
    <Animated.View style={[styles.cardContainer, style, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${car.name}, ${price} per day, ${badgeText}. ${car.seats}, ${car.transmission}, ${car.fuel}`}
        testID={`list-car-${car.id}`}
        disabled={isNavigating}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.card, shadows.level1, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        {/* Photo */}
        <View style={[styles.imageWrap, { backgroundColor: colors.muted }]}>
          <LoadingImage
            source={image}
            contentFit="cover"
            transition={200}
            style={styles.image}
          />
          {/* Soft top gradient so the badges stay readable on any photo */}
          <LinearGradient colors={['rgba(0,0,0,0.38)', 'transparent']} style={styles.topGradient} pointerEvents="none" />

          <View style={styles.badgeRow}>
            <View
              style={[
                styles.availBadge,
                { backgroundColor: unavailable ? '#DC2626' : 'rgba(255,255,255,0.96)' },
              ]}
            >
              <Feather
                name={unavailable ? 'x-circle' : 'check-circle'}
                size={13}
                color={unavailable ? '#FFFFFF' : '#047857'}
              />
              <Text
                numberOfLines={1}
                style={[styles.availBadgeText, { color: unavailable ? '#FFFFFF' : '#047857' }]}
              >
                {badgeText}
              </Text>
            </View>

            <View style={styles.typeBadge}>
              <Text numberOfLines={1} style={styles.typeBadgeText}>{car.category}</Text>
            </View>
          </View>
        </View>

        {/* Details */}
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Text numberOfLines={1} style={[styles.name, { color: colors.foreground }]}>{car.name}</Text>
            <View style={styles.priceWrap}>
              <Text style={[styles.price, { color: colors.foreground }]}>{price}</Text>
              <Text style={[styles.perDay, { color: colors.mutedForeground }]}>/day</Text>
            </View>
          </View>

          <View style={styles.specRow}>
            <Spec icon="users" text={car.seats} color={colors.mutedForeground} />
            <Spec icon="settings" text={car.transmission} color={colors.mutedForeground} />
            <Spec icon="droplet" text={car.fuel} color={colors.mutedForeground} />
          </View>

          {/* Only show detail row for unavailable vehicles (e.g. "Next available 25 Sep") */}
          {!!availability.detail && unavailable && (
            <View style={[styles.detailRow, { borderTopColor: colors.border }]}>
              <Feather
                name="clock"
                size={13}
                color={colors.destructive}
              />
              <Text
                numberOfLines={1}
                style={[styles.detailText, { color: colors.destructive }]}
              >
                {availability.detail}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
});

export function CarListCard(props: CarListCardProps) {
  const { selectCar, dateRange: globalDateRange, setDateRange } = useSawari();
  const router = useRouter();
  
  const handleCarPress = React.useCallback(() => {
    selectCar(props.car);
    const dateRange = props.effectiveDateRange ?? globalDateRange;
    const isDateSelected = !!dateRange && !dateRange.includes('Select') && dateRange !== 'All Dates';

    if (!isDateSelected && props.onIntercept) {
      props.onIntercept();
    } else {
      if (props.effectiveDateRange && props.effectiveDateRange !== globalDateRange) {
        setDateRange(props.effectiveDateRange);
      }
      router.push('/car-details');
    }
  }, [props.car, selectCar, props.onIntercept, props.effectiveDateRange, globalDateRange, setDateRange, router]);

  return (
    <CarListCardUI 
      {...props} 
      globalDateRange={globalDateRange} 
      onCarPress={handleCarPress} 
    />
  );
}

function Spec({ icon, text, color }: { icon: React.ComponentProps<typeof Feather>['name']; text: string; color: string }) {
  return (
    <View style={styles.spec}>
      <Feather name={icon} size={14} color={color} />
      <Text numberOfLines={1} style={[styles.specText, { color }]}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: { marginBottom: 16, marginHorizontal: 16 },
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  imageWrap: { width: '100%', aspectRatio: 16 / 9 },
  image: { width: '100%', height: '100%' },
  topGradient: { position: 'absolute', top: 0, left: 0, right: 0, height: 72 },
  badgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  availBadge: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
  },
  availBadgeText: { flexShrink: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  typeBadge: {
    flexShrink: 0,
    maxWidth: '40%',
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    backgroundColor: 'rgba(17,26,43,0.88)',
  },
  typeBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#FFFFFF' },
  body: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: 12 },
  name: { flex: 1, fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.2 },
  priceWrap: { flexDirection: 'row', alignItems: 'baseline', flexShrink: 0 },
  price: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.3 },
  perDay: { fontFamily: 'Inter_500Medium', fontSize: 12, marginLeft: 2 },
  specRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 8 },
  spec: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  specText: { fontFamily: 'Inter_500Medium', fontSize: 13, flexShrink: 1 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  detailText: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 12.5 },
});
