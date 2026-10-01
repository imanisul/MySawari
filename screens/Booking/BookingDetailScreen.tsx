import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, Linking } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { API, BookingSnapshot } from '@/services/backend/api';
import { cars } from '@/utils/sawari';
import { CancelBookingSheet } from '@/components/booking/CancelBookingSheet';
import { ExtendBookingSheet } from '@/components/booking/ExtendBookingSheet';
import { ReviewModal } from '@/components/booking/ReviewModal';
import { BookingDetailSkeleton } from '@/components/loading/ScreenSkeletons';
import { MockRequests, PendingRefund } from '@/utils/mockRequests';
import { useQuery } from '@tanstack/react-query';
import { useVehicles } from '@/hooks/useVehicles';
import { LoadingImage } from '@/components/common/LoadingImage';

// Status config — colour + icon for each state
const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  CONFIRMED: { color: '#2563EB', bg: '#2563EB18', icon: 'check-circle', label: 'Confirmed' },
  PENDING:   { color: '#D97706', bg: '#D9770618', icon: 'clock',        label: 'Pending' },
  ONGOING:   { color: '#059669', bg: '#05966918', icon: 'navigation',   label: 'Ongoing' },
  COMPLETED: { color: '#16A34A', bg: '#16A34A18', icon: 'check-circle', label: 'Completed' },
  CANCELLED: { color: '#DC2626', bg: '#DC262618', icon: 'x-circle',     label: 'Cancelled' },
  FAILED:    { color: '#DC2626', bg: '#DC262618', icon: 'alert-circle',  label: 'Failed' },
};

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
  const [pendingRefund, setPendingRefund] = useState<PendingRefund | null>(null);

  const hasPendingExtension = snapshot?.extensions?.some((e: any) => e.status === 'pending');
  const hasRejectedExtension = snapshot?.extensions?.some((e: any) => e.status === 'rejected');

  const fetchMockRequests = React.useCallback(async () => {
    if (!id) return;
    const refund = await MockRequests.getRefundForBooking(id);
    setPendingRefund(refund);
  }, [id, snapshot]);

  useFocusEffect(React.useCallback(() => { fetchMockRequests(); }, [fetchMockRequests]));

  const { data: myReviews } = useQuery({
    queryKey: ['myReviews'],
    queryFn: () => API.reviews.mine(),
    staleTime: 60 * 1000,
  });

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
            <View style={[styles.circle, { borderColor: colors.border }]}>
              <Feather name="chevron-left" size={20} color={colors.foreground} />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>Trip Details</Text>
          </View>
          <BookingDetailSkeleton />
        </View>
      </View>
    );
  }

  if (!snapshot) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Feather name="inbox" size={40} color={colors.mutedForeground} />
        <Text style={{ color: colors.foreground, fontFamily: 'Inter_500Medium', marginTop: 16 }}>Booking not found</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: colors.primary, borderRadius: 12 }}>
          <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }}>Go Back</Text>
        </Pressable>
      </View>
    );
  }

  const s = snapshot;
  const matchedCar = vehicles.find(c => c.id === s.vehicleId) || cars.find(c => c.id === s.vehicleId);
  const carImage = matchedCar?.image;
  const statusCfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.CONFIRMED;

  const formatDateSafe = (dateStr: string) => {
    if (!dateStr) return '—';
    if (dateStr.includes('T') || dateStr.includes('-')) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    }
    return dateStr;
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <Animated.ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: 140 }]}
        entering={FadeIn.duration(300)}
      >
        {/* ── TOP BAR ── */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => { Haptics.selectionAsync(); router.back(); }}
            style={[styles.circle, { borderColor: colors.border, backgroundColor: colors.card }]}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Trip Details</Text>
        </View>

        {/* ── BOOKING ID + STATUS ── */}
        <Animated.View entering={FadeInDown.delay(60).springify()} style={[styles.referenceCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>Booking Reference</Text>
            <Text style={[styles.reference, { color: colors.foreground }]}>
              {s.bookingCode || s.id.slice(0, 8).toUpperCase()}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
            <Feather name={statusCfg.icon as any} size={13} color={statusCfg.color} />
            <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
          </View>
        </Animated.View>

        {/* ── VEHICLE ── */}
        <Animated.View entering={FadeInDown.delay(120).springify()}>
          <SectionLabel label="VEHICLE" colors={colors} />
          <View style={[styles.vehicleCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.hero, { backgroundColor: colors.muted }]}>
              {carImage ? (
                <LoadingImage source={carImage} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="truck" size={36} color={colors.mutedForeground} />
                </View>
              )}
              {/* Gradient overlay for vehicle name */}
              <View style={styles.heroOverlay}>
                <Text style={styles.heroVehicleName} numberOfLines={1}>{s.vehicleName}</Text>
              </View>
            </View>
            <View style={[styles.vehicleBody, { borderTopColor: colors.border }]}>
              <View style={{ flexDirection: 'row', gap: 20 }}>
                <View style={styles.metaItem}>
                  <Feather name="refresh-cw" size={13} color={colors.primaryText} />
                  <Text style={[styles.metaText, { color: colors.foreground }]}>Unlimited km</Text>
                </View>
                <View style={styles.metaItem}>
                  <Feather name="calendar" size={13} color={colors.primaryText} />
                  <Text style={[styles.metaText, { color: colors.foreground }]}>{s.rentalDays} day{s.rentalDays !== 1 ? 's' : ''}</Text>
                </View>
                {s.driverMode && (
                  <View style={styles.metaItem}>
                    <Feather name="user" size={13} color={colors.primaryText} />
                    <Text style={[styles.metaText, { color: colors.foreground }]}>{s.driverMode}</Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        </Animated.View>

        {/* ── TRIP TIMELINE ── */}
        <Animated.View entering={FadeInDown.delay(180).springify()}>
          <SectionLabel label="TRIP" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>

            {/* Pickup */}
            <View style={styles.timelineRow}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: colors.primary }]} />
                <View style={[styles.timelineLine, { backgroundColor: colors.border }]} />
              </View>
              <View style={styles.timelineContent}>
                <Text style={[styles.timelineLabel, { color: colors.mutedForeground }]}>PICKUP</Text>
                <Text style={[styles.timelineDate, { color: colors.foreground }]}>
                  {s.pickupDate}{s.pickupTime ? ` · ${s.pickupTime}` : ''}
                </Text>
                <Text style={[styles.timelineLoc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {(s.pickupCharge || 0) > 0 ? '🚗 Delivered to you' : '📍 Self Pickup'} · {s.pickupLocationName || 'Office'}
                </Text>
              </View>
            </View>

            {/* Drop-off */}
            <View style={[styles.timelineRow, { marginTop: 0 }]}>
              <View style={styles.timelineLeft}>
                <View style={[styles.timelineDot, { backgroundColor: colors.success }]} />
              </View>
              <View style={[styles.timelineContent, { marginBottom: 0 }]}>
                <Text style={[styles.timelineLabel, { color: colors.mutedForeground }]}>DROP OFF</Text>
                <Text style={[styles.timelineDate, { color: colors.foreground }]}>
                  {s.returnDate}{s.dropTime ? ` · ${s.dropTime}` : ''}
                </Text>
                <Text style={[styles.timelineLoc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {(s.dropCharge || 0) > 0 ? '🏠 Collected from you' : '📍 Self Drop'} · {s.dropoffLocationName || 'Office'}
                </Text>
              </View>
            </View>

            {/* Navigate button */}
            <Pressable
              style={({ pressed }) => [styles.mapBtn, { backgroundColor: colors.tintLight, borderColor: colors.primary + '40', opacity: pressed ? 0.75 : 1, marginTop: 16 }]}
              onPress={() => {
                Haptics.selectionAsync();
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.pickupLocationName && s.pickupLocationName !== 'Office' ? s.pickupLocationName : 'MySawari Kahilipara Guwahati')}`);
              }}
            >
              <Feather name="navigation" size={14} color={colors.primaryText} />
              <Text style={[styles.mapBtnText, { color: colors.primaryText }]}>Get Directions</Text>
            </Pressable>
          </View>
        </Animated.View>

        {/* ── EXTENSION HISTORY ── */}
        {s.extensions && s.extensions.length > 0 && (
          <Animated.View entering={FadeInDown.delay(220).springify()}>
            <SectionLabel label="EXTENSION HISTORY" colors={colors} />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {s.extensions.map((ext, idx) => (
                <View key={ext.id} style={{ marginBottom: idx < s.extensions!.length - 1 ? 16 : 0 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>
                      Extension #{idx + 1}
                    </Text>
                    <View style={{
                      backgroundColor: ext.status === 'approved' ? colors.success + '20' : ext.status === 'rejected' ? colors.destructive + '20' : '#D9770618',
                      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20
                    }}>
                      <Text style={{
                        color: ext.status === 'approved' ? colors.success : ext.status === 'rejected' ? colors.destructive : '#D97706',
                        fontSize: 11, fontFamily: 'Inter_600SemiBold', textTransform: 'uppercase'
                      }}>
                        {ext.status || 'pending'}
                      </Text>
                    </View>
                  </View>
                  <Text style={{ color: colors.mutedForeground, marginTop: 6, fontSize: 13 }}>
                    Until {formatDateSafe(ext.newEndDate)} · +{ext.daysToAdd || (ext as any).additionalDays} days · ₹{(ext.additionalAmount || 0).toLocaleString('en-IN')}
                  </Text>
                  {idx < s.extensions!.length - 1 && (
                    <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 12, marginBottom: 0 }]} />
                  )}
                </View>
              ))}
            </View>
          </Animated.View>
        )}

        {/* ── CUSTOMER ── */}
        <Animated.View entering={FadeInDown.delay(260).springify()}>
          <SectionLabel label="CUSTOMER" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, padding: 0 }]}>
            <CustomerRow icon="user" label="Full name" value={s.customerName || '—'} border colors={colors} />
            <CustomerRow icon="smartphone" label="Mobile" value={s.customerMobile || '—'} border colors={colors} />
            <CustomerRow icon="mail" label="Email" value={s.customerEmail || 'Not provided'} colors={colors} />
          </View>
        </Animated.View>

        {/* ── FUEL ESTIMATE ── */}
        {!!s.estimatedFuelCost && (
          <Animated.View entering={FadeInDown.delay(300).springify()}>
            <SectionLabel label="ESTIMATED PETROL (Reference)" colors={colors} />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <InfoRow label="Est. Travel" value={`${s.estimatedKm} KM`} colors={colors} />
              <InfoRow label="Mileage / Fuel Price" value={`${s.vehicleMileageUsed} KM/L @ ₹${s.fuelPriceUsed}/L`} colors={colors} />
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <InfoRow label="Estimated Fuel Expense" value={`₹${s.estimatedFuelCost.toLocaleString('en-IN')}`} bold colors={colors} />
            </View>
          </Animated.View>
        )}

        {/* ── PAYMENT ── */}
        <Animated.View entering={FadeInDown.delay(320).springify()}>
          <SectionLabel label="PAYMENT" colors={colors} />
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <PaymentRow label={`Car Rental (${s.rentalDays} days)`} value={`₹${s.rentalAmount.toLocaleString('en-IN')}`} colors={colors} />
            {s.couponDiscount > 0 && <PaymentRow label={`Coupon${s.couponCode ? ` (${s.couponCode})` : ''}`} value={`-₹${s.couponDiscount.toLocaleString('en-IN')}`} accent colors={colors} />}
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
            {!!s.razorpayPaymentId && (
              <Text style={{ color: colors.mutedForeground, fontSize: 11, textAlign: 'right', marginTop: -6, marginBottom: 10 }}>
                Txn: {s.razorpayPaymentId}
              </Text>
            )}
            <View style={[styles.remainingBadge, { backgroundColor: s.remainingRentalAmount <= 0 ? colors.success + '18' : colors.destructive + '10' }]}>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 13, color: colors.mutedForeground }}>Remaining Balance</Text>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: s.remainingRentalAmount <= 0 ? colors.success : colors.destructive }}>
                {s.remainingRentalAmount <= 0 ? '✓ Fully Paid' : `₹${s.remainingRentalAmount.toLocaleString('en-IN')}`}
              </Text>
            </View>

            {s.totalRentalAmount && s.totalRentalAmount > s.rentalAmount ? (
              <>
                <View style={[styles.divider, { backgroundColor: colors.border, marginTop: 8 }]} />
                <PaymentRow label="Additional Extensions" value={`₹${(s.totalRentalAmount - s.rentalAmount).toLocaleString('en-IN')}`} colors={colors} />
                <PaymentRow label="Total Paid" value={`₹${s.totalRentalAmount.toLocaleString('en-IN')}`} strong colors={colors} />
              </>
            ) : null}
          </View>
        </Animated.View>

        {/* ── CANCELLATION ── */}
        {s.status === 'CANCELLED' && s.cancellationFee !== undefined && (
          <Animated.View entering={FadeInDown.delay(360).springify()}>
            <SectionLabel label="CANCELLATION" colors={colors} accent />
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.destructive + '40' }]}>
              <InfoRow label="Reason" value={s.cancellationReason || '—'} colors={colors} />
              <InfoRow label="Cancellation Fee" value={`₹${(s.cancellationFee || 0).toLocaleString('en-IN')}`} colors={colors} destructive />
              {pendingRefund ? (
                <View style={[styles.alertBox, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B40' }]}>
                  <Feather name="clock" size={14} color="#B45309" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#B45309', fontSize: 13 }}>Refund Requested</Text>
                    <Text style={{ fontFamily: 'Inter_700Bold', color: '#B45309', fontSize: 14 }}>₹{(s.refundAmount || 0).toLocaleString('en-IN')}</Text>
                  </View>
                </View>
              ) : (
                <InfoRow label="Refund Received" value={`₹${(s.refundAmount || 0).toLocaleString('en-IN')}`} colors={colors} success />
              )}
            </View>
          </Animated.View>
        )}

        {/* ── INFO ── */}
        <Animated.View entering={FadeInDown.delay(380).springify()} style={[styles.infoBox, { backgroundColor: colors.tintLight, borderColor: colors.primary + '30' }]}>
          <Feather name="info" size={15} color={colors.primaryText} style={{ marginTop: 1 }} />
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
            Free cancellation until 24h before pickup. Unlimited kilometres. Carry your driving licence and a valid ID at pickup.
          </Text>
        </Animated.View>
      </Animated.ScrollView>

      {/* ── SHEETS ── */}
      <CancelBookingSheet visible={showCancel} onClose={() => setShowCancel(false)} booking={s} onSuccess={setSnapshot} />
      <ExtendBookingSheet visible={showExtend} onClose={() => setShowExtend(false)} booking={s} onSuccess={setSnapshot} />
      <ReviewModal
        trip={showReview ? { bookingId: s.id, carId: String(s.vehicleId), vehicleName: s.vehicleName } : null}
        onClose={() => setShowReview(false)}
      />

      {/* ── COMPLETED ACTION BAR ── */}
      {s.status === 'COMPLETED' && (
        <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.actionBar, { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
          {myReviews && (myReviews.bookingIds.includes(s.id) || myReviews.legacyCarIds.includes(String(s.vehicleId))) ? (
            <View style={[styles.actionBtn, { flexDirection: 'row', gap: 8, borderWidth: 1, borderColor: colors.border }]}>
              <Feather name="check-circle" size={16} color={colors.success} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.success }}>Reviewed — Thank you!</Text>
            </View>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.actionBtn, { flexDirection: 'row', gap: 8, backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowReview(true); }}
            >
              <Feather name="star" size={16} color={colors.primaryForeground} />
              <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.primaryForeground }}>Write a Review</Text>
            </Pressable>
          )}
        </Animated.View>
      )}

      {/* ── ACTIVE ACTION BAR ── */}
      {(s.status === 'CONFIRMED' || s.status === 'ONGOING' || s.status === 'PENDING') && (
        <Animated.View entering={FadeInDown.delay(300).springify()} style={[styles.actionBar, { backgroundColor: colors.background, borderColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
          {hasPendingExtension && (
            <View style={[styles.alertBox, { backgroundColor: '#F59E0B18', borderColor: '#F59E0B40', marginBottom: 12 }]}>
              <Feather name="clock" size={15} color="#B45309" />
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#B45309', fontSize: 13 }}>Extension Requested</Text>
                <Text style={{ fontFamily: 'Inter_400Regular', color: '#B45309', fontSize: 12 }}>Waiting for Operations to approve.</Text>
              </View>
            </View>
          )}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(s.status === 'CONFIRMED' || s.status === 'PENDING') && (
              <Pressable
                style={({ pressed }) => [styles.actionBtn, { borderWidth: 1, borderColor: colors.border, flex: 1, opacity: pressed ? 0.75 : 1 }]}
                onPress={() => { Haptics.selectionAsync(); setShowCancel(true); }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>Cancel</Text>
              </Pressable>
            )}
            {((s.status === 'CONFIRMED' || s.status === 'ONGOING') && (s.pickupCharge || 0) > 0) && (
              <Pressable
                style={({ pressed }) => [styles.actionBtn, { backgroundColor: '#047857', flex: 1, opacity: pressed ? 0.85 : 1 }]}
                onPress={() => {
                  Haptics.selectionAsync();
                  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(s.pickupLocationName && s.pickupLocationName !== 'Office' ? s.pickupLocationName : 'Kahilipara, Guwahati')}`);
                }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#FFFFFF' }}>Track Vehicle</Text>
              </Pressable>
            )}
            {(s.status === 'CONFIRMED' || s.status === 'ONGOING') && !hasPendingExtension && !hasRejectedExtension && (
              <Pressable
                style={({ pressed }) => [styles.actionBtn, { backgroundColor: colors.primary, flex: 1, opacity: pressed ? 0.85 : 1 }]}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowExtend(true); }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', color: colors.primaryForeground }}>Extend Trip</Text>
              </Pressable>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────────

function SectionLabel({ label, colors, accent }: { label: string; colors: any; accent?: boolean }) {
  return (
    <Text style={[styles.sectionLabel, { color: accent ? colors.destructive : colors.mutedForeground }]}>
      {label}
    </Text>
  );
}

function CustomerRow({ icon, label, value, border, colors }: { icon: any; label: string; value: string; border?: boolean; colors: any }) {
  return (
    <View style={[styles.customerRow, border && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }]}>
      <Feather name={icon} size={15} color={colors.mutedForeground} />
      <Text style={[styles.customerLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.customerValue, { color: colors.foreground }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

function PaymentRow({ label, value, accent, strong, colors }: { label: string; value: string; accent?: boolean; strong?: boolean; colors: any }) {
  return (
    <View style={styles.paymentRow}>
      <Text style={[styles.paymentLabel, { color: strong ? colors.foreground : colors.mutedForeground, fontFamily: strong ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
        {label}
      </Text>
      <Text style={[styles.paymentValue, { color: accent ? colors.success : colors.foreground, fontFamily: strong ? 'Inter_700Bold' : 'Inter_500Medium', fontSize: strong ? 15 : 14 }]}>
        {value}
      </Text>
    </View>
  );
}

function InfoRow({ label, value, bold, colors, destructive, success }: { label: string; value: string; bold?: boolean; colors: any; destructive?: boolean; success?: boolean }) {
  const valueColor = destructive ? colors.destructive : success ? colors.success : colors.foreground;
  return (
    <View style={styles.paymentRow}>
      <Text style={[styles.paymentLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.paymentValue, { color: valueColor, fontFamily: bold ? 'Inter_700Bold' : 'Inter_500Medium' }]}>{value}</Text>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 20 },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 24 },
  circle: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.3 },

  // Booking ID row
  referenceCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 28 },
  smallLabel: { fontFamily: 'Inter_400Regular', fontSize: 12, marginBottom: 4 },
  reference: { fontFamily: 'Inter_700Bold', fontSize: 17, letterSpacing: 0.5 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20 },
  statusText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  // Section label
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 1.2, marginBottom: 10, marginTop: 24, textTransform: 'uppercase' },

  // Generic card
  card: { borderRadius: 16, borderWidth: 1, padding: 16, overflow: 'hidden' },

  // Vehicle card
  vehicleCard: { borderRadius: 16, borderWidth: 1, overflow: 'hidden' },
  hero: { height: 170, width: '100%' },
  heroOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 14, backgroundColor: 'rgba(0,0,0,0.35)' },
  heroVehicleName: { fontFamily: 'Inter_700Bold', fontSize: 18, color: '#FFFFFF', letterSpacing: -0.3 },
  vehicleBody: { paddingHorizontal: 16, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: 'Inter_500Medium', fontSize: 13 },

  // Timeline
  timelineRow: { flexDirection: 'row', gap: 14, marginBottom: 16 },
  timelineLeft: { alignItems: 'center', width: 16 },
  timelineDot: { width: 14, height: 14, borderRadius: 7, marginTop: 3 },
  timelineLine: { flex: 1, width: 2, marginVertical: 4 },
  timelineContent: { flex: 1, marginBottom: 4 },
  timelineLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 10, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 3 },
  timelineDate: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginBottom: 3 },
  timelineLoc: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 18 },

  // Map button
  mapBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, borderWidth: 1, paddingVertical: 11 },
  mapBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },

  // Customer
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  customerLabel: { fontFamily: 'Inter_400Regular', fontSize: 13, width: 90 },
  customerValue: { flex: 1, fontFamily: 'Inter_500Medium', fontSize: 13, textAlign: 'right' },

  // Payment
  paymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 11 },
  paymentLabel: { fontSize: 14, flex: 1, paddingRight: 12 },
  paymentValue: { fontSize: 14 },
  remainingBadge: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, padding: 12, marginTop: 4 },

  divider: { height: StyleSheet.hairlineWidth, marginBottom: 12, marginTop: 4, width: '100%' },

  // Alert box
  alertBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, width: '100%' },

  // Info
  infoBox: { flexDirection: 'row', gap: 10, borderRadius: 14, borderWidth: 1, padding: 14, marginTop: 24 },
  infoText: { fontFamily: 'Inter_400Regular', fontSize: 12, lineHeight: 18, flex: 1 },

  // Action bar
  actionBar: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 14 },
  actionBtn: { height: 48, borderRadius: 13, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 8 },
});