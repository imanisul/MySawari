import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Animated, ActivityIndicator, Modal, Image, ImageSourcePropType, RefreshControl, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { Page, Header, LoginBottomSheet } from '@/components';
import { MembershipSkeleton } from '@/components/loading/ScreenSkeletons';
import { useColors } from '@/hooks/useColors';
import { API, invalidateWalletCache } from '@/services/backend/api';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { RazorpayCheckoutWebView } from '@/components/payment/RazorpayCheckoutWebView';
import { useSawari } from '@/context/SawariContext';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { FaqList, FAQS } from '@/components/vehicle/details/CarDetailsSections';

// Membership page (Figma "Get Membership" → Starter / Plus / Pro Member).
// Plans: rate, per-trip cap and annual cap are the ones the server applies at booking
// (services/backend/pricingEngine.ts → MEMBERSHIP_PLANS): 5% / ₹499 / ₹10k, 10% / ₹799 / ₹15k, 12.5% / ₹999 / ₹20k.

type PlanKey = 'starter' | 'plus' | 'pro';

interface PlanDef {
  key: PlanKey;
  name: string;
  price: number;
  pctLabel: string;
  perTripCap: number;
  annualCap: number;
  icon: ImageSourcePropType;
  iconSize: number;
  /** Header art shown to a member of this plan, and the header colours around it (top → bottom). */
  art: ImageSourcePropType;
  headerTop: string;
  headerBottom: string;
  /** Light header (Plus, Pro): dark status bar and a grey back button. */
  lightHeader: boolean;
  /** "Starter Member" title and the savings bar. */
  accent: string;
  innerBorder: string;
}

const PLANS: PlanDef[] = [
  {
    key: 'starter', name: 'Starter', price: 999, pctLabel: '5%', perTripCap: 499, annualCap: 10000,
    icon: require('@/assets/images/plan_starter.png'), iconSize: 16,
    art: require('@/assets/images/membership_art_starter.png'), headerTop: '#6759DB', headerBottom: '#796CE3', lightHeader: false,
    accent: '#2F3E75', innerBorder: '#E0DDFB',
  },
  {
    key: 'plus', name: 'Plus', price: 1999, pctLabel: '10%', perTripCap: 799, annualCap: 15000,
    icon: require('@/assets/images/plan_plus.png'), iconSize: 17,
    art: require('@/assets/images/membership_art_plus.png'), headerTop: '#F1F1FD', headerBottom: '#F5F5FD', lightHeader: true,
    accent: '#6152D8', innerBorder: '#E0DDFB',
  },
  {
    key: 'pro', name: 'Pro', price: 2999, pctLabel: '12.5%', perTripCap: 999, annualCap: 20000,
    icon: require('@/assets/images/plan_pro.png'), iconSize: 16,
    art: require('@/assets/images/membership_art_pro.png'), headerTop: '#F2F8F6', headerBottom: '#F7FBF9', lightHeader: true,
    accent: '#64B403', innerBorder: '#B0DACB',
  },
];

const getPlanDef = (key?: string | null) => PLANS.find((p) => p.key === key);

type ActiveMembership = { plan: PlanKey; activatedAt: string; expiresAt: string; totalSaved: number };

/** The wallet's membership only when it is a known plan that hasn't expired; anything else means "not a member". */
function activeOnly(m: any): ActiveMembership | null {
  if (!m || !getPlanDef(m.plan)) return null;
  if (m.expiresAt && !(new Date(m.expiresAt).getTime() > Date.now())) return null;
  return { ...m, totalSaved: Math.max(0, Number(m.totalSaved) || 0) };
}
const tierIndex = (key?: string | null) => PLANS.findIndex((p) => p.key === key);

const PURPLE = '#6152D8';
const GREEN = '#008758';
// Header art files are 786 × 520 (393 × 260 at 2x); the white card inside them is placed by these fractions.
const ART_RATIO = 520 / 786;
const STARS_RATIO = 192 / 786;

const HOW_IT_WORKS = [
  { image: require('@/assets/images/benefit_save_more.png'), title: 'Save more', sub: 'Save up to ₹25,000 a year on rentals.' },
  { image: require('@/assets/images/benefit_exclusive_discounts.png'), title: 'Exclusive discounts', sub: 'Get up to 12.5% off car and bike rentals.' },
  { image: require('@/assets/images/benefit_special_rewards.png'), title: 'Special rewards', sub: 'Up to 15% off standard tariffs across all fleets.' },
];

// ── Component ────────────────────────────────────────────────────────────────
export default function MembershipScreen() {
  const colors = useColors();
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // ?plan=plus opens the page with that plan picked (Car details' plan picker).
  const params = useLocalSearchParams<{ plan?: string }>();

  const { membership: knownMembership, fetchWallet, isAuthenticated } = useSawari();
  const known = activeOnly(knownMembership);

  // A member's plan (already loaded at app start) shows instantly and is refreshed in the background.
  // Without one, the screen waits for the server: plans must never be offered to a member by mistake.
  const [membership, setMembership] = useState<ActiveMembership | null>(known);
  const [loading, setLoading] = useState(!known);
  const [refreshing, setRefreshing] = useState(false);
  // True while the membership is being (re)checked: buying is paused so a member is never charged twice.
  const [checking, setChecking] = useState(true);
  // Guests sign in first (the plan is bought on their account); the page then re-checks their membership.
  const [showLogin, setShowLogin] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);
  const [activating, setActivating] = useState<PlanKey | null>(null);
  const [selected, setSelected] = useState<PlanKey | null>(null);

  // Payment states
  const [razorpayOrder, setRazorpayOrder] = useState<{ orderId: string, amountPaise: number, keyId: string } | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<'IDLE' | 'PAYMENT_PENDING' | 'VERIFYING'>('IDLE');

  // Popups
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successPlanName, setSuccessPlanName] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const progressAnim = useRef(new Animated.Value(0)).current;

  const fetchMembership = useCallback(async () => {
    setLoadFailed(false);
    setChecking(true);
    const wallet: any = await API.getWallet(true).catch(() => ({ failed: true }));
    if (wallet?.failed) {
      // Keep a membership we already know about; otherwise say so instead of showing the plans.
      setLoadFailed(true);
    } else {
      setMembership(activeOnly(wallet?.membership));
    }
    setLoading(false);
    setChecking(false);
  }, []);

  // Fetch on open, and again once a guest signs in on this page.
  useEffect(() => {
    if (isAuthenticated === null) return; // still checking the session
    fetchMembership();
  }, [fetchMembership, isAuthenticated]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchMembership();
    setRefreshing(false);
  }, [fetchMembership]);

  const activePlan = membership ? getPlanDef(membership.plan) ?? null : null;
  // Plans on offer: everything for a non-member, only higher tiers for a member (none for Pro).
  const offered = PLANS.filter((pl) => !activePlan || tierIndex(pl.key) > tierIndex(activePlan.key));

  // Keep the picked plan one that is on offer: the ?plan= one if allowed, else Starter (non-member) or the next tier up.
  useEffect(() => {
    if (selected && offered.some((pl) => pl.key === selected)) return;
    const wanted = offered.find((pl) => pl.key === params.plan);
    setSelected(wanted?.key ?? offered[0]?.key ?? null);
  }, [offered.map((pl) => pl.key).join(','), params.plan]); // eslint-disable-line react-hooks/exhaustive-deps

  // Savings bar fills in when the membership loads.
  useEffect(() => {
    if (!membership || !activePlan) return;
    const pct = activePlan.annualCap > 0 ? Math.min(1, (membership.totalSaved || 0) / activePlan.annualCap) : 0;
    Animated.timing(progressAnim, { toValue: pct, duration: 900, useNativeDriver: false }).start();
  }, [membership, activePlan, progressAnim]);

  const handleActivate = async (plan: PlanKey) => {
    if (!isAuthenticated) { setShowLogin(true); return; }
    const def = getPlanDef(plan)!;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActivating(plan);
    try {
      // 1. Create the Razorpay order for the plan's price.
      const order = await API.createRazorpayOrder({ onlinePayableNow: def.price });
      setRazorpayOrder(order);
      setCheckoutStatus('PAYMENT_PENDING');
    } catch (e: any) {
      setErrorMsg(e.message || 'Could not initiate payment');
      setShowErrorModal(true);
      setActivating(null);
    }
  };

  const handleRazorpaySuccess = async (data: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
    setCheckoutStatus('VERIFYING');
    try {
      // 2. Verify payment
      const isVerified = await API.verifyPayment(data.razorpay_order_id, data.razorpay_payment_id, data.razorpay_signature);
      if (!isVerified) throw new Error('Payment signature mismatch');

      // 3. Activate membership on backend
      const result = await API.activateMembership(activating!, {
        razorpayOrderId: data.razorpay_order_id,
        razorpayPaymentId: data.razorpay_payment_id,
      });
      invalidateWalletCache();
      setMembership(activeOnly(result.membership));
      fetchWallet().catch(() => {}); // Home's membership card and SawariCash update too
      progressAnim.setValue(0);

      setCheckoutStatus('IDLE');
      setSuccessPlanName(getPlanDef(activating!)?.name || 'Membership');
      setActivating(null);
      setRazorpayOrder(null);
      setShowSuccessModal(true);
    } catch (e: any) {
      setErrorMsg(e.message || 'Payment verification failed');
      setShowErrorModal(true);
      setCheckoutStatus('IDLE');
      setActivating(null);
      setRazorpayOrder(null);
    }
  };

  const handleCancelPayment = () => {
    setErrorMsg('Payment was cancelled or failed.');
    setShowErrorModal(true);
    setCheckoutStatus('IDLE');
    setActivating(null);
    setRazorpayOrder(null);
  };

  if (loading) {
    return (
      <Page scroll={false}>
        <Header title="Membership" back={true} />
        <MembershipSkeleton />
      </Page>
    );
  }

  // Couldn't check the membership and none is known: retry rather than risk selling a second plan.
  if (loadFailed && !membership) {
    return (
      <Page scroll={false}>
        <Header title="Membership" back={true} />
        <View style={styles.center}>
          <Feather name="wifi-off" size={36} color={colors.mutedForeground} />
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>Couldn't load your membership</Text>
          <Text style={[styles.stateSub, { color: colors.mutedForeground }]}>Check your internet connection and try again.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => { setLoading(true); fetchMembership(); }}
            style={({ pressed }) => [styles.retry, { backgroundColor: p.navy }, pressed && { opacity: 0.8 }]}
          >
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      </Page>
    );
  }

  if (checkoutStatus === 'PAYMENT_PENDING' && razorpayOrder) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <RazorpayCheckoutWebView
          orderId={razorpayOrder.orderId}
          amount={razorpayOrder.amountPaise}
          currency="INR"
          name="MySawari Membership"
          description={`Activate ${getPlanDef(activating!)?.name} Plan`}
          themeColor={colors.primary}
          razorpayKey={razorpayOrder.keyId}
          onSuccess={handleRazorpaySuccess}
          onFailure={handleCancelPayment}
          onClose={handleCancelPayment}
        />
      </View>
    );
  }

  if (checkoutStatus === 'VERIFYING') {
    return (
      <Page scroll={false}>
        <Header title="Verifying Payment" back={false} />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 16 }} />
          <Text style={[styles.stateSub, { color: colors.foreground, marginTop: 0 }]}>Activating your membership...</Text>
        </View>
      </Page>
    );
  }

  const selectedPlan = getPlanDef(selected);
  const lightHeader = !!activePlan?.lightHeader;
  const headerTop = activePlan ? activePlan.headerTop : '#6556DA';
  const headerBottom = activePlan ? activePlan.headerBottom : '#7365E0';
  const ctaLabel = selectedPlan ? (activePlan ? `Upgrade to ${selectedPlan.name}` : `Get ${selectedPlan.name}`) : '';
  const showCta = !!selectedPlan;
  const ctaSpace = showCta ? 53 + 16 + Math.max(insets.bottom, 12) : insets.bottom + 24;

  return (
    <View style={[styles.screen, { backgroundColor: p.page }]}>
      <StatusBar style={lightHeader ? 'dark' : 'light'} />
      <ScrollView
        contentContainerStyle={{ paddingBottom: ctaSpace + 16 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={lightHeader ? '#737373' : '#FFFFFF'} progressViewOffset={insets.top} />}
      >
        {/* ── Header ── */}
        <LinearGradient colors={[headerTop, headerBottom]} style={{ paddingTop: insets.top + 9, paddingBottom: 24 + (activePlan ? 9 : 32) }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.back, lightHeader ? styles.backLight : styles.backDark, pressed && { opacity: 0.8 }]}
          >
            <Feather name="chevron-left" size={18} color={lightHeader ? '#525252' : '#FFFFFF'} />
          </Pressable>

          {activePlan && membership ? (
            <MemberCard plan={activePlan} totalSaved={membership.totalSaved || 0} width={width} progress={progressAnim} />
          ) : (
            <>
              <Image source={require('@/assets/images/membership_stars.png')} style={{ width, height: width * STARS_RATIO, marginTop: 23.5 }} resizeMode="cover" accessible={false} />
              <Text style={styles.heroTitle} accessibilityRole="header">Get Membership</Text>
              <Text style={styles.heroSub}>Unlock premium features</Text>
            </>
          )}
        </LinearGradient>

        {/* ── White sheet ── */}
        <View style={[styles.sheet, { backgroundColor: p.page }]}>
          {offered.length > 0 && (
            <View style={styles.plans} accessibilityRole="radiogroup">
              {offered.map((plan) => (
                <PlanRow key={plan.key} plan={plan} on={plan.key === selected} onPress={() => { Haptics.selectionAsync(); setSelected(plan.key); }} />
              ))}
            </View>
          )}

          <Text style={[styles.sectionTitle, { color: p.fg, marginTop: offered.length > 0 ? 18 : 0 }]} accessibilityRole="header">How it works</Text>
          <View style={{ gap: 12 }}>
            {HOW_IT_WORKS.map((it) => (
              <View key={it.title} style={styles.howRow} accessible accessibilityLabel={`${it.title}. ${it.sub}`}>
                <Image source={it.image} style={styles.howIcon} resizeMode="contain" />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.howTitle, { color: p.fg }]}>{it.title}</Text>
                  <Text style={[styles.howSub, { color: p.muted }]}>{it.sub}</Text>
                </View>
              </View>
            ))}
          </View>

          <Text style={[styles.sectionTitle, { color: p.fg, marginTop: 24 }]} accessibilityRole="header">FAQs</Text>
          <FaqList items={FAQS.slice(0, 4)} />
        </View>
      </ScrollView>

      {/* ── Sticky button: Get {plan} / Upgrade to {plan} (none for Pro members) ── */}
      {showCta && selectedPlan && (
        <View pointerEvents="box-none" style={styles.ctaWrap}>
          <LinearGradient pointerEvents="none" colors={[p.page + '00', p.page]} style={styles.ctaFade} />
          <View style={{ backgroundColor: p.page, paddingHorizontal: 16, paddingBottom: Math.max(insets.bottom, 12) }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${ctaLabel}, ${formatCurrency(selectedPlan.price)} a year`}
              disabled={!!activating || checking}
              onPress={() => handleActivate(selectedPlan.key)}
              style={({ pressed }) => [styles.cta, { backgroundColor: p.navy }, (pressed || !!activating || checking) && { opacity: 0.85 }]}
            >
              {activating || checking ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.ctaText}>{ctaLabel}</Text>}
            </Pressable>
          </View>
        </View>
      )}

      <LoginBottomSheet
        visible={showLogin}
        showSkip={false}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={() => setShowLogin(false)}
      />

      {/* ── Success ── */}
      <Modal visible={showSuccessModal} transparent animationType="fade" onRequestClose={() => setShowSuccessModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.popup, { backgroundColor: p.page }]}>
            <View style={[styles.popupIcon, { backgroundColor: p.greenBg }]}>
              <Feather name="check" size={28} color={GREEN} />
            </View>
            <Text style={[styles.popupTitle, { color: p.fg }]}>Welcome to {successPlanName}!</Text>
            <Text style={[styles.popupBody, { color: p.muted }]}>Your membership discount is applied automatically on every booking.</Text>
            <Pressable onPress={() => setShowSuccessModal(false)} style={({ pressed }) => [styles.popupBtn, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}>
              <Text style={styles.popupBtnText}>Awesome</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Error ── */}
      <Modal visible={showErrorModal} transparent animationType="fade" onRequestClose={() => setShowErrorModal(false)}>
        <View style={styles.overlay}>
          <View style={[styles.popup, { backgroundColor: p.page }]}>
            <View style={[styles.popupIcon, { backgroundColor: p.redBg }]}>
              <Feather name="alert-circle" size={28} color={p.red} />
            </View>
            <Text style={[styles.popupTitle, { color: p.fg }]}>Payment not completed</Text>
            <Text style={[styles.popupBody, { color: p.muted }]}>{errorMsg}</Text>
            <Pressable onPress={() => setShowErrorModal(false)} style={({ pressed }) => [styles.popupBtn, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}>
              <Text style={styles.popupBtnText}>Okay</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Member card (header art + white card with savings) ───────────────────────

function MemberCard({ plan, totalSaved, width, progress }: { plan: PlanDef; totalSaved: number; width: number; progress: Animated.Value }) {
  const usedPct = plan.annualCap > 0 ? Math.min(100, Math.round((totalSaved / plan.annualCap) * 100)) : 0;
  return (
    <View style={{ width, height: width * ART_RATIO, marginTop: 26.5 - 32 }}>
      <Image source={plan.art} style={StyleSheet.absoluteFill as any} resizeMode="cover" accessible={false} />
      <View
        style={[styles.inner, { borderColor: plan.innerBorder }]}
        accessible
        accessibilityLabel={`${plan.name} Member. ${usedPct}% saving used, ${formatCurrency(totalSaved)} of ${formatCurrency(plan.annualCap)}. ${plan.pctLabel} off every trip, up to ₹${plan.annualCap / 1000}k annual savings. Max ${formatCurrency(plan.perTripCap)} savings per trip.`}
      >
        <Text style={[styles.innerTitle, { color: plan.accent }]}>{plan.name} Member</Text>
        <View style={styles.usedRow}>
          <Text style={styles.usedText}>{usedPct}% saving used</Text>
          <Text style={styles.usedText}>{formatCurrency(totalSaved)}/{formatCurrency(plan.annualCap)}</Text>
        </View>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { backgroundColor: plan.accent, width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
        </View>
        <Dashes />
        <Text style={styles.innerFoot}>{plan.pctLabel} off every trip  •  Upto ₹{plan.annualCap / 1000}k annual savings</Text>
      </View>
      <View style={styles.capPillWrap} pointerEvents="none">
        <View style={styles.capPill}>
          <Text style={styles.capPillText}>Max {formatCurrency(plan.perTripCap)} savings per trip</Text>
        </View>
      </View>
    </View>
  );
}

/** Dashed divider (a dashed border on one side isn't reliable on iOS). */
function Dashes() {
  return (
    <View style={styles.dashes}>
      {Array.from({ length: 60 }, (_, i) => <View key={i} style={styles.dash} />)}
    </View>
  );
}

// ── Plan row ─────────────────────────────────────────────────────────────────

function PlanRow({ plan, on, onPress }: { plan: PlanDef; on: boolean; onPress: () => void }) {
  const p = useDetailsPalette();
  // Each plan keeps its own card colours (Starter white, Plus purple, Pro mint); the radio shows the pick.
  const look = plan.key === 'plus'
    ? { bg: PURPLE, border: PURPLE, text: '#FFFFFF', sub: 'rgba(255,255,255,0.85)', radioOn: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' }, dot: PURPLE, radioOff: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' } }
    : plan.key === 'pro'
      ? { bg: p.greenBg, border: p.proBorder, text: p.fg, sub: p.muted, radioOn: { backgroundColor: GREEN, borderColor: GREEN }, dot: '#FFFFFF', radioOff: { backgroundColor: '#FFFFFF', borderColor: p.radioRing } }
      : { bg: p.page, border: p.memberBorder, text: p.fg, sub: p.muted, radioOn: { backgroundColor: PURPLE, borderColor: PURPLE }, dot: '#FFFFFF', radioOff: { backgroundColor: '#FFFFFF', borderColor: p.radioRing } };
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: on }}
      accessibilityLabel={`${plan.name}, ${plan.pctLabel} off every trip, ${formatCurrency(plan.price)} a year`}
      onPress={onPress}
      style={({ pressed }) => [styles.plan, { backgroundColor: look.bg, borderColor: look.border }, pressed && { opacity: 0.9 }]}
    >
      <View style={[styles.radio, on ? look.radioOn : look.radioOff]}>
        {on && <View style={[styles.radioDot, { backgroundColor: look.dot }]} />}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={styles.planNameRow}>
          <Image source={plan.icon} style={{ width: plan.iconSize, height: plan.iconSize }} resizeMode="contain" />
          <Text style={[styles.planName, { color: look.text }]}>{plan.name}</Text>
          <View style={styles.offChip}>
            <Text style={styles.offChipText}>{plan.pctLabel} off every trip</Text>
          </View>
        </View>
        <Text style={[styles.planSub, { color: look.sub }]} numberOfLines={1}>
          Save up to {formatCurrency(plan.perTripCap)}/trip  •  Up to ₹{plan.annualCap / 1000}k saved yearly
        </Text>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <Text style={[styles.planPrice, { color: look.text }]} numberOfLines={1}>{formatCurrency(plan.price)}</Text>
        <Text style={[styles.planSub, { color: look.sub }]}>/year</Text>
      </View>
    </Pressable>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  stateTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, marginTop: 16, textAlign: 'center' },
  stateSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, marginTop: 6, textAlign: 'center' },
  retry: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  retryText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#FFFFFF' },

  // Header
  back: { marginLeft: 16, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  backDark: { backgroundColor: 'rgba(255,255,255,0.2)' },
  backLight: { backgroundColor: '#F5F5F5', borderWidth: 1, borderColor: '#E5E5E5' },
  heroTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 28, lineHeight: 40, color: '#FFFFFF', textAlign: 'center', marginTop: 6.5 },
  heroSub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.9)', textAlign: 'center', marginTop: 4 },

  // Member card: the white card sits on the art at these fractions of its 786 × 520 frame.
  inner: { position: 'absolute', left: '8.65%', right: '8.65%', top: '41.15%', height: '50.96%', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, paddingHorizontal: 12, paddingTop: 17 },
  innerTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 26, textAlign: 'center' },
  usedRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  usedText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, color: '#737373' },
  track: { height: 6, borderRadius: 3, backgroundColor: '#E5E5E5', overflow: 'hidden', marginTop: 4 },
  fill: { height: '100%', borderRadius: 3, minWidth: 6 },
  dashes: { flexDirection: 'row', overflow: 'hidden', gap: 3, marginTop: 12 },
  dash: { width: 4, height: 1, backgroundColor: '#E0DDFB' },
  innerFoot: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 16.5, color: '#737373', textAlign: 'center', marginTop: 14 },
  capPillWrap: { position: 'absolute', left: 0, right: 0, top: '37.4%', alignItems: 'center' },
  capPill: { height: 19.5, minWidth: 116, paddingHorizontal: 8, borderRadius: 10, backgroundColor: GREEN, alignItems: 'center', justifyContent: 'center' },
  capPillText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 8.5, color: '#FFFFFF' },

  // Sheet
  sheet: { marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 16.5 },
  plans: { gap: 12 },
  plan: { flexDirection: 'row', alignItems: 'center', gap: 9, borderWidth: 1, borderRadius: 10, paddingVertical: 11, paddingLeft: 9, paddingRight: 9.5, minHeight: 63.5 },
  radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 5, height: 5, borderRadius: 2.5 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  planName: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 20 },
  offChip: { height: 19.5, paddingHorizontal: 8, borderRadius: 10, backgroundColor: GREEN, justifyContent: 'center', marginLeft: 2 },
  offChipText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 8.5, color: '#FFFFFF' },
  planSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 16.5, marginTop: 4 },
  planPrice: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 22 },

  sectionTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22, marginBottom: 12 },
  howRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  howIcon: { width: 37, height: 37 },
  howTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 19.5 },
  howSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 16.5 },

  // Sticky button
  ctaWrap: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  ctaFade: { height: 28 },
  cta: { height: 53, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28, color: '#FFFFFF' },

  // Popups
  overlay: { flex: 1, backgroundColor: 'rgba(38,38,38,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18 },
  popup: { width: '100%', maxWidth: 357, borderRadius: 16, paddingHorizontal: 12, paddingTop: 22, paddingBottom: 12, alignItems: 'center' },
  popupIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  popupTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 26, textAlign: 'center', marginTop: 14 },
  popupBody: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, lineHeight: 20, textAlign: 'center', paddingHorizontal: 8, marginTop: 8 },
  popupBtn: { alignSelf: 'stretch', height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  popupBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: '#FFFFFF' },
});