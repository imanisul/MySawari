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
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '@/utils/haptics';
import { safeBack } from '@/utils/navigation';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { formatCurrency, MYSAWARI_HUB_NAME } from '@/services/backend/pricingEngine';
import { dayNumToLabel, todayDayNum } from '@/utils/sawari';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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
  } = useSawari();

  const [activeCarIndex, setActiveCarIndex] = useState(0);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('overnight');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Available cars with gap slots
  const dealCars = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];
    // Prioritize available cars or cars with high popularity
    return vehicles.filter((v: any) => v.status !== 'maintenance');
  }, [vehicles]);

  const filteredCars = useMemo(() => {
    if (!searchQuery.trim()) return dealCars;
    const q = searchQuery.toLowerCase();
    return dealCars.filter(
      (c: any) =>
        (c.displayName || c.vehicleName || '').toLowerCase().includes(q) ||
        (c.category || '').toLowerCase().includes(q) ||
        (c.fuelType || '').toLowerCase().includes(q)
    );
  }, [dealCars, searchQuery]);

  const activeCar = filteredCars[activeCarIndex] || dealCars[0] || null;

  // Compute realistic gap slots for the active vehicle
  const slots: DealSlot[] = useMemo(() => {
    if (!activeCar) return [];
    const perDay = Number(activeCar.perDay || activeCar.pricePerDay || 2200);
    const baseHourRate = Math.max(50, Math.round(perDay / 24));

    // Slot 1: Overnight Slot (8 PM – 8 AM)
    const s1Hours = 12;
    const s1Base = s1Hours * baseHourRate;
    const s1Deal = Math.round(s1Base * 0.75); // 25% off
    const s1Member = Math.round(s1Deal * 0.88); // Extra member discount

    // Slot 2: Full Gap Slot (3 PM – 8 AM next morning)
    const s2Hours = 17;
    const s2Base = s2Hours * baseHourRate;
    const s2Deal = Math.round(s2Base * 0.70); // 30% off
    const s2Member = Math.round(s2Deal * 0.85);

    // Slot 3: Evening Drive (3 PM – 9 PM)
    const s3Hours = 6;
    const s3Base = s3Hours * baseHourRate;
    const s3Deal = Math.round(s3Base * 0.82); // 18% off
    const s3Member = Math.round(s3Deal * 0.90);

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
      },
      {
        id: 'full_gap',
        title: 'Full Gap Slot',
        badge: '3 PM – 8 AM (17 hrs)',
        discountPct: 30,
        durationHours: s2Hours,
        pickupTime: '03:00 PM',
        returnTime: '08:00 AM',
        daysSpan: 1,
        isOvernight: true,
        basePrice: s2Base,
        dealPrice: s2Deal,
        memberPrice: s2Member,
        hourlyRate: Number((s2Deal / s2Hours).toFixed(1)),
      },
      {
        id: 'evening',
        title: 'Evening Drive',
        badge: '3 PM – 9 PM (6 hrs)',
        discountPct: 18,
        durationHours: s3Hours,
        pickupTime: '03:00 PM',
        returnTime: '09:00 PM',
        daysSpan: 0,
        isOvernight: false,
        basePrice: s3Base,
        dealPrice: s3Deal,
        memberPrice: s3Member,
        hourlyRate: Number((s3Deal / s3Hours).toFixed(1)),
      },
    ];
  }, [activeCar]);

  const activeSlot = slots.find((s) => s.id === selectedSlotId) || slots[0];

  const isFav = activeCar ? favorites.includes(String(activeCar.id)) : false;

  const handleShare = async () => {
    Haptics.selectionAsync();
    if (!activeCar) return;
    try {
      const carName = activeCar.displayName || activeCar.name || activeCar.vehicleName || 'Special Car';
      await Share.share({
        title: `Top Deal: ${carName}`,
        message: `Check out the Top Deal on ${carName} on MySawari! Rent from ₹${activeSlot?.hourlyRate || 69}/hr. Book now on the MySawari App!`,
      });
    } catch {
      // share dismissed
    }
  };

  const handleBookDeal = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (!activeCar || !activeSlot) return;

    selectCar(activeCar);

    // Set exact locked slot dates
    const todayNum = todayDayNum();
    const startLabel = dayNumToLabel(todayNum);
    const endLabel = activeSlot.daysSpan > 0 ? dayNumToLabel(todayNum + activeSlot.daysSpan) : startLabel;

    setDates(
      activeSlot.daysSpan > 0 ? `${startLabel} – ${endLabel}` : `${startLabel} – ${startLabel}`,
      activeSlot.daysSpan > 0 ? '1 Day' : '1 Day'
    );
    setTimes(activeSlot.pickupTime, activeSlot.returnTime);

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

    // Navigate to booking with locked dates & deal pricing
    router.push({
      pathname: '/booking',
      params: {
        lockDates: 'true',
        isFixedDates: 'true',
        isTopDeal: 'true',
        isOvernight: activeSlot.isOvernight ? 'true' : 'false',
        dealPrice: String(activeSlot.dealPrice),
        hourlyRate: String(activeSlot.hourlyRate),
        slotTitle: activeSlot.title,
      },
    });
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

  const carName = activeCar?.displayName || activeCar?.name || activeCar?.vehicleName || 'Premium Vehicle';
  const category = activeCar?.category || 'SUV';
  const fuel = (activeCar as any)?.fuelType || activeCar?.fuel || 'Diesel';
  const transmission = activeCar?.transmission || 'Automatic';
  const seats = activeCar?.seats
    ? activeCar.seats.includes('Seater')
      ? activeCar.seats
      : `${activeCar.seats} Seater`
    : '5 Seater';

  return (
    <View style={styles.container}>
      {/* Dimmed Background Backdrop (Modal overlay effect matching screenshot) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#4B5563' }]} />

      {/* Top Header Bar */}
      <View style={[styles.topHeader, { paddingTop: insets.top + 8 }]}>
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
              setIsSearching(!isSearching);
            }}
            style={styles.headerIconBtn}
          >
            <Feather name="search" size={20} color="#FFFFFF" />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share deal"
            onPress={handleShare}
            style={styles.headerIconBtn}
          >
            <Feather name="share-2" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* Main Deal Card Sheet (Matches Surf Excel card format from screenshot) */}
      <View style={[styles.sheetCard, { backgroundColor: p.page }]}>
        {/* Card Header: Down chevron, Bookmark, Share */}
        <View style={styles.cardHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close sheet"
            onPress={() => safeBack(router)}
            style={[styles.circleActionBtn, { backgroundColor: '#F3F4F6' }]}
          >
            <Feather name="chevron-down" size={22} color="#374151" />
          </Pressable>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Save deal"
              onPress={() => {
                if (activeCar) {
                  Haptics.selectionAsync();
                  toggleFavorite(String(activeCar.id));
                }
              }}
              style={[styles.circleActionBtn, { backgroundColor: '#F3F4F6' }]}
            >
              <Feather
                name="bookmark"
                size={18}
                color={isFav ? '#2563EB' : '#374151'}
                style={isFav ? { transform: [{ scale: 1.1 }] } : undefined}
              />
            </Pressable>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Share car"
              onPress={handleShare}
              style={[styles.circleActionBtn, { backgroundColor: '#F3F4F6' }]}
            >
              <Feather name="share-2" size={18} color="#374151" />
            </Pressable>
          </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.cardScroll}>
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
                  <Text style={styles.timeBadgeText}>⚡ 3 PM – 8 AM</Text>
                </View>

                <View style={styles.ratingBadge}>
                  <Ionicons name="star" size={11} color="#059669" />
                  <Text style={styles.ratingText}>4.8 (120)</Text>
                </View>
              </View>
            </View>

            {/* Expand / View 360 icon button on bottom right */}
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

          {/* Category Breadcrumb */}
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push({ pathname: '/explore', params: { category } })}
            style={styles.categoryLink}
          >
            <Text style={styles.categoryLinkText}>Explore all {category}s</Text>
            <Feather name="chevron-right" size={14} color="#2563EB" />
          </Pressable>

          {/* Car Title */}
          <Text style={[styles.carTitle, { color: p.fg }]} numberOfLines={2}>
            {carName}
          </Text>

          {/* Vehicle Specs / Subtitle */}
          <Text style={[styles.carSpecsSubtitle, { color: p.muted }]}>
            Available Gap: 17 Hours • {seats} • {transmission} • {fuel}
          </Text>

          {/* Slot Package Selector Cards (Matching 3 ltr / 5 kg in the screenshot) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.slotsRow}
          >
            {slots.map((slot) => {
              const isSelected = slot.id === selectedSlotId;
              return (
                <Pressable
                  key={slot.id}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelectedSlotId(slot.id);
                  }}
                  style={[
                    styles.slotCard,
                    {
                      backgroundColor: isSelected ? '#F0F5FF' : '#FAFAFA',
                      borderColor: isSelected ? '#2563EB' : '#E5E7EB',
                      borderWidth: isSelected ? 2 : 1,
                    },
                  ]}
                >
                  <Text style={styles.slotTitle} numberOfLines={1}>
                    {slot.title}
                  </Text>

                  <View style={styles.discountRow}>
                    <Text style={styles.discountBadgeText}>{slot.discountPct}% OFF</Text>
                    <View style={styles.discountDivider} />
                  </View>

                  <View style={styles.slotPriceRow}>
                    <Text style={styles.slotDealPrice}>{formatCurrency(slot.dealPrice)}</Text>

                    {/* Member lock badge */}
                    <View style={styles.memberLockBadge}>
                      <Ionicons name="lock-closed" size={10} color="#065F46" />
                      <Text style={styles.memberLockText}>{formatCurrency(slot.memberPrice)}</Text>
                    </View>
                  </View>

                  <View style={styles.slotStrikeRow}>
                    <Text style={styles.slotStrikePrice}>{formatCurrency(slot.basePrice)}</Text>
                    <Text style={styles.memberSubText}>FOR MEMBERS</Text>
                  </View>

                  <Text style={styles.slotHourlyText}>₹{slot.hourlyRate}/hr</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </ScrollView>

        {/* Fixed Sticky Bottom Action Bar inside Sheet */}
        <View style={[styles.fixedBottomBar, { borderTopColor: '#E5E7EB', backgroundColor: p.page }]}>
          <View style={styles.bottomPriceInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.bottomSlotLabel}>{activeSlot?.title}</Text>
              <Text style={styles.bottomDiscountBadge}>{activeSlot?.discountPct}% OFF</Text>
            </View>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 }}>
              <Text style={styles.bottomPrice}>{formatCurrency(activeSlot?.dealPrice || 0)}</Text>
              <Text style={styles.bottomStrikePrice}>{formatCurrency(activeSlot?.basePrice || 0)}</Text>

              <View style={styles.bottomMemberBadge}>
                <Ionicons name="lock-closed" size={10} color="#065F46" />
                <Text style={styles.bottomMemberText}>{formatCurrency(activeSlot?.memberPrice || 0)}</Text>
              </View>
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
      </View>

      {/* Bottom Circular Vehicle Thumbnails Carousel (Exact layout from bottom of image) */}
      <View style={[styles.bottomCarouselContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={filteredCars}
          keyExtractor={(item: any, idx: number) => String(item.id || idx)}
          contentContainerStyle={styles.bottomCarouselContent}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#374151',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    marginHorizontal: 10,
    borderRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 4,
  },
  circleActionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardScroll: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    height: 220,
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
    backgroundColor: '#2563EB',
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
    color: '#2563EB',
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
    marginBottom: 12,
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
    backgroundColor: '#0052FF',
    paddingHorizontal: 28,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0052FF',
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
    backgroundColor: '#4B5563',
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
});
