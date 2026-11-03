import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from '@/utils/haptics';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSawari } from '@/context/SawariContext';
import { BOOKING_ADVANCE_AMOUNT, formatCurrency } from '@/services/backend/pricingEngine';
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
  bookLabel,
  onHeight,
}: {
  /** Button text once the trip can be booked (default "Book Now"; the payment page uses "Pay ₹500 & Book"). */
  bookLabel?: string;
  isAvailable?: boolean;
  /** Policy Agreement checkbox on the page. */
  agreed?: boolean;
  /** Whether pickup and return dates are chosen (needed for a trip price). */
  hasTrip: boolean;
  onCheckAvailability?: () => void;
  onNeedLogin?: () => void;
  onBookNow?: () => void;
  onHeight?: (height: number) => void;
}) {
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useSawari();
  const price = useTripPrice(hasTrip);
  const [showBreakup, setShowBreakup] = useState(false);

  // A car that is free (today, or for the chosen dates) says "Book Now"; with no dates yet the button first opens the
  // date picker, then Book Now continues. "Check Availability" is only for a car that is busy for the chosen dates.
  const canBook = isAvailable && hasTrip;
  const label = isAvailable && (hasTrip || !bookLabel) ? (bookLabel || 'Book Now') : 'Check Availability';
  const onPress = canBook
    ? () => {
        if (isAuthenticated) {
          onBookNow ? onBookNow() : router.push('/booking');
        } else {
          onNeedLogin?.();
        }
      }
    : onCheckAvailability;
  const disabled = !onPress || (canBook && !agreed);
  const payableNow = price.state === 'ready' ? price.payableNow : BOOKING_ADVANCE_AMOUNT;

  return (
    <>
      <View
        onLayout={(e) => onHeight?.(e.nativeEvent.layout.height)}
        style={[styles.bar, { backgroundColor: p.page, paddingBottom: Math.max(insets.bottom, 8) }]}
      >
        {isAvailable && (
          <View style={styles.infoRow}>
            <View style={{ flex: 1 }}>
              {price.state === 'ready' && (
                <>
                  <View style={styles.priceRow}>
                    <Text style={[styles.price, { color: p.fg }]}>{formatCurrency(price.total)}</Text>
                    {price.original > price.total && (
                      <Text style={[styles.strike, { color: p.muted }]}>{formatCurrency(price.original)}</Text>
                    )}
                  </View>
                  <View style={styles.metaRow}>
                    {!!(price.planName || price.buyingPlan) && (
                      <View style={[styles.chip, { backgroundColor: p.chipBg, borderColor: p.memberBorder }]}>
                        <Text style={[styles.chipText, { color: p.navy }]}>{price.planName || price.buyingPlan}</Text>
                      </View>
                    )}
                    <Text style={[styles.meta, { color: p.muted }]}>For {price.days} day{price.days === 1 ? '' : 's'}</Text>
                    <View style={[styles.dot, { backgroundColor: p.muted }]} />
                    <Text style={[styles.meta, { color: p.muted }]}>{price.kmText}</Text>
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
                accessibilityLabel={showBreakup ? 'Hide price breakup' : 'View price breakup'}
                accessibilityState={{ expanded: showBreakup }}
                onPress={() => { Haptics.selectionAsync(); setShowBreakup((v) => !v); }}
                hitSlop={8}
                style={({ pressed }) => [styles.breakupBtn, pressed && { opacity: 0.7 }]}
              >
                <Text style={[styles.breakupText, { color: p.navy }]}>View breakup</Text>
                <Feather name={showBreakup ? 'chevron-down' : 'chevron-up'} size={12} color={p.navy} />
              </Pressable>
            )}
          </View>
        )}

        {/* Figma "View breakup": the trip's price lines open in the bar, right above Book Now. */}
        {canBook && showBreakup && price.state === 'ready' && <Breakup price={price} />}

        {/* Figma "CTA + Info": the button and its note, 4 apart. */}
        <View style={{ gap: 4 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={label}
          accessibilityHint={canBook && !agreed ? 'Tick the policy agreement first' : undefined}
          onPress={onPress}
          disabled={disabled}
          style={({ pressed }) => [styles.button, { backgroundColor: p.navy }, pressed && styles.pressed, disabled && { opacity: 0.5 }]}
        >
          <Text style={[styles.buttonText, { color: p.onNavy }]}>{label}</Text>
        </Pressable>

        {/* Figma: "₹500 payable now • Refundable up to 24h before trip", 6 apart, centred. */}
        {price.state === 'ready' && price.membershipFee > 0 ? (
          <View style={styles.noteRow}><Text style={[styles.note, { color: p.green }]}>{formatCurrency(payableNow)} payable now (incl. {price.buyingPlan} membership)</Text></View>
        ) : (
          <View style={styles.noteRow}>
            <Text style={[styles.note, { color: p.green }]}>{formatCurrency(payableNow)} payable now</Text>
            <View style={[styles.dot, { backgroundColor: p.green }]} />
            <Text style={[styles.note, { color: p.green }]}>Refundable up to 24h before trip</Text>
          </View>
        )}
        </View>
      </View>

    </>
  );
}

type ReadyPrice = Extract<ReturnType<typeof useTripPrice>, { state: 'ready' }>;

/** Every figure comes from the trip's pricing quote (the same numbers the server checks at booking). */
function Breakup({ price }: { price: ReadyPrice }) {
  const p = useDetailsPalette();
  const n = price.days;
  // What's left after the booking amount (and any SawariCash) — the quote's own balance.
  const atPickup = Math.max(0, price.balance);
  const Row = ({ label, value, tone }: { label: string; value: string; tone?: 'strong' | 'green' }) => (
    <View style={styles.bRow}>
      <Text style={[styles.bLabel, { color: p.muted }]} numberOfLines={1}>{label}</Text>
      <Text style={[styles.bValue, { color: tone === 'green' ? p.green : tone === 'strong' ? p.fg : p.muted }, tone === 'strong' && styles.bStrong]}>{value}</Text>
    </View>
  );
  return (
    <View style={[styles.bCard, { backgroundColor: p.soft, borderColor: p.border }]} accessibilityLabel="Price breakup">
      <Row label={`Rental charges (${price.perDay} x ${n} day${n === 1 ? '' : 's'})`} value={formatCurrency(price.rentalAmount)} tone="strong" />
      {price.driverCharge > 0 && <Row label="Driver charges" value={formatCurrency(price.driverCharge)} tone="strong" />}
      {price.pickupCharge > 0 && <Row label="Delivery charges" value={formatCurrency(price.pickupCharge)} tone="strong" />}
      {price.dropCharge > 0 && <Row label="Return pickup charges" value={formatCurrency(price.dropCharge)} tone="strong" />}
      {price.membershipDiscount > 0 && <Row label="Membership discount" value={`-${formatCurrency(price.membershipDiscount)}`} tone="green" />}
      {price.couponDiscount > 0 && <Row label={price.couponCode ? `Coupon discount (${price.couponCode})` : 'Coupon discount'} value={`-${formatCurrency(price.couponDiscount)}`} tone="green" />}
      {price.sawariCashUsed > 0 && <Row label="SawariCash used" value={`-${formatCurrency(price.sawariCashUsed)}`} tone="green" />}
      {price.membershipFee > 0 && <Row label={`${price.buyingPlan} membership, 1 year`} value={formatCurrency(price.membershipFee)} tone="strong" />}
      <Dashes />
      <View style={styles.bRow}>
        <Text style={[styles.bTotal, { color: p.muted }]}>Total trip cost</Text>
        <Text style={[styles.bTotal, { color: p.muted }]}>{formatCurrency(price.total)}</Text>
      </View>
      <Dashes />
      <Row label={price.membershipFee > 0 ? `Pay now (incl. ${price.buyingPlan} membership)` : 'Booking amount (pay now)'} value={formatCurrency(price.payableNow)} />
      <Row label="Pay at pickup" value={formatCurrency(atPickup)} />
    </View>
  );
}

/** Dashed divider (a one-sided dashed border isn't reliable on iOS). */
function Dashes() {
  return (
    <View style={styles.dashes}>
      {Array.from({ length: 70 }, (_, i) => <View key={i} style={styles.dash} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
    // Flat bar: no top line, shadow or blur above it.
    gap: 16,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 40 },
  priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  price: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 19, lineHeight: 20 },
  strike: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 16, textDecorationLine: 'line-through' },
  perDay: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2, flexWrap: 'wrap' },
  dot: { width: 3, height: 3, borderRadius: 1.5 },
  // Figma "Membership Tags": 18 high pill (radius 100), 1px #D1CCF9 border, #F0EFFD fill, padding 3 / 8 — so a 10px line.
  chip: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3, height: 18, justifyContent: 'center', alignItems: 'center' },
  chipText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, lineHeight: 10, includeFontPadding: false },
  meta: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16 },
  breakupBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, paddingVertical: 10 },
  breakupText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11 },
  button: { alignItems: 'center', justifyContent: 'center', flexDirection: 'row', borderRadius: 12, height: 54, padding: 12 },
  buttonText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28 },
  note: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, lineHeight: 12, textAlign: 'center' },
  noteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 4 },
  pressed: { opacity: 0.85 },

  // Breakup card (Figma: #FAFAFA card, 1px #E5E5E5, radius 10, rows 27 apart, dashed dividers).
  bCard: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  bRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 27 },
  bLabel: { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11.5, lineHeight: 17 },
  bValue: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11.5, lineHeight: 17 },
  bStrong: { fontFamily: 'PlusJakartaSans_600SemiBold' },
  bTotal: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, lineHeight: 22 },
  dashes: { flexDirection: 'row', overflow: 'hidden', gap: 3, marginVertical: 7 },
  dash: { width: 4, height: 1, backgroundColor: '#C9C9D6' },
});