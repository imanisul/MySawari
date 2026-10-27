import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, RefreshControl } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { BottomNavigation, LoginBottomSheet } from '@/components';
import { BlurHost, BlurTarget } from '@/components/common/BottomBlur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { FadeIn } from 'react-native-reanimated';
import { API, BookingSnapshot } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { BookingSkeleton } from '@/components/loading/BookingSkeleton';
import { bookingsQueryOptions } from '@/hooks/useHomeData';
import { rise } from '@/components/common/motion';
import { LoadingImage } from '@/components/common/LoadingImage';
import { ExtendBookingSheet } from '@/components/booking/ExtendBookingSheet';
import { ReviewModal, ReviewTrip } from '@/components/booking/ReviewModal';
import { useDetailsPalette, DetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { FONT, shortDate, driverLabel } from '@/components/booking/TripDetailParts';

/**
 * Activity (design: "Activity" list). Underlined tabs, then one card per booking: photo, status tag, name,
 * "13 Oct, 10:00 AM → 14 Oct, 10:00 AM", "Self Drive • 3 days", Rate us / View Details, and an action row
 * (request an extension for upcoming and active trips, Book Again for finished ones).
 */

type BookingTab = 'All' | 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';
const TABS: BookingTab[] = ['All', 'Upcoming', 'Active', 'Completed', 'Cancelled'];
const byRecent = (a: BookingSnapshot, b: BookingSnapshot) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

export default function BookingsScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, selectCar } = useSawari();
  const [showLogin, setShowLogin] = useState(false);
  const [tab, setTab] = useState<BookingTab>('All');
  const [initialTabSet, setInitialTabSet] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [extendFor, setExtendFor] = useState<BookingSnapshot | null>(null);
  const [reviewTrip, setReviewTrip] = useState<ReviewTrip | null>(null);
  const { data: vehicles = [] } = useVehicles();

  // The same bookings query as Home (already loaded at app start), so this list opens instantly.
  const { data: bookings = [], isLoading: loading, isError: fetchError, refetch } = useQuery({
    ...bookingsQueryOptions,
    enabled: isAuthenticated === true,
    refetchInterval: 30 * 1000, // status changes (e.g. trip completed by the ops team) appear on their own
  });

  // Which trips are already reviewed, so "Rate us" only shows where it is still wanted.
  const { data: myReviews, refetch: refetchReviews } = useQuery({
    queryKey: ['myReviews'],
    queryFn: () => API.reviews.mine(),
    enabled: isAuthenticated === true,
    staleTime: 60 * 1000,
  });
  const reviewed = (b: BookingSnapshot) =>
    !!myReviews && (myReviews.bookingIds.includes(b.id) || myReviews.legacyCarIds.includes(String(b.vehicleId)));

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) refetch({ cancelRefetch: false });
    }, [isAuthenticated, refetch])
  );

  // Jump to Active when the ops team hands a vehicle over, and to Completed when a trip ends.
  const prevBookings = useRef<BookingSnapshot[]>([]);
  useEffect(() => {
    if (loading || !bookings) return;
    const ongoing = bookings.filter((b) => b.status === 'ONGOING').length;
    const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
    const prevOngoing = prevBookings.current.filter((b) => b.status === 'ONGOING').length;
    const prevCompleted = prevBookings.current.filter((b) => b.status === 'COMPLETED').length;
    if (!initialTabSet) setInitialTabSet(true);
    else if (ongoing > prevOngoing) setTab('Active');
    else if (completed > prevCompleted && ongoing === 0) setTab('Completed');
    prevBookings.current = bookings;
  }, [loading, bookings, initialTabSet]);

  // The Cancelled tab only appears when the customer actually has a cancelled trip.
  const hasCancelled = bookings.some((b) => b.status === 'CANCELLED' || b.status === 'FAILED');
  const tabs = hasCancelled ? TABS : TABS.filter((t) => t !== 'Cancelled');
  useEffect(() => { if (!hasCancelled && tab === 'Cancelled') setTab('All'); }, [hasCancelled, tab]);

  // Active only once the operations app has handed the vehicle over (status mapped to ONGOING).
  const filtered = bookings
    .filter((b) => {
      if (tab === 'All') return true;
      if (tab === 'Upcoming') return b.status === 'CONFIRMED' || b.status === 'PENDING';
      if (tab === 'Active') return b.status === 'ONGOING';
      if (tab === 'Completed') return b.status === 'COMPLETED';
      return b.status === 'CANCELLED' || b.status === 'FAILED';
    })
    .sort(byRecent);

  const bookAgain = (b: BookingSnapshot) => {
    Haptics.selectionAsync();
    const car = vehicles.find((v) => v.id === b.vehicleId);
    if (car) { selectCar(car); router.push('/car-details'); }
    else router.push('/explore');
  };

  // Still checking the saved session: the header and placeholders, never a flash of "Log in".
  if (isAuthenticated === null) {
    return (
      <View style={[styles.screen, { backgroundColor: p.page }]}>
        <Text style={[styles.title, { color: p.fg, paddingTop: insets.top + 4 }]}>My Trips</Text>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <BookingSkeleton index={0} />
          <BookingSkeleton index={1} />
        </View>
        <BottomNavigation />
      </View>
    );
  }

  // Signed out: same "Activity" page, with one clear way in. After logging in the trips load by themselves
  // (the bookings query switches on with isAuthenticated).
  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, { backgroundColor: p.page }]}>
        <Text style={[styles.title, { color: p.fg, paddingTop: insets.top + 4 }]}>My Trips</Text>
        <View style={styles.signedOut}>
          <View style={[styles.emptyCircle, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
            <Feather name="calendar" size={24} color={p.fg} />
          </View>
          <Text style={[styles.emptyTitle, { color: p.fg }]}>Log in to see your trips</Text>
          <Text style={[styles.emptyCopy, { color: p.sub }]}>
            See your upcoming, active and past bookings here, and extend, manage or rate a trip.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => { Haptics.selectionAsync(); setShowLogin(true); }}
            style={({ pressed }) => [styles.loginBtn, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}
          >
            <Text style={[styles.loginBtnText, { color: p.onNavy }]}>Log In</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => { Haptics.selectionAsync(); router.push('/explore'); }}
            style={({ pressed }) => [styles.exploreBtn, { borderColor: p.navy }, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.exploreBtnText, { color: p.navy }]}>Explore cars</Text>
          </Pressable>
        </View>
        <LoginBottomSheet visible={showLogin} showSkip={false} onClose={() => setShowLogin(false)} onLoginSuccess={() => setShowLogin(false)} />
        <BottomNavigation />
      </View>
    );
  }

  return (
    <BlurHost style={[styles.screen, { backgroundColor: p.page }]}>
     <BlurTarget style={{ flex: 1 }}>
      <Text style={[styles.title, { color: p.fg, paddingTop: insets.top + 4 }]}>My Trips</Text>

      {/* Underlined tabs */}
      <View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
          {tabs.map((item) => {
            const on = tab === item;
            return (
              <Pressable
                key={item}
                onPress={() => { Haptics.selectionAsync(); setTab(item); }}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                style={styles.tab}
              >
                <Text style={[styles.tabText, { color: on ? p.navy : p.muted, fontFamily: on ? FONT.semibold : FONT.regular }]}>{item}</Text>
                <View style={[styles.underline, { backgroundColor: on ? p.navy : 'transparent' }]} />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <Reanimated.View entering={FadeIn.duration(200)} style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          <BookingSkeleton index={0} />
          <BookingSkeleton index={1} />
          <BookingSkeleton index={2} />
        </Reanimated.View>
      ) : fetchError && bookings.length === 0 ? (
        <Empty p={p} icon="wifi-off" title="Couldn't load your trips" copy="Check your internet connection and try again." action="Retry" onAction={() => refetch()} />
      ) : filtered.length === 0 ? (
        <Empty
          p={p}
          icon="map"
          title={tab === 'All' ? 'No trips yet' : `No ${tab.toLowerCase()} trips`}
          copy={tab === 'All' ? 'Your bookings will appear here.' : `Your ${tab.toLowerCase()} rentals will appear here.`}
          action={tab === 'All' ? 'Explore vehicles' : undefined}
          onAction={() => router.push('/explore')}
        />
      ) : (
        <ScrollView
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 110 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={pulling} onRefresh={async () => { setPulling(true); try { await Promise.all([refetch(), refetchReviews()]); } finally { setPulling(false); } }} />
          }
        >
          {filtered.map((b) => (
            <Reanimated.View key={b.id} entering={rise()}>
              <TripCard
                p={p}
                booking={b}
                image={vehicles.find((v) => v.id === b.vehicleId)?.image}
                canRate={b.status === 'COMPLETED' && !reviewed(b)}
                onOpen={() => router.push(`/booking-detail?id=${b.id}` as any)}
                onRate={() => setReviewTrip({ bookingId: b.id, carId: String(b.vehicleId), vehicleName: b.vehicleName })}
                onExtend={() => setExtendFor(b)}
                onBookAgain={() => bookAgain(b)}
              />
            </Reanimated.View>
          ))}
        </ScrollView>
      )}
     </BlurTarget>

      <BottomNavigation />

      {/* Same sheets (and server calls) as Trip Details */}
      <ReviewModal trip={reviewTrip} onClose={() => { setReviewTrip(null); refetchReviews(); }} />
      {extendFor && (
        <ExtendBookingSheet
          visible
          booking={extendFor}
          onClose={() => setExtendFor(null)}
          onSuccess={() => { setExtendFor(null); refetch(); }}
        />
      )}
    </BlurHost>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

type Kind = 'upcoming' | 'pending' | 'active' | 'overdue' | 'completed' | 'cancelled';
const kindOf = (b: BookingSnapshot): Kind => {
  if (b.status === 'ONGOING') return b.rawEndDate && new Date() > new Date(b.rawEndDate) ? 'overdue' : 'active';
  if (b.status === 'COMPLETED') return 'completed';
  if (b.status === 'CANCELLED' || b.status === 'FAILED') return 'cancelled';
  return b.status === 'PENDING' ? 'pending' : 'upcoming';
};

/** "Trip ends in 2 days" / "tomorrow" / "today", from the booking's return date. */
function endsIn(b: BookingSnapshot) {
  if (!b.rawEndDate) return 'Trip in progress';
  const end = new Date(b.rawEndDate);
  const day = (d: Date) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const n = Math.round((Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()) - day(new Date())) / 86400000);
  if (n <= 0) return 'Trip ends today';
  if (n === 1) return 'Trip ends tomorrow';
  return `Trip ends in ${n} days`;
}

function TripCard({ p, booking: b, image, canRate, onOpen, onRate, onExtend, onBookAgain }: {
  p: DetailsPalette;
  booking: BookingSnapshot;
  image?: any;
  canRate: boolean;
  onOpen: () => void;
  onRate: () => void;
  onExtend: () => void;
  onBookAgain: () => void;
}) {
  const kind = kindOf(b);
  const days = b.rentalDays || 1;
  const pendingExt = b.extensions?.some((e: any) => e.status === 'pending');
  const rejectedExt = b.extensions?.some((e: any) => e.status === 'rejected');
  const canExtend = (kind === 'upcoming' || kind === 'active' || kind === 'overdue') && !pendingExt && !rejectedExt;

  const tag: Record<Kind, { label: string; bg: string; fg: string; border: string }> = {
    active: { label: 'Active', bg: p.green, fg: '#FFFFFF', border: p.green },
    overdue: { label: 'Overdue', bg: p.red, fg: '#FFFFFF', border: p.red },
    upcoming: { label: 'Upcoming', bg: p.navy, fg: p.onNavy, border: p.navy },
    pending: { label: 'Pending', bg: 'transparent', fg: p.amber, border: p.amber },
    completed: { label: 'Completed', bg: 'transparent', fg: p.navy, border: p.navy },
    cancelled: { label: 'Cancelled', bg: 'transparent', fg: p.muted, border: p.strongBorder },
  };
  const t = tag[kind];

  return (
    <View style={[styles.card, (kind === 'completed' || kind === 'cancelled') && styles.cardDone, { borderColor: p.segBorder, backgroundColor: p.page }]}>
      <Pressable onPress={onOpen} style={styles.top} accessibilityRole="button" accessibilityLabel={`${b.vehicleName}, ${t.label}. View details`}>
        <View style={[styles.photo, { backgroundColor: p.iconBg }]}>
          {image ? (
            <LoadingImage source={image} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
          ) : (
            <View style={styles.center}><Feather name="truck" size={26} color={p.muted} /></View>
          )}
        </View>
        <View style={styles.info}>
          <View style={[styles.tag, { backgroundColor: t.bg, borderColor: t.border }]}>
            <Text style={[styles.tagText, { color: t.fg }]}>{t.label}</Text>
          </View>
          <Text style={[styles.name, { color: p.fg }]} numberOfLines={1}>{b.vehicleName}</Text>
          <Text style={[styles.meta, { color: p.sub }]} numberOfLines={1}>
            {shortDate(b.pickupDate)}, {b.pickupTime || '10:00 AM'} → {shortDate(b.returnDate)}, {b.dropTime || '10:00 AM'}
          </Text>
          <Text style={[styles.meta, { color: p.sub }]} numberOfLines={1}>{driverLabel(b.driverMode)} • {days} day{days === 1 ? '' : 's'}</Text>
          <View style={styles.linksRow}>
            {canRate ? (
              <Pressable onPress={onRate} hitSlop={6} style={[styles.rateBtn, { borderColor: p.navy }]} accessibilityRole="button">
                <FontAwesome name="star-o" size={13} color={p.navy} />
                <Text style={[styles.rateText, { color: p.navy }]}>Rate us</Text>
              </Pressable>
            ) : <View />}
            <View style={styles.viewRow}>
              <Text style={[styles.viewText, { color: p.sub }]}>View Details</Text>
              <Feather name="chevron-right" size={13} color={p.sub} />
            </View>
          </View>
        </View>
      </Pressable>

      {/* Action row */}
      {(kind === 'completed' || kind === 'cancelled') ? (
        <Pressable onPress={onBookAgain} style={({ pressed }) => [styles.bookAgain, { backgroundColor: p.summary, borderColor: p.deliveryBorder, opacity: pressed ? 0.85 : 1 }]}>
          <Text style={[styles.bookAgainText, { color: p.navy }]}>Book Again</Text>
          <Feather name="chevron-right" size={16} color={p.navy} />
        </Pressable>
      ) : pendingExt ? (
        <View style={[styles.action, { backgroundColor: p.demandBg, borderColor: p.demandBorder }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionTitle, { color: p.amber }]}>Extension requested</Text>
            <Text style={[styles.actionSub, { color: p.sub }]}>Waiting for our team to approve it</Text>
          </View>
          <Feather name="clock" size={16} color={p.amber} />
        </View>
      ) : canExtend ? (
        <Pressable onPress={onExtend} style={({ pressed }) => [styles.action, { backgroundColor: p.summary, borderColor: p.deliveryBorder, opacity: pressed ? 0.85 : 1 }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.actionTitle, { color: kind === 'overdue' ? p.red : p.fg }]}>
              {kind === 'active' ? `${endsIn(b)}. Need more time?` : kind === 'overdue' ? 'Your return time has passed. Need more time?' : 'Need more time?'}
            </Text>
            <Text style={[styles.actionSub, { color: p.sub }]}>Request an extension for your trip</Text>
          </View>
          <Feather name="chevron-right" size={18} color={p.sub} />
        </Pressable>
      ) : null}
    </View>
  );
}

function Empty({ p, icon, title, copy, action, onAction }: { p: DetailsPalette; icon: any; title: string; copy: string; action?: string; onAction?: () => void }) {
  return (
    <View style={styles.empty}>
      <View style={[styles.emptyCircle, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
        <Feather name={icon} size={24} color={p.fg} />
      </View>
      <Text style={[styles.emptyTitle, { color: p.fg }]}>{title}</Text>
      <Text style={[styles.emptyCopy, { color: p.sub }]}>{copy}</Text>
      {!!action && (
        <Pressable onPress={onAction} style={[styles.emptyBtn, { backgroundColor: p.navy }]}>
          <Text style={{ color: p.onNavy, fontFamily: FONT.semibold }}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  title: { fontFamily: FONT.semibold, fontSize: 28, lineHeight: 36, paddingHorizontal: 16 },
  // Figma frame: 393×48 — 4 above, 8 below, a 36px strip of tabs between (text centred, underline on the bottom edge).
  tabs: { paddingHorizontal: 16, gap: 22, paddingTop: 4, paddingBottom: 8 },
  tab: { alignItems: 'center', justifyContent: 'flex-end', height: 36 },
  tabText: { fontSize: 14, lineHeight: 20, paddingHorizontal: 2 },
  underline: { height: 2, borderRadius: 1, alignSelf: 'stretch', marginTop: 6 },
  list: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  card: { borderWidth: 1, borderRadius: 12, padding: 8, gap: 6 },
  cardDone: { gap: 12 }, // Figma 361×177 card (ends in the 30px Book Again button)
  top: { flexDirection: 'row', gap: 12 },
  photo: { width: 120, height: 116, borderRadius: 6, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 0, gap: 3 },
  tag: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, height: 18, justifyContent: 'center', marginBottom: 2 },
  tagText: { fontFamily: FONT.medium, fontSize: 9 },
  name: { fontFamily: FONT.medium, fontSize: 15, lineHeight: 20 },
  meta: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 18 },
  linksRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  rateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, height: 24 },
  rateText: { fontFamily: FONT.medium, fontSize: 12 },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { fontFamily: FONT.medium, fontSize: 8, textDecorationLine: 'underline' },

  action: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 8 },
  actionTitle: { fontFamily: FONT.medium, fontSize: 12, lineHeight: 17 },
  actionSub: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 17 },
  bookAgain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 1, borderRadius: 8, height: 30 },
  bookAgainText: { fontFamily: FONT.medium, fontSize: 12 },

  signedOut: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24, marginTop: -60 },
  loginBtn: { alignSelf: 'stretch', height: 53, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  loginBtnText: { fontFamily: FONT.semibold, fontSize: 17, lineHeight: 24 },
  exploreBtn: { alignSelf: 'stretch', height: 46, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  exploreBtnText: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 22 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, marginTop: -60 },
  emptyCircle: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 64, justifyContent: 'center', width: 64 },
  emptyTitle: { fontFamily: FONT.semibold, fontSize: 18, marginTop: 20, textAlign: 'center' },
  emptyCopy: { fontFamily: FONT.regular, fontSize: 14, marginTop: 6, textAlign: 'center' },
  emptyBtn: { marginTop: 16, paddingHorizontal: 22, paddingVertical: 12, borderRadius: 12 },
});