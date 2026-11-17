import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View, RefreshControl, Animated, Easing, PanResponder } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { safeBack } from '@/utils/navigation';
import { getIndiaDateParts } from '@/utils/sawari';
import * as Haptics from '@/utils/haptics';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { LoginBottomSheet } from '@/components';
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
import { FONT, shortDate, driverLabel, refundAmountOf, refundStage } from '@/components/booking/TripDetailParts';

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
  const { isAuthenticated, selectCar, setDates, setTimes, applyCoupon } = useSawari();
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
    // Shown at once from the saved list, but always re-read from the server on opening (it could be minutes old).
    refetchOnMount: 'always',
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

  // Slide the tab strip so the chosen tab (tapped, swiped, or switched to automatically) is always fully on screen.
  const tabsRef = useRef<ScrollView>(null);
  const tabBounds = useRef<Record<string, { x: number; w: number }>>({});
  const tabsViewW = useRef(0);
  const revealTab = (key: string) => {
    const b = tabBounds.current[key];
    if (!b || !tabsViewW.current) return;
    tabsRef.current?.scrollTo({ x: Math.max(0, b.x + b.w / 2 - tabsViewW.current / 2), animated: true });
  };
  // One rounded-top slider bar anchored flush at the bottom of the tabs row, sliding smoothly between All / Upcoming / Active / Completed.
  const barX = useRef(new Animated.Value(0)).current;
  const barW = useRef(new Animated.Value(0)).current;
  const barPlaced = useRef(false);
  const lastBarTarget = useRef<{ x: number; w: number } | null>(null);
  const moveBar = (key: string, animate: boolean) => {
    const b = tabBounds.current[key];
    if (!b) return;
    if (!animate || !barPlaced.current) {
      barX.stopAnimation();
      barW.stopAnimation();
      barX.setValue(b.x);
      barW.setValue(b.w);
      barPlaced.current = true;
      lastBarTarget.current = { x: b.x, w: b.w };
      return;
    }
    if (lastBarTarget.current?.x === b.x && lastBarTarget.current?.w === b.w) return;
    lastBarTarget.current = { x: b.x, w: b.w };
    Animated.parallel([
      Animated.timing(barX, { toValue: b.x, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
      Animated.timing(barW, { toValue: b.w, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: false }),
    ]).start();
  };
  useEffect(() => {
    if (!isAuthenticated) {
      barPlaced.current = false;
      lastBarTarget.current = null;
      tabBounds.current = {};
      return;
    }
    revealTab(tab);
    moveBar(tab, true);
  }, [tab, isAuthenticated, tabs.length]);

  // Allow swiping left/right across the trips area to slide between All / Upcoming / Active / Completed.
  const swipeStateRef = useRef({ tabs, tab });
  swipeStateRef.current = { tabs, tab };
  const tabSwipeResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        g.x0 > 24 && Math.abs(g.dx) > 30 && Math.abs(g.dx) > 2 * Math.abs(g.dy),
      onPanResponderRelease: (_, g) => {
        if (Math.abs(g.dx) < 45 || Math.abs(g.dx) < 1.5 * Math.abs(g.dy)) return;
        const { tabs: curTabs, tab: curTab } = swipeStateRef.current;
        const idx = curTabs.indexOf(curTab);
        if (idx < 0) return;
        const nextIdx = g.dx < 0 ? idx + 1 : idx - 1;
        if (nextIdx >= 0 && nextIdx < curTabs.length) {
          Haptics.selectionAsync();
          setTab(curTabs[nextIdx]);
        }
      },
    })
  ).current;

  const vehicleMap = useMemo(() => new Map(vehicles.map((v) => [v.id, v])), [vehicles]);

  // Active only once the operations app has handed the vehicle over (status mapped to ONGOING).
  const filtered = useMemo<BookingSnapshot[]>(() => {
    return bookings
      .filter((b) => {
        if (tab === 'All') return true;
        if (tab === 'Upcoming') return b.status === 'CONFIRMED' || b.status === 'PENDING';
        if (tab === 'Active') return b.status === 'ONGOING';
        if (tab === 'Completed') return b.status === 'COMPLETED';
        return b.status === 'CANCELLED' || b.status === 'FAILED';
      })
      .sort(byRecent);
  }, [bookings, tab]);

  const bookAgain = (b: BookingSnapshot) => {
    Haptics.selectionAsync();
    const car = vehicleMap.get(b.vehicleId);
    if (!car) { router.push('/explore'); return; }
    // Book Again: the car with fresh dates — straight to its calendar (the old trip's dates and deal code are dropped).
    selectCar(car);
    applyCoupon(null);
    setDates('Select Dates', '1 Day');
    setTimes('08:00 AM', '08:00 AM');
    router.push('/car-details');
    router.push({ pathname: '/dates', params: { forSpecificCar: 'true', returnBack: 'true' } });
  };

  // Still checking the saved session: the header and placeholders, never a flash of "Log in".
  if (isAuthenticated === null) {
    return (
      <View style={[styles.screen, { backgroundColor: p.page }]}>
        <View style={[styles.titleRow, { paddingTop: insets.top + 4 }]}>
          {/* iPhone only: Android has its own back button / gesture. */}
          {Platform.OS === 'ios' && (
            <Pressable onPress={() => { Haptics.selectionAsync(); safeBack(router); }} style={[styles.back, { backgroundColor: p.iconBg }]} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
              <Feather name="chevron-left" size={20} color={p.sub} />
            </Pressable>
          )}
          <Text style={[styles.title, { color: p.fg, paddingHorizontal: 0 }]}>My Trips</Text>
        </View>
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
          <BookingSkeleton index={0} />
          <BookingSkeleton index={1} />
        </View>
      </View>
    );
  }

  // Signed out: same "Activity" page, with one clear way in. After logging in the trips load by themselves
  // (the bookings query switches on with isAuthenticated).
  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, { backgroundColor: p.page }]}>
        <View style={[styles.titleRow, { paddingTop: insets.top + 4 }]}>
          {/* iPhone only: Android has its own back button / gesture. */}
          {Platform.OS === 'ios' && (
            <Pressable onPress={() => { Haptics.selectionAsync(); safeBack(router); }} style={[styles.back, { backgroundColor: p.iconBg }]} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
              <Feather name="chevron-left" size={20} color={p.sub} />
            </Pressable>
          )}
          <Text style={[styles.title, { color: p.fg, paddingHorizontal: 0 }]}>My Trips</Text>
        </View>
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
            style={({ pressed }) => [styles.loginBtn, { backgroundColor: p.button }, pressed && { opacity: 0.85 }]}
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
      </View>
    );
  }

  return (
    <BlurHost style={[styles.screen, { backgroundColor: p.page }]}>
     <BlurTarget style={{ flex: 1 }}>
      <View style={[styles.titleRow, { paddingTop: insets.top + 4 }]}>
          {/* iPhone only: Android has its own back button / gesture. */}
          {Platform.OS === 'ios' && (
            <Pressable onPress={() => { Haptics.selectionAsync(); safeBack(router); }} style={[styles.back, { backgroundColor: p.iconBg }]} accessibilityRole="button" accessibilityLabel="Back" hitSlop={8}>
              <Feather name="chevron-left" size={20} color={p.sub} />
            </Pressable>
          )}
          <Text style={[styles.title, { color: p.fg, paddingHorizontal: 0 }]}>My Trips</Text>
        </View>

      {/* Underlined tabs with sliding navy bar */}
      <View style={[styles.tabBarWrap, { borderBottomColor: p.divider }]}>
        <ScrollView
          ref={tabsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          onLayout={(e) => { tabsViewW.current = e.nativeEvent.layout.width; revealTab(tab); }}
        >
          <View style={styles.tabsTrack}>
            {tabs.map((item) => {
              const on = tab === item;
              return (
                <Pressable
                  key={item}
                  onLayout={(e) => {
                    tabBounds.current[item] = { x: e.nativeEvent.layout.x, w: e.nativeEvent.layout.width };
                    if (item === tab) moveBar(item, barPlaced.current);
                  }}
                  onPress={() => { Haptics.selectionAsync(); setTab(item); }}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: on }}
                  style={styles.tab}
                >
                  <Text style={[styles.tabText, { color: on ? p.navy : p.muted, fontFamily: on ? FONT.semibold : FONT.medium }]}>{item}</Text>
                </Pressable>
              );
            })}
            <Animated.View pointerEvents="none" style={[styles.underline, { backgroundColor: p.navy, left: barX, width: barW }]} />
          </View>
        </ScrollView>
      </View>

      <View style={{ flex: 1 }} {...tabSwipeResponder.panHandlers}>
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
                  image={vehicleMap.get(b.vehicleId)?.image}
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
      </View>
     </BlurTarget>

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
  const day = (d: Date) => { const p = getIndiaDateParts(d); return Date.UTC(p.year, p.month, p.date); }; // today in India
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
          <Text style={[styles.name, { color: p.fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{b.vehicleName}</Text>
          <Text style={[styles.meta, { color: p.sub }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {shortDate(b.pickupDate)}, {b.pickupTime || '10:00 AM'} → {shortDate(b.returnDate)}, {b.dropTime || '10:00 AM'}
          </Text>
          <Text style={[styles.meta, { color: p.sub }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{driverLabel(b.driverMode)} • {days} day{days === 1 ? '' : 's'}</Text>
          {kind === 'cancelled' && refundAmountOf(b) > 0 && (
            <Text style={[styles.meta, { color: refundStage(b) === 'refunded' ? '#008758' : p.sub, fontFamily: FONT.semibold }]} numberOfLines={1}>
              {refundStage(b) === 'refunded' ? 'Refunded' : refundStage(b) === 'rejected' ? 'Refund rejected' : 'Refund in progress'} · ₹{refundAmountOf(b).toLocaleString('en-IN')}
            </Text>
          )}
          <View style={styles.linksRow}>
            {canRate ? (
              <Pressable onPress={onRate} hitSlop={6} style={[styles.rateBtn, { borderColor: p.navy }]} accessibilityRole="button">
                <FontAwesome name="star-o" size={13} color={p.navy} />
                <Text style={[styles.rateText, { color: p.navy }]}>Rate us</Text>
              </Pressable>
            ) : <View />}
            <View style={styles.viewRow}>
              <Text style={[styles.viewText, { color: p.muted }]}>View Details</Text>
              <Feather name="chevron-right" size={13} color={p.muted} />
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
        <Pressable onPress={onAction} style={[styles.emptyBtn, { backgroundColor: p.button }]}>
          <Text style={{ color: p.onNavy, fontFamily: FONT.semibold }}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  title: { fontFamily: FONT.semibold, fontSize: 24, lineHeight: 36, paddingHorizontal: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16 },
  back: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  tabBarWrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  tabs: { flexGrow: 1 },
  // Figma 393×38: padding 8/16/10 -> 38px total height with clean separation above the 4px bottom-anchored slider.
  tabsTrack: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 2, position: 'relative' },
  tab: { alignItems: 'center', justifyContent: 'center', paddingTop: 8, paddingBottom: 10 },
  tabText: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 20, paddingHorizontal: 12 },
  // Matches the 69×4 navy indicator: rounded top corners, flat bottom edge flush with the tab strip bottom.
  underline: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    borderTopLeftRadius: 4,
    borderTopRightRadius: 4,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  list: { paddingHorizontal: 16, paddingTop: 16, gap: 12 },

  card: { borderWidth: 1, borderRadius: 12, padding: 8, gap: 6 },
  cardDone: { gap: 12 }, // Figma 361×177 card (ends in the 30px Book Again button)
  top: { flexDirection: 'row', gap: 12 },
  photo: { width: 120, height: 116, borderRadius: 6, overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, minWidth: 0, gap: 3 },
  tag: { alignSelf: 'flex-start', borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, height: 18, justifyContent: 'center', marginBottom: 2 },
  tagText: { fontFamily: FONT.semibold, fontSize: 8 },
  name: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 20 },
  meta: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 18 },
  linksRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  rateBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 999, paddingHorizontal: 8, height: 24 },
  rateText: { fontFamily: FONT.medium, fontSize: 12 },
  viewRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  viewText: { fontFamily: FONT.semibold, fontSize: 8, textDecorationLine: 'underline' },

  action: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingVertical: 8 },
  actionTitle: { fontFamily: FONT.medium, fontSize: 12, lineHeight: 17 },
  actionSub: { fontFamily: FONT.regular, fontSize: 12, lineHeight: 17 },
  bookAgain: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, borderWidth: 1, borderRadius: 8, height: 30 },
  bookAgainText: { fontFamily: FONT.semibold, fontSize: 11 },

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