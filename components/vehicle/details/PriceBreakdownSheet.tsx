import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback, Animated, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import type { TripPrice } from './useTripPrice';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { ModalBlur } from '@/components/common/ModalBlur';

type ReadyPrice = Extract<TripPrice, { state: 'ready' }>;

/** Price breakup for the car details page; every figure comes from the trip's pricing quote. */
export function PriceBreakdownSheet({ visible, onClose, price }: { visible: boolean; onClose: () => void; price: ReadyPrice }) {
  const colors = useColors();
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        bounciness: 0,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  if (!visible) return null;

  const { days, perDay, rentalAmount, driverCharge, pickupCharge, dropCharge, couponCode, couponDiscount, membershipDiscount, planName } = price;
  const green = colors.success;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <ModalBlur />
          <TouchableWithoutFeedback>
            <Animated.View style={[styles.sheet, { backgroundColor: colors.card, transform: [{ translateY: slideAnim }] }]}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.foreground }]}>Price Breakdown</Text>
                <Pressable onPress={onClose} style={styles.closeBtn}>
                  <Feather name="x" size={24} color={colors.foreground} />
                </Pressable>
              </View>

              <View style={styles.content}>
                <View style={styles.row}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>Rent ({formatCurrency(perDay)} × {days} day{days === 1 ? '' : 's'})</Text>
                  <Text style={[styles.value, { color: colors.foreground }]}>{formatCurrency(rentalAmount)}</Text>
                </View>
                {driverCharge > 0 && (
                  <View style={styles.row}>
                    <Text style={[styles.label, { color: colors.mutedForeground }]}>Driver</Text>
                    <Text style={[styles.value, { color: colors.foreground }]}>{formatCurrency(driverCharge)}</Text>
                  </View>
                )}
                {pickupCharge > 0 && (
                  <View style={[styles.row, { alignItems: 'flex-start' }]}>
                    <View>
                      <Text style={[styles.label, { color: colors.mutedForeground }]}>Delivery (Pickup) Charge</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{price.pickupDistanceKm} km × ₹{price.ratePerKm}/km</Text>
                    </View>
                    <Text style={[styles.value, { color: colors.foreground }]}>{formatCurrency(pickupCharge)}</Text>
                  </View>
                )}
                {dropCharge > 0 && (
                  <View style={[styles.row, { alignItems: 'flex-start' }]}>
                    <View>
                      <Text style={[styles.label, { color: colors.mutedForeground }]}>Collection (Drop) Charge</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{price.dropDistanceKm} km × ₹{price.ratePerKm}/km</Text>
                    </View>
                    <Text style={[styles.value, { color: colors.foreground }]}>{formatCurrency(dropCharge)}</Text>
                  </View>
                )}
                {couponDiscount > 0 && (
                  <View style={styles.row}>
                    <Text style={[styles.label, { color: green }]}>Coupon{couponCode ? ` (${couponCode})` : ''}</Text>
                    <Text style={[styles.value, { color: green, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>-{formatCurrency(couponDiscount)}</Text>
                  </View>
                )}
                {membershipDiscount > 0 && (
                  <View style={styles.row}>
                    <Text style={[styles.label, { color: green }]}>Member discount{planName ? ` (${planName})` : ''}</Text>
                    <Text style={[styles.value, { color: green, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>-{formatCurrency(membershipDiscount)}</Text>
                  </View>
                )}
                {price.sawariCashUsed > 0 && (
                  <View style={styles.row}>
                    <Text style={[styles.label, { color: green }]}>My Sawari Cash used</Text>
                    <Text style={[styles.value, { color: green, fontFamily: 'PlusJakartaSans_600SemiBold' }]}>-{formatCurrency(price.sawariCashUsed)}</Text>
                  </View>
                )}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.row}>
                  <Text style={[styles.boldLabel, { color: colors.foreground }]}>Total Trip Price</Text>
                  <Text style={[styles.boldValue, { color: colors.foreground }]}>
                    {formatCurrency(price.total)}
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <View style={styles.row}>
                  <Text style={[styles.highlightLabel, { color: colors.foreground }]}>Payable Now (Advance)</Text>
                  <Text style={[styles.highlightValue, { color: green }]}>{formatCurrency(price.payableNow)}</Text>
                </View>

                <View style={[styles.row, { marginTop: 8 }]}>
                  <Text style={[styles.highlightLabel, { color: colors.mutedForeground }]}>Remaining Balance (At Handover)</Text>
                  <Text style={[styles.highlightValue, { color: colors.foreground }]}>{formatCurrency(price.balance)}</Text>
                </View>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  title: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18 },
  closeBtn: { padding: 4 },
  content: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15 },
  value: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15 },
  boldLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16 },
  boldValue: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16 },
  highlightLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15 },
  highlightValue: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15 },
  divider: { height: 1, marginVertical: 16 }
});
