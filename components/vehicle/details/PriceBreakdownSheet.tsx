import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableWithoutFeedback, Animated, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { formatCurrency } from '@/services/backend/pricingEngine';

export function PriceBreakdownSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const { pricingQuote } = useSawari();
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

  if (!pricingQuote) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
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
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>Rental Amount ({pricingQuote.rentalDays} Days)</Text>
                  <Text style={[styles.value, { color: colors.foreground }]}>{formatCurrency(pricingQuote.rentalAmount)}</Text>
                </View>
                {pricingQuote.pickupCharge > 0 && (
                  <View style={[styles.row, { alignItems: 'flex-start' }]}>
                    <View>
                      <Text style={[styles.label, { color: colors.mutedForeground }]}>Delivery (Pickup) Charge</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{pricingQuote.pickupDistanceKm} km × ₹{pricingQuote.ratePerKm}/km</Text>
                    </View>
                    <Text style={[styles.value, { color: colors.foreground }]}>{formatCurrency(pricingQuote.pickupCharge)}</Text>
                  </View>
                )}
                {pricingQuote.dropCharge > 0 && (
                  <View style={[styles.row, { alignItems: 'flex-start' }]}>
                    <View>
                      <Text style={[styles.label, { color: colors.mutedForeground }]}>Collection (Drop) Charge</Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>{pricingQuote.dropDistanceKm} km × ₹{pricingQuote.ratePerKm}/km</Text>
                    </View>
                    <Text style={[styles.value, { color: colors.foreground }]}>{formatCurrency(pricingQuote.dropCharge)}</Text>
                  </View>
                )}
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <View style={styles.row}>
                  <Text style={[styles.boldLabel, { color: colors.foreground }]}>Total Trip Price</Text>
                  <Text style={[styles.boldValue, { color: colors.foreground }]}>
                    {formatCurrency(pricingQuote.discountedRentalAmount + pricingQuote.pickupCharge + pricingQuote.dropCharge)}
                  </Text>
                </View>

                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                
                <View style={styles.row}>
                  <Text style={[styles.highlightLabel, { color: colors.foreground }]}>Payable Now</Text>
                  <Text style={[styles.highlightValue, { color: colors.foreground }]}>{formatCurrency(pricingQuote.onlinePayableNow)}</Text>
                </View>

                <View style={[styles.row, { marginTop: 8 }]}>
                  <Text style={[styles.highlightLabel, { color: colors.foreground }]}>Remaining Balance</Text>
                  <Text style={[styles.highlightValue, { color: colors.foreground }]}>{formatCurrency(pricingQuote.remainingRentalAmount)}</Text>
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
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  title: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  closeBtn: { padding: 4 },
  content: { padding: 20 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  label: { fontFamily: 'Inter_400Regular', fontSize: 15 },
  value: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  boldLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  boldValue: { fontFamily: 'Inter_700Bold', fontSize: 16 },
  highlightLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  highlightValue: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  divider: { height: 1, marginVertical: 16 }
});
