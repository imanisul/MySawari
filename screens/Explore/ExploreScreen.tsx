import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { rise } from '@/components/common/motion';

/**
 * Explore (Figma "Explore"): title, "Search cars and bike" with the filter button, quick filter chips
 * (Filter · All · SUV · Diesel · Petrol …) and the vehicle cards. Trip dates are picked on the car details page
 * ("Check Availability"), so this list shows availability for today, as before.
 */

const CHIPS: QuickChip[] = [
  ...QUICK_CHIPS,
  { label: 'Cars', vehicle: 'Cars' },
  { label: 'Bikes', vehicle: 'Bikes' },
];

const PAGE_SIZE = 3;

export default function ExploreScreen() {
  const p = useDetailsPalette();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = useBottomNavHeight();
  const scrollHandlers = useHideSupportWhileScrolling();
  const { setBookingSource } = useSawari();

  useFocusEffect(useCallback(() => { setBookingSource('explore'); }, [setBookingSource]));

  const [vehicleType, setVehicleType] = useState<'All' | 'Cars' | 'Bikes'>('All');
  const [chip, setChip] = useState('All');
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [filters, setFilters] = useState<ExploreFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('recommended');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => { setDebouncedQuery(searchQuery); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const { data: fetchedCars = [], isLoading: isFetchingCars, isError: fetchError, refetch: fetchVehicles } = useVehicles();

  // Vehicles of the chosen kind (All / Cars / Bikes), without workshop vehicles: the filter options and their
  // counts are built from this list.
  const baseCars = useMemo(() => (fetchedCars || []).filter((car: Car) => {
    const st = car.dbStatus?.toLowerCase();
    if (st === 'service' || st === 'maintenance') return false;
    return vehicleType === 'All' || (vehicleType === 'Bikes' ? car.type === 'Bike' : car.type === 'Car');
  }), [fetchedCars, vehicleType]);

  // Ratings come from each vehicle's public reviews (same cache the cards use). They are only fetched for the
  // whole list when a rating filter or rating sort needs them.
  const needRatings = sort === 'rating' || !!filters.rating || showFilterSheet;
  const ratingOf = useVehicleRatings(baseCars, needRatings);

  const filteredCars = useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    const matched = baseCars.reduce((acc: Car[], car: Car) => {
      const matchSearch = !query
        || car.name.toLowerCase().includes(query)
        || car.category.toLowerCase().includes(query)
        || (car.manufacturer || '').toLowerCase().includes(query);
      if (matchSearch && matchesFilters(car, filters, ratingOf)) {
        const availability = getAvailability(car);
        acc.push({ ...car, isAvailable: availability.available, availability });
      }
      return acc;
    }, []);
    return sortCars(matched, sort, ratingOf);
  }, [baseCars, debouncedQuery, filters, sort, ratingOf]);

  const paginatedCars = useMemo(() => filteredCars.slice(0, page * PAGE_SIZE), [filteredCars, page]);

  const activeFilterCount = countActive(filters);

  const pickChip = (c: QuickChip) => {
    Haptics.selectionAsync();
    setChip(c.label);
    setVehicleType(c.vehicle || 'All');
    setFilters({ ...EMPTY_FILTERS, ...(c.apply || {}) });
    setPage(1);
  };

  const clearAll = () => {
    setSearchQuery(''); setDebouncedQuery('');
    setChip('All'); setVehicleType('All'); setFilters(EMPTY_FILTERS); setSort('recommended'); setPage(1);
  };

  const header = (
    <Reanimated.View entering={rise()} style={{ paddingTop: insets.top + 8 }}>
      <Text style={[styles.title, { color: p.fg }]}>Explore</Text>

      <View style={styles.searchRow}>
        <View style={[styles.search, { borderColor: p.border, backgroundColor: p.page }]}>
          <Feather name="search" size={18} color={p.sub} />
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
          style={[styles.sortBtn, { borderColor: sort !== 'recommended' ? p.navy : p.border, backgroundColor: sort !== 'recommended' ? p.navy : p.page }]}
        >
          <Feather name="sliders" size={16} color={sort !== 'recommended' ? p.onNavy : p.sub} style={{ transform: [{ rotate: '90deg' }] }} />
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Filter${activeFilterCount ? ` (${activeFilterCount} active)` : ''}`}
          onPress={() => { Haptics.selectionAsync(); setShowFilterSheet(true); }}
          style={[styles.chip, styles.filterChip, { borderColor: p.border, backgroundColor: p.page }]}
        >
          <Feather name="filter" size={13} color={p.sub} />
          <Text style={[styles.chipText, { color: p.sub }]}>Filter{activeFilterCount ? ` (${activeFilterCount})` : ''}</Text>
        </Pressable>
        {CHIPS.map((c) => {
          const on = chip === c.label;
          return (
            <Pressable
              key={c.label}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => pickChip(c)}
              style={[styles.chip, { borderColor: on ? p.navy : p.border, backgroundColor: on ? p.navy : p.page }]}
            >
              <Text style={[styles.chipText, { color: on ? p.onNavy : p.sub }]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </Reanimated.View>
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
      <Text style={[styles.emptyTitle, { color: p.fg }]}>No vehicles found</Text>
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
      <FlatList
        style={{ flex: 1, backgroundColor: p.page }}
        data={paginatedCars}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <CarListCard car={item} isExplore />}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        showsVerticalScrollIndicator={false}
        // The last card must clear the fixed tab bar (+ safe area) and the floating help button.
        contentContainerStyle={{ paddingBottom: bottomNavHeight + 88 }}
        {...scrollHandlers}
        onEndReached={() => { if (paginatedCars.length < filteredCars.length) setPage((n) => n + 1); }}
        onEndReachedThreshold={0.5}
        initialNumToRender={4}
        windowSize={11}
        removeClippedSubviews={false}
        refreshing={isRefreshing}
        onRefresh={async () => { setIsRefreshing(true); try { await fetchVehicles(); } finally { setIsRefreshing(false); } }}
      />

      <ExploreFilterSheet
        visible={showFilterSheet}
        onClose={() => setShowFilterSheet(false)}
        value={filters}
        cars={baseCars}
        ratingOf={ratingOf}
        onApply={(f) => {
          setFilters(f);
          // The quick chip stays lit only while the filters are exactly that chip's.
          setChip(chipFor(f));
          setPage(1);
        }}
      />
      <SortSheet visible={showSortSheet} onClose={() => setShowSortSheet(false)} value={sort} onApply={(v) => { setSort(v); setPage(1); }} />
    </Page>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 24, lineHeight: 32, paddingHorizontal: 16 },
  searchRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 12 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10 },
  searchText: { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, paddingVertical: 0 },
  sortBtn: { width: 40, height: 40, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: 6, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 12 },
  chip: { height: 30, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterChip: { flexDirection: 'row', gap: 4, paddingHorizontal: 10 },
  chipText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },
  empty: { borderWidth: 1, borderRadius: 12, marginHorizontal: 16, marginTop: 8, padding: 20, alignItems: 'center', gap: 6 },
  emptyTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, marginTop: 6 },
  emptyCopy: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, textAlign: 'center' },
  emptyBtn: { marginTop: 10, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  emptyBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
});