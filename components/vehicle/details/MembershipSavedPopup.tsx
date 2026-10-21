import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Animated, Easing } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Defs, RadialGradient, Stop, Rect, Polygon } from 'react-native-svg';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { useTripPrice } from './useTripPrice';

// Trips (car + dates + plan) whose popup was already shown this session — it celebrates once, not on every visit.
const shown = new Set<string>();

const CARD_W = 263;
const CARD_H = 194;
// Light rays fanning out from behind the ribbon (Figma "membership applied").
const RAYS = Array.from({ length: 12 }, (_, i) => {
  const cx = CARD_W / 2, cy = 30, r = 260;
  const a0 = Math.PI * (0.05 + i * 0.075), a1 = a0 + 0.035;
  return `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} L${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`;
});

// Each plan's look (Figma): Starter — lilac card, blue ribbon with a crown; Plus — purple card, gold shield
// with a star; Pro — mint card, green gem.
type Theme = { card: string; ray: string; rayOpacity: number; border: string; innerBorder: string; dash: string; applied: string; badge: 'ribbon' | 'shield' | 'gem' };
const THEMES: Record<string, Theme> = {
  Starter: { card: '#EEEBFD', ray: '#FFFFFF', rayOpacity: 0.9, border: '#FFFFFF', innerBorder: '#DCD7FA', dash: '#C9C2F7', applied: '#2F3E75', badge: 'ribbon' },
  Plus: { card: '#6152D8', ray: '#8A7EF0', rayOpacity: 0.7, border: '#6152D8', innerBorder: '#FFFFFF', dash: '#C9C2F7', applied: '#6152D8', badge: 'shield' },
  Pro: { card: '#E4F2EA', ray: '#FFFFFF', rayOpacity: 0.95, border: '#FFFFFF', innerBorder: '#DCD7FA', dash: '#C9C2F7', applied: '#4FA82A', badge: 'gem' },
};

/** Plus badge: a two-tone gold shield with a star. */
function ShieldBadge() {
  return (
    <Svg width={132} height={96} viewBox="0 0 132 96">
      <Path d="M8 8 Q66 -4 124 8 L124 46 Q124 78 66 94 Q8 78 8 46 Z" fill="#FFC93C" />
      <Path d="M16 15 Q66 5 66 5 L66 85 Q16 71 16 45 Z" fill="#FFA41B" />
      <Path d="M66 5 Q116 15 116 15 L116 45 Q116 71 66 85 Z" fill="#FF8A00" />
      <Polygon points="66,22 74,40 93,41 78,53 83,72 66,61 49,72 54,53 39,41 58,40" fill="#FFC93C" stroke="#FFD866" strokeWidth={1.5} strokeLinejoin="round" />
    </Svg>
  );
}

/** Pro badge: a faceted green gem. */
function GemBadge() {
  return (
    <Svg width={100} height={92} viewBox="0 0 100 92">
      <Polygon points="50,0 0,58 30,58" fill="#C8EC72" />
      <Polygon points="50,0 30,58 70,58" fill="#A8DC40" />
      <Polygon points="50,0 70,58 100,58" fill="#7DC22D" />
      <Polygon points="0,58 30,58 50,92" fill="#9BD136" />
      <Polygon points="30,58 70,58 50,92" fill="#86C52C" />
      <Polygon points="70,58 100,58 50,92" fill="#62A822" />
    </Svg>
  );
}

/**
 * "You're saving ₹X on this booking — Starter Membership Applied!" over the car details page, the first
 * time a priced trip includes a membership discount. The amount is the quote's membership discount
 * (the same figure as in View breakup).
 */
export function MembershipSavedPopup({ hasTrip, tripKey }: { hasTrip: boolean; tripKey: string }) {
  const price = useTripPrice(hasTrip);
  const [visible, setVisible] = useState(false);
  const [saving, setSaving] = useState<{ amount: number; plan: string } | null>(null);
  const pop = useRef(new Animated.Value(0)).current;

  const ready = price.state === 'ready' && price.membershipDiscount > 0 && !!price.planName;
  const key = ready ? `${tripKey}|${price.planName}` : '';

  useEffect(() => {
    if (!ready || shown.has(key)) return;
    const t = setTimeout(() => {
      shown.add(key);
      setSaving({ amount: price.membershipDiscount, plan: price.planName! });
      setVisible(true);
      pop.setValue(0);
      Animated.spring(pop, { toValue: 1, useNativeDriver: true, friction: 6, tension: 80 }).start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 450);
    return () => clearTimeout(t);
  }, [key]);

  const close = () => {
    Animated.timing(pop, { toValue: 0, duration: 140, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => setVisible(false));
  };

  if (!saving) return null;
  const t = THEMES[saving.plan] ?? THEMES.Starter;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <BlurView intensity={18} tint="default" style={StyleSheet.absoluteFill}>
        <Pressable accessibilityLabel="Close" style={[StyleSheet.absoluteFill, styles.dim]} onPress={close} />
      </BlurView>

      <View style={styles.center} pointerEvents="box-none">
        <Animated.View
          style={{ alignItems: 'center', opacity: pop, transform: [{ scale: pop.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }] }}
          accessible
          accessibilityRole="alert"
          accessibilityLabel={`You're saving ${formatCurrency(saving.amount)} on this booking. ${saving.plan} Membership Applied!`}
        >
          <View style={[styles.card, { backgroundColor: t.card, borderColor: t.border }]}>
            <Svg width={CARD_W} height={CARD_H} style={StyleSheet.absoluteFill}>
              <Defs>
                <RadialGradient id="glow" cx="50%" cy="15%" r="80%">
                  <Stop offset="0" stopColor={t.ray} stopOpacity={t.rayOpacity} />
                  <Stop offset="1" stopColor={t.ray} stopOpacity="0" />
                </RadialGradient>
              </Defs>
              <Rect width={CARD_W} height={CARD_H} fill={t.card} />
              {RAYS.map((d, i) => <Path key={i} d={d} fill="url(#glow)" />)}
            </Svg>

            <View style={[styles.inner, { borderColor: t.innerBorder }]}>
              <Text style={styles.saving}>You're saving</Text>
              <Text style={styles.amount}>{formatCurrency(saving.amount)}</Text>
              <Text style={styles.onThis}>on this booking</Text>
              <View style={[styles.dash, { borderColor: t.dash }]} />
              <Text style={[styles.applied, { color: t.applied }]}>{saving.plan} Membership Applied!</Text>
            </View>
          </View>

          {/* Plan badge hanging over the card's top edge: ribbon with crown (Starter) or shield (Plus) or gem (Pro) */}
          <View style={styles.ribbonWrap} pointerEvents="none">
            {t.badge === 'ribbon' ? (
              <>
                <View style={styles.ribbonBar} />
                <View style={styles.ribbon}>
                  <View style={[styles.ribbonHalf, { backgroundColor: '#4560DB' }]} />
                  <View style={[styles.ribbonHalf, { backgroundColor: '#3A52C6' }]} />
                  <MaterialCommunityIcons name="crown" size={50} color="#FBC52C" style={styles.crown} />
                </View>
              </>
            ) : t.badge === 'gem' ? (
              <GemBadge />
            ) : (
              <ShieldBadge />
            )}
          </View>

          <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={close} hitSlop={10} style={styles.close}>
            <Feather name="x" size={16} color="#404040" />
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(0,0,0,0.27)' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    width: CARD_W,
    height: CARD_H,
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    padding: 12,
  },
  inner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 13,
    paddingHorizontal: 12,
  },
  saving: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10.5, color: '#525252' },
  amount: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, color: '#008758', marginTop: 3 },
  onThis: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10.5, color: '#262626', marginTop: 3 },
  dash: { alignSelf: 'stretch', borderTopWidth: 1, borderStyle: 'dashed', marginTop: 9, marginBottom: 10 },
  applied: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12 },
  ribbonWrap: { position: 'absolute', top: 0, alignItems: 'center' },
  ribbonBar: { width: 126, height: 8, backgroundColor: '#E6E2FB' },
  ribbon: { width: 104, height: 78, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ribbonHalf: { flex: 1, alignSelf: 'stretch' },
  crown: { position: 'absolute', top: 18 },
  close: {
    marginTop: 14,
    width: 30,
    height: 30,
    borderRadius: 15,
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
