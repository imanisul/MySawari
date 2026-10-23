import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { LoginBottomSheet } from '@/components';
import { API, BookingSnapshot } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { bookingsQueryOptions } from '@/hooks/useHomeData';
import { SUPPORT_PHONE, SUPPORT_WHATSAPP_URL } from '@/constants/support';
import { CancelBookingSheet } from '@/components/booking/CancelBookingSheet';
import { ManageBookingSheet } from '@/components/booking/ManageBookingSheet';
import { ExtendBookingSheet } from '@/components/booking/ExtendBookingSheet';
import { ReviewModal } from '@/components/booking/ReviewModal';
import { RefundTrackingModal } from '@/components/booking/RefundTrackingModal';
import { BookingDetailSkeleton } from '@/components/loading/ScreenSkeletons';
import {
  ActionRow, BookingCard, FONT, PricingSummary, RefundTimeline, SectionTitle, TripTimeline, pickupMoment, rupees, shortDate,
} from '@/components/booking/TripDetailParts';

const SUPPORT_EMAIL = 'support@mysawari.in';

const BEFORE_YOU_GO = [
  { icon: 'credit-card', title: 'Keep your driving licence ready', body: 'Carry a valid licence accepted for your rental.' },
  { icon: 'file-text', title: 'Bring your required ID', body: 'Keep the identification documents requested for your booking.' },
  { icon: 'map-pin', title: 'Confirm your pickup location', body: 'Check the address and coordinate with the handover team if needed.' },
  { icon: 'clock', title: 'Arrive on time', body: "Contact the team if you're delayed or need to change your pickup time." },
] as const;

const WHY_MYSAWARI = [
  { title: 'Verify the vehicle', body: 'Check the car model, registration number, and visible condition.' },
  { title: 'Record existing damage', body: "Take photos or videos of any scratches or damage and ensure they're documented with the team." },
  { title: 'Check fuel and odometer', body: 'Verify and record the starting fuel level and kilometre reading with the team.' },
  { title: 'Confirm the handover', body: 'Review the rental terms, included kilometres, emergency instructions, and key handover before leaving.' },
];

export default function BookingDetailScreen() {
  const c = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { selectCar, isAuthenticated } = useSawari();
  const [showLogin, setShowLogin] = useState(false);
  const { id } = useLocalSearchParams<{ id?: string }>();

  // From the shared bookings list (usually already loaded, so it opens instantly); refreshed on focus.
  const { data: allBookings, isLoading: listLoading, isFetching: listFetching, isError: listFailed, refetch: refetchBookings } = useQuery({
    ...bookingsQueryOptions,
    // A trip belongs to an account: nothing to fetch until the customer is signed in.
    enabled: !!id && isAuthenticated === true,
  });
  // A cancel / extend answer from the sheets shows straight away, before the list catches up.
  const [updated, setUpdated] = useState<BookingSnapshot | null>(null);
  useEffect(() => { setUpdated(null); }, [allBookings]);
  const snapshot: BookingSnapshot | null = updated && updated.id === id ? updated : (allBookings || []).find((b) => b.id === id) || null;
  const loading = (!!id && !snapshot && (listLoading || listFetching)) || isAuthenticated === null;
  const setSnapshot = (b: BookingSnapshot | null) => { setUpdated(b); refetchBookings(); };
  useFocusEffect(React.useCallback(() => { if (id && isAuthenticated) refetchBookings({ cancelRefetch: false }); }, [id, isAuthenticated, refetchBookings]));

  const [showManage, setShowManage] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showExtend, setShowExtend] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showRefundTrack, setShowRefundTrack] = useState(false);

  const { data: myReviews } = useQuery({ queryKey: ['myReviews'], queryFn: () => API.reviews.mine(), staleTime: 60 * 1000, enabled: isAuthenticated === true });
  const { data: vehicles = [] } = useVehicles();

  // "Pricing Summary >" scrolls down to the pricing card.
  const scrollRef = useRef<ScrollView>(null);
  const pricingY = useRef(0);
  const toPricing = () => scrollRef.current?.scrollTo({ y: Math.max(0, pricingY.current - 12), animated: true });

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
      <Pressable onPress={() => { Haptics.selectionAsync(); router.back(); }} style={styles.back} accessibilityLabel="Back" hitSlop={8}>
        <Feather name="chevron-left" size={24} color={c.foreground} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: c.foreground }]}>Trip Details</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        {header}
        <View style={{ paddingHorizontal: 16 }}><BookingDetailSkeleton /></View>
      </View>
    );
  }

  // Signed out (e.g. opened from a notification after logging out): ask to log in; the trip loads right after.
  if (isAuthenticated === false) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        {header}
        <View style={styles.center}>
          <Feather name="lock" size={36} color={c.mutedForeground} />
          <Text style={[styles.centerTitle, { color: c.foreground }]}>Log in to see this trip</Text>
          <Text style={[styles.body, { color: c.mutedForeground, textAlign: 'center' }]}>Your trip details, pickup steps and payments are kept in your account.</Text>
          <Pressable onPress={() => { Haptics.selectionAsync(); setShowLogin(true); }} style={[styles.smallCta, { backgroundColor: c.primary }]} accessibilityRole="button">
            <Text style={{ color: c.primaryForeground, fontFamily: FONT.semibold }}>Log In</Text>
          </Pressable>
        </View>
        <LoginBottomSheet visible={showLogin} showSkip={false} onClose={() => setShowLogin(false)} onLoginSuccess={() => setShowLogin(false)} />
      </View>
    );
  }

  if (!snapshot) {
    return (
      <View style={[styles.screen, { backgroundColor: c.background }]}>
        {header}
        <View style={styles.center}>
          <Feather name={listFailed ? 'wifi-off' : 'inbox'} size={40} color={c.mutedForeground} />
          <Text style={[styles.centerTitle, { color: c.foreground }]}>{listFailed ? "Couldn't load this trip" : 'Booking not found'}</Text>
          {listFailed && <Text style={[styles.body, { color: c.mutedForeground, textAlign: 'center' }]}>Check your internet connection and try again.</Text>}
          <Pressable onPress={() => (listFailed ? refetchBookings() : router.back())} style={[styles.smallCta, { backgroundColor: c.primary }]}>
            <Text style={{ color: c.primaryForeground, fontFamily: FONT.semibold }}>{listFailed ? 'Retry' : 'Go back'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const s = snapshot;
  const matchedCar = vehicles.find((v) => v.id === s.vehicleId);
  const upcoming = s.status === 'CONFIRMED' || s.status === 'PENDING';
  const ongoing = s.status === 'ONGOING';
  const completed = s.status === 'COMPLETED';
  const cancelled = s.status === 'CANCELLED' || s.status === 'FAILED';
  const overdue = ongoing && !!s.rawEndDate && new Date() > new Date(s.rawEndDate);
  const pendingExt = s.extensions?.some((e: any) => e.status === 'pending');
  const rejectedExt = s.extensions?.some((e: any) => e.status === 'rejected');
  const canExtend = (upcoming && s.status === 'CONFIRMED') || ongoing ? !pendingExt && !rejectedExt : false;
  const reviewed = !!myReviews && (myReviews.bookingIds.includes(s.id) || myReviews.legacyCarIds.includes(String(s.vehicleId)));
  const code = s.bookingCode || s.id.slice(-6).toUpperCase();

  const openSupport = () =>
    Linking.openURL(`${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent(`Hi, I need help with my booking ${code}.`)}`)
      .catch(() => Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {}));

  const bookAgain = () => {
    if (matchedCar) { selectCar(matchedCar); router.push('/car-details'); }
    else router.push('/explore');
  };

  // "Your trip starts in 2 days"
  const startsIn = (() => {
    const at = pickupMoment(s);
    if (!at) return 'Your trip is coming up';
    const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const n = Math.round((day(at) - day(new Date())) / 86400000);
    if (n <= 0) return 'Your trip starts today';
    if (n === 1) return 'Your trip starts tomorrow';
    return `Your trip starts in ${n} days`;
  })();

  const bottomBar = (() => {
    if (upcoming || ongoing) {
      if (pendingExt) {
        return (
          <View style={[styles.note, { backgroundColor: c.warning + '14' }]}>
            <Feather name="clock" size={16} color={c.warning} />
            <Text style={[styles.noteText, { color: c.warning }]}>Extension requested · waiting for our team to approve.</Text>
          </View>
        );
      }
      if (!canExtend) return null;
      return (
        <>
          <View style={styles.hintRow}>
            <Feather name="info" size={14} color={c.mutedForeground} />
            <Text style={[styles.hint, { color: c.mutedForeground }]}>Need more time? Request an extension for your trip.</Text>
          </View>
          <Cta label="Request Extension" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowExtend(true); }} />
        </>
      );
    }
    return <Cta label="Book again" onPress={bookAgain} />;
  })();

  return (
    <View style={[styles.screen, { backgroundColor: c.background }]}>
      {header}
      <Animated.View entering={FadeIn.duration(250)} style={{ flex: 1 }}>
        <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: bottomBar ? 24 : insets.bottom + 24 }]}>
          {/* Ongoing: the status line comes first */}
          {ongoing && (
            <Banner
              tone={overdue ? 'danger' : 'active'}
              title={overdue ? 'Your trip is overdue' : 'Your trip is underway'}
              body={overdue
                ? 'Please return your car as soon as possible. Additional charges apply under your rental policy.'
                : 'Return your car by the scheduled time to avoid additional charges under your rental policy.'}
            />
          )}

          <BookingCard booking={s} image={matchedCar?.image} />

          {upcoming && (
            <Banner
              tone={s.status === 'PENDING' ? 'pending' : 'info'}
              title={s.status === 'PENDING' ? 'Waiting for confirmation' : startsIn}
              body={s.status === 'PENDING'
                ? 'We’re confirming your booking. You’ll get a notification as soon as it’s done.'
                : 'Your car is booked. Review your pickup details and complete the steps below before you arrive.'}
            />
          )}

          {ongoing && <ActionRow title="Need help during your trip?" subtitle="Call or WhatsApp our team any time." icon="phone" onPress={openSupport} />}

          {ongoing && canExtend && (
            <View style={[styles.box, styles.extendCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={{ flex: 1, gap: 0 }}>
                <Text style={[styles.rowTitle, { color: c.foreground }]}>Need more time?</Text>
                <Text style={[styles.body, { color: c.mutedForeground }]}>Request an extension for your trip.</Text>
              </View>
              <Pressable onPress={() => setShowExtend(true)} style={[styles.pillBtn, { backgroundColor: c.navy }]}>
                <Text style={styles.pillBtnText}>Request Extension</Text>
              </Pressable>
            </View>
          )}

          {/* Cancelled: refund progress */}
          {cancelled && (
            <View style={{ gap: 12 }}>
              <SectionTitle title="Cancellation Request" />
              {(s.refundAmount || 0) > 0 ? (
                <Pressable onPress={() => setShowRefundTrack(true)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                  <RefundTimeline booking={s} />
                  <View style={styles.linkRow}>
                    <Text style={[styles.link, { color: c.blue }]}>Refund of {rupees(s.refundAmount)} · view payout details</Text>
                    <Feather name="chevron-right" size={13} color={c.blue} />
                  </View>
                </Pressable>
              ) : (
                <View style={[styles.note, { backgroundColor: c.destructive + '10' }]}>
                  <Feather name="info" size={16} color={c.destructive} />
                  <Text style={[styles.noteText, { color: c.destructive }]}>
                    {s.cancellationReason ? `Cancelled: ${s.cancellationReason}. ` : ''}No refund applies to this cancellation.
                  </Text>
                </View>
              )}
              {(s.refundAmount || 0) > 0 && (
                <View style={[styles.box, { backgroundColor: c.card, borderColor: c.border, gap: 4 }]}>
                  <Text style={[styles.rowTitle, { color: c.foreground }]}>Need help with your refund?</Text>
                  <Text style={[styles.body, { color: c.mutedForeground }]}>
                    If you haven’t received your refund, email <Text selectable style={{ color: c.blue, fontFamily: FONT.medium }} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Refund for booking ${code}`)}`).catch(() => {})}>{SUPPORT_EMAIL}</Text>. We’ll verify and assist you.
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Your trip */}
          <View>
            <SectionTitle title="Your trip" linkLabel="Pricing Summary" onLink={toPricing} />
            <TripTimeline booking={s} />
          </View>

          {/* Completed: rate the trip */}
          {completed && (
            <RateTrip
              reviewed={reviewed}
              onAddPhotos={() => setShowReview(true)}
              onSubmit={async (rating, text) => {
                await API.reviews.submit(String(s.vehicleId), rating, text, { bookingId: s.id });
                queryClient.invalidateQueries({ queryKey: ['myReviews'] });
                queryClient.invalidateQueries({ queryKey: ['pendingReviews'] });
              }}
            />
          )}

          {upcoming && (
            <ActionRow title="Need to change your plans or request refund?" subtitle="Modify your trip or manage your booking." onPress={() => setShowManage(true)} />
          )}
          {upcoming && <ActionRow title="Have a question about your booking?" subtitle="Call or WhatsApp our team." icon="phone" onPress={openSupport} />}

          {/* Extensions already asked for */}
          {!!s.extensions?.length && (
            <View>
              <SectionTitle title="Extensions" />
              <View style={[styles.box, { backgroundColor: c.card, borderColor: c.border, gap: 10 }]}>
                {s.extensions.map((e: any, i: number) => {
                  const st = e.status === 'pending' && (completed || cancelled) ? 'expired' : (e.status || 'pending');
                  const tone = st === 'approved' ? c.success : st === 'rejected' || st === 'expired' ? c.destructive : c.warning;
                  return (
                    <View key={e.id || i} style={styles.extRow}>
                      <Text style={[styles.body, { color: c.foreground, flex: 1 }]}>
                        +{e.daysToAdd || e.additionalDays} day{(e.daysToAdd || e.additionalDays) === 1 ? '' : 's'} · until {shortDate(e.newEndDate ? new Date(e.newEndDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '')} · {rupees(e.additionalAmount)}
                      </Text>
                      <Text style={[styles.extStatus, { color: tone }]}>{st}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          )}

          {/* Before you go */}
          {upcoming && (
            <View style={{ gap: 8 }}>
              <SectionTitle title="Before you go" />
              <View style={{ gap: 8 }}>
                {BEFORE_YOU_GO.map((item) => (
                  <View key={item.title} style={styles.tipRow}>
                    <View style={[styles.tipIcon, { backgroundColor: c.muted }]}>
                      <Feather name={item.icon as any} size={18} color={c.foreground} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tipTitle, { color: c.foreground }]}>{item.title}</Text>
                      <Text style={[styles.body, { color: c.mutedForeground }]}>{item.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Why rent from MySawari? */}
          {(upcoming || ongoing) && (
            <View style={[styles.why, { backgroundColor: c.navy }]}>
              <View style={[styles.whyGlow, { backgroundColor: c.lime }]} />
              <Text style={styles.whyTitle}>Why rent from MySawari?</Text>
              <View style={{ gap: 10 }}>
                {WHY_MYSAWARI.map((w) => (
                  <View key={w.title} style={styles.whyRow}>
                    <Feather name="check-circle" size={20} color={c.lime} style={{ marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.whyItem}>{w.title}</Text>
                      <Text style={styles.whyBody}>{w.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Pricing Summary */}
          <View onLayout={(e) => { pricingY.current = e.nativeEvent.layout.y; }}>
            <SectionTitle title="Pricing Summary" />
            <PricingSummary booking={s} />
          </View>

          {ongoing && <ActionRow title="Need to change your plans?" subtitle="Modify your trip or manage your booking." onPress={openSupport} />}
        </ScrollView>
      </Animated.View>

      {!!bottomBar && (
        <View style={[styles.bottomBar, { backgroundColor: c.background, borderTopColor: c.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
          {bottomBar}
        </View>
      )}

      {/* Sheets — the same components (and server calls) as before */}
      <ManageBookingSheet visible={showManage} onClose={() => setShowManage(false)} booking={s} onCancelBooking={() => { setShowManage(false); setTimeout(() => setShowCancel(true), 250); }} />
      <CancelBookingSheet visible={showCancel} onClose={() => setShowCancel(false)} booking={s} onSuccess={setSnapshot} />
      <ExtendBookingSheet visible={showExtend} onClose={() => setShowExtend(false)} booking={s} onSuccess={setSnapshot} />
      <RefundTrackingModal visible={showRefundTrack} onClose={() => setShowRefundTrack(false)} booking={s} onRefundUpdated={() => refetchBookings()} />
      <ReviewModal
        trip={showReview ? { bookingId: s.id, carId: String(s.vehicleId), vehicleName: s.vehicleName } : null}
        onClose={() => { setShowReview(false); queryClient.invalidateQueries({ queryKey: ['myReviews'] }); }}
      />
    </View>
  );
}

// ── Pieces used only on this screen ──────────────────────────────────────────

function Banner({ tone, title, body }: { tone: 'info' | 'active' | 'pending' | 'danger'; title: string; body: string }) {
  const c = useColors();
  const bg = { info: c.lightBlue, active: c.tintLight, pending: c.warning + '14', danger: c.destructive + '10' }[tone];
  const fg = { info: c.blue, active: c.primaryText, pending: c.warning, danger: c.destructive }[tone];
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Text style={[styles.rowTitle, { color: fg }]}>{title}</Text>
      <Text style={[styles.body, { color: c.foreground }]}>{body}</Text>
    </View>
  );
}

function Cta({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.cta, { backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}>
      <Text style={[styles.ctaText, { color: c.primaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

function RateTrip({ reviewed, onSubmit, onAddPhotos }: {
  reviewed: boolean;
  onSubmit: (rating: number, text: string) => Promise<void>;
  onAddPhotos: () => void;
}) {
  const c = useColors();
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (reviewed || sent) {
    return (
      <View style={[styles.box, styles.rateDone, { backgroundColor: c.success + '12', borderColor: c.success + '40' }]}>
        <Feather name="check-circle" size={18} color={c.success} />
        <Text style={[styles.rowTitle, { color: c.success }]}>Thanks for rating your trip!</Text>
      </View>
    );
  }
  return (
    <View style={[styles.box, { backgroundColor: c.card, borderColor: c.border, paddingTop: 17, gap: 12 }]}>
      <Text style={[styles.rateTitle, { color: c.foreground }]}>Rate the car and overall experience</Text>
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} hitSlop={4} accessibilityLabel={`${n} star${n === 1 ? '' : 's'}`}>
            <FontAwesome name={n <= rating ? 'star' : 'star-o'} size={24} color={n <= rating ? '#F5B301' : c.mutedForeground} />
          </Pressable>
        ))}
      </View>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Share your feedbacks"
        placeholderTextColor={c.mutedForeground}
        multiline
        style={[styles.feedback, { borderColor: c.border, color: c.foreground, backgroundColor: c.background }]}
      />
      {!!err && <Text style={[styles.body, { color: c.destructive }]}>{err}</Text>}
      <Pressable
        disabled={!rating || busy}
        onPress={async () => {
          setBusy(true); setErr(null);
          try { await onSubmit(rating, text); setSent(true); } catch (e: any) { setErr(e?.message || 'Could not send your review. Please try again.'); } finally { setBusy(false); }
        }}
        style={[styles.rateCta, { backgroundColor: rating ? c.primary : c.disabledBg }]}
      >
        {busy ? <ActivityIndicator color={c.primaryForeground} /> : (
          <Text style={[styles.ctaText, { fontSize: 15, color: rating ? c.primaryForeground : c.disabledText }]}>Submit review</Text>
        )}
      </Pressable>
      <Pressable onPress={onAddPhotos} hitSlop={6} style={{ alignSelf: 'center' }}>
        <Text style={[styles.link, { color: c.blue }]}>Add trip photos and the place you visited</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 16 },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONT.bold, fontSize: 22, lineHeight: 29 },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8, marginTop: -60 },
  centerTitle: { fontFamily: FONT.semibold, fontSize: 17, marginTop: 8 },
  smallCta: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },

  box: { borderWidth: 1, borderRadius: 16, padding: 13 },
  banner: { borderRadius: 14, paddingHorizontal: 9, paddingVertical: 7 },
  rowTitle: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 17 },
  body: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 17 },
  link: { fontFamily: FONT.medium, fontSize: 13 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 8 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
  noteText: { flex: 1, fontFamily: FONT.medium, fontSize: 13, lineHeight: 18 },

  extendCard: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pillBtn: { borderRadius: 10, paddingHorizontal: 10, height: 33, justifyContent: 'center' },
  pillBtnText: { fontFamily: FONT.semibold, fontSize: 13, color: '#FFFFFF' },
  extRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  extStatus: { fontFamily: FONT.semibold, fontSize: 11, textTransform: 'uppercase' },

  tipRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  tipIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 20 },

  why: { borderRadius: 16, padding: 13, gap: 12, overflow: 'hidden' },
  whyGlow: { position: 'absolute', width: 206, height: 205, borderRadius: 103, right: -150, top: -87, opacity: 0.18 },
  whyTitle: { fontFamily: FONT.semibold, fontSize: 18, lineHeight: 23, color: '#FFFFFF' },
  whyRow: { flexDirection: 'row', gap: 8 },
  whyItem: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 17, color: '#FFFFFF' },
  whyBody: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 17, color: '#C9D2E3' },

  rateTitle: { fontFamily: FONT.semibold, fontSize: 18, lineHeight: 23, textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  feedback: { borderWidth: 1, borderRadius: 12, minHeight: 46, paddingHorizontal: 13, paddingVertical: 13, fontFamily: FONT.regular, fontSize: 15, textAlignVertical: 'top' },
  rateCta: { height: 43, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rateDone: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  bottomBar: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  hintRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'center' },
  hint: { fontFamily: FONT.regular, fontSize: 14, lineHeight: 20 },
  cta: { height: 54, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: FONT.semibold, fontSize: 16 },
});