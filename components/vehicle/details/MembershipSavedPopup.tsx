import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Animated, Easing, Image, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { useTripPrice } from './useTripPrice';
import { useSawari } from '@/context/SawariContext';
import { ModalBlur } from '@/components/common/ModalBlur';

// Trips (car + dates + plan) whose popup was already shown this session — it celebrates once, not on every visit.
const shown = new Set<string>();

export function clearMembershipPopupShown(carId?: string) {
  if (!carId) {
    shown.clear();
  } else {
    for (const key of Array.from(shown)) {
      if (key.startsWith(`${carId}|`)) {
        shown.delete(key);
      }
    }
  }
}

// Figma "membership applied": the plan's art (the same crown / shield / gem frames as the Membership page,
// background removed) with a white card on it. Art files are 708 × 502.
const ART_W = 264;
const ART_H = Math.round((ART_W * 552) / 748);

type Theme = { art: any; innerBorder: string; dash: string; applied: string; confetti: string[] };
const THEMES: Record<string, Theme> = {
  Starter: { art: require('@/assets/images/membership_card_starter.png'), innerBorder: '#DCD7FA', dash: '#C9C2F7', applied: '#2F3E75', confetti: ['#2F3E75', '#6152D8', '#FBBC04', '#C9C2F7', '#FFFFFF'] },
  Plus: { art: require('@/assets/images/membership_card_plus.png'), innerBorder: '#FFFFFF', dash: '#C9C2F7', applied: '#6152D8', confetti: ['#6152D8', '#F59E0B', '#FBBC04', '#C9C2F7', '#FFFFFF'] },
  Pro: { art: require('@/assets/images/membership_card_pro.png'), innerBorder: '#DCD7FA', dash: '#C9C2F7', applied: '#4FA82A', confetti: ['#4FA82A', '#64B403', '#008758', '#FBBC04', '#FFFFFF'] },
};

/**
 * The membership celebration card: plan art, "You're saving ₹X on this booking", "<Plan> Membership Applied!"
 * and a round ✕ — with a confetti burst (react-native-confetti-cannon) when `confetti` is on.
 * Used when a member's discount first applies to a trip, and when a plan is picked to buy with a booking.
 */
export function MembershipCelebration({ visible, plan, amount, title, note, confetti = true, onClose }: {
  visible: boolean;
  /** 'Starter' | 'Plus' | 'Pro' */
  plan: string;
  /** Saving on this booking; without one the card shows `note` in its place. */
  amount: number | null;
  /** Bottom line (default "<Plan> Membership Applied!"). */
  title?: string;
  /** Small line under the title (e.g. "₹1,999 for 1 year, paid with your booking"). */
  note?: string;
  confetti?: boolean;
  onClose: () => void;
}) {
  const { width } = useWindowDimensions();
  const pop = useRef(new Animated.Value(0)).current;
  const [burst, setBurst] = useState(0);

  useEffect(() => {
    if (!visible) return;
    pop.setValue(0);
    // Rises in (no zoom): on some Android phones an image inside a zooming view was drawn far too large.
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (confetti) setBurst((n) => n + 1);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    Animated.timing(pop, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => onClose());
  };

  const normPlan = plan ? (plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase()) : 'Starter';
  const t = THEMES[normPlan] ?? THEMES[plan] ?? THEMES.Starter;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
      <ModalBlur sigmaX={2} sigmaY={2} />
      <Pressable accessibilityLabel="Close" style={[StyleSheet.absoluteFill, styles.dim]} onPress={close} />

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={{ alignItems: 'center', opacity: pop, transform: [{ translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}
          accessible
          accessibilityRole="alert"
          accessibilityLabel={`${amount ? `You're saving ${formatCurrency(amount)} on this booking. ` : ''}${title || `${normPlan} Membership Applied!`}${note ? ` ${note}` : ''}`}
        >
          <View style={{ width: ART_W, height: ART_H, overflow: 'hidden' }}>
            <Image source={t.art} style={{ position: 'absolute', top: 0, left: 0, width: ART_W, height: ART_H }} resizeMode="center" fadeDuration={0} accessible={false} />
            <View style={[styles.inner, { borderColor: t.innerBorder }]}>
              {amount ? (
                <>
                  <Text style={styles.saving}>You're saving</Text>
                  <Text style={styles.amount}>{formatCurrency(amount)}</Text>
                  <Text style={styles.onThis}>on this booking</Text>
                </>
              ) : (
                <Text style={[styles.onThis, { textAlign: 'center' }]}>{note}</Text>
              )}
              <View style={styles.dashes}>
                {Array.from({ length: 40 }, (_, i) => <View key={i} style={[styles.dashBit, { backgroundColor: t.dash }]} />)}
              </View>
              <Text style={[styles.applied, { color: t.applied }]} numberOfLines={1} adjustsFontSizeToFit>{title || `${normPlan} Membership Applied!`}</Text>
              {!!amount && !!note && <Text style={styles.note} numberOfLines={1} adjustsFontSizeToFit>{note}</Text>}
            </View>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={10} style={styles.close}>
            <Feather name="x" size={17} color="#404040" />
          </Pressable>
        </Animated.View>
      </View>

      {/* Celebration: two bursts from the top corners, in the plan's colours. */}
      {confetti && visible && burst > 0 && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <ConfettiCannon key={`l${burst}`} count={70} origin={{ x: -10, y: 0 }} explosionSpeed={380} fallSpeed={2600} fadeOut colors={t.confetti} />
          <ConfettiCannon key={`r${burst}`} count={70} origin={{ x: width + 10, y: 0 }} explosionSpeed={380} fallSpeed={2600} fadeOut colors={t.confetti} />
        </View>
      )}
    </Modal>
  );
}

/**
 * "You're saving ₹X on this booking — Starter Membership Applied!" over the car details page, the first
 * time a priced trip includes a member's discount. The amount is the quote's membership discount
 * (the same figure as in View breakup). A plan being bought has its own popup when it is picked.
 */
export function MembershipSavedPopup({
  hasTrip,
  tripKey,
  screen = 'booking',
  forceShow = false,
}: {
  hasTrip: boolean;
  tripKey: string;
  screen?: string;
  forceShow?: boolean;
}) {
  // Existing member discount popup should not appear on car details page; it only shows on the payment option page.
  if (screen === 'details') return null;

  const { membership } = useSawari();
  const price = useTripPrice(hasTrip);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState<{ amount: number | null; plan: string; note?: string } | null>(null);
  const hasShown = useRef(false);

  const planKey = (membership?.plan || '').toLowerCase().trim();
  const isMember = !!planKey && (
    !membership?.expiresAt ||
    (() => {
      const exp = new Date(membership.expiresAt).getTime();
      return isNaN(exp) || exp > Date.now();
    })()
  );
  const memberPlanName = isMember
    ? (planKey.charAt(0).toUpperCase() + planKey.slice(1).toLowerCase())
    : null;

  const planName = (price.state === 'ready' && price.planName) ? price.planName : memberPlanName;
  const discount = (price.state === 'ready' && price.membershipDiscount > 0) ? price.membershipDiscount : null;

  const isReady = (price.state === 'ready' && (discount !== null || isMember)) || (isMember && price.state !== 'loading');
  const key = `${screen}|${tripKey}|${planName}`;

  useEffect(() => {
    if (!isReady || !planName || hasShown.current) return;
    if (!forceShow && shown.has(key)) return;

    const t = setTimeout(() => {
      hasShown.current = true;
      shown.add(key);
      setSaving({
        amount: discount,
        plan: planName,
        note: discount ? undefined : 'Active Member Benefits Applied',
      });
      setVisible(true);
    }, 450);
    return () => clearTimeout(t);
  }, [key, isReady, planName, discount, forceShow]);

  // Keep savings amount updated if price calculation resolves after initial popup mount
  useEffect(() => {
    if (discount !== null && saving && saving.amount !== discount) {
      setSaving((prev) => (prev ? { ...prev, amount: discount, note: undefined } : prev));
    }
  }, [discount, saving]);

  if (!saving) return null;
  return (
    <MembershipCelebration
      visible={visible}
      confetti
      plan={saving.plan}
      amount={saving.amount}
      note={saving.note}
      onClose={() => setVisible(false)}
    />
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(0, 0, 0, 0.32)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // The white card sits inside the art's frame (fractions of the 708 × 502 art), as in the design.
  inner: {
    position: 'absolute',
    left: '5%',
    right: '5%',
    top: '38.5%',
    bottom: '6%',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal:10,
    marginHorizontal: 10,
    marginBottom:10
  },
  saving: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 9.5, lineHeight: 13, color: '#525252' },
  amount: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 20, lineHeight: 26, color: '#008758', marginTop: 1 },
  onThis: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 9.5, lineHeight: 13, color: '#262626' },
  dashes: { alignSelf: 'stretch', flexDirection: 'row', overflow: 'hidden', gap: 3, marginTop: 8, marginBottom: 9 },
  dashBit: { width: 4, height: 1 },
  applied: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11.5, lineHeight: 15 },
  note: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 8.5, lineHeight: 12, color: '#737373', marginTop: 2 },
  close: {
    marginTop: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});