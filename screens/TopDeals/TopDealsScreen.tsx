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
import { dayNumToLabel, todayDayNum, Car } from '@/utils/sawari';

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
  } = useSawari();

  const [activeCarIndex, setActiveCarIndex] = useState(0);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [selectedSlotId, setSelectedSlotId] = useState<string>('overnight');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey>('specification');

  const expandAnim = useRef(new Animated.Value(0)).current;
  const mainScrollRef = useRef<ScrollView>(null);
  const sectionPositions = useRef<Record<string, number>>({});

  // Slide open / close animations
  const openFullDetails = () => {
    Haptics.selectionAsync();
    setIsExpanded(true);
    Animated.spring(expandAnim, {
      toValue: 1,
      friction: 8,
      tension: 45,
      useNativeDriver: false,
    }).start();
  };

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

  // PanResponder to detect swipe up/down gesture on the sheet
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        // Vertical drag > 15px
        return Math.abs(gesture.dy) > 15 && Math.abs(gesture.dx) < 20;
      },
      onPanResponderRelease: (_, gesture) => {
        if (!isExpanded && gesture.dy < -30) {
          // Swiped up in preview mode -> open full car details
          openFullDetails();
        } else if (isExpanded && gesture.dy > 45) {
          // Swiped down in full mode -> close to preview mode
          closeFullDetails();
        }
      },
    })
  ).current;

  // Horizontal swipe handler on the preview card
  const horizontalSwipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        return !isExpanded && Math.abs(gesture.dx) > 20 && Math.abs(gesture.dy) < 20;
      },
      onPanResponderRelease: (_, gesture) => {
        if (gesture.dx < -40 && dealCars.length > 1) {
          // Swiped left -> next car
          Haptics.selectionAsync();
          setActiveCarIndex((prev) => (prev + 1) % dealCars.length);
          setActivePhotoIndex(0);
        } else if (gesture.dx > 40 && dealCars.length > 1) {
          // Swiped right -> prev car
          Haptics.selectionAsync();
          setActiveCarIndex((prev) => (prev - 1 + dealCars.length) % dealCars.length);
          setActivePhotoIndex(0);
        }
      },
    })
  ).current;

  // Available cars with gap slots
  const dealCars = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];
    return vehicles.filter((v: any) => v.status !== 'maintenance');
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
      const carName = activeCar.displayName || activeCar.name || 'Special Car';
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
    outputRange: [10, 0],
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

  return (
    <View style={styles.container}>
      {/* Dimmed Background Backdrop (Modal overlay effect matching screenshot) */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#4B5563' }]} />

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
        </Animated.View>
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
      >
        {/* Card Header: Down chevron, Bookmark, Share */}
        <View style={styles.cardHeader} {...panResponder.panHandlers}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? 'Slide down to preview' : 'Close'}
            onPress={isExpanded ? closeFullDetails : () => safeBack(router)}
            style={[styles.circleActionBtn, { backgroundColor: '#F3F4F6' }]}
          >
            <Feather name="chevron-down" size={22} color="#374151" />
          </Pressable>

          {isExpanded ? (
            <View style={{ flex: 1, paddingHorizontal: 12 }}>
              <Text style={{ fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: p.fg }} numberOfLines={1}>
                {carName}
              </Text>
              <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: '#2563EB' }}>
                ⚡ TOP DEAL • LOCKED DATES
              </Text>
            </View>
          ) : (
            <Pressable onPress={openFullDetails} style={styles.swipeHintPill}>
              <Feather name="chevrons-up" size={14} color="#2563EB" />
              <Text style={styles.swipeHintText}>Slide up for full details</Text>
            </Pressable>
          )}

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

        {/* Scrollable Body: In preview mode it shows the card from image; on slide up it reveals full car details page */}
        <ScrollView
          ref={mainScrollRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardScroll}
          scrollEventThrottle={32}
        >
          {/* ==================== PREVIEW HERO SECTION (Matching image) ==================== */}
          <View {...horizontalSwipeResponder.panHandlers}>
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
              <Feather name="chevron-right" size={14} color="#2563EB" />
            </Pressable>

            {/* Car Title */}
            <Pressable onPress={openFullDetails}>
              <Text style={[styles.carTitle, { color: p.fg }]} numberOfLines={2}>
                {carName}
              </Text>
            </Pressable>

            {/* Vehicle Specs / Subtitle */}
            <Text style={[styles.carSpecsSubtitle, { color: p.muted }]}>
              Available Gap: 17 Hours • {seats} • {transmission} • {fuel}
            </Text>
          </View>

          {/* Slot Package Selector Cards (Matching 3 ltr / 5 kg in the screenshot) */}
          <Text style={[styles.slotSectionHeader, { color: p.fg }]}>
            Select Deal Slot Package:
          </Text>
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
              <Feather name="chevron-up" size={16} color="#2563EB" />
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
              <View style={{ height: 14 }} />

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
        </Animated.View>
      )}
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
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  swipeHintText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    color: '#2563EB',
  },
  cardScroll: {
    paddingHorizontal: 16,
    paddingBottom: 24,
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
    backgroundColor: '#F0F5FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 14,
  },
  expandCarDetailsBtnText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 13,
    color: '#2563EB',
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
