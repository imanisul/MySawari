import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SheetFrame, SheetHeader } from '../common/SheetFrame';
import { LocationResult } from '@/utils/sawari';
import { LocationSearchBody, LocationSearchMode } from './LocationSearchBody';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * The routed location search: a full page for a destination (Figma), a sheet for delivery and
 * collection. The field and the results list come from `LocationSearchBody`, which the
 * `SetLocationSheet` over Home also renders — this component owns only what a *route* does
 * differently: the delivery/collection tabs, and navigating on once a place is picked.
 */
export function LocationSheet({ isReturn, isDestination }: { isReturn?: boolean; isDestination?: boolean } = {}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { forSpecificCar, returnBack } = useLocalSearchParams();
  const {
    pickup: pickupLocation,
    setPickup: setPickupLocation,
    returnAddress,
    setReturnAddress,
    setDropoff,
    deliveryMode,
    isDarkMode,
  } = useSawari();

  const [mode, setMode] = useState<LocationSearchMode>(isDestination ? 'destination' : (isReturn ? 'return' : 'pickup'));
  // Bumped on every tab change so the search field and results reset to the new tab's list.
  const [tabRun, setTabRun] = useState(0);

  useEffect(() => {
    import('@/services/api/activity').then(({ ActivityAPI }) => ActivityAPI.logActivity('open_location_sheet', 'LocationSheet', { mode }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leaveAfterDestination = () => {
    if (forSpecificCar === 'true') {
      router.replace('/booking');
    } else if (returnBack === 'false') {
      // Opened from Home: the destination leads straight on to picking dates & times.
      router.replace({ pathname: '/dates', params: { fresh: 'true' } });
    } else {
      router.back();
    }
  };

  // The route's job: persist the place, then move on. A destination continues to dates; a
  // delivery or collection point returns to wherever the flow came from.
  const handleSelect = (loc: LocationResult) => {
    if (mode === 'destination') {
      setDropoff(loc);
      leaveAfterDestination();
    } else if (mode === 'pickup') {
      setPickupLocation(loc);
      if (deliveryMode === 'both') {
        setMode('return'); // Auto switch to return
        setTabRun((n) => n + 1);
      } else {
        router.back();
      }
    } else {
      setReturnAddress(loc);
      router.back();
    }
  };

  const title =
    mode === 'destination' ? 'Where are you going?' : mode === 'pickup' ? 'Where to deliver?' : 'Where to collect?';
  const subtitle =
    mode === 'destination'
      ? 'Search for a place or pick a popular one.'
      : 'Search an address or use your current location.';

  // Destination search is a full page (Figma): just the field and the results, no sheet header.
  const fullPage = mode === 'destination';

  const tabs = deliveryMode === 'both' && mode !== 'destination' ? (
    <View style={[styles.tabContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Pressable
        style={[styles.tab, mode === 'pickup' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        onPress={() => { setMode('pickup'); setTabRun((n) => n + 1); }}
      >
        <Text style={[styles.tabText, { color: mode === 'pickup' ? colors.primaryText : colors.mutedForeground }]}>
          Deliver To
        </Text>
        <Text style={[styles.tabSubText, { color: colors.foreground }]} numberOfLines={1}>
          {pickupLocation ? pickupLocation.name : 'Select Location'}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.tab, mode === 'return' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
        onPress={() => { setMode('return'); setTabRun((n) => n + 1); }}
      >
        <Text style={[styles.tabText, { color: mode === 'return' ? colors.primaryText : colors.mutedForeground }]}>
          Collect From
        </Text>
        <Text style={[styles.tabSubText, { color: colors.foreground }]} numberOfLines={1}>
          {returnAddress ? returnAddress.name : 'Select Location'}
        </Text>
      </Pressable>
    </View>
  ) : null;

  const body = (
    <LocationSearchBody
      key={`${mode}-${tabRun}`}
      mode={mode}
      onSelect={handleSelect}
      listHeader={tabs}
    />
  );

  if (fullPage) {
    return (
      <View style={[styles.page, { backgroundColor: isDarkMode ? colors.background : '#FFFFFF', paddingTop: insets.top + 16 }]}>
        {body}
      </View>
    );
  }

  return (
    <SheetFrame fill>
      <SheetHeader title={title} subtitle={subtitle} />
      {body}
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, paddingHorizontal: 16 },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginBottom: 4,
  },
  tabSubText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
});
