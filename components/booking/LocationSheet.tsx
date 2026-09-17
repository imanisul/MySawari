import React, { useEffect, useState, useRef } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SheetFrame, SheetHeader } from '../common/SheetFrame';
import { LocationResult } from '@/utils/sawari';
import { API } from '@/services/backend/api';

export function LocationSheet({ isReturn }: { isReturn?: boolean } = {}) {
  const colors = useColors();
  const router = useRouter();
  const { 
    pickup: pickupLocation, 
    setPickup: setPickupLocation, 
    returnAddress, 
    setReturnAddress,
    deliveryMode
  } = useSawari();

  const [mode, setMode] = useState<'pickup' | 'return'>(isReturn ? 'return' : 'pickup');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState<any[]>([]);
  const abortController = useRef<AbortController | null>(null);

  // Popular locations as fallback
  const popularLocations = [
    { id: 'pop1', name: 'Lokpriya Gopinath Bordoloi Airport', address: 'Borjhar, Guwahati, Assam', latitude: 26.1062, longitude: 91.5859 },
    { id: 'pop2', name: 'Paltan Bazaar', address: 'Guwahati, Assam', latitude: 26.1793, longitude: 91.7516 },
    { id: 'pop3', name: 'Ganeshguri', address: 'Guwahati, Assam', latitude: 26.1465, longitude: 91.7903 },
    { id: 'pop4', name: 'ISBT Guwahati', address: 'Guwahati, Assam', latitude: 26.1302, longitude: 91.7410 },
  ];

  useEffect(() => {
    // Require minimum 3 characters to search
    if (searchQuery.trim().length < 3) {
      setPredictions([]);
      return;
    }

    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();
    const currentSignal = abortController.current.signal;

    const timer = setTimeout(async () => {
      setLoading(true);
      
      try {
        const results = await API.searchLocations(searchQuery, 'guwahati', mode === 'pickup', currentSignal);
        if (!currentSignal.aborted) {
          setPredictions(results);
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
    }, 400); // 400ms debounce

    return () => clearTimeout(timer);
  }, [searchQuery, mode]);

  const handleUseCurrentLocation = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        setLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      
      let addressStr = 'Current Location';
      let placeName = 'My Current Location';
      try {
        const reverseData = await API.reverseGeocode(latitude, longitude);
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

      if (mode === 'pickup') {
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
      alert('Could not fetch current location. Please try again.');
    } finally {
      setLoading(false);
    }
  };


  const handleSelectPlace = async (place: any, isPopular = false) => {
    Haptics.selectionAsync();
    
    // We already have latitude and longitude from Photon/Fallback array
    const loc: LocationResult = {
      id: place.id || place.place_id || `loc_${Date.now()}`,
      address: place.address || place.description,
      latitude: place.latitude || 26.1445,
      longitude: place.longitude || 91.7362,
      name: place.name || place.structured_formatting?.main_text || 'Selected Location',
      source: 'osm'
    };

    if (mode === 'pickup') {
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

  const displayList = searchQuery.trim().length > 0 ? predictions : popularLocations;

  return (
    <SheetFrame height={700}>
      <SheetHeader title="Where to?" />

      {/* Tabs - Only show if both are required */}
      {deliveryMode === 'both' && (
        <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Pressable 
            style={[styles.tab, mode === 'pickup' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => { setMode('pickup'); setSearchQuery(''); }}
          >
            <Text style={[styles.tabText, { color: mode === 'pickup' ? colors.primary : colors.mutedForeground }]}>
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
            <Text style={[styles.tabText, { color: mode === 'return' ? colors.primary : colors.mutedForeground }]}>
              Collect From
            </Text>
            <Text style={[styles.tabSubText, { color: colors.foreground }]} numberOfLines={1}>
              {returnAddress ? returnAddress.name : 'Select Location'}
            </Text>
          </Pressable>
        </View>
      )}

      {/* Search Input */}
      <View style={[styles.searchBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <Feather name="search" size={20} color={colors.mutedForeground} style={{ marginRight: 12 }} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder={mode === 'pickup' ? "Search delivery address..." : "Search collection address..."}
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
        {searchQuery.length > 0 && !loading && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40, paddingTop: 16 }}>
        {searchQuery.length === 0 && (
          <>
            <Pressable 
              style={[styles.resultItem, { borderBottomColor: colors.border }]}
              onPress={handleUseCurrentLocation}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
                <Feather name="navigation" size={18} color={colors.primary} />
              </View>
              <View style={styles.resultTextContainer}>
                <Text style={[styles.mainText, { color: colors.primary }]}>
                  Use Current Location
                </Text>
                <Text style={[styles.subText, { color: colors.mutedForeground }]} numberOfLines={1}>
                  Fetch location using GPS
                </Text>
              </View>
            </Pressable>
            
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground, marginTop: 16 }]}>Popular locations</Text>
          </>
        )}
        
        {displayList.map((item, index) => {
          const mainText = item.name || item.structured_formatting?.main_text || item.description;
          const subText = item.address || item.structured_formatting?.secondary_text || 'Assam, India';
          
          return (
            <Pressable 
              key={item.id || item.place_id || index} 
              style={[styles.resultItem, { borderBottomColor: colors.border }]}
              onPress={() => handleSelectPlace(item, searchQuery.length === 0)}
            >
              <View style={[styles.iconBox, { backgroundColor: colors.card }]}>
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
          );
        })}
        
        {displayList.length === 0 && !loading && (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>No places found.</Text>
          </View>
        )}

        <View style={{ alignItems: 'center', marginTop: 16, marginBottom: 8 }}>
          <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: 'Inter_400Regular' }}>
            Data © OpenStreetMap contributors
          </Text>
        </View>
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
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
    height: '100%',
  },
  sectionTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    marginBottom: 12,
    marginLeft: 4,
  },
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
