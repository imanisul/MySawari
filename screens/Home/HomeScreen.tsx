import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, View, RefreshControl, ImageSourcePropType } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getAvailability, splitDateRange, parseDayLabel, Car, byAvailability, cars, LocationResult } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';
import { Page, LoginBottomSheet } from '@/components';
import { PhoneNumberSheet } from '@/components/auth/PhoneNumberSheet';
import { onSplashGone } from '@/components/common/AnimatedSplash';
import { API } from '@/services/backend/api';
import { useVehicles } from '@/hooks/useVehicles';
import { recentlyViewedQueryOptions } from '@/hooks/useHomeData';
import { Reveal } from '@/components/common/Reveal';
import { CustomAlert } from '@/components/common/CustomAlert';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import {
  HomeHero, ReferStrip, HomeSearchCard, HomeSectionTitle, TopPickCard, TripMilestoneCard,
  DestinationTile, BenefitsGrid, MemberBenefitsCard, ConnectCard,
} from '@/components/home/HomeSections';

const DESTINATIONS: { id: string; title: string; blurb: string; image: ImageSourcePropType; faded?: boolean }[] = [
  { id: 'shillong', title: 'Shillong', blurb: 'Pine-covered hills, cafe culture, and Scotland of the East vibes.', image: require('../../assets/images/shillong.jpg') },
  { id: 'tawang', title: 'Tawang', blurb: 'High-altitude passes, majestic monastery, and snow peaks.', image: require('../../assets/images/tawang.jpg') },
  { id: 'cherrapunji', title: 'Cherrapunji', blurb: 'Living root bridges, roaring waterfalls, and misty cliffs.', image: require('../../assets/images/cherrapunji.jpg') },
  { id: 'umrangso', title: 'Umrangso', blurb: 'Serene Kapili Lake, scenic golf course, and misty rolling hills.', image: require('../../assets/images/umrangso.jpg') },
  { id: 'kaziranga', title: 'Kaziranga', blurb: 'Wild safaris, the one-horned rhino, and lush tea estates.', image: require('../../assets/images/kaziranga.jpg') },
  { id: 'meghalaya', title: 'Meghalaya', blurb: 'Discover scenic drives, waterfalls, rivers, and hidden villages.', image: require('../../assets/images/meghalaya.jpg') },
  { id: 'sikkim', title: 'Sikkim', blurb: 'Mountain escapes, peaceful monasteries, and Himalayan views.', image: require('../../assets/images/sikkim.jpg') },
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
const FIRST_MILESTONE = { rides: 4, rewardAmount: 50 };

// Curated favourites shown as top picks after the vehicles the customer looked at.
const PICKS = { Car: ['curvv', 'venue', 'brezza', 'innova', 'creta'], Bike: ['xpulse', 'xpluse', 'ntorq', 'hunter', 'jawa'] };

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
  const [showPhoneSheet, setShowPhoneSheet] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const [manualRefreshing, setManualRefreshing] = useState(false);
  const [claiming, setClaiming] = useState(false);

  /** Runs `go` now when signed in, or after logging in. */
  const requireLogin = useCallback((go: () => void) => {
    if (isAuthenticated) go();
    else { setPendingAction(() => go); setShowLogin(true); }
  }, [isAuthenticated]);

  // The banner is purple: light status bar text while Home is on screen.
  useFocusEffect(useCallback(() => {
    setStatusBarStyle('light');
    import('@/services/api/activity').then(({ ActivityAPI }) => ActivityAPI.logActivity('view_screen', 'HomeScreen'));
    return () => setStatusBarStyle(isDarkMode ? 'light' : 'dark');
  }, [isDarkMode]));

  useFocusEffect(useCallback(() => {
    setBookingSource('home');
    if (!isAuthLoading) {
      syncNotifications();
      // Picks up a just-activated membership or SawariCash change when coming back to Home.
      if (isAuthenticated) fetchWallet();
    }
  }, [isAuthLoading, isAuthenticated, setBookingSource, fetchWallet, syncNotifications]));

  // No location-permission request here: the app asks once at start-up (SawariContext's GPS
  // auto-detect). Asking again from Home put a second system popup on screen at launch.

  // A guest gets the phone-number sheet rising over Home, once — never for someone already signed in.
  const phoneSheetShown = useRef(false);
  useEffect(() => {
    if (isAuthenticated) phoneSheetShown.current = false; // after sign-out the mandatory prompt returns
    if (isAuthLoading || phoneSheetShown.current || isAuthenticated) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    // Wait for the splash to actually clear. On a cold launch the data load outlasts any fixed
    // delay, so a sheet on a timer slides up hidden behind the overlay and is never seen opening.
    const off = onSplashGone(() => {
      if (phoneSheetShown.current) return;
      phoneSheetShown.current = true;
      timer = setTimeout(() => setShowPhoneSheet(true), 400);
    });
    // Only consume the one-shot once the sheet is truly on its way, so a re-run of this effect
    // during the wait re-subscribes instead of cancelling the sheet for the whole session.
    return () => { off(); clearTimeout(timer); };
  }, [isAuthLoading, isAuthenticated]);

  // No "Set Location" popup on opening the app: the customer picks a destination from the search card
  // ("Select your Destination") when they want to.

  const { data: fetchedVehicles = [], refetch: refetchVehicles } = useVehicles();

  // ── Top picks: vehicles the customer viewed (resume where they left), then curated favourites ──
  const recentKey = isAuthenticated ? customer?.id : null;
  const { data: viewedIds = [] } = useQuery(recentlyViewedQueryOptions(recentKey));
  useFocusEffect(useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['recentlyViewed', recentKey || 'guest'] });
  }, [queryClient, recentKey]));

  const typeName = vehicleType === 'bike' ? 'Bike' : 'Car';
  const picks = useMemo(() => {
    const [startStr, endStr] = dateRange === 'Select Dates' ? [undefined, undefined] : splitDateRange(dateRange);
    const withAvail = (v: any) => { const availability = getAvailability(v, startStr, endStr); return { ...v, availability, isAvailable: availability.available }; };

    const viewed = viewedIds
      .map((item: any) => {
        const v = fetchedVehicles.find((x) => String(x.id) === item.vehicleId);
        return v && v.type === typeName ? { ...withAvail(v), viewedContext: item } : null;
      })
      .filter(Boolean)
      .slice(0, 4) as any[];

    const fav = PICKS[typeName];
    const rank = (v: Car) => {
      const n = (v.displayName || v.name || '').toLowerCase();
      const i = fav.findIndex((word) => n.includes(word));
      return i === -1 ? fav.length + 10 : i;
    };
    const curated = fetchedVehicles
      .filter((v) => (v?.displayName || v?.name) && v.type === typeName && !viewed.some((w) => w.id === v.id))
      .map(withAvail)
      .sort((a, b) => {
        if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
        if (!a.isAvailable) {
          const da = a.availability?.nextAvailableFrom ? parseDayLabel(a.availability.nextAvailableFrom) ?? 999 : 999;
          const db = b.availability?.nextAvailableFrom ? parseDayLabel(b.availability.nextAvailableFrom) ?? 999 : 999;
          if (da !== db) return da - db;
        }
        return rank(a) - rank(b);
      });
    const seen = new Set<string>();
    // Free vehicles first (recently viewed before curated within each group), then by when they're free again.
    return byAvailability([...viewed, ...curated].filter((v) => (seen.has(v.id) ? false : (seen.add(v.id), true)))).slice(0, 8);
  }, [viewedIds, fetchedVehicles, dateRange, typeName]);

  const openPick = useCallback((item: any) => {
    selectCar(item);
    setBookingSource('home');
    const ctx = item.viewedContext;
    if (!ctx) { router.push('/car-details'); return; }
    // A recently viewed vehicle reopens with the trip it was viewed for.
    if (ctx.dropoff) setDropoff(ctx.dropoff);
    if (ctx.dateRange && ctx.duration) setDates(ctx.dateRange, ctx.duration);
    if (ctx.pickupTime && ctx.returnTime) setTimes(ctx.pickupTime, ctx.returnTime);
    if (ctx.trip) {
      if (ctx.trip.mode) setMode(ctx.trip.mode);
      setIsDeliveryRequested(!!ctx.trip.isDeliveryRequested);
      if (ctx.trip.deliveryMode) setDeliveryMode(ctx.trip.deliveryMode);
      setPickup(ctx.trip.pickup || null);
      setReturnAddress(ctx.trip.returnAddress || null);
    }
    const target = ctx.stage === 'payment' ? '/payment' : ctx.stage === 'booking' ? '/booking' : '/car-details';
    if (target === '/car-details') router.push('/car-details');
    else requireLogin(() => router.push(target as any));
  }, [selectCar, setBookingSource, router, requireLogin, setDropoff, setDates, setTimes, setMode, setIsDeliveryRequested, setDeliveryMode, setPickup, setReturnAddress]);

  // ── Trip milestone (ride journey from the server) ──
  const { data: journey, refetch: refetchJourney } = useQuery({
    queryKey: ['ride-journey'],
    queryFn: () => API.getRideJourney(),
    enabled: !!isAuthenticated,
    staleTime: 30_000,
  });
  const claimable = journey?.milestones.find((m) => m.unlocked && !m.claimed) ?? null;
  const next = journey?.milestones.find((m) => !m.unlocked) ?? null;
  const milestone = claimable ?? next ?? (journey ? null : { label: '', rides: FIRST_MILESTONE.rides, rewardAmount: FIRST_MILESTONE.rewardAmount });

  const claim = useCallback(async () => {
    if (!claimable || claiming) return;
    setClaiming(true);
    try {
      const res = await API.claimMilestoneReward(claimable.label);
      earnSawariCash(res?.reward.amount ?? claimable.rewardAmount);
      CustomAlert.alert('Congratulations! 🎊', `You have claimed ₹${res?.reward.amount ?? claimable.rewardAmount} SawariCash!`, [{ text: 'Awesome!' }]);
    } catch {
      CustomAlert.alert('Could not claim', 'Please try again in a moment.', [{ text: 'OK' }]);
    } finally {
      setClaiming(false);
      queryClient.invalidateQueries({ queryKey: ['ride-journey'] });
      fetchWallet();
    }
  }, [claimable, claiming, earnSawariCash, queryClient, fetchWallet]);

  // Refer & Earn: 10% of a friend's first booking — at least 10% of the lowest day rate in the fleet.
  const referEarn = useMemo(() => {
    const rates = fetchedVehicles.map((v) => v.perDay).filter((n) => n > 0);
    if (!rates.length) return '10%';
    return `₹${Math.floor((Math.min(...rates) * 0.1) / 10) * 10}+`;
  }, [fetchedVehicles]);

  const isMember = !!membership?.plan && (!membership.expiresAt || new Date(membership.expiresAt) > new Date());

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
      : (picks.find((v) => v.isAvailable) || picks[0] || fetchedVehicles.find((v) => v.type === typeName && v.isAvailable) || fetchedVehicles.find((v) => v.type === typeName) || fetchedVehicles[0]);

    if (activeCar) {
      selectCar(activeCar);
    }

    router.push({
      pathname: '/dates',
      params: { fromDestination: 'true', forSpecificCar: 'true' },
    });
  }, [setBookingSource, setDropoff, selectedCar, typeName, picks, fetchedVehicles, selectCar, router]);

  const sections = useMemo(() => ['header', 'picks', 'milestone', 'destinations', 'benefits', 'member', 'connect', 'footer'], []);

  const renderSection = useCallback(({ item, index }: { item: string; index: number }) => {
    let content: React.ReactNode = null;
    switch (item) {
      case 'header':
        return (
          <View>
            <HomeHero
              topInset={insets.top}
              city="Guwahati"
              sawariCash={isAuthenticated ? sawariCash : 0}
              onWallet={() => router.push('/rewards')}            >
              <ReferStrip earnText={referEarn} onPress={() => requireLogin(() => router.push('/refer'))} />
            </HomeHero>
            <View style={[styles.sheet, { backgroundColor: p.page, borderColor: p.deliveryBorder }]}>
              <HomeSearchCard vehicleType={vehicleType} onType={setVehicleType} onDestination={() => openDestination()} />
            </View>
          </View>
        );
      case 'picks':
        if (!picks.length) break;
        content = (
          <>
            {/* Someone who has looked at vehicles sees them first as "Recent Searches"; a new customer sees "Top Picks". */}
            <HomeSectionTitle title={picks.some((v) => v.viewedContext) ? 'Recent Searches' : 'Top Picks'} />
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
      case 'milestone':
        if (!milestone) break;
        content = (
          <TripMilestoneCard
            rides={journey?.totalRides ?? 0}
            target={milestone.rides}
            reward={milestone.rewardAmount}
            claimable={!!claimable}
            claiming={claiming}
            onClaim={claim}
            onPress={() => requireLogin(() => router.push('/rewards'))}
          />
        );
        break;
      case 'destinations':
        content = (
          <>
            <HomeSectionTitle title="Top Destination" />
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
      case 'connect':
        content = <ConnectCard />;
        break;
      case 'footer':
        // Full-width art, outside Reveal so it never fades in late at the very end of the page.
        return <CraftedFooter dark={isDarkMode} />;
    }
    if (!content) return null;
    return <Reveal delay={Math.min(index, 6) * 40}>{content}</Reveal>;
  }, [p, isDarkMode, insets.top, isAuthenticated, sawariCash, unreadCount, router, referEarn, requireLogin, vehicleType, setVehicleType, openDestination, handleDestinationPress, picks, openPick, milestone, journey, claimable, claiming, claim, isMember, membership]);

  return (
    <View style={styles.screen}>
      <Page bottomNav scroll={false}>
        <FlatList
        data={sections}
        keyExtractor={(k) => k}
        renderItem={renderSection}
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

      <PhoneNumberSheet
        visible={showPhoneSheet}
        onClose={() => setShowPhoneSheet(false)}
        // The sheet signs the customer in by itself now (phone → code → profile); nothing else to open.
      />

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

/**
 * Home footer: "Crafted in Guwahati" over an Assam scene (Brahmaputra, Saraighat bridge, a dhol player,
 * a country boat, a rhino and a MySawari car on the road). The art's sky is faded to white in the image itself,
 * and so is the foliage at the bottom, so both ends melt into the page; in dark mode it is shown as a soft ghost behind the title.
 */
const FOOTER_ART = require('../../assets/images/home_footer_assam.jpg');
const FOOTER_RATIO = 828 / 975;

function CraftedFooter({ dark }: { dark: boolean }) {
  return (
    <View style={styles.footer} accessibilityRole="text" accessibilityLabel="Crafted in Guwahati">
      <Image source={FOOTER_ART} resizeMode="cover" style={[styles.footerArt, dark && { opacity: 0.16 }]} accessibilityIgnoresInvertColors />
      <View style={styles.footerTitle} pointerEvents="none">
        <Text style={[styles.footerSmall, { color: dark ? '#7C879B' : '#A3A3A3' }]}>Crafted in</Text>
        <Text style={[styles.footerBig, { color: dark ? '#3A4760' : '#D4D7DE' }]} maxFontSizeMultiplier={1.1}>GUWAHATI</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  footer: { width: '100%', aspectRatio: FOOTER_RATIO, marginTop: 8 },
  footerArt: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  // Sits in the faded sky, centred, like the hero's "LOWEST PRICE GUARANTEED" lettering.
  footerTitle: { position: 'absolute', top: '16%', left: 16, right: 16, alignItems: 'center' },
  footerSmall: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, letterSpacing: 0.5 },
  footerBig: { fontFamily: 'Anton_400Regular', fontSize: 56, lineHeight: 66, letterSpacing: 2, marginTop: 2 },
  // The refer strip sits inside the banner (rays behind it); the white sheet's rounded top covers its foot.
  sheet: { marginTop: -32, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, paddingTop: 12 },
  row: { gap: 10, paddingHorizontal: 16 },
});