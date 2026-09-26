import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Animated,
  ActivityIndicator, Dimensions, Modal
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import Reanimated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { Page, Header } from '@/components';
import { useColors } from '@/hooks/useColors';
import { API, invalidateWalletCache } from '@/services/backend/api';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { RazorpayCheckoutWebView } from '@/components/payment/RazorpayCheckoutWebView';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Plan definitions ────────────────────────────────────────────────────────
type PlanKey = 'starter' | 'plus' | 'pro';

interface PlanDef {
  key: PlanKey;
  name: string;
  icon: string;
  price: number;
  discountPct: string;
  perTripCap: number;
  annualCap: number;
  gradient: [string, string];
  badge: string;
}

const PLANS: PlanDef[] = [
  {
    key: 'starter', name: 'Starter', icon: '🥈', price: 999,
    discountPct: '5%', perTripCap: 999, annualCap: 10000,
    gradient: ['#6366F1', '#818CF8'], badge: 'STARTER',
  },
  {
    key: 'plus', name: 'Plus', icon: '🥇', price: 1999,
    discountPct: '10%', perTripCap: 999, annualCap: 15000,
    gradient: ['#F59E0B', '#FBBF24'], badge: 'PLUS',
  },
  {
    key: 'pro', name: 'Pro', icon: '💎', price: 2999,
    discountPct: '12.5%', perTripCap: 999, annualCap: 20000,
    gradient: ['#10B981', '#34D399'], badge: 'PRO',
  },
];

function getPlanDef(key: string): PlanDef | undefined {
  return PLANS.find(p => p.key === key);
}

// ── Component ────────────────────────────────────────────────────────────────
export default function MembershipScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [membership, setMembership] = useState<{
    plan: PlanKey;
    activatedAt: string;
    expiresAt: string;
    totalSaved: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<PlanKey | null>(null);
  
  // Payment states
  const [razorpayOrder, setRazorpayOrder] = useState<{ orderId: string, amountPaise: number, keyId: string } | null>(null);
  const [checkoutStatus, setCheckoutStatus] = useState<'IDLE' | 'PAYMENT_PENDING' | 'VERIFYING'>('IDLE');

  // Custom Popups
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successPlanName, setSuccessPlanName] = useState('');
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Animated progress bar
  const progressAnim = useRef(new Animated.Value(0)).current;

  const scrollViewRef = useRef<ScrollView>(null);

  const fetchMembership = useCallback(async () => {
    try {
      const wallet = await API.getWallet(true);
      setMembership(wallet?.membership || null);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMembership();
  }, [fetchMembership]);

  // Animate progress bar when membership data loads
  useEffect(() => {
    if (membership) {
      const plan = getPlanDef(membership.plan);
      if (plan) {
        const pct = plan.annualCap > 0 ? Math.min(1, membership.totalSaved / plan.annualCap) : 0;
        Animated.timing(progressAnim, {
          toValue: pct,
          duration: 1200,
          useNativeDriver: false,
        }).start();
      }
    }
  }, [membership]);

  const handleActivate = async (plan: PlanKey) => {
    const def = getPlanDef(plan)!;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setActivating(plan);
    try {
      // 1. Create Razorpay order directly without an alert
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
        razorpayPaymentId: data.razorpay_payment_id
      });
      invalidateWalletCache();
      setMembership(result.membership);
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

  const activePlan = membership ? getPlanDef(membership.plan) : null;
  const daysLeft = membership?.expiresAt
    ? Math.max(0, Math.ceil((new Date(membership.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  if (loading) {
    return (
      <Page>
        <Header title="Membership" back={true} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
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
          onFailure={() => {
            handleCancelPayment();
          }}
          onClose={handleCancelPayment}
        />
      </View>
    );
  }

  if (checkoutStatus === 'VERIFYING') {
    return (
      <Page>
        <Header title="Verifying Payment" back={false} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} style={{ marginBottom: 16 }} />
          <Text style={{ fontFamily: 'Inter_500Medium', color: colors.foreground }}>Activating your membership...</Text>
        </View>
      </Page>
    );
  }

  return (
    <Page>
      <Header title="Membership" back={true} />
      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════════════════════════════════════════════════════════
            ACTIVE PLAN HERO CARD
           ═══════════════════════════════════════════════════════════════════ */}
        {activePlan && membership && (
          <Reanimated.View entering={FadeInDown.springify().damping(18)}>
            <LinearGradient
              colors={activePlan.gradient as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              <View style={styles.heroBadgeRow}>
                <Text style={styles.heroIcon}>{activePlan.icon}</Text>
                <View style={styles.heroBadgePill}>
                  <Text style={styles.heroBadgeText}>{activePlan.badge} MEMBER</Text>
                </View>
              </View>

              <Text style={styles.heroTitle}>MySawari {activePlan.name}</Text>
              <Text style={styles.heroSub}>
                {activePlan.discountPct} off every trip  •  {daysLeft} days remaining
              </Text>

              <View style={styles.heroDivider} />

              {/* Savings progress */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabels}>
                  <Text style={styles.progressLabelLight}>Savings Used</Text>
                  <Text style={styles.progressLabelLight}>
                    {formatCurrency(membership.totalSaved)} / {formatCurrency(activePlan.annualCap)}
                  </Text>
                </View>

                <View style={styles.progressTrack}>
                  <View style={{ ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 6 }} />
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                      },
                    ]}
                  />
                  {/* Milestone markers */}
                  {[0.25, 0.5, 0.75].map(pct => {
                    const isActive = activePlan && activePlan.annualCap > 0 ? (membership.totalSaved / activePlan.annualCap >= pct) : false;
                    return (
                      <View
                        key={pct}
                        style={[styles.milestone, { left: `${pct * 100}%` }]}
                      >
                        <View style={[
                          styles.milestoneDot,
                          isActive && styles.milestoneDotActive,
                        ]} />
                      </View>
                    );
                  })}
                </View>

              </View>

              <View style={styles.heroStatsRow}>
                <View style={styles.heroStat}>
                  <Feather name="percent" size={16} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.heroStatValue}>{activePlan.discountPct}</Text>
                  <Text style={styles.heroStatLabel}>Per Trip</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Feather name="shield" size={16} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.heroStatValue}>{formatCurrency(activePlan.perTripCap)}</Text>
                  <Text style={styles.heroStatLabel}>Max/Trip</Text>
                </View>
                <View style={styles.heroStatDivider} />
                <View style={styles.heroStat}>
                  <Feather name="trending-up" size={16} color="rgba(255,255,255,0.9)" />
                  <Text style={styles.heroStatValue}>{formatCurrency(activePlan.annualCap)}</Text>
                  <Text style={styles.heroStatLabel}>Annual Cap</Text>
                </View>
              </View>

              {activePlan.key !== 'pro' && (
                <Pressable
                  style={({ pressed }) => [
                    {
                      marginTop: 12,
                      backgroundColor: 'rgba(255,255,255,0.2)',
                      paddingVertical: 10,
                      borderRadius: 12,
                      alignItems: 'center',
                      flexDirection: 'row',
                      justifyContent: 'center',
                      gap: 8,
                      borderWidth: 1,
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    pressed && { opacity: 0.8, backgroundColor: 'rgba(255,255,255,0.3)' }
                  ]}
                  onPress={() => {
                    setShowUpgradeModal(true);
                  }}
                >
                  <Feather name="arrow-up-circle" size={18} color="#fff" />
                  <Text style={{ color: '#fff', fontFamily: 'Inter_600SemiBold', fontSize: 15 }}>Upgrade Your Plan</Text>
                </Pressable>
              )}
            </LinearGradient>
          </Reanimated.View>
        )}

        {/* ═══════════════════════════════════════════════════════════════════
            PLAN CARDS
           ═══════════════════════════════════════════════════════════════════ */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              {activePlan ? 'Upgrade Your Plan' : 'Choose Your Plan'}
            </Text>
            <Text style={[styles.sectionSub, { color: colors.mutedForeground, marginBottom: 0 }]}>
              Save on every trip with an annual membership
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingBottom: 4 }}>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.mutedForeground }}>Slide</Text>
            <Feather name="arrow-right" size={12} color={colors.mutedForeground} />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={SCREEN_WIDTH * 0.70 + 12}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={{ paddingRight: 20, paddingBottom: 16 }}
        >
          {PLANS.filter(plan => plan.key !== activePlan?.key).map((plan, idx) => {
            const isUpgrade = activePlan && PLANS.indexOf(activePlan) < PLANS.indexOf(plan);
            const isDowngrade = activePlan && PLANS.indexOf(activePlan) > PLANS.indexOf(plan);

            return (
              <Reanimated.View
                key={plan.key}
                entering={FadeInDown.delay(idx * 100).springify().damping(18)}
                style={{ width: SCREEN_WIDTH * 0.70, marginRight: 12 }}
              >
                <View style={[
                  styles.planCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    borderWidth: 1,
                  },
                ]}>

                  <View style={styles.planHeader}>
                    <Text style={{ fontSize: 28 }}>{plan.icon}</Text>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[styles.planName, { color: colors.foreground }]}>{plan.name}</Text>
                      <Text style={[styles.planPrice, { color: plan.gradient[0] }]}>
                        {formatCurrency(plan.price)}
                        <Text style={{ fontSize: 13, color: colors.mutedForeground }}>/year</Text>
                      </Text>
                    </View>
                  </View>

                  <View style={styles.planBenefits}>
                    {[
                      `${plan.discountPct} discount on every trip`,
                      `Max ${formatCurrency(plan.perTripCap)} savings per trip`,
                      `Up to ${formatCurrency(plan.annualCap)} annual savings`,
                      `Valid for 1 year from activation`,
                    ].map((benefit, i) => (
                      <View key={i} style={styles.benefitRow}>
                        <Feather name="check-circle" size={14} color={plan.gradient[0]} />
                        <Text style={[styles.benefitText, { color: colors.foreground }]}>{benefit}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Break-even note */}
                  <View style={[styles.breakEvenCard, { backgroundColor: plan.gradient[0] + '10' }]}>
                    <Feather name="info" size={14} color={plan.gradient[0]} />
                    <Text style={[styles.breakEvenText, { color: plan.gradient[0] }]}>
                      Break even after ~{formatCurrency(Math.ceil(plan.price / (plan.key === 'pro' ? 0.125 : plan.key === 'plus' ? 0.10 : 0.05)))} in total trips
                    </Text>
                  </View>

                  {!isDowngrade && (
                    <Pressable
                      onPress={() => handleActivate(plan.key)}
                      disabled={!!activating}
                      style={({ pressed }) => [
                        styles.subscribeBtn,
                        { backgroundColor: plan.gradient[0], opacity: pressed ? 0.85 : 1 },
                      ]}
                    >
                      {activating === plan.key ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Text style={styles.subscribeBtnText}>
                          {isUpgrade ? 'Upgrade' : 'Subscribe'} — {formatCurrency(plan.price)}
                        </Text>
                      )}
                    </Pressable>
                  )}

                  {isDowngrade && (
                    <View style={[styles.subscribeBtn, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.subscribeBtnText, { color: colors.mutedForeground }]}>
                        You have a higher plan
                      </Text>
                    </View>
                  )}
                </View>
              </Reanimated.View>
            );
          })}
        </ScrollView>

        {/* ═══════════════════════════════════════════════════════════════════
            HOW IT WORKS
           ═══════════════════════════════════════════════════════════════════ */}
        <Text style={[styles.sectionTitle, { color: colors.foreground, marginTop: 32 }]}>
          How It Works
        </Text>
        {[
          { icon: 'credit-card' as const, title: 'Subscribe', desc: 'Choose a plan and subscribe for 1 year' },
          { icon: 'percent' as const, title: 'Auto Discount', desc: 'Your membership discount is applied automatically on every booking' },
          { icon: 'bar-chart-2' as const, title: 'Track Savings', desc: 'Watch your savings grow with the progress tracker above' },
        ].map((step, i) => (
          <Reanimated.View
            key={i}
            entering={FadeIn.delay(300 + i * 100)}
            style={[styles.howCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.howIcon, { backgroundColor: colors.tintLight }]}>
              <Feather name={step.icon} size={18} color={colors.primaryText} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.howTitle, { color: colors.foreground }]}>{step.title}</Text>
              <Text style={[styles.howDesc, { color: colors.mutedForeground }]}>{step.desc}</Text>
            </View>
          </Reanimated.View>
        ))}
      </ScrollView>

      {/* Upgrade Modal */}
      <Modal
        visible={showUpgradeModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUpgradeModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '90%', backgroundColor: colors.card, borderRadius: 16, padding: 24, paddingBottom: 32 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ fontSize: 20, fontFamily: 'Inter_700Bold', color: colors.foreground }}>Select Upgrade</Text>
              <Pressable onPress={() => setShowUpgradeModal(false)} hitSlop={12}>
                <Feather name="x" size={24} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={{ gap: 12 }}>
              {PLANS.filter((p, i) => !activePlan || PLANS.indexOf(activePlan) < i).map(plan => (
                <Pressable
                  key={plan.key}
                  onPress={() => {
                    setShowUpgradeModal(false);
                    setTimeout(() => handleActivate(plan.key), 300);
                  }}
                  style={({ pressed }) => [
                    {
                      padding: 16,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: plan.gradient[0],
                      backgroundColor: plan.gradient[0] + '10',
                      flexDirection: 'row',
                      alignItems: 'center',
                    },
                    pressed && { opacity: 0.8 }
                  ]}
                >
                  <Text style={{ fontSize: 32, marginRight: 16 }}>{plan.icon}</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontFamily: 'Inter_600SemiBold', color: colors.foreground }}>{plan.name}</Text>
                    <Text style={{ fontSize: 13, color: colors.mutedForeground }}>{plan.discountPct} off every trip</Text>
                  </View>
                  <Text style={{ fontSize: 16, fontFamily: 'Inter_700Bold', color: plan.gradient[0] }}>
                    {formatCurrency(plan.price)}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Success Modal ── */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 28, width: '85%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12 }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#10B98120', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Feather name="check-circle" size={36} color="#10B981" />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.foreground, textAlign: 'center', marginBottom: 8 }}>Success!</Text>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.mutedForeground, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              Welcome to the <Text style={{ color: colors.primaryText, fontFamily: 'Inter_700Bold' }}>{successPlanName}</Text> plan. Your discount will be automatically applied to all future bookings!
            </Text>
            <Pressable 
              onPress={() => setShowSuccessModal(false)}
              style={{ backgroundColor: colors.primary, paddingVertical: 14, width: '100%', alignItems: 'center', borderRadius: 16 }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.primaryForeground }}>Awesome</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ── Error Modal ── */}
      <Modal visible={showErrorModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 28, width: '85%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12 }}>
            <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#EF444420', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Feather name="alert-circle" size={36} color="#EF4444" />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.foreground, textAlign: 'center', marginBottom: 8 }}>Oops!</Text>
            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.mutedForeground, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              {errorMsg}
            </Text>
            <Pressable 
              onPress={() => setShowErrorModal(false)}
              style={{ backgroundColor: colors.primary, paddingVertical: 14, width: '100%', alignItems: 'center', borderRadius: 16 }}
            >
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.primaryForeground }}>Okay</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Page>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  content: { padding: 20 },

  // Hero card
  heroCard: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  heroIcon: { fontSize: 24 },
  heroBadgePill: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  heroBadgeText: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    letterSpacing: 1.2,
  },
  heroTitle: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    letterSpacing: -0.3,
  },
  heroSub: {
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 10,
  },

  // Progress
  progressSection: { marginBottom: 12 },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabelLight: {
    color: 'rgba(255,255,255,0.8)',
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
  },
  progressTrack: {
    height: 12,
    borderRadius: 6,
    position: 'relative',
    justifyContent: 'center',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 6,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  milestone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    marginLeft: -4,
  },
  milestoneDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  milestoneDotActive: {
    backgroundColor: '#fff',
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 6,
  },

  // Hero stats
  heroStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  heroStat: { alignItems: 'center', gap: 4 },
  heroStatValue: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  heroStatLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  heroStatDivider: {
    width: 1,
    height: 36,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Section titles
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    letterSpacing: -0.3,
    marginBottom: 4,
  },
  sectionSub: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginBottom: 16,
  },

  // Plan cards
  planCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  activeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
  },
  activeBadgeText: {
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    letterSpacing: 0.8,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  planName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  planPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    marginTop: 2,
  },
  planBenefits: { gap: 10, marginBottom: 16 },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
  },
  breakEvenCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
  },
  breakEvenText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    flex: 1,
  },
  subscribeBtn: {
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subscribeBtnText: {
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },

  // How it works
  howCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  howIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  howTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  howDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    marginTop: 2,
  },
});
