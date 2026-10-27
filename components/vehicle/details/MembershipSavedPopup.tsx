import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Animated, Easing, Image, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { useTripPrice } from './useTripPrice';

// Trips (car + dates + plan) whose popup was already shown this session — it celebrates once, not on every visit.
const shown = new Set<string>();

// Figma "membership applied": the plan's art (the same crown / shield / gem frames as the Membership page,
// background removed) with a white card on it. Art files are 708 × 502.
const ART_W = 264;
const ART_H = Math.round((ART_W * 502) / 708);

type Theme = { art: any; innerBorder: string; dash: string; applied: string; confetti: string[] };
const THEMES: Record<string, Theme> = {
  Starter: { art: require('@/assets/images/membership_popup_starter.png'), innerBorder: '#DCD7FA', dash: '#C9C2F7', applied: '#2F3E75', confetti: ['#2F3E75', '#6152D8', '#FBBC04', '#C9C2F7', '#FFFFFF'] },
  Plus: { art: require('@/assets/images/membership_popup_plus.png'), innerBorder: '#FFFFFF', dash: '#C9C2F7', applied: '#6152D8', confetti: ['#6152D8', '#F59E0B', '#FBBC04', '#C9C2F7', '#FFFFFF'] },
  Pro: { art: require('@/assets/images/membership_popup_pro.png'), innerBorder: '#DCD7FA', dash: '#C9C2F7', applied: '#4FA82A', confetti: ['#4FA82A', '#64B403', '#008758', '#FBBC04', '#FFFFFF'] },
};

/**
 * The membership celebration card: plan art, "You're saving ₹X on this booking", "<Plan> Membership Applied!"
 * and a round ✕ — with a confetti burst (react-native-confetti-cannon) when `confetti` is on.
 * Used when a member's discount first applies to a trip, and when a plan is picked to buy with a booking.
 */
export function MembershipCelebration({ visible, plan, amount, title, note, confetti = false, onClose }: {
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

  const t = THEMES[plan] ?? THEMES.Starter;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <BlurView intensity={18} tint="default" style={StyleSheet.absoluteFill}>
        <Pressable accessibilityLabel="Close" style={[StyleSheet.absoluteFill, styles.dim]} onPress={close} />
      </BlurView>

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={{ alignItems: 'center', opacity: pop, transform: [{ translateY: pop.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }] }}
          accessible
          accessibilityRole="alert"
          accessibilityLabel={`${amount ? `You're saving ${formatCurrency(amount)} on this booking. ` : ''}${title || `${plan} Membership Applied!`}${note ? ` ${note}` : ''}`}
        >
          <View style={{ width: ART_W, height: ART_H, overflow: 'hidden' }}>
            <Image source={t.art} style={{ position: 'absolute', top: 0, left: 0, width: ART_W, height: ART_H }} resizeMode="stretch" fadeDuration={0} accessible={false} />
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
              <Text style={[styles.applied, { color: t.applied }]} numberOfLines={1} adjustsFontSizeToFit>{title || `${plan} Membership Applied!`}</Text>
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
export function MembershipSavedPopup({ hasTrip, tripKey }: { hasTrip: boolean; tripKey: string }) {
  const price = useTripPrice(hasTrip);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState<{ amount: number; plan: string } | null>(null);

  const ready = price.state === 'ready' && price.membershipDiscount > 0 && !!price.planName && !price.buyingPlan;
  const key = ready ? `${tripKey}|${price.planName}` : '';

  useEffect(() => {
    if (!ready || shown.has(key)) return;
    const t = setTimeout(() => {
      shown.add(key);
      setSaving({ amount: price.membershipDiscount, plan: price.planName! });
      setVisible(true);
    }, 450);
    return () => clearTimeout(t);
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!saving) return null;
  return <MembershipCelebration visible={visible} plan={saving.plan} amount={saving.amount} onClose={() => setVisible(false)} />;
}

const styles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(0,0,0,0.27)' },
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
    paddingHorizontal: 12,
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