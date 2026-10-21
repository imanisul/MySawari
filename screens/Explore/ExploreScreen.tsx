import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ScrollView, Pressable, StyleSheet, Text, View, TextInput, ActivityIndicator, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { FadeIn } from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { cars, getAvailability, splitDateRange } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import { useVehicles } from '@/hooks/useVehicles';
import { Header, Page, FilterSheet, FilterState, defaultFilters } from '@/components';
import { ExploreCarCard } from '@/components/vehicle/ExploreCarCard';
import { SortSheet, SortKey } from '@/components/booking/SortSheet';
import { CarCardSkeleton } from '@/components/loading/CarCardSkeleton';
import { Car } from '@/utils/sawari';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { useHideSupportWhileScrolling } from '@/hooks/useSupportFab';
import { rise } from '@/components/common/motion';

/** Explore's chips: All, then body type and fuel (the Figma chip row). */
const CATEGORY_CHIPS: { label: string; filter: Partial<FilterState> }[] = [
  { label: 'All', filter: {} },
  { label: 'SUV', filter: { category: 'SUV' } },
  { label: 'Diesel', filter: { fuel: 'Diesel' } },
  { label: 'Petrol', filter: { fuel: 'Petrol' } },
  { label: 'Sedan', filter: { category: 'Sedan' } },
];

function isChipActive(chip: { label: string; filter: Partial<FilterState> }, filters: FilterState) {
  if (chip.label === 'All') return filters.category === 'All' && filters.fuel === 'All';
  if (chip.filter.category) return filters.category === chip.filter.category;
  return filters.fuel === chip.filter.fuel;
}

export default function ExploreScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = useBottomNavHeight();
  const scrollHandlers = useHideSupportWhileScrolling();
  const { vehicleType: globalVehicleType, setBookingSource, setSelectedDate: setGlobalSelectedDate, isAuthLoading, isDarkMode } = useSawari();
  const [vehicleType, setVehicleType] = useState<'All' | 'Cars' | 'Bikes'>(globalVehicleType === 'car' ? 'Cars' : 'Bikes');

  // Fully local date state — completely independent from the Home/Index page
  const [exploreDate, setExploreDate] = useState<string>('');

  useFocusEffect(
    useCallback(() => {
      setBookingSource('explore');
    }, [setBookingSource])
  );
  
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>('recommended');
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 3;

  // Debounce effect
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
      setPage(1); // Reset page on new search
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const [isFiltering, setIsFiltering] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateSelect = useCallback((date: string) => {
    Haptics.selectionAsync();
    
    // 1. Immediately show skeleton and visually update the date chip
    setIsFiltering(true);
    
    const newDate = date === exploreDate ? '' : date;
    setExploreDate(newDate);
    
    // 2. Defer the heavy list filtering to the next JS tick
    // This allows the skeleton to render immediately without dropping frames
    setTimeout(() => {
      setGlobalSelectedDate(newDate);
      setPage(1);

      // Keep skeleton up slightly longer so the list layout doesn't flash jarringly
      setTimeout(() => {
        setIsFiltering(false);
      }, 150);
    }, 0);
  }, [exploreDate, setGlobalSelectedDate]);

  const currentSelectedDateObj = useMemo(() => {
    let d = new Date();
    if (exploreDate && !exploreDate.includes('–')) {
      const parts = exploreDate.trim().split(' ');
      if (parts.length >= 2) {
        const day = parseInt(parts[0], 10);
        const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Sept'];
        let month = MONTHS.indexOf(parts[1]);
        if (month === 12) month = 8;
        if (month !== -1 && !isNaN(day)) {
          const currentYear = new Date().getFullYear();
          d = new Date(currentYear, month, day);
          if (d < new Date(new Date().setHours(0,0,0,0))) {
            d.setFullYear(currentYear + 1);
          }
        }
      }
    }
    return d;
  }, [exploreDate]);

  const onDateChange = (event: DateTimePickerEvent, selectedDateObj?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDateObj) {
      const formattedDate = selectedDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      handleDateSelect(formattedDate);
    }
  };

  const default90Dates = useMemo(() => {
    const dates: string[] = [];
    const today = new Date();
    
    // Generate the next 90 days starting exactly from today
    for (let i = 0; i < 90; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
    }
    return dates;
  }, []);

  const availableDates = useMemo(() => {
    // If it's a date range (e.g. "21 Sep – 25 Sep") or a date beyond 90 days, add it to the front
    if (exploreDate && !default90Dates.includes(exploreDate)) {
      return [exploreDate, ...default90Dates];
    }
    return default90Dates;
  }, [exploreDate, default90Dates]);

  // Availability for any date is derived from the same fetched data, so the date is not part of the key.
  const { data: fetchedCars = [], isLoading: isFetchingCars, isError: fetchError, refetch: fetchVehicles } = useVehicles();

  const filteredCars = useMemo(() => {
    const isAllDates = false; // All Dates is removed
    const [startStr, endStr] = isAllDates ? [undefined, undefined] : splitDateRange(exploreDate);

    return (fetchedCars || []).reduce((acc: Car[], car: Car) => {
      // Compute availability for the selected date
      const availability = getAvailability(car, startStr, endStr);
      const isAvailable = availability.available;

      const matchType = vehicleType === 'All' || 
                        (vehicleType === 'Bikes' && car.type === 'Bike') ||
                        (vehicleType === 'Cars' && car.type === 'Car');
      const query = debouncedQuery.toLowerCase();
      const matchSearch = query === '' || 
                          car.name.toLowerCase().includes(query) ||
                          car.category.toLowerCase().includes(query) ||
                          (car.manufacturer && car.manufacturer.toLowerCase().includes(query));
      
      // Budget is per day, so compare the day rate (the same number the card shows).
      const carPriceNum = car.perDay ?? parseInt(car.price.replace(/[^0-9]/g, ''), 10);
      const matchFilterCategory = filters.category === 'All' || car.category === filters.category;
      const matchFilterPrice = filters.maxPrice === 10000 || carPriceNum <= filters.maxPrice;
      const matchFilterTrans = filters.transmission === 'All' || 
                               car.transmission === filters.transmission ||
                               (filters.transmission === 'Gearless' && car.transmission === 'Automatic') ||
                               (filters.transmission === 'Gear' && car.transmission === 'Manual');
      const matchFilterFuel = filters.fuel === 'All' || car.fuel === filters.fuel;

      // Allow all matching cars, even if unavailable/on rent, to show in the search results
      const matchSearchAvailability = true;
      
      // Do not show vehicles that are in maintenance on the explore page
      const isMaintenance = car.dbStatus?.toLowerCase() === 'service' || car.dbStatus?.toLowerCase() === 'maintenance';
      if (isMaintenance) {
        return acc;
      }

      if (matchType && matchSearch && matchSearchAvailability && matchFilterCategory && matchFilterPrice && matchFilterTrans && matchFilterFuel) {
        acc.push({ ...car, isAvailable, availability });
      }
      return acc;
    }, []).sort((a, b) => {
      // Available vehicles always come first
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      // Within the same availability group, sort by price
      switch (sortBy) {
        case 'price_asc': return (a.perDay ?? 0) - (b.perDay ?? 0);
        case 'price_desc': return (b.perDay ?? 0) - (a.perDay ?? 0);
        case 'rating': return (b.rating ?? 0) - (a.rating ?? 0);
        default: {
          const priceA = parseInt(a.price.replace(/[^0-9]/g, ''), 10) || 0;
          const priceB = parseInt(b.price.replace(/[^0-9]/g, ''), 10) || 0;
          return filters.maxPrice !== 10000 ? priceB - priceA : priceA - priceB;
        }
      }
    });
  }, [fetchedCars, exploreDate, vehicleType, debouncedQuery, filters, sortBy]);

  // Pagination slice
  const paginatedCars = useMemo(() => {
    if (isFiltering) return [];
    return filteredCars.slice(0, page * PAGE_SIZE);
  }, [filteredCars, page, isFiltering]);


  const handleLoadMore = () => {
    if (paginatedCars.length < filteredCars.length && !isLoadingMore) {
      // The next batch is already on the phone: show it immediately (no artificial wait).
      setPage(prev => prev + 1);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchVehicles();
    setIsRefreshing(false);
  };

  const keyExtractor = useCallback((item: Car) => item.id, []);

  // Explore uses its own Figma card; the shared CarListCard stays as it is for the other screens.
  const renderCar = useCallback(({ item, index }: { item: typeof cars[0]; index: number }) => (
    <ExploreCarCard car={item} dateRange={exploreDate} index={index} />
  ), [exploreDate]);



  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'All') count++;
    if (filters.maxPrice !== 10000) count++;
    if (filters.transmission !== 'All') count++;
    if (filters.fuel !== 'All') count++;
    return count;
  }, [filters]);

  /* ─── ListHeaderComponent: Search + Filters + Dates ─── */
  const listHeaderElement = useMemo(() => (
    <Reanimated.View entering={rise()}>
      {/* ── SCROLLABLE: Explore Header ── */}
      {/* Figma: "Explore" is Semibold/xxl (24px) in black. */}
      <Header
        title="Explore"
        hideLogo={true}
        horizontalPadding={16}
        titleStyle={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 24, lineHeight: 36, letterSpacing: 0, color: '#000000' }}
      />

      {/* Search Bar */}
      {/* Figma: white 40px field, Primary/blue-50 border, search icon leading, "Search cars and bike",
          and a 48px sliders button beside it (the same filter sheet as the chip row's Filter). */}
      <View style={styles.searchRow}>
        {/* Light mode uses the Figma values (white, Primary/blue-50 border); dark mode keeps the app's tokens. */}
        <View style={[styles.searchBar, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF', borderColor: isDarkMode ? colors.border : '#EAECF1' }]}>
          <Feather name="search" size={20} color="#737373" />
          <TextInput
            placeholder="Search cars and bike"
            placeholderTextColor="#737373"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.searchText, { color: colors.foreground }]}
            returnKeyType="search"
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Sort and filter"
          onPress={() => {
            Haptics.selectionAsync();
            setShowSortSheet(true);
          }}
          style={[styles.sliderButton, { backgroundColor: isDarkMode ? colors.card : '#F9F9FB', borderColor: isDarkMode ? colors.border : '#EAECF1' }]}
        >
          <FilterLinesIcon color="#737373" />
        </Pressable>
      </View>

      {/* Vehicle Type Toggle & Filter */}
      {/* Figma: one row that scrolls sideways: Filter first, then All / SUV / Diesel / Petrol / Sedan. */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Filters${activeFilterCount > 0 ? ` (${activeFilterCount} active)` : ''}`}
          onPress={() => {
            Haptics.selectionAsync();
            setShowFilterSheet(true);
          }}
          style={[
            styles.filterButton,
            {
              backgroundColor: activeFilterCount > 0 ? colors.primary : isDarkMode ? colors.card : '#F9F9FB',
              borderColor: activeFilterCount > 0 ? colors.primary : isDarkMode ? colors.border : '#EAECF1',
            },
          ]}
        >
          <Feather name="filter" size={16} color={activeFilterCount > 0 ? colors.primaryForeground : isDarkMode ? colors.foreground : '#737373'} />
          <Text style={[styles.filterButtonText, { color: activeFilterCount > 0 ? colors.primaryForeground : isDarkMode ? colors.foreground : '#737373' }]}>
            Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </Pressable>
        {CATEGORY_CHIPS.map(chip => {
          const active = isChipActive(chip, filters);
          return (
            <Pressable
              key={chip.label}
              accessibilityRole="button"
              accessibilityLabel={`Show ${chip.label}`}
              accessibilityState={{ selected: active }}
              onPress={() => {
                Haptics.selectionAsync();
                setVehicleType('All');
                setFilters({ ...defaultFilters, ...chip.filter });
                setPage(1);
              }}
              style={[
                styles.categoryChip,
                active
                  ? { backgroundColor: '#2F3E75', borderColor: '#2F3E75' }
                  : { backgroundColor: '#FFFFFF', borderColor: '#EAECF1' },
              ]}
            >
              <Text style={[styles.categoryChipText, { color: active ? '#FFFFFF' : '#737373' }]}>{chip.label}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

    </Reanimated.View>
  ), [searchQuery, setSearchQuery, colors, vehicleType, setVehicleType, setFilters, setPage,
      activeFilterCount, showFilterSheet, setShowFilterSheet, exploreDate, handleDateSelect,
      availableDates, showDatePicker, setShowDatePicker, isDarkMode, currentSelectedDateObj,
      onDateChange, defaultFilters, filters]);

  /* ─── ListEmptyComponent ─── */
  const listEmptyElement = useMemo(() => {
    if (isFetchingCars || isFiltering) {
      return (
        <Reanimated.View entering={FadeIn.duration(200)} style={{ paddingTop: 16 }}>
          {[1, 2, 3].map(i => (
            <CarCardSkeleton key={i} index={i} />
          ))}
        </Reanimated.View>
      );
    }
    
    if (fetchError) {
      return (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Feather name="alert-circle" size={28} color={colors.destructive} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Connection Error</Text>
          <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>
            Could not load vehicles. Check your connection and try again.
          </Text>
          <Pressable style={[styles.clearButton, { backgroundColor: colors.primary, marginTop: 16 }]} onPress={() => fetchVehicles()}>
            <Text style={[styles.clearButtonText, { color: colors.primaryForeground }]}>Retry</Text>
          </Pressable>
        </View>
      );
    }

    return (
      <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
        <Feather name="search" size={28} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          {vehicleType === 'Bikes' ? 'No bikes available' : 'No cars available'}
        </Text>
        <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>
          {debouncedQuery !== ''
            ? `No results matching "${debouncedQuery}". Try adjusting your search.`
            : `No ${vehicleType === 'Bikes' ? 'bikes' : vehicleType === 'Cars' ? 'cars' : 'vehicles'} are available on ${exploreDate}. Try another date.`
          }
        </Text>
      {(debouncedQuery !== '' || activeFilterCount > 0) && (
        <Pressable
          accessibilityRole="button"
          style={[styles.clearButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setSearchQuery('');
            setDebouncedQuery('');
            setExploreDate('');
            setGlobalSelectedDate('');
            setFilters(defaultFilters);
            setPage(1);
          }}
        >
          <Text style={[styles.clearButtonText, { color: colors.primaryForeground }]}>Clear All Filters</Text>
        </Pressable>
      )}
      </View>
    );
  }, [isFetchingCars, isFiltering, fetchError, colors, vehicleType, debouncedQuery,
      exploreDate, activeFilterCount, setSearchQuery, setDebouncedQuery,
      setExploreDate, setGlobalSelectedDate, setFilters, setPage, fetchVehicles]);
  return (
    <Page bottomNav scroll={false}>
      <FlatList
        style={{ flex: 1 }}
        data={paginatedCars}
        keyExtractor={keyExtractor}
        renderItem={renderCar}
        ListHeaderComponent={listHeaderElement}
        ListEmptyComponent={listEmptyElement}
        showsVerticalScrollIndicator={false}
        // Last card must clear the fixed tab bar (+ safe area) and the floating support button.
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomNavHeight + 88 }]}
        {...scrollHandlers}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={11}
        removeClippedSubviews={false}
        refreshing={isRefreshing}
        onRefresh={handleRefresh}
        ListFooterComponent={
          isLoadingMore ? (
            <View style={styles.loadingFooter}>
              <ActivityIndicator size="small" color={colors.primaryText} />
              <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading more...</Text>
            </View>
          ) : null
        }
      />

      <SortSheet
        visible={showSortSheet}
        onClose={() => setShowSortSheet(false)}
        value={sortBy}
        onApply={setSortBy}
      />
      <FilterSheet 
        visible={showFilterSheet} 
        onClose={() => setShowFilterSheet(false)} 
        filters={filters}
        setFilters={setFilters}
        vehicleType={vehicleType}
      />
    </Page>
  );
}

/** Figma filter icon: three centred horizontal bars, longest on top. */
function FilterLinesIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path d="M3 6H21M6 12H18M9 18H15" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  // Figma: the search row sits on a 16px side gutter, 8px between the field and the sliders button.
  // Figma: the search block starts 4px under the title (its own 4px top padding).
  searchRow: { flexDirection: 'row', gap: 8, height: 40, marginTop: 4, marginHorizontal: 16 },
  searchBar: { alignItems: 'center', borderRadius: 8, borderWidth: 1, flex: 1, flexDirection: 'row', gap: 9, height: 40, paddingHorizontal: 12 },
  sliderButton: { alignItems: 'center', borderRadius: 8, borderWidth: 1, height: 40, justifyContent: 'center', width: 48 },
  searchText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, flex: 1, paddingVertical: 0 },

  // Figma: the chip row is 8px top and bottom padding around the 36px chips.
  // Scrolling row: the chips and Filter are 8px apart and start on the 16px gutter.
  categoryRow: { alignItems: 'center', flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8, marginTop: 8, marginBottom: 8 },
  // Figma chips: 36px tall, 8px radius, 8px apart.
  categoryPills: { flexDirection: 'row', gap: 8 },
  categoryChip: { height: 36, justifyContent: 'center', paddingHorizontal: 12, borderRadius: 8, borderWidth: 1 },
  categoryChipText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },

  // Figma Filter chip: 70x36, padding 6/8, gap 4, 8px radius (min width keeps a count like "(12)" from clipping).
  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 4, height: 36, minWidth: 70, paddingHorizontal: 8, borderRadius: 8, borderWidth: 1 },
  filterButtonText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },

  dateChip: {
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateChipText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  dateChipContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  chipPressed: { opacity: 0.7 },

  // Figma list: 16px side gutter; the cards are 361px wide.
  listContent: { paddingBottom: 24, paddingHorizontal: 16 },

  emptyState: { borderRadius: 18, marginTop: 18, marginHorizontal: 20, padding: 20, alignItems: 'center' },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  emptyCopy: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 7, textAlign: 'center' },
  clearButton: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  clearButtonText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },

  skeletonCard: {
    height: 220,
    width: '100%',
    borderRadius: 24,
    borderWidth: 1,
    marginBottom: 24,
    opacity: 0.5,
  },

  loadingFooter: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  loadingText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
});