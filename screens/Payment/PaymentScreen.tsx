import React, { useState, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Switch } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';

export default function PaymentScreen() {
  const colors = useColors();
  const router = useRouter();
  const { 
    selectedCar, 
    dateRange, 
    pickup,
    mode,
    customer, 
    sawariCash, 
    pricingQuote, 
    isQuoteLoading, 
    quoteError,
    refreshQuote,
    applyCoupon,
    appliedCouponCode,
    applySawariCash,
    sawariCashToApply,
    setFuelEstimate,
    fuelEstimate
  } = useSawari();
  
  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [showCoupons, setShowCoupons] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<any[]>([]);

  // Toggle for Sawari Cash
  const useCash = sawariCashToApply > 0;

  useEffect(() => {
    // Fetch coupons
    API.getCoupons().then(res => setAvailableCoupons(res));
  }, []);

  const handleApplyCoupon = (code: string) => {
    applyCoupon(code);
  };

  const handleRemoveCoupon = () => {
    applyCoupon(null);
    setCouponInput('');
  };

  const toggleSawariCash = (val: boolean) => {
    if (val) {
      // Apply maximum possible SawariCash
      applySawariCash(sawariCash);
    } else {
      applySawariCash(0);
    }
  };

  if (quoteError) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.destructive, fontFamily: 'Inter_600SemiBold' }}>{quoteError}</Text>
        <Pressable onPress={() => refreshQuote()} style={{ marginTop: 20, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}>
          <Text style={{ color: colors.primaryForeground }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        
        <View style={styles.topBar}>
          <Pressable accessibilityLabel="Back" onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={24} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Checkout</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          

          {/* CUSTOMER DETAILS */}
          <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 0 }]}>Customer Details</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Name</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{customer.name}</Text>
            </View>
            <View style={[styles.row, { marginTop: 12 }]}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Mobile</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{customer.mobile}</Text>
            </View>
            <View style={[styles.row, { marginTop: 12 }]}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Email (Optional)</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{customer.email || 'Not provided'}</Text>
            </View>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 12, fontStyle: 'italic' }}>
              Driving licence verification will be done at the time of pickup/delivery.
            </Text>
          </View>


          {/* COUPON SECTION */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Special Deals</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {appliedCouponCode ? (
              <View style={styles.row}>
                <View>
                  <Text style={{ color: colors.success, fontFamily: 'Inter_600SemiBold' }}>Coupon Applied: {appliedCouponCode}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>You saved ₹{pricingQuote?.couponDiscount}</Text>
                </View>
                <Pressable onPress={handleRemoveCoupon}>
                  <Text style={{ color: colors.destructive, fontFamily: 'Inter_500Medium' }}>Remove</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={styles.couponInputRow}>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, borderColor: colors.border, flex: 1 }]}
                    placeholder="Enter coupon code"
                    placeholderTextColor={colors.mutedForeground}
                    value={couponInput}
                    onChangeText={setCouponInput}
                    autoCapitalize="characters"
                  />
                  <Pressable onPress={() => handleApplyCoupon(couponInput)} style={[styles.applyBtn, { backgroundColor: colors.foreground }]}>
                    <Text style={{ color: colors.background, fontFamily: 'Inter_600SemiBold' }}>Apply</Text>
                  </Pressable>
                </View>
                <Pressable onPress={() => setShowCoupons(!showCoupons)} style={{ marginTop: 12 }}>
                  <Text style={{ color: colors.blue, fontFamily: 'Inter_500Medium' }}>{showCoupons ? 'Hide available coupons' : 'View available coupons'}</Text>
                </Pressable>
                {showCoupons && (
                  <View style={{ marginTop: 16, gap: 12 }}>
                    {availableCoupons.map(c => (
                      <View key={c.code} style={[styles.couponItem, { borderColor: colors.border, backgroundColor: colors.background }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>{c.code}</Text>
                          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
                            {c.discountType === 'FLAT' ? `₹${c.discountValue} OFF` : `${c.discountValue}% OFF (Max ₹${c.maximumDiscount})`}
                          </Text>
                          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>Min booking ₹{c.minimumBooking}</Text>
                        </View>
                        <Pressable onPress={() => handleApplyCoupon(c.code)} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.foreground, borderRadius: 6 }}>
                          <Text style={{ color: colors.background, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Apply</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>

          {/* SAWARI CASH */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Use SawariCash</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>Available Balance: ₹{sawariCash}</Text>
            </View>
            <Switch
              value={useCash}
              onValueChange={toggleSawariCash}
              disabled={sawariCash <= 0 || (!!pricingQuote && pricingQuote.bookingAdvance + pricingQuote.pickupCharge <= 0)}
              trackColor={{ false: colors.border, true: colors.primary }}
            />
          </View>


          {/* BOOKING SUMMARY */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Booking Summary</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>{selectedCar.name}</Text>
            <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{dateRange} • {pricingQuote?.rentalDays || 1} Days</Text>
            <View style={styles.row}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>₹{pricingQuote?.dailyRate} × {pricingQuote?.rentalDays} days</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>₹{pricingQuote?.rentalAmount}</Text>
            </View>
          </View>

          {/* PRICE BREAKDOWN */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Price Breakdown</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular' }}>Rental Value ({pricingQuote?.rentalDays || 1} days)</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>₹{((pricingQuote?.rentalAmount || 0) - (pricingQuote?.driverCharge || 0)).toLocaleString('en-IN')} ({pricingQuote?.distanceKm} km × ₹{pricingQuote?.ratePerKm}/km)</Text>
            </View>
            
            {pricingQuote && pricingQuote.driverCharge > 0 && (
              <View style={[styles.row, { marginTop: 12 }]}>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular' }}>Driver Charges</Text>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>₹{pricingQuote.driverCharge.toLocaleString('en-IN')}</Text>
              </View>
            )}
            
            {pricingQuote && pricingQuote.couponDiscount > 0 && (
              <View style={[styles.row, { marginTop: 12 }]}>
                <Text style={{ color: colors.success, fontFamily: 'Inter_400Regular' }}>Coupon Discount</Text>
                <Text style={{ color: colors.success, fontFamily: 'Inter_500Medium' }}>- ₹{pricingQuote.couponDiscount.toLocaleString('en-IN')}</Text>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            
            <View style={[styles.row, { marginTop: 12 }]}>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Total Trip Cost</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 15 }}>₹{((pricingQuote?.discountedRentalAmount || 0) + (pricingQuote?.pickupCharge || 0)).toLocaleString('en-IN')}</Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />

            <View style={styles.row}>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular' }}>Booking Advance</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>₹{pricingQuote?.bookingAdvance.toLocaleString('en-IN')}</Text>
            </View>

            {pricingQuote && pricingQuote.pickupCharge > 0 && (
              <View style={[styles.row, { marginTop: 12 }]}>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular' }}>{pricingQuote.pickupLocationName}</Text>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>₹{pricingQuote.pickupCharge.toLocaleString('en-IN')}</Text>
              </View>
            )}

            {pricingQuote && pricingQuote.sawariCashUsed > 0 && (
              <View style={[styles.row, { marginTop: 12 }]}>
                <Text style={{ color: colors.success, fontFamily: 'Inter_400Regular' }}>SawariCash Applied</Text>
                <Text style={{ color: colors.success, fontFamily: 'Inter_500Medium' }}>- ₹{pricingQuote.sawariCashUsed.toLocaleString('en-IN')}</Text>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 16 }]} />
            
            <View style={styles.row}>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 18 }}>PAY NOW</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 18 }}>₹{pricingQuote?.onlinePayableNow.toLocaleString('en-IN')}</Text>
            </View>

            {pricingQuote && pricingQuote.remainingRentalAmount > 0 && (
              <View style={[styles.row, { marginTop: 16 }]}>
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>Remaining Rental Amount</Text>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>₹{pricingQuote.remainingRentalAmount.toLocaleString('en-IN')}</Text>
                  <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 4 }}>Payable at {pricingQuote.pickupType === 'OFFICE' ? 'Office' : 'Handover'}</Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: 'Inter_500Medium' }}>Online Payable</Text>
            <Text style={{ color: colors.foreground, fontSize: 24, fontFamily: 'Inter_700Bold' }}>
              ₹{pricingQuote?.onlinePayableNow.toLocaleString('en-IN') || 0}
            </Text>
          </View>
          <Pressable
            disabled={isQuoteLoading || !pricingQuote}
            onPress={() => router.push('/payment-processing')}
            style={[styles.payButton, { backgroundColor: isQuoteLoading ? colors.muted : colors.primary }]}
          >
            {isQuoteLoading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>Continue</Text>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 16 },
  backButton: { padding: 8, marginLeft: -8 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, marginLeft: 8 },
  content: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 12, marginTop: 24 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, marginBottom: 16 },
  cardTitle: { fontFamily: 'Inter_700Bold', fontSize: 18 },
  cardSub: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 4, marginBottom: 12 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  divider: { height: 1, marginVertical: 12, width: '100%' },
  input: { borderWidth: 1, borderRadius: 8, padding: 12, fontFamily: 'Inter_500Medium' },
  fuelInputRow: { flexDirection: 'row', gap: 12 },
  fuelResult: { marginTop: 16, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: 'transparent' },
  couponInputRow: { flexDirection: 'row', gap: 12 },
  applyBtn: { paddingHorizontal: 20, justifyContent: 'center', alignItems: 'center', borderRadius: 8 },
  couponItem: { borderWidth: 1, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, padding: 20, paddingBottom: 40, flexDirection: 'row', alignItems: 'center' },
  payButton: { paddingHorizontal: 32, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }
});