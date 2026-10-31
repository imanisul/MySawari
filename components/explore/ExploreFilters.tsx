import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useQueries } from '@tanstack/react-query';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Car, MIN_PUBLIC_REVIEW_RATING, parseDayLabel } from '@/utils/sawari';
import { API } from '@/services/backend/api';
import { useDetailsPalette, DetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { ModalBlur } from '@/components/common/ModalBlur';

/**
 * Explore filters and sorting (design: "Filter" sheet with Budget / Car Details / Fuel / Ratings / Brands /
 * Features, and the sort sheet: Recommended / Price / Rating).
 *
 * Every option is matched against fields the backend sends for each vehicle (GET /api/vehicles, mapped in
 * services/backend/api.ts → mapVehicles): pricePerDay, vehicleType, transmission, fuelType, manufacturer and the
 * feature flags (ac, carPlay, sunroof …). Ratings come from the vehicle's public reviews (GET /api/reviews/:id).
 * The counts next to options are counted from the same list, so they always match what the list will show.
 */

// ── Filter state ─────────────────────────────────────────────────────────────

export type SortKey = 'recommended' | 'price-asc' | 'price-desc' | 'rating';

export type ExploreFilters = {
  budget: string | null;
  body: string | null;
  transmission: string | null;
  fuel: string | null;
  rating: string | null;
  brand: string | null;
  features: string[];
};

export const EMPTY_FILTERS: ExploreFilters = { budget: null, body: null, transmission: null, fuel: null, rating: null, brand: null, features: [] };

export const countActive = (f: ExploreFilters) =>
  [f.budget, f.body, f.transmission, f.fuel, f.rating, f.brand].filter(Boolean).length + (f.features.length ? 1 : 0);

const BUDGETS: { key: string; label: string; min: number; max: number }[] = [
  { key: 'u1000', label: 'Under 1000', min: 0, max: 999 },
  { key: '1000-1500', label: '1000 to 1500', min: 1000, max: 1500 },
  { key: '1500-2000', label: '1500 to 2000', min: 1501, max: 2000 },
  { key: '2000-2500', label: '2000 to 2500', min: 2001, max: 2500 },
  { key: '2500-3000', label: '2500 to 3000', min: 2501, max: 3000 },
  { key: '3000+', label: '3000 and above', min: 3001, max: Infinity },
];

// Bikes rent for far less than cars (₹400–1,200 a day), so they get their own, lower ranges.
const BIKE_BUDGETS: { key: string; label: string; min: number; max: number }[] = [
  { key: 'bu500', label: 'Under 500', min: 0, max: 499 },
  { key: 'b500-700', label: '500 to 700', min: 500, max: 700 },
  { key: 'b700-900', label: '700 to 900', min: 701, max: 900 },
  { key: 'b900-1100', label: '900 to 1100', min: 901, max: 1100 },
  { key: 'b1100+', label: '1100 and above', min: 1101, max: Infinity },
];
const ALL_BUDGETS = [...BUDGETS, ...BIKE_BUDGETS];

// Body types in the design's order; any other type the fleet has (Luxury, Bike …) is listed after them.
const BODY_ORDER: { key: string; label: string; test: (c: string) => boolean }[] = [
  { key: 'SUV', label: 'SUV', test: (c) => /suv/i.test(c || '') },
  { key: 'Compact SUV', label: 'Compact SUV', test: (c) => /compact\s*suv/i.test(c || '') },
  { key: 'Sedan', label: 'SEDAN', test: (c) => /sedan/i.test(c || '') },
  { key: 'Hatchback', label: 'HATCH BACK', test: (c) => /hatch/i.test(c || '') },
  { key: 'MUV', label: 'MUV / MPV', test: (c) => /muv|mpv/i.test(c || '') },
];

const TRANSMISSIONS: { key: string; label: string; test: (t: string) => boolean }[] = [
  { key: 'Automatic', label: 'Automatic', test: (t) => /auto/i.test(t) && !/semi|amt/i.test(t) },
  { key: 'Semi-Automatic', label: 'Semi-Automatic', test: (t) => /semi|amt/i.test(t) },
  { key: 'Manual', label: 'Manual', test: (t) => /manual/i.test(t) },
];

const FUELS: { key: string; label: string; test: (f: string) => boolean }[] = [
  { key: 'Petrol', label: 'Petrol', test: (f) => /petrol/i.test(f) },
  { key: 'Diesel', label: 'Diesel', test: (f) => /diesel/i.test(f) },
  { key: 'CNG', label: 'CNG', test: (f) => /cng/i.test(f) },
  { key: 'Hybrid', label: 'Hybrid', test: (f) => /hybrid/i.test(f) },
  { key: 'EV', label: 'Electric', test: (f) => /\bev\b|electric/i.test(f) },
];

const RATINGS: { key: string; label: string; min: number }[] = [
  { key: '4.5', label: '4.5 star and above', min: 4.5 },
  { key: '4', label: '4 star and above', min: 4 },
];

const FEATURES: { key: keyof Car; label: string }[] = [
  { key: 'ac', label: 'Air Conditioning' },
  { key: 'carPlay', label: 'Apple CarPlay / Android Auto' },
  { key: 'bluetooth', label: 'Bluetooth' },
  { key: 'touchscreen', label: 'Touchscreen' },
  { key: 'usbCharging', label: 'USB Charging' },
  { key: 'sunroof', label: 'Sunroof' },
  { key: 'rearCamera', label: 'Rear Camera' },
  { key: 'rearParkingSensors', label: 'Rear Parking Sensors' },
  { key: 'gps', label: 'GPS' },
  { key: 'airbagsEquipped', label: 'Airbags' },
  { key: 'absEbd', label: 'ABS with EBD' },
];

// What matters on a bike (the car list above is about CarPlay, sunroofs and parking sensors).
const BIKE_FEATURES: { key: keyof Car; label: string }[] = [
  { key: 'bikeAbs', label: 'ABS' },
  { key: 'discBrakes', label: 'Disc Brakes' },
  { key: 'cbs', label: 'CBS (Combi Brake)' },
  { key: 'digitalDisplay', label: 'Digital Display' },
  { key: 'usbCharging', label: 'USB Charging' },
  { key: 'bluetooth', label: 'Bluetooth' },
  { key: 'gps', label: 'GPS' },
];

const brandOf = (c: Car) => (c.manufacturer || c.name.split(' ')[0] || '').trim();

/** Does this vehicle pass every chosen filter? `ratingOf` returns null when the vehicle has no public reviews. */
export function matchesFilters(car: Car, f: ExploreFilters, ratingOf: (c: Car) => number | null): boolean {
  if (f.budget) {
    const b = ALL_BUDGETS.find((x) => x.key === f.budget);
    if (b && !(car.perDay >= b.min && car.perDay <= b.max)) return false;
  }
  if (f.body) {
    const known = BODY_ORDER.find((x) => x.key === f.body);
    const cat = String(car.category || car.type || '');
    if (known ? !known.test(cat) : cat.toLowerCase() !== f.body.toLowerCase()) return false;
  }
  if (f.transmission) {
    const t = TRANSMISSIONS.find((x) => x.key === f.transmission);
    if (t && !t.test(car.transmission || '')) return false;
  }
  if (f.fuel) {
    const fu = FUELS.find((x) => x.key === f.fuel);
    if (fu && !fu.test(car.fuel || '')) return false;
  }
  if (f.rating) {
    const r = RATINGS.find((x) => x.key === f.rating);
    const v = ratingOf(car);
    if (r && (v === null || v < r.min)) return false;
  }
  if (f.brand && brandOf(car).toLowerCase() !== f.brand.toLowerCase()) return false;
  for (const key of f.features) if (!(car as any)[key]) return false;
  return true;
}

/** Sort as chosen. "Recommended": vehicles free today first, then the best rated, then the lowest price. */
export function sortCars<T extends Car>(cars: T[], sort: SortKey, ratingOf: (c: Car) => number | null): T[] {
  const list = [...cars];
  const rating = (c: Car) => ratingOf(c) ?? 0;
  // Recommended and rating: free vehicles at the top, then busy ones by the day they are free again (soonest
  // first), and only then the chosen order.
  const busy = (c: Car) => (c.isAvailable === false || (c as any).availability?.available === false ? 1 : 0);
  const freeFrom = (c: Car) => {
    const label = (c as any).availability?.nextAvailableFrom;
    return label ? parseDayLabel(label) ?? 9999 : 9999;
  };
  const chosen = (a: T, b: T) => {
    if (sort === 'price-asc') return a.perDay - b.perDay;
    if (sort === 'price-desc') return b.perDay - a.perDay;
    if (sort === 'rating') return rating(b) - rating(a) || a.perDay - b.perDay;
    return rating(b) - rating(a) || a.perDay - b.perDay;
  };
  // A price sort is exactly that: cheapest to dearest (or the reverse), whether or not a vehicle is free today —
  // putting free ones first made the prices look shuffled. Equal prices keep free vehicles first.
  if (sort === 'price-asc' || sort === 'price-desc') {
    list.sort((a, b) => chosen(a, b) || busy(a) - busy(b));
  } else {
    list.sort((a, b) => busy(a) - busy(b) || (busy(a) ? freeFrom(a) - freeFrom(b) : 0) || chosen(a, b));
  }
  return list;
}

// ── Quick chips (Explore and Search results) ─────────────────────────────────

export type QuickChip = { label: string; vehicle?: 'Cars' | 'Bikes'; apply?: Partial<ExploreFilters> };
export const QUICK_CHIPS: QuickChip[] = [
  { label: 'All' },
  { label: 'SUV', apply: { body: 'SUV' } },
  { label: 'Diesel', apply: { fuel: 'Diesel' } },
  { label: 'Petrol', apply: { fuel: 'Petrol' } },
  { label: 'Sedan', apply: { body: 'Sedan' } },
  { label: 'Hatchback', apply: { body: 'Hatchback' } },
  { label: 'MUV', apply: { body: 'MUV' } },
  { label: 'Automatic', apply: { transmission: 'Automatic' } },
  { label: 'Manual', apply: { transmission: 'Manual' } },
];

/** Which quick chip (if any) exactly matches these filters, so it stays lit after the sheet is used. */
export const chipFor = (f: ExploreFilters) =>
  QUICK_CHIPS.find((c) => !c.vehicle && JSON.stringify({ ...EMPTY_FILTERS, ...(c.apply || {}) }) === JSON.stringify(f))?.label ?? '';

/**
 * Ratings for a list of vehicles, from their public reviews (same cache key the cards use).
 * Reviews are only fetched for the whole list while `enabled` (a rating filter or sort needs them).
 */
export function useVehicleRatings(cars: Car[], enabled: boolean) {
  const queries = useQueries({
    queries: cars.map((car) => ({
      queryKey: ['carReviews', car.id],
      queryFn: () => API.reviews.fetchByCarId(car.id),
      staleTime: 5 * 60 * 1000,
      enabled,
    })),
  });
  const stamp = queries.map((q) => q.dataUpdatedAt).join(',');
  const byId = useMemo(() => {
    const map = new Map<string, number | null>();
    cars.forEach((car, i) => {
      const reviews = [...(car.reviews || []), ...((queries[i]?.data as any[]) || [])].filter((r) => r.rating >= MIN_PUBLIC_REVIEW_RATING);
      map.set(car.id, car.rating ?? (reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null));
    });
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cars, stamp]);
  return useCallback((c: Car) => byId.get(c.id) ?? null, [byId]);
}

// ── Shared sheet frame ───────────────────────────────────────────────────────

function SheetFrame({ visible, onClose, title, onClear, children, footer }: {
  visible: boolean;
  onClose: () => void;
  title: string;
  onClear: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  const p = useDetailsPalette();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.overlay}>
        <ModalBlur />
        <View  style={[StyleSheet.absoluteFill, styles.dim]}/>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={styles.closeRow}>
          <Pressable onPress={onClose} style={[styles.closeBtn, { backgroundColor: p.page }]} accessibilityRole="button" accessibilityLabel="Close">
            <Feather name="x" size={18} color={p.sub} />
          </Pressable>
        </View>
        <View style={[styles.sheet, { backgroundColor: p.page, paddingBottom: Math.max(insets.bottom, 12) }]}>
          <View style={styles.head}>
            <Text style={[styles.title, { color: p.fg }]}>{title}</Text>
            <Pressable onPress={onClear} hitSlop={10} accessibilityRole="button">
              <Text style={[styles.clear, { color: p.red }]}>Clear</Text>
            </Pressable>
          </View>
          {children}
          <View style={styles.footer}>{footer}</View>
        </View>
      </View>
    </Modal>
  );
}

function Radio({ on, p, square }: { on: boolean; p: DetailsPalette; square?: boolean }) {
  if (square) {
    return (
      <View style={[styles.box, { borderColor: on ? p.navy : p.radioRing, backgroundColor: on ? p.navy : 'transparent' }]}>
        {on && <Feather name="check" size={10} color="#FFFFFF" />}
      </View>
    );
  }
  return (
    <View style={[styles.radio, { borderColor: on ? p.navy : p.radioRing }]}>
      {on && <View style={[styles.radioDot, { backgroundColor: p.navy }]} />}
    </View>
  );
}

function Cta({ label, onPress, p }: { label: string; onPress: () => void; p: DetailsPalette }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cta, { backgroundColor: p.navy, opacity: pressed ? 0.88 : 1 }]} accessibilityRole="button">
      <Text style={[styles.ctaText, { color: p.onNavy }]}>{label}</Text>
    </Pressable>
  );
}

// ── Sort sheet ───────────────────────────────────────────────────────────────

const SORTS: { key: SortKey; label: string }[] = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'price-asc', label: 'Price: Low to High' },
  { key: 'price-desc', label: 'Price: High to Low' },
  { key: 'rating', label: 'Rating: Highest' },
];

export function SortSheet({ visible, onClose, value, onApply }: {
  visible: boolean;
  onClose: () => void;
  value: SortKey;
  onApply: (s: SortKey) => void;
}) {
  const p = useDetailsPalette();
  const [draft, setDraft] = useState<SortKey>(value);
  useEffect(() => { if (visible) setDraft(value); }, [visible, value]);
  return (
    <SheetFrame
      visible={visible}
      onClose={onClose}
      title="Sort by"
      onClear={() => setDraft('recommended')}
      footer={<Cta p={p} label="Show results" onPress={() => { onApply(draft); onClose(); }} />}
    >
      <View style={[styles.sortCard, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
        {SORTS.map((s, i) => (
          <Pressable
            key={s.key}
            onPress={() => { Haptics.selectionAsync(); setDraft(s.key); }}
            style={[styles.sortRow, i > 0 && { borderTopWidth: 1, borderStyle: 'dashed', borderTopColor: p.border }]}
            accessibilityRole="radio"
            accessibilityState={{ checked: draft === s.key }}
          >
            <Text style={[styles.sortText, { color: p.fg }]}>{s.label}</Text>
            <Radio on={draft === s.key} p={p} />
          </Pressable>
        ))}
      </View>
    </SheetFrame>
  );
}

// ── Filter sheet ─────────────────────────────────────────────────────────────

type Tab = 'budget' | 'car' | 'fuel' | 'ratings' | 'brands' | 'features';
const TABS: { key: Tab; label: string }[] = [
  { key: 'budget', label: 'Budget' },
  { key: 'car', label: 'Car Details' }, // "Bike Details" when the list is bikes
  { key: 'fuel', label: 'Fuel' },
  { key: 'ratings', label: 'Ratings' },
  { key: 'brands', label: 'Brands' },
  { key: 'features', label: 'Features' },
];

type Option = { key: string; label: string; count: number };

export function ExploreFilterSheet({ visible, onClose, value, onApply, cars, ratingOf, initialTab = 'budget' }: {
  visible: boolean;
  onClose: () => void;
  value: ExploreFilters;
  onApply: (f: ExploreFilters) => void;
  /** The vehicles the options and counts are built from (current Cars / Bikes / All selection). */
  cars: Car[];
  ratingOf: (c: Car) => number | null;
  initialTab?: Tab;
}) {
  const p = useDetailsPalette();
  const [draft, setDraft] = useState<ExploreFilters>(value);
  const [tab, setTab] = useState<Tab>(initialTab);
  useEffect(() => { if (visible) { setDraft(value); setTab(initialTab); } }, [visible]);

  // The list is all bikes (Explore's Bikes tab) or not: the options below follow it.
  const isBike = cars.length > 0 && cars.every((c) => c.type === 'Bike');

  const opts = useMemo(() => {
    const count = (test: (c: Car) => boolean) => cars.filter(test).length;
    const budget: Option[] = (isBike ? BIKE_BUDGETS : BUDGETS).map((b) => ({ key: b.key, label: b.label, count: count((c) => c.perDay >= b.min && c.perDay <= b.max) }));
    const extraBodies = Array.from(new Set(cars.map((c) => c.category).filter((cat) => cat && !BODY_ORDER.some((b) => b.test(cat)))));
    const body: Option[] = [
      ...BODY_ORDER.map((b) => ({ key: b.key, label: b.label, count: count((c) => b.test(c.category)) })),
      ...extraBodies.map((cat) => ({ key: cat, label: cat.toUpperCase(), count: count((c) => c.category === cat) })),
    ];
    const transmission: Option[] = TRANSMISSIONS.map((t) => ({ key: t.key, label: t.label, count: count((c) => t.test(c.transmission || '')) }));
    const fuel: Option[] = FUELS.map((f) => ({ key: f.key, label: f.label, count: count((c) => f.test(c.fuel || '')) }))
      .filter((o) => o.count > 0 || (isBike ? o.key === 'Petrol' : ['Petrol', 'Diesel', 'CNG', 'Hybrid'].includes(o.key)));
    const ratings: Option[] = RATINGS.map((r) => ({ key: r.key, label: r.label, count: count((c) => (ratingOf(c) ?? 0) >= r.min) }));
    const brandCounts = new Map<string, number>();
    cars.forEach((c) => { const b = brandOf(c); if (b) brandCounts.set(b, (brandCounts.get(b) || 0) + 1); });
    const brands = [...brandCounts.entries()].sort((a, b) => b[1] - a[1]).map(([k, n]) => ({ key: k, label: k, count: n }));
    const features: Option[] = (isBike ? BIKE_FEATURES : FEATURES).map((f) => ({ key: f.key as string, label: f.label, count: count((c) => !!(c as any)[f.key]) }))
      .filter((o) => o.count > 0);
    return { budget, body, transmission, fuel, ratings, popularBrands: brands.slice(0, 4), otherBrands: brands.slice(4).sort((a, b) => a.label.localeCompare(b.label)), features };
  }, [cars, ratingOf, isBike]);

  const pick = (field: Exclude<keyof ExploreFilters, 'features'>, key: string) => {
    Haptics.selectionAsync();
    setDraft((d) => ({ ...d, [field]: d[field] === key ? null : key }));
  };
  const toggleFeature = (key: string) => {
    Haptics.selectionAsync();
    setDraft((d) => ({ ...d, features: d.features.includes(key) ? d.features.filter((k) => k !== key) : [...d.features, key] }));
  };

  const tabActive: Record<Tab, boolean> = {
    budget: !!draft.budget,
    car: !!draft.body || !!draft.transmission,
    fuel: !!draft.fuel,
    ratings: !!draft.rating,
    brands: !!draft.brand,
    features: draft.features.length > 0,
  };

  const list = (field: Exclude<keyof ExploreFilters, 'features'>, options: Option[], showCount = true) =>
    options.map((o) => (
      <OptionRow key={o.key} p={p} label={o.label} count={showCount ? o.count : undefined} on={draft[field] === o.key} onPress={() => pick(field, o.key)} />
    ));

  return (
    <SheetFrame
      visible={visible}
      onClose={onClose}
      title="Filter"
      onClear={() => setDraft(EMPTY_FILTERS)}
      footer={<Cta p={p} label="Apply Filter" onPress={() => { onApply(draft); onClose(); }} />}
    >
      <View style={[styles.split, { borderColor: p.border }]}>
        <View style={[styles.tabs, { borderRightColor: p.border }]}>
          {TABS.map((t) => {
            const on = tab === t.key;
            const label = t.key === 'car' && isBike ? 'Bike Details' : t.label;
            return (
              <Pressable
                key={t.key}
                onPress={() => setTab(t.key)}
                style={[styles.tab, on && { backgroundColor: p.summary }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
              >
                {on && <View style={[styles.tabBar, { backgroundColor: p.navy }]} />}
                <Text
  style={[
    styles.tabText,
    {
      color: on ? p.navy : p.fg,
      fontFamily: on
        ? 'PlusJakartaSans_600SemiBold'
        : 'PlusJakartaSans_500Medium',
    },
  ]}
>
  {label}
</Text>
              </Pressable>
            );
          })}
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.panel} showsVerticalScrollIndicator={false}>
          {tab === 'budget' && (
            <>
              <Text style={[styles.group, { color: p.muted }]}>Price per day (₹)</Text>
              {list('budget', opts.budget)}
            </>
          )}
          {tab === 'car' && (
            <>
              {/* Every bike is just "Bike" in the data, so there is no body type to pick for them. */}
              {!isBike && (
                <>
                  <Text style={[styles.group, { color: p.muted }]}>Body Type</Text>
                  {list('body', opts.body)}
                </>
              )}
              <Text style={[styles.group, { color: p.muted, marginTop: isBike ? 0 : 12 }]}>Transmission</Text>
              {list('transmission', opts.transmission)}
            </>
          )}
          {tab === 'fuel' && list('fuel', opts.fuel)}
          {tab === 'ratings' && (
            <>
              {list('rating', opts.ratings)}
              <Text style={[styles.note, { color: p.muted }]}>From customer reviews. Vehicles without reviews yet are hidden while this is on.</Text>
            </>
          )}
          {tab === 'brands' && (
            <>
              <Text style={[styles.group, { color: p.muted }]}>Popular Brands</Text>
              {list('brand', opts.popularBrands)}
              {opts.otherBrands.length > 0 && (
                <>
                  <Text style={[styles.group, { color: p.muted, marginTop: 12 }]}>All Brands</Text>
                  {list('brand', opts.otherBrands)}
                </>
              )}
            </>
          )}
          {tab === 'features' && (
            opts.features.length ? opts.features.map((o) => (
              <OptionRow key={o.key} p={p} label={o.label} count={o.count} on={draft.features.includes(o.key)} onPress={() => toggleFeature(o.key)} square />
            )) : <Text style={[styles.note, { color: p.muted }]}>No feature details recorded for these vehicles yet.</Text>
          )}
        </ScrollView>
      </View>
    </SheetFrame>
  );
}

function OptionRow({ p, label, count, on, onPress, square }: { p: DetailsPalette; label: string; count?: number; on: boolean; onPress: () => void; square?: boolean }) {
  const empty = count === 0 && !on;
  return (
    <Pressable
      onPress={onPress}
      disabled={empty}
      style={[styles.option, empty && { opacity: 0.45 }]}
      accessibilityRole={square ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: on, disabled: empty }}
    >
      <Radio on={on} p={p} square={square} />
      <Text style={[styles.optionText, { color: p.fg }]} numberOfLines={2}>{label}</Text>
      {count !== undefined && <Text style={[styles.count, { color: p.muted }]}>{count}</Text>}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  closeRow: { alignItems: 'flex-end', paddingHorizontal: 12, marginBottom: 8 },
  closeBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingTop: 18, maxHeight: '78%' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 14 },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 26 },
  clear: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 },
  footer: { paddingHorizontal: 12, paddingVertical: 12 },
  cta: { height: 52, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17 },
  dim: { backgroundColor: 'transparent' },
  sortCard: { marginHorizontal: 16, borderWidth: 1, borderRadius: 12, paddingHorizontal: 13 },
  sortRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 56 },
  sortText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },

  split: { flexDirection: 'row', borderTopWidth: 1, borderBottomWidth: 1, height: 420 },
  tabs: { width: 120, borderRightWidth: 1 },
  tab: { height: 52, justifyContent: 'flex-start', paddingLeft: 16, paddingRight: 8, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tabBar: { position: 'absolute', left: 0, top: 10, bottom: 10, width: 3, borderTopRightRadius: 3, borderBottomRightRadius: 3 },
  tabText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, flexShrink: 1 },
  tabDot: { width: 6, height: 6, borderRadius: 3 },
  panel: { paddingHorizontal: 16, paddingVertical: 14, gap: 4 },
  group: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, marginBottom: 4 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 34 },
  optionText: { flex: 1, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11 },
  count: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, fontVariant: ['tabular-nums'] },
  note: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, lineHeight: 17, marginTop: 10 },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 8, height: 8, borderRadius: 4 },
  box: { width: 18, height: 18, borderRadius: 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});