import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { useSawari } from '@/context/SawariContext';
import { bookingsQueryOptions } from '@/hooks/useHomeData';
import { useVehicles } from '@/hooks/useVehicles';
import { formatCurrency } from '@/services/backend/pricingEngine';
import type { BookingSnapshot } from '@/services/backend/api';
import { LoadingImage } from '@/components/common/LoadingImage';
import { shortDate, tripTotal, driverLabel } from '@/components/booking/TripDetailParts';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { ScreenHeader, PF } from '@/components/profile/ProfileParts';

type Stage = 'refunded' | 'approved' | 'processing' | 'rejected' | 'not_eligible';

const amountOf = (b: BookingSnapshot) => Number(b.pendingRefund?.refundAmount ?? b.refundAmount ?? 0) || 0;

/** Where a cancelled trip's refund is, from the refund record the server keeps on the booking. */
function stageOf(b: BookingSnapshot): Stage {
  const raw = b.pendingRefund?.status || b.refundStatus;
  const st = String(raw || '').toLowerCase();
  if (st === 'rejected') return 'rejected';
  if (['refunded', 'completed', 'processed'].includes(st)) return 'refunded';
  if (st === 'approved') return 'approved';
  if (raw || amountOf(b) > 0) return 'processing';
  return 'not_eligible'; // cancelled inside 24 hours: the booking amount isn't refundable
}

/**
 * Figma "My Refund": every cancelled trip that was paid for, newest first — the car, its dates and price, and
 * where its refund is (refunded / processing / not eligible). Tapping one opens the trip with the full refund
 * timeline. Same bookings query as Activity, so it opens instantly.
 */
export default function RefundsScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const { isAuthenticated } = useSawari();
  const { data: vehicles = [] } = useVehicles();
  const { data: bookings = [], isLoading, isError, refetch, isRefetching } = useQuery({ ...bookingsQueryOptions, enabled: isAuthenticated === true });

  const list = bookings
    .filter((b) => b.status === 'CANCELLED' && ((b.onlinePayableNow || 0) > 0 || amountOf(b) > 0 || !!b.pendingRefund || !!b.refundStatus))
    .sort((a, b) => new Date(b.cancelledAt || b.createdAt || 0).getTime() - new Date(a.cancelledAt || a.createdAt || 0).getTime());

  const bar = (b: BookingSnapshot) => {
    const st = stageOf(b);
    if (st === 'refunded') return { bg: p.greenBg, fg: p.green, icon: 'check-circle' as const, text: `${formatCurrency(amountOf(b))} refunded successfully` };
    if (st === 'approved') return { bg: p.summary, fg: p.navy, icon: 'check' as const, text: 'Refund approved · Payment queued' };
    if (st === 'processing') return { bg: p.summary, fg: p.navy, icon: 'clock' as const, text: 'Refund processing…' };
    if (st === 'rejected') return { bg: p.redBg, fg: p.red, icon: 'x-circle' as const, text: 'Refund rejected' };
    return { bg: p.redBg, fg: p.red, icon: 'x-circle' as const, text: 'Not eligible for refund' };
  };

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
      <ScreenHeader title="My Refund" />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={p.muted} />
      ) : (
        <FlatList
          data={list}
          keyExtractor={(b) => b.id}
          contentContainerStyle={[styles.content, list.length === 0 && { flexGrow: 1 }]}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          ListHeaderComponent={
            <Pressable
              accessibilityRole="link"
              onPress={() => router.push({ pathname: '/policies', params: { policy: 'cancellation' } })}
              style={({ pressed }) => [styles.banner, { backgroundColor: p.segOn, borderColor: p.border }, pressed && { opacity: 0.85 }]}
            >
              <Text style={[styles.bannerText, { color: p.fg }]}>Refunds go back to your original payment method.</Text>
              <Feather name="arrow-right" size={13} color={p.fg} />
            </Pressable>
          }
          renderItem={({ item: b }) => {
            const t = bar(b);
            const days = b.rentalDays || 1;
            const image = vehicles.find((v) => v.id === b.vehicleId)?.image;
            const reason = stageOf(b) === 'rejected' ? b.pendingRefund?.rejectionReason : undefined;
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${b.vehicleName}. ${t.text}. View trip`}
                onPress={() => { Haptics.selectionAsync(); router.push(`/booking-detail?id=${b.id}` as any); }}
                style={({ pressed }) => [styles.card, { borderColor: p.border }, pressed && { opacity: 0.92 }]}
              >
                <View style={styles.top}>
                  <View style={[styles.photo, { backgroundColor: p.iconBg }]}>
                    {image ? <LoadingImage source={image} style={StyleSheet.absoluteFill} contentFit="cover" /> : <Feather name="truck" size={24} color={p.muted} />}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={[styles.tag, { borderColor: p.border }]}>
                      <Text style={[styles.tagText, { color: p.muted }]}>Cancelled</Text>
                    </View>
                    <Text style={[styles.name, { color: p.fg }]} numberOfLines={1}>{b.vehicleName}</Text>
                    <Text style={[styles.meta, { color: p.muted }]} numberOfLines={1}>
                      {shortDate(b.pickupDate)}, {b.pickupTime || '10:00 AM'} → {shortDate(b.returnDate)}, {b.dropTime || '10:00 AM'}
                    </Text>
                    <Text style={[styles.meta, { color: p.muted }]} numberOfLines={1}>{driverLabel(b.driverMode)} • {days} day{days === 1 ? '' : 's'}</Text>
                    <Text style={[styles.price, { color: p.fg }]}>{formatCurrency(tripTotal(b))}</Text>
                  </View>
                </View>
                <View style={[styles.status, { backgroundColor: t.bg }]}>
                  <Feather name={t.icon} size={14} color={t.fg} />
                  <Text style={[styles.statusText, { color: t.fg }]}>{t.text}</Text>
                </View>
                {!!reason && <Text style={[styles.reason, { color: p.red }]}>{reason}</Text>}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name={isError ? 'wifi-off' : 'rotate-ccw'} size={22} color={p.fg} />
              <Text style={[styles.emptyTitle, { color: p.fg }]}>{isError ? "Couldn't load your refunds" : 'No refunds'}</Text>
              <Text style={[styles.emptySub, { color: p.muted }]}>
                {isError ? 'Pull down to try again.' : 'When you cancel a paid trip, its refund and status show up here.'}
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },
  banner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1, borderRadius: 8, height: 36, marginBottom: 12, paddingHorizontal: 10 },
  bannerText: { fontFamily: PF.semibold, fontSize: 11 },
  card: { borderWidth: 1, borderRadius: 10, padding: 8 },
  top: { flexDirection: 'row', gap: 12 },
  photo: { width: 118, height: 88, borderRadius: 6, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  tag: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 10, paddingHorizontal: 7, height: 18, justifyContent: 'center' },
  tagText: { fontFamily: PF.semibold, fontSize: 8},
  name: { fontFamily: PF.semibold, fontSize: 13, marginTop: 4 },
  meta: { fontFamily: PF.medium, fontSize: 11, lineHeight: 16, marginTop: 1 },
  price: { fontFamily: PF.bold, fontSize: 13, marginTop: 4 },
  status: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, height: 34, borderRadius: 6, marginTop: 8 },
  statusText: { fontFamily: PF.semibold, fontSize: 13},
  reason: { fontFamily: PF.regular, fontSize: 11.5, lineHeight: 16, marginTop: 6, paddingHorizontal: 2 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 },
  emptyTitle: { fontFamily: PF.medium, fontSize: 17, marginTop: 10 },
  emptySub: { fontFamily: PF.regular, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 },
});