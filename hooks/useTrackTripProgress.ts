import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { useSawari } from '@/context/SawariContext';
import { markSearchProgress, SearchStage } from '@/utils/recentSearches';
import { LocationResult } from '@/utils/sawari';

/**
 * Tells "Recent searches" that the current trip (destination + dates) has reached this page, so a tap on
 * it from Home brings the customer straight back here with everything filled in.
 */
export function useTrackTripProgress(stage: SearchStage) {
  const queryClient = useQueryClient();
  const {
    isAuthenticated, customer, dropoff, dateRange, duration, pickupTime, returnTime, vehicleType,
    selectedCar, mode, isDeliveryRequested, deliveryMode, pickup, returnAddress,
  } = useSawari();

  useFocusEffect(useCallback(() => {
    const withCar = stage !== 'results' && selectedCar?.id;
    
    // Always update recently viewed so cars opened from Home can resume their checkout state
    if (withCar) {
      import('@/utils/recentlyViewed').then(({ addRecentlyViewed }) => {
        addRecentlyViewed(isAuthenticated ? customer?.id : null, {
          vehicleId: String(selectedCar.id),
          dropoff: dropoff || undefined,
          dateRange,
          pickupTime,
          returnTime,
          duration,
          stage: stage as any,
          trip: { mode, isDeliveryRequested, deliveryMode, pickup, returnAddress }
        });
      }).catch(() => {});
    }

    // Determine effective dropoff location
    let targetDropoff: LocationResult | null = dropoff?.name ? dropoff : (pickup?.name ? pickup : null);
    if (!targetDropoff && stage !== 'results') {
      targetDropoff = {
        id: 'guwahati',
        name: 'Guwahati, Assam',
        address: 'Guwahati, Assam',
        latitude: 26.1445,
        longitude: 91.7362,
        source: 'database',
      };
    }

    if (!targetDropoff?.name) return;

    let targetRange = dateRange;
    if (!targetRange || targetRange.includes('Select')) {
      const now = new Date();
      const later = new Date(Date.now() + 2 * 86400000);
      const startStr = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      const endStr = later.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      targetRange = `${startStr} – ${endStr}`;
    }
    
    markSearchProgress(
      isAuthenticated ? customer?.id : null,
      { dropoff: targetDropoff, dateRange: targetRange, duration: duration || '2 Days', pickupTime, returnTime, vehicleType },
      stage,
      {
        carId: withCar ? String(selectedCar.id) : undefined,
        carName: withCar ? (selectedCar.displayName || selectedCar.name) : undefined,
        trip: { mode, isDeliveryRequested, deliveryMode, pickup, returnAddress },
      },
    ).then(() => {
      queryClient.invalidateQueries({ queryKey: ['recentSearches'] });
    }).catch(() => {});

  }, [stage, isAuthenticated, customer?.id, dropoff, dateRange, duration, pickupTime, returnTime, vehicleType,
      selectedCar?.id, selectedCar?.name, selectedCar?.displayName, mode, isDeliveryRequested, deliveryMode, pickup, returnAddress, queryClient]));
}
