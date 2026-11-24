import { DesignToggle } from '@/components/profile/ProfileParts';
import React, { useState, useEffect, useCallback } from 'react';
import { safeBack } from '@/utils/navigation';
import { useTrackTripProgress } from '@/hooks/useTrackTripProgress';
import { Pressable, StyleSheet, Text, View, ScrollView, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSawari, useQuote } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import { useQuery } from '@tanstack/react-query';
import { couponsQueryOptions } from '@/services/api/offers';
import { formatCurrency, calculateCouponDiscount, isCouponApplicableToVehicle } from '@/services/backend/pricingEngine';
import { CouponNotApplicableModal } from '@/components/common/CouponNotApplicableModal';
import { Reveal } from '@/components/common/Reveal';
import { PriceSummarySkeleton, PaymentPageSkeleton } from '@/components/loading/ScreenSkeletons';

export default function PaymentScreen() {
  useTrackTripProgress('payment'); // Recent searches resume this trip on this page
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const {
    selectedCar,
    dateRange,
    customer,
    sawariCash,
    applyCoupon,
    appliedCouponCode,
    applySawariCash,
    sawariCashToApply,
    dropoff,
    isDeliveryRequested,
    deliveryMode,
    isAuthenticated,
    isAuthLoading,
    membership
  } = useSawari();
  const { pricingQuote, isQuoteLoading, quoteError, refreshQuote } = useQuote();
  // Brief skeleton on open so the page slides in smoothly, then stays until the price quote is ready.
  const [opened, setOpened] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setOpened(true), 450);
    return () => clearTimeout(t);
  }, []);
  const showPageSkeleton = !opened || !pricingQuote;

  useFocusEffect(
    useCallback(() => {
      if (!isAuthLoading && isAuthenticated === false) {
        router.replace('/');
      }
    }, [isAuthenticated, isAuthLoading])
  );

  // Same checks the booking screen makes before opening checkout; a direct link here skips that screen.
  const isTripIncomplete = !dateRange || dateRange.includes('Select') || !dropoff?.name || isAuthenticated !== true;
  
  // Coupon State
  const [couponInput, setCouponInput] = useState('');
  const [showCoupons, setShowCoupons] = useState(false);
  const { data: availableCoupons = [] } = useQuery(couponsQueryOptions);

  // Toggle for Sawari Cash
  const useCash = sawariCashToApply > 0;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Preload Razorpay order in background as soon as payable amount is known
  useEffect(() => {
    if (isAuthenticated && pricingQuote?.onlinePayableNow && pricingQuote.onlinePayableNow > 0) {
      API.prefetchRazorpayOrder(pricingQuote.onlinePayableNow);
    }
  }, [isAuthenticated, pricingQuote?.onlinePayableNow]);

  const [couponError, setCouponError] = useState<string | null>(null);
  const [notApplicableModal, setNotApplicableModal] = useState<{ code: string; reason: string } | null>(null);

  const currentVehicleId = selectedCar?.id || (selectedCar as any)?._id;
  const currentVehicleCategory = selectedCar?.category || (selectedCar as any)?.segment;

  // Show ONLY live (non-expired) coupons valid for this specific vehicle
  const eligibleCoupons = React.useMemo(() => {
    const now = Date.now();
    return availableCoupons.filter(
      (c) =>
        (!c.expiryDate || new Date(c.expiryDate).getTime() > now) &&
        isCouponApplicableToVehicle(c, currentVehicleId, currentVehicleCategory)
    );
  }, [availableCoupons, currentVehicleId, currentVehicleCategory]);

  // Validate live against the server (enforces specific-customer targeting, First-N slots, new-customer, and private codes).
  const handleApplyCoupon = async (raw: string) => {
    const code = raw.trim().toUpperCase();
    if (!code) return;
    setCouponError(null);
    const vehicleId = currentVehicleId;
    const rentalAmt = pricingQuote?.rentalAmount ?? 0;

    const serverCheck = await API.validateCoupon(code, rentalAmt, vehicleId, pricingQuote?.rentalDays || 1);
    if (!serverCheck.offline) {
      if (!serverCheck.valid || serverCheck.discount <= 0) {
        const reason = serverCheck.reason || `${code} isn't valid for this booking.`;
        setCouponError(reason);
        setNotApplicableModal({ code, reason });
        return;
      }
      applyCoupon(code);
      return;
    }

    // Offline fallback: never allow unverified restricted or unknown coupons without server confirmation
    const freshList = await API.getCoupons().catch(() => []);
    const matched = freshList.find((c) => String(c.code).toUpperCase() === code);
    const requiresServerVerification =
      !matched ||
      (matched.customerEligibility && matched.customerEligibility !== 'all') ||
      (typeof matched.firstNCustomers === 'number' && matched.firstNCustomers > 0);
    if (requiresServerVerification) {
      const reason = `Please connect to the internet to verify eligibility for ${code}.`;
      setCouponError(reason);
      setNotApplicableModal({ code, reason });
      return;
    }
    if (pricingQuote && calculateCouponDiscount(pricingQuote.rentalAmount, pricingQuote.driverCharge, code, {
      vehicleId,
      vehicleCategory: currentVehicleCategory,
    }) <= 0) {
      let reason = `${code} isn't valid for this booking.`;
      if (matched.expiryDate && new Date(matched.expiryDate).getTime() <= Date.now()) {
        reason = `${code} has expired.`;
      } else if (!isCouponApplicableToVehicle(matched, vehicleId, currentVehicleCategory)) {
        reason = `${code} is only valid for selected vehicles and cannot be applied to this car.`;
      } else if (matched.minimumBooking > 0 && pricingQuote.rentalAmount < matched.minimumBooking) {
        reason = `Minimum booking of ₹${matched.minimumBooking.toLocaleString('en-IN')} required for ${code}.`;
      }
      setCouponError(reason);
      setNotApplicableModal({ code, reason });
      return;
    }
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

  if (!selectedCar) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 24 }]}>
        <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>No vehicle selected</Text>
        <Pressable onPress={() => router.replace('/')} style={{ marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, backgroundColor: colors.button, borderRadius: 10 }}>
          <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }}>Browse Vehicles</Text>
        </Pressable>
      </View>
    );
  }

  if (quoteError) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.destructive, fontFamily: 'Inter_600SemiBold' }}>{quoteError}</Text>
        <Pressable onPress={() => refreshQuote()} style={{ marginTop: 20, padding: 12, backgroundColor: colors.button, borderRadius: 8 }}>
          <Text style={{ color: '#FFFFFF' }}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        
        <View style={[styles.topBar, { paddingTop: insets.top }]}>
          <Pressable
            accessibilityLabel="Back"
            onPress={() => safeBack(router)}
            style={[styles.headerIconButton, { backgroundColor: '#f5f5f5' }]}
          >
            <Feather name="chevron-left" size={20} color="#262626" />
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: '#262626' }]}>Payment Option</Text>
            <Text style={styles.subtitle}>Secure &amp; encrypted payment</Text>
          </View>
          <Pressable
            accessibilityLabel="Payment information"
            onPress={() => undefined}
            style={[styles.headerIconButton, { backgroundColor: '#f5f5f5' }]}
          >
            <Feather name="info" size={17} color="#525252" />
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: 120 + insets.bottom }]} showsVerticalScrollIndicator={false}>

          {/* 2-MINUTE CAR LOCK NOTICE */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 }}>
            <Feather name="lock" size={14} color={colors.success || '#10B981'} />
            <Text style={{ flex: 1, color: colors.mutedForeground, fontFamily: 'Inter_500Medium', fontSize: 12 }}>
              2:00 exclusive car lock starts when you tap Pay — prevents double booking.
            </Text>
          </View>
          {showPageSkeleton ? <PaymentPageSkeleton /> : (<Reveal>

          {/* YOUR TRIP — read-only summary of choices already made earlier in the funnel */}
          <View style={[styles.sectionHeaderRow, { marginTop: 0 }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 0 }]}>Your Trip</Text>
            <Pressable onPress={() => safeBack(router)} hitSlop={8}>
              <Text style={{ color: colors.blue, fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Edit</Text>
            </Pressable>
          </View>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Trip Dates</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{dateRange}</Text>
            </View>
            <View style={[styles.row, { marginTop: 12 }]}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Duration</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{pricingQuote?.rentalDays || 1} Days</Text>
            </View>
            {!isDeliveryRequested ? (
              <View style={[styles.row, { marginTop: 12 }]}>
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Destination</Text>
                <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: colors.foreground, fontFamily: 'Inter_500Medium', flexShrink: 1, marginLeft: 16, textAlign: 'right' }}>
                  {dropoff?.name || 'Select Destination'}
                </Text>
              </View>
            ) : (
              <>
                {(deliveryMode === 'both' || deliveryMode === 'delivery') && (
                  <View style={[styles.row, { marginTop: 12 }]}>
                    <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Pickup</Text>
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: colors.foreground, fontFamily: 'Inter_500Medium', flexShrink: 1, marginLeft: 16, textAlign: 'right' }}>
                      {pricingQuote && pricingQuote.pickupCharge > 0 ? pricingQuote.pickupLocationName : 'Select Location'}
                    </Text>
                  </View>
                )}
                {(deliveryMode === 'both' || deliveryMode === 'return') && (
                  <View style={[styles.row, { marginTop: 12 }]}>
                    <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Return</Text>
                    <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={{ color: colors.foreground, fontFamily: 'Inter_500Medium', flexShrink: 1, marginLeft: 16, textAlign: 'right' }}>
                      {pricingQuote && pricingQuote.dropCharge > 0 ? pricingQuote.dropLocationName : 'Select Location'}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* CUSTOMER DETAILS */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Customer Details</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Name</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{customer?.name || '—'}</Text>
            </View>
            <View style={[styles.row, { marginTop: 12 }]}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Mobile</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{customer?.mobile || '—'}</Text>
            </View>
            {!!customer?.email && (
              <View style={[styles.row, { marginTop: 12 }]}>
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_400Regular' }}>Email</Text>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{customer.email}</Text>
              </View>
            )}
            <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 12, fontStyle: 'italic' }}>
              Driving licence verification will be done at the time of pickup/delivery.
            </Text>
          </View>


          {/* MEMBERSHIP STATUS CARD */}
          {membership?.plan && (!membership.expiresAt || new Date(membership.expiresAt) > new Date()) && (
            <View style={{ marginTop: 20 }}>
              <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 0 }]}>Membership Benefits</Text>
              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary + '55', borderWidth: 1.5 }]}>
                <View style={styles.row}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '18', alignItems: 'center', justifyContent: 'center' }}>
                      <Feather name="award" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                        {membership.plan.toUpperCase()} Membership Active
                      </Text>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 2 }}>
                        {pricingQuote && pricingQuote.subscriptionDiscount > 0
                          ? `₹${pricingQuote.subscriptionDiscount} discount applied to this booking!`
                          : 'Plan discounts automatically apply at checkout.'}
                      </Text>
                    </View>
                  </View>
                  {pricingQuote && pricingQuote.subscriptionDiscount > 0 && (
                    <View style={{ backgroundColor: colors.primary + '20', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: colors.primary + '40' }}>
                      <Text style={{ color: colors.primaryText || colors.primary, fontFamily: 'Inter_700Bold', fontSize: 13 }}>-₹{pricingQuote.subscriptionDiscount}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          )}

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
                    onChangeText={(t) => { setCouponInput(t); setCouponError(null); }}
                    autoCapitalize="characters"
                  />
                  <Pressable onPress={() => handleApplyCoupon(couponInput)} style={[styles.applyBtn, { backgroundColor: colors.button }]}>
                    <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold' }}>Apply</Text>
                  </Pressable>
                </View>
                {!!couponError && (
                  <Text style={{ color: colors.destructive, fontFamily: 'Inter_500Medium', fontSize: 12, marginTop: 8 }}>{couponError}</Text>
                )}
                <Pressable onPress={() => setShowCoupons(!showCoupons)} style={{ marginTop: 12 }}>
                  <Text style={{ color: colors.blue, fontFamily: 'Inter_500Medium' }}>{showCoupons ? 'Hide available coupons' : 'View available coupons'}</Text>
                </Pressable>
                {showCoupons && (
                  <View style={{ marginTop: 16, gap: 12 }}>
                    {eligibleCoupons.length === 0 ? (
                      <Text style={{ color: colors.mutedForeground, fontSize: 12, textAlign: 'center', paddingVertical: 8 }}>
                        No coupons available for this vehicle right now.
                      </Text>
                    ) : eligibleCoupons.map(c => (
                      <View key={c.code} style={[styles.couponItem, { borderColor: colors.border, backgroundColor: colors.background }]}>
                        <View style={{ flex: 1 }}>
                          <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>{c.code}</Text>
                          <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>
                            {c.discountType === 'FLAT'
                              ? `₹${c.discountValue} OFF`
                              : `${c.discountValue}% OFF${c.minimumDiscount || c.maximumDiscount ? ` (${[c.minimumDiscount ? `Min ₹${c.minimumDiscount}` : null, c.maximumDiscount ? `Max ₹${c.maximumDiscount}` : null].filter(Boolean).join(' • ')})` : ''}`}
                          </Text>
                          <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>Min booking ₹{c.minimumBooking}</Text>
                        </View>
                        <Pressable onPress={() => handleApplyCoupon(c.code)} style={{ paddingHorizontal: 12, paddingVertical: 6, backgroundColor: colors.button, borderRadius: 6 }}>
                          <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 13 }}>Apply</Text>
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </View>

          {/* SAWARI CASH — separate and clearly labeled section */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>SawariCash</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>Use your earned credits to reduce the advance.</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <View>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Apply SawariCash</Text>
              <Text style={{ color: colors.mutedForeground, fontSize: 12, marginTop: 4 }}>Balance: ₹{sawariCash.toFixed(0)}</Text>
            </View>
            <DesignToggle
              accessibilityLabel="Apply SawariCash"
              value={useCash}
              onValueChange={toggleSawariCash}
              disabled={sawariCash <= 0 || (!!pricingQuote && pricingQuote.bookingAdvance <= 0)}
            />
          </View>


          {!pricingQuote ? (
            <PriceSummarySkeleton />
          ) : (
          <Reveal>
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
          <Text style={[styles.sectionSubtitle, { color: colors.mutedForeground }]}>Transparent pricing — no surprises before you pay.</Text>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.row}>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular' }}>{selectedCar.type === 'Bike' ? 'Bike' : 'Car'} Rental ({pricingQuote?.rentalDays || 1} days)</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{formatCurrency(pricingQuote?.rentalAmount || 0)}</Text>
            </View>

            {pricingQuote && pricingQuote.driverCharge > 0 && (
              <View style={[styles.row, { marginTop: 12 }]}>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular' }}>Driver Charges</Text>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{formatCurrency(pricingQuote.driverCharge)}</Text>
              </View>
            )}

            {pricingQuote && pricingQuote.couponDiscount > 0 && (
              <View style={[styles.row, { marginTop: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="tag" size={14} color={colors.success} />
                  <Text style={{ color: colors.success, fontFamily: 'Inter_400Regular' }}>
                    Coupon Discount{pricingQuote.couponCode ? ` (${pricingQuote.couponCode})` : (appliedCouponCode ? ` (${appliedCouponCode})` : '')}
                  </Text>
                </View>
                <Text style={{ color: colors.success, fontFamily: 'Inter_500Medium' }}>- {formatCurrency(pricingQuote.couponDiscount)}</Text>
              </View>
            )}

            {pricingQuote && pricingQuote.subscriptionDiscount > 0 && (
              <View style={[styles.row, { marginTop: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Feather name="award" size={14} color={colors.primary} />
                  <Text style={{ color: colors.primaryText, fontFamily: 'Inter_500Medium' }}>
                    Membership Discount{membership?.plan ? ` (${membership.plan.toUpperCase()})` : ''}
                  </Text>
                </View>
                <Text style={{ color: colors.primaryText, fontFamily: 'Inter_600SemiBold' }}>- {formatCurrency(pricingQuote.subscriptionDiscount)}</Text>
              </View>
            )}

            {pricingQuote && pricingQuote.pickupCharge > 0 && (
              <View style={[styles.row, { marginTop: 12 }]}>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular' }}>Pickup Service</Text>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{formatCurrency(pricingQuote.pickupCharge)}</Text>
              </View>
            )}

            {pricingQuote && pricingQuote.dropCharge > 0 && (
              <View style={[styles.row, { marginTop: 12 }]}>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular' }}>Drop Service</Text>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{formatCurrency(pricingQuote.dropCharge)}</Text>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            <View style={[styles.row, { marginTop: 12 }]}>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Trip Cost</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 15 }}>
                {formatCurrency(Math.max(0, (pricingQuote?.discountedRentalAmount || 0) + (pricingQuote?.pickupCharge || 0) + (pricingQuote?.dropCharge || 0) - (pricingQuote?.subscriptionDiscount || 0)))}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 12 }]} />

            <View style={styles.row}>
              <View>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_400Regular' }}>Booking Advance</Text>
                <Text style={{ color: colors.mutedForeground, fontSize: 11, marginTop: 2 }}>Pay this now to reserve the car</Text>
              </View>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{formatCurrency(pricingQuote?.bookingAdvance || 0)}</Text>
            </View>

            {pricingQuote && pricingQuote.sawariCashUsed > 0 && (
              <View style={[styles.row, { marginTop: 12 }]}>
                <Text style={{ color: colors.success, fontFamily: 'Inter_400Regular' }}>SawariCash Applied</Text>
                <Text style={{ color: colors.success, fontFamily: 'Inter_500Medium' }}>- {formatCurrency(pricingQuote.sawariCashUsed)}</Text>
              </View>
            )}

            <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: 16 }]} />

            <View style={styles.row}>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 18 }}>Pay Now (Booking Advance)</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 18 }}>{formatCurrency(pricingQuote?.onlinePayableNow || 0)}</Text>
            </View>

            {pricingQuote && pricingQuote.remainingRentalAmount > 0 && (
              <View style={[styles.row, { marginTop: 16 }]}>
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>Remaining Balance</Text>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 16 }}>{formatCurrency(pricingQuote.remainingRentalAmount)}</Text>
              </View>
            )}
          </View>
          </Reveal>
          )}
          </Reveal>)}
        </ScrollView>

        <View style={[styles.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <Pressable
            disabled={isQuoteLoading || !pricingQuote || isTripIncomplete || isSubmitting}
            onPress={() => {
              if (isSubmitting) return;
              setIsSubmitting(true);
              import('@/services/api/activity').then(({ ActivityAPI }) => ActivityAPI.logActivity('payment_started', 'PaymentScreen', { amount: pricingQuote?.onlinePayableNow }));
              router.push('/payment-processing');
              setTimeout(() => setIsSubmitting(false), 2000);
            }}
            style={[styles.payButton, { flex: 1, backgroundColor: isQuoteLoading || isTripIncomplete || !pricingQuote || isSubmitting ? colors.muted : colors.button }]}
          >
            {isQuoteLoading || isSubmitting ? (
              <ActivityIndicator color={'#FFFFFF'} />
            ) : (
              <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_600SemiBold', fontSize: 18 }}>
                Pay {formatCurrency(pricingQuote?.onlinePayableNow || 0)}
              </Text>
            )}
          </Pressable>
        </View>
        <CouponNotApplicableModal
          visible={Boolean(notApplicableModal)}
          code={notApplicableModal?.code || ''}
          reason={notApplicableModal?.reason || ''}
          carName={selectedCar?.name}
          onClose={() => setNotApplicableModal(null)}
          onViewCoupons={
            eligibleCoupons.length > 0
              ? () => setShowCoupons(true)
              : undefined
          }
        />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  topBar: { alignItems: 'center', flexDirection: 'row', minHeight: 64, paddingHorizontal: 16 },
  headerIconButton: { alignItems: 'center', borderRadius: 16, height: 32, justifyContent: 'center', width: 32 },
  headerCopy: { flex: 1, gap: 2, justifyContent: 'center', marginHorizontal: 12 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 13, lineHeight: 20 },
  subtitle: { color: '#525252', fontFamily: 'Inter_500Medium', fontSize: 11, lineHeight: 17 },
  content: { padding: 20, paddingBottom: 100 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, marginBottom: 12, marginTop: 24 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, marginBottom: 12 },
  sectionSubtitle: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: -8, marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 12, padding: 8, marginBottom: 16, borderColor: '#eaecf1' },
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
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, padding: 20, flexDirection: 'row', alignItems: 'center' },
  payButton: { paddingHorizontal: 32, minHeight: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }
});