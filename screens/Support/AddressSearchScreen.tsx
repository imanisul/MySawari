import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, FlatList, ActivityIndicator, Keyboard, Alert } from 'react-native';
import * as Location from 'expo-location';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSawari } from '@/context/SawariContext';
import { getSavedAddresses } from '@/utils/savedAddresses';
import { TOP_LOCATIONS } from '@/components/vehicle/details/AddressPickerSheet';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { inNortheastBox } from '@/services/maps/google';
import { usePlaceSearch, type SearchPlace } from '@/hooks/usePlaceSearch';

type Place = SearchPlace;

/**
 * "Add Address" from the car details delivery sheet (Figma): live Google Places search (autocomplete as you
 * type; API.searchLocations as a backup) limited to the northeast states MySawari delivers in. Before
 * typing it lists the customer's saved addresses and the top locations. Picking a place opens the map
 * confirm page (/address-confirm), which sets the pick-up or drop-off address (?kind=pickup|return).
 */
export default function AddressSearchScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const { kind, editId } = useLocalSearchParams<{ kind?: string; editId?: string }>();
  const isReturn = kind === 'return';
  const kindParam = kind === 'save' ? 'save' : isReturn ? 'return' : 'pickup';
  const { customer, isAuthenticated } = useSawari();

  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Place[]>(TOP_LOCATIONS);
  const [focused, setFocused] = useState(false);
  const { results, loading, failed, resolve } = usePlaceSearch(query);
  const [opening, setOpening] = useState<string | null>(null); // Google result whose position is loading

  // Before typing: saved addresses first, then the top locations not already among them.
  useEffect(() => {
    getSavedAddresses(isAuthenticated ? customer?.id : null).then((saved) => {
      const rest = TOP_LOCATIONS.filter((t) => !saved.some((s) => s.id === t.id));
      setSuggestions([...saved, ...rest]);
    });
  }, []);

  // Next page: the place on the map, where the customer fine-tunes the pin and confirms it.
  const pick = async (place: Place) => {
    Haptics.selectionAsync();
    Keyboard.dismiss();
    if (opening) return;
    let target = place;
    setOpening(place.id);
    try {
      target = await resolve(place);
    } catch (e: any) {
      if (e?.message === 'outside') Alert.alert('Outside our area', 'We deliver only in the northeast. Please pick a place there.');
      else Alert.alert("Couldn't open this place", 'Please check your connection and try again.');
      return;
    } finally {
      setOpening(null);
    }
    // Next page: the place on the map, where the customer fine-tunes the pin and confirms it.
    router.push({
      pathname: '/address-confirm',
      params: {
        kind: kindParam,
        editId: editId ?? '',
        id: target.id,
        name: target.name,
        address: target.address,
        lat: String(target.latitude),
        lng: String(target.longitude),
        label: target.label ?? '',
      },
    });
  };

  // Pin on the map from where the customer is now.
  const [locating, setLocating] = useState(false);
  const useCurrentLocation = async () => {
    Haptics.selectionAsync();
    Keyboard.dismiss();
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Location off', 'Allow location access, or search for your address instead.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      if (!inNortheastBox(latitude, longitude)) {
        Alert.alert('Outside our area', 'You seem to be outside the northeast. Please search for your pickup address.');
        return;
      }
      router.push({
        pathname: '/address-confirm',
        params: { kind: kindParam, editId: editId ?? '', id: `pin_${latitude.toFixed(5)}_${longitude.toFixed(5)}`, name: 'Current location', address: '', lat: String(latitude), lng: String(longitude), label: '', locate: '1' },
      });
    } catch {
      Alert.alert("Couldn't find you", 'Please search for your address instead.');
    } finally {
      setLocating(false);
    }
  };

  const searching = query.trim().length >= 2;
  // While typing: saved / top places that match show at once, then the online results (no duplicates).
  const q = query.trim().toLowerCase();
  const local = searching ? suggestions.filter((s) => `${s.label ?? ''} ${s.name} ${s.address}`.toLowerCase().includes(q)) : [];
  const near = (a: Place, b: Place) => Math.abs(a.latitude - b.latitude) < 0.002 && Math.abs(a.longitude - b.longitude) < 0.002;
  const list = searching ? [...local, ...results.filter((r) => !local.some((l) => near(l, r)))] : suggestions;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={8} style={[styles.back, { backgroundColor: p.iconBg }]}>
          <Feather name="chevron-left" size={20} color={p.muted} />
        </Pressable>
        <Text style={[styles.headTitle, { color: p.fg }]}>{kind === 'save' ? (editId ? 'Edit address' : 'Add address') : isReturn ? 'Drop-off address' : 'Pickup address'}</Text>
      </View>
      <View style={[styles.searchBox, { borderColor: focused ? '#9FA6C0' : p.strongBorder, backgroundColor: p.page }]}>
        <Feather name="search" size={20} color={focused ? p.navy : p.muted} />
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

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Use my current location"
        onPress={useCurrentLocation}
        disabled={locating}
        style={({ pressed }) => [styles.locate, pressed && { opacity: 0.7 }]}
      >
        <View style={[styles.pinCircle, { backgroundColor: p.deliveryBorder }]}>
          {locating ? <ActivityIndicator size="small" color={p.navy} /> : <Ionicons name="locate" size={19} color={p.navy} />}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: p.navy }]}>Use my current location</Text>
          <Text style={[styles.addr, { color: p.muted }]}>Set the pin where you are now</Text>
        </View>
      </Pressable>
      <View style={[styles.rule, { backgroundColor: p.deliveryBorder }]} />

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
            {opening === item.id ? <ActivityIndicator size="small" color={p.muted} /> : <Feather name="chevron-right" size={20} color={p.muted} />}
          </Pressable>
        )}
        ListHeaderComponent={!searching && list.length > 0 ? <Text style={[styles.listTitle, { color: p.muted }]}>Saved & popular places</Text> : null}
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
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingTop: 8 },
  back: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17 },
  locate: { flexDirection: 'row', alignItems: 'center', gap: 9.5, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12 },
  rule: { height: 1, marginHorizontal: 16 },
  listTitle: { fontFamily: 'Inter_500Medium', fontSize: 12, marginBottom: 6 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 49,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    marginHorizontal: 16,
    marginTop: 14,
  },
  input: { flex: 1, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, lineHeight: 22, paddingVertical: 0 },
  list: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40, gap: 4.5 },
  // Vertical padding gives the highlighted (best match / pressed) row its band; spacing matches Figma.
  row: { flexDirection: 'row', alignItems: 'center', gap: 9.5, paddingVertical: 8 },
  pinCircle: { width: 38.5, height: 38.5, borderRadius: 19.25, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  addr: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 3 },
  empty: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', marginTop: 24 },
});