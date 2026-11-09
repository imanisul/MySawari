import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CITIES } from '@/constants/cities';
import { CitySheet } from '@/components/home/CitySheet';
import Notifications from '@/utils/notifications';
import { FlatList, StyleSheet, Text, View, RefreshControl, ImageSourcePropType, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import {  StatusBar } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAvailability, splitDateRange, parseDayLabel, Car, byAvailability, cars, LocationResult, isInService } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';
import { Page, LoginBottomSheet } from '@/components';
import { API } from '@/services/backend/api';
import { isPastSearch, removeRecentSearch, RecentSearch } from '@/utils/recentSearches';
import { useVehicles, prefetchCarGallery } from '@/hooks/useVehicles';
import { recentlyViewedQueryOptions, recentSearchesQueryOptions } from '@/hooks/useHomeData';
import { Reveal } from '@/components/common/Reveal';
import { BookingSkeleton } from '@/components/loading/BookingSkeleton';
import { CustomAlert } from '@/components/common/CustomAlert';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import {
  HomeHero, ReferStrip, HomeSearchCard, TripSearchCard, HomeSectionTitle, TopPickCard, TripMilestoneCard,
  DestinationTile, BenefitsGrid, MemberBenefitsCard, RateUsCard, ConnectCard, HomePromoBanner, HOME_PURPLE,
} from '@/components/home/HomeSections';
import { ExclusiveOffersSection } from '@/components/home/ExclusiveOffersSection';
import { useRideJourney, PendingCard } from '@/hooks/useRideJourney';
import { RewardScratchModal } from '@/components/rewards/RewardScratchModal';

const DESTINATIONS: { id: string; title: string; blurb: string; image: ImageSourcePropType; faded?: boolean }[] = [
  { id: 'shillong', title: 'Shillong', blurb: 'Pine-covered hills, cafe culture, and Scotland of the East vibes.', image: require('../../assets/images/dest_shillong.jpg') },
  { id: 'tawang', title: 'Tawang', blurb: 'High-altitude passes, majestic monastery, and snow peaks.', image: require('../../assets/images/dest_tawang.jpg') },
  { id: 'cherrapunji', title: 'Cherrapunji', blurb: 'Living root bridges, roaring waterfalls, and misty cliffs.', image: require('../../assets/images/dest_cherrapunji.jpg') },
  { id: 'umrangso', title: 'Umrangso', blurb: 'Serene Kapili Lake, scenic golf course, and misty rolling hills.', image: require('../../assets/images/dest_umrangso.jpg') },
  { id: 'kaziranga', title: 'Kaziranga', blurb: 'Wild safaris, the one-horned rhino, and lush tea estates.', image: require('../../assets/images/dest_kaziranga.jpg') },
  { id: 'meghalaya', title: 'Meghalaya', blurb: 'Discover scenic drives, waterfalls, rivers, and hidden villages.', image: require('../../assets/images/dest_meghalaya.jpg') },
  { id: 'sikkim', title: 'Sikkim', blurb: 'Mountain escapes, peaceful monasteries, and Himalayan views.', image: require('../../assets/images/dest_sikkim.jpg') },
];

const DESTINATION_LOCATIONS: Record<string, LocationResult> = {
  Shillong: {
    id: 'shillong',
    name: 'Shillong, Meghalaya',
    address: 'Scotland of the East',
    latitude: 25.5788,
    longitude: 91.8933,
    source: 'database',
  },
  Tawang: {
    id: 'tawang',
    name: 'Tawang, Arunachal Pradesh',
    address: 'Monasteries and Snow Peaks',
    latitude: 27.5861,
    longitude: 91.8594,
    source: 'database',
  },
  Cherrapunji: {
    id: 'cherrapunji',
    name: 'Cherrapunji, Meghalaya',
    address: 'Living Root Bridges & Waterfalls',
    latitude: 25.2986,
    longitude: 91.5822,
    source: 'database',
  },
  Umrangso: {
    id: 'umrangso',
    name: 'Umrangso, Assam',
    address: 'Kapili Lake & Scenic Golf Course',
    latitude: 25.5186,
    longitude: 92.7486,
    source: 'database',
  },
  Kaziranga: {
    id: 'kaziranga',
    name: 'Kaziranga National Park, Assam',
    address: 'Home of the One-Horned Rhino',
    latitude: 26.5775,
    longitude: 93.1711,
    source: 'database',
  },
  Meghalaya: {
    id: 'meghalaya',
    name: 'Meghalaya, India',
    address: 'Abode of Clouds & Scenic Waterfalls',
    latitude: 25.4670,
    longitude: 91.3662,
    source: 'database',
  },
  Sikkim: {
    id: 'sikkim',
    name: 'Sikkim, India',
    address: 'Himalayan Passes & Monasteries',
    latitude: 27.5330,
    longitude: 88.5122,
    source: 'database',
  },
};

// The first trip milestone (backend MILESTONES in booking.controller.js) — shown to guests, who have no journey yet.
const FIRST_MILESTONE = { rides: 4, rewardAmount: 5000 };

// Curated favourites for the bike tab's ties.
const PICKS = { Car: ['curvv', 'venue', 'brezza', 'innova', 'creta'], Bike: ['xpulse', 'xpluse', 'ntorq', 'hunter', 'jawa'] };

// Top Picks for cars, in this order: the model name and, where it matters, the colour.
const TOP_CARS: { model: string; color?: string }[] = [
  { model: 'innova' }, { model: 'curvv' }, { model: 'ertiga' }, { model: 'rumion', color: 'white' },
  { model: 'taisor' }, { model: 'xuv300' }, { model: 'brezza', color: 'red' },
  { model: 'venue', color: 'black' }, { model: 'venue', color: 'white' }, { model: 'creta', color: 'black' },
];

/**
 * Home (Figma "Home"): banner, refer strip, Cars / Bikes + destination, top picks (recently viewed first),
 * trip milestone, top destinations, benefits, membership and social links.
 */
export default function HomeScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const {
    vehicleType, setVehicleType, customer, selectedCar, selectCar, isAuthenticated, isAuthLoading, setBookingSource, dateRange,
    membership, fetchWallet, syncNotifications, sawariCash, unreadCount, earnSawariCash, isDarkMode,
    dropoff, setDropoff, setDates, setTimes, setMode, setIsDeliveryRequested, setDeliveryMode, setPickup, setReturnAddress,
  } = useSawari();
  const [showLogin, setShowLogin] = useState(false);
  // The city shown at the top; tapping it opens the picker (one city for now, more later).
  const [city, setCityState] = useState(CITIES[0].name);
  const [showCity, setShowCity] = useState(false);
  useEffect(() => { AsyncStorage.getItem('@selected_city').then((c) => { if (c && CITIES.some((x) => x.name === c)) setCityState(c); }).catch(() => {}); }, []);
  const setCity = (c: string) => { setCityState(c); AsyncStorage.setItem('@selected_city', c).catch(() => {}); };
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [isPastHero, setIsPastHero] = useState(false);
  const heroSectionHeight = useRef(0);

  /** Runs `go` now when signed in, or after logging in. */
  const requireLogin = useCallback((go: () => void) => {
    if (isAuthenticated) go();
    else { setPendingAction(() => go); setShowLogin(true); }
  }, [isAuthenticated]);

  // The banner is purple: light status bar text while Home is on screen.
  useFocusEffect(useCallback(() => {
    StatusBar.setStyle(isPastHero ? 'dark' : 'light');
    import('@/services/api/activity').then(({ ActivityAPI }) => ActivityAPI.logActivity('view_screen', 'HomeScreen'));
    return () => StatusBar.setStyle(isDarkMode ? 'light' : 'dark');
  }, [isDarkMode, isPastHero]));

  useEffect(() => {
    StatusBar.setStyle(isPastHero ? 'dark' : 'light');
  }, [isPastHero]);

  useFocusEffect(useCallback(() => {
    setBookingSource('home');
    if (!isAuthLoading) {
      syncNotifications();
      // Picks up a just-activated membership or SawariCash change when coming back to Home.
      if (isAuthenticated) fetchWallet();
    }
  }, [isAuthLoading, isAuthenticated, setBookingSource, fetchWallet, syncNotifications]));

  // Live content synchronisation: refresh offers on focus and background version check
  useFocusEffect(useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['offers'] });
    queryClient.invalidateQueries({ queryKey: ['exclusive-offers'] });
  }, [queryClient]));

  const lastContentVersion = useRef(0);
  useEffect(() => {
    const timer = setInterval(async () => {
      try {
        const { fetchContentVersion } = await import('@/services/api/offers');
        const ver = await fetchContentVersion();
        if (ver && ver > lastContentVersion.current) {
          if (lastContentVersion.current > 0) {
            queryClient.invalidateQueries({ queryKey: ['offers'] });
            queryClient.invalidateQueries({ queryKey: ['exclusive-offers'] });
          }
          lastContentVersion.current = ver;
        }
      } catch {}
    }, 12000);
    return () => clearInterval(timer);
  }, [queryClient]);

  // No location-permission request here: the app asks once at start-up (SawariContext's GPS
  // auto-detect). Asking again from Home put a second system popup on screen at launch.

  // No "Set Location" popup on opening the app: the customer picks a destination from the search card
  // ("Select your Destination") when they want to.

  const { data: fetchedVehicles = [], refetch: refetchVehicles, isLoading: vehiclesLoading } = useVehicles();

  // ── Top picks: vehicles the customer viewed (resume where they left), then curated favourites ──
  const recentKey = isAuthenticated ? customer?.id : null;
  const { data: viewedIds = [] } = useQuery(recentlyViewedQueryOptions(recentKey));
  useFocusEffect(useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['recentlyViewed', recentKey || 'guest'] });
  }, [queryClient, recentKey]));

  const typeName = vehicleType === 'bike' ? 'Bike' : 'Car';
  const [startStr, endStr] = dateRange === 'Select Dates' ? [undefined, undefined] : splitDateRange(dateRange);
  const withAvail = useCallback((v: any) => { const availability = getAvailability(v, startStr, endStr); return { ...v, availability, isAvailable: availability.available }; }, [startStr, endStr]);

  // Recent Searches: only what this customer looked at (newest first, with the trip it was viewed for), never filler.
  const recent = useMemo(() => viewedIds
    .map((item: any) => {
      const v = fetchedVehicles.find((x) => String(x.id) === item.vehicleId);
      // Everything the customer looked at shows together, cars and bikes, whichever tab is selected.
      return v && !isInService(v) ? { ...withAvail(v), viewedContext: item } : null;
    })
    .filter(Boolean)
    .slice(0, 4) as any[], [viewedIds, fetchedVehicles, withAvail]);

  // Top Picks: the most booked vehicles of the selected type (last 90 days, from the bookings), free ones first;
  // the curated favourites only break ties.
  const picks = useMemo(() => {
    if (typeName === 'Car') {
      const pool = fetchedVehicles.filter((v) => (v?.displayName || v?.name) && v.type === 'Car' && !isInService(v));
      const text = (v: Car) => `${v.displayName || ''} ${v.name || ''}`.toLowerCase().replace(/\s+/g, '');
      const used = new Set<string>();
      const out: Car[] = [];
      for (const t of TOP_CARS) {
        const models = pool.filter((v) => text(v).includes(t.model) && !used.has(String(v.id)));
        // The right colour if we have it, otherwise the same model in any colour.
        const hit = (t.color && models.find((v) => (v.color || text(v)).toLowerCase().includes(t.color!))) || models[0];
        if (hit) { used.add(String(hit.id)); out.push(withAvail(hit)); }
      }
      if (out.length) return out;
    }
    const fav = PICKS[typeName];
    const rank = (v: Car) => {
      const n = (v.displayName || v.name || '').toLowerCase();
      const i = fav.findIndex((word) => n.includes(word));
      return i === -1 ? fav.length + 10 : i;
    };
    const top = fetchedVehicles
      .filter((v) => (v?.displayName || v?.name) && v.type === typeName && !isInService(v))
      .map(withAvail)
      .sort((a, b) => (b.recentBookings || 0) - (a.recentBookings || 0) || rank(a) - rank(b));
    return byAvailability(top).slice(0, 8);
  }, [fetchedVehicles, typeName, withAvail]);

  // Recent Searches: the trips this customer searched (where, dates, time), newest first; past dates are dropped.
  const { data: savedSearches = [] } = useQuery(recentSearchesQueryOptions(recentKey));
  useFocusEffect(useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['recentSearches', recentKey || 'guest'] });
  }, [queryClient, recentKey]));
  const tripSearches = useMemo(() => savedSearches.filter((t) => !isPastSearch(t)).slice(0, 4), [savedSearches]);
  const removeTripSearch = useCallback((id: string) => {
    removeRecentSearch(recentKey, id).then((next) => queryClient.setQueryData(['recentSearches', recentKey || 'guest'], next));
  }, [recentKey, queryClient]);
  const openTripSearch = useCallback((t: RecentSearch) => {
    setBookingSource('home');
    setVehicleType(t.vehicleType);
    if (t.dropoff) setDropoff(t.dropoff);
    // 'Upcoming Trip' is a placeholder for "no dates picked", not a range the results can search.
    if (t.dateRange && t.duration && t.dateRange !== 'Upcoming Trip') setDates(t.dateRange, t.duration);
    if (t.pickupTime && t.returnTime) setTimes(t.pickupTime, t.returnTime);
    // A recent search always opens the available cars for that place and dates.
    router.push('/search');
  }, [setBookingSource, setVehicleType, setDropoff, setDates, setTimes, router]);

  const openPick = useCallback((item: any) => {
    selectCar(item);
    prefetchCarGallery(item);
    setBookingSource('home');
    // The car's details page only: location, dates and time are asked again, so booking never starts from an old trip.
    setDropoff(null);
    setDates('Select Dates', '5 days');
    setTimes('08:00 AM', '08:00 AM');
    router.push('/car-details');
  }, [selectCar, setBookingSource, router, setDropoff, setDates, setTimes]);

  // ── Trip milestone (ride journey from the server) ──
  const { data: journey, refetch: refetchJourney, cards } = useRideJourney();
  const claimable = journey?.milestones.find((m) => m.unlocked && !m.claimed) ?? null;
  const next = journey?.milestones.find((m) => !m.unlocked) ?? null;
  const milestone = claimable ?? next ?? (journey ? null : { label: '', rides: FIRST_MILESTONE.rides, rewardAmount: FIRST_MILESTONE.rewardAmount });

  // Reaching a milestone gives a scratch card (opened here, kept in Rewards if left).
  const [scratch, setScratch] = useState<PendingCard | null>(null);
  const claim = useCallback(() => {
    const card = cards.find((c) => c.kind === 'milestone');
    if (card) setScratch(card);
  }, [cards]);

  // Refer & Earn: 10% of a friend's first booking — at least 10% of the lowest day rate in the fleet.
  const referEarn = useMemo(() => {
    const rates = fetchedVehicles.map((v) => v.perDay).filter((n) => n > 0);
    if (!rates.length) return '10%';
    return `₹50000`;   //previously it was calculating from lowest vehicle daily rate, calculates 10%,
  }, [fetchedVehicles]);

  const isMember = !!membership?.plan && (!membership.expiresAt || new Date(membership.expiresAt) > new Date());

  // The search box opens the rental-date calendar; its Search button then lists the vehicles free for those dates.
  const openDates = useCallback(() => {
    setBookingSource('home');
    router.push('/dates');
  }, [router, setBookingSource]);

  const openDestination = useCallback((q?: string) => {
    setBookingSource('home');
    router.push({ pathname: '/dropoff', params: q ? { q, returnBack: 'false' } : { returnBack: 'false' } });
  }, [router, setBookingSource]);

  const handleDestinationPress = useCallback((title: string) => {
    setBookingSource('home');
    import('@/services/api/activity').then(({ ActivityAPI }) => ActivityAPI.logActivity('view_destination', 'HomeScreen', { destination: title }));

    const loc = DESTINATION_LOCATIONS[title] || {
      id: title.toLowerCase(),
      name: `${title}, India`,
      address: 'Popular Destination',
      latitude: 26.1445,
      longitude: 91.7362,
      source: 'database' as const,
    };
    setDropoff(loc);

    // Ensure a real vehicle matching current vehicle type tab (Car / Bike) is selected
    const activeCar = (selectedCar && selectedCar.type === typeName && selectedCar !== cars[0] && selectedCar.id !== 'seltos')
      ? selectedCar
      : (picks.find((v) => v.type === typeName && v.isAvailable) || picks.find((v) => v.type === typeName) || fetchedVehicles.find((v) => v.type === typeName && v.isAvailable) || fetchedVehicles.find((v) => v.type === typeName) || fetchedVehicles[0]);

    if (activeCar) {
      selectCar(activeCar);
    }

    router.push({
      pathname: '/dates',
      params: { fromDestination: 'true', forSpecificCar: 'true' },
    });
  }, [setBookingSource, setDropoff, selectedCar, typeName, picks, fetchedVehicles, selectCar, router]);

  const sections = useMemo(() => [
    'top_hero',
    'search_card',
    'position3_promo',
    'searches',
    'recent',
    'exclusive_offers',
    'picks',
    'milestone',
    'middle_banner',
    'destinations',
    'member',
    'benefits',
    'rate_us',
    'bottom_banner',
    'connect',
    'footer',
  ], []);

  const renderSection = useCallback(({ item, index }: { item: string; index: number }) => {
    let content: React.ReactNode = null;
    switch (item) {
      case 'top_hero':
        return (
          <View onLayout={(event) => { heroSectionHeight.current = event.nativeEvent.layout.height; }}>
            {/* Pulling the page down (iOS bounce) shows more of the hero's purple instead of a white gap above it. */}
            <View pointerEvents="none" style={{ position: 'absolute', top: -1200, left: 0, right: 0, height: 1200, backgroundColor: HOME_PURPLE }} />
            <HomeHero
              topInset={insets.top}
              city={city}
              onCityPress={() => setShowCity(true)}
              sawariCash={isAuthenticated ? sawariCash : 0}
              onWallet={() => {}}
            >
              <ReferStrip earnText={referEarn} onPress={() => requireLogin(() => router.push('/refer'))} />
            </HomeHero>
          </View>
        );
      case 'search_card':
        return (
          <View style={[styles.sheet, { backgroundColor: p.page, borderColor: p.deliveryBorder }]}>
            <HomeSearchCard vehicleType={vehicleType} onType={setVehicleType} onDates={openDates} />
          </View>
        );
      case 'position3_promo':
        content = (
          <View style={{ marginTop: 8, marginBottom: 4 }}>
            <HomePromoBanner position="position3" />
          </View>
        );
        break;
      case 'exclusive_offers':
        content = <ExclusiveOffersSection />;
        break;
      case 'recent':
        if (!recent.length) break;
        content = (
          <>
            <HomeSectionTitle title="Recently Viewed" />
            <FlatList
              data={recent}
              horizontal
              keyExtractor={(v) => `recent-${v.id}`}
              renderItem={({ item: v }) => <TopPickCard car={v} onPress={() => openPick(v)} />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.row, { gap: 8 }]}
              snapToInterval={254}
              decelerationRate="fast"
              removeClippedSubviews={false}
            />
          </>
        );
        break;
      case 'picks':
        if (!picks.length && vehiclesLoading) {
          // The My Trips placeholder, returned without the fade-in so it is on screen from the first frame.
          return (
            <>
              <HomeSectionTitle title="Top Picks" />
              <View style={{ paddingHorizontal: 16 }}>
                <BookingSkeleton index={0} />
                <BookingSkeleton index={1} />
              </View>
            </>
          );
        }
        if (!picks.length) break;
        content = (
          <>
            <HomeSectionTitle title="Top Picks" />
            <FlatList
              data={picks}
              horizontal
              keyExtractor={(v) => `pick-${v.id}`}
              // The real day rate (vehicle pricePerDay), not a member price: no membership passed to the card.
              renderItem={({ item: v }) => <TopPickCard car={v} onPress={() => openPick(v)} />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.row, { gap: 8 }]}
              snapToInterval={254}
              decelerationRate="fast"
              removeClippedSubviews={false}
            />
          </>
        );
        break;
      case 'searches':
        if (!tripSearches.length) break;
        content = (
          <>
            <HomeSectionTitle title="Recent Searches" />
            <FlatList
              data={tripSearches}
              horizontal
              keyExtractor={(t) => `trip-${t.id}`}
              renderItem={({ item: t }) => <TripSearchCard search={t} onPress={() => openTripSearch(t)} onRemove={() => removeTripSearch(t.id)} />}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.row, { gap: 8 }]}
              snapToInterval={254}
              decelerationRate="fast"
              removeClippedSubviews={false}
            />
          </>
        );
        break;
      case 'milestone':
        if (!milestone) break;
        content = (
          <TripMilestoneCard
            rides={journey?.totalRides ?? 0}
            target={milestone.rides}
            reward={milestone.rewardAmount}
            claimable={!!claimable}
            claiming={false}
            onClaim={claim}
            onPress={() => requireLogin(() => router.push('/rewards'))}
          />
        );
        break;
      case 'middle_banner':
        content = <HomePromoBanner position="middle" />;
        break;
      case 'destinations':
        content = (
          <>
            <HomeSectionTitle title="Top Destinations" />
            <FlatList
              data={DESTINATIONS}
              horizontal
              keyExtractor={(d) => d.id}
              renderItem={({ item: d }) => (
                <DestinationTile image={d.image} faded={d.faded} title={d.title} blurb={d.blurb} onPress={() => handleDestinationPress(d.title)} />
              )}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.row, { gap: 8 }]}
              snapToInterval={224}
              decelerationRate="fast"
              removeClippedSubviews={false}
            />
          </>
        );
        break;
      case 'benefits':
        content = (
          <>
            <HomeSectionTitle title="More benefits with every journey" />
            <BenefitsGrid />
          </>
        );
        break;
      case 'member':
        content = <MemberBenefitsCard isMember={isMember} onPress={() => requireLogin(() => router.push('/membership'))} />;
        break;
      case 'rate_us':
        content = <RateUsCard />;
        break;
      case 'bottom_banner':
        content = <HomePromoBanner position="bottom" />;
        break;
      case 'connect':
        content = <ConnectCard />;
        break;
      case 'footer':
        // Full-width art, outside Reveal so it never fades in late at the very end of the page.
        return <CraftedFooter dark={isDarkMode} />;
    }
    if (!content) return null;
    return <Reveal delay={Math.min(index, 6) * 40}>{content}</Reveal>;
  }, [p, isDarkMode, insets.top, isAuthenticated, sawariCash, unreadCount, router, referEarn, requireLogin, vehicleType, setVehicleType, openDates, openDestination, handleDestinationPress, picks, recent, tripSearches, openTripSearch, removeTripSearch, openPick, vehiclesLoading, milestone, journey, claimable, claim, isMember, membership]);

  return (
    <View style={styles.screen}>
      <Page bottomNav scroll={false}>
        <FlatList
        data={sections}
        keyExtractor={(k) => k}
        renderItem={renderSection}
        onScroll={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          if (!heroSectionHeight.current) return;
          const threshold = Math.max(0, heroSectionHeight.current - insets.top - 140);
          const pastHero = event.nativeEvent.contentOffset.y >= threshold;
          setIsPastHero((current) => current === pastHero ? current : pastHero);
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: p.page }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        removeClippedSubviews={false}
        initialNumToRender={4}
        refreshControl={
          <RefreshControl
            refreshing={manualRefreshing}
            onRefresh={async () => {
              setManualRefreshing(true);
              try {
                await Promise.all([refetchVehicles(), ...(isAuthenticated ? [refetchJourney(), fetchWallet()] : [])]);
              } finally {
                setManualRefreshing(false);
              }
            }}
            tintColor="#FFFFFF"
          />
        }
      />

      {isPastHero && <View pointerEvents="none" style={[styles.statusBarSpacer, { height: insets.top, backgroundColor: p.page }]} />}

      <RewardScratchModal card={scratch} onClose={() => setScratch(null)} />
      <CitySheet visible={showCity} value={city} onSelect={setCity} onClose={() => setShowCity(false)} />

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

      </Page>
    </View>
  );
}

/** Home footer: just "Crafted in Guwahati" (the Assam artwork is hidden). */
function CraftedFooter({ dark }: { dark: boolean }) {
  return (
    <View style={styles.footer} accessibilityRole="text" accessibilityLabel="Crafted in Guwahati">
      <Text style={[styles.footerSmall, { color: dark ? '#7C879B' : '#A3A3A3' }]}>Crafted in</Text>
      <Text style={[styles.footerBig, { color: dark ? '#3A4760' : '#D4D7DE' }]} maxFontSizeMultiplier={1.1}>GUWAHATI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  statusBarSpacer: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
  footer: { width: '100%', alignItems: 'center', paddingHorizontal: 16, paddingTop: 32, paddingBottom: 24 },
  footerSmall: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, letterSpacing: 0.5 },
  footerBig: { fontFamily: 'Anton_400Regular', fontSize: 56, lineHeight: 66, letterSpacing: 2, marginTop: 2 },
  // The refer strip sits inside the banner (rays behind it); the white sheet's rounded top covers its foot.
  sheet: { marginTop: -32, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, paddingTop: 12 },
  row: { gap: 10, paddingHorizontal: 16 },
});