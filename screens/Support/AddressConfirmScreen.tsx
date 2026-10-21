import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform, Keyboard, ScrollView } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { API } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';
import type { LocationResult } from '@/utils/sawari';
import { saveAddress } from '@/utils/savedAddresses';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

// India's northeast (Assam, Meghalaya, Arunachal, Nagaland, Manipur, Mizoram, Tripura, Sikkim) — the map
// can't be panned or zoomed out beyond it. [[south, west], [north, east]]
const NORTHEAST_BOUNDS = [[21.9, 88.0], [29.5, 97.5]];
const PRESET_LABELS = ['Home', 'Work', 'Trip'];

/** Leaflet + CARTO Voyager tiles (OpenStreetMap data); posts the map centre back after every move. */
function mapHtml(lat: number, lng: number) {
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css">
<style>html,body,#map{margin:0;height:100%;width:100%;background:#F5F3EF}
.leaflet-control-attribution{font-size:8px;opacity:.7}</style>
</head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script>
  var post = function (m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
  var bounds = L.latLngBounds(${JSON.stringify(NORTHEAST_BOUNDS)});
  var map = L.map('map', { zoomControl: false, minZoom: 7, maxZoom: 19, maxBounds: bounds, maxBoundsViscosity: 1 })
    .setView([${lat}, ${lng}], 15);
  L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    subdomains: 'abcd', maxZoom: 19, bounds: bounds,
    attribution: '&copy; OpenStreetMap &copy; CARTO'
  }).addTo(map);
  map.on('movestart', function () { post({ type: 'move' }); });
  map.on('moveend', function () { var c = map.getCenter(); post({ type: 'center', lat: c.lat, lng: c.lng, zoom: map.getZoom() }); });
  post({ type: 'ready' });
</script></body></html>`;
}

/**
 * After picking a search result (Figma "Set Pickup location"): the place on a map of the northeast with a
 * fixed centre pin the customer can move the map under, flat / house details, a "Save address as" tag,
 * and Confirm. Sets the pick-up or drop-off address (?kind=pickup|return) and returns to car details.
 */
export default function AddressConfirmScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ kind?: string; id?: string; name?: string; address?: string; lat?: string; lng?: string; label?: string }>();
  const isReturn = params.kind === 'return';
  const { setPickup, setReturnAddress, customer, isAuthenticated } = useSawari();

  const start = useMemo(() => ({ latitude: Number(params.lat), longitude: Number(params.lng) }), []);
  const [place, setPlace] = useState({ id: params.id || `pin_${Date.now()}`, name: params.name || 'Selected location', address: params.address || '', ...start });
  const [moving, setMoving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  const [details, setDetails] = useState('');
  const [focus, setFocus] = useState<'details' | 'label' | null>(null); // the box being typed in gets the darker border
  const [label, setLabel] = useState(params.label || '');
  const [customOpen, setCustomOpen] = useState(!!params.label && !PRESET_LABELS.includes(params.label));
  const lookup = useRef(0);
  const [moved, setMoved] = useState(false); // map panned or zoomed away from the picked place → show Reset
  const web = useRef<WebView>(null);
  const html = useMemo(() => mapHtml(start.latitude, start.longitude), []);

  // The pin stays in the middle; when the map stops, the place under it becomes the address.
  const onCenter = async (lat: number, lng: number, zoom?: number) => {
    setMoving(false);
    const unmoved = Math.abs(lat - start.latitude) < 0.0002 && Math.abs(lng - start.longitude) < 0.0002;
    setMoved(!unmoved || (zoom !== undefined && zoom !== 15));
    if (unmoved) {
      setPlace({ id: params.id || place.id, name: params.name || place.name, address: params.address || place.address, ...start });
      return;
    }
    const n = ++lookup.current;
    setPlace((cur) => ({ ...cur, id: `pin_${lat.toFixed(5)}_${lng.toFixed(5)}`, latitude: lat, longitude: lng }));
    setResolving(true);
    try {
      const found = await API.reverseGeocode(lat, lng);
      if (n === lookup.current && found) setPlace((cur) => ({ ...cur, name: found.name || cur.name, address: found.address || cur.address }));
    } catch {}
    if (n === lookup.current) setResolving(false);
  };

  const confirm = async () => {
    Haptics.selectionAsync();
    Keyboard.dismiss();
    const extra = details.trim();
    const loc: LocationResult = {
      id: place.id,
      name: place.name,
      address: extra ? `${extra}, ${place.address}` : place.address,
      latitude: place.latitude,
      longitude: place.longitude,
      source: 'osm',
    };
    await saveAddress(isAuthenticated ? customer?.id : null, loc, label.trim() || undefined);
    if (isReturn) setReturnAddress(loc);
    else setPickup(loc);
    router.dismiss(2); // this page and the search page — back to car details
  };

  // Back to the place picked in search: map, pin and address.
  const reset = () => {
    Haptics.selectionAsync();
    lookup.current++;
    setResolving(false);
    web.current?.injectJavaScript(`map.setView([${start.latitude}, ${start.longitude}], 15); true;`);
  };

  const pickLabel = (l: string) => {
    Haptics.selectionAsync();
    setCustomOpen(false);
    setLabel((cur) => (cur === l ? '' : l));
  };

  return (
    <View style={[styles.screen, { backgroundColor: p.page }]}>
      <SafeAreaView edges={['top']} style={{ backgroundColor: p.page }}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} hitSlop={8} style={[styles.back, { backgroundColor: p.iconBg }]}>
            <Feather name="chevron-left" size={20} color={p.muted} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.headName, { color: p.fg }]} numberOfLines={1}>{resolving ? 'Finding address…' : place.name}</Text>
            <Text style={[styles.headAddr, { color: p.muted }]} numberOfLines={1}>{place.address}</Text>
          </View>
        </View>
      </SafeAreaView>

      <View style={styles.mapWrap}>
        {mapFailed ? (
          <View style={[styles.mapMsg, { backgroundColor: p.iconBg }]}>
            <Text style={[styles.mapMsgText, { color: p.muted }]}>Couldn't load the map. You can still confirm this address.</Text>
          </View>
        ) : (
          <WebView
            ref={web}
            source={{ html, baseUrl: 'https://mysawari.local/' }}
            originWhitelist={['*']}
            style={StyleSheet.absoluteFill}
            onMessage={(e) => {
              try {
                const m = JSON.parse(e.nativeEvent.data);
                if (m.type === 'ready') setMapReady(true);
                else if (m.type === 'move') setMoving(true);
                else if (m.type === 'center') onCenter(m.lat, m.lng, m.zoom);
              } catch {}
            }}
            onError={() => setMapFailed(true)}
            scrollEnabled={false}
            overScrollMode="never"
            setSupportMultipleWindows={false}
          />
        )}
        {!mapReady && !mapFailed && <ActivityIndicator style={StyleSheet.absoluteFill} color={p.muted} />}
        {/* Centre pin: drawn above the map (touches pass through), lifts while the map moves */}
        {!mapFailed && (
          <View pointerEvents="none" style={styles.pinLayer}>
            <View style={{ alignItems: 'center', transform: [{ translateY: moving ? -8 : 0 }] }}>
              <Ionicons name="location" size={44} color={p.navy} />
            </View>
            <View style={[styles.pinShadow, { opacity: moving ? 0.15 : 0.3 }]} />
          </View>
        )}
        {moved && !mapFailed && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reset map to the selected place"
            onPress={reset}
            hitSlop={6}
            style={({ pressed }) => [styles.reset, { backgroundColor: p.page, borderColor: p.border }, pressed && { opacity: 0.8 }]}
          >
            <Text style={[styles.resetText, { color: p.muted }]}>Reset</Text>
          </Pressable>
        )}
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={[styles.card, { backgroundColor: p.page, borderColor: p.deliveryBorder, paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <Text style={[styles.title, { color: p.fg }]}>{isReturn ? 'Set Drop-off location' : 'Set Pickup location'}</Text>
          <TextInput
            value={details}
            onChangeText={setDetails}
            placeholder="Flat / house no., floor, landmark"
            placeholderTextColor={p.muted}
            onFocus={() => setFocus('details')}
            onBlur={() => setFocus((f) => (f === 'details' ? null : f))}
            selectionColor={p.fg}
            style={[styles.input, { borderColor: focus === 'details' ? p.muted : p.strongBorder, color: p.fg }]}
            accessibilityLabel="Flat, house number or landmark"
            returnKeyType="done"
          />

          <Text style={[styles.saveAs, { color: p.fg }]}>Save address as</Text>
          <View style={styles.chips}>
            {PRESET_LABELS.map((l) => {
              const on = !customOpen && label === l;
              return (
                <Pressable
                  key={l}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  onPress={() => pickLabel(l)}
                  style={[styles.chip, { borderColor: on ? p.navy : p.strongBorder, backgroundColor: p.page }]}
                >
                  <Text style={[styles.chipText, { color: on ? p.navy : customOpen ? p.muted : p.sub }]}>{l}</Text>
                </Pressable>
              );
            })}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={customOpen ? 'Cancel custom name' : 'Custom name'}
              onPress={() => {
                // + opens a "Type here" box for any name; × closes it and drops that name.
                Haptics.selectionAsync();
                setLabel('');
                setCustomOpen((o) => !o);
              }}
              style={[styles.plus, { borderColor: p.strongBorder, backgroundColor: p.page }]}
            >
              <Feather name={customOpen ? 'x' : 'plus'} size={18} color={p.fg} />
            </Pressable>
          </View>
          {customOpen && (
            <TextInput
              value={label}
              onChangeText={setLabel}
              placeholder="Type here"
              placeholderTextColor={p.muted}
              onFocus={() => setFocus('label')}
              onBlur={() => setFocus((f) => (f === 'label' ? null : f))}
              selectionColor={p.fg}
              style={[styles.input, styles.customInput, { borderColor: focus === 'label' ? p.muted : p.strongBorder, color: p.fg }]}
              accessibilityLabel="Address name"
              maxLength={30}
              autoFocus
              returnKeyType="done"
            />
          )}

          <Pressable
            accessibilityRole="button"
            onPress={confirm}
            disabled={resolving}
            style={({ pressed }) => [styles.button, { backgroundColor: p.navy }, (pressed || resolving) && { opacity: 0.85 }]}
          >
            <Text style={[styles.buttonText, { color: p.onNavy }]}>{isReturn ? 'Confirm Drop-off' : 'Confirm Pick-up'}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingHorizontal: 16, paddingVertical: 12 },
  back: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  headName: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  headAddr: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  mapWrap: { flex: 1, marginBottom: -24 }, // the card's rounded top sits over the map
  mapMsg: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  mapMsgText: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center' },
  pinLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', paddingBottom: 44 }, // pin tip on the map centre
  reset: { position: 'absolute', right: 16, bottom: 24 + 8, height: 31, paddingHorizontal: 12.5, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  resetText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  pinShadow: { width: 14, height: 5, borderRadius: 7, backgroundColor: '#000', marginTop: -4 },
  card: { borderTopWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 22 },
  title: { fontFamily: 'Inter_500Medium', fontSize: 18 },
  input: { height: 48.5, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12.5, marginTop: 14, fontFamily: 'Inter_400Regular', fontSize: 15 },
  customInput: { height: 42.5, marginTop: 8.5, fontSize: 14 },
  saveAs: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 18 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chip: { flex: 1, height: 33.5, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  plus: { width: 37.5, height: 33.5, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  button: { height: 53, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 17 },
  buttonText: { fontFamily: 'Inter_500Medium', fontSize: 17 },
});
