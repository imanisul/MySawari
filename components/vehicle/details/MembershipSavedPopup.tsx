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

// Figma "membership applied": the plan's art frame (the same crown / shield / gem frames as the Membership page,
// background removed) with a white card on it. All measures are dp for a 264-wide card, taken from the design.
const ART_W = 264;
type Layout = {
  /** Whole popup card height. */
  h: number;
  /** The frame art (707 × 506 px): where it starts and how tall it is drawn. */
  artTop: number; artH: number;
  /** The white card. */
  cardTop: number; cardH: number;
  /** Starter only: the design draws its crown box larger than the frame art does, so it is laid over the frame. */
  crown?: any;
};
const STARTER_LAYOUT: Layout = { h: 219, artTop: 0, artH: 219, cardTop: 86, cardH: 120, crown: require('@/assets/images/membership_crown_starter.png') };
const OTHER_LAYOUT: Layout = { h: 189, artTop: 0, artH: 189, cardTop: 72, cardH: 106 };

type Theme = { art: any; layout: Layout; innerBorder: string; dash: string; applied: string; confetti: string[] };
const THEMES: Record<string, Theme> = {
  Starter: { art: require('@/assets/images/membership_frame_starter.png'), layout: STARTER_LAYOUT, innerBorder: '#DCD7FA', dash: '#C9C2F7', applied: '#2F3E75', confetti: ['#2F3E75', '#6152D8', '#FBBC04', '#C9C2F7', '#FFFFFF'] },
  Plus: { art: require('@/assets/images/membership_frame_plus.png'), layout: OTHER_LAYOUT, innerBorder: '#FFFFFF', dash: '#C9C2F7', applied: '#6152D8', confetti: ['#6152D8', '#F59E0B', '#FBBC04', '#C9C2F7', '#FFFFFF'] },
  Pro: { art: require('@/assets/images/membership_frame_pro.png'), layout: OTHER_LAYOUT, innerBorder: '#DCD7FA', dash: '#C9C2F7', applied: '#4FA82A', confetti: ['#4FA82A', '#64B403', '#008758', '#FBBC04', '#FFFFFF'] },
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
  // The card stays invisible until its artwork has drawn: the white card used to appear first, as a bare white
  // box, and the frame popped in a moment later.
  const [loaded, setLoaded] = useState(0);
  const [giveUp, setGiveUp] = useState(false);

  const normPlan = plan ? (plan.charAt(0).toUpperCase() + plan.slice(1).toLowerCase()) : 'Starter';
  const t = THEMES[normPlan] ?? THEMES[plan] ?? THEMES.Starter;
  const ready = loaded >= (t.layout.crown ? 2 : 1) || giveUp;
  const artLoaded = () => setLoaded((n) => n + 1);

  useEffect(() => {
    if (!visible) { setLoaded(0); setGiveUp(false); pop.setValue(0); return; }
    // Never wait on a slow image for more than a moment.
    const timer = setTimeout(() => setGiveUp(true), 700);
    return () => clearTimeout(timer);
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible || !ready) return;
    pop.setValue(0);
    // Rises in (no zoom): on some Android phones an image inside a zooming view was drawn far too large.
    Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }).start();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (confetti) setBurst((n) => n + 1);
  }, [visible, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  const close = () => {
    Animated.timing(pop, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => onClose());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
      <ModalBlur />
      <Pressable accessibilityLabel="Close" style={[StyleSheet.absoluteFill, styles.dim]} onPress={close} />

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={{ alignItems: 'center', opacity: pop, transform: [{ translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}
          accessible
          accessibilityRole="alert"
          accessibilityLabel={`${amount ? `You're saving ${formatCurrency(amount)} on this booking. ` : ''}${title || `${normPlan} Membership Applied!`}${note ? ` ${note}` : ''}`}
        >
          <View style={{ width: ART_W, height: t.layout.h }}>
            <Image source={t.art} style={{ position: 'absolute', left: 0, top: t.layout.artTop, width: ART_W, height: t.layout.artH }} resizeMode="stretch" fadeDuration={0} accessible={false} onLoad={artLoaded} onError={artLoaded} />
            {!!t.layout.crown && (
              <Image source={t.layout.crown} style={styles.crown} resizeMode="stretch" fadeDuration={0} accessible={false} onLoad={artLoaded} onError={artLoaded} />
            )}
            <View style={[styles.inner, { top: t.layout.cardTop, height: t.layout.cardH, borderColor: t.innerBorder }]}>
              <View style={styles.saveBlock}>
                {amount ? (
                  <>
                    <Text style={styles.saving}>You're saving</Text>
                    <Text style={styles.amount}>{formatCurrency(amount)}</Text>
                    <Text style={styles.onThis}>on this booking</Text>
                  </>
                ) : (
                  <Text style={[styles.onThis, { textAlign: 'center' }]}>{note}</Text>
                )}
              </View>
              <View style={styles.dashes}>
                {Array.from({ length: 60 }, (_, i) => <View key={i} style={[styles.dashBit, { backgroundColor: t.dash }]} />)}
              </View>
              <Text style={[styles.applied, { color: t.applied }]} numberOfLines={1} adjustsFontSizeToFit>{title || `${normPlan} Membership Applied!`}</Text>
              {!!amount && !!note && <Text style={styles.note} numberOfLines={1} adjustsFontSizeToFit>{note}</Text>}
            </View>
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={10} style={styles.close}>
            <Feather name="x" size={18} color="#525252" />
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
  dim: { backgroundColor: 'transparent' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  // Starter's crown box (254 × 188 px crop) drawn at half size, centred on the top edge.
  crown: { position: 'absolute', top: 0, left: (ART_W - 127) / 2, width: 127, height: 94 },
  // The white card sits inside the frame, 13 in from each side.
  inner: {
    position: 'absolute',
    left: 13,
    right: 13,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
  },
  // "You're saving / ₹300 / on this booking": 56 tall, so the dashes and title always land in the same place.
  saveBlock: { height: 56, alignItems: 'center', justifyContent: 'center' },
  saving: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 9.5, lineHeight: 13, color: '#525252' },
  amount: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 22, lineHeight: 28, color: '#008758' },
  onThis: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 9.5, lineHeight: 13, color: '#262626' },
  dashes: { alignSelf: 'stretch', flexDirection: 'row', overflow: 'hidden', gap: 3, marginTop: 9, marginBottom: 12 },
  dashBit: { width: 4, height: 1 },
  applied: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11.5, lineHeight: 15 },
  note: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 8.5, lineHeight: 12, color: '#737373', marginTop: 2 },
  close: {
    marginTop: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F3F6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});