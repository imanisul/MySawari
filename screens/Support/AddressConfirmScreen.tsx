import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, ActivityIndicator, Platform, Keyboard, Alert, Animated, ScrollView } from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { API } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';
import type { LocationResult } from '@/utils/sawari';
import { saveAddress, replaceSavedAddress } from '@/utils/savedAddresses';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { GOOGLE_MAPS_KEY, hasGoogleMaps, NORTHEAST_BOUNDS, googleReverseGeocode, inNortheastBox } from '@/services/maps/google';
import * as Location from 'expo-location';
import { usePlaceSearch, type SearchPlace } from '@/hooks/usePlaceSearch';

const PRESET_LABELS = ['Home', 'Work', 'Trip'];

/**
 * The map inside the WebView. Google Maps (JavaScript API) when a key is set; if Google fails to load or
 * refuses the key, Leaflet + CARTO tiles (OpenStreetMap data) take over, so the page always has a map.
 * Either way it posts the centre back after every move and exposes window.goTo(lat, lng, zoom).
 */
function mapHtml(lat: number, lng: number) {
  const [[s, w], [n, e]] = NORTHEAST_BOUNDS;
  return `<!doctype html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>html,body,#map{margin:0;height:100%;width:100%;background:#F5F3EF}
.leaflet-control-attribution{font-size:8px;opacity:.7}
.gm-style-cc,.gmnoprint a{font-size:8px!important}</style>
</head><body><div id="map"></div>
<script>
  var post = function (m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
  var START = { lat: ${lat}, lng: ${lng} };
  var usingLeaflet = false, done = false;
  window.goTo = function () {};

  function leaflet() {
    if (usingLeaflet) return; usingLeaflet = true;
    document.getElementById('map').innerHTML = '';
    var css = document.createElement('link'); css.rel = 'stylesheet'; css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'; document.head.appendChild(css);
    var js = document.createElement('script'); js.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    js.onerror = function () { post({ type: 'failed' }); };
    js.onload = function () {
      var el = document.getElementById('map'); el.parentNode.replaceChild(el.cloneNode(false), el);
      var bounds = L.latLngBounds([[${s}, ${w}], [${n}, ${e}]]);
      var map = L.map('map', { zoomControl: false, minZoom: 7, maxZoom: 19, maxBounds: bounds, maxBoundsViscosity: 1 }).setView([START.lat, START.lng], 16);
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 19, bounds: bounds, attribution: '&copy; OpenStreetMap &copy; CARTO' }).addTo(map);
      map.on('movestart', function () { post({ type: 'move' }); });
      map.on('moveend', function () { var c = map.getCenter(); post({ type: 'center', lat: c.lat, lng: c.lng, zoom: map.getZoom() }); });
      window.goTo = function (la, ln, z) { map.setView([la, ln], z || 16); };
      post({ type: 'ready', provider: 'osm' });
    };
    document.head.appendChild(js);
  }

  window.gm_authFailure = function () { leaflet(); };   // key refused / API not enabled
  window.initGoogle = function () {
    if (usingLeaflet) return;
    try {
      var map = new google.maps.Map(document.getElementById('map'), {
        center: START, zoom: 16, disableDefaultUI: true, clickableIcons: false, gestureHandling: 'greedy',
        minZoom: 7, maxZoom: 20, backgroundColor: '#F5F3EF',
        restriction: { latLngBounds: { south: ${s}, west: ${w}, north: ${n}, east: ${e} }, strictBounds: false },
        styles: [
          { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
          { featureType: 'poi', elementType: 'labels.icon', stylers: [{ saturation: -60 }] },
          { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] }
        ]
      });
      var moving = false;
      map.addListener('dragstart', function () { moving = true; post({ type: 'move' }); });
      map.addListener('zoom_changed', function () { if (!moving) { moving = true; post({ type: 'move' }); } });
      map.addListener('idle', function () {
        moving = false;
        var c = map.getCenter();
        if (!done) { done = true; post({ type: 'ready', provider: 'google' }); }
        post({ type: 'center', lat: c.lat(), lng: c.lng(), zoom: map.getZoom() });
      });
      window.goTo = function (la, ln, z) { map.panTo({ lat: la, lng: ln }); map.setZoom(z || 16); };
    } catch (err) { leaflet(); }
  };

  ${hasGoogleMaps ? `
  var g = document.createElement('script');
  g.src = 'https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_KEY}&callback=initGoogle&loading=async&region=IN&language=en';
  g.async = true; g.onerror = leaflet; document.head.appendChild(g);
  setTimeout(function () { if (!done && !usingLeaflet) leaflet(); }, 9000);` : 'leaflet();'}
</script></body></html>`;
}

/**
 * Figma "Set Pickup location": a full-screen map centred on the place picked in search, with a fixed pin the
 * customer moves the map under. The card shows the full address under the pin, house / flat details, a
 * "Save address as" tag and Confirm. Sets the pick-up or drop-off address (?kind=pickup|return) and returns
 * to the page that opened the search.
 */
export default function AddressConfirmScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ kind?: string; id?: string; name?: string; address?: string; lat?: string; lng?: string; label?: string; locate?: string; editId?: string }>();
  const isReturn = params.kind === 'return';
  const isSaveOnly = params.kind === 'save';
  const { setPickup, setReturnAddress, customer, isAuthenticated } = useSawari();

  const start = useMemo(() => ({ latitude: Number(params.lat), longitude: Number(params.lng) }), []);
  const [place, setPlace] = useState({ id: params.id || `pin_${Date.now()}`, name: params.name || 'Selected location', address: params.address || '', ...start });
  const [moving, setMoving] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const [mapFailed, setMapFailed] = useState(false);
  // The address box fills itself from the place under the pin (design "Airport - 102") until the customer
  // types in it; from then on their text is kept and the full address under it still follows the pin.
  const [details, setDetails] = useState('');
  const [edited, setEdited] = useState(false);
  const [focus, setFocus] = useState<'details' | 'label' | null>(null); // the box being typed in gets the darker border
  const [label, setLabel] = useState(params.label || '');
  const [customOpen, setCustomOpen] = useState(!!params.label && !PRESET_LABELS.includes(params.label));
  const [locating, setLocating] = useState(false);
  const lookup = useRef(0);
  const [moved, setMoved] = useState(false); // map panned or zoomed away from the picked place → show Reset
  const web = useRef<WebView>(null);
  const html = useMemo(() => mapHtml(start.latitude, start.longitude), []);
  // One source object for the life of the page: a new object on every render made the WebView reload the
  // map (back to the start point) each time the address updated — the "map keeps jumping" bug.
  const source = useMemo(() => ({ html, baseUrl: 'https://mysawari.local/' }), [html]);

  // The map keeps one fixed height (screen minus the card, measured once): the keyboard or a growing card
  // slides over it instead of resizing it, so the point under the pin never shifts by itself.
  const [screenH, setScreenH] = useState(0);
  const [cardH, setCardH] = useState(0);
  const [mapH, setMapH] = useState(0);
  useEffect(() => {
    if (!mapH && screenH > 0 && cardH > 0) setMapH(Math.max(240, screenH - cardH + 24));
  }, [screenH, cardH, mapH]);
  const kb = useRef(new Animated.Value(0)).current;

  // ── Search on the map: typing finds places; picking one moves the map there and shows its address ──
  const [search, setSearch] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchOpenRef = useRef(false);
  const searchInput = useRef<TextInput>(null);
  const { results: found, loading: searching, failed: searchFailed, resolve } = usePlaceSearch(searchOpen ? search : '');
  const [jumping, setJumping] = useState<string | null>(null);
  // The place picked in search: when the map settles on it, its own name and address are used (instead of
  // the nearest street the reverse lookup would give).
  const pending = useRef<{ id: string; name: string; address: string; latitude: number; longitude: number } | null>(null);
  const openSearch = (open: boolean) => { searchOpenRef.current = open; setSearchOpen(open); };

  useEffect(() => {
    // iOS: lift the card above the keyboard (Android resizes the window itself). Not for the map search,
    // whose results show at the top while the card is hidden.
    if (Platform.OS !== 'ios') return;
    const show = Keyboard.addListener('keyboardWillShow', (e) => { if (!searchOpenRef.current) Animated.timing(kb, { toValue: -(e.endCoordinates.height - insets.bottom), duration: e.duration || 220, useNativeDriver: true }).start(); });
    const hide = Keyboard.addListener('keyboardWillHide', (e) => Animated.timing(kb, { toValue: 0, duration: e.duration || 220, useNativeDriver: true }).start());
    return () => { show.remove(); hide.remove(); };
  }, [kb, insets.bottom]);

  // The address under a map point: Google first, then the OpenStreetMap lookup.
  const addressAt = async (lat: number, lng: number) => {
    if (hasGoogleMaps) {
      try {
        const g = await googleReverseGeocode(lat, lng);
        if (g) return g;
      } catch {}
    }
    const o: any = await API.reverseGeocode(lat, lng);
    return o ? { name: o.name as string, address: o.address as string } : null;
  };

  // Opened from "Use my current location": fill in the address of that point straight away.
  useEffect(() => {
    if (params.locate === '1' || !params.address) onCenter(start.latitude, start.longitude, 16, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The pin stays in the middle; when the map stops, the place under it becomes the address.
  const onCenter = async (lat: number, lng: number, zoom?: number, force = false) => {
    setMoving(false);
    const pick = pending.current;
    if (pick && Math.abs(lat - pick.latitude) < 0.0003 && Math.abs(lng - pick.longitude) < 0.0003) {
      pending.current = null;
      lookup.current++;
      setResolving(false);
      setMoved(true);
      setPlace({ ...pick });
      return;
    }
    const unmoved = Math.abs(lat - start.latitude) < 0.0002 && Math.abs(lng - start.longitude) < 0.0002;
    setMoved(!unmoved || (zoom !== undefined && zoom !== 16));
    if (unmoved && !force && params.address) {
      lookup.current++;
      setResolving(false);
      setPlace({ id: params.id || place.id, name: params.name || place.name, address: params.address || place.address, ...start });
      return;
    }
    const n = ++lookup.current;
    setPlace((cur) => ({ ...cur, id: unmoved ? cur.id : `pin_${lat.toFixed(5)}_${lng.toFixed(5)}`, latitude: lat, longitude: lng }));
    setResolving(true);
    try {
      const found = await addressAt(lat, lng);
      if (n === lookup.current && found) setPlace((cur) => ({ ...cur, name: found.name || cur.name, address: found.address || cur.address }));
    } catch {}
    if (n === lookup.current) setResolving(false);
  };

  const confirm = async () => {
    Haptics.selectionAsync();
    Keyboard.dismiss();
    if (!inNortheastBox(place.latitude, place.longitude)) {
      Alert.alert('Outside our area', 'We deliver only in the northeast. Please move the pin there.');
      return;
    }
    const typed = edited ? details.trim() : '';
    const loc: LocationResult = {
      id: place.id,
      name: typed || place.name,
      address: place.address || place.name,
      latitude: place.latitude,
      longitude: place.longitude,
      source: 'osm',
    };
    const uid = isAuthenticated ? customer?.id : null;
    if (isSaveOnly && params.editId) await replaceSavedAddress(uid, params.editId, loc, label.trim() || undefined);
    else await saveAddress(uid, loc, label.trim() || undefined);
    // Profile → Saved Addresses → Add (?kind=save) only saves it; otherwise it becomes the trip's address.
    if (isSaveOnly) { /* saved above */ }
    else if (isReturn) setReturnAddress(loc);
    else setPickup(loc);
    router.dismiss(2); // this page and the search page — back to the page that asked for the address
  };

  const goTo = (lat: number, lng: number) => web.current?.injectJavaScript(`window.goTo(${lat}, ${lng}, 16); true;`);

  // A search result: move the map to it; the pin, the address box and the full address follow.
  const jumpTo = async (item: SearchPlace) => {
    if (jumping) return;
    Haptics.selectionAsync();
    setJumping(item.id);
    try {
      const t = await resolve(item);
      Keyboard.dismiss();
      searchInput.current?.blur();
      openSearch(false);
      setSearch('');
      setEdited(false); // the address box takes the new place's name
      setDetails('');
      pending.current = { id: t.id, name: t.name, address: t.address, latitude: t.latitude, longitude: t.longitude };
      setPlace(pending.current);
      if (mapFailed || !mapReady) { pending.current = null; return; }
      goTo(t.latitude, t.longitude);
    } catch (e: any) {
      Alert.alert(e?.message === 'outside' ? 'Outside our area' : "Couldn't open this place",
        e?.message === 'outside' ? 'We deliver only in the northeast. Please pick a place there.' : 'Please check your connection and try again.');
    } finally {
      setJumping(null);
    }
  };
  const closeSearch = () => { Keyboard.dismiss(); searchInput.current?.blur(); openSearch(false); setSearch(''); };

  // Back to the place picked in search: map, pin and address.
  const reset = () => {
    Haptics.selectionAsync();
    goTo(start.latitude, start.longitude);
  };

  // Moves the map to where the customer is now.
  const locateMe = async () => {
    Haptics.selectionAsync();
    setLocating(true);
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Location off', 'Allow location access to move the pin to where you are.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      if (!inNortheastBox(pos.coords.latitude, pos.coords.longitude)) {
        Alert.alert('Outside our area', 'You seem to be outside the northeast, where we deliver.');
        return;
      }
      goTo(pos.coords.latitude, pos.coords.longitude);
    } catch {
      Alert.alert("Couldn't find you", 'Please move the map to your address instead.');
    } finally {
      setLocating(false);
    }
  };

  const pickLabel = (l: string) => {
    Haptics.selectionAsync();
    setCustomOpen(false);
    setLabel((cur) => (cur === l ? '' : l));
  };

  const autoText = resolving ? '' : place.name;
  const inputValue = edited ? details : autoText;

  return (
    <View style={[styles.screen, { backgroundColor: p.page }]} onLayout={(e) => { if (!screenH) setScreenH(e.nativeEvent.layout.height); }}>
      {/* ── Map (fixed height, under the card) ── */}
      <View style={[styles.mapWrap, mapH ? { height: mapH } : { bottom: 0 }]}>
        {mapFailed ? (
          <View style={[styles.mapMsg, { backgroundColor: p.iconBg }]}>
            <Text style={[styles.mapMsgText, { color: p.muted }]}>Couldn't load the map. You can still save this address.</Text>
          </View>
        ) : mapH === 0 ? null : (
          // Drawn only once its final size is known, so it never resizes (and shifts) after loading.
          <WebView
            ref={web}
            source={source}
            originWhitelist={['*']}
            style={StyleSheet.absoluteFill}
            onMessage={(e) => {
              try {
                const m = JSON.parse(e.nativeEvent.data);
                if (m.type === 'ready') setMapReady(true);
                else if (m.type === 'failed') setMapFailed(true);
                else if (m.type === 'move') setMoving(true);
                else if (m.type === 'center') onCenter(m.lat, m.lng, m.zoom);
              } catch {}
            }}
            onError={() => setMapFailed(true)}
            scrollEnabled={false}
            overScrollMode="never"
            setSupportMultipleWindows={false}
            javaScriptEnabled
            domStorageEnabled
          />
        )}
        {!mapReady && !mapFailed && <ActivityIndicator style={StyleSheet.absoluteFill} color={p.muted} />}

        {/* Centre pin, its tip on the centre of the visible map (the card covers its bottom 24) */}
        {!mapFailed && (
          <View pointerEvents="none" style={styles.pinLayer}>
            <View style={{ alignItems: 'center', transform: [{ translateY: moving ? -8 : 0 }] }}>
              <Ionicons name="location" size={46} color={p.navy} />
            </View>
            <View style={[styles.pinShadow, { opacity: moving ? 0.12 : 0.25 }]} />
          </View>
        )}


        {!mapFailed && (
          <View style={styles.mapButtons}>
            {moved && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Back to the place you searched"
                onPress={reset}
                hitSlop={6}
                style={({ pressed }) => [styles.reset, styles.shadow, { backgroundColor: p.page }, pressed && { opacity: 0.8 }]}
              >
                <Feather name="rotate-ccw" size={13} color={p.sub} />
                <Text style={[styles.resetText, { color: p.sub }]}>Reset</Text>
              </Pressable>
            )}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Move to my current location"
              onPress={locateMe}
              disabled={locating}
              style={({ pressed }) => [styles.locate, styles.shadow, { backgroundColor: p.page }, pressed && { opacity: 0.8 }]}
            >
              {locating ? <ActivityIndicator size="small" color={p.navy} /> : <MaterialCommunityIcons name="crosshairs-gps" size={18} color={p.fg} />}
            </Pressable>
          </View>
        )}
      </View>

      {/* ── Top: back + search on the map, with the results under it ── */}
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={searchOpen ? 'Close search' : 'Back'}
          onPress={() => (searchOpen ? closeSearch() : router.back())}
          hitSlop={8}
          style={[styles.round, styles.shadow, { backgroundColor: p.page }]}
        >
          <Feather name={searchOpen ? 'x' : 'chevron-left'} size={searchOpen ? 19 : 22} color={p.fg} />
        </Pressable>
        <View style={[styles.searchBar, styles.shadow, { backgroundColor: p.page, borderColor: searchOpen ? p.muted : p.border }]}>
          <Feather name="search" size={16} color={p.muted} />
          <TextInput
            ref={searchInput}
            value={search}
            onChangeText={setSearch}
            onFocus={() => openSearch(true)}
            placeholder="Search area, street or landmark"
            placeholderTextColor={p.muted}
            selectionColor={p.fg}
            autoCorrect={false}
            returnKeyType="search"
            onSubmitEditing={() => { if (found[0]) jumpTo(found[0]); }}
            style={[styles.searchInput, { color: p.fg }]}
            accessibilityLabel="Search an address to move the map"
          />
          {searching ? <ActivityIndicator size="small" color={p.muted} /> : search.length > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Clear search" onPress={() => setSearch('')} hitSlop={10}>
              <Feather name="x-circle" size={16} color={p.muted} />
            </Pressable>
          ) : null}
        </View>
      </View>
      {searchOpen && search.trim().length >= 2 && (
        <View style={[styles.results, styles.shadow, { top: insets.top + 8 + 48, backgroundColor: p.page, borderColor: p.border }]}>
          <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
            {found.length === 0 ? (
              <Text style={[styles.resultsEmpty, { color: p.muted }]}>
                {searching ? 'Searching…' : searchFailed ? "Couldn't search right now. Check your connection." : 'No places found in our delivery area. Try a nearby landmark.'}
              </Text>
            ) : found.slice(0, 6).map((item, i) => (
              <Pressable
                key={`${item.id}-${i}`}
                accessibilityRole="button"
                accessibilityLabel={`${item.name}, ${item.address}`}
                onPress={() => jumpTo(item)}
                style={({ pressed }) => [styles.resultRow, i > 0 && { borderTopWidth: 1, borderTopColor: p.divider }, pressed && { backgroundColor: p.soft }]}
              >
                <View style={[styles.resultPin, { backgroundColor: p.iconBg }]}>
                  <Ionicons name="location" size={16} color="#A3A3A3" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={[styles.resultName, { color: p.fg }]} numberOfLines={1}>{item.name}</Text>
                  {!!item.address && <Text style={[styles.resultAddr, { color: p.muted }]} numberOfLines={1}>{item.address}</Text>}
                </View>
                {jumping === item.id && <ActivityIndicator size="small" color={p.muted} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      )}

      {/* ── Card (hidden while searching on the map) ── */}
      <Animated.View
        pointerEvents={searchOpen ? 'none' : 'auto'}
        onLayout={(e) => { if (!cardH) setCardH(e.nativeEvent.layout.height); }}
        style={[styles.card, { backgroundColor: p.page, borderColor: p.border, paddingBottom: Math.max(insets.bottom, 16) + 8, transform: [{ translateY: kb }], opacity: searchOpen ? 0 : 1 }]}
      >
        <Text style={[styles.title, { color: p.fg }]}>{isSaveOnly ? 'Address Details' : isReturn ? 'Set Drop-off location' : 'Set Pickup location'}</Text>

        <TextInput
          value={inputValue}
          onChangeText={(t) => { setDetails(t); setEdited(true); }}
          onFocus={() => { setFocus('details'); if (!edited) { setDetails(autoText); setEdited(true); } }}
          onBlur={() => setFocus((f) => (f === 'details' ? null : f))}
          placeholder={resolving ? 'Finding address…' : 'House / flat no., building, area'}
          placeholderTextColor={p.muted}
          selectionColor={p.fg}
          style={[styles.input, { borderColor: focus === 'details' ? p.muted : p.strongBorder, color: edited ? p.fg : p.sub }]}
          accessibilityLabel="Address name, house or flat number"
          returnKeyType="done"
        />
        {/* The full address under the pin, so the customer can see exactly where it is */}
        <Text style={[styles.fullAddr, { color: p.muted }]} numberOfLines={2}>
          {resolving ? 'Finding the address at the pin…' : place.address || 'Move the map to put the pin on your address.'}
        </Text>

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
          disabled={resolving || moving}
          style={({ pressed }) => [styles.button, { backgroundColor: p.navy }, (pressed || resolving || moving) && { opacity: 0.85 }]}
        >
          <Text style={[styles.buttonText, { color: p.onNavy }]}>{isSaveOnly ? 'Save Address' : isReturn ? 'Confirm Drop-off' : 'Confirm Pick-up'}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  mapWrap: { position: 'absolute', top: 0, left: 0, right: 0 },
  mapMsg: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  mapMsgText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, textAlign: 'center' },
  // Pin tip on the centre of the part of the map above the card (the card overlaps the map by 24).
  pinLayer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 24, alignItems: 'center', justifyContent: 'center', paddingBottom: 46 },
  pinShadow: { width: 14, height: 5, borderRadius: 7, backgroundColor: '#000', marginTop: -5 },
  topBar: { position: 'absolute', left: 16, right: 16, flexDirection: 'row', alignItems: 'center', gap: 8, zIndex: 5 },
  searchBar: { flex: 1, height: 40, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14 },
  searchInput: { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, paddingVertical: 0 },
  results: { position: 'absolute', left: 16, right: 16, maxHeight: 320, borderRadius: 12, borderWidth: 1, overflow: 'hidden', zIndex: 6 },
  resultsEmpty: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, textAlign: 'center', padding: 16 },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, paddingVertical: 10 },
  resultPin: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  resultName: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13.5 },
  resultAddr: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11.5, marginTop: 2 },
  round: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  shadow: { shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  mapButtons: { position: 'absolute', right: 16, bottom: 24 + 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  locate: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  reset: { height: 34, paddingHorizontal: 13, borderRadius: 17, flexDirection: 'row', alignItems: 'center', gap: 6 },
  resetText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },
  card: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 22 },
  title: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 18.5 },
  input: { height: 50, borderWidth: 1, borderRadius: 8, paddingHorizontal: 13, marginTop: 14, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16 },
  fullAddr: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11.5, lineHeight: 16, marginTop: 6, paddingHorizontal: 2 },
  customInput: { height: 44, marginTop: 8.5, fontSize: 14 },
  saveAs: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, marginTop: 16 },
  chips: { flexDirection: 'row', gap: 8, marginTop: 10 },
  chip: { flex: 1, height: 34, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12.5 },
  plus: { width: 38, height: 34, borderWidth: 1, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  button: { height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 16 },
  buttonText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 17.5 },
});