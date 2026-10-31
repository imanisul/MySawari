import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, Pressable, StyleSheet, Text, View, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { FadeIn } from 'react-native-reanimated';
import { useFocusEffect } from 'expo-router';
import { Car, getAvailability } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { CarListCard, Page } from '@/components';
import {
  ExploreFilterSheet, SortSheet, ExploreFilters, EMPTY_FILTERS, SortKey, countActive, matchesFilters, sortCars,
  QUICK_CHIPS, QuickChip, chipFor, useVehicleRatings,
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

// Bikes have no body types and no diesel: their chips are All · Petrol · Automatic · Manual.
const CAR_CHIPS: QuickChip[] = QUICK_CHIPS;
const BIKE_CHIPS: QuickChip[] = QUICK_CHIPS.filter((c) => !c.apply || (!c.apply.body && c.apply.fuel !== 'Diesel'));

// The list's first row is the pinned search + chips bar; a message row stands in when there are no cars.
type Row = Car | { id: string; kind: 'bar' | 'empty' };
const BAR_ROW: Row = { id: '__bar', kind: 'bar' };
const EMPTY_ROW: Row = { id: '__empty', kind: 'empty' };

export default function ExploreScreen() {
  const p = useDetailsPalette();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = useBottomNavHeight();
  const scrollHandlers = useHideSupportWhileScrolling();
  // Cars or bikes, as chosen on Home.
  const { setBookingSource, vehicleType: homeType, setVehicleType } = useSawari();
  const isBike = homeType === 'bike';
  const CHIPS = isBike ? BIKE_CHIPS : CAR_CHIPS;

  useFocusEffect(useCallback(() => { setBookingSource('explore'); }, [setBookingSource]));

  const [chip, setChip] = useState('All');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [filters, setFilters] = useState<ExploreFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const listRef = useRef<FlatList<Row>>(null);
  // The title scrolls away; the search row and chips under it stay pinned. After a new search / filter / sort the
  // list goes back to its first car — just under the pinned bar — and stays put if the title is still showing.
  const offsetY = useRef(0);
  const titleH = useRef(0);
  const toFirstCar = useCallback(() => {
    if (offsetY.current > titleH.current) listRef.current?.scrollToOffset({ offset: titleH.current, animated: false });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(searchQuery); toFirstCar(); }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Switching between cars and bikes starts that list fresh.
  useEffect(() => {
    setChip('All'); setFilters(EMPTY_FILTERS);
  }, [homeType]);

  const { data: fetchedCars = [], isLoading: isFetchingCars, isError: fetchError, refetch: fetchVehicles } = useVehicles();

  // Only cars or only bikes (Home's choice), without workshop vehicles: the filter options and their counts
  // are built from this list. Sorting puts the ones free now on top, then busy ones by the day they're free.
  const baseCars = useMemo(() => (fetchedCars || []).filter((car: Car) => {
    const st = car.dbStatus?.toLowerCase();
    if (st === 'service' || st === 'maintenance') return false;
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
  const withAvailability = useMemo(() => baseCars.map((car: Car) => {
    const availability = getAvailability(car);
    return { ...car, isAvailable: availability.available, availability };
  }), [baseCars]);

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
    setChip(c.label);
    setFilters({ ...EMPTY_FILTERS, ...(c.apply || {}) });
    requestAnimationFrame(toFirstCar);
  };

  const clearAll = () => {
    setSearchQuery(''); setDebouncedQuery('');
    setChip('All'); setFilters(EMPTY_FILTERS); setSort('recommended');
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        {/* Cars / Bikes: the list below, its quick filters and the Filter sheet all follow this. */}
        {(['car', 'bike'] as const).map((t) => {
          const on = homeType === t;
          return (
            <Pressable
              key={t}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => { if (!on) { Haptics.selectionAsync(); setVehicleType(t); } }}
              style={[styles.chip, { borderColor: on ? p.navy : p.segBorder, backgroundColor: on ? p.navy : p.page }]}
            >
              <Text style={[styles.chipText, { color: on ? p.onNavy : p.muted }]}>{t === 'car' ? 'Cars' : 'Bikes'}</Text>
            </Pressable>
          );
        })}
        <View style={[styles.chipDivider, { backgroundColor: p.segBorder }]} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Filter${activeFilterCount ? ` (${activeFilterCount} active)` : ''}`}
          onPress={() => { Haptics.selectionAsync(); setShowFilterSheet(true); }}
          style={[styles.chip, styles.filterChip, styles.filterChipFixed, { borderColor: p.segBorder, backgroundColor: p.segOn }]}
        >
          <FunnelIcon color={p.muted} size={16} />
          <Text style={[styles.chipText, { color: p.muted }]}>Filter</Text>
        </Pressable>
        {CHIPS.map((c) => {
          const on = chip === c.label;
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
      {(!!debouncedQuery || chip !== 'All' || activeFilterCount > 0) && (
        <Pressable style={[styles.emptyBtn, { backgroundColor: p.navy }]} onPress={clearAll}>
          <Text style={[styles.emptyBtnText, { color: p.onNavy }]}>Clear all filters</Text>
        </Pressable>
      )}
    </View>
  );

  const rows = useMemo<Row[]>(
    () => [BAR_ROW, ...(isFetchingCars || filteredCars.length === 0 ? [EMPTY_ROW] : filteredCars)],
    [isFetchingCars, filteredCars],
  );
  // New function only when something the bar or the message shows changes (typing, chips, sort, loading state);
  // the car cards themselves are memoised, so they do not redraw.
  const renderRow = useCallback(({ item }: { item: Row }) => {
    if ('kind' in item) return item.kind === 'bar' ? bar : empty;
    return <CarListCard car={item} isExplore />;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, chip, sort, activeFilterCount, isBike, isFetchingCars, fetchError, debouncedQuery, p]);

  return (
    // The list starts below the status bar, so the pinned bar sticks right under it instead of behind it.
    <Page bottomNav scroll={false}>
      <FlatList
        ref={listRef}
        style={{ flex: 1, backgroundColor: p.page, marginTop: insets.top }}
        data={rows}
        keyExtractor={(c) => c.id}
        renderItem={renderRow}
        ListHeaderComponent={
          <Text onLayout={(e) => { titleH.current = e.nativeEvent.layout.height; }} style={[styles.title, { color: p.fg, paddingHorizontal: 16, paddingTop: 8 }]}>Explore</Text>
        }
        // Row 0 is the search + chips bar: it stays at the top while the cars scroll under it.
        stickyHeaderIndices={[0]}
        onScroll={(e) => { offsetY.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
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
        ratingOf={reviewRating}
        onApply={(f) => {
          setFilters(f);
          // The quick chip stays lit only while the filters are exactly that chip's.
          setChip(chipFor(f));
        }}
      />
      <SortSheet visible={showSortSheet} onClose={() => setShowSortSheet(false)} value={sort} onApply={(v) => { setSort(v); toFirstCar(); }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 24, lineHeight: 32 },
  seg: { flexDirection: 'row', borderWidth: 1, borderRadius: 8, padding: 2 },
  segItem: { height: 28, paddingHorizontal: 12, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  segText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12.5 },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  // Figma: 40px field, 9/12 padding, 9 between icon and text, 1px Primary/blue-50 border, 8px radius.
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9, height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
  searchText: { flex: 1, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, paddingVertical: 0 },
  sortBtn: { width: 48, height: 40, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  // Figma: chips 36 high, 8 apart, padding 6/8, 1px Primary/blue-50 border, 8px radius, 13/20 weight-500 text.
  // The chips frame pads 8 below, and the card list under it pads 8 above: the first card starts 16 below the chips.
  chips: { gap: 8, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  chip: { height: 36, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterChip: { flexDirection: 'row', gap: 4 },
  filterChipFixed: { width: 70 },
  chipDivider: { width: 1, height: 24, alignSelf: 'center' },
  chipText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20 },
  empty: { borderWidth: 1, borderRadius: 12, marginHorizontal: 16, marginTop: 8, padding: 20, alignItems: 'center', gap: 6 },
  emptyTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, marginTop: 6 },
  emptyCopy: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, textAlign: 'center' },
  emptyBtn: { marginTop: 10, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
});