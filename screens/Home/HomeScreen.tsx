import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { FlatList, StyleSheet, Text, View, Animated, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { premiumCollection } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';
import {
  Header,
  NextTrip,
  Page,
  SearchCard,
  SectionHeading,
  OfferCard,
  LuxuryCarTile,
  Skeleton,
  DestinationCard,
  LoginBottomSheet,
} from '@/components';
import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { fetchOffers } from '@/services/api/offers';
import * as Location from 'expo-location';

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
  const { mode, setMode, vehicleType, pickup, dropoff, customer, bookingConfirmed, selectedCar, isAuthenticated } = useSawari();
  const [showLogin, setShowLogin] = useState(false);
  const insets = useSafeAreaInsets();

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }, []);

  const renderOffer = useCallback(({ item }: any) => <OfferCard offer={item} />, []);
  const renderLuxury = useCallback(({ item }: any) => <LuxuryCarTile car={item} />, []);
  const renderDest = useCallback(({ item }: any) => (
    <DestinationCard image={item.image} title={item.title} subtitle={item.subtitle} places={item.places} />
  ), []);

  const { data: offers = [], isLoading: isLoadingOffers } = useQuery({
    queryKey: ['offers'],
    queryFn: fetchOffers,
  });

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
    { type: 'offers', key: 'offers' },
    { type: 'exploreVehicles', key: 'exploreVehicles' },
    { type: 'referEarn', key: 'referEarn' },
    { type: 'destinations', key: 'destinations' },
    { type: 'footer', key: 'footer' },
  ], []);

  const renderSection = useCallback(({ item }: any) => {
    switch (item.type) {
      case 'header':
        return (
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
                if (isAuthenticated) {
                  router.push('/search');
                } else {
                  setShowLogin(true);
                }
              }}
            />
          </>
        );
      case 'referEarn':
        return <AnimatedReferBanner router={router} />;
      case 'nextTrip':
        if (!bookingConfirmed || !selectedCar) return null;
        return (
          <View style={styles.sectionPad}>
            <NextTrip car={selectedCar} />
          </View>
        );
      case 'offers':
        return (
          <>
            <SectionHeading title="Special Deals" kicker="EXCLUSIVE SPECIALS" />
            {isLoadingOffers ? (
              <View style={styles.offerRow}>
                {Array(3).fill(0).map((_, i) => (
                  <View key={i} style={{ marginRight: 16 }}>
                    <Skeleton width={290} height={175} borderRadius={20} />
                  </View>
                ))}
              </View>
            ) : (
              <FlatList
                data={offers}
                keyExtractor={(item) => item.id}
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
              />
            )}
          </>
        );
      case 'exploreVehicles':
        if (vehicleType === 'car') {
          return (
            <>
              <SectionHeading title="Explore Cars" kicker="TOP FOUR WHEELERS" action="View all" onAction={() => router.push('/explore')} />
              <FlatList
                data={premiumCollection.filter(v => v.type === 'Car')}
                keyExtractor={(item) => item.id}
                renderItem={renderLuxury}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.luxuryRow}
                snapToInterval={256}
                snapToAlignment="start"
                decelerationRate="fast"
                removeClippedSubviews
                initialNumToRender={3}
                maxToRenderPerBatch={3}
                windowSize={3}
              />
            </>
          );
        }
        return (
          <>
            <SectionHeading title="Explore Bikes" kicker="TWO WHEELER THRILLS" action="View all" onAction={() => router.push('/explore')} />
            <FlatList
              data={premiumCollection.filter(v => v.type === 'Bike')}
              keyExtractor={(item) => item.id}
              renderItem={renderLuxury}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.luxuryRow}
              snapToInterval={256}
              snapToAlignment="start"
              decelerationRate="fast"
              removeClippedSubviews
              initialNumToRender={3}
              maxToRenderPerBatch={3}
              windowSize={3}
            />
          </>
        );
      case 'destinations':
        return (
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
      case 'footer':
        return (
          <View style={[styles.footer, { position: 'relative', overflow: 'hidden', width: '100%' }]}>
            <View style={[styles.footerDivider, { backgroundColor: colors.border }]} />
            
            <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 10, width: '100%' }}>
              <Text style={[styles.footerHashtag, { color: colors.foreground, zIndex: 10 }]}>#MySawari</Text>
            </View>

            <Text style={[styles.footerTagline, { color: colors.mutedForeground }]}>Your ride, your way.</Text>
            <View style={styles.footerMadeIn}>
              <Feather name="map-pin" size={12} color={colors.primary} />
              <Text style={[styles.footerLocation, { color: colors.mutedForeground }]}>Developed in Guwahati, Assam</Text>
            </View>
            <Text style={[styles.footerCopy, { color: colors.mutedForeground }]}>© {new Date().getFullYear()} MySawari. All rights reserved.</Text>
          </View>
        );
      default:
        return null;
    }
  }, [colors, greeting, customer?.name, isAuthenticated, pickup, dropoff, mode, setMode, bookingConfirmed, selectedCar, isLoadingOffers, offers, renderOffer, renderLuxury, renderDest, router, vehicleType, displayVehicle, vehicleSlideAnim, vehicleFadeAnim]);

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
      />



      <LoginBottomSheet visible={showLogin} onClose={() => setShowLogin(false)} />
    </Page>
  );
}

const styles = StyleSheet.create({
  greeting: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 22, paddingHorizontal: 20 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.8, lineHeight: 32, marginTop: 6, paddingHorizontal: 20 },
  sectionPad: { paddingHorizontal: 16 },
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

