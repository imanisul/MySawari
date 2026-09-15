import React, { useMemo, useState } from 'react';
import { Animated, FlatList, Image, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { usePressAnimation } from '@/hooks/usePressAnimation';
import { fetchResultCars, resultCars, Car, Category } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';
import { Header, Page, Skeleton } from '@/components';
import { shadows } from '@/constants/shadows';

type SortOption = 'low-to-high' | 'high-to-low';
type PriceRange = 'all' | 'under-2000' | '2000-5000' | 'above-5000';
type TransmissionFilter = 'all' | 'Automatic' | 'Manual';
type FuelFilter = 'all' | 'Petrol' | 'Diesel' | 'EV';

const CATEGORY_OPTIONS: Array<{ label: string; value: Category | 'All' }> = [
  { label: 'All', value: 'All' },
  { label: 'SUV', value: 'SUV' },
  { label: 'Sedan', value: 'Sedan' },
  { label: 'Hatchback', value: 'Hatchback' },
  { label: 'Luxury', value: 'Luxury' },
  { label: 'Off-road', value: 'Off-road' },
];

const PRICE_RANGES: Array<{ label: string; value: PriceRange }> = [
  { label: 'All Prices', value: 'all' },
  { label: 'Under ₹2,000', value: 'under-2000' },
  { label: '₹2,000 – ₹5,000', value: '2000-5000' },
  { label: 'Above ₹5,000', value: 'above-5000' },
];

const SORT_OPTIONS: Array<{ label: string; value: SortOption; icon: React.ComponentProps<typeof Feather>['name'] }> = [
  { label: 'Price: Low → High', value: 'low-to-high', icon: 'trending-up' },
  { label: 'Price: High → Low', value: 'high-to-low', icon: 'trending-down' },
];

export default function SearchResultsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { pickup, dropoff, dateRange, mode, selectCar } = useSawari();

  const [filterVisible, setFilterVisible] = useState(false);
  const [category, setCategory] = useState<Category | 'All'>('All');
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
      <Header title="Available Cars" back />
      <FlatList
        data={isLoading ? [] : filteredCars}
        keyExtractor={(car) => car.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
              {isLoading ? 'Searching for cars...' : `${filteredCars.length} cars available`}
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
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No cars found</Text>
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
          <ResultCard car={car} />
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
                  {CATEGORY_OPTIONS.map((opt) => (
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
                  {PRICE_RANGES.map((opt) => (
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
                  {(['all', 'Automatic', 'Manual'] as TransmissionFilter[]).map((opt) => (
                    <ChipButton
                      key={opt}
                      label={opt === 'all' ? 'All' : opt}
                      active={transmission === opt}
                      onPress={() => { Haptics.selectionAsync(); setTransmission(opt); }}
                    />
                  ))}
                </View>
              </FilterSection>

              {/* Fuel Type */}
              <FilterSection title="Fuel Type" icon="droplet">
                <View style={styles.chipRow}>
                  {(['all', 'Petrol', 'Diesel', 'EV'] as FuelFilter[]).map((opt) => (
                    <ChipButton
                      key={opt}
                      label={opt === 'all' ? 'All' : opt}
                      active={fuel === opt}
                      onPress={() => { Haptics.selectionAsync(); setFuel(opt); }}
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
                  Show {filteredCars.length} cars
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

/* ───── Result Card ───── */
function ResultCard({ car }: { car: Car }) {
  const colors = useColors();
  const router = useRouter();
  const { selectCar } = useSawari();
  const { scaleAnim, opacityAnim, onPressIn, onPressOut } = usePressAnimation();

  return (
    <Pressable
      accessibilityRole="button"
      testID={`result-${car.id}`}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        selectCar(car);
        router.push('/car-details');
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View
        style={[
          styles.resultCard,
          shadows.level1,
          { 
            backgroundColor: colors.card,
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
      <View style={styles.imageWrap}>
        <Image source={car.image} resizeMode="cover" style={styles.carImage} />
        <LinearGradient
          colors={['transparent', 'rgba(17,26,43,0.7)']}
          style={styles.imageGradient}
        />
        <View style={[styles.availableBadge, { backgroundColor: colors.primary }]}>
          <View style={styles.availableDot} />
          <Text style={[styles.availableBadgeText, { color: colors.primaryForeground }]}>Available</Text>
        </View>
        <View style={styles.priceOverImage}>
          <Text style={styles.priceOnImage}>{car.price}</Text>
          <Text style={styles.perDayOnImage}>/day</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardTopRow}>
          <Text style={[styles.carName, { color: colors.foreground }]}>{car.name}</Text>
          <View style={[styles.categoryChip, { backgroundColor: colors.muted }]}>
            <Text style={[styles.categoryChipText, { color: colors.mutedForeground }]}>{car.category}</Text>
          </View>
        </View>

        <View style={styles.specsRow}>
          <SpecItem icon="users" label={car.seats} />
          <View style={[styles.specDivider, { backgroundColor: colors.border }]} />
          <SpecItem icon="settings" label={car.transmission} />
          <View style={[styles.specDivider, { backgroundColor: colors.border }]} />
          <SpecItem icon="droplet" label={car.fuel} />
        </View>

        <Pressable
          accessibilityRole="button"
          testID={`book-${car.id}`}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            selectCar(car);
            router.push('/car-details');
          }}
          style={({ pressed }) => [
            styles.bookButton,
            { backgroundColor: colors.primary },
            pressed && styles.bookButtonPressed,
          ]}
        >
          <Text style={[styles.bookButtonText, { color: colors.primaryForeground }]}>View Details</Text>
          <Feather name="arrow-right" size={16} color={colors.primaryForeground} />
        </Pressable>
      </View>
    </Animated.View>
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

  // ─── Result Card ───
  resultCard: {
    borderRadius: 20, marginHorizontal: 20, overflow: 'hidden',
  },
  imageWrap: { position: 'relative', height: 190 },
  carImage: { width: '100%', height: '100%' },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 80 },
  availableBadge: {
    position: 'absolute', top: 14, left: 14, flexDirection: 'row',
    alignItems: 'center', gap: 6, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
  },
  availableDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.3)' },
  availableBadgeText: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  priceOverImage: { position: 'absolute', bottom: 12, right: 14, flexDirection: 'row', alignItems: 'baseline' },
  priceOnImage: { fontFamily: 'Inter_700Bold', fontSize: 22, color: '#FFFFFF' },
  perDayOnImage: { fontFamily: 'Inter_400Regular', fontSize: 12, color: 'rgba(255,255,255,0.8)', marginLeft: 3 },
  cardBody: { padding: 16 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  carName: { fontFamily: 'Inter_600SemiBold', fontSize: 19, flex: 1 },
  categoryChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginLeft: 10 },
  categoryChipText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  specsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 12 },
  specItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  specText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  specDivider: { width: 1, height: 14 },
  bookButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 14, marginTop: 16, paddingVertical: 14,
  },
  bookButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  bookButtonPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  pressed: { opacity: 0.7 },
});