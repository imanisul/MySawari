import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Alert, Keyboard, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { getDevicePosition, POSITION_FAILURE_MESSAGE } from '@/utils/location';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SheetFrame, SheetHeader } from '../common/SheetFrame';
import { LocationResult } from '@/utils/sawari';
import { API } from '@/services/backend/api';
import { Skeleton, SkeletonGroup } from '@/components/common/Skeleton';

export function LocationSheet({ isReturn, isDestination }: { isReturn?: boolean; isDestination?: boolean } = {}) {
  const colors = useColors();
  const router = useRouter();
  const { 
    pickup: pickupLocation, 
    setPickup: setPickupLocation, 
    returnAddress, 
    setReturnAddress,
    setDropoff,
    deliveryMode
  } = useSawari();

  const [mode, setMode] = useState<'pickup' | 'return' | 'destination'>(isDestination ? 'destination' : (isReturn ? 'return' : 'pickup'));
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [isDebouncing, setIsDebouncing] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const abortController = useRef<AbortController | null>(null);
  const listRef = useRef<ScrollView>(null);

  // A new search (or tab) starts from the first result, and the list never stays scrolled under the
  // search field when the keyboard resizes the screen.
  useEffect(() => {
    listRef.current?.scrollTo({ y: 0, animated: false });
  }, [searchQuery, mode]);
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => listRef.current?.scrollTo({ y: 0, animated: false }));
    return () => sub.remove();
  }, []);

  // Popular destinations (unchanged) — shown when choosing where you are going
  const popularDestinations = [
    { id: 'pop1', name: 'Kaziranga National Park', address: 'Kanchanjuri, Assam', latitude: 26.5775, longitude: 93.1711 },
    { id: 'pop2', name: 'Shillong', address: 'East Khasi Hills, Meghalaya', latitude: 25.5788, longitude: 91.8933 },
    { id: 'pop3', name: 'Kamakhya Temple', address: 'Kamakhya, Guwahati, Assam', latitude: 26.1670, longitude: 91.7086 },
    { id: 'pop4', name: 'Tawang Monastery', address: 'Tawang, Arunachal Pradesh', latitude: 27.5866, longitude: 91.8596 },
    { id: 'pop5', name: 'Lokpriya Gopinath Bordoloi Airport', address: 'Borjhar, Guwahati, Assam', latitude: 26.1062, longitude: 91.5859 },
    { id: 'pop6', name: 'Paltan Bazaar (Railway Station)', address: 'Guwahati, Assam', latitude: 26.1793, longitude: 91.7516 },
  ];

  // Well-known pick-up / collection points around Guwahati and Meghalaya — shown for delivery and collection.
  const popularPickupPoints = [
    { id: 'pk_gau_airport', group: 'Guwahati', name: 'LGB International Airport', address: 'Borjhar, Guwahati, Assam', latitude: 26.1061, longitude: 91.5859 },
    { id: 'pk_gau_rly', group: 'Guwahati', name: 'Guwahati Railway Station', address: 'Paltan Bazaar, Guwahati, Assam', latitude: 26.1820, longitude: 91.7511 },
    { id: 'pk_gau_isbt', group: 'Guwahati', name: 'ISBT Guwahati (Adabari)', address: 'Adabari, Guwahati, Assam', latitude: 26.1552, longitude: 91.6957 },
    { id: 'pk_gau_paltan', group: 'Guwahati', name: 'Paltan Bazaar', address: 'Guwahati, Assam', latitude: 26.1793, longitude: 91.7516 },
    { id: 'pk_gau_fancy', group: 'Guwahati', name: 'Fancy Bazaar', address: 'Guwahati, Assam', latitude: 26.1848, longitude: 91.7405 },
    { id: 'pk_gau_uzan', group: 'Guwahati', name: 'Uzan Bazaar', address: 'Guwahati, Assam', latitude: 26.1873, longitude: 91.7463 },
    { id: 'pk_gau_ganeshguri', group: 'Guwahati', name: 'Ganeshguri', address: 'Guwahati, Assam', latitude: 26.1441, longitude: 91.7833 },
    { id: 'pk_gau_dispur', group: 'Guwahati', name: 'Dispur', address: 'Guwahati, Assam', latitude: 26.1433, longitude: 91.7898 },
    { id: 'pk_gau_sixmile', group: 'Guwahati', name: 'Six Mile', address: 'Guwahati, Assam', latitude: 26.1370, longitude: 91.8040 },
    { id: 'pk_gau_khanapara', group: 'Guwahati', name: 'Khanapara', address: 'Guwahati, Assam', latitude: 26.1259, longitude: 91.8118 },
    { id: 'pk_gau_beltola', group: 'Guwahati', name: 'Beltola', address: 'Guwahati, Assam', latitude: 26.1247, longitude: 91.7896 },
    { id: 'pk_gau_maligaon', group: 'Guwahati', name: 'Maligaon', address: 'Guwahati, Assam', latitude: 26.1523, longitude: 91.7100 },
    { id: 'pk_gau_jalukbari', group: 'Guwahati', name: 'Jalukbari (Gauhati University)', address: 'Guwahati, Assam', latitude: 26.1547, longitude: 91.6620 },
    { id: 'pk_gau_kamakhya', group: 'Guwahati', name: 'Kamakhya Temple', address: 'Kamakhya, Guwahati, Assam', latitude: 26.1670, longitude: 91.7086 },
    { id: 'pk_gau_umananda', group: 'Guwahati', name: 'Umananda Temple', address: 'Peacock Island, Guwahati, Assam', latitude: 26.1953, longitude: 91.7449 },
    { id: 'pk_meg_shillong', group: 'Meghalaya', name: 'Police Bazaar, Shillong', address: 'Shillong, Meghalaya', latitude: 25.5735, longitude: 91.8811 },
    { id: 'pk_meg_airport', group: 'Meghalaya', name: 'Shillong Airport', address: 'Umroi, Meghalaya', latitude: 25.7036, longitude: 91.9787 },
    { id: 'pk_meg_wards', group: 'Meghalaya', name: "Ward's Lake", address: 'Shillong, Meghalaya', latitude: 25.5732, longitude: 91.8895 },
    { id: 'pk_meg_umiam', group: 'Meghalaya', name: 'Umiam Lake (Barapani)', address: 'Ri-Bhoi, Meghalaya', latitude: 25.6603, longitude: 91.8876 },
    { id: 'pk_meg_elephant', group: 'Meghalaya', name: 'Elephant Falls', address: 'Upper Shillong, Meghalaya', latitude: 25.5378, longitude: 91.8148 },
    { id: 'pk_meg_cherra', group: 'Meghalaya', name: 'Cherrapunji (Sohra)', address: 'East Khasi Hills, Meghalaya', latitude: 25.2700, longitude: 91.7320 },
    { id: 'pk_meg_dawki', group: 'Meghalaya', name: 'Dawki', address: 'West Jaintia Hills, Meghalaya', latitude: 25.1889, longitude: 92.0202 },
    { id: 'pk_meg_mawlynnong', group: 'Meghalaya', name: 'Mawlynnong', address: 'East Khasi Hills, Meghalaya', latitude: 25.2010, longitude: 91.9160 },
  ];
  // Destination mode keeps its own list; delivery and collection use the pick-up points above.
  const popularLocations: any[] = mode === 'destination' ? popularDestinations : popularPickupPoints;

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setPredictions([]);
      setIsDebouncing(false);
      return;
    }

    setIsDebouncing(true);
    setPredictions([]); // Clear stale API results immediately so UI falls back to instant local filtering

    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();
    const currentSignal = abortController.current.signal;

    const timer = setTimeout(async () => {
      setIsDebouncing(false);
      setLoading(true);
      
      try {
        // Delivery / collection addresses must be somewhere we operate; a destination can be anywhere.
        const results = await API.searchLocations(searchQuery, 'guwahati', mode === 'destination', currentSignal, {
          restrictToServiceArea: mode !== 'destination',
        });

        if (!currentSignal.aborted) {
          setPredictions(results || []);
        }
      } catch (error: any) {
        if (error.name !== 'AbortError' && !currentSignal.aborted) {
          console.error("Search failed:", error);
          setPredictions([]);
        }
      } finally {
        if (!currentSignal.aborted) {
          setLoading(false);
        }
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, mode]);

  const handleUseCurrentLocation = async () => {
    if (loading) return; // ignore double taps while a fix is in progress
    setLoading(true);
    try {
      const result = await getDevicePosition({ preferFresh: true });

      if (!result.ok) {
        if (result.reason === 'denied') {
          Alert.alert('Location access needed', POSITION_FAILURE_MESSAGE.denied, [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]);
        } else {
          Alert.alert('Could not get your location', POSITION_FAILURE_MESSAGE[result.reason]);
        }
        return;
      }

      const { latitude, longitude } = result.position.coords;

      // A readable street / area address for the delivery point — never the name of the nearest shop.
      let addressStr = 'Current Location';
      let placeName = 'My Current Location';
      try {
        const reverseData = await API.reverseGeocode(latitude, longitude, { areaOnly: true });
        if (reverseData) {
          addressStr = reverseData.address || addressStr;
          placeName = reverseData.name || placeName;
        }
      } catch (e) {
        console.warn('Reverse geocode failed', e);
      }

      const loc: LocationResult = {
        id: `current_${Date.now()}`,
        address: addressStr,
        latitude,
        longitude,
        name: placeName,
        source: 'gps'
      };

      if (mode === 'destination') {
        setDropoff(loc);
        router.back();
      } else if (mode === 'pickup') {
        setPickupLocation(loc);
        if (deliveryMode === 'both') {
          setMode('return');
          setSearchQuery('');
        } else {
          router.back();
        }
      } else {
        setReturnAddress(loc);
        router.back();
      }
    } catch (error) {
      console.error('Error fetching location:', error);
      Alert.alert('Could not get your location', POSITION_FAILURE_MESSAGE.unavailable);
    } finally {
      setLoading(false);
    }
  };


  const handleSelectPlace = async (place: any, isPopular = false) => {
    Haptics.selectionAsync();
    
    // A place without real coordinates can't be priced or delivered to — never substitute a made-up point.
    if (!Number.isFinite(place.latitude) || !Number.isFinite(place.longitude)) {
      Alert.alert('Location not available', 'We could not get the exact position of that place. Please pick another result.');
      return;
    }

    const loc: LocationResult = {
      id: place.id || place.place_id || `loc_${Date.now()}`,
      address: place.address || place.description,
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name || place.structured_formatting?.main_text || 'Selected Location',
      source: 'osm'
    };

    if (mode === 'destination') {
      setDropoff(loc);
      router.back();
    } else if (mode === 'pickup') {
      setPickupLocation(loc);
      if (deliveryMode === 'both') {
        setMode('return'); // Auto switch to return
        setSearchQuery('');
      } else {
        router.back();
      }
    } else {
      setReturnAddress(loc);
      router.back();
    }
  };

  const localFiltered = popularLocations.filter(loc => 
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    loc.address.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const displayList = searchQuery.trim().length > 0 ? (predictions.length > 0 ? predictions : localFiltered) : popularLocations;

  const title =
    mode === 'destination' ? 'Where are you going?' : mode === 'pickup' ? 'Where to deliver?' : 'Where to collect?';
  const subtitle =
    mode === 'destination'
      ? 'Search for a place or pick a popular one.'
      : 'Search an address or use your current location.';
  const hasQuery = searchQuery.length > 0;
  const isSearching = (loading || isDebouncing) && hasQuery && predictions.length === 0;

  return (
    <SheetFrame fill>
      <SheetHeader title={title} subtitle={subtitle} />

      {/* Tabs - Only show if both are required and NOT in destination mode */}
      {deliveryMode === 'both' && mode !== 'destination' && (
        <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable 
            style={[styles.tab, mode === 'pickup' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => { setMode('pickup'); setSearchQuery(''); }}
          >
            <Text style={[styles.tabText, { color: mode === 'pickup' ? colors.primaryText : colors.mutedForeground }]}>
              Deliver To
            </Text>
            <Text style={[styles.tabSubText, { color: colors.foreground }]} numberOfLines={1}>
              {pickupLocation ? pickupLocation.name : 'Select Location'}
            </Text>
          </Pressable>
          <Pressable 
            style={[styles.tab, mode === 'return' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => { setMode('return'); setSearchQuery(''); }}
          >
            <Text style={[styles.tabText, { color: mode === 'return' ? colors.primaryText : colors.mutedForeground }]}>
              Collect From
            </Text>
            <Text style={[styles.tabSubText, { color: colors.foreground }]} numberOfLines={1}>
              {returnAddress ? returnAddress.name : 'Select Location'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Search field: always pinned above the results, highlighted while typing */}
      <View
        style={[
          styles.searchBox,
          { borderColor: focused ? colors.primaryText : colors.border, backgroundColor: colors.background },
        ]}
      >
        <Feather name="search" size={20} color={focused ? colors.primaryText : colors.mutedForeground} style={{ marginRight: 12 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder={mode === 'destination' ? "Search destination..." : (mode === 'pickup' ? "Search delivery address..." : "Search collection address...")}
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
          autoCorrect={false}
          autoFocus
        />
        {loading && <ActivityIndicator size="small" color={colors.primaryText} />}
        {hasQuery && !loading && (
          <Pressable onPress={() => setSearchQuery('')} hitSlop={10} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <ScrollView
        ref={listRef}
        style={styles.results}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.resultsContent}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {!hasQuery && (
          <>
            {mode !== 'destination' && (
              <Pressable
                style={({ pressed }) => [
                  styles.currentCard,
                  { backgroundColor: colors.primary + '1F', borderColor: colors.primary + '66' },
                  pressed && { opacity: 0.85 },
                ]}
                onPress={handleUseCurrentLocation}
                disabled={loading}
              >
                <View style={[styles.currentIcon, { backgroundColor: colors.primary }]}>
                  <Feather name="navigation" size={18} color="#101B2E" />
                </View>
                <View style={styles.resultTextContainer}>
                  <Text style={[styles.mainText, { color: colors.foreground, marginBottom: 2 }]}>Use current location</Text>
                  <Text style={[styles.subText, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {loading ? 'Finding you...' : 'Fetch location using GPS'}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </Pressable>
            )}

            {mode === 'destination' && (
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>POPULAR LOCATIONS</Text>
            )}
          </>
        )}

        {hasQuery && displayList.length > 0 && (
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            {predictions.length > 0 ? 'SEARCH RESULTS' : 'SUGGESTIONS'}
          </Text>
        )}

        {displayList.map((item, index) => {
          // Pick-up points are grouped (Guwahati / Meghalaya) with a heading where each group starts.
          const showGroup = !hasQuery && mode !== 'destination' && item.group && item.group !== displayList[index - 1]?.group;
          const mainText = item.name || item.structured_formatting?.main_text || item.description;
          const subText = item.address || item.structured_formatting?.secondary_text || 'Assam, India';

          return (
            <React.Fragment key={`${item.id || item.place_id || 'loc'}_${index}`}>
            {showGroup && (
              <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: index === 0 ? 4 : 16 }]}>
                {`POPULAR IN ${String(item.group).toUpperCase()}`}
              </Text>
            )}
            <Pressable
              style={({ pressed }) => [
                styles.resultItem,
                { borderBottomColor: colors.border },
                pressed && { backgroundColor: colors.tintLight },
              ]}
              onPress={() => handleSelectPlace(item, !hasQuery)}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.secondary }]}>
                <Feather name="map-pin" size={18} color={colors.mutedForeground} />
              </View>
              <View style={styles.resultTextContainer}>
                <Text style={[styles.mainText, { color: colors.foreground }]} numberOfLines={1}>
                  {mainText}
                </Text>
                <Text style={[styles.subText, { color: colors.mutedForeground }]} numberOfLines={1}>
                  {subText}
                </Text>
              </View>
            </Pressable>
            </React.Fragment>
          );
        })}

        {/* Online results still coming: placeholder rows instead of a jumping spinner line */}
        {isSearching && (
          <SkeletonGroup>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.resultItem, { borderBottomColor: colors.border }]}>
                <Skeleton width={40} height={40} borderRadius={20} delay={i * 80} style={{ marginRight: 16 }} />
                <View style={{ flex: 1, gap: 8 }}>
                  <Skeleton width="60%" height={14} borderRadius={5} delay={i * 80 + 40} />
                  <Skeleton width="40%" height={11} borderRadius={4} delay={i * 80 + 80} />
                </View>
              </View>
            ))}
          </SkeletonGroup>
        )}

        {displayList.length === 0 && !loading && !isDebouncing && (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.secondary }]}>
              <Feather name="map-pin" size={22} color={colors.mutedForeground} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No places found</Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>Try a nearby landmark or area name.</Text>
          </View>
        )}

        <Text style={[styles.attribution, { color: colors.mutedForeground }]}>Data © OpenStreetMap contributors</Text>
      </ScrollView>
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginBottom: 4,
  },
  tabSubText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1.5,
    borderRadius: 14,
    marginTop: 16,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    height: '100%',
  },
  results: { flexShrink: 1, marginTop: 8 },
  resultsContent: { paddingTop: 8, paddingBottom: 24 },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.8,
    marginTop: 8,
    marginBottom: 4,
    marginLeft: 4,
  },
  currentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
  },
  currentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emptyState: { alignItems: 'center', paddingVertical: 36, paddingHorizontal: 24 },
  emptyIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginBottom: 4 },
  emptySub: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center' },
  attribution: { fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center', marginTop: 20, marginBottom: 4 },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  resultTextContainer: {
    flex: 1,
  },
  mainText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginBottom: 4,
  },
  subText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  }
});
