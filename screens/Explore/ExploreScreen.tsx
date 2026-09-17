import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, Pressable, StyleSheet, Text, View, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useFocusEffect, useRouter } from 'expo-router';
import { cars, premiumCollection, checkCarAvailability } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';
import { CarListCard, Header, Page, FilterSheet, FilterState, defaultFilters } from '@/components';
import { MonthCalendar } from '@/components/booking/MonthCalendar';

export default function ExploreScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<string>('All Dates');
  const { vehicleType: globalVehicleType, setBookingSource, setDateRange, dateRange } = useSawari();
  const [vehicleType, setVehicleType] = useState<'All' | 'Cars' | 'Bikes'>(globalVehicleType === 'car' ? 'Cars' : 'Bikes');
  
  const [start, setStart] = useState<Date | null>(null);
  const [end, setEnd] = useState<Date | null>(null);

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const handleDateSelect = (date: Date) => {
    if (start && end) {
      // Starting a fresh selection after a completed range was already picked.
      setStart(date);
      setEnd(null);
      setSelectedDate('All Dates');
      setDateRange('All Dates');
      return;
    }
    if (start && !end) {
      if (date < start) {
        setStart(date);
      } else {
        setEnd(date);
        const rangeStr = `${start.getDate()} ${MONTHS[start.getMonth()]} – ${date.getDate()} ${MONTHS[date.getMonth()]}`;
        setSelectedDate(rangeStr);
        setDateRange(rangeStr);
      }
      return;
    }
    // Picking the start date: clear the local filter immediately so the list
    // doesn't stay filtered by a stale range while an end date is chosen.
    // (The shared booking dateRange is left untouched until a full range is
    // confirmed, so an in-progress pick here doesn't clobber Home's dates.)
    setStart(date);
    setEnd(null);
    setSelectedDate('All Dates');
  };

  const handleClearDates = () => {
    setStart(null);
    setEnd(null);
    setSelectedDate('All Dates');
    setDateRange('All Dates');
  };

  // Only reflect the shared booking dateRange (used by Home/Booking's quote
  // flow) once the user has actually picked a range on this screen — its
  // initial value is just a mock default for pricing, not a real selection,
  // so syncing it in on mount would silently filter the list.
  const hasSyncedFromExplore = React.useRef(false);
  useEffect(() => {
    if (!hasSyncedFromExplore.current) {
      hasSyncedFromExplore.current = true;
      return;
    }
    if (dateRange && !dateRange.includes('Select') && dateRange !== 'All Dates') {
      setSelectedDate(dateRange);
    } else if (dateRange === 'All Dates' || !dateRange) {
      setSelectedDate('All Dates');
      setStart(null);
      setEnd(null);
    }
  }, [dateRange]);

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



  const filteredCars = useMemo(() => {
    return cars.filter(car => {
      let matchDate = true;
      if (selectedDate !== 'All Dates') {
        const [startStr, endStr] = selectedDate.split(' – ');
        matchDate = checkCarAvailability(car, startStr, endStr);
      }
      
      const matchType = vehicleType === 'All' || 
                        (vehicleType === 'Bikes' && car.type === 'Bike') ||
                        (vehicleType === 'Cars' && car.type === 'Car');
      const matchSearch = debouncedQuery === '' || 
                          car.name.toLowerCase().includes(debouncedQuery.toLowerCase()) ||
                          car.category.toLowerCase().includes(debouncedQuery.toLowerCase());
      
      const carPriceNum = parseInt(car.price.replace(/[^0-9]/g, ''), 10);
      const matchFilterCategory = filters.category === 'All' || car.category === filters.category;
      const matchFilterPrice = filters.maxPrice === 10000 || carPriceNum <= filters.maxPrice;
      const matchFilterTrans = filters.transmission === 'All' || car.transmission === filters.transmission;
      const matchFilterFuel = filters.fuel === 'All' || car.fuel === filters.fuel;

      return matchDate && matchType && matchSearch && matchFilterCategory && matchFilterPrice && matchFilterTrans && matchFilterFuel;
    });
  }, [selectedDate, vehicleType, debouncedQuery, filters]);

  // Pagination slice
  const paginatedCars = useMemo(() => {
    return filteredCars.slice(0, page * PAGE_SIZE);
  }, [filteredCars, page]);

  const handleLoadMore = () => {
    if (paginatedCars.length < filteredCars.length && !isLoadingMore) {
      setIsLoadingMore(true);
      // Simulate network latency for loading more
      setTimeout(() => {
        setPage(p => p + 1);
        setIsLoadingMore(false);
      }, 400);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setPage(1);
      setIsRefreshing(false);
    }, 600);
  };

  const renderCar = useCallback(({ item }: { item: typeof cars[0] }) => (
    <CarListCard car={item} />
  ), []);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category !== 'All') count++;
    if (filters.maxPrice !== 10000) count++;
    if (filters.transmission !== 'All') count++;
    if (filters.fuel !== 'All') count++;
    return count;
  }, [filters]);

  /* ─── ListHeaderComponent: Search + Filters + Dates ─── */
  const ListHeader = useCallback(() => (
    <View>
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
      
      <View style={{ marginTop: 16 }}>
        <View style={styles.dateStatusRow}>
          <Text style={[styles.dateStatusText, { color: colors.foreground }]}>
            {start && !end
              ? `${start.getDate()} ${MONTHS[start.getMonth()]} – Select return date`
              : selectedDate !== 'All Dates'
              ? selectedDate
              : 'Any date'}
          </Text>
          {(selectedDate !== 'All Dates' || start) && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear selected dates"
              onPress={() => {
                Haptics.selectionAsync();
                handleClearDates();
              }}
              hitSlop={8}
            >
              <Text style={[styles.dateClearText, { color: colors.primary }]}>Clear</Text>
            </Pressable>
          )}
        </View>
        <MonthCalendar start={start} end={end} onPress={handleDateSelect} />
      </View>
    </View>
  ), [colors, searchQuery, vehicleType, selectedDate, activeFilterCount, start, end]);

  /* ─── ListEmptyComponent ─── */
  const ListEmpty = useCallback(() => (
    <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
      <Feather name="search" size={28} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
        {vehicleType === 'Bikes' ? 'No bikes available' : 'No cars available'}
      </Text>
      <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>
        {debouncedQuery !== ''
          ? `No results matching "${debouncedQuery}". Try adjusting your search.`
          : selectedDate !== 'All Dates'
          ? `No vehicles available on ${selectedDate}. Try another date.`
          : `No vehicles found. Try adjusting your filters.`
        }
      </Text>
      {(debouncedQuery !== '' || selectedDate !== 'All Dates' || activeFilterCount > 0) && (
        <Pressable
          accessibilityRole="button"
          style={[styles.clearButton, { backgroundColor: colors.primary }]}
          onPress={() => {
            setSearchQuery('');
            setDebouncedQuery('');
            setSelectedDate('All Dates');
            setStart(null);
            setEnd(null);
            setFilters(defaultFilters);
            setPage(1);
          }}
        >
          <Text style={[styles.clearButtonText, { color: colors.primaryForeground }]}>Clear All Filters</Text>
        </Pressable>
      )}
    </View>
  ), [colors, vehicleType, debouncedQuery, selectedDate, activeFilterCount]);

  return (
    <Page bottomNav scroll={false}>
      {/* ── FIXED: Explore Header ── */}
      <Header title="Explore" hideLogo={true} />

      {/* ── SCROLLABLE: Everything else via FlatList ── */}
      <FlatList
        style={{ flex: 1 }}
        data={paginatedCars}
        keyExtractor={(item) => item.id}
        renderItem={renderCar}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 100 }]}
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
              <ActivityIndicator size="small" color={colors.primary} />
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

  dateStatusRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, marginBottom: 8 },
  dateStatusText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  dateClearText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

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
  chipPressed: { opacity: 0.7 },

  listContent: { paddingBottom: 24 },

  emptyState: { borderRadius: 18, marginTop: 18, marginHorizontal: 20, padding: 20, alignItems: 'center' },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  emptyCopy: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 7, textAlign: 'center' },
  clearButton: { marginTop: 16, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  clearButtonText: { fontFamily: 'Inter_500Medium', fontSize: 13 },

  loadingFooter: { paddingVertical: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  loadingText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
});