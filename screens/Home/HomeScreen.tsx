import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { FlatList, StyleSheet, Text, View, Animated, Pressable, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useRouter } from 'expo-router';
import Reanimated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { getAvailability, splitDateRange } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';
import {
  Header,
  NextTrip,
  Page,
  SearchCard,
  SectionHeading,
  OfferCard,
  CarListCard,
  Skeleton,
  HomeCarSkeleton,
  OfferCardSkeleton,
  DestinationCard,
  LoginBottomSheet,
  SpecialDealCard,
} from '@/components';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { offersQueryOptions } from '@/services/api/offers';
import { API } from '@/services/backend/api';
import { useVehicles } from '@/hooks/useVehicles';
import { bookingsQueryOptions, recentSearchesQueryOptions, recentlyViewedQueryOptions } from '@/hooks/useHomeData';
import { RecentSearch, isPastSearch, removeRecentSearch } from '@/utils/recentSearches';
import { useQueryClient } from '@tanstack/react-query';
import { Reveal } from '@/components/common/Reveal';
import { SocialLinks } from '@/components/common/SocialLinks';
import * as Location from 'expo-location';
import { rise } from '@/components/common/motion';

const DESTINATIONS = [
  { id: '1', title: 'Assam', subtitle: 'Northeast India', image: require('../../assets/images/kaziranga.jpg'), places: ['Kaziranga National Park', 'Kamakhya Temple', 'Majuli', 'Manas National Park', 'Sivasagar'] },
  { id: '2', title: 'Arunachal Pradesh', subtitle: 'Northeast India', image: require('../../assets/images/tawang.jpg'), places: ['Tawang Monastery', 'Sela Pass', 'Ziro Valley', 'Bum La Pass'] },
  { id: '3', title: 'Meghalaya', subtitle: 'Northeast India', image: require('../../assets/images/shillong.jpg'), places: ['Shillong', 'Cherrapunji (Sohra)', 'Dawki', 'Living Root Bridges', 'Mawsynram'] },
  { id: '4', title: 'Manipur', subtitle: 'Northeast India', image: require('../../assets/images/manipur.jpg'), places: ['Loktak Lake', 'Keibul Lamjao National Park', 'Kangla Fort'] },
  { id: '5', title: 'Mizoram', subtitle: 'Northeast India', image: require('../../assets/images/mizoram.jpg'), places: ['Aizawl', 'Reiek', 'Phawngpui National Park'] },
  { id: '6', title: 'Nagaland', subtitle: 'Northeast India', image: require('../../assets/images/nagaland.jpg'), places: ['Dzükou Valley', 'Kohima War Cemetery', 'Hornbill Festival', 'Khonoma'] },
  { id: '7', title: 'Tripura', subtitle: 'Northeast India', image: require('../../assets/images/tripura.jpg'), places: ['Ujjayanta Palace', 'Neermahal Palace', 'Unakoti'] },
  { id: '8', title: 'Sikkim', subtitle: 'Northeast India', image: require('../../assets/images/sikkim.jpg'), places: ['Gangtok', 'Tsomgo Lake', 'Nathula Pass', 'Yumthang Valley', 'Pelling'] },
];

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { mode, setMode, vehicleType, setVehicleType, customer, bookingConfirmed, selectedCar, selectCar, isAuthenticated, setBookingSource, dateRange, selectedDate, isAuthLoading, membership, fetchWallet, syncNotifications, setDropoff, setDates, setTimes } = useSawari();
  const [showLogin, setShowLogin] = useState(false);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const insets = useSafeAreaInsets();
  const mainScrollRef = useRef<FlatList<any>>(null);

  useFocusEffect(
    useCallback(() => {
      import('@/services/api/activity').then(({ ActivityAPI }) => {
        ActivityAPI.logActivity('view_screen', 'HomeScreen');
      });
    }, [])
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const { data: fetchedVehicles = [], isLoading: isLoadingVehicles, isError: vehiclesFailed, refetch: refetchVehicles } = useVehicles();
  const queryClient = useQueryClient();

  // Recent trip searches: one tap fills destination + dates again. Loaded before Home appears.
  const recentKey = isAuthenticated ? customer?.id : null;
  const { data: recentSearches = [] } = useQuery(recentSearchesQueryOptions(recentKey));
  useFocusEffect(useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['recentSearches', recentKey || 'guest'] });
  }, [queryClient, recentKey]));

  // Recently viewed cars / bikes: ids saved on the phone, shown with live price + availability from the server.
  const { data: viewedIds = [] } = useQuery(recentlyViewedQueryOptions(recentKey));
  useFocusEffect(useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['recentlyViewed', recentKey || 'guest'] });
  }, [queryClient, recentKey]));
  const recentlyViewedAll = useMemo(() => {
    const [startStr, endStr] = dateRange === 'Select Dates' ? [undefined, undefined] : splitDateRange(dateRange);
    return viewedIds
      .map((item: any) => {
        const v = fetchedVehicles.find((v) => String(v.id) === item.vehicleId);
        return v ? { ...v, viewedContext: item } : null;
      })
      .filter(Boolean)
      .map((v: any) => { const availability = getAvailability(v, startStr, endStr); return { ...v, availability, isAvailable: availability.available }; })
      .slice(0, 10);
  }, [viewedIds, fetchedVehicles, dateRange]);
  const recentlyViewedCarsList = useMemo(() => recentlyViewedAll.filter((v: any) => v.type === 'Car'), [recentlyViewedAll]);
  const recentlyViewedBikesList = useMemo(() => recentlyViewedAll.filter((v: any) => v.type === 'Bike'), [recentlyViewedAll]);

  /** Runs `go` now when signed in, or after logging in (search results need an account). */
  const requireLogin = useCallback((go: () => void) => {
    if (isAuthenticated) go();
    else { setPendingAction(() => go); setShowLogin(true); }
  }, [isAuthenticated]);

  const openRecentSearch = useCallback((s: RecentSearch) => {
    Haptics.selectionAsync();
    setBookingSource('home');
    setVehicleType(s.vehicleType);
    setDropoff(s.dropoff);
    import('@/services/api/activity').then(({ ActivityAPI }) => ActivityAPI.logActivity('reuse_recent_search', 'HomeScreen', { destination: s.dropoff.name, dateRange: s.dateRange }));
    if (isPastSearch(s)) {
      // Those dates have gone by: keep the destination, pick new dates (then on to the results).
      router.push({ pathname: '/dates', params: { returnBack: 'false', fresh: 'true' } });
      return;
    }
    setDates(s.dateRange, s.duration);
    setTimes(s.pickupTime, s.returnTime);
    requireLogin(() => router.push('/search'));
  }, [router, setBookingSource, setVehicleType, setDropoff, setDates, setTimes, requireLogin]);

  const forgetRecentSearch = useCallback(async (s: RecentSearch) => {
    Haptics.selectionAsync();
    queryClient.setQueryData(['recentSearches', recentKey || 'guest'], await removeRecentSearch(recentKey, s.id));
  }, [queryClient, recentKey]);

  const renderOffer = useCallback(({ item }: any) => (
    <OfferCard 
      offer={item} 
      onPress={() => {
        import('@/services/api/activity').then(({ ActivityAPI }) => {
          ActivityAPI.logActivity('view_offer', 'HomeScreen', { offerCode: item.code, offerTitle: item.title });
        });
      }} 
    />
  ), []);

  const renderSpecialDeal = useCallback(({ item }: any) => {
    return (
      <SpecialDealCard 
        deal={item} 
        onPress={() => {
          import('@/services/api/activity').then(({ ActivityAPI }) => {
            ActivityAPI.logActivity('view_special_deal', 'HomeScreen', { dealTitle: item.title, vehicleId: item.vehicleId });
          });
          if (item.vehicleId) {
            const car = fetchedVehicles.find(v => v.id === item.vehicleId);
            if (car) {
              selectCar(car);
              setBookingSource('home');
              router.push('/car-details');
            } else {
              // Fallback to explore if the car isn't currently loaded
              router.push('/explore');
            }
          }
        }}
      />
    );
  }, [fetchedVehicles, selectCar, setBookingSource, router]);
  
  const renderLuxury = useCallback(({ item }: any) => (
    <CarListCard car={item} style={{ width: 280, marginHorizontal: 8, marginBottom: 0 }} />
  ), []);

  /** Tapping a recently viewed vehicle reopens its detail page with full context. */
  const renderRecentlyViewed = useCallback(({ item }: any) => (
    <CarListCard
      car={item}
      style={{ width: 280, marginHorizontal: 8, marginBottom: 0 }}
      onPressOverride={() => {
        selectCar(item);
        setVehicleType(item.type === 'Bike' ? 'bike' : 'car');
        if (item.viewedContext) {
          const ctx = item.viewedContext;
          if (ctx.dropoff) setDropoff(ctx.dropoff);
          if (ctx.dateRange && ctx.duration) setDates(ctx.dateRange, ctx.duration);
          if (ctx.pickupTime && ctx.returnTime) setTimes(ctx.pickupTime, ctx.returnTime);
        }
        router.push('/car-details');
      }}
    />
  ), [selectCar, setVehicleType, setDropoff, setDates, setTimes, router]);
  
  const renderDest = useCallback(({ item }: any) => (
    <DestinationCard 
      image={item.image} 
      title={item.title} 
      subtitle={item.subtitle} 
      places={item.places} 
      onPress={() => {
        import('@/services/api/activity').then(({ ActivityAPI }) => {
          ActivityAPI.logActivity('view_destination', 'HomeScreen', { destination: item.title });
        });
        // Pick a place in that state, then straight on to the dates.
        setBookingSource('home');
        router.push({ pathname: '/dropoff', params: { q: item.title, returnBack: 'false' } });
      }}
    />
  ), [router, setBookingSource]);

  const { data: allOffers = [], isLoading: isLoadingOffers, isFetching: isFetchingOffers, refetch: refetchOffers } = useQuery(offersQueryOptions);

  // Split offers into coupons (for the offers carousel) and special deals (for the deals section)
  const offers = useMemo(() => allOffers.filter(o => o.type !== 'special_deal'), [allOffers]);
  const specialDeals = useMemo(() => allOffers.filter(o => o.type === 'special_deal'), [allOffers]);


  // Pull-to-refresh has its own state, deliberately not react-query's `isFetching`: `isFetching` is
  // also true for the silent focus refetch below and the 60s background poll, and binding the spinner
  // to it made the native refresh indicator pop up on its own every time the tab regained focus or the
  // interval fired — a "continuous loading" look with no pull gesture behind it. This only turns on for
  // an explicit pull.
  const [manualRefreshing, setManualRefreshing] = useState(false);

  const { data: bookings = [], refetch: refetchBookings } = useQuery({
    ...bookingsQueryOptions,
    enabled: !!(isAuthenticated && !isAuthLoading),
  });

  const upcomingBooking = useMemo(() => {
    // 1. Show ongoing trips first
    const ongoing = bookings.filter(b => b.status === 'ONGOING').sort((a, b) => {
      return new Date(b.pickupDate).getTime() - new Date(a.pickupDate).getTime();
    });
    if (ongoing.length > 0) return ongoing[0];

    // 2. Fallback to confirmed/pending trips
    const upcoming = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING').sort((a, b) => {
      return new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime();
    });
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [bookings]);

  const upcomingCar = useMemo(() => {
    if (!upcomingBooking || fetchedVehicles.length === 0) return null;
    // Try to match by MongoDB _id first
    const byId = fetchedVehicles.find(v => v.id === upcomingBooking.vehicleId);
    if (byId) return byId;
    // Fallback: match by vehicle name (case-insensitive) in case ID formats differ
    const byName = upcomingBooking.vehicleName
      ? fetchedVehicles.find(v =>
          v.name?.toLowerCase() === upcomingBooking.vehicleName?.toLowerCase()
        )
      : null;
    return byName || null;
  }, [upcomingBooking, fetchedVehicles]);

  useFocusEffect(
    useCallback(() => {
      setBookingSource('home');
      if (!isAuthLoading) {
        syncNotifications(); // Now safe for unauthenticated users too
        if (isAuthenticated) {
          refetchBookings();
          // Picks up a just-activated membership (or SawariCash change) when coming back to Home.
          fetchWallet();
        }
      }
    }, [isAuthLoading, isAuthenticated, refetchBookings, setBookingSource, fetchWallet, syncNotifications])
  );

  // People's Choice: show curated favourites (even if unavailable) plus available
  // vehicles to fill up to 6 slots. Tiles already display availability status.
  const processVehicles = (vehicles: any[], type: string, favourites: string[]) => {
    const [startStr, endStr] = dateRange === 'Select Dates' ? [undefined, undefined] : splitDateRange(dateRange);
    const typed = vehicles
      .filter(v => v && v.name && v.type === type)
      .map(v => {
        const availability = getAvailability(v, startStr, endStr);
        return { ...v, availability, isAvailable: availability.available };
      });

    const isFavourite = (v: any) => favourites.some(name => v.name.toLowerCase().includes(name));
    
    // Favourites always show up (even if unavailable, they will show 'On a trip')
    const favs = typed.filter(isFavourite);
    // Fill remaining slots with other vehicles that ARE available
    const others = typed.filter(v => !isFavourite(v) && v.isAvailable);

    // Sort favourites by the curated order
    const rank = (v: any) => {
      const i = favourites.findIndex(name => v.name.toLowerCase().includes(name));
      return i === -1 ? favourites.length : i;
    };
    favs.sort((a, b) => rank(a) - rank(b));
    
    // Fill remaining slots with other available vehicles
    const combined = [...favs, ...others];

    // Deduplicate by id
    const seen = new Set<string>();
    const unique = combined.filter(v => { if (seen.has(v.id)) return false; seen.add(v.id); return true; });
    return unique.slice(0, 6);
  };

  const peopleChoiceCars = useMemo(() => ['curvv', 'venue', 'brezza', 'innova', 'creta'], []);
  const displayCars = useMemo(
    () => processVehicles(fetchedVehicles, 'Car', peopleChoiceCars),
    [fetchedVehicles, peopleChoiceCars, dateRange]
  );

  const peopleChoiceBikes = useMemo(() => ['xpulse', 'xpluse', 'ntorq', 'hunter', 'jawa'], []);
  const displayBikes = useMemo(
    () => processVehicles(fetchedVehicles, 'Bike', peopleChoiceBikes),
    [fetchedVehicles, peopleChoiceBikes, dateRange]
  );

  // ── App Startup Permissions ──
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Permission to access location was denied');
        }
      } catch (e) {
        console.warn('Error requesting location permissions:', e);
      }
    })();
  }, []);


  // ── Vehicle image drive-in animation ──
  const vehicleSlideAnim = useRef(new Animated.Value(0)).current;
  const vehicleFadeAnim = useRef(new Animated.Value(1)).current;
  const [displayVehicle, setDisplayVehicle] = useState(vehicleType);

  useEffect(() => {
    if (displayVehicle !== vehicleType) {
      // Animate out (slide left and fade out)
      Animated.parallel([
        Animated.timing(vehicleFadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(vehicleSlideAnim, {
          toValue: -50,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Swap the vehicle type
        setDisplayVehicle(vehicleType);
        
        // Reset: start off-screen right
        vehicleSlideAnim.setValue(120);
        
        // Animate in (slide left and fade in)
        Animated.parallel([
          Animated.timing(vehicleFadeAnim, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(vehicleSlideAnim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }
  }, [vehicleType, displayVehicle, vehicleFadeAnim, vehicleSlideAnim]);

  // Order: plan a trip first (search + recent searches), then what is personal (current trip, membership
  // savings), then what can be booked now (deals, offers, vehicles), then growth (membership, sign-up /
  // refer) and inspiration (destinations).
  const sections = useMemo(() => [
    { type: 'header', key: 'header' },
    { type: 'recentSearches', key: 'recentSearches' },
    { type: 'recentlyViewedCars', key: 'recentlyViewedCars' },
    { type: 'recentlyViewedBikes', key: 'recentlyViewedBikes' },
    { type: 'nextTrip', key: 'nextTrip' },
    { type: 'membershipPromo', key: 'memberTop', placement: 'top' },
    { type: 'specialDeals', key: 'specialDeals' },
    { type: 'offers', key: 'offers' },
    { type: 'exploreVehicles', key: 'exploreVehicles' },
    { type: 'membershipPromo', key: 'memberBottom', placement: 'bottom' },
    { type: 'referEarn', key: 'referEarn' },
    { type: 'destinations', key: 'destinations' },
    { type: 'footer', key: 'footer' },
  ], []);

  const sectionKeyExtractor = useCallback((item: { key: string }) => item.key, []);

  const renderSection = useCallback(({ item, index }: any) => {
    let content = null;
    switch (item.type) {
      case 'header':
        content = (
          <>
            {/* The top bar scrolls away with the page (nothing on Home is pinned). */}
            <Header
              leading={
                <View>
                  <Text style={[styles.topGreeting, { color: colors.mutedForeground }]}>{greeting}</Text>
                  {isAuthenticated && customer?.name ? (
                    <Text numberOfLines={1} style={[styles.topName, { color: colors.foreground }]}>{customer.name.split(' ')[0]} 👋</Text>
                  ) : (
                    <Pressable accessibilityRole="button" onPress={() => { Haptics.selectionAsync(); setShowLogin(true); }}>
                      <Text numberOfLines={1} style={[styles.topName, { color: colors.foreground }]}>
                        Log in <Text style={{ color: colors.primaryText, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>· get ₹100 SawariCash</Text>
                      </Text>
                    </Pressable>
                  )}
                </View>
              }
            />
            <View style={{ position: 'relative', overflow: 'visible', zIndex: -1 }}>
              <View>
                <Text style={[styles.heading, { color: colors.foreground }]}>
                  Where are you{'\n'}going?
                </Text>
              </View>
              <Animated.Image 
                source={displayVehicle === 'car' ? require('../../assets/images/header_car_final.png') : require('../../assets/images/footer_bike.png')}
                style={{ 
                  position: 'absolute',
                  right: displayVehicle === 'car' ? -100 : -80,
                  bottom: displayVehicle === 'car' ? -15 : -10,
                  width: displayVehicle === 'car' ? 260 : 190, 
                  height: displayVehicle === 'car' ? 130 : 120,
                  opacity: vehicleFadeAnim,
                  transform: [
                    { translateX: vehicleSlideAnim },
                    ...(displayVehicle === 'bike' ? [
                      { scaleX: -1 },
                    ] : []),
                  ],
                }}
                resizeMode="contain"
              />
            </View>
            <SearchCard
              mode={mode}
              onModeChange={setMode}
              onSearch={() => {
                Haptics.selectionAsync();
                setBookingSource('home');
                if (isAuthenticated) {
                  router.push('/search');
                } else {
                  setPendingAction(() => () => router.push('/search'));
                  setShowLogin(true);
                }
              }}
            />
          </>
        );
        break;
      case 'recentSearches': {
        if (!recentSearches.length) break;
        content = (
          <>
            <SectionHeading title="Recent searches" kicker="PICK UP WHERE YOU LEFT OFF" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.recentRow}>
              {recentSearches.map((s) => {
                const past = isPastSearch(s);
                return (
                  <Pressable
                    key={s.id}
                    accessibilityRole="button"
                    accessibilityLabel={`Search ${s.dropoff.name}, ${past ? 'pick new dates' : s.dateRange}`}
                    onPress={() => openRecentSearch(s)}
                    style={({ pressed }) => [styles.recentCard, { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.8 }]}
                  >
                    <View style={[styles.recentIcon, { backgroundColor: colors.tintLight }]}>
                      <Feather name={s.vehicleType === 'bike' ? 'wind' : 'clock'} size={15} color={colors.primaryText} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text numberOfLines={1} style={[styles.recentTitle, { color: colors.foreground }]}>{s.dropoff.name}</Text>
                      <Text numberOfLines={1} style={[styles.recentSub, { color: past ? colors.primaryText : colors.mutedForeground }]}>
                        {past ? 'Dates passed · pick new dates' : `${s.dateRange} · ${s.vehicleType === 'bike' ? 'Bike' : 'Car'}`}
                      </Text>
                    </View>
                    <Pressable hitSlop={10} accessibilityLabel="Remove from recent searches" onPress={() => forgetRecentSearch(s)} style={{ padding: 2 }}>
                      <Feather name="x" size={14} color={colors.mutedForeground} />
                    </Pressable>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        );
        break;
      }
      case 'recentlyViewedCars':
        if (!recentlyViewedCarsList.length) break;
        content = (
          <>
            <SectionHeading title="Recently viewed cars" kicker="CARS YOU CHECKED OUT" />
            <FlatList
              data={recentlyViewedCarsList}
              keyExtractor={(item) => `viewed-car-${item.id}`}
              renderItem={renderRecentlyViewed}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 4 }}
              snapToInterval={296}
              snapToAlignment="start"
              decelerationRate="fast"
              removeClippedSubviews={false}
              initialNumToRender={2}
              maxToRenderPerBatch={2}
              windowSize={3}
            />
          </>
        );
        break;
      case 'recentlyViewedBikes':
        if (!recentlyViewedBikesList.length) break;
        content = (
          <>
            <SectionHeading title="Recently viewed bikes" kicker="BIKES YOU CHECKED OUT" />
            <FlatList
              data={recentlyViewedBikesList}
              keyExtractor={(item) => `viewed-bike-${item.id}`}
              renderItem={renderRecentlyViewed}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 8, paddingTop: 4 }}
              snapToInterval={296}
              snapToAlignment="start"
              decelerationRate="fast"
              removeClippedSubviews={false}
              initialNumToRender={2}
              maxToRenderPerBatch={2}
              windowSize={3}
            />
          </>
        );
        break;
      case 'referEarn':
        // Refer & Earn needs an account; a guest is shown the sign-up bonus instead.
        content = isAuthenticated
          ? <AnimatedReferBanner router={router} />
          : <SignupBonusBanner onPress={() => { Haptics.selectionAsync(); setShowLogin(true); }} />;
        break;
      case 'nextTrip': {
        if (!upcomingBooking) break;
        
        const tripPickupTime = upcomingBooking.pickupTime || '8:00 AM';
        const tripDropTime = upcomingBooking.dropTime || (upcomingBooking as any).returnTime || '8:00 AM';
        const tripDateRange = `${upcomingBooking.pickupDate} ${tripPickupTime} – ${upcomingBooking.returnDate} ${tripDropTime}`;
        const tripLabel = upcomingBooking.status === 'ONGOING' ? 'Your current trip' : 'Your next trip';
        
        content = (
          <View style={styles.sectionPad}>
            <NextTrip 
              car={upcomingCar || undefined}
              vehicleName={!upcomingCar ? upcomingBooking.vehicleName : undefined}
              dateRangeStr={tripDateRange} 
              label={tripLabel}
            />
          </View>
        );
        break;
      }
      case 'membershipPromo': {
        const mem = membership;
        const isMemActive = !!(mem?.plan && mem.expiresAt && new Date(mem.expiresAt) > new Date());
        // A member's savings are personal (shown near the top); the promo for everyone else sits lower.
        if ((item.placement === 'top') !== isMemActive) break;

        if (isMemActive && mem) {
          const planDisplay = mem.plan.toUpperCase();
          const cap = mem.plan === 'pro' ? 20000 : mem.plan === 'plus' ? 15000 : 10000;
          const saved = mem.totalSaved || 0;
          const progress = Math.min(100, (saved / cap) * 100);
          
          content = (
            <View style={[styles.sectionPad, { marginTop: 16, marginBottom: 8 }]}>
              <Pressable onPress={() => router.push('/membership')}>
                <LinearGradient
                  colors={['#111827', '#1F2937']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 16,
                    padding: 20,
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 5,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                        <Feather name="award" size={14} color={colors.primary} />
                        <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.primary, letterSpacing: 1.2 }}>MYSAWARI {planDisplay}</Text>
                      </View>
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFF' }}>
                        ₹{saved.toLocaleString('en-IN')} Saved
                      </Text>
                    </View>
                    <View style={{ backgroundColor: 'rgba(255, 215, 0, 0.1)', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255, 215, 0, 0.3)' }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#FBBF24' }}>View Progress</Text>
                    </View>
                  </View>
                  
                  <View style={{ height: 6, backgroundColor: '#374151', borderRadius: 3, overflow: 'hidden' }}>
                    <Animated.View style={{ height: '100%', width: `${progress}%`, backgroundColor: colors.primary, borderRadius: 3 }} />
                  </View>
                  <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#9CA3AF', marginTop: 8 }}>
                    You are {progress.toFixed(0)}% of the way to your ₹{cap.toLocaleString('en-IN')} limit!
                  </Text>
                </LinearGradient>
              </Pressable>
            </View>
          );
        } else {
          content = (
            <View style={[styles.sectionPad, { marginTop: 16, marginBottom: 8 }]}>
              <Pressable onPress={() => {
                // Guests would otherwise reach the paid-plan checkout and hit a confusing failure —
                // ask them to log in first, same as Search and Refer & Earn already do.
                if (isAuthenticated) router.push('/membership');
                else {
                  setPendingAction(() => () => router.push('/membership'));
                  setShowLogin(true);
                }
              }}>
                <LinearGradient
                  colors={['#111827', '#1F2937']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{
                    borderRadius: 16,
                    padding: 20,
                    flexDirection: 'row',
                    alignItems: 'center',
                    shadowColor: colors.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 12,
                    elevation: 5,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Feather name="award" size={14} color={colors.primary} />
                      <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 11, color: colors.primary, letterSpacing: 1.2 }}>MYSAWARI PLUS</Text>
                    </View>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFF', marginBottom: 4 }}>
                      Save up to ₹20,000
                    </Text>
                    <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 12, color: '#9CA3AF' }}>
                      Join the membership and get up to 12.5% off on every ride!
                    </Text>
                  </View>
                  <View style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 }}>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#000' }}>Join Now</Text>
                  </View>
                </LinearGradient>
              </Pressable>
            </View>
          );
        }
        break;
      }
      case 'specialDeals':
        // Only show the Special Deals section when there are active deals — completely hidden otherwise.
        if (!isLoadingOffers && specialDeals.length === 0) break;
        if (isLoadingOffers) break; // Don't show skeleton for deals, only show when data arrives
        content = (
          <>
            <SectionHeading title="Special Deals" kicker="LIMITED TIME" />
            <FlatList
              data={specialDeals}
              keyExtractor={(item, index) => item?._id || item?.id || String(index)}
              renderItem={renderSpecialDeal}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.offerRow}
              snapToInterval={304}
              snapToAlignment="start"
              decelerationRate="fast"
              removeClippedSubviews={false}
              initialNumToRender={2}
              maxToRenderPerBatch={3}
              windowSize={3}
            />
          </>
        );
        break;
      case 'offers':
        // Guards against every coupon expiring/being deactivated at once — showing the heading with
        // nothing under it would read as a broken section rather than an intentionally quiet one.
        if (!isLoadingOffers && offers.length === 0) break;
        content = (
          <>
            <SectionHeading title="Exclusive Offers" kicker="COUPONS & DISCOUNTS" />
            <FlatList
              data={isLoadingOffers ? [] : offers}
              keyExtractor={(item, index) => item?.id || String(index)}
              renderItem={renderOffer}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.offerRow}
              snapToInterval={304}
              snapToAlignment="start"
              decelerationRate="fast"
              removeClippedSubviews={false} // Android can render a clipped card blank (white) when scrolled back into view
              initialNumToRender={2}
              maxToRenderPerBatch={3}
              windowSize={3}
              ListEmptyComponent={
                isLoadingOffers ? (
                  <View style={{ flexDirection: 'row' }}>
                    {Array(3).fill(0).map((_, i) => (
                      <View key={i} style={{ marginRight: i < 2 ? 14 : 0 }}>
                        <OfferCardSkeleton delay={i * 100} />
                      </View>
                    ))}
                  </View>
                ) : null
              }
            />
          </>
        );
        break;
      case 'exploreVehicles':
        if (vehicleType === 'car') {
          content = (
            <>
              <SectionHeading title="People's Choice" kicker="TOP FOUR WHEELERS" action="View all" onAction={() => router.push('/explore')} />
              <FlatList
                data={isLoadingVehicles ? [] : displayCars}
                keyExtractor={(item, index) => item?.id || String(index)}
                renderItem={renderLuxury}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 8 }}
                snapToInterval={296}
                snapToAlignment="start"
                decelerationRate="fast"
                removeClippedSubviews={false} // Android can render a clipped card blank (white) when scrolled back into view
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={3}
                ListEmptyComponent={
                  isLoadingVehicles ? (
                    <View style={{ flexDirection: 'row' }}>
                      {Array(3).fill(0).map((_, i) => (
                        <View key={i} style={{ marginRight: i < 2 ? 16 : 0 }}>
                          <HomeCarSkeleton delay={i * 100} />
                        </View>
                      ))}
                    </View>
                  ) : vehiclesFailed && fetchedVehicles.length === 0 ? (
                    <Pressable onPress={() => refetchVehicles()} style={{ paddingVertical: 24 }}>
                      <Text style={[styles.emptyVehicles, { color: colors.mutedForeground, paddingVertical: 0 }]}>
                        Couldn't load vehicles. <Text style={{ color: colors.primaryText, fontFamily: 'Inter_600SemiBold' }}>Tap to retry</Text>
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={[styles.emptyVehicles, { color: colors.mutedForeground }]}>
                      {selectedDate === 'All Dates' ? 'None available right now.' : `None available on ${selectedDate}.`} Try another date.
                    </Text>
                  )
                }
              />
            </>
          );
        } else {
          content = (
            <>
              <SectionHeading title="People's Choice" kicker="TWO WHEELER THRILLS" action="View all" onAction={() => router.push('/explore')} />
              <FlatList
                data={isLoadingVehicles ? [] : displayBikes}
                keyExtractor={(item, index) => item?.id || String(index)}
                renderItem={renderLuxury}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 8 }}
                snapToInterval={296}
                snapToAlignment="start"
                decelerationRate="fast"
                removeClippedSubviews={false} // Android can render a clipped card blank (white) when scrolled back into view
                initialNumToRender={2}
                maxToRenderPerBatch={2}
                windowSize={3}
                ListEmptyComponent={
                  isLoadingVehicles ? (
                    <View style={{ flexDirection: 'row' }}>
                      {Array(3).fill(0).map((_, i) => (
                        <View key={i} style={{ marginRight: i < 2 ? 16 : 0 }}>
                          <HomeCarSkeleton delay={i * 100} />
                        </View>
                      ))}
                    </View>
                  ) : vehiclesFailed && fetchedVehicles.length === 0 ? (
                    <Pressable onPress={() => refetchVehicles()} style={{ paddingVertical: 24 }}>
                      <Text style={[styles.emptyVehicles, { color: colors.mutedForeground, paddingVertical: 0 }]}>
                        Couldn't load vehicles. <Text style={{ color: colors.primaryText, fontFamily: 'Inter_600SemiBold' }}>Tap to retry</Text>
                      </Text>
                    </Pressable>
                  ) : (
                    <Text style={[styles.emptyVehicles, { color: colors.mutedForeground }]}>
                      {selectedDate === 'All Dates' ? 'None available right now.' : `None available on ${selectedDate}.`} Try another date.
                    </Text>
                  )
                }
              />
            </>
          );
        }
        break;
      case 'destinations':
        content = (
          <>
            <SectionHeading title="Explore Northeast" kicker="TOP DESTINATIONS" />
            <FlatList
              data={DESTINATIONS}
              keyExtractor={(item) => item.id}
              renderItem={renderDest}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.destRow}
              snapToInterval={296}
              snapToAlignment="start"
              decelerationRate="fast"
              removeClippedSubviews={false} // Android can render a clipped card blank (white) when scrolled back into view
              initialNumToRender={2}
              maxToRenderPerBatch={3}
              windowSize={3}
            />
          </>
        );
        break;
      case 'footer':
        content = (
          <View style={[styles.footer, { position: 'relative', overflow: 'hidden', width: '100%' }]}>
            <View style={[styles.footerDivider, { backgroundColor: colors.border }]} />
            
            <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 10, width: '100%' }}>
              <Text style={[styles.footerHashtag, { color: colors.foreground, zIndex: 10 }]}>#MySawari</Text>
            </View>

            <Text style={[styles.footerTagline, { color: colors.mutedForeground }]}>Your ride, your way.</Text>
            <SocialLinks />
            <View style={styles.footerMadeIn}>
              <Feather name="map-pin" size={12} color={colors.primaryText} />
              <Text style={[styles.footerLocation, { color: colors.mutedForeground }]}>Developed in Guwahati, Assam</Text>
            </View>
            <Text style={[styles.footerCopy, { color: colors.mutedForeground }]}>© {new Date().getFullYear()} MySawari. All rights reserved.</Text>
          </View>
        );
        break;
    }
    
    if (!content) return null;
    // The header is shown instantly so the screen doesn't start completely blank (which looks like a white flash).
    if (item.type === 'header') return content;
    
    // Each section eases in a beat after the one above it, so the page builds top to bottom.
    return <Reveal delay={Math.min(Math.max(0, index - 1), 6) * 40}>{content}</Reveal>;
  }, [colors, greeting, customer?.name, isAuthenticated, recentSearches, openRecentSearch, forgetRecentSearch, recentlyViewedCarsList, recentlyViewedBikesList, mode, setMode, bookingConfirmed, selectedCar, isLoadingOffers, offers, specialDeals, renderOffer, renderSpecialDeal, renderLuxury, renderRecentlyViewed, renderDest, router, vehicleType, displayVehicle, vehicleSlideAnim, vehicleFadeAnim, displayCars, displayBikes, isLoadingVehicles, vehiclesFailed, refetchVehicles, upcomingBooking, upcomingCar, membership]);

  return (
    <Page bottomNav scroll={false}>

      <FlatList
        ref={mainScrollRef}
        data={sections}
        keyExtractor={sectionKeyExtractor}
        renderItem={renderSection}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        removeClippedSubviews={false}
        initialNumToRender={4}
        maxToRenderPerBatch={3}
        windowSize={7}
        updateCellsBatchingPeriod={100}
        refreshControl={
          <RefreshControl
            refreshing={manualRefreshing}
            onRefresh={async () => {
              setManualRefreshing(true);
              try {
                const promises: Promise<any>[] = [refetchOffers(), refetchVehicles()];
                if (isAuthenticated) promises.push(refetchBookings());
                await Promise.all(promises);
              } finally {
                setManualRefreshing(false);
              }
            }}
            tintColor={colors.primary}
          />
        }
      />



      <LoginBottomSheet 
        visible={showLogin} 
        onClose={() => setShowLogin(false)} 
        onLoginSuccess={() => {
          if (pendingAction) {
            pendingAction();
            setPendingAction(null);
          }
        }} 
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  greeting: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 8, paddingHorizontal: 20 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.8, lineHeight: 32, marginTop: 12, paddingHorizontal: 20 },
  topGreeting: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  topName: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: -0.3, marginTop: 1 },
  recentRow: { gap: 10, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  recentCard: { width: 236, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12 },
  recentIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  recentTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  recentSub: { fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 2 },
  sectionPad: { paddingHorizontal: 16 },
  emptyVehicles: { fontFamily: 'Inter_500Medium', fontSize: 13, paddingVertical: 24 },
  offerRow: { gap: 14, paddingBottom: 6, paddingTop: 12, paddingHorizontal: 20 },
  luxuryRow: { gap: 16, paddingBottom: 24, paddingTop: 10, paddingHorizontal: 20 },
  destRow: { paddingBottom: 32, paddingTop: 10, paddingHorizontal: 20 },

  footer: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20, marginBottom: 10 },
  footerDivider: { width: 60, height: 3, borderRadius: 2, marginBottom: 20 },
  footerHashtag: { fontFamily: 'Inter_700Bold', fontSize: 28, letterSpacing: -0.5 },
  footerTagline: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 6, fontStyle: 'italic' },
  footerMadeIn: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16 },
  footerLocation: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  footerCopy: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 10 },
});

/* ─── Marketing Components ─── */

function AnimatedReferBanner({ router }: { router: any }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <Pressable onPress={() => { Haptics.selectionAsync(); router.push('/refer'); }}>
      <Animated.View style={{ transform: [{ scale: pulseAnim }], marginHorizontal: 20, marginTop: 12, marginBottom: 8, borderRadius: 20, shadowColor: '#FFD700', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 }}>
        <LinearGradient
          colors={['#1F1C18', '#8E6E2D', '#D4AF37']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 1.5, overflow: 'hidden' }}
        >
          <View style={{ backgroundColor: '#111827', borderRadius: 18, padding: 20, flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flex: 1, zIndex: 10 }}>
              <View style={{ backgroundColor: 'rgba(212, 175, 55, 0.15)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.3)' }}>
                <Text style={{ color: '#FFD700', fontFamily: 'Inter_700Bold', fontSize: 10, letterSpacing: 1 }}>LIFETIME REWARDS</Text>
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', color: '#FFF', fontSize: 18, marginBottom: 6 }}>Unlock 10% Commission</Text>
              <Text style={{ fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 }}>Invite friends. They get ₹100 SawariCash, you earn 10% of their first trip.</Text>
            </View>
            <View style={{ width: 72, height: 72, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(212, 175, 55, 0.1)', borderRadius: 36, marginLeft: 12, borderWidth: 1, borderColor: 'rgba(212, 175, 55, 0.2)' }}>
              <Feather name="gift" size={32} color="#FFD700" />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
}


function SignupBonusBanner({ onPress }: { onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Sign up and get 100 SawariCash" onPress={onPress}
      style={({ pressed }) => [{ marginHorizontal: 20, marginTop: 12, marginBottom: 8 }, pressed && { opacity: 0.9 }]}>
      <LinearGradient colors={['#111827', '#1F2937']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={{ borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.primary, fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 1.2, marginBottom: 6 }}>NEW HERE?</Text>
          <Text style={{ fontFamily: 'Inter_700Bold', color: '#FFF', fontSize: 18, marginBottom: 6 }}>Get ₹100 SawariCash</Text>
          <Text style={{ fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 }}>Sign up in 30 seconds with your mobile number and use it on your first ride.</Text>
        </View>
        <View style={{ backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, marginLeft: 12 }}>
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 13, color: '#000' }}>Sign up</Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
