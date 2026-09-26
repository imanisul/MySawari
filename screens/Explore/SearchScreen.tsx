import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View, TextInput } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Reanimated, { FadeIn } from 'react-native-reanimated';
import { useQuery } from '@tanstack/react-query';
import {
  Car,
  dayNumToLabel,
  getAvailability,
  parseDayLabel,
  splitDateRange,
  todayDayNum,
} from '@/utils/sawari';
import { useVehicles } from '@/hooks/useVehicles';
import { useSawari } from '@/context/SawariContext';
import { Header, Page, CarListCard } from '@/components';
import { CarCardSkeleton } from '@/components/loading/CarCardSkeleton';
import { SearchEmptyState, EmptyKind } from '@/components/search/SearchEmptyState';
import { useBrandColors } from '@/components/search/useBrandColors';
import { calculateRentalDays } from '@/services/backend/pricingEngine';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { useHideSupportWhileScrolling } from '@/hooks/useSupportFab';
import { rise } from '@/components/common/motion';

type SortOption = 'low-to-high' | 'high-to-low';
type PriceRange = number;
type TransmissionFilter = 'all' | 'Automatic' | 'Manual';
type FuelFilter = 'all' | 'Petrol' | 'Diesel' | 'EV';

const CAR_PRICE_RANGES: Array<{ label: string; value: PriceRange }> = [
  { label: 'Any Price', value: 10000 },
  { label: 'Under ₹2,000', value: 2000 },
  { label: 'Under ₹3,000', value: 3000 },
  { label: 'Under ₹4,000', value: 4000 },
];

const BIKE_PRICE_RANGES: Array<{ label: string; value: PriceRange }> = [
  { label: 'Any Price', value: 10000 },
  { label: 'Under ₹500', value: 500 },
  { label: 'Under ₹1,000', value: 1000 },
  { label: 'Under ₹1,500', value: 1500 },
];

const CAR_TRANSMISSION: Array<{ label: string; value: TransmissionFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Automatic', value: 'Automatic' },
  { label: 'Manual', value: 'Manual' },
];

const BIKE_TRANSMISSION: Array<{ label: string; value: TransmissionFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Gearless', value: 'Automatic' },
  { label: 'Geared', value: 'Manual' },
];

const CAR_FUEL: Array<{ label: string; value: FuelFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Petrol', value: 'Petrol' },
  { label: 'Diesel', value: 'Diesel' },
  { label: 'EV', value: 'EV' },
];

const BIKE_FUEL: Array<{ label: string; value: FuelFilter }> = [
  { label: 'All', value: 'all' },
  { label: 'Petrol', value: 'Petrol' },
  { label: 'EV', value: 'EV' },
];

const SORT_OPTIONS: Array<{ label: string; value: SortOption; icon: React.ComponentProps<typeof Feather>['name'] }> = [
  { label: 'Price: Low to High', value: 'low-to-high', icon: 'trending-up' },
  { label: 'Price: High to Low', value: 'high-to-low', icon: 'trending-down' },
];

// Room kept under the last card for the floating support button (60px + gaps).
const SUPPORT_BUTTON_CLEARANCE = 88;

export default function SearchResultsScreen() {
  const { colors, navy, onNavy } = useBrandColors();
  const router = useRouter();
  const bottomNavHeight = useBottomNavHeight();
  const scrollHandlers = useHideSupportWhileScrolling();
  const { dateRange, vehicleType, pickupTime, returnTime, setDates } = useSawari();

  const vehicleWord = vehicleType === 'bike' ? 'bike' : 'car';

  const [filterVisible, setFilterVisible] = useState(false);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [priceRange, setPriceRange] = useState<PriceRange>(10000);
  const [transmission, setTransmission] = useState<TransmissionFilter>('all');
  const [fuel, setFuel] = useState<FuelFilter>('all');
  const [sort, setSort] = useState<SortOption>('low-to-high');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  // ── Data: the existing vehicles API. Availability for any date is derived from it. ──
  // Real data only — no placeholder vehicles if the backend has none or is unreachable.
  const { data: fetchedCars, isLoading, isError, isFetching, refetch } = useVehicles();

  // ── Selected dates ──
  const [startLabel, endLabel] = splitDateRange(dateRange);
  const startDay = parseDayLabel(startLabel);
  const endDay = startDay !== null ? parseDayLabel(endLabel, startDay) : null;
  const hasRange = startDay !== null && endDay !== null && endDay > startDay;
  const datesText = hasRange ? `${startLabel} – ${endLabel}` : startDay !== null ? startLabel! : null;

  // Refresh vehicles from the API whenever the customer moves to different dates.
  const lastDates = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (lastDates.current !== undefined && lastDates.current !== dateRange) {
      refetch();
    }
    lastDates.current = dateRange;
  }, [dateRange, refetch]);

  // ── Filtering ──
  const matchesStaticFilters = useCallback(
    (c: Car) => {
      const typeOk = vehicleType === 'bike' ? c.type === 'Bike' : c.type === 'Car' || !c.type;
      return (
        typeOk &&
        (priceRange === 10000 || c.perDay <= priceRange) &&
        (transmission === 'all' || c.transmission === transmission) &&
        (fuel === 'all' || c.fuel === fuel)
      );
    },
    [vehicleType, priceRange, transmission, fuel]
  );

  const activeFilterCount = [priceRange !== 10000, transmission !== 'all', fuel !== 'all'].filter(Boolean).length;

  const filteredCars = useMemo(() => {
    // Only vehicles free for the chosen dates (or today, if none chosen).
    const result = (fetchedCars || [])
      .filter(matchesStaticFilters)
      .map((c) => ({ ...c, availability: getAvailability(c, startLabel, hasRange ? endLabel : undefined) }))
      .filter((c) => c.availability.available)
      .filter((c) => {
        const query = debouncedQuery.toLowerCase();
        return query === '' ||
               c.name.toLowerCase().includes(query) ||
               c.category.toLowerCase().includes(query) ||
               (c.manufacturer && c.manufacturer.toLowerCase().includes(query));
      })
      .map((c) => ({ ...c, isAvailable: true }));

    result.sort((a, b) => (sort === 'low-to-high' ? a.perDay - b.perDay : b.perDay - a.perDay));
    return result;
  }, [fetchedCars, matchesStaticFilters, startLabel, endLabel, hasRange, sort, debouncedQuery]);

  // Would anything be available for these dates if no price/transmission/fuel filter applied?
  const availableIgnoringFilters = useMemo(() => {
    if (filteredCars.length > 0 || activeFilterCount === 0) return filteredCars.length;
    return (fetchedCars || []).filter((c) => {
      const typeOk = vehicleType === 'bike' ? c.type === 'Bike' : c.type === 'Car' || !c.type;
      return typeOk && getAvailability(c, startLabel, hasRange ? endLabel : undefined).available;
    }).length;
  }, [filteredCars, activeFilterCount, fetchedCars, vehicleType, startLabel, endLabel, hasRange]);

  // Nearest real alternative: same trip length, closest start date with at least one free vehicle.
  const nearby = useMemo(() => {
    if (isLoading || isError || filteredCars.length > 0 || !hasRange || !fetchedCars?.length) return null;
    const today = todayDayNum();
    const length = endDay! - startDay!;
    const pool = fetchedCars.filter(matchesStaticFilters);
    for (let offset = 1; offset <= 30; offset++) {
      for (const candidate of [startDay! + offset, startDay! - offset]) {
        if (candidate < today) continue;
        const s = dayNumToLabel(candidate);
        const e = dayNumToLabel(candidate + length);
        if (pool.some((c) => getAvailability(c, s, e).available)) {
          return { start: s, end: e, days: length };
        }
      }
    }
    return null;
  }, [isLoading, isError, filteredCars.length, hasRange, fetchedCars, startDay, endDay, matchesStaticFilters]);

  // ── Actions ──
  const openDatePicker = useCallback(() => {
    Haptics.selectionAsync();
    router.push({ pathname: '/dates', params: { returnBack: 'true' } });
  }, [router]);

  const applyRange = useCallback(
    (s: string, e: string) => {
      const days = calculateRentalDays(s, e, pickupTime, returnTime);
      setDates(`${s} – ${e}`, `${days} Days`);
    },
    [pickupTime, returnTime, setDates]
  );

  const clearAllFilters = useCallback(() => {
    setPriceRange(10000);
    setTransmission('all');
    setFuel('all');
    setSort('low-to-high');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handlePullRefresh = useCallback(async () => {
    setIsPullRefreshing(true);
    try {
      await refetch();
    } finally {
      setIsPullRefreshing(false);
    }
  }, [refetch]);

  const renderCar = useCallback(
    ({ item, index }: { item: Car; index: number }) => (
      <Reanimated.View entering={rise(Math.min(index, 4) * 40)}>
        <CarListCard car={item} isExplore={false} />
      </Reanimated.View>
    ),
    []
  );
  const keyExtractor = useCallback((car: Car) => car.id, []);

  // ── Header pieces ──
  const emptyKind: EmptyKind = isError && !fetchedCars?.length
    ? 'error'
    : activeFilterCount > 0 && availableIgnoringFilters > 0
    ? 'filters'
    : 'dates';

  const count = filteredCars.length;
  const listHeader = (
    <View>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput
          placeholder={`Search ${vehicleWord} by name or brand...`}
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchText, { color: colors.foreground }]}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        <Feather name="search" size={20} color={colors.foreground} />
      </View>

      {/* Filter + sort. Scrolls sideways so nothing is ever clipped; extra right padding keeps the last chip visible. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.controlsRow}
        style={styles.sectionGap}
      >
        <Chip
          testID="filter-button"
          icon="sliders"
          label={`Filter${activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}`}
          selected={activeFilterCount > 0}
          onPress={() => {
            Haptics.selectionAsync();
            setFilterVisible(true);
          }}
        />
        {SORT_OPTIONS.map((opt) => (
          <Chip
            key={opt.value}
            icon={opt.icon}
            label={opt.label}
            selected={sort === opt.value}
            onPress={() => {
              Haptics.selectionAsync();
              setSort(opt.value);
            }}
          />
        ))}
      </ScrollView>

      <View style={styles.resultsHeader}>
        <View style={{ flex: 1 }}>
          {isLoading ? (
            <Text style={[styles.resultsTitle, { color: colors.foreground }]}>Finding available {vehicleWord}s…</Text>
          ) : emptyKind === 'error' && count === 0 ? null : (
            <>
              <Text style={[styles.resultsTitle, { color: colors.foreground }]}>
                {count} {vehicleWord}{count === 1 ? '' : 's'} available
              </Text>
              <Text style={[styles.resultsSub, { color: colors.mutedForeground }]}>
                {datesText ? `Available for ${datesText}` : 'Available today'}
              </Text>
            </>
          )}
        </View>
        {isFetching && !isLoading && <ActivityIndicator size="small" color={navy} style={{ marginRight: 12 }} />}
        {!isLoading && (
          <Pressable
            accessibilityRole="button"
            onPress={openDatePicker}
            hitSlop={8}
            style={({ pressed }) => [styles.changeDates, pressed && { opacity: 0.6 }]}
          >
            <Text style={[styles.changeDatesText, { color: navy }]}>Change dates</Text>
          </Pressable>
        )}
      </View>
    </View>
  );

  const listEmpty = isLoading ? (
    <Reanimated.View entering={FadeIn.duration(200)}>
      {[0, 1, 2].map((i) => (
        <CarCardSkeleton key={i} index={i} />
      ))}
    </Reanimated.View>
  ) : (
    <SearchEmptyState
      kind={emptyKind}
      vehicle={vehicleWord}
      nearby={nearby ? `${nearby.start} – ${nearby.end}` : null}
      onNearby={() => nearby && applyRange(nearby.start, nearby.end)}
      onChangeDates={openDatePicker}
      onClearFilters={clearAllFilters}
      onRetry={() => refetch()}
      hasActiveFilters={activeFilterCount > 0}
    />
  );

  return (
    <Page bottomNav scroll={false}>
      <Header title={vehicleType === 'bike' ? 'Available Bikes' : 'Available Cars'} back />
      <FlatList
        data={isLoading ? [] : filteredCars}
        keyExtractor={keyExtractor}
        renderItem={renderCar}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        showsVerticalScrollIndicator={false}
        // Last card must clear the fixed tab bar (+ safe area) and the floating support button.
        contentContainerStyle={{ paddingTop: 8, paddingBottom: bottomNavHeight + SUPPORT_BUTTON_CLEARANCE }}
        refreshControl={<RefreshControl refreshing={isPullRefreshing} onRefresh={handlePullRefresh} tintColor={navy} />}
        initialNumToRender={4}
        maxToRenderPerBatch={4}
        windowSize={7}
        removeClippedSubviews
        {...scrollHandlers}
      />

      {/* Filter Modal */}
      <Modal visible={filterVisible} animationType="slide" transparent onRequestClose={() => setFilterVisible(false)}>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.filterSheet, { backgroundColor: colors.background }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Filters</Text>
              <Pressable
                accessibilityRole="button"
                testID="close-filter"
                onPress={() => setFilterVisible(false)}
                style={({ pressed }) => [styles.closeButton, { backgroundColor: colors.muted }, pressed && styles.pressed]}
              >
                <Feather name="x" size={18} color={colors.foreground} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
              <FilterSection title="Price Range" icon="tag">
                <View style={styles.chipRow}>
                  {(vehicleType === 'bike' ? BIKE_PRICE_RANGES : CAR_PRICE_RANGES).map((opt) => (
                    <ChipButton
                      key={opt.value}
                      label={opt.label}
                      active={priceRange === opt.value}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setPriceRange(opt.value);
                        if (opt.value !== 10000) {
                          setSort('high-to-low');
                        }
                      }}
                    />
                  ))}
                </View>
              </FilterSection>

              <FilterSection title="Transmission" icon="settings">
                <View style={styles.chipRow}>
                  {(vehicleType === 'bike' ? BIKE_TRANSMISSION : CAR_TRANSMISSION).map((opt) => (
                    <ChipButton
                      key={opt.value}
                      label={opt.label}
                      active={transmission === opt.value}
                      onPress={() => { Haptics.selectionAsync(); setTransmission(opt.value); }}
                    />
                  ))}
                </View>
              </FilterSection>

              <FilterSection title="Fuel Type" icon="droplet">
                <View style={styles.chipRow}>
                  {(vehicleType === 'bike' ? BIKE_FUEL : CAR_FUEL).map((opt) => (
                    <ChipButton
                      key={opt.value}
                      label={opt.label}
                      active={fuel === opt.value}
                      onPress={() => { Haptics.selectionAsync(); setFuel(opt.value); }}
                    />
                  ))}
                </View>
              </FilterSection>
            </ScrollView>

            <View style={[styles.filterActions, { borderTopColor: colors.border }]}>
              <Pressable
                accessibilityRole="button"
                onPress={clearAllFilters}
                style={({ pressed }) => [styles.resetButton, { borderColor: colors.border }, pressed && styles.pressed]}
              >
                <Feather name="refresh-ccw" size={14} color={colors.foreground} />
                <Text style={[styles.resetText, { color: colors.foreground }]}>Reset</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                testID="apply-filters"
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setFilterVisible(false);
                }}
                style={({ pressed }) => [styles.applyButton, { backgroundColor: navy }, pressed && styles.pressed]}
              >
                <Text style={[styles.applyText, { color: onNavy }]}>
                  Show {filteredCars.length} {vehicleWord}{filteredCars.length === 1 ? '' : 's'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Page>
  );
}

/* ───── Filter / sort chip: navy + white when selected, light + subtle border otherwise (44px tall) ───── */
function Chip({
  label,
  icon,
  selected,
  onPress,
  testID,
}: {
  label: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  selected: boolean;
  onPress: () => void;
  testID?: string;
}) {
  const { colors, navy, onNavy } = useBrandColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      testID={testID}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: selected ? navy : colors.card, borderColor: selected ? navy : colors.border },
        pressed && styles.pressed,
      ]}
    >
      <Feather name={icon} size={14} color={selected ? onNavy : colors.foreground} />
      <Text numberOfLines={1} style={[styles.chipLabel, { color: selected ? onNavy : colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

/* ───── Filter Section ───── */
function FilterSection({ title, icon, children }: { title: string; icon: React.ComponentProps<typeof Feather>['name']; children: React.ReactNode }) {
  const { colors } = useBrandColors();
  return (
    <View style={styles.filterSection}>
      <View style={styles.filterSectionHeader}>
        <Feather name={icon} size={15} color={colors.mutedForeground} />
        <Text style={[styles.filterSectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {children}
    </View>
  );
}

/* ───── Chip Button (inside the filter sheet) ───── */
function ChipButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { colors, navy, onNavy } = useBrandColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.filterChip,
        {
          backgroundColor: active ? navy : colors.card,
          borderColor: active ? navy : colors.border,
        },
      ]}
    >
      <Text style={[styles.filterChipText, { color: active ? onNavy : colors.foreground }]}>
        {label}
      </Text>
    </Pressable>
  );
}

/* ═══════════════ STYLES ═══════════════ */
const styles = StyleSheet.create({
  searchBar: { alignItems: 'center', borderRadius: 15, borderWidth: 1, flexDirection: 'row', marginTop: 12, marginHorizontal: 20, paddingHorizontal: 16, paddingVertical: 12 },
  searchText: { fontFamily: 'Inter_400Regular', fontSize: 14, flex: 1, paddingVertical: 4 },
  sectionGap: { marginTop: 16, marginBottom: 12 },

  // Filter / sort row
  controlsRow: { paddingLeft: 16, paddingRight: 24, gap: 8, marginTop: 12, alignItems: 'center' },
  chip: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
  },
  chipLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  // Results header
  resultsHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 8, marginBottom: 12 },
  resultsTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, letterSpacing: -0.3 },
  resultsSub: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 2 },
  changeDates: { minHeight: 44, justifyContent: 'center' },
  changeDatesText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  // ─── Filter Modal ───
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  filterSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', paddingTop: 8 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
  },
  sheetTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.5 },
  closeButton: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  filterContent: { paddingHorizontal: 24, paddingBottom: 16 },
  filterSection: { marginBottom: 26 },
  filterSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  filterSectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  filterChip: {
    minHeight: 44, justifyContent: 'center',
    paddingHorizontal: 16, borderRadius: 12, borderWidth: 1,
  },
  filterChipText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  filterActions: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1,
  },
  resetButton: {
    minHeight: 48,
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 20, borderRadius: 14, borderWidth: 1,
  },
  resetText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  applyButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 14 },
  applyText: { fontFamily: 'Inter_700Bold', fontSize: 15 },

  pressed: { opacity: 0.7 },
});
