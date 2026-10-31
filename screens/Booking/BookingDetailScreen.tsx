import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurTargetView } from 'expo-blur';
import Animated, { FadeIn } from 'react-native-reanimated';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTripColors } from '@/components/booking/tripColors';
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
import { BlurTargetProvider } from '@/components/common/BlurTargetContext';
import { BookingDetailSkeleton } from '@/components/loading/ScreenSkeletons';
import {
  ActionRow, BookingCard, FONT, HelpCard, PricingSummary, RefundTimeline, SectionTitle, TripTimeline, pickupMoment, refundStage, rupees, shortDate,
} from '@/components/booking/TripDetailParts';

const SUPPORT_EMAIL = 'support@mysawari.in';

// Design icons for "Before you go" (the same pictures as the benefit rows).
const TIP_IMAGES = [
  require('@/assets/images/benefit_save_more.png'),
  require('@/assets/images/benefit_exclusive_discounts.png'),
  require('@/assets/images/benefit_special_rewards.png'),
  require('@/assets/images/benefit_special_rewards.png'),
];

const BEFORE_YOU_GO = [
  { icon: 'credit-card', title: 'Keep your driving licence ready', body: 'Carry a valid licence accepted for your rental.' },
  { icon: 'file-text', title: 'Bring your required ID', body: 'Keep the identification documents requested for your booking.' },
  { icon: 'map-pin', title: 'Confirm your pickup location', body: 'Check the address and coordinate with the handover team if needed.' },
  { icon: 'clock', title: 'Arrive on time', body: "Contact the team if you're delayed or need to change your pickup time." },
] as const;

const HANDOVER_STEPS = [
  { title: 'Verify the vehicle', body: 'Check the car model, registration number, and visible condition.' },
  { title: 'Record existing damage', body: "Take photos or videos of any scratches or damage and ensure they're documented with the team." },
  { title: 'Check fuel and odometer', body: 'Verify and record the starting fuel level and kilometre reading with the team.' },
  { title: 'Confirm the handover', body: 'Review the rental terms, included kilometres, emergency instructions, and key handover before leaving.' },
];

export default function BookingDetailScreen() {
  const blurTarget = useRef<View | null>(null);
  const c = useTripColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { selectCar, isAuthenticated, lastBooking } = useSawari();
  const [showLogin, setShowLogin] = useState(false);
  const { id, fromConfirmation } = useLocalSearchParams<{ id?: string; fromConfirmation?: string }>();

  // From the shared bookings list (usually already loaded, so it opens instantly); refreshed on focus.
  const { data: allBookings, isLoading: listLoading, isFetching: listFetching, isError: listFailed, refetch: refetchBookings } = useQuery({
    ...bookingsQueryOptions,
    // A trip belongs to an account: nothing to fetch until the customer is signed in.
    enabled: !!id && isAuthenticated === true,
  });
  // A cancel / extend answer from the sheets shows straight away, before the list catches up.
  const [updated, setUpdated] = useState<BookingSnapshot | null>(null);
  useEffect(() => { setUpdated(null); }, [allBookings]);
  const snapshot: BookingSnapshot | null =
    updated && updated.id === id
      ? updated
      : (allBookings || []).find((b) => b.id === id || (b as any)?._id === id || b.bookingCode === id) ||
        (lastBooking && (lastBooking.id === id || (lastBooking as any)?._id === id || lastBooking.bookingCode === id) ? lastBooking : null);
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

  const handleBack = React.useCallback(() => {
    Haptics.selectionAsync();
    if (fromConfirmation === 'true') {
      router.replace('/bookings');
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/bookings');
    }
  }, [fromConfirmation, router]);

  React.useEffect(() => {
    if (fromConfirmation !== 'true') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack();
      return true;
    });
    return () => sub.remove();
  }, [fromConfirmation, handleBack]);

  const header = (
    <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
      <Pressable onPress={handleBack} style={styles.back} accessibilityLabel="Back" hitSlop={8}>
        <Feather name="chevron-left" size={24} color={c.mutedForeground} />
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
          <Pressable onPress={() => (listFailed ? refetchBookings() : handleBack())} style={[styles.smallCta, { backgroundColor: c.primary }]}>
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
          <Text style={[styles.hint, { color: c.foreground }]}>Need more time? Request an extension for your trip.</Text>
          <Cta label="Request Extension" onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowExtend(true); }} />
        </>
      );
    }
    return <Cta label="Book again" onPress={bookAgain} />;
  })();

  return (
    <BlurTargetProvider target={blurTarget}>
      <View style={[ styles.screen, { backgroundColor: c.background }]}>
        <BlurTargetView ref={blurTarget} style={styles.screen}>
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

          {ongoing && <HelpCard onWhatsApp={() => Linking.openURL(SUPPORT_WHATSAPP_URL).catch(() => {})} />}

          {ongoing && canExtend && (
            <View style={[styles.box, styles.extendCard, { backgroundColor: c.lightBlue, borderColor: '#E7EAF4' }]}>
              <View style={{ flex: 1, gap: 0 }}>
                <Text style={[styles.rowTitle, { color: c.foreground }]}>Need more time?</Text>
                <Text style={[styles.body, { color: c.mutedForeground }]}>Request an extension for your trip.</Text>
              </View>
              <Pressable onPress={() => setShowExtend(true)} style={[styles.pillBtn, { backgroundColor: c.navy }]}>
                <Text style={styles.pillBtnText}>Request Extension</Text>
              </Pressable>
            </View>
          )}

          {/* Cancelled only: where the cancellation and refund stand (never shown for other trips) */}
          {cancelled && (() => {
            const stage = refundStage(s);
            const finished = stage === 'refunded' || stage === 'rejected';
            return (
              <View style={{ gap: 12 }}>
                <View style={{ gap: 4 }}>
                <SectionTitle title="Cancellation Request" />
                <RefundTimeline booking={s} />
                {/* While the refund is on its way, the payout details (UPI / bank) can still be checked or changed. */}
                {(stage === 'received' || stage === 'approved') && (
                  <Pressable onPress={() => setShowRefundTrack(true)} hitSlop={6} style={styles.linkRow} accessibilityRole="button">
                    <Text style={[styles.link, { color: c.blue }]}>Refund of {rupees(s.refundAmount)} · payout details</Text>
                    <Feather name="chevron-right" size={13} color={c.blue} />
                  </Pressable>
                )}
                </View>
                {finished && (
                  <View style={[styles.box, { backgroundColor: c.lightBlue, borderColor: '#E7EAF4', gap: 2, borderRadius: 8 }]}>
                    <Text style={[styles.helpTitle, { color: c.foreground }]}>Need help with your refund?</Text>
                    <Text style={[styles.helpBody, { color: c.mutedForeground }]}>
                      If you haven’t received your refund, email{' '}
                      <Text selectable style={{ color: c.navy, textDecorationLine: 'underline' }} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Refund for booking ${code}`)}`).catch(() => {})}>{SUPPORT_EMAIL}.</Text>
                      {' '}We’ll verify and assist you.
                    </Text>
                  </View>
                )}
              </View>
            );
          })()}

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
                queryClient.invalidateQueries({ queryKey: ['carReviews'] });
              }}
            />
          )}

          {upcoming && (
            <ActionRow title="Need to change your plans or request refund?" subtitle="Modify your trip or manage your booking." onPress={() => setShowManage(true)} />
          )}
          {upcoming && <HelpCard onWhatsApp={() => Linking.openURL(SUPPORT_WHATSAPP_URL).catch(() => {})} />}

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
                {BEFORE_YOU_GO.map((item, i) => (
                  <View key={item.title} style={styles.tipRow}>
                    <View style={[styles.tipIcon, { backgroundColor: 'rgba(251, 188, 4, 0.1)' }]}>
                      <Image source={TIP_IMAGES[i]} style={{ width: i === 1 ? 20 : 24, height: i === 1 ? 20 : 24 }} resizeMode="contain" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tipTitle, { color: c.foreground }]}>{item.title}</Text>
                      <Text style={[styles.body, { color: c.mutedForeground }]} numberOfLines={1}>{item.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Pickup & handover (Figma: lavender card, purple ticks) */}
          {(upcoming || ongoing) && (
            <LinearGradient
              colors={['#D7D2FA', '#F0EFFD', '#F0EFFD']}
              locations={[0, 0.6782, 1]}
              start={{ x: 1.042, y: 0.075 }}
              end={{ x: -0.042, y: 0.925 }}
              style={[styles.why, { borderColor: '#D1CCF9' }]}
            >
              {/* Figma "Ellipse 4": the blurred #9C90F3 blob top-right, drawn as a radial wash (same as the car page). */}
              <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
                <Defs>
                  <RadialGradient id="tripGlow" cx="84%" cy="-4%" rx="42%" ry="48%" fx="84%" fy="-4%">
                    <Stop offset="0" stopColor="#9C90F3" stopOpacity="0.6" />
                    <Stop offset="1" stopColor="#9C90F3" stopOpacity="0" />
                  </RadialGradient>
                </Defs>
                <Rect x="0" y="0" width="100%" height="100%" fill="url(#tripGlow)" />
              </Svg>
              <Text style={[styles.whyTitle, { color: c.foreground }]}>Why rent from MySawari?</Text>
              <View style={{ gap: 10 }}>
                {HANDOVER_STEPS.map((w) => (
                  <View key={w.title} style={styles.whyRow}>
                    <View style={styles.whyTickBox}>
                      <View style={styles.whyTick}>
                        <Feather name="check" size={12} color="#FFFFFF" />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.whyItem, { color: c.foreground }]}>{w.title}</Text>
                      <Text style={[styles.whyBody, { color: c.mutedForeground }]}>{w.body}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </LinearGradient>
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
        <View style={[styles.bottomBar, { backgroundColor: c.background, borderTopColor: '#E7EAF4', paddingBottom: insets.bottom + 8 }]}>
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
        </BlurTargetView>
      </View>
    </BlurTargetProvider>
  );
}

// ── Pieces used only on this screen ──────────────────────────────────────────

function Banner({ tone, title, body }: { tone: 'info' | 'active' | 'pending' | 'danger'; title: string; body: string }) {
  const c = useTripColors();
  const quiet = tone === 'info' || tone === 'active';
  const bg = { info: c.lightBlue, active: c.lightBlue, pending: c.warning + '14', danger: c.destructive + '10' }[tone];
  const fg = { info: c.foreground, active: c.foreground, pending: c.warning, danger: c.destructive }[tone];
  // Figma: a confirmed upcoming trip gets one centred line (343×31, #F4F6FA, radius 6) instead of a text block.
  if (tone === 'info') {
    return (
      <View style={[styles.banner, styles.bannerLine, { backgroundColor: '#F4F6FA' }]}>
        <Text style={[styles.rowTitle, { color: fg }]} numberOfLines={1}>{title}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      <Text style={[styles.rowTitle, { color: fg }]}>{title}</Text>
      <Text style={[styles.body, { color: quiet ? c.mutedForeground : c.foreground }]}>{body}</Text>
    </View>
  );
}

function Cta({ label, onPress }: { label: string; onPress: () => void }) {
  const c = useTripColors();
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
  const c = useTripColors();
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
          <Text style={[styles.ctaText, { fontSize: 15, color: rating ? c.primaryForeground : c.disabledText }]}>Submit</Text>
        )}
      </Pressable>
      <Pressable onPress={onAddPhotos} hitSlop={6} style={{ alignSelf: 'center' }}>
        <Text style={[styles.link, { color: c.blue }]}>Add trip photos and the place you visited</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(0, 0, 0, 0.32)' },
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  back: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONT.semibold, fontSize: 19, lineHeight: 28 },
  content: { paddingHorizontal: 16, paddingTop: 4, gap: 16 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, gap: 8, marginTop: -60 },
  centerTitle: { fontFamily: FONT.semibold, fontSize: 17, marginTop: 8 },
  smallCta: { marginTop: 12, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },

  box: { borderWidth: 1, borderRadius: 16, padding: 13 },
  banner: { borderRadius: 8, borderWidth: 1, borderColor: '#E7EAF4', paddingHorizontal: 8, paddingVertical: 6 },
  bannerLine: { borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: FONT.semibold, fontSize: 11, lineHeight: 17 },
  helpTitle: { fontFamily: FONT.semibold, fontSize: 11, lineHeight: 17 },
  helpBody: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 17 },
  body: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 17 },
  link: { fontFamily: FONT.medium, fontSize: 13 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 8 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12 },
  noteText: { flex: 1, fontFamily: FONT.medium, fontSize: 13, lineHeight: 18 },

  extendCard: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 8 },
  pillBtn: { borderRadius: 6, paddingHorizontal: 10, height: 33, justifyContent: 'center' },
  pillBtnText: { fontFamily: FONT.semibold, fontSize: 11, lineHeight: 17, color: '#FFFFFF' },
  extRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  extStatus: { fontFamily: FONT.semibold, fontSize: 11, textTransform: 'uppercase' },

  tipRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  tipIcon: { width: 36, height: 36, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  tipTitle: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 20 },

  why: { borderRadius: 10, borderWidth: 1, paddingTop: 12, paddingRight: 16, paddingBottom: 12, paddingLeft: 12, gap: 12, overflow: 'hidden' },
  whyTitle: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 23 },
  whyRow: { flexDirection: 'row', gap: 8 },
  whyTickBox: { width: 24, paddingTop: 4 },
  whyTick: { width: 20, height: 20, borderRadius: 10, backgroundColor: '#6B5AED', alignItems: 'center', justifyContent: 'center' },
  whyItem: { fontFamily: FONT.semibold, fontSize: 11, lineHeight: 17 },
  whyBody: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 17 },

  rateTitle: { fontFamily: FONT.medium, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 4 },
  feedback: { borderWidth: 1, borderRadius: 8, minHeight: 40, paddingHorizontal: 12, paddingVertical: 10, fontFamily: FONT.regular, fontSize: 12, textAlignVertical: 'top' },
  rateCta: { height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rateDone: { flexDirection: 'row', alignItems: 'center', gap: 8 },

  bottomBar: { borderTopWidth: 1, paddingHorizontal: 16, paddingTop: 16, gap: 8, boxShadow: '0px -52px 21px rgba(47, 62, 117, 0.01), 0px -29px 17px rgba(47, 62, 117, 0.05)' },
  hint: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  cta: { height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 23 },
});