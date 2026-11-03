import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, PanResponder, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from '@/utils/haptics';

const COLS = 11;
const ROWS = 6;
const TILE = 20;
export const SCRATCH_W = COLS * TILE;
export const SCRATCH_H = ROWS * TILE;
const BRUSH = 1; // tiles cleared around the finger
const REVEAL_AT = 0.4; // share of the card scratched away before the rest is revealed

/**
 * A scratch card: `children` sit underneath a foil that the finger rubs away. At 40% scratched the rest clears and
 * `onReveal` fires once. `revealed` opens it without scratching (the "Reveal" link, for anyone who can't scratch).
 */
export function ScratchCard({ children, onReveal, revealed = false }: { children: React.ReactNode; onReveal: () => void; revealed?: boolean }) {
  const [cleared, setCleared] = useState<Set<number>>(() => new Set());
  const fired = useRef(false);
  const fade = useRef(new Animated.Value(1)).current;
  const done = revealed || cleared.size / (COLS * ROWS) >= REVEAL_AT;

  React.useEffect(() => {
    if (!done || fired.current) return;
    fired.current = true;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.timing(fade, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    onReveal();
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const scratchAt = (x: number, y: number) => {
    const c = Math.floor(x / TILE);
    const r = Math.floor(y / TILE);
    setCleared((prev) => {
      const next = new Set(prev);
      for (let dr = -BRUSH; dr <= BRUSH; dr++) for (let dc = -BRUSH; dc <= BRUSH; dc++) {
        const rr = r + dr; const cc = c + dc;
        if (rr >= 0 && rr < ROWS && cc >= 0 && cc < COLS) next.add(rr * COLS + cc);
      }
      return next.size === prev.size ? prev : next;
    });
  };

  const pan = useMemo(() => PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: (e) => scratchAt(e.nativeEvent.locationX, e.nativeEvent.locationY),
    onPanResponderMove: (e) => scratchAt(e.nativeEvent.locationX, e.nativeEvent.locationY),
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={styles.box}>
      <View style={styles.under}>{children}</View>
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: fade }]} pointerEvents={done ? 'none' : 'auto'} {...pan.panHandlers}>
        {/* The foil is a grid of tiles; rubbing removes them, so the prize underneath shows through. */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          {Array.from({ length: ROWS * COLS }, (_, i) => (
            cleared.has(i) ? null : <View key={i} style={[styles.tile, { left: (i % COLS) * TILE, top: Math.floor(i / COLS) * TILE, backgroundColor: (Math.floor(i / COLS) + (i % COLS)) % 2 ? '#4E4FB8' : '#5B5FC7' }]} />
          ))}
        </View>
        {cleared.size === 0 && (
          <View style={styles.hint} pointerEvents="none">
            <Feather name="gift" size={26} color="#FFFFFF" />
            <Text style={styles.hintText}>Scratch here</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: SCRATCH_W, height: SCRATCH_H, borderRadius: 14, overflow: 'hidden', backgroundColor: '#F4F6FA' },
  under: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  hint: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', gap: 6 },
  hintText: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14 },
  // shortcut: square foil tiles (no gradient / soft edges); swap for a Skia mask if a smoother scratch is wanted
  tile: { position: 'absolute', width: TILE, height: TILE },
});
