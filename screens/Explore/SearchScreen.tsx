import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTrackTripProgress } from '@/hooks/useTrackTripProgress';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { FadeIn } from 'react-native-reanimated';
import { Car, dayNumToLabel, getAvailability, parseDayLabel, splitDateRange, todayDayNum } from '@/utils/sawari';
import { useVehicles } from '@/hooks/useVehicles';
import { useSawari } from '@/context/SawariContext';
import { saveRecentSearch } from '@/utils/recentSearches';
import { CarListCard } from '@/components';
import { CarCardSkeleton } from '@/components/loading/CarCardSkeleton';
import { SearchEmptyState, EmptyKind } from '@/components/search/SearchEmptyState';
import { calculateRentalDays } from '@/services/backend/pricingEngine';
import { useHideSupportWhileScrolling } from '@/hooks/useSupportFab';
import { rise } from '@/components/common/motion';
import { ActivityAPI } from '@/services/api/activity';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import {
  ExploreFilterSheet, SortSheet, ExploreFilters, EMPTY_FILTERS, SortKey, QUICK_CHIPS, QuickChip,
  chipFor, countActive, matchesFilters, sortCars, useVehicleRatings,
} from '@/components/explore/ExploreFilters';

/**
 * Search results (design: Home → destination → date & time → results).
 * Header: back, destination, "Showing N Cars available" and the trip's start / end (tap to change), then the
 * Zero Security Deposit strip, search, sort, the same filters as Explore, and the vehicles free for the dates.
 * Availability comes from the vehicles API (bookings / service blocks), as before.
 */

/** "12:00 PM" → "12 PM", "9:00 PM" → "09 PM", "9:30 AM" → "09:30 AM" (the design's compact time). */
const shortTime = (t?: string) => {
  const m = (t || '').match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return t || '';
  const h = m[1].padStart(2, '0');
  return m[2] === '00' ? `${h} ${m[3].toUpperCase()}` : `${h}:${m[2]} ${m[3].toUpperCase()}`;
};

export default function SearchResultsScreen() {
  useTrackTripProgress('results'); // Recent searches resume this trip on this page
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const scrollHandlers = useHideSupportWhileScrolling();
  const { dateRange, vehicleType, pickupTime, returnTime, setDates, dropoff, duration, customer } = useSawari();
  const vehicleWord = vehicleType === 'bike' ? 'bike' : 'car';

  const [filters, setFilters] = useState<ExploreFilters>(EMPTY_FILTERS);
  const [sort, setSort] = useState<SortKey>('recommended');
  const [chip, setChip] = useState('All');
  const [showFilter, setShowFilter] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ── Data: the vehicles API. Availability for any dates is derived from it. ──
  const { data: fetchedCars, isLoading, isError, isFetching, refetch } = useVehicles();

  // ── Chosen trip ──
  const [startLabel, endLabel] = splitDateRange(dateRange);
  const startDay = parseDayLabel(startLabel);
  const endDay = startDay !== null ? parseDayLabel(endLabel, startDay) : null;
  const hasRange = startDay !== null && endDay !== null && endDay > startDay;

  // Remember this trip search so Home can offer it again with one tap.
  useEffect(() => {
    if (!dropoff?.name || startDay === null || endDay === null) return;
    saveRecentSearch(customer?.id, { dropoff, dateRange, duration, pickupTime, returnTime, vehicleType }).catch(() => {});
    ActivityAPI.logActivity('trip_search', 'SearchScreen', { destination: dropoff.name, dateRange, vehicleType });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropoff?.name, dateRange, vehicleType]);

  // New dates → fresh vehicle data (bookings may have changed).
  const lastDates = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (lastDates.current !== undefined && lastDates.current !== dateRange) refetch();
    lastDates.current = dateRange;
  }, [dateRange, refetch]);

  useEffect(() => { ActivityAPI.logActivity('view_screen', 'SearchScreen', { vehicleType }); }, [vehicleType]);
  useEffect(() => {
    if (debouncedQuery) ActivityAPI.logActivity('search_query', 'SearchScreen', { query: debouncedQuery, vehicleType });
  }, [debouncedQuery]);

  // Vehicles of the searched kind that are free for the whole trip (workshop vehicles excluded).
  const freeCars = useMemo(() => (fetchedCars || [])
    .filter((c) => (vehicleType === 'bike' ? c.type === 'Bike' : c.type === 'Car' || !c.type))
    .map((c) => ({ ...c, availability: getAvailability(c, startLabel, hasRange ? endLabel : undefined) }))
    .filter((c) => c.availability.available)
    .map((c) => ({ ...c, isAvailable: true })),
  [fetchedCars, vehicleType, startLabel, endLabel, hasRange]);

  const activeFilterCount = countActive(filters);
  const ratingOf = useVehicleRatings(freeCars, sort === 'rating' || !!filters.rating || showFilter);

  useEffect(() => {
    if (activeFilterCount > 0) ActivityAPI.logActivity('apply_filter', 'SearchScreen', { ...filters });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(filters)]);

  const filteredCars = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    const list = freeCars.filter((c) =>
      (!q || c.name.toLowerCase().includes(q) || c.category.toLowerCase().includes(q) || (c.manufacturer || '').toLowerCase().includes(q))
      && matchesFilters(c, filters, ratingOf));
    return sortCars(list, sort, ratingOf);
  }, [freeCars, debouncedQuery, filters, sort, ratingOf]);

  // Nearest real alternative when nothing is free: same trip length, closest start with a free vehicle.
  const nearby = useMemo(() => {
    if (isLoading || isError || freeCars.length > 0 || !hasRange || !fetchedCars?.length) return null;
    const today = todayDayNum();
    const length = endDay! - startDay!;
    const pool = fetchedCars.filter((c) => (vehicleType === 'bike' ? c.type === 'Bike' : c.type === 'Car' || !c.type));
    for (let offset = 1; offset <= 30; offset++) {
      for (const candidate of [startDay! + offset, startDay! - offset]) {
        if (candidate < today) continue;
        const s = dayNumToLabel(candidate);
        const e = dayNumToLabel(candidate + length);
        if (pool.some((c) => getAvailability(c, s, e).available)) return { start: s, end: e };
      }
    }
    return null;
  }, [isLoading, isError, freeCars.length, hasRange, fetchedCars, startDay, endDay, vehicleType]);

  // ── Actions ──
  const openDates = useCallback(() => {
    Haptics.selectionAsync();
    router.push({ pathname: '/dates', params: { returnBack: 'true' } });
  }, [router]);

  const applyRange = useCallback((s: string, e: string) => {
    const days = calculateRentalDays(s, e, pickupTime, returnTime);
    setDates(`${s} – ${e}`, `${days} Days`);
  }, [pickupTime, returnTime, setDates]);

  const clearFilters = useCallback(() => {
    setFilters(EMPTY_FILTERS); setChip('All'); setSort('recommended'); setSearchQuery(''); setDebouncedQuery('');
  }, []);

  const pickChip = (c: QuickChip) => {
    Haptics.selectionAsync();
    setChip(c.label);
    setFilters({ ...EMPTY_FILTERS, ...(c.apply || {}) });
  };

  const count = filteredCars.length;
  const emptyKind: EmptyKind = isError && !fetchedCars?.length ? 'error' : (activeFilterCount > 0 || !!debouncedQuery) && freeCars.length > 0 ? 'filters' : 'dates';
  const plural = `${vehicleWord[0].toUpperCase()}${vehicleWord.slice(1)}${count === 1 ? '' : 's'}`;

  const header = (
    <View style={{ gap: 12, paddingBottom: 4 }}>
      {/* Zero Security Deposit */}
      <View style={[styles.strip, { backgroundColor: p.greenBg, borderColor: p.greenBorder }]}>
        <Text style={[styles.stripText, { color: p.green }]}>👌 Zero Security Deposit</Text>
      </View>

      {/* Search + sort */}
      <View style={styles.searchRow}>
        <View style={[styles.search, { borderColor: p.border }]}>
          <Feather name="search" size={18} color={p.sub} />
          <TextInput
            placeholder="Search cars and bike"
            placeholderTextColor={p.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
            style={[styles.searchText, { color: p.fg }]}
          />
          {!!searchQuery && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8} accessibilityLabel="Clear search">
              <Feather name="x" size={16} color={p.muted} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); setShowSort(true); }}
          style={[styles.sortBtn, { borderColor: sort !== 'recommended' ? p.navy : p.border, backgroundColor: sort !== 'recommended' ? p.navy : p.page }]}
          accessibilityRole="button"
          accessibilityLabel="Sort"
        >
          <Feather name="sliders" size={16} color={sort !== 'recommended' ? p.onNavy : p.sub} style={{ transform: [{ rotate: '90deg' }] }} />
        </Pressable>
      </View>

      {/* Filter chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips} style={{ marginHorizontal: -16 }}>
        <Pressable
          onPress={() => { Haptics.selectionAsync(); setShowFilter(true); }}
          style={[styles.chip, styles.filterChip, { borderColor: activeFilterCount ? p.navy : p.border, backgroundColor: p.page }]}
          accessibilityRole="button"
          testID="filter-button"
        >
          <Feather name="filter" size={13} color={activeFilterCount ? p.navy : p.sub} />
          <Text style={[styles.chipText, { color: activeFilterCount ? p.navy : p.sub }]}>Filter{activeFilterCount ? ` (${activeFilterCount})` : ''}</Text>
        </Pressable>
        {QUICK_CHIPS.map((c) => {
          const on = chip === c.label;
          return (
            <Pressable
              key={c.label}
              onPress={() => pickChip(c)}
              style={[styles.chip, { borderColor: on ? p.navy : p.border, backgroundColor: on ? p.navy : p.page }]}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
            >
              <Text style={[styles.chipText, { color: on ? p.onNavy : p.sub }]}>{c.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: p.page }]}>
      {/* Top bar: back · destination + count · trip dates */}
      <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={[styles.back, { backgroundColor: p.iconBg }]} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={20} color={p.sub} />
        </Pressable>
        <View style={styles.topText}>
          <Text style={[styles.dest, { color: p.fg }]} numberOfLines={1}>{dropoff?.name || `Available ${vehicleWord}s`}</Text>
          <View style={styles.countRow}>
            <Text style={[styles.count, { color: p.sub }]} numberOfLines={1}>
              {isLoading ? `Finding available ${vehicleWord}s…` : `Showing ${count} ${plural} available`}
            </Text>
            {isFetching && !isLoading && <ActivityIndicator size="small" color={p.muted} style={{ transform: [{ scale: 0.7 }] }} />}
          </View>
        </View>
        <Pressable onPress={openDates} style={[styles.dates, { backgroundColor: p.summary }]} accessibilityRole="button" accessibilityLabel={`Trip ${startLabel || ''} ${pickupTime} to ${endLabel || ''} ${returnTime}. Change dates`}>
          <View style={styles.dateCol}>
            <Text style={[styles.dateDay, { color: p.fg }]}>{startLabel || 'Start'}</Text>
            <Text style={[styles.dateTime, { color: p.sub }]}>{startLabel ? shortTime(pickupTime) : 'Pick'}</Text>
          </View>
          <View style={[styles.dateDivider, { backgroundColor: p.border }]} />
          <View style={styles.dateCol}>
            <Text style={[styles.dateDay, { color: p.fg }]}>{(hasRange ? endLabel : startLabel) || 'End'}</Text>
            <Text style={[styles.dateTime, { color: p.sub }]}>{startLabel ? shortTime(returnTime) : 'Pick'}</Text>
          </View>
        </Pressable>
      </View>

      <FlatList
        data={isLoading ? [] : filteredCars}
        keyExtractor={(c: Car) => c.id}
        renderItem={({ item, index }) => (
          <Reanimated.View entering={rise(Math.min(index, 4) * 40)}>
            <CarListCard car={item} isExplore={false} />
          </Reanimated.View>
        )}
        ListHeaderComponent={<View style={{ paddingHorizontal: 16, marginBottom: 8 }}>{header}</View>}
        ListEmptyComponent={isLoading ? (
          <Reanimated.View entering={FadeIn.duration(200)}>
            {[0, 1, 2].map((i) => <CarCardSkeleton key={i} index={i} />)}
          </Reanimated.View>
        ) : (
          <SearchEmptyState
            kind={emptyKind}
            vehicle={vehicleWord}
            nearby={nearby ? `${nearby.start} – ${nearby.end}` : null}
            onNearby={() => nearby && applyRange(nearby.start, nearby.end)}
            onChangeDates={openDates}
            onClearFilters={clearFilters}
            onRetry={() => refetch()}
            hasActiveFilters={activeFilterCount > 0 || !!debouncedQuery}
          />
        )}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + 96 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); try { await refetch(); } finally { setRefreshing(false); } }} tintColor={p.navy} />}
        initialNumToRender={6}
        windowSize={11}
        removeClippedSubviews={false}
        {...scrollHandlers}
      />

      <ExploreFilterSheet
        visible={showFilter}
        onClose={() => setShowFilter(false)}
        value={filters}
        cars={freeCars}
        ratingOf={ratingOf}
        onApply={(f) => { setFilters(f); setChip(chipFor(f)); }}
      />
      <SortSheet visible={showSort} onClose={() => setShowSort(false)} value={sort} onApply={setSort} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingBottom: 12 },
  back: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  topText: { flex: 1, minWidth: 0 },
  dest: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, lineHeight: 20 },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  count: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 16 },
  dates: { flexDirection: 'row', alignItems: 'center', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 4 },
  dateCol: { alignItems: 'center', paddingHorizontal: 4 },
  dateDay: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 15 },
  dateTime: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10, lineHeight: 14 },
  dateDivider: { width: 1, alignSelf: 'stretch', marginVertical: 2 },
  strip: { borderWidth: 1, borderRadius: 8, height: 39, alignItems: 'center', justifyContent: 'center' },
  stripText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12 },
  searchRow: { flexDirection: 'row', gap: 8 },
  search: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, height: 40, borderWidth: 1, borderRadius: 8, paddingHorizontal: 10 },
  searchText: { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, paddingVertical: 0 },
  sortBtn: { width: 40, height: 40, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  chips: { gap: 6, paddingHorizontal: 16 },
  chip: { height: 30, paddingHorizontal: 14, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  filterChip: { flexDirection: 'row', gap: 4, paddingHorizontal: 10 },
  chipText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },
});