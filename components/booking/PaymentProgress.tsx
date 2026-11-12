import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { formatCurrency } from '@/services/backend/pricingEngine';

const FONT = { regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold' };
const RING = 96;

export type PaymentStep = { label: string };

/**
 * Loading page shown while a payment is set up and checked (booking checkout, membership): a navy ring
 * spinning around a lock, the title, the amount, and the steps with the current one highlighted.
 * `done` turns the ring into the green tick, as on "Your car is booked!".
 */
export function PaymentProgress({ title, subtitle = 'Please don’t close the app or press back.', steps, current, amount, done = false }: {
  title: string;
  subtitle?: string;
  steps: string[];
  /** Index of the step in progress; earlier steps show as done. */
  current: number;
  amount?: number;
  done?: boolean;
}) {
  const p = useDetailsPalette();
  const insets = useSafeAreaInsets();
  const spin = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const tick = useRef(new Animated.Value(done ? 1 : 0)).current;
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const s = Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1100, easing: Easing.linear, useNativeDriver: true }));
    const h = Animated.loop(Animated.sequence([
      Animated.timing(pulse, { toValue: 1, duration: 1300, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
    ]));
    s.start(); h.start();
    Animated.timing(enter, { toValue: 1, duration: 350, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
    return () => { s.stop(); h.stop(); };
  }, [spin, pulse, enter]);

  useEffect(() => {
    if (done) Animated.spring(tick, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
  }, [done, tick]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={[styles.screen, { backgroundColor: p.page, paddingTop: insets.top, paddingBottom: insets.bottom + 20 }]}>
      <Animated.View style={[styles.body, { opacity: enter, transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }] }]}>
        <View style={styles.ringBox} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {done ? (
            <Animated.View style={[styles.tickCircle, { backgroundColor: p.green, transform: [{ scale: tick.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }], opacity: tick }]}>
              <Feather name="check" size={44} color="#FFFFFF" />
            </Animated.View>
          ) : (
            <>
              <Animated.View style={[styles.halo, { borderColor: p.navy, opacity: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0] }), transform: [{ scale: pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }] }]} />
              <View style={[styles.track, { borderColor: p.summary }]} />
              <Animated.View style={[styles.arc, { borderTopColor: p.navy, borderRightColor: p.navy, transform: [{ rotate }] }]} />
              <View style={[styles.lock, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
                <Feather name="lock" size={24} color={p.navy} />
              </View>
            </>
          )}
        </View>

        <Text style={[styles.title, { color: p.fg }]} accessibilityRole="header" accessibilityLiveRegion="polite">{title}</Text>
        <Text style={[styles.sub, { color: p.sub }]}>{subtitle}</Text>

        {typeof amount === 'number' && amount > 0 && (
          <View style={[styles.amount, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
            <Text style={[styles.amountLabel, { color: p.sub }]}>{done ? 'Paid' : 'Paying now'}</Text>
            <Text style={[styles.amountValue, { color: p.navy }]}>{formatCurrency(amount)}</Text>
          </View>
        )}

        <View style={[styles.steps, { borderColor: p.deliveryBorder }]}>
          {steps.map((label, i) => {
            const state = done || i < current ? 'done' : i === current ? 'active' : 'todo';
            return (
              <View key={label} style={styles.stepRow}>
                <View style={styles.stepRail}>
                  {state === 'done' ? (
                    <View style={[styles.dot, { backgroundColor: p.green, borderColor: p.green }]}>
                      <Feather name="check" size={9} color="#FFFFFF" />
                    </View>
                  ) : state === 'active' ? (
                    <View style={[styles.dot, { borderColor: p.navy, backgroundColor: p.page }]}>
                      <View style={[styles.dotCore, { backgroundColor: p.navy }]} />
                    </View>
                  ) : (
                    <View style={[styles.dot, { borderColor: p.border, backgroundColor: p.page }]} />
                  )}
                  {i < steps.length - 1 && <View style={[styles.rail, { backgroundColor: state === 'done' ? p.green : p.border }]} />}
                </View>
                <Text style={[styles.stepText, { color: state === 'todo' ? p.muted : p.fg, fontFamily: state === 'active' ? FONT.semibold : FONT.regular }]}>{label}</Text>
              </View>
            );
          })}
        </View>
      </Animated.View>

      <View style={styles.secure}>
        <Feather name="shield" size={13} color={p.muted} />
        <Text style={[styles.secureText, { color: p.muted }]}>100% secure payments by Razorpay</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  ringBox: { width: RING, height: RING, alignItems: 'center', justifyContent: 'center' },
  halo: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 2 },
  track: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 4 },
  arc: { position: 'absolute', width: RING, height: RING, borderRadius: RING / 2, borderWidth: 4, borderColor: 'transparent' },
  lock: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tickCircle: { width: 79, height: 79, borderRadius: 39.5, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FONT.semibold, fontSize: 22, lineHeight: 30, textAlign: 'center', marginTop: 28, letterSpacing: -0.2 },
  sub: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 6, paddingHorizontal: 12 },
  amount: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', height: 44, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, marginTop: 26 },
  amountLabel: { fontFamily: FONT.regular, fontSize: 13 },
  amountValue: { fontFamily: FONT.semibold, fontSize: 16 },
  steps: { alignSelf: 'stretch', borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingTop: 16, paddingBottom: 4, marginTop: 12 },
  stepRow: { flexDirection: 'row', gap: 12 },
  stepRail: { alignItems: 'center', width: 18 },
  dot: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dotCore: { width: 8, height: 8, borderRadius: 4 },
  rail: { width: 1.5, flex: 1, minHeight: 14, marginVertical: 3 },
  stepText: { flex: 1, fontSize: 13, lineHeight: 18, paddingBottom: 16 },
  secure: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  secureText: { fontFamily: FONT.medium, fontSize: 11.5 },
});