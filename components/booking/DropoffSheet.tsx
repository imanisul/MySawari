import React, { useState, useMemo } from 'react';
import { StyleSheet, Text, View, Pressable, TextInput, ScrollView } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { DB } from '@/services/backend/database';
import { SheetFrame, SheetHeader } from '../common/SheetFrame';

const MAJOR_DESTINATIONS = [
  { id: 'shillong', name: 'Shillong, Meghalaya', desc: 'Scotland of the East', type: 'hill' },
  { id: 'cherrapunji', name: 'Cherrapunji, Meghalaya', desc: 'Living Root Bridges & Waterfalls', type: 'nature' },
  { id: 'kaziranga', name: 'Kaziranga National Park', desc: 'Home of the One-Horned Rhino', type: 'nature' },
  { id: 'tawang', name: 'Tawang, Arunachal Pradesh', desc: 'Monasteries and Snow Peaks', type: 'hill' },
  { id: 'dirang', name: 'Dirang, Arunachal Pradesh', desc: 'Hot Water Springs & Orchards', type: 'hill' },
  { id: 'bomdila', name: 'Bomdila, Arunachal Pradesh', desc: 'Buddhist Monasteries & Viewpoints', type: 'hill' },
  { id: 'majuli', name: 'Majuli, Assam', desc: 'World\'s Largest River Island', type: 'nature' },
  { id: 'kohima', name: 'Kohima, Nagaland', desc: 'Hornbill Festival & Heritage', type: 'hill' },
  { id: 'dzukou', name: 'Dzukou Valley, Nagaland', desc: 'Lush Green Trekking Paradise', type: 'nature' },
  { id: 'dawki', name: 'Dawki, Meghalaya', desc: 'Crystal Clear Umngot River', type: 'nature' },
  { id: 'guwahati-local', name: 'Guwahati Local', desc: 'City Tour, Kamakhya Temple, Cruises', type: 'city' },
];

export function DropoffSheet() {
  const colors = useColors();
  const router = useRouter();
  const { setDropoff } = useSawari();
  const [searchQuery, setSearchQuery] = useState('');

  // Combine DB pickup locations and Major Destinations
  const ALL_DESTINATIONS = useMemo(() => {
    const dbLocs = DB.pickupLocations
      .filter(loc => loc.id !== 'office')
      .map(loc => ({
        id: loc.id,
        name: loc.name,
        desc: loc.address,
        type: 'plane'
      }));
    return [...dbLocs, ...MAJOR_DESTINATIONS];
  }, []);

  const filteredDestinations = useMemo(() => {
    if (!searchQuery) return ALL_DESTINATIONS;
    const lowerQuery = searchQuery.toLowerCase();
    return ALL_DESTINATIONS.filter(loc => 
      loc.name.toLowerCase().includes(lowerQuery) || 
      loc.desc.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery, ALL_DESTINATIONS]);

  const handleSelect = (location: any) => {
    Haptics.selectionAsync();
    setDropoff({ id: location.id, name: location.name, address: location.desc, latitude: 0, longitude: 0, source: 'database' });
    router.back();
  };

  const getIcon = (type: string) => {
    switch(type) {
      case 'hill': return 'mountain';
      case 'nature': return 'tree';
      case 'city': return 'building';
      case 'plane': return 'plane';
      default: return 'map-pin';
    }
  };

  return (
    <SheetFrame height={700}>
      <SheetHeader title="Where are you going?" subtitle="Select your drop-off destination." />
      
      <View style={[styles.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
        <Feather name="search" size={20} color={colors.mutedForeground} />
        <TextInput 
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search destinations..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
            <Feather name="x-circle" size={16} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      <ScrollView style={styles.results} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {filteredDestinations.map(loc => (
          <Pressable 
            key={loc.id} 
            style={({ pressed }) => [styles.locationItem, { borderBottomColor: colors.border }, pressed && { backgroundColor: colors.tintLight }]}
            onPress={() => handleSelect(loc)}
          >
            <View style={[styles.iconWrap, { backgroundColor: colors.blue + '15' }]}>
              <FontAwesome5 name={getIcon(loc.type)} size={14} color={colors.blue} />
            </View>
            <View style={styles.locTextWrap}>
              <Text style={[styles.locTitle, { color: colors.foreground }]}>{loc.name}</Text>
              <Text style={[styles.locDesc, { color: colors.mutedForeground }]}>{loc.desc}</Text>
            </View>
          </Pressable>
        ))}
        {filteredDestinations.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ fontFamily: 'Inter_500Medium', color: colors.mutedForeground }}>No destinations found.</Text>
          </View>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  results: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locTextWrap: {
    marginLeft: 14,
    flex: 1,
  },
  locTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginBottom: 2,
  },
  locDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
});
