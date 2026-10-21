import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, ActivityIndicator, Keyboard } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';
import type { LocationResult } from '@/utils/sawari';
import { getSavedAddresses } from '@/utils/savedAddresses';
import { TOP_LOCATIONS } from '@/components/vehicle/details/AddressPickerSheet';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

type Place = LocationResult & { label?: string };

const NE_STATES = /assam|meghalaya|arunachal|nagaland|manipur|mizoram|tripura|sikkim/i;
/** Inside India's northeast: by the state the geocoder returns, else by the address text. */
function isInNortheast(f: { country?: string | null; state?: string | null; address?: string }) {
  if (f.country && !/india|भारत|ভাৰত|ভারত/i.test(f.country)) return false;
  return NE_STATES.test(f.state || '') || NE_STATES.test(f.address || '');
}

/**
 * "Add Address" from the car details delivery sheet (Figma): live OpenStreetMap search (Photon, with
 * Nominatim as fallback, via API.searchLocations) limited to the northeast states MySawari delivers in. Before
 * typing it lists the customer's saved addresses and the top locations. Picking a place opens the map
 * confirm page (/address-confirm), which sets the pick-up or drop-off address (?kind=pickup|return).
 */
export default function AddressSearchScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const { kind } = useLocalSearchParams<{ kind?: string }>();
  const isReturn = kind === 'return';
  const { customer, isAuthenticated } = useSawari();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [suggestions, setSuggestions] = useState<Place[]>(TOP_LOCATIONS);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [focused, setFocused] = useState(false);
  const abort = useRef<AbortController | null>(null);

  // Before typing: saved addresses first, then the top locations not already among them.
  useEffect(() => {
    getSavedAddresses(isAuthenticated ? customer?.id : null).then((saved) => {
      const rest = TOP_LOCATIONS.filter((t) => !saved.some((s) => s.id === t.id));
      setSuggestions([...saved, ...rest]);
    });
  }, []);

  // Search as you type (debounced); a newer query cancels the older request.
  useEffect(() => {
    const q = query.trim();
    abort.current?.abort();
    setFailed(false);
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    abort.current = ctrl;
    const t = setTimeout(async () => {
      try {
        const found = await API.searchLocations(q, 'guwahati', false, ctrl.signal, { restrictToServiceArea: true });
        if (ctrl.signal.aborted) return;
        // The service-area box also covers Bangladesh, Bhutan, Nepal and West Bengal; MySawari only
        // delivers in the northeast states.
        const inNortheast = found.filter(isInNortheast);
        setResults(inNortheast.map((f: any) => ({
          id: String(f.id),
          name: f.name,
          address: f.address,
          latitude: f.latitude,
          longitude: f.longitude,
          source: 'osm' as const,
        })));
      } catch (e: any) {
        if (ctrl.signal.aborted) return;
        setFailed(true);
        setResults([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query]);

  // Next page: the place on the map, where the customer fine-tunes the pin and confirms it.
  const pick = (place: Place) => {
    Haptics.selectionAsync();
    Keyboard.dismiss();
    router.push({
      pathname: '/address-confirm',
      params: {
        kind: isReturn ? 'return' : 'pickup',
        id: place.id,
        name: place.name,
        address: place.address,
        lat: String(place.latitude),
        lng: String(place.longitude),
        label: place.label ?? '',
      },
    });
  };

  const searching = query.trim().length >= 2;
  // While typing: saved / top places that match show at once, then the online results (no duplicates).
  const q = query.trim().toLowerCase();
  const local = searching ? suggestions.filter((s) => `${s.label ?? ''} ${s.name} ${s.address}`.toLowerCase().includes(q)) : [];
  const near = (a: Place, b: Place) => Math.abs(a.latitude - b.latitude) < 0.002 && Math.abs(a.longitude - b.longitude) < 0.002;
  const list = searching ? [...local, ...results.filter((r) => !local.some((l) => near(l, r)))] : suggestions;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
      <View style={[styles.searchBox, { borderColor: focused ? p.muted : p.strongBorder }]}>
        <Feather name="search" size={18} color={p.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search area, street or landmark"
          placeholderTextColor={p.muted}
          style={[styles.input, { color: p.fg }]}
          autoFocus
          autoCorrect={false}
          returnKeyType="search"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onSubmitEditing={() => { if (searching && list[0]) pick(list[0]); }}
          selectionColor={p.fg}
          accessibilityLabel={isReturn ? 'Search drop-off address' : 'Search pick-up address'}
        />
        {loading ? (
          <ActivityIndicator size="small" color={p.muted} />
        ) : query.length > 0 ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setQuery('')} hitSlop={10}>
            <Feather name="x" size={16} color={p.muted} />
          </Pressable>
        ) : null}
      </View>

      <FlatList
        data={list}
        keyExtractor={(item, i) => `${item.id}-${i}`}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        keyboardDismissMode="on-drag"
        renderItem={({ item, index }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${item.name}, ${item.address}`}
            onPress={() => pick(item)}
            style={({ pressed }) => [styles.row, (pressed || (searching && index === 0)) && { backgroundColor: p.soft }]}
          >
            <View style={[styles.pinCircle, { backgroundColor: p.iconBg }]}>
              <Ionicons name="location" size={20} color="#A3A3A3" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.name, { color: p.fg }]} numberOfLines={1}>{item.label ? `${item.label} - ${item.name}` : item.name}</Text>
              <Text style={[styles.addr, { color: p.muted }]} numberOfLines={1}>{item.address}</Text>
            </View>
            <Feather name="chevron-right" size={20} color={p.muted} />
          </Pressable>
        )}
        ListEmptyComponent={
          searching && !loading && local.length === 0 ? (
            <Text style={[styles.empty, { color: p.muted }]}>
              {failed ? "Couldn't search right now. Check your connection and try again." : 'No places found in our delivery area. Try a nearby landmark.'}
            </Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12.5,
    height: 48.5,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginHorizontal: 16,
    marginTop: 16,
  },
  input: { flex: 1, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, paddingVertical: 0 },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 4.5 },
  // Vertical padding gives the highlighted (best match / pressed) row its band; spacing matches Figma.
  row: { flexDirection: 'row', alignItems: 'center', gap: 9.5, paddingVertical: 8 },
  pinCircle: { width: 38.5, height: 38.5, borderRadius: 19.25, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  addr: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  empty: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', marginTop: 24 },
});
