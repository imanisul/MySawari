import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, Pressable, StyleSheet, Text, View, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
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
import { CarListCard, Header, Page, FilterSheet, FilterState, defaultFilters } from '@/components';
import { CarCardSkeleton } from '@/components/loading/CarCardSkeleton';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Car } from '@/utils/sawari';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { useHideSupportWhileScrolling } from '@/hooks/useSupportFab';
import { rise } from '@/components/common/motion';

export default function ExploreScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = useBottomNavHeight();
  const scrollHandlers = useHideSupportWhileScrolling();
  const { vehicleType: globalVehicleType, setBookingSource, setSelectedDate: setGlobalSelectedDate, isAuthLoading, isDarkMode } = useSawari();
  const [vehicleType, setVehicleType] = useState<'All' | 'Cars' | 'Bikes'>(globalVehicleType === 'car' ? 'Cars' : 'Bikes');

  // Fully local date state — completely independent from the Home/Index page
  const defaultToday = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const [exploreDate, setExploreDate] = useState(defaultToday);

  useFocusEffect(
    useCallback(() => {
      setBookingSource('explore');
    }, [setBookingSource])
  );
  
  const [showFilterSheet, setShowFilterSheet] = useState(false);
  const [filters, setFilters] = useState<FilterState>(defaultFilters);

  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Pagination state
  const [page, setPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const PAGE_SIZE = 10;

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
    if (date === exploreDate) return;
    
    // 1. Immediately show skeleton and visually select the date chip
    setIsFiltering(true);
    setExploreDate(date);
    
    // 2. Defer the heavy list filtering to the next JS tick
    // This allows the skeleton to render immediately without dropping frames
    setTimeout(() => {
      setGlobalSelectedDate(date);
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
      
      const carPriceNum = parseInt(car.price.replace(/[^0-9]/g, ''), 10);
      const matchFilterCategory = filters.category === 'All' || car.category === filters.category;
      const matchFilterPrice = filters.maxPrice === 10000 || carPriceNum <= filters.maxPrice;
      const matchFilterTrans = filters.transmission === 'All' || 
                               car.transmission === filters.transmission ||
                               (filters.transmission === 'Gearless' && car.transmission === 'Automatic') ||
                               (filters.transmission === 'Gear' && car.transmission === 'Manual');
      const matchFilterFuel = filters.fuel === 'All' || car.fuel === filters.fuel;

      // If the user is actively searching, only show cars that are actually available
      const matchSearchAvailability = debouncedQuery === '' || isAvailable;

      if (matchType && matchSearch && matchSearchAvailability && matchFilterCategory && matchFilterPrice && matchFilterTrans && matchFilterFuel) {
        acc.push({ ...car, isAvailable, availability });
      }
      return acc;
    }, []).sort((a, b) => {
      // Available vehicles always come first
      if (a.isAvailable !== b.isAvailable) return a.isAvailable ? -1 : 1;
      // Within the same availability group, sort by price
      const priceA = parseInt(a.price.replace(/[^0-9]/g, ''), 10) || 0;
      const priceB = parseInt(b.price.replace(/[^0-9]/g, ''), 10) || 0;
      return filters.maxPrice !== 10000 ? priceB - priceA : priceA - priceB;
    });
  }, [fetchedCars, exploreDate, vehicleType, debouncedQuery, filters]);

  // Pagination slice
  const paginatedCars = useMemo(() => {
    if (isFiltering) return [];
    return filteredCars.slice(0, page * PAGE_SIZE);
  }, [filteredCars, page, isFiltering]);


  const handleLoadMore = () => {
    if (paginatedCars.length < filteredCars.length && !isLoadingMore) {
      setIsLoadingMore(true);
      // Simulate network latency for loading more
      setTimeout(() => {
        setPage(prev => prev + 1);
        setIsLoadingMore(false);
      }, 500);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchVehicles();
    setIsRefreshing(false);
  };

  const renderCar = useCallback(({ item }: { item: typeof cars[0] }) => (
    <CarListCard car={item} effectiveDateRange={exploreDate} />
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
  const listHeaderElement = (
    <Reanimated.View entering={rise()}>
      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <TextInput 
          placeholder="Search by model or type..."
          placeholderTextColor={colors.mutedForeground}
          value={searchQuery}
          onChangeText={setSearchQuery}
          style={[styles.searchText, { color: colors.foreground }]}
          returnKeyType="search"
        />
        <Feather name="search" size={20} color={colors.foreground} />
      </View>

      {/* Vehicle Type Toggle & Filter */}
      <View style={styles.categoryRow}>
        <View style={styles.categoryPills}>
          {(['All', 'Cars', 'Bikes'] as const).map(type => {
            const active = vehicleType === type;
            return (
              <Pressable
                key={type}
                accessibilityRole="button"
                accessibilityLabel={`Show ${type}`}
                onPress={() => {
                  Haptics.selectionAsync();
                  setVehicleType(type as 'All' | 'Cars' | 'Bikes');
                  setFilters(defaultFilters);
                  setPage(1);
                }}
                style={[
                  styles.categoryChip,
                  active
                    ? { backgroundColor: colors.foreground, borderColor: colors.foreground }
                    : { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <Text style={[styles.categoryChipText, { color: active ? colors.background : colors.foreground }]}>
                  {type}
                </Text>
              </Pressable>
            );
          })}
        </View>
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
              backgroundColor: activeFilterCount > 0 ? colors.primary : colors.card,
              borderColor: activeFilterCount > 0 ? colors.primary : colors.border,
            },
          ]}
        >
          <Feather name="sliders" size={14} color={activeFilterCount > 0 ? colors.primaryForeground : colors.foreground} />
          <Text style={[styles.filterButtonText, { color: activeFilterCount > 0 ? colors.primaryForeground : colors.foreground }]}>
            Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </Text>
        </Pressable>
      </View>
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateRow}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open calendar to pick date"
          onPress={() => {
            Haptics.selectionAsync();
            setShowDatePicker(true);
          }}
          style={({ pressed }) => [
            styles.dateChip,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingHorizontal: 12,
            },
            pressed && styles.chipPressed,
          ]}
        >
          <Feather name="calendar" size={16} color={colors.foreground} />
        </Pressable>
        {showDatePicker && (
          <DateTimePicker
            themeVariant={isDarkMode ? 'dark' : 'light'}
            value={currentSelectedDateObj}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )}
        {availableDates.map((date) => {
          const active = date === exploreDate;
          const isAllDates = date === 'All Dates';
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={`Filter by date: ${date}`}
              accessibilityState={{ selected: active }}
              onPress={() => handleDateSelect(date)}
              style={({ pressed }) => [
                styles.dateChip,
                active
                  ? {
                      backgroundColor: colors.primary,
                      borderColor: colors.primary,
                      // Elevated shadow for active chip
                      shadowColor: colors.primary,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.35,
                      shadowRadius: 6,
                      elevation: 4,
                      transform: [{ scale: 1.05 }],
                    }
                  : {
                      backgroundColor: colors.card,
                      borderColor: colors.border,
                    },
                pressed && styles.chipPressed,
              ]}
            >
              <View style={styles.dateChipContent}>
                {isAllDates && (
                  <Feather
                    name="layers"
                    size={13}
                    color={active ? colors.primaryForeground : colors.foreground}
                    style={{ marginRight: 5 }}
                  />
                )}
                <Text
                  style={[
                    styles.dateChipText,
                    {
                      color: active ? colors.primaryForeground : colors.foreground,
                      fontFamily: active ? 'Inter_700Bold' : 'Inter_500Medium',
                    },
                  ]}
                >
                  {date}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Reanimated.View>
  );

  /* ─── ListEmptyComponent ─── */
  const listEmptyElement = (() => {
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
            setExploreDate(defaultToday);
            setGlobalSelectedDate(defaultToday);
            setFilters(defaultFilters);
            setPage(1);
          }}
        >
          <Text style={[styles.clearButtonText, { color: colors.primaryForeground }]}>Clear All Filters</Text>
        </Pressable>
      )}
      </View>
    );
  })();
  return (
    <Page bottomNav scroll={false}>
      {/* ── FIXED: Explore Header ── */}
      <Header title="Explore" hideLogo={false} />

      <FlatList
        style={{ flex: 1 }}
        data={paginatedCars}
        keyExtractor={(item) => item.id}
        renderItem={renderCar}
        ListHeaderComponent={listHeaderElement}
        ListEmptyComponent={listEmptyElement}
        extraData={`${vehicleType}-${exploreDate}-${debouncedQuery}-${activeFilterCount}`}
        showsVerticalScrollIndicator={false}
        // Last card must clear the fixed tab bar (+ safe area) and the floating support button.
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomNavHeight + 88 }]}
        {...scrollHandlers}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        windowSize={5}
        removeClippedSubviews={true}
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

const styles = StyleSheet.create({
  searchBar: { alignItems: 'center', borderRadius: 15, borderWidth: 1, flexDirection: 'row', marginTop: 12, marginHorizontal: 20, paddingHorizontal: 16, paddingVertical: 12 },
  searchText: { fontFamily: 'Inter_400Regular', fontSize: 14, flex: 1, paddingVertical: 4 },

  categoryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, marginTop: 16, marginBottom: 12 },
  categoryPills: { flexDirection: 'row', gap: 10 },
  categoryChip: { paddingVertical: 6, paddingHorizontal: 16, borderRadius: 16, borderWidth: 1 },
  categoryChipText: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },

  filterButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1 },
  filterButtonText: { fontFamily: 'Inter_500Medium', fontSize: 12 },

  dateRow: { gap: 8, paddingHorizontal: 20, paddingTop: 8, paddingBottom: 6 },
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

  listContent: { paddingBottom: 24 },

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