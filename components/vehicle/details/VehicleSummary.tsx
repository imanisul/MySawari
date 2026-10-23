import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Easing } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { Car, MIN_PUBLIC_REVIEW_RATING } from '@/utils/sawari';
import { API } from '@/services/backend/api';
import { PICKUP_DROP_RATE_PER_KM } from '@/services/backend/pricingEngine';
import { useSawari } from '@/context/SawariContext';
import { useDetailsPalette } from './detailsPalette';
import { AddressPickerSheet } from './AddressPickerSheet';
import { getSavedAddresses, saveAddress, SavedAddress } from '@/utils/savedAddresses';

/**
 * Top of the car details page: the demand / availability strip, the name card with rating, and the
 * Delivery & Pickup switch (the same flag the booking flow prices from).
 */
export function VehicleSummary({ car, isAvailable, unavailableNote, highDemand }: {
  car: Car;
  isAvailable: boolean;
  /** e.g. "Booked on these dates. Next available from 20 Nov." */
  unavailableNote?: string;
  highDemand?: boolean;
}) {
  const p = useDetailsPalette();
  const { isDeliveryRequested, setIsDeliveryRequested } = useSawari();

  // Same query key as the reviews section, so this costs no extra request.
  const { data: dbReviews = [] } = useQuery({
    queryKey: ['carReviews', car.id],
    queryFn: () => API.reviews.fetchByCarId(car.id),
    staleTime: 60 * 1000,
  });
  const allReviews = [...(car.reviews || []), ...dbReviews].filter(r => r.rating >= MIN_PUBLIC_REVIEW_RATING);
  const averageRating = allReviews.length > 0 ? allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length : null;
  const displayRating = car.rating ?? averageRating;
  const displayCount = car.reviewCount ? car.reviewCount + dbReviews.length : allReviews.length;

  const brand = car.manufacturer || car.name.split(' ')[0];
  const modelName = [car.model, car.variant].filter(Boolean).join(' ') || car.displayName || car.name;
  const seats = /seat/i.test(car.seats) ? car.seats : `${car.seats} seats`;
  const meta = [car.transmission, car.fuel, car.type === 'Bike' ? null : seats].filter(Boolean) as string[];

  return (
    <View style={styles.container}>
      {!isAvailable ? (
        <View style={[styles.banner, { backgroundColor: p.redBg, borderColor: p.redBorder }]}>
          <Text style={[styles.bannerText, { color: p.red }]}>{unavailableNote || 'Not available for these dates'}</Text>
        </View>
      ) : highDemand ? (
        <View style={[styles.banner, { backgroundColor: p.demandBg, borderColor: p.demandBorder }]}>
          {/* Two items in the row, 10 apart, as the frame's gap specifies. */}
          <Text style={styles.bannerIcon}>🔥</Text>
          <Text style={[styles.bannerText, { color: p.amber }]} numberOfLines={1}>High Demand for these dates</Text>
        </View>
      ) : null}

      <View style={[styles.summaryCard, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.brand, { color: p.muted }]}>{brand}</Text>
          <Text style={[styles.name, { color: p.fg }]} numberOfLines={2}>{modelName}</Text>
          <View style={styles.metaRow}>
            {meta.map((m, i) => (
              <React.Fragment key={m + i}>
                {i > 0 && <View style={[styles.metaDot, { backgroundColor: p.navy }]} />}
                <Text style={[styles.meta, { color: p.navy }]}>{m}</Text>
              </React.Fragment>
            ))}
          </View>
        </View>
        {displayRating !== null && displayCount > 0 && (
          <View style={styles.ratingCol}>
            <View style={[styles.ratingPill, { backgroundColor: p.navy }]}>
              <Text style={[styles.ratingText, { color: p.onNavy }]}>{displayRating.toFixed(1)}</Text>
              <Ionicons name="star" size={11} color={p.star} />
            </View>
            <Text style={[styles.reviewCount, { color: p.sub }]}>({displayCount} {displayCount === 1 ? 'Review' : 'Reviews'})</Text>
          </View>
        )}
      </View>

      <View style={[styles.deliveryCard, { borderColor: p.deliveryBorder, backgroundColor: p.page }]}>
        <View style={styles.deliveryHead}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.deliveryTitle, { color: p.fg }]}>Delivery & Pickup</Text>
            {/* The design shows "Base Price ₹200 + Additional ₹5k/km", which matches nothing we charge:
                there is no base fee and the rate is ₹20/km (pricingEngine). Keep the real number. */}
            <Text style={[styles.deliverySub, { color: p.muted }]}>No base fee • ₹{PICKUP_DROP_RATE_PER_KM}/km from our Kahilipara hub to your address</Text>
          </View>
          <Toggle
            label="Delivery and pickup"
            value={isDeliveryRequested}
            onChange={(v) => { Haptics.selectionAsync(); setIsDeliveryRequested(v); }}
            onColor={p.navy}
          />
        </View>
        {isDeliveryRequested && <DeliveryOptions />}
      </View>
    </View>
  );
}

const MODES: { key: 'both' | 'delivery' | 'return'; label: string }[] = [
  { key: 'both', label: 'Both' },
  { key: 'delivery', label: 'Pick-up' }, // we bring the car to you at the start
  { key: 'return', label: 'Drop-off' }, // we collect it from you at the end
];

/**
 * Shown when Delivery & Pickup is on: which service (both / pick-up / drop-off) and where. Uses the same
 * delivery mode and addresses the booking and pricing use; addresses are chosen on the existing
 * /location (pick-up) and /return-location (drop-off) screens.
 */
function DeliveryOptions() {
  const p = useDetailsPalette();
  const router = useRouter();
  const { deliveryMode, setDeliveryMode, pickup, setPickup, returnAddress, setReturnAddress } = useSawari();
  const [picking, setPicking] = useState<'pickup' | 'return' | null>(null);
  const { customer, isAuthenticated } = useSawari();
  const userId = isAuthenticated ? customer?.id : null;
  const [saved, setSaved] = useState<SavedAddress[]>([]);
  const labels = useRef<Record<string, string>>({}); // quick-pick tags, e.g. "Airport", saved with the address

  useEffect(() => { getSavedAddresses(userId).then(setSaved); }, [userId, picking]);

  // Remember every address chosen for delivery or collection (quick pick or full search).
  useEffect(() => {
    if (pickup && deliveryMode !== 'return') saveAddress(userId, pickup, labels.current[pickup.id]).then(setSaved);
  }, [pickup?.id]);
  useEffect(() => {
    if (returnAddress && deliveryMode !== 'delivery') saveAddress(userId, returnAddress, labels.current[returnAddress.id]).then(setSaved);
  }, [returnAddress?.id]);
  // Both starts with separate pick-up and drop-off rows; ticking the box merges them into one.
  const [sameAddress, setSameAddress] = useState(false);
  const shared = deliveryMode === 'both' && sameAddress;

  // One address for both services: drop-off follows the pick-up address.
  useEffect(() => {
    if (shared && pickup && pickup.id !== returnAddress?.id) setReturnAddress(pickup);
  }, [shared, pickup?.id]);

  // Address as shown on the row, with its saved tag first when it has one: "Trip - Lokpriya Gopinath …".
  const show = (loc?: { id: string; name: string } | null) => {
    if (!loc) return undefined;
    // The saved tag wins: it's the latest name the customer gave this place (map page or quick pick).
    const tag = saved.find((a) => a.id === loc.id)?.label || labels.current[loc.id];
    return tag ? `${tag} - ${loc.name}` : loc.name;
  };

  const rows: { label: string; value?: string; go: '/location' | '/return-location' }[] =
    deliveryMode === 'delivery' ? [{ label: 'Pick-up Location', value: show(pickup), go: '/location' }]
    : deliveryMode === 'return' ? [{ label: 'Drop-off', value: show(returnAddress), go: '/return-location' }]
    : shared ? [{ label: 'Pick-up & Delivery Location', value: show(pickup), go: '/location' }]
    : [
        { label: 'Pick-up Location', value: show(pickup), go: '/location' },
        { label: 'Drop-off', value: show(returnAddress), go: '/return-location' },
      ];

  return (
    <View>
      <View style={[styles.segBox, { borderColor: p.segBorder }]}>
        {MODES.map((m) => {
          const on = deliveryMode === m.key;
          return (
            <Pressable
              key={m.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => { Haptics.selectionAsync(); setDeliveryMode(m.key); }}
              style={[styles.seg, on && { backgroundColor: p.segOn, borderColor: p.segBorder }]}
            >
              <Text style={[styles.segText, on ? { color: p.navy, fontFamily: 'PlusJakartaSans_500Medium' } : { color: p.muted }]}>{m.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.locBox, { borderColor: p.segBorder }]}>
        <View style={styles.locRows}>
        {rows.map((r) => (
          <React.Fragment key={r.label}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${r.label}: ${r.value || 'add address'}`}
              onPress={() => { Haptics.selectionAsync(); setPicking(r.go === '/location' ? 'pickup' : 'return'); }}
              style={({ pressed }) => [styles.locRow, pressed && { opacity: 0.7 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.locLabel, { color: p.muted }]}>{r.label}</Text>
                {r.value ? (
                  <Text style={[styles.locValue, { color: p.fg }]} numberOfLines={1}>{r.value}</Text>
                ) : (
                  <Text style={[styles.locAdd, { color: p.navy }]}>Add address</Text>
                )}
              </View>
              <Feather name="chevron-right" size={20} color={p.muted} />
            </Pressable>
          </React.Fragment>
        ))}
        </View>
        {deliveryMode === 'both' && (
          <>
            <View style={[styles.locDivider, { backgroundColor: p.segBorder }]} />
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: sameAddress }}
              onPress={() => { Haptics.selectionAsync(); setSameAddress((v) => !v); }}
              style={styles.sameRow}
            >
              <View style={[styles.checkbox, sameAddress ? { borderColor: p.navy, backgroundColor: p.navy } : { borderColor: p.checkOff, backgroundColor: p.page }]}>
                {sameAddress && <Feather name="check" size={9} color="#FFFFFF" />}
              </View>
              <Text style={[styles.sameText, { color: p.muted }]}>Same delivery and pickup location</Text>
            </Pressable>
          </>
        )}
      </View>

      <Pressable accessibilityRole="link" onPress={() => router.push('/policies')} hitSlop={8} style={styles.keepRow}>
        <Text style={[styles.keepText, { color: p.muted }]}>Keep in mind</Text>
        <Feather name="chevron-right" size={13} color={p.muted} />
      </Pressable>

      <AddressPickerSheet
        visible={picking !== null}
        kind={picking ?? 'pickup'}
        onClose={() => setPicking(null)}
        saved={saved}
        onPick={(loc, label) => {
          if (label) labels.current[loc.id] = label;
          if (picking === 'pickup') setPickup(loc);
          else setReturnAddress(loc);
          setPicking(null);
        }}
        onAddAddress={() => {
          const kind = picking ?? 'pickup';
          setPicking(null);
          router.push({ pathname: '/address-search', params: { kind } });
        }}
      />
    </View>
  );
}

/** Small switch drawn to the design's size (38 × 20); the native Switch can't be sized like this. */
function Toggle({ label, value, onChange, onColor }: { label: string; value: boolean; onChange: (v: boolean) => void; onColor: string }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 180, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [value]);
  return (
    <Pressable accessibilityRole="switch" accessibilityLabel={label} accessibilityState={{ checked: value }} onPress={() => onChange(!value)} hitSlop={10}>
      <Animated.View style={[styles.track, { backgroundColor: anim.interpolate({ inputRange: [0, 1], outputRange: [TRACK_OFF, onColor] }) }]}>
        <Animated.View style={[styles.thumb, { transform: [{ translateX: anim.interpolate({ inputRange: [0, 1], outputRange: [0, 18] }) }] }]} />
      </Animated.View>
    </Pressable>
  );
}

const TRACK_OFF = '#D4D4D4';

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, gap: 8 },
  // Figma "Urgency Message": 361×39, border-box (the 1pt stroke sits inside that height) and flex-grow 0.
  // RN has no box-sizing, so this is the 359 content width -- 361 minus both strokes -- pinned rather than
  // stretched, which keeps the strip exactly as designed on every device instead of tracking the gutters.
  // Padding is 10px 0 only: no side inset, the row centres its items, gap 10 between them.
  banner: { borderWidth: 1, borderRadius: 8, alignSelf: 'center', width: 359, height: 39, paddingVertical: 10,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  bannerIcon: { fontSize: 12, lineHeight: 18 },
  bannerText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 18, textAlign: 'center' },
  summaryCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 11.5 },
  brand: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11 },
  // Semibold/lg in the design: weight 600 at 17px, on a 25px (150%) line like every role here, and
  // centred inside its box. numberOfLines={2} means one line sits at y=4 of this 25px row; a wrap fills
  // both rows. No tracking tweak -- the role specifies none.
  name: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 25, letterSpacing: 0, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: 4 },
  meta: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11 },
  metaDot: { width: 2.5, height: 2.5, borderRadius: 1.25, marginHorizontal: 7 },
  ratingCol: { alignItems: 'center', marginLeft: 10 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 14, paddingHorizontal: 10.5, height: 27.5 },
  ratingText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 25 },
  reviewCount: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, marginTop: 6 },
  deliveryCard: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12.5, paddingVertical: 12 },
  deliveryHead: { flexDirection: 'row', alignItems: 'center', paddingLeft: 0.5 },
  segBox: { flexDirection: 'row', gap: 16, borderWidth: 1, borderRadius: 8, padding: 4, marginTop: 16 },
  seg: { flex: 1, height: 34, borderRadius: 6, borderWidth: 1, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  segText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13.5 },
  locBox: { borderWidth: 1, borderRadius: 10, marginTop: 8 },
  locRows: { paddingTop: 8, paddingBottom: 5, gap: 9 },
  locRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8.5 },
  locLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12 },
  locAdd: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12.5, textDecorationLine: 'underline', marginTop: 3 },
  locValue: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12.5, marginTop: 3 },
  locDivider: { height: 1, marginHorizontal: 8 },
  sameRow: { flexDirection: 'row', alignItems: 'center', gap: 8.5, paddingHorizontal: 9.5, height: 36 },
  checkbox: { width: 12.5, height: 12.5, borderRadius: 2.5, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  sameText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13 },
  keepRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-end', gap: 4, marginTop: 10 },
  keepText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12 },
  track: { width: 38, height: 20, borderRadius: 10, padding: 2, justifyContent: 'center' },
  thumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 2 },
  deliveryTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 25 },
  deliverySub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11.5, marginTop: 5 },
});
