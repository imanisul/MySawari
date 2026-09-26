import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeInUp, Layout } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { API, BookingSnapshot } from '@/services/backend/api';
import { cars } from '@/utils/sawari';
import { CancelBookingSheet } from '@/components/booking/CancelBookingSheet';
import { ExtendBookingSheet } from '@/components/booking/ExtendBookingSheet';
import { ReviewModal } from '@/components/booking/ReviewModal';
import { StatusBarScrim } from '@/components/common/StatusBarScrim';
import { BookingDetailSkeleton } from '@/components/loading/ScreenSkeletons';
import Notifications from '@/utils/notifications';
import { MockRequests, PendingExtension, PendingRefund } from '@/utils/mockRequests';
import { useQuery } from '@tanstack/react-query';
import { useVehicles } from '@/hooks/useVehicles';
import { LoadingImage } from '@/components/common/LoadingImage';

export default function BookingDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();

  const [snapshot, setSnapshot] = useState<BookingSnapshot | null>(null);
  const [loading, setLoading] = useState(!!id);
  const [showCancel, setShowCancel] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [showReview, setShowReview] = useState(false);
  
  const [pendingExtension, setPendingExtension] = useState<PendingExtension | null>(null);
  const [pendingRefund, setPendingRefund] = useState<PendingRefund | null>(null);

  const fetchMockRequests = React.useCallback(async () => {
    if (!id) return;
    const ext = await MockRequests.getExtensionForBooking(id);
    setPendingExtension(ext);
    
    const refund = await MockRequests.getRefundForBooking(id);
    setPendingRefund(refund);
  }, [id, snapshot]);

  useFocusEffect(
    React.useCallback(() => {
      fetchMockRequests();
    }, [fetchMockRequests])
  );

  const handleApproveExtension = async () => {
    if (!__DEV__ || !pendingExtension || !snapshot) return;
    setLoading(true);
    try {
      // Hit the real backend API with a mock payment detail
      await API.extendBooking(snapshot.id, pendingExtension.daysToAdd, snapshot.driverMode === 'With Driver', {
        razorpayOrderId: 'mock_order_123',
        razorpayPaymentId: 'mock_payment_123'
      });
      await MockRequests.approveExtension(snapshot.id);
      const res = await API.getBooking(snapshot.id);
      setSnapshot(res);
      await fetchMockRequests();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveRefund = async () => {
    if (!__DEV__ || !pendingRefund || !snapshot) return;
    setLoading(true);
    try {
      await MockRequests.approveRefund(snapshot.id);
      await fetchMockRequests();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoPush = async () => {
    if (!__DEV__) return;
    alert('Push Notification scheduled! Minimise or close the app now to see it arrive in 5 seconds.');
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Operations App Update',
        body: 'This is a simulated notification from the operations app. Your vehicle is ready for pickup.',
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
      },
    });
  };

  // Whether this (completed) trip has already been reviewed.
  const { data: myReviews } = useQuery({
    queryKey: ['myReviews'],
    queryFn: () => API.reviews.mine(),
    staleTime: 60 * 1000,
  });

  // The real vehicle photos (the same list Home and Explore use), so the booking shows its own car.
  const { data: vehicles = [] } = useVehicles();

  useEffect(() => {
    if (id) {
      API.getBooking(id)
        .then(res => setSnapshot(res))
        .catch(() => setSnapshot(null))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={[styles.content, { paddingTop: insets.top + 16 }]}>
          <View style={styles.topBar}>
            <View style={[styles.circle, { borderColor: colors.border }]}><Feather name="chevron-left" size={20} color={colors.foreground} /></View>
            <Text style={[styles.title, { color: colors.foreground }]}>Booking Details</Text>
          </View>
          <BookingDetailSkeleton />
        </View>
      </View>
    );
  }

  // Fallback if no snapshot found (missing id, or the id didn't resolve to a booking)
  if (!snapshot) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>Booking not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}>
          <Text style={{ color: colors.primaryForeground }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const s = snapshot;

  // The booked vehicle's own photo. If it can't be matched we show a neutral placeholder rather than some other car.
  const matchedCar = vehicles.find(c => c.id === s.vehicleId) || cars.find(c => c.id === s.vehicleId);
  const carImage = matchedCar?.image;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}
        entering={FadeIn.duration(400)}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={[styles.circle, { borderColor: colors.border }]}><Feather name="chevron-left" size={20} color={colors.foreground} /></Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Booking Details</Text>
        </View>



        <View style={[styles.referenceCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>Booking ID</Text>
            <Text style={[styles.reference, { color: colors.foreground }]}>{s.id}</Text>
          </View>
          <View style={styles.status}>
            <View style={[styles.statusDot, { backgroundColor: s.status === 'COMPLETED' ? colors.success : s.status === 'CANCELLED' || s.status === 'FAILED' ? colors.destructive : colors.blue }]} />
            <Text style={[styles.statusText, { color: colors.foreground, textTransform: 'capitalize' }]}>{s.status.toLowerCase()}</Text>
          </View>
        </View>

        {/* DEMO BUTTON — development builds only; never shipped to customers */}
        {__DEV__ && <Pressable
          onPress={handleDemoPush}
          style={({ pressed }) => [
            {
              backgroundColor: colors.blue,
              borderRadius: 12,
              padding: 16,
              alignItems: 'center',
              marginTop: 16,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#FFF', fontSize: 14 }}>
            DEMO: Trigger Operation App Notification (5s delay)
          </Text>
        </Pressable>}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>VEHICLE</Text>
        <View style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <View style={[styles.hero, { backgroundColor: colors.muted, alignItems: 'center', justifyContent: 'center' }]}>
            {carImage ? (
              <LoadingImage source={carImage} style={StyleSheet.absoluteFill} contentFit="cover" transition={150} />
            ) : (
              <Feather name="image" size={32} color={colors.mutedForeground} />
            )}
          </View>
          <View style={styles.vehicleBody}>
            <Text style={[styles.vehicleName, { color: colors.foreground }]}>{s.vehicleName}</Text>
            <View style={[styles.metaItem, { marginTop: 8 }]}><Feather name="refresh-cw" size={13} color={colors.mutedForeground} /><Text style={[styles.metaText, { color: colors.mutedForeground }]}>Unlimited km</Text></View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TRIP</Text>
        <View style={styles.tripBoxes}>
          <View style={[styles.tripBox, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <Text style={[styles.boxLabel, { color: colors.mutedForeground }]}>RENTAL DAYS</Text>
            <Text style={[styles.boxValue, { color: colors.foreground }]}>{s.rentalDays} Days</Text>
            <Text style={[styles.boxMeta, { color: colors.mutedForeground }]}>
              {s.pickupDate}{s.pickupTime ? `, ${s.pickupTime}` : ''} → {s.returnDate}{s.dropTime ? `, ${s.dropTime}` : ''}
            </Text>
          </View>
        </View>

        {(!s.pickupCharge && !s.dropCharge) ? (
          <View style={[styles.tripBoxes, { marginTop: 12 }]}>
            <View style={[styles.tripBox, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, width: '100%' }]}>
              <Text style={[styles.boxLabel, { color: colors.mutedForeground }]}>DESTINATION</Text>
              <Text style={[styles.boxValue, { color: colors.foreground }]}>Self Drive to Location</Text>
              <Text style={[styles.boxMeta, { color: colors.mutedForeground }]} numberOfLines={1}>{s.dropoffLocationName || 'MySawari Office'}</Text>
            </View>
          </View>
        ) : (
          <View style={[styles.tripBoxes, { marginTop: 12 }]}>
            {(s.pickupCharge || 0) > 0 && (
              <View style={[styles.tripBox, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, flex: 1 }]}>
                <Text style={[styles.boxLabel, { color: colors.mutedForeground }]}>PICKUP</Text>
                <Text style={[styles.boxValue, { color: colors.foreground }]}>Delivered</Text>
                <Text style={[styles.boxMeta, { color: colors.mutedForeground }]} numberOfLines={1}>{s.pickupLocationName}</Text>
              </View>
            )}
            {(s.dropCharge || 0) > 0 && (
              <View style={[styles.tripBox, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, flex: 1, marginLeft: (s.pickupCharge || 0) > 0 ? 12 : 0 }]}>
                <Text style={[styles.boxLabel, { color: colors.mutedForeground }]}>DROP</Text>
                <Text style={[styles.boxValue, { color: colors.foreground }]}>Collected</Text>
                <Text style={[styles.boxMeta, { color: colors.mutedForeground }]} numberOfLines={1}>{s.dropLocationName}</Text>
              </View>
            )}
          </View>
        )}

        {s.extensions && s.extensions.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>EXTENSION HISTORY</Text>
            <View style={[styles.customerCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, padding: 16 }]}>
              {s.extensions.map((ext, idx) => {
                const formatDateSafe = (dateStr: string) => {
                  if (dateStr.includes('T') || dateStr.includes('-')) {
                    const d = new Date(dateStr);
                    if (!isNaN(d.getTime())) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
                  }
                  return dateStr;
                };
                
                return (
                  <View key={ext.id} style={{ marginBottom: idx < s.extensions!.length - 1 ? 16 : 0 }}>
                    <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>Extension #{idx + 1}</Text>
                    <Text style={{ color: colors.mutedForeground, marginTop: 4 }}>Extended until {formatDateSafe(ext.newEndDate)}</Text>
                    <Text style={{ color: colors.mutedForeground }}>+{ext.additionalDays} Days | ₹{ext.additionalAmount.toLocaleString('en-IN')}</Text>
                    {idx < s.extensions!.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 12, marginBottom: 0 }]} />}
                  </View>
                );
              })}
            </View>
          </>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CUSTOMER</Text>
        <View style={[styles.customerCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <CustomerRow icon="user" label="Full name" value={s.customerName || '—'} border colors={colors} />
          <CustomerRow icon="smartphone" label="Mobile" value={s.customerMobile || '—'} border colors={colors} />
          <CustomerRow icon="mail" label="Email" value={s.customerEmail || 'Not provided'} colors={colors} />
        </View>

        {s.estimatedFuelCost ? (
          <>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ESTIMATED PETROL (Reference)</Text>
            <View style={[styles.customerCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, padding: 16 }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>Est. Travel</Text>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{s.estimatedKm} KM</Text>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>Mileage / Petrol Price</Text>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{s.vehicleMileageUsed} KM/L @ ₹{s.fuelPriceUsed}/L</Text>
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 8 }} />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Estimated Fuel Expense</Text>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>₹{s.estimatedFuelCost.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </>
        ) : null}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PAYMENT</Text>
        <View style={[styles.paymentCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <PaymentRow label={`Car Rental (${s.rentalDays} days)`} value={`₹${s.rentalAmount.toLocaleString('en-IN')}`} colors={colors} />
          {s.couponDiscount > 0 && <PaymentRow label={`Coupon (${s.couponCode})`} value={`-₹${s.couponDiscount.toLocaleString('en-IN')}`} accent colors={colors} />}
          {(s.pickupCharge || 0) > 0 && <PaymentRow label={`Pickup Service (${s.pickupDistanceKm || 0} km)`} value={`₹${(s.pickupCharge || 0).toLocaleString('en-IN')}`} colors={colors} />}
          {(s.dropCharge || 0) > 0 && <PaymentRow label={`Drop Service (${s.dropDistanceKm || 0} km)`} value={`₹${(s.dropCharge || 0).toLocaleString('en-IN')}`} colors={colors} />}
          {(s.fastagAmount || 0) > 0 && <PaymentRow label="Fastag" value={`₹${(s.fastagAmount || 0).toLocaleString('en-IN')}`} colors={colors} />}
          {(s.securityDeposit || 0) > 0 && <PaymentRow label="Security Deposit" value={`₹${(s.securityDeposit || 0).toLocaleString('en-IN')}`} colors={colors} />}
          {s.sawariCashUsed > 0 && <PaymentRow label="SawariCash Applied" value={`-₹${s.sawariCashUsed.toLocaleString('en-IN')}`} accent colors={colors} />}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          
          <PaymentRow label="Booking Amount Paid" value={`₹${s.onlinePayableNow.toLocaleString('en-IN')}`} strong colors={colors} />
          {(s.totalCollected || 0) > s.onlinePayableNow && (
            <PaymentRow label="Total Paid So Far" value={`₹${(s.totalCollected || 0).toLocaleString('en-IN')}`} strong colors={colors} />
          )}
          {!!s.razorpayPaymentId && <Text style={{ color: colors.mutedForeground, fontSize: 11, textAlign: 'right', marginTop: 2, marginBottom: 8 }}>Transaction ID: {s.razorpayPaymentId}</Text>}
          <PaymentRow 
            label="Remaining Balance" 
            value={s.remainingRentalAmount <= 0 ? 'Paid' : `₹${s.remainingRentalAmount.toLocaleString('en-IN')}`} 
            accent={s.remainingRentalAmount <= 0}
            strong 
            colors={colors} 
          />

          {s.totalRentalAmount && s.totalRentalAmount > s.rentalAmount ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 12 }]} />
              <PaymentRow label="Additional Extensions" value={`₹${(s.totalRentalAmount - s.rentalAmount).toLocaleString('en-IN')}`} colors={colors} />
              <PaymentRow label="Total Paid" value={`₹${s.totalRentalAmount.toLocaleString('en-IN')}`} strong colors={colors} />
            </>
          ) : null}
        </View>

        {s.status === 'CANCELLED' && s.cancellationFee !== undefined && (
          <>
            <Text style={[styles.sectionLabel, { color: colors.destructive }]}>CANCELLATION DETAILS</Text>
            <View style={[styles.customerCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1, padding: 16 }]}>
              <View style={styles.paymentRow}>
                <Text style={{ color: colors.mutedForeground }}>Cancellation Reason</Text>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium' }}>{s.cancellationReason}</Text>
              </View>
              <View style={styles.paymentRow}>
                <Text style={{ color: colors.mutedForeground }}>Cancellation Fee</Text>
                <Text style={{ color: colors.destructive, fontFamily: 'Inter_500Medium' }}>₹{s.cancellationFee.toLocaleString('en-IN')}</Text>
              </View>
              
              {pendingRefund ? (
                <>
                  <View style={[styles.paymentRow, { backgroundColor: '#F59E0B20', padding: 8, borderRadius: 8, marginHorizontal: -8, alignItems: 'center' }]}>
                    <Text style={{ color: '#B45309', fontFamily: 'Inter_600SemiBold', flex: 1 }}>Refund Requested</Text>
                    <Text style={{ color: '#B45309', fontFamily: 'Inter_700Bold' }}>₹{(s.refundAmount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                  {__DEV__ && (
                    <Pressable
                      style={{ padding: 10, backgroundColor: '#B45309', borderRadius: 8, alignItems: 'center', marginTop: 8 }}
                      onPress={handleApproveRefund}
                    >
                      <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#FFF', fontSize: 13 }}>DEMO: Approve Refund</Text>
                    </Pressable>
                  )}
                </>
              ) : (
                <View style={styles.paymentRow}>
                  <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>Refund Amount Received</Text>
                  <Text style={{ color: colors.success, fontFamily: 'Inter_600SemiBold' }}>₹{(s.refundAmount || 0).toLocaleString('en-IN')}</Text>
                </View>
              )}
            </View>
          </>
        )}

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RENTAL INFORMATION</Text>
        <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
          <Feather name="info" size={16} color={colors.mutedForeground} style={{ marginTop: 2 }} />
          <Text style={[styles.infoText, { color: colors.mutedForeground, flex: 1 }]}>
            Free cancellation until 24h before pickup. Unlimited kilometres. Carry your original driving licence and a valid ID at pickup.
          </Text>
        </View>
        {/* Room for the pinned action bar so the last section is never covered */}
        <View style={{ height: 110 }} />
      </Animated.ScrollView>

      {/* Bottom Sheets */}
      <CancelBookingSheet 
        visible={showCancel} 
        onClose={() => setShowCancel(false)} 
        booking={s} 
        onSuccess={setSnapshot} 
      />
      <ExtendBookingSheet 
        visible={showExtend} 
        onClose={() => setShowExtend(false)} 
        booking={s} 
        onSuccess={setSnapshot} 
      />

      <ReviewModal
        trip={showReview ? { bookingId: s.id, carId: String(s.vehicleId), vehicleName: s.vehicleName } : null}
        onClose={() => setShowReview(false)}
      />

      {s.status === 'COMPLETED' && (
        <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.actionBar, { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
          {myReviews && (myReviews.bookingIds.includes(s.id) || myReviews.legacyCarIds.includes(String(s.vehicleId))) ? (
            <View style={[styles.actionBtn, { flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: colors.border }]}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.success }}>You reviewed this trip</Text>
            </View>
          ) : (
            <Pressable
              style={[styles.actionBtn, { flexDirection: 'row', gap: 8, backgroundColor: colors.primary }]}
              onPress={() => setShowReview(true)}
            >
              <Feather name="star" size={16} color={colors.primaryForeground} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.primaryForeground }}>Write a review</Text>
            </Pressable>
          )}
        </Animated.View>
      )}

      {(s.status === 'CONFIRMED' || s.status === 'ONGOING' || s.status === 'PENDING') && (
        <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.actionBar, { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
          
          {/* Pending Extension Demo UI */}
          {pendingExtension && (
            <View style={{ width: '100%', marginBottom: 12, padding: 12, backgroundColor: '#F59E0B20', borderRadius: 12, borderWidth: 1, borderColor: '#F59E0B50' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Feather name="clock" size={16} color="#B45309" />
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#B45309' }}>Extension Requested</Text>
              </View>
              <Text style={{ fontFamily: 'Inter_400Regular', color: colors.foreground, fontSize: 13, marginBottom: 12 }}>
                Request to add {pendingExtension.daysToAdd} days sent to Operations.
              </Text>
              {__DEV__ && (
                <Pressable
                  style={{ padding: 10, backgroundColor: '#B45309', borderRadius: 8, alignItems: 'center' }}
                  onPress={handleApproveExtension}
                >
                  <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#FFF', fontSize: 13 }}>DEMO: Approve Request</Text>
                </Pressable>
              )}
            </View>
          )}

          <View style={{ flexDirection: 'row', gap: 12 }}>
            {(s.status === 'CONFIRMED' || s.status === 'PENDING') && (
              <Pressable 
                style={[styles.actionBtn, { borderWidth: 1, borderColor: colors.border, flex: 1 }]}
                onPress={() => setShowCancel(true)}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>Cancel</Text>
              </Pressable>
            )}

            {((s.status === 'CONFIRMED' || s.status === 'ONGOING') && (s.pickupCharge || 0) > 0) && (
              <Pressable 
                style={[styles.actionBtn, { backgroundColor: '#047857', flex: 1 }]}
                onPress={() => {
                  import('react-native').then(({ Linking }) => {
                    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.pickupLocationName || 'Kahilipara, Guwahati')}`);
                  });
                }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' }}>Track Vehicle</Text>
              </Pressable>
            )}

            {(s.status === 'CONFIRMED' || s.status === 'ONGOING') && !pendingExtension && (
              <Pressable 
                style={[styles.actionBtn, { backgroundColor: colors.primary, flex: 1 }]}
                onPress={() => setShowExtend(true)}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.primaryForeground }}>Extend Trip</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
      <StatusBarScrim />
    </View>
  );
}

function CustomerRow({ icon, label, value, border, colors }: { icon: any, label: string, value: string, border?: boolean, colors: any }) {
  return (
    <View style={[styles.customerRow, border && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Feather name={icon} size={16} color={colors.mutedForeground} />
      <Text style={[styles.customerLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.customerValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function PaymentRow({ label, value, accent, strong, mutedValue, colors }: { label: string, value: string, accent?: boolean, strong?: boolean, mutedValue?: boolean, colors: any }) {
  return (
    <View style={styles.paymentRow}>
      <Text style={[styles.paymentLabel, { color: strong ? colors.foreground : colors.mutedForeground, fontFamily: strong ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>{label}</Text>
      <Text style={[styles.paymentValue, { color: accent ? colors.success : mutedValue ? colors.mutedForeground : colors.foreground, fontFamily: strong ? 'Inter_700Bold' : 'Inter_500Medium', fontSize: strong ? 16 : 14 }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 24 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  circle: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 20 },
  referenceCard: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', marginTop: 32, padding: 16 },
  smallLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  reference: { fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 4 },
  status: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  statusDot: { borderRadius: 99, height: 8, width: 8 },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 12, letterSpacing: 1, marginBottom: 12, marginTop: 32 },
  vehicleCard: { borderRadius: 16, overflow: 'hidden' },
  hero: { height: 160, width: '100%' },
  vehicleBody: { padding: 16 },
  vehicleName: { fontFamily: 'Inter_700Bold', fontSize: 20 },
  vehicleMetaRow: { flexDirection: 'row', gap: 16, marginTop: 12 },
  metaItem: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  metaText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  tripBoxes: { flexDirection: 'row', gap: 12 },
  tripBox: { borderRadius: 16, flex: 1, padding: 16 },
  boxLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.5 },
  boxValue: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginTop: 8 },
  boxMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  customerCard: { borderRadius: 16 },
  customerRow: { alignItems: 'center', flexDirection: 'row', padding: 16 },
  customerLabel: { fontFamily: 'Inter_400Regular', fontSize: 14, marginLeft: 12, width: 100 },
  customerValue: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 14, textAlign: 'right' },
  paymentCard: { borderRadius: 16, padding: 16 },
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  paymentLabel: { fontSize: 14 },
  paymentValue: { fontSize: 14 },
  divider: { height: 1, marginBottom: 12, marginTop: 4, width: '100%' },
  infoBox: { borderRadius: 16, flexDirection: 'row', gap: 12, padding: 16 },
  infoText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: 1, padding: 16, flexDirection: 'row', gap: 12 },
  actionBtn: { flex: 1, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }
});