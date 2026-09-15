import React, { useMemo, useState } from 'react';
import { Animated, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { usePressAnimation } from '@/hooks/usePressAnimation';
import { fetchResultCars, resultCars, Car, Category } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';
import { Header, Page, Skeleton, CarListCard } from '@/components';

type SortOption = 'low-to-high' | 'high-to-low';
type PriceRange = 'all' | 'under-2000' | '2000-5000' | 'above-5000' | 'under-1000' | '1000-1500' | 'above-1500';
type TransmissionFilter = 'all' | 'Automatic' | 'Manual';
type FuelFilter = 'all' | 'Petrol' | 'Diesel' | 'EV';

const CAR_CATEGORY_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'All', value: 'All' },
  { label: 'SUV', value: 'SUV' },
  { label: 'Sedan', value: 'Sedan' },
  { label: 'Hatchback', value: 'Hatchback' },
  { label: 'Luxury', value: 'Luxury' },
  { label: 'Off-road', value: 'Off-road' },
];

const BIKE_CATEGORY_OPTIONS: Array<{ label: string; value: string }> = [
  { label: 'All', value: 'All' },
  { label: 'Cruiser', value: 'Bike' },
  { label: 'Off-road', value: 'Off-road' },
  { label: 'Scooter', value: 'Scooter' },
];

const CAR_PRICE_RANGES: Array<{ label: string; value: PriceRange }> = [
  { label: 'All Prices', value: 'all' },
  { label: 'Under ₹2,000', value: 'under-2000' },
  { label: '₹2,000 – ₹5,000', value: '2000-5000' },
  { label: 'Above ₹5,000', value: 'above-5000' },
];

const BIKE_PRICE_RANGES: Array<{ label: string; value: PriceRange }> = [
  { label: 'All Prices', value: 'all' },
  { label: 'Under ₹1,000', value: 'under-1000' },
  { label: '₹1,000 – ₹1,500', value: '1000-1500' },
  { label: 'Above ₹1,500', value: 'above-1500' },
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
  { label: 'Price: Low → High', value: 'low-to-high', icon: 'trending-up' },
  { label: 'Price: High → Low', value: 'high-to-low', icon: 'trending-down' },
];

export default function SearchResultsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pickup, dropoff, dateRange, mode, selectCar, vehicleType } = useSawari();

  const [filterVisible, setFilterVisible] = useState(false);
  const [category, setCategory] = useState<string>('All');
  const [priceRange, setPriceRange] = useState<PriceRange>('all');
  const [transmission, setTransmission] = useState<TransmissionFilter>('all');
  const [fuel, setFuel] = useState<FuelFilter>('all');
  const [sort, setSort] = useState<SortOption>('low-to-high');

  const { data: fetchedResultCars = resultCars, isLoading } = useQuery({
    queryKey: ['resultCars'],
    queryFn: fetchResultCars,
  });

  const activeFilterCount = [
    category !== 'All',
    priceRange !== 'all',
    transmission !== 'all',
    fuel !== 'all',
  ].filter(Boolean).length;

  const filteredCars = useMemo(() => {
    let result = [...fetchedResultCars];

    // Vehicle Type filter
    if (vehicleType === 'bike') {
      result = result.filter((c) => c.type === 'Bike');
    } else {
      result = result.filter((c) => c.type === 'Car' || !c.type);
    }

    // Category filter
    if (category !== 'All') {
      result = result.filter((c) => c.category === category);
    }

    // Price filter
    if (priceRange === 'under-2000') {
      result = result.filter((c) => c.perDay < 2000);
    } else if (priceRange === '2000-5000') {
      result = result.filter((c) => c.perDay >= 2000 && c.perDay <= 5000);
    } else if (priceRange === 'above-5000') {
      result = result.filter((c) => c.perDay > 5000);
    } else if (priceRange === 'under-1000') {
      result = result.filter((c) => c.perDay < 1000);
    } else if (priceRange === '1000-1500') {
      result = result.filter((c) => c.perDay >= 1000 && c.perDay <= 1500);
    } else if (priceRange === 'above-1500') {
      result = result.filter((c) => c.perDay > 1500);
    }

    // Transmission filter
    if (transmission !== 'all') {
      result = result.filter((c) => c.transmission === transmission);
    }

    // Fuel filter
    if (fuel !== 'all') {
      result = result.filter((c) => c.fuel === fuel);
    }

    // Sort
    if (sort === 'low-to-high') {
      result.sort((a, b) => a.perDay - b.perDay);
    } else if (sort === 'high-to-low') {
      result.sort((a, b) => b.perDay - a.perDay);
    }

    return result;
  }, [fetchedResultCars, category, priceRange, transmission, fuel, sort]);

  const clearAllFilters = () => {
    setCategory('All');
    setPriceRange('all');
    setTransmission('all');
    setFuel('all');
    setSort('low-to-high');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  return (
    <Page bottomNav scroll={false}>
      <Header title={vehicleType === 'bike' ? "Available Bikes" : "Available Cars"} back />
      <FlatList
        data={isLoading ? [] : filteredCars}
        keyExtractor={(car) => car.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            {/* Trip info pills */}
            <View style={styles.tripPills}>
              <Pressable 
                onPress={() => router.push('/location')}
                style={({ pressed }) => [styles.pill, { backgroundColor: colors.muted }, pressed && styles.pressed]}
              >
                <Feather name="map-pin" size={12} color={colors.accentForeground} />
                <Text numberOfLines={1} style={[styles.pillText, { color: colors.foreground }]}>{pickup?.name || 'Current Location'}</Text>
              </Pressable>
              
              <Pressable 
                onPress={() => router.push('/dropoff')}
                style={({ pressed }) => [styles.pill, { backgroundColor: colors.muted }, pressed && styles.pressed]}
              >
                <Feather name="flag" size={12} color={colors.accentForeground} />
                <Text numberOfLines={1} style={[styles.pillText, { color: colors.foreground }]}>{dropoff?.name || 'Current Location'}</Text>
              </Pressable>

              <Pressable 
                onPress={() => router.push('/dates')}
                style={({ pressed }) => [styles.pill, { backgroundColor: colors.muted }, pressed && styles.pressed]}
              >
                <Feather name="calendar" size={12} color={colors.accentForeground} />
                <Text style={[styles.pillText, { color: colors.foreground }]}>{dateRange}</Text>
              </Pressable>
              
              <View style={[styles.pill, { backgroundColor: colors.muted }]}>
                <Feather name="user" size={12} color={colors.accentForeground} />
                <Text style={[styles.pillText, { color: colors.foreground }]}>{mode}</Text>
              </View>
            </View>

            {/* Filter & Sort bar */}
            <View style={styles.toolbar}>
              <Pressable
                accessibilityRole="button"
                testID="filter-button"
                onPress={() => {
                  Haptics.selectionAsync();
                  setFilterVisible(true);
                }}
                style={({ pressed }) => [
                  styles.toolButton,
                  { backgroundColor: activeFilterCount > 0 ? colors.primary : colors.card, borderColor: colors.border },
                  pressed && styles.pressed,
                ]}
              >
                <Feather name="sliders" size={14} color={activeFilterCount > 0 ? colors.primaryForeground : colors.foreground} />
                <Text style={[styles.toolText, { color: activeFilterCount > 0 ? colors.primaryForeground : colors.foreground }]}>
                  Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </Text>
              </Pressable>

              {/* Quick sort pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.sortRow}>
                {SORT_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.value}
                    accessibilityRole="button"
                    onPress={() => {
                      Haptics.selectionAsync();
                      setSort(opt.value);
                    }}
                    style={[
                      styles.sortPill,
                      {
                        backgroundColor: sort === opt.value ? colors.navy : colors.card,
                        borderColor: sort === opt.value ? colors.navy : colors.border,
                      },
                    ]}
                  >
                    <Feather name={opt.icon} size={12} color={sort === opt.value ? '#FFF' : colors.foreground} />
                    <Text style={[styles.sortPillText, { color: sort === opt.value ? '#FFF' : colors.foreground }]}>
                      {opt.label}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Results count */}
            <Text style={[styles.resultCount, { color: colors.foreground }]}>
              {isLoading ? `Searching for ${vehicleType}s...` : `${filteredCars.length} ${vehicleType}s available`}
            </Text>
          </View>
        }
        ListEmptyComponent={
          isLoading ? (
            <View style={styles.loadingContainer}>
              <SkeletonResultCard />
              <SkeletonResultCard />
              <SkeletonResultCard />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <View style={[styles.emptyIcon, { backgroundColor: colors.muted }]}>
                <Feather name="search" size={28} color={colors.mutedForeground} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No {vehicleType}s found</Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Try adjusting your filters to see more results</Text>
              <Pressable
                accessibilityRole="button"
                onPress={clearAllFilters}
                style={({ pressed }) => [styles.clearButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
              >
                <Text style={[styles.clearButtonText, { color: colors.primaryForeground }]}>Clear All Filters</Text>
              </Pressable>
            </View>
          )
        }
        renderItem={({ item: car }) => (
          <CarListCard car={car} isExplore={false} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
      />

      {/* Filter Modal */}
      <Modal visible={filterVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.filterSheet, { backgroundColor: colors.background }]}>
            {/* Sheet header */}
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
              {/* Category */}
              <FilterSection title="Category" icon="grid">
                <View style={styles.chipRow}>
                  {(vehicleType === 'bike' ? BIKE_CATEGORY_OPTIONS : CAR_CATEGORY_OPTIONS).map((opt) => (
                    <ChipButton
                      key={opt.value}
                      label={opt.label}
                      active={category === opt.value}
                      onPress={() => { Haptics.selectionAsync(); setCategory(opt.value); }}
                    />
                  ))}
                </View>
              </FilterSection>

              {/* Price Range */}
              <FilterSection title="Price Range" icon="tag">
                <View style={styles.chipRow}>
                  {(vehicleType === 'bike' ? BIKE_PRICE_RANGES : CAR_PRICE_RANGES).map((opt) => (
                    <ChipButton
                      key={opt.value}
                      label={opt.label}
                      active={priceRange === opt.value}
                      onPress={() => { Haptics.selectionAsync(); setPriceRange(opt.value); }}
                    />
                  ))}
                </View>
              </FilterSection>

              {/* Transmission */}
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

              {/* Fuel Type */}
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

            {/* Bottom actions */}
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
                style={({ pressed }) => [styles.applyButton, { backgroundColor: colors.primary }, pressed && styles.pressed]}
              >
                <Text style={[styles.applyText, { color: colors.primaryForeground }]}>
                  Show {filteredCars.length} {vehicleType}s
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Page>
  );
}

/* ───── Filter Section ───── */
function FilterSection({ title, icon, children }: { title: string; icon: React.ComponentProps<typeof Feather>['name']; children: React.ReactNode }) {
  const colors = useColors();
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

/* ───── Chip Button ───── */
function ChipButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: active ? colors.primary : colors.card,
          borderColor: active ? colors.primary : colors.border,
        },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? colors.primaryForeground : colors.foreground }]}>
        {label}
      </Text>
    </Pressable>
  );
}


/* ───── Skeleton Result Card ───── */
function SkeletonResultCard() {
  const colors = useColors();
  return (
    <View style={[styles.resultCard, { backgroundColor: colors.card, marginBottom: 16 }]}>
      <Skeleton height={190} borderRadius={0} />
      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Skeleton width="50%" height={24} />
          <Skeleton width={60} height={20} />
        </View>
        <View style={styles.specsRow}>
          <Skeleton width="70%" height={16} />
        </View>
        <View style={{ marginTop: 16 }}>
          <Skeleton height={48} borderRadius={14} />
        </View>
      </View>
    </View>
  );
}

/* ───── Spec Item ───── */
function SpecItem({ icon, label }: { icon: React.ComponentProps<typeof Feather>['name']; label: string }) {
  const colors = useColors();
  return (
    <View style={styles.specItem}>
      <Feather name={icon} size={13} color={colors.mutedForeground} />
      <Text style={[styles.specText, { color: colors.foreground }]}>{label}</Text>
    </View>
  );
}

/* ═══════════════ STYLES ═══════════════ */
const styles = StyleSheet.create({
  listContent: { paddingBottom: 20 },
  listHeader: { paddingHorizontal: 20, paddingTop: 8 },

  // Trip pills
  tripPills: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20,
  },
  pillText: { fontFamily: 'Inter_500Medium', fontSize: 12 },

  // Toolbar
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  toolButton: {
    alignItems: 'center', borderRadius: 12, borderWidth: 1,
    flexDirection: 'row', gap: 7, paddingHorizontal: 14, paddingVertical: 10,
  },
  toolText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  // Sort pills (inline)
  sortRow: { gap: 8, alignItems: 'center' },
  sortPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1,
  },
  sortPillText: { fontFamily: 'Inter_500Medium', fontSize: 11 },

  // Results count
  resultCount: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.5, marginTop: 20, marginBottom: 6 },

  // Loading
  loadingContainer: { paddingTop: 20 },

  // Empty state
  emptyContainer: { alignItems: 'center', justifyContent: 'center', paddingTop: 60, paddingHorizontal: 40, gap: 12 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  emptySubtitle: { fontFamily: 'Inter_400Regular', fontSize: 13, textAlign: 'center', lineHeight: 19 },
  clearButton: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  clearButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  // ─── Filter Modal ───
  modalOverlay: { flex: 1, justifyContent: 'flex-end' },
  filterSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight: '85%', paddingTop: 8 },
  sheetHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingVertical: 16,
  },
  sheetTitle: { fontFamily: 'Inter_700Bold', fontSize: 22, letterSpacing: -0.5 },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  filterContent: { paddingHorizontal: 24, paddingBottom: 16 },
  filterSection: { marginBottom: 26 },
  filterSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  filterSectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  filterActions: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 24, paddingVertical: 16, borderTopWidth: 1,
  },
  resetButton: {
    flexDirection: 'row', alignItems: 'center', gap: 7,
    paddingHorizontal: 20, paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  resetText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  applyButton: { flex: 1, alignItems: 'center', paddingVertical: 15, borderRadius: 14 },
  applyText: { fontFamily: 'Inter_700Bold', fontSize: 15 },

  pressed: { opacity: 0.7 },
});