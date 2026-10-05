import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { useSawari } from '@/context/SawariContext';
import { markSearchProgress, SearchStage } from '@/utils/recentSearches';

/**
 * Tells "Recent searches" that the current trip (destination + dates) has reached this page, so a tap on
 * it from Home brings the customer straight back here with everything filled in.
 */
export function useTrackTripProgress(stage: SearchStage) {
  const {
    isAuthenticated, customer, dropoff, dateRange, duration, pickupTime, returnTime, vehicleType,
    selectedCar, mode, isDeliveryRequested, deliveryMode, pickup, returnAddress,
  } = useSawari();

  useFocusEffect(useCallback(() => {
    if (!dropoff?.name) return;
    const withCar = stage !== 'results' && selectedCar?.id;
    markSearchProgress(
      isAuthenticated ? customer?.id : null,
      { dropoff, dateRange, duration, pickupTime, returnTime, vehicleType },
      stage,
      {
        carId: withCar ? String(selectedCar.id) : undefined,
        carName: withCar ? selectedCar.name : undefined,
        trip: { mode, isDeliveryRequested, deliveryMode, pickup, returnAddress },
      },
    ).catch(() => {});
  }, [stage, isAuthenticated, customer?.id, dropoff, dateRange, duration, pickupTime, returnTime, vehicleType,
      selectedCar?.id, mode, isDeliveryRequested, deliveryMode, pickup, returnAddress]));
}
