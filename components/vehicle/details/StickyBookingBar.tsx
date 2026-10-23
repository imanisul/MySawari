import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useSawari } from '@/context/SawariContext';
import { BOOKING_ADVANCE_AMOUNT, formatCurrency } from '@/services/backend/pricingEngine';
import { PriceBreakdownSheet } from './PriceBreakdownSheet';
import { useDetailsPalette } from './detailsPalette';
import { useTripPrice } from './useTripPrice';

/**
 * The car details page's bottom bar (Figma "Car Detail Page"): trip price with the pre-discount price
 * struck through, membership chip, "For N days • km" and "View breakup", then the Book Now button.
 * Prices come from the pricing quote (backend vehicle price + server membership) via useTripPrice.
 */
export function StickyBookingBar({
  isAvailable = true,
  agreed = true,
  hasTrip,
  onNeedLogin,
  onBookNow,
  onCheckAvailability,
}: {
  isAvailable?: boolean;
  /** Policy Agreement checkbox on the page. */
  agreed?: boolean;
  /** Whether pickup and return dates are chosen (needed for a trip price). */
  hasTrip: boolean;
  onCheckAvailability?: () => void;
  onNeedLogin?: () => void;
  onBookNow?: () => void;
}) {
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useSawari();
  const price = useTripPrice(hasTrip);
  const [showBreakup, setShowBreakup] = useState(false);

  const label = isAvailable ? 'Book Now' : 'Check Availability';
  const onPress = isAvailable
    ? () => {
        if (isAuthenticated) {
          onBookNow ? onBookNow() : router.push('/booking');
        } else {
          onNeedLogin?.();
        }
      }
    : onCheckAvailability;
  const disabled = !onPress || (isAvailable && !agreed);
  const payableNow = price.state === 'ready' ? price.payableNow : BOOKING_ADVANCE_AMOUNT;

  return (
    <>
      <View style={[styles.bar, { backgroundColor: p.page, borderTopColor: p.deliveryBorder, paddingBottom: Math.max(insets.bottom, 12) }]}>
        {/* Soft grey fade above the bar, as in the design (instead of a drop shadow). */}
        <LinearGradient pointerEvents="none" colors={[p.barFade + '00', p.barFade]} style={styles.fade} />
        {isAvailable && (
          <View style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              {price.state === 'ready' && (
                <>
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: p.fg }]}>{formatCurrency(price.final)}</Text>
                    {price.original > price.final && (
                      <Text style={[styles.strike, { color: p.muted }]}>{formatCurrency(price.original)}</Text>
                    )}
                  </View>
                  <View style={styles.metaRow}>
                    {!!price.planName && (
                      <View style={[styles.chip, { backgroundColor: p.chipBg, borderColor: p.memberBorder }]}>
                        <Text style={[styles.chipText, { color: p.navy }]}>{price.planName}</Text>
                      </View>
                    )}
                    <Text style={[styles.meta, { color: p.muted }]}>
                      For {price.days} day{price.days === 1 ? '' : 's'}  •  {price.kmText}
                    </Text>
                  </View>
                </>
              )}

              {price.state === 'no-dates' && (
                <>
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: p.fg }]}>{formatCurrency(price.perDay)}</Text>
                    <Text style={[styles.perDay, { color: p.muted }]}>/day</Text>
                  </View>
                  <View style={styles.metaRow}>
                    <Text style={[styles.meta, { color: p.muted }]}>Select trip dates to see the total price</Text>
                  </View>
                </>
              )}

              {price.state === 'loading' && (
                <View style={[styles.priceRow, { height: 44, alignItems: 'center' }]}>
                  <ActivityIndicator size="small" color={p.navy} />
                  <Text style={[styles.meta, { color: p.muted, marginLeft: 8 }]}>Getting the price for your dates…</Text>
                </View>
              )}

              {price.state === 'error' && (
                <View style={{ minHeight: 44, justifyContent: 'center' }}>
                  <Text style={[styles.meta, { color: p.red }]} numberOfLines={2}>Couldn't get the price. {price.message}</Text>
                  <Pressable accessibilityRole="button" onPress={price.retry} hitSlop={8} style={{ marginTop: 4 }}>
                    <Text style={[styles.breakupText, { color: p.navy, textDecorationLine: 'underline' }]}>Try again</Text>
                  </Pressable>
                </View>
              )}
            </View>

            {price.state === 'ready' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="View price breakup"
                onPress={() => { Haptics.selectionAsync(); setShowBreakup(true); }}
                hitSlop={8}
                style={({ pressed }) => [styles.breakupBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={[styles.breakupText, { color: p.navy }]}>View breakup</Text>
                <Feather name="chevron-up" size={13} color={p.navy} />
              </Pressable>
            )}
          </View>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={isAvailable && !agreed ? 'Tick the policy agreement first' : undefined}
          onPress={onPress}
          disabled={disabled}
          style={({ pressed }) => [styles.button, { backgroundColor: p.navy }, pressed && styles.pressed, disabled && { opacity: 0.5 }]}
        >
          {!isAvailable && <Feather name="calendar" size={17} color={p.onNavy} style={{ marginRight: 8 }} />}
          <Text style={[styles.buttonText, { color: p.onNavy }]}>{label}</Text>
        </Pressable>

        {isAvailable && (
          <Text style={[styles.note, { color: p.green }]}>
            {formatCurrency(payableNow)} payable now  •  Refundable up to 24h before trip
          </Text>
        )}
      </View>

      {price.state === 'ready' && (
        <PriceBreakdownSheet visible={showBreakup} onClose={() => setShowBreakup(false)} price={price} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 11,
    borderTopWidth: 1,
  },
  fade: { position: 'absolute', left: 0, right: 0, top: -49, height: 48 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16.5 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 19, lineHeight: 24, letterSpacing: -0.3 },
  strike: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, lineHeight: 16, textDecorationLine: 'line-through' },
  perDay: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 7.5, marginTop: 3, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 8, height: 17.5, justifyContent: 'center' },
  chipText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8 },
  meta: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11 },
  breakupBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingLeft: 10, marginTop: 6 },
  breakupText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 },
  button: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderRadius: 12, height: 53 },
  buttonText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19 },
  note: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, lineHeight: 12, textAlign: 'center', marginTop: 9 },
  pressed: { opacity: 0.85 },
});
