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
import { SortLinesIcon, FunnelIcon } from '@/components/common/FilterIcons';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { rise } from '@/components/common/motion';

/**
 * Explore (Figma "Explore"): title, "Search cars and bike" with the filter button, quick filter chips
 * (Filter · All · SUV · Diesel · Petrol …) and the vehicle cards. Trip dates are picked on the car details page
 * ("Check Availability"), so this list shows availability for today, as before.
 */

// Bikes have no body types and no diesel: their chips are All · Petrol · Automatic · Manual.
const CAR_CHIPS: QuickChip[] = QUICK_CHIPS;
const BIKE_CHIPS: QuickChip[] = QUICK_CHIPS.filter((c) => !c.apply || (!c.apply.body && c.apply.fuel !== 'Diesel'));

export default function ExploreScreen() {
  const p = useDetailsPalette();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = useBottomNavHeight();
  const scrollHandlers = useHideSupportWhileScrolling();
  // Cars or bikes, as chosen on Home.
  const { setBookingSource, vehicleType: homeType } = useSawari();
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
  const listRef = useRef<FlatList<Car>>(null);
  // One stable render function, so scrolling never re-creates every card.
  const renderCar = useCallback(({ item }: { item: Car }) => <CarListCard car={item} isExplore />, []);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(searchQuery); listRef.current?.scrollToOffset({ offset: 0, animated: false }); }, 300);
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
    try {
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: false });
      });
    } catch {}
  };

  const clearAll = () => {
    setSearchQuery(''); setDebouncedQuery('');
    setChip('All'); setFilters(EMPTY_FILTERS); setSort('recommended');
  };

  const header = (
    <View style={{ paddingTop: insets.top + 8 }}>
      <Text style={[styles.title, { color: p.fg, paddingHorizontal: 16 }]}>Explore</Text>

      <View style={styles.searchRow}>
        <View style={[styles.search, { borderColor: p.segBorder, backgroundColor: p.page }]}>
          <Feather name="search" size={20} color={p.muted} />
          <TextInput
            placeholder="Search cars and bike"
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
          <SortLinesIcon color={sort !== 'recommended' ? p.onNavy : p.muted} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
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

  return (
    <Page bottomNav scroll={false}>
      {/* The whole list at once (the fleet is small, and FlatList only draws what is near the screen). Loading
          it 3 cards at a time made the list grow in jumps while scrolling — the "shaking". */}
      <FlatList
        ref={listRef}
        style={{ flex: 1, backgroundColor: p.page }}
        data={isFetchingCars && filteredCars.length === 0 ? [] : filteredCars}
        keyExtractor={(c) => c.id}
        renderItem={renderCar}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        showsVerticalScrollIndicator={false}
        // The last card must clear the fixed tab bar (+ safe area) and the floating help button.
        contentContainerStyle={{ paddingBottom: bottomNavHeight + 88 }}
        {...scrollHandlers}
        initialNumToRender={3}
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
      <SortSheet visible={showSortSheet} onClose={() => setShowSortSheet(false)} value={sort} onApply={(v) => { setSort(v); listRef.current?.scrollToOffset({ offset: 0, animated: false }); }} />
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
  chip: { height: 36, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterChip: { flexDirection: 'row', gap: 4 },
  filterChipFixed: { width: 70 },
  chipText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20 },
  empty: { borderWidth: 1, borderRadius: 12, marginHorizontal: 16, marginTop: 8, padding: 20, alignItems: 'center', gap: 6 },
  emptyTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, marginTop: 6 },
  emptyCopy: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, textAlign: 'center' },
  emptyBtn: { marginTop: 10, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
});