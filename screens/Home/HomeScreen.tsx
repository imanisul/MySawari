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
} from '@/components';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchOffers } from '@/services/api/offers';
import { API } from '@/services/backend/api';
import { useVehicles } from '@/hooks/useVehicles';
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
  const { mode, setMode, vehicleType, pickup, dropoff, customer, bookingConfirmed, selectedCar, isAuthenticated, setBookingSource, dateRange, selectedDate, isAuthLoading } = useSawari();
  const [showLogin, setShowLogin] = useState(false);
  const insets = useSafeAreaInsets();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const renderOffer = useCallback(({ item }: any) => (
    <OfferCard offer={item} />
  ), []);
  
  const renderLuxury = useCallback(({ item }: any) => (
    <CarListCard car={item} style={{ width: 280, marginHorizontal: 8, marginBottom: 0 }} />
  ), []);
  
  const renderDest = useCallback(({ item }: any) => (
    <DestinationCard image={item.image} title={item.title} subtitle={item.subtitle} places={item.places} />
  ), []);

  const { data: offers = [], isLoading: isLoadingOffers } = useQuery({
    queryKey: ['offers'],
    queryFn: fetchOffers,
    // There is no offers backend yet, so start from an empty list: no one-frame skeleton flash before
    // the (instant) empty result. Real offers, when they exist, still replace this on the first fetch.
    initialData: [] as Awaited<ReturnType<typeof fetchOffers>>,
    initialDataUpdatedAt: 0,
  });

  const { data: fetchedVehicles = [], isLoading: isLoadingVehicles } = useVehicles();

  const { data: bookings = [], refetch: refetchBookings, isFetching: isFetchingBookings } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      const userBookings = await API.getAllBookings();
      return userBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    enabled: !!(isAuthenticated && !isAuthLoading),
    staleTime: 15 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });

  const upcomingBooking = useMemo(() => {
    const upcoming = bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'PENDING').sort((a, b) => {
      return new Date(a.pickupDate).getTime() - new Date(b.pickupDate).getTime();
    });
    return upcoming.length > 0 ? upcoming[0] : null;
  }, [bookings]);

  const upcomingCar = useMemo(() => {
    if (!upcomingBooking || fetchedVehicles.length === 0) return null;
    return fetchedVehicles.find(v => v.id === upcomingBooking.vehicleId) || null;
  }, [upcomingBooking, fetchedVehicles]);

  useFocusEffect(
    useCallback(() => {
      setBookingSource('home');
      if (!isAuthLoading) {
        if (isAuthenticated) refetchBookings();
      }
    }, [isAuthLoading, isAuthenticated, refetchBookings, setBookingSource])
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
    const favs = typed.filter(isFavourite);

    // Sort favourites by the curated order
    const rank = (v: any) => {
      const i = favourites.findIndex(name => v.name.toLowerCase().includes(name));
      return i === -1 ? favourites.length : i;
    };
    favs.sort((a, b) => rank(a) - rank(b));

    // Deduplicate by id
    const seen = new Set<string>();
    const unique = favs.filter(v => { if (seen.has(v.id)) return false; seen.add(v.id); return true; });
    return unique.slice(0, 6);
  };

  const peopleChoiceCars = useMemo(() => ['curvv', 'venue', 'brezza', 'innova', 'creta'], []);
  const displayCars = useMemo(
    () => processVehicles(fetchedVehicles, 'Car', peopleChoiceCars),
    [fetchedVehicles, peopleChoiceCars, selectedDate]
  );

  const peopleChoiceBikes = useMemo(() => ['xpulse', 'xpluse', 'ntorq', 'hunter', 'jawa'], []);
  const displayBikes = useMemo(
    () => processVehicles(fetchedVehicles, 'Bike', peopleChoiceBikes),
    [fetchedVehicles, peopleChoiceBikes, selectedDate]
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

  const sections = useMemo(() => [
    { type: 'header', key: 'header' },
    { type: 'nextTrip', key: 'nextTrip' },
    { type: 'membershipPromo', key: 'membershipPromo' },
    { type: 'offers', key: 'offers' },
    { type: 'exploreVehicles', key: 'exploreVehicles' },
    { type: 'referEarn', key: 'referEarn' },
    { type: 'destinations', key: 'destinations' },
    { type: 'footer', key: 'footer' },
  ], []);

  const renderSection = useCallback(({ item, index }: any) => {
    let content = null;
    switch (item.type) {
      case 'header':
        content = (
          <>
            <Header />
            <View style={{ position: 'relative', overflow: 'visible', zIndex: -1 }}>
              <View>
                <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
                  {greeting}{isAuthenticated && customer?.name ? `, ${customer.name.split(' ')[0]}` : ''}
                </Text>
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
                  setShowLogin(true);
                }
              }}
            />
          </>
        );
        break;
      case 'referEarn':
        content = <AnimatedReferBanner router={router} />;
        break;
      case 'nextTrip':
        const carToDisplay = (bookingConfirmed && selectedCar) ? selectedCar : upcomingCar;
        if (!carToDisplay) break;
        
        let dateRangeStr = undefined;
        if (!bookingConfirmed && upcomingBooking) {
          const pTime = upcomingBooking.pickupTime || '8:00 AM';
          const rTime = upcomingBooking.dropTime || (upcomingBooking as any).returnTime || '8:00 AM';
          dateRangeStr = `${upcomingBooking.pickupDate} ${pTime} – ${upcomingBooking.returnDate} ${rTime}`;
        }
        
        content = (
          <View style={styles.sectionPad}>
            <NextTrip car={carToDisplay} dateRangeStr={dateRangeStr} />
          </View>
        );
        break;
      case 'membershipPromo': {
        const mem = customer?.membership || {};
        const isMemActive = mem.plan && mem.expiresAt && new Date(mem.expiresAt) > new Date();
        
        if (isMemActive) {
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
                      <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: colors.primary }}>View Progress</Text>
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
              <Pressable onPress={() => router.push('/membership')}>
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
      case 'offers':
        content = (
          <>
            <SectionHeading title="Special Deals" kicker="EXCLUSIVE SPECIALS" />
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
              removeClippedSubviews
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
                removeClippedSubviews
                initialNumToRender={3}
                maxToRenderPerBatch={3}
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
                removeClippedSubviews
                initialNumToRender={3}
                maxToRenderPerBatch={3}
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
              removeClippedSubviews
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
    // Each section eases in a beat after the one above it, so the page builds top to bottom.
    return <Reveal delay={Math.min(index, 6) * 40}>{content}</Reveal>;
  }, [colors, greeting, customer?.name, isAuthenticated, pickup, dropoff, mode, setMode, bookingConfirmed, selectedCar, isLoadingOffers, offers, renderOffer, renderLuxury, renderDest, router, vehicleType, displayVehicle, vehicleSlideAnim, vehicleFadeAnim, displayCars, displayBikes, isLoadingVehicles, upcomingBooking, upcomingCar]);

  return (
    <Page bottomNav scroll={false}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={renderSection}
        extraData={{ vehicleType, displayVehicle }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        removeClippedSubviews={false} // don't clip vertical sections
        refreshControl={
          <RefreshControl
            refreshing={isFetchingBookings}
            onRefresh={() => {
              if (isAuthenticated) refetchBookings();
            }}
            tintColor={colors.primary}
          />
        }
      />



      <LoginBottomSheet visible={showLogin} onClose={() => setShowLogin(false)} />
    </Page>
  );
}

const styles = StyleSheet.create({
  greeting: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 22, paddingHorizontal: 20 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.8, lineHeight: 32, marginTop: 6, paddingHorizontal: 20 },
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
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.02, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true })
      ])
    ).start();
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
              <Text style={{ fontFamily: 'Inter_400Regular', color: 'rgba(255,255,255,0.7)', fontSize: 13, lineHeight: 18 }}>Invite friends. They get 100 SawariCash, you earn on every ride.</Text>
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

