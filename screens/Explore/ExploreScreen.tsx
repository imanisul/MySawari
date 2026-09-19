import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, ScrollView, Pressable, StyleSheet, Text, View, TextInput, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useFocusEffect, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { cars, premiumCollection, checkCarAvailability } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import { CarListCard, Header, Page, FilterSheet, FilterState, defaultFilters } from '@/components';
import { CarCardSkeleton } from '@/components/loading/CarCardSkeleton';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Car } from '@/utils/sawari';

export default function ExploreScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDate, setSelectedDate] = useState<string>('All Dates');
  const { vehicleType: globalVehicleType, setBookingSource, setDateRange, dateRange } = useSawari();
  const [vehicleType, setVehicleType] = useState<'All' | 'Cars' | 'Bikes'>(globalVehicleType === 'car' ? 'Cars' : 'Bikes');
  
  // Sync selectedDate when dateRange changes via Calendar
  useEffect(() => {
    if (dateRange && !dateRange.includes('Select') && dateRange !== 'All Dates') {
      setSelectedDate(dateRange);
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

  const [showDatePicker, setShowDatePicker] = useState(false);

  const onDateChange = (event: DateTimePickerEvent, selectedDateObj?: Date) => {
    setShowDatePicker(false);
    if (event.type === 'set' && selectedDateObj) {
      const formattedDate = selectedDateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      setSelectedDate(formattedDate);
    }
  };

  const availableDates = useMemo(() => {
    const dates = ['All Dates'];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      dates.push(d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }));
    }
    if (selectedDate !== 'All Dates' && !selectedDate.includes('–') && !dates.includes(selectedDate)) {
      dates.splice(1, 0, selectedDate);
    }
    return dates;
  }, [selectedDate]);

  const { data: fetchedCars = [], isLoading: isFetchingCars, isError: fetchError, refetch: fetchVehicles } = useQuery({
    queryKey: ['vehicles'],
    queryFn: async () => {
      const data = await API.getVehiclesWithAvailability();
      return data && data.length > 0 ? data : [...cars, ...premiumCollection];
    },
    staleTime: 0,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  const filteredCars = useMemo(() => {
    return (fetchedCars || []).reduce((acc: Car[], car: Car) => {
      let matchDate = true;
      if (selectedDate !== 'All Dates') {
        if (selectedDate.includes('–')) {
          const [startStr, endStr] = selectedDate.split(' – ');
          matchDate = checkCarAvailability(car, startStr, endStr);
        } else {
          // User selected a single date from chips. Check if it falls within the availability range.
          matchDate = checkCarAvailability(car, selectedDate, selectedDate);
        }
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
      const matchFilterTrans = filters.transmission === 'All' || 
                               car.transmission === filters.transmission ||
                               (filters.transmission === 'Gearless' && car.transmission === 'Automatic') ||
                               (filters.transmission === 'Gear' && car.transmission === 'Manual');
      const matchFilterFuel = filters.fuel === 'All' || car.fuel === filters.fuel;

      if (matchType && matchSearch && matchFilterCategory && matchFilterPrice && matchFilterTrans && matchFilterFuel) {
        acc.push({
          ...car,
          isAvailable: matchDate && car.dbStatus !== 'service' && car.dbStatus !== 'maintenance'
        });
      }
      return acc;
    }, []).sort((a, b) => {
      const getStatusRank = (status?: string) => {
        if (status === 'available') return 1;
        if (status === 'rent') return 2;
        if (status === 'service' || status === 'maintenance') return 3;
        return 4;
      };

      const rankA = getStatusRank(a.dbStatus);
      const rankB = getStatusRank(b.dbStatus);

      if (rankA !== rankB) return rankA - rankB;
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      
      const priceA = parseInt(a.price.replace(/[^0-9]/g, ''), 10) || 0;
      const priceB = parseInt(b.price.replace(/[^0-9]/g, ''), 10) || 0;
      return filters.maxPrice !== 10000 ? priceB - priceA : priceA - priceB;
    });
  }, [fetchedCars, selectedDate, vehicleType, debouncedQuery, filters]);

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchVehicles();
    setIsRefreshing(false);
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
  const listHeaderElement = (
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
            value={new Date()}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )}
        {availableDates.map((date) => {
          const active = date === selectedDate;
          return (
            <Pressable
              key={date}
              accessibilityRole="button"
              accessibilityLabel={`Filter by date: ${date}`}
              accessibilityState={{ selected: active }}
              onPress={() => {
                Haptics.selectionAsync();
                setSelectedDate(date);
                if (date !== 'All Dates') setDateRange(date);
              }}
              style={({ pressed }) => [
                styles.dateChip,
                {
                  backgroundColor: active ? colors.foreground : colors.card,
                  borderColor: active ? colors.foreground : colors.border,
                },
                pressed && styles.chipPressed,
              ]}
            >
              <Text
                style={[
                  styles.dateChipText,
                  { color: active ? colors.background : colors.foreground },
                ]}
              >
                {date}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  /* ─── ListEmptyComponent ─── */
  const listEmptyElement = (() => {
    if (isFetchingCars) {
      return (
        <View style={{ paddingTop: 16 }}>
          {[1, 2, 3].map(i => (
            <CarCardSkeleton key={i} />
          ))}
        </View>
      );
    }
    
    if (fetchError) {
      return (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Feather name="alert-circle" size={28} color={colors.destructive} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Connection Error</Text>
          <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>
            DATES UNAVAILABLE. Could not connect to the backend. Please try again.
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
      <Header title="Explore" hideLogo={true} />

      <FlatList
        style={{ flex: 1 }}
        data={paginatedCars}
        keyExtractor={(item) => item.id}
        renderItem={renderCar}
        ListHeaderComponent={listHeaderElement}
        ListEmptyComponent={listEmptyElement}
        extraData={`${vehicleType}-${selectedDate}-${debouncedQuery}-${activeFilterCount}`}
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