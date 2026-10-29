import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import { hasGoogleMaps } from '@/services/maps/google';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

/**
 * "Where are you going?" (design: Home → Select your Destination). A full page: the search field, then places.
 * With nothing typed it lists the popular Northeast destinations; typing also searches real places (the same
 * place search the delivery address uses, API.searchLocations) so any town or address can be the destination.
 * Picking one continues to the date & time picker, exactly as before.
 */

type Place = { id: string; name: string; address: string; latitude: number; longitude: number; source: 'database' | 'osm' };

const POPULAR: Place[] = [
  ['airport-t2', 'Lokpriya Gopinath Bordoloi International Airport', 'Borjhar, Mirzapur, Guwahati, Assam 781015, India'],
  ['railway', 'Guwahati Railway Station', 'Paltan Bazaar, Guwahati, Assam, India'],
  ['shillong', 'Shillong, Meghalaya', 'Scotland of the East'],
  ['cherrapunji', 'Cherrapunji, Meghalaya', 'Living Root Bridges & Waterfalls'],
  ['dawki', 'Dawki, Meghalaya', 'Crystal Clear Umngot River'],
  ['kaziranga', 'Kaziranga National Park, Assam', 'Home of the One-Horned Rhino'],
  ['tawang', 'Tawang, Arunachal Pradesh', 'Monasteries and Snow Peaks'],
  ['umrangso', 'Umrangso, Assam', 'Kapili Lake & Scenic Golf Course'],
  ['dirang', 'Dirang, Arunachal Pradesh', 'Hot Water Springs & Orchards'],
  ['bomdila', 'Bomdila, Arunachal Pradesh', 'Buddhist Monasteries & Viewpoints'],
  ['ziro', 'Ziro Valley, Arunachal Pradesh', 'Apatani Villages & Rice Fields'],
  ['majuli', 'Majuli, Assam', "World's Largest River Island"],
  ['manas', 'Manas National Park, Assam', 'Tigers, Elephants & Golden Langurs'],
  ['kamakhya', 'Kamakhya Temple, Assam', 'Guwahati · Nilachal Hill'],
  ['guwahati-local', 'Guwahati Local', 'City Tour, Kamakhya Temple, Cruises'],
  ['kohima', 'Kohima, Nagaland', 'Hornbill Festival & Heritage'],
  ['dzukou', 'Dzukou Valley, Nagaland', 'Lush Green Trekking Paradise'],
  ['imphal', 'Imphal, Manipur', 'Loktak Lake & Kangla Fort'],
  ['aizawl', 'Aizawl, Mizoram', 'Hilltop City & Reiek Views'],
  ['agartala', 'Agartala, Tripura', 'Ujjayanta & Neermahal Palaces'],
  ['gangtok', 'Gangtok, Sikkim', 'Tsomgo Lake & Nathula Pass'],
].map(([id, name, address]) => ({ id, name, address, latitude: 0, longitude: 0, source: 'database' as const }));

export function DropoffSheet() {
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setDropoff } = useSawari();
  // returnBack: opened from a screen that wants the customer back afterwards (booking page, trip sheet).
  // q: opened from a state on Home's "Explore Northeast", pre-filtered to it.
  const params = useLocalSearchParams<{ returnBack?: string; q?: string; forSpecificCar?: string }>();
  const [query, setQuery] = useState(typeof params.q === 'string' ? params.q : '');
  const [remote, setRemote] = useState<Place[]>([]);
  const [searching, setSearching] = useState(false);
  const abort = useRef<AbortController | null>(null);

  // Real places for what is typed (debounced; an older, slower reply never overwrites a newer one).
  useEffect(() => {
    const q = query.trim();
    abort.current?.abort();
    if (q.length < 3) { setRemote([]); setSearching(false); return; }
    const controller = new AbortController();
    abort.current = controller;
    setSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await API.searchLocations(q, 'guwahati', true, controller.signal);
        if (controller.signal.aborted) return;
        setRemote((res || []).map((r: any) => ({
          id: `osm-${r.id}`, name: r.name, address: r.address, latitude: r.latitude, longitude: r.longitude, source: 'osm' as const,
        })));
      } catch {
        if (!controller.signal.aborted) setRemote([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, 300);
    return () => { clearTimeout(t); controller.abort(); };
  }, [query]);

  const places = useMemo(() => {
    const q = query.trim().toLowerCase();
    const popular = q ? POPULAR.filter((pl) => pl.name.toLowerCase().includes(q) || pl.address.toLowerCase().includes(q)) : POPULAR;
    const seen = new Set(popular.map((pl) => pl.name.toLowerCase()));
    return [...popular, ...remote.filter((r) => !seen.has(r.name.toLowerCase()))];
  }, [query, remote]);

  const select = (pl: Place) => {
    Haptics.selectionAsync();
    setDropoff({ id: pl.id, name: pl.name, address: pl.address, latitude: pl.latitude, longitude: pl.longitude, source: pl.source });
    import('@/services/api/activity').then(({ ActivityAPI }) => ActivityAPI.logActivity('view_destination', 'DropoffSheet', { destination: pl.name }));
    if (params.forSpecificCar === 'true') {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/car-details');
      }
    } else if (params.returnBack === 'true') {
      // Changing the destination from the date picker, the booking page or the trip sheet: go straight
      // back there with the dates already chosen. (It used to open a second, empty date picker whose
      // "Confirm Dates" then returned to this page instead.)
      router.back();
    } else {
      // Home → destination → dates: this page is swapped for the date picker, which is then swapped for
      // the results, so Back from the results goes straight to Home.
      router.replace({ pathname: '/dates', params: { returnBack: 'false', fresh: 'true' } });
    }
  };

  const typed = query.trim();
  const custom = typed.length >= 3 && !places.some((pl) => pl.name.toLowerCase() === typed.toLowerCase());

  return (
    <View style={[styles.page, { backgroundColor: p.page, paddingTop: insets.top + 12 }]}>
      <View style={[styles.search, { borderColor: p.border }]}>
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={8} accessibilityRole="button" accessibilityLabel="Clear search">
            <Feather name="chevron-left" size={20} color={p.sub} />
          </Pressable>
        ) : (
          <Pressable onPress={() => router.back()} hitSlop={8} accessibilityRole="button" accessibilityLabel="Back">
            <Feather name="search" size={18} color={p.sub} />
          </Pressable>
        )}
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Where are you going?"
          placeholderTextColor={p.muted}
          autoFocus
          returnKeyType="search"
          autoCorrect={false}
          style={[styles.searchInput, { color: p.fg }]}
          accessibilityLabel="Where are you going?"
        />
        {searching && <ActivityIndicator size="small" color={p.muted} />}
      </View>

      <FlatList
        data={places}
        keyExtractor={(pl) => pl.id}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        renderItem={({ item }) => <Row p={p} title={item.name} sub={item.address} onPress={() => select(item)} />}
        ListFooterComponent={
          <>
            {custom && (
              // A place that isn't listed can still be the destination — never a dead end.
              <Row
                p={p}
                title={`Use “${typed}”`}
                sub="Set as your destination"
                icon="plus"
                onPress={() => select({ id: `custom-${typed.toLowerCase()}`, name: typed, address: 'Your destination', latitude: 0, longitude: 0, source: 'database' })}
              />
            )}
            {/* Google's terms: results shown without a Google map carry its credit. */}
            {hasGoogleMaps && places.length > 0 && <Text style={[styles.powered, { color: p.muted }]}>powered by Google</Text>}
          </>
        }
        ListEmptyComponent={!searching && typed.length >= 3 ? (
          <Text style={[styles.empty, { color: p.muted }]}>No places found. Try a nearby town or landmark.</Text>
        ) : null}
      />
    </View>
  );
}

function Row({ p, title, sub, onPress, icon }: { p: ReturnType<typeof useDetailsPalette>; title: string; sub: string; onPress: () => void; icon?: 'plus' }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.row, pressed && { opacity: 0.7 }]} accessibilityRole="button" accessibilityLabel={`${title}, ${sub}`}>
      <View style={[styles.pin, { backgroundColor: p.iconBg }]}>
        {icon === 'plus' ? <Feather name="plus" size={16} color={p.sub} /> : <FontAwesome5 name="map-marker-alt" size={15} color={p.muted} />}
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowTitle, { color: p.fg }]} numberOfLines={1}>{title}</Text>
        <Text style={[styles.rowSub, { color: p.muted }]} numberOfLines={1}>{sub}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={p.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  powered: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, textAlign: 'right', marginTop: 8, marginHorizontal: 16 },
  page: { flex: 1, paddingHorizontal: 16 },
  // Design: 361×48 field, 1px border, radius 8, icon + placeholder.
  search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginBottom: 12 },
  searchInput: { flex: 1, height: '100%', padding: 0, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  pin: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, minWidth: 0 },
  rowTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, lineHeight: 20 },
  rowSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, lineHeight: 17 },
  empty: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, textAlign: 'center', marginTop: 24 },
});