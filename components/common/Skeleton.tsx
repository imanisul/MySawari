import React, { useEffect, useState } from 'react';
import { ViewStyle, StyleSheet, LayoutChangeEvent, StyleProp } from 'react-native';
import Reanimated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  borderRadius?: number;
  style?: ViewStyle;
  /** Staggers the block's fade-in only; the shimmer itself stays in sync across blocks. */
  delay?: number;
}

const SWEEP_MS = 1400;
const PAUSE_MS = 250;

/** Skeletons are always flat: no elevation, shadow or border, whatever card they sit in. */
const styles = StyleSheet.create({
  flat: {
    overflow: 'hidden',
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
});

/**
 * Loading placeholder. A soft band of light sweeps left to right across the block (all blocks
 * mounted together sweep together), and each block fades in gently so screens build up smoothly.
 * Respects the phone's "reduce motion" setting by showing a still placeholder.
 */
export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style, delay = 0 }: SkeletonProps) {
  const colors = useColors();
  const { isDarkMode } = useSawari();
  const reduceMotion = useReducedMotion();
  const [w, setW] = useState(0);

  const appear = useSharedValue(0);
  const sweep = useSharedValue(0);

  useEffect(() => {
    appear.value = withDelay(Math.min(delay, 400), withTiming(1, { duration: 300 }));
  }, [delay, appear]);

  useEffect(() => {
    if (reduceMotion || w === 0) return;
    sweep.value = 0;
    sweep.value = withRepeat(
      withSequence(
        withTiming(1, { duration: SWEEP_MS, easing: Easing.inOut(Easing.quad) }),
        withTiming(1, { duration: PAUSE_MS }),
        withTiming(0, { duration: 0 })
      ),
      -1,
      false
    );
    return () => cancelAnimation(sweep);
  }, [reduceMotion, w, sweep]);

  const rContainer = useAnimatedStyle(() => ({ opacity: appear.value }));

  const rBand = useAnimatedStyle(() => ({
    transform: [{ translateX: -w + sweep.value * w * 2 }],
  }));

  const highlight = isDarkMode ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.75)';

  return (
    <Reanimated.View
      onLayout={(e: LayoutChangeEvent) => setW(Math.round(e.nativeEvent.layout.width))}
      style={[styles.flat, { width, height, borderRadius, backgroundColor: colors.muted }, style, rContainer]}
    >
      {!reduceMotion && w > 0 && (
        <Reanimated.View style={[{ width: w, height: '100%' }, rBand]} pointerEvents="none">
          <LinearGradient
            colors={['rgba(255,255,255,0)', highlight, 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFillObject}
          />
        </Reanimated.View>
      )}
    </Reanimated.View>
  );
}

/**
 * Wraps a whole skeleton layout. It stays invisible for the first moment and then fades in, so when the
 * data arrives quickly (the usual case) the skeleton is never seen at all instead of flashing for a frame.
 */
export function SkeletonGroup({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  const visible = useSharedValue(0);
  useEffect(() => {
    visible.value = withDelay(150, withTiming(1, { duration: 200 }));
  }, [visible]);
  const rStyle = useAnimatedStyle(() => ({ opacity: visible.value }));
  return <Reanimated.View style={[style, rStyle]}>{children}</Reanimated.View>;
}
