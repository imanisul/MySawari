import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

// Shared pieces of the Profile flow screens (Wallet, Referrals, Refunds, Offers, Saved Addresses…):
// the back + title header and the status timeline used for withdrawals and referral rewards.

export const PF = { regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold' };

export function ScreenHeader({ title, divider, onBack, right }: { title: string; divider?: boolean; onBack?: () => void; right?: React.ReactNode }) {
  const p = useDetailsPalette();
  const router = useRouter();
  return (
    <View style={[styles.header, divider && { borderBottomWidth: 1, borderBottomColor: p.border }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={onBack ?? (() => router.back())} hitSlop={8} style={[styles.back, { backgroundColor: p.iconBg }]}>
        <Feather name="chevron-left" size={24} color={p.muted} />
      </Pressable>
      <Text style={[styles.title, { color: p.fg }]} accessibilityRole="header" numberOfLines={1}>{title}</Text>
      {right}
    </View>
  );
}

/**
 * The design's switch (Settings, Profile → My Sawari Cash): a navy pill with a white knob on the right when
 * on, grey with the knob on the left when off. Drawn by the app so it looks the same on Android and iPhone.
 */
export function DesignToggle({ value, onValueChange, accessibilityLabel, disabled }: { value: boolean; onValueChange: (v: boolean) => void; accessibilityLabel?: string; disabled?: boolean }) {
  const p = useDetailsPalette();
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [value, anim]);
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [p.strongBorder, p.navy] });
  const x = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityState={{ checked: value, disabled }}
      accessibilityLabel={accessibilityLabel}
      onPress={() => !disabled && onValueChange(!value)}
      hitSlop={10}
      style={disabled ? { opacity: 0.5 } : undefined}
    >
      <Animated.View style={[styles.toggle, { backgroundColor: bg }]}>
        <Animated.View style={[styles.knob, { transform: [{ translateX: x }] }]} />
      </Animated.View>
    </Pressable>
  );
}

/** Dashed horizontal divider (one-sided dashed borders are unreliable on iOS). */
export function Dashes({ color, style }: { color?: string; style?: any }) {
  const p = useDetailsPalette();
  return (
    <View style={[styles.dashes, style]}>
      {Array.from({ length: 80 }, (_, i) => <View key={i} style={[styles.dash, { backgroundColor: color ?? p.border }]} />)}
    </View>
  );
}

export type StepState = 'done' | 'todo' | 'error' | 'success';
export type Step = { title: string; sub: string; state: StepState };

/**
 * Vertical status list (design: "Withdrawal Request", "Referral Status"): a filled 11px dot per step, centred on its
 * text and joined by one dashed line — blue-400 when done, grey while still to come, red when it failed, green once finished.
 */
export function StatusTimeline({ steps, doneColor = '#596591', errorColor = '#EF4444' }: { steps: Step[]; /** Dot colours: finished (withdrawals blue-400, referrals blue-500) and failed (withdrawals red-500, referrals red-600). */ doneColor?: string; errorColor?: string }) {
  const p = useDetailsPalette();
  const dot = (s: StepState) => (s === 'done' ? doneColor : s === 'error' ? errorColor : s === 'success' ? p.green : '#D4D4D4');
  return (
    <View style={{ gap: 12 }}>
      {steps.map((st, i) => {
        const first = i === 0;
        const last = i === steps.length - 1;
        return (
          <View key={st.title} style={styles.stepRow} accessible accessibilityLabel={`${st.title}. ${st.sub}. ${st.state === 'todo' ? 'Not yet' : st.state === 'error' ? 'Failed' : 'Done'}`}>
            {/* From this dot's centre to the next one's (the 12px gaps are bridged by the next step's line). */}
            {steps.length > 1 && (
              <View style={[styles.vline, { top: first ? '50%' : -12, bottom: last ? '50%' : 0 }]} pointerEvents="none">
                {Array.from({ length: 40 }, (_, k) => <View key={k} style={styles.vdash} />)}
              </View>
            )}
            <View style={[styles.ring, { backgroundColor: dot(st.state) }]} />
            <View style={styles.stepText}>
              <Text style={[styles.stepTitle, { color: p.fg }]}>{st.title}</Text>
              <Text style={[styles.stepSub, { color: p.muted }]}>{st.sub}</Text>
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** "2026-10-09T05:07:00Z" → "9th oct 26, 10.37 am" (design's date style). */
export function longStamp(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  const day = d.getDate();
  const suf = day % 10 === 1 && day !== 11 ? 'st' : day % 10 === 2 && day !== 12 ? 'nd' : day % 10 === 3 && day !== 13 ? 'rd' : 'th';
  const mon = d.toLocaleString('en-GB', { month: 'short' }).toLowerCase();
  let h = d.getHours();
  const ap = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${day}${suf} ${mon} ${String(d.getFullYear()).slice(2)}, ${h}.${String(d.getMinutes()).padStart(2, '0')} ${ap}`;
}

/** "12 Oct" */
export const shortDay = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export const rupees = (n: number, decimals = false) =>
  `₹${(Number(n) || 0).toLocaleString('en-IN', decimals ? { minimumFractionDigits: 2, maximumFractionDigits: 2 } : { maximumFractionDigits: 0 })}`;

const styles = StyleSheet.create({
  toggle: { width: 38, height: 20, borderRadius: 10, justifyContent: 'center' },
  knob: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 1.5, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  back: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontFamily: PF.semibold, fontSize: 19, lineHeight: 28 },
  dashes: { flexDirection: 'row', overflow: 'hidden', gap: 3 },
  dash: { width: 4, height: 1 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  ring: { width: 11, height: 11, borderRadius: 5.5 },
  vline: { position: 'absolute', left: 5, width: 1, overflow: 'hidden', gap: 3 },
  vdash: { width: 1, height: 4, backgroundColor: '#BFC3D4' },
  stepText: { flex: 1, minWidth: 0 },
  stepTitle: { fontFamily: PF.semibold, fontSize: 11, lineHeight: 17 },
  stepSub: { fontFamily: PF.medium, fontSize: 11, lineHeight: 17 },
});