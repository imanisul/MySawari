import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, Pressable, StyleSheet, Text, View, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from '@/utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { FadeIn } from 'react-native-reanimated';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Car, getAvailability, isInService, splitDateRange } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';
import { useVehicles, VEHICLES_KEY } from '@/hooks/useVehicles';
import { CarListCard, Page } from '@/components';
import {
  ExploreFilterSheet, SortSheet, ExploreFilters, EMPTY_FILTERS, SortKey, countActive, matchesFilters, sortCars,
  QuickChip, chipOn, toggleChip, chipsFor, useVehicleRatings,
} from '@/components/explore/ExploreFilters';
import { CarCardSkeleton } from '@/components/loading/CarCardSkeleton';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { useHideSupportWhileScrolling } from '@/hooks/useSupportFab';
import { SortArrowsIcon, FunnelIcon } from '@/components/common/FilterIcons';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

/**
 * Explore (Figma "Explore"): title, "Search cars and bike" with the filter button, quick filter chips
 * (Filter · All · SUV · Diesel · Petrol …) and the vehicle cards. Trip dates are picked on the car details page
 * ("Check Availability"), so this list shows availability for today, as before.
 */

// A message row stands in when there are no cars.
type Row = Car | { id: string; kind: 'empty' };
const EMPTY_ROW: Row = { id: '__empty', kind: 'empty' };

export default function ExploreScreen() {
  const p = useDetailsPalette();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = useBottomNavHeight();
  const scrollHandlers = useHideSupportWhileScrolling();
  const queryClient = useQueryClient();
  // Cars or bikes, as chosen on Home.
  const { setBookingSource, vehicleType: homeType, setVehicleType, setDropoff, setDates, dateRange, duration, pickupTime, returnTime } = useSawari();
  const isBike = homeType === 'bike';
  const CHIPS = chipsFor(isBike);

  // Explore starts a trip from scratch: a location and dates left over from a search made on Home must not
  // fill in the location and date pages when a car is booked from here.
  useFocusEffect(useCallback(() => {
    setBookingSource('explore');
    setDropoff(null);
    setDates('Select Dates', duration);
    queryClient.invalidateQueries({ queryKey: VEHICLES_KEY });
  }, [setBookingSource, setDropoff, setDates, duration, queryClient]));

  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [filters, setFilters] = useState<ExploreFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const listRef = useRef<FlatList<Row>>(null);
  // The title, search box and filters sit above the list and never scroll. After a new search / filter / sort the
  // list goes back to its first car.
  const toFirstCar = useCallback(() => { listRef.current?.scrollToOffset({ offset: 0, animated: false }); }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(searchQuery); toFirstCar(); }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Switching between cars and bikes starts that list fresh unless triggered by an incoming category deep-link.
  const skipNextTypeReset = useRef(false);
  const prevHomeType = useRef(homeType);
  useEffect(() => {
    if (prevHomeType.current === homeType) return;
    prevHomeType.current = homeType;
    if (skipNextTypeReset.current) {
      skipNextTypeReset.current = false;
      return;
    }
    setFilters(EMPTY_FILTERS);
  }, [homeType]);

  // Home's category tiles open Explore with a body or gear type (`t` makes a repeat of the same tile count as new).
  const { body: bodyParam, transmission: gearParam, type: typeParam, t: bodyStamp } = useLocalSearchParams<{ body?: string; transmission?: string; type?: string; t?: string }>();
  const chipScroll = useRef<ScrollView>(null);
  useEffect(() => {
    if (!bodyParam && !gearParam && !typeParam) return;
    const nextType: 'car' | 'bike' =
      typeParam === 'bike' ? 'bike'
      : typeParam === 'car' ? 'car'
      : bodyParam ? 'car'
      : homeType;

    if (nextType !== homeType) {
      skipNextTypeReset.current = true;
      setVehicleType(nextType);
    }

    if (bodyParam || gearParam) {
      setFilters({ ...EMPTY_FILTERS, body: bodyParam || null, transmission: gearParam || null });
      setSearchQuery('');
      setDebouncedQuery('');
      requestAnimationFrame(toFirstCar);
      const targetChips = chipsFor(nextType === 'bike');
      // Bring the matching quick chip into view (chips are ~84 wide, the Filter chip comes first).
      const i = targetChips.findIndex((c) => (bodyParam && c.apply?.body === bodyParam) || (gearParam && c.apply?.transmission === gearParam));
      if (i >= 0) setTimeout(() => chipScroll.current?.scrollTo({ x: Math.max(0, (i + 1) * 84 - 120), animated: true }), 80);
    }
  }, [bodyParam, gearParam, typeParam, bodyStamp]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: fetchedCars = [], isLoading: isFetchingCars, isError: fetchError, refetch: fetchVehicles } = useVehicles();

  // Only cars or only bikes (Home's choice), without workshop vehicles: the filter options and their counts
  // are built from this list. Sorting puts the ones free now on top, then busy ones by the day they're free.
  const baseCars = useMemo(() => (fetchedCars || []).filter((car: Car) => {
    if (isInService(car)) return false;
    return isBike ? car.type === 'Bike' : car.type !== 'Bike';
  }), [fetchedCars, isBike]);

  // Ratings come from each vehicle's public reviews (same cache the cards use). They are only fetched for the
  // whole list when a rating filter or rating sort needs them.
  const needRatings = sort === 'rating' || !!filters.rating || showFilterSheet;
  const reviewRating = useVehicleRatings(baseCars, needRatings);
  // "Recommended" (and every filter except rating) uses only the rating stored on the vehicle, so the order is
  // fixed. Ratings worked out from reviews arrive one card at a time; sorting by them re-ordered the whole
  // "All" list while it loaded — the cards jumped about. They are used only for the rating sort / filter.
  const storedRating = useCallback((c: Car) => (typeof c.rating === 'number' ? c.rating : null), []);
  const ratingOf = sort === 'rating' || !!filters.rating ? reviewRating : storedRating;

  // Availability is worked out once per vehicle list, so filtering and sorting reuse the same card objects
  // (new objects on every change made every card redraw).
  const [startStr, endStr] = dateRange && dateRange !== 'Select Dates' ? splitDateRange(dateRange) : [undefined, undefined];
  const withAvailability = useMemo(() => baseCars.map((car: Car) => {
    const availability = getAvailability(car, startStr, endStr, pickupTime, returnTime);
    return { ...car, isAvailable: availability.available, availability };
  }), [baseCars, startStr, endStr, pickupTime, returnTime]);

  const filteredCars = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    const matched = withAvailability.filter((car: Car) => {
      const matchSearch = !query
        || (car.name || '').toLowerCase().includes(query)
        || (car.category || '').toLowerCase().includes(query)
        || (car.manufacturer || '').toLowerCase().includes(query);
      return matchSearch && matchesFilters(car, filters, ratingOf);
    });
    return sortCars(matched, sort, ratingOf);
  }, [withAvailability, debouncedQuery, filters, sort, ratingOf]);


  const activeFilterCount = countActive(filters);

  const pickChip = (c: QuickChip) => {
    Haptics.selectionAsync();
    setFilters((cur) => toggleChip(cur, c));
    requestAnimationFrame(toFirstCar);
  };

  const clearAll = () => {
    setSearchQuery(''); setDebouncedQuery('');
    setFilters(EMPTY_FILTERS); setSort('recommended');
  };

  const bar = (
    <View style={{ backgroundColor: p.page }}>
      <View style={styles.searchRow}>
        <View style={[styles.search, { borderColor: p.segBorder, backgroundColor: p.page }]}>
          <Feather name="search" size={20} color={p.muted} />
          <TextInput
            placeholder={isBike ? 'Search bikes' : 'Search cars'}
            placeholderTextColor={p.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchText, { color: p.fg }]}
            returnKeyType="search"
          />
          {!!searchQuery && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Feather name="x" size={16} color={p.muted} />
            </Pressable>
          )}
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Sort${sort !== 'recommended' ? ' (changed)' : ''}`}
          onPress={() => { Haptics.selectionAsync(); setShowSortSheet(true); }}
          style={[styles.sortBtn, { borderColor: sort !== 'recommended' ? p.navy : p.segBorder, backgroundColor: sort !== 'recommended' ? p.navy : p.segOn }]}
        >
          <SortArrowsIcon color={sort !== 'recommended' ? p.onNavy : p.muted} />
        </Pressable>
      </View>

      <View style={[styles.toggle, { borderColor: p.segBorder, backgroundColor: p.page }]}>
        {(['car', 'bike'] as const).map((t) => {
          const on = (t === 'bike') === isBike;
          return (
            <Pressable
              key={t}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => { if (!on) { Haptics.selectionAsync(); setVehicleType(t); } }}
              style={[styles.toggleItem, on && { backgroundColor: p.segOn, borderColor: p.segBorder }]}
            >
              <Text style={[styles.toggleText, { color: on ? p.navy : p.muted }]}>{t === 'car' ? 'Cars' : 'Bike & Scooter'}</Text>
            </Pressable>
          );
        })}
      </View>

      <ScrollView ref={chipScroll} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Filter${activeFilterCount ? ` (${activeFilterCount} active)` : ''}`}
          onPress={() => { Haptics.selectionAsync(); setShowFilterSheet(true); }}
          style={[styles.chip, styles.filterChip, styles.filterChipFixed, { borderColor: activeFilterCount ? p.navy : p.segBorder, backgroundColor: p.segOn }]}
        >
          <FunnelIcon color={activeFilterCount ? p.navy : p.muted} size={16} />
          <Text style={[styles.chipText, { color: activeFilterCount ? p.navy : p.muted }]}>Filter{activeFilterCount ? ` (${activeFilterCount})` : ''}</Text>
        </Pressable>
        {CHIPS.map((c) => {
          const on = chipOn(filters, c);
          return (
            <Pressable
              key={c.label}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => pickChip(c)}
              style={[styles.chip, { borderColor: on ? p.navy : p.segBorder, backgroundColor: on ? p.navy : p.page }]}
            >
              <Text style={[styles.chipText, { color: on ? p.onNavy : p.muted }]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  const empty = isFetchingCars ? (
    <Reanimated.View entering={FadeIn.duration(200)} style={{ paddingTop: 4 }}>
      {[1, 2, 3].map((i) => <CarCardSkeleton key={i} index={i} />)}
    </Reanimated.View>
  ) : fetchError ? (
    <View style={[styles.empty, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
      <Feather name="wifi-off" size={26} color={p.red} />
      <Text style={[styles.emptyTitle, { color: p.fg }]}>Couldn't load vehicles</Text>
      <Text style={[styles.emptyCopy, { color: p.sub }]}>Check your connection and try again.</Text>
      <Pressable style={[styles.emptyBtn, { backgroundColor: p.navy }]} onPress={() => fetchVehicles()}>
        <Text style={[styles.emptyBtnText, { color: p.onNavy }]}>Retry</Text>
      </Pressable>
    </View>
  ) : (
    <View style={[styles.empty, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
      <Feather name="search" size={26} color={p.muted} />
      <Text style={[styles.emptyTitle, { color: p.fg }]}>{isBike ? 'No bikes found' : 'No cars found'}</Text>
      <Text style={[styles.emptyCopy, { color: p.sub }]}>
        {debouncedQuery ? `Nothing matches "${debouncedQuery}". Try another search.` : 'Nothing matches these filters right now.'}
      </Text>
      {(!!debouncedQuery || activeFilterCount > 0) && (
        <Pressable style={[styles.emptyBtn, { backgroundColor: p.navy }]} onPress={clearAll}>
          <Text style={[styles.emptyBtnText, { color: p.onNavy }]}>Clear all filters</Text>
        </Pressable>
      )}
    </View>
  );

  const rows = useMemo<Row[]>(
    () => (isFetchingCars || filteredCars.length === 0 ? [EMPTY_ROW] : filteredCars),
    [isFetchingCars, filteredCars],
  );
  // New function only when something the message shows changes; the car cards themselves are memoised.
  const renderRow = useCallback(({ item }: { item: Row }) => {
    if ('kind' in item) return empty;
    return <CarListCard car={item} isExplore />;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, activeFilterCount, isBike, isFetchingCars, fetchError, debouncedQuery, p]);

  return (
    <Page bottomNav scroll={false}>
      {/* Fixed: title, search box and filters stay put however far the list is scrolled. */}
      <View style={{ paddingTop: insets.top + 8, backgroundColor: p.page }}>
        <Text style={[styles.title, { color: p.fg, paddingHorizontal: 16 }]}>Explore</Text>
        {bar}
      </View>
      <FlatList
        ref={listRef}
        style={{ flex: 1, backgroundColor: p.page }}
        data={rows}
        keyExtractor={(c) => c.id}
        renderItem={renderRow}
        showsVerticalScrollIndicator={false}
        // The last card must clear the fixed tab bar (+ safe area) and the floating help button.
        contentContainerStyle={{ paddingBottom: bottomNavHeight + 88 }}
        {...scrollHandlers}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        updateCellsBatchingPeriod={60}
        windowSize={9}
        removeClippedSubviews={false}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        refreshing={isRefreshing}
        onRefresh={async () => { setIsRefreshing(true); try { await fetchVehicles(); } finally { setIsRefreshing(false); } }}
      />

      <ExploreFilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        value={filters}
        cars={baseCars}
        bike={isBike}
        ratingOf={reviewRating}
        onApply={setFilters}
      />
      <SortSheet visible={showSortSheet} onClose={() => setShowSortSheet(false)} value={sort} onApply={(v) => { setSort(v); toFirstCar(); }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  // Figma: 48 high, 4 padding, 10 radius; items 38 high, 6 radius, semibold 13/20.
  toggle: { flexDirection: 'row', gap: 8, height: 48, padding: 4, marginHorizontal: 16, marginTop: 12, borderWidth: 1, borderRadius: 10 },
  toggleItem: { flex: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 6, borderWidth: 1, borderColor: 'transparent' },
  toggleText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 24, lineHeight: 32 },
  seg: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, padding: 2 },
  segItem: { height: 28, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  segText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12.5 },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  // Figma: 40px field, 9/12 padding, 9 between icon and text, 1px Primary/blue-50 border, 8px radius.
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, height: 49, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
  searchText: { flex: 1, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, lineHeight: 20, paddingVertical: 0 },
  sortBtn: { width: 58, height: 49, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  // Figma: chips 36 high, 8 apart, padding 6/8, 1px Primary/blue-50 border, 8px radius, 13/20 weight-500 text.
  // The chips frame pads 8 below, and the card list under it pads 8 above: the first card starts 16 below the chips.
  chips: { gap: 8, alignItems: 'flex-start', paddingHorizontal: 16, paddingTop: 8, paddingBottom: 16 },
  chip: { height: 38, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterChip: { flexDirection: 'row', gap: 4 },
  filterChipFixed: { height: 38 },
  chipText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20 },
  empty: { borderWidth: 1, borderRadius: 12, marginHorizontal: 16, marginTop: 8, padding: 20, alignItems: 'center', gap: 6 },
  emptyTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, marginTop: 6 },
  emptyCopy: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, textAlign: 'center' },
  emptyBtn: { marginTop: 10, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
});