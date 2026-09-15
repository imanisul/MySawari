import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SheetFrame, SheetHeader } from '../common/SheetFrame';
import { LocationResult } from '@/utils/sawari';

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

  // Popular locations as fallback
  const popularLocations = [
    { place_id: 'pop1', description: 'Lokpriya Gopinath Bordoloi Airport' },
    { place_id: 'pop2', description: 'Paltan Bazaar' },
    { place_id: 'pop3', description: 'Ganeshguri' },
    { place_id: 'pop4', description: 'ISBT Guwahati' },
  ];

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setPredictions([]);
      return;
    }

    const timer = setTimeout(() => {
      setLoading(true);
      
      // Mock local filtering
      const lowerQuery = searchQuery.toLowerCase();
      const results = popularLocations.filter(loc => 
        loc.description.toLowerCase().includes(lowerQuery)
      );
      
      setPredictions(results);
      setLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, mode]);

  const handleSelectPlace = async (place: any, isPopular = false) => {
    Haptics.selectionAsync();
    
    // If it's a popular mock location without real place_id, we just mock the lat/lng
    let lat = 26.1445 + (Math.random() * 0.1);
    let lng = 91.7362 + (Math.random() * 0.1);

    if (!isPopular) {
      // For mock logic, we don't have a backend to get exact details from.
      // We will just use the random lat/lng generated above.
    }

    const loc: LocationResult = {
      id: place.place_id || `loc_${Date.now()}`,
      address: place.description,
      latitude: lat,
      longitude: lng,
      name: place.structured_formatting?.main_text || place.description,
      source: 'database'
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
              Pickup From
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
          placeholder={mode === 'pickup' ? "Search delivery address..." : "Search return pickup address..."}
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
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>Popular locations</Text>
        )}
        
        {displayList.map((item, index) => {
          const mainText = item.structured_formatting?.main_text || item.description;
          const subText = item.structured_formatting?.secondary_text || 'Assam, India';
          
          return (
            <Pressable 
              key={item.place_id || index} 
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
