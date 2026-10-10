import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image, Pressable, Easing } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

// Module-level flag: the splash only shows on the very first cold app launch.
// After login or any navigation within the same session, it is skipped entirely.
let hasShownSplash = false;

// Phase 1 — the brand: "MySawari · Your ride, your way" stays up at least this long.
const BRAND_MS = 300;
// After this long without data, say so instead of leaving the customer looking at a spinner.
const SLOW_LOAD_MS = 12000;

const BAR_WIDTH = 120;

export type SplashStep = { key: string; label: string; done: boolean };

/**
 * Launch sequence, shown over the app while it gets ready underneath:
 *  1. Brand  — logo, "MySawari", "Your ride, your way."
 *  2. Loading — a minimal MySawari page (no text): the mark breathing gently over a thin line that
 *               fills as this person's data actually arrives (vehicles, offers, trips, wallet).
 * Skipped straight to the app when everything is already there by the end of the brand phase.
 */
export function AnimatedSplash({
  isReady,
  isDataReady = true,
  loadFailed = false,
  onRetry,
  steps = [],
  children,
}: {
  isReady: boolean;
  /** Everything Home shows for this person has arrived from the server. */
  isDataReady?: boolean;
  /** Loading that data failed after retries. */
  loadFailed?: boolean;
  onRetry?: () => void;
  /** What is being loaded, ticked off as each part arrives. */
  steps?: SplashStep[];
  children: React.ReactNode;
}) {
  const colors = useColors();
  const skipSplash = useRef(hasShownSplash).current;
  const [isAnimationComplete, setIsAnimationComplete] = useState(skipSplash);
  const [phase, setPhase] = useState<'brand' | 'loading'>('brand');
  const [brandDone, setBrandDone] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  // The customer chose to go in without waiting (the screens show their own loading / error states).
  const [skipWaiting, setSkipWaiting] = useState(false);

  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const brandOpacity = useRef(new Animated.Value(1)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const breathe = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  // Phase 1: brand entrance.
  useEffect(() => {
    if (skipSplash) return;
    Animated.stagger(50, [
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 12, friction: 5, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]),
    ]).start();
    const t = setTimeout(() => setBrandDone(true), BRAND_MS);
    return () => clearTimeout(t);
  }, []);

  const canExit = isReady && (isDataReady || skipWaiting);

  // After the brand: straight into the app when ready, otherwise cross-fade to the loading page.
  useEffect(() => {
    if (skipSplash || !brandDone || phase !== 'brand' || canExit) return;
    setPhase('loading');
    Animated.parallel([
      Animated.timing(brandOpacity, { toValue: 0, duration: 250, useNativeDriver: true }),
      Animated.timing(loadingOpacity, { toValue: 1, duration: 300, delay: 120, useNativeDriver: true }),
    ]).start();
  }, [brandDone, canExit, phase]);

  // Loading page: the mark breathes gently while waiting.
  useEffect(() => {
    if (phase !== 'loading') return;
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(breathe, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(breathe, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [phase]);

  // Progress bar follows the real steps (never quite full until everything is in).
  const doneCount = steps.filter((s) => s.done).length;
  useEffect(() => {
    const target = isDataReady ? 1 : steps.length ? Math.min(0.92, 0.12 + (doneCount / steps.length) * 0.8) : 0.3;
    Animated.timing(progress, { toValue: target, duration: 350, useNativeDriver: false }).start();
  }, [doneCount, steps.length, isDataReady]);

  useEffect(() => {
    if (skipSplash || isDataReady) return;
    setIsSlow(false);
    const t = setTimeout(() => setIsSlow(true), SLOW_LOAD_MS);
    return () => clearTimeout(t);
  }, [isDataReady, skipSplash, loadFailed]);

  // Exit: once the brand has played and the data is in (a beat on the loading page to show it completed).
  useEffect(() => {
    if (skipSplash || !brandDone || !canExit) return;
    const t = setTimeout(() => {
      Animated.timing(overlayOpacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => {
        hasShownSplash = true; // Never show splash again this session
        setIsAnimationComplete(true);
      });
    }, phase === 'loading' ? 350 : 0);
    return () => clearTimeout(t);
  }, [brandDone, canExit]);

  const showProblem = !isDataReady && (loadFailed || isSlow);
  const markScale = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1.04] });
  const markOpacity = breathe.interpolate({ inputRange: [0, 1], outputRange: [0.75, 1] });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* The real app is mounted underneath from the start, so the splash fading away reveals the
          already-painted screen directly — no blank/white frame in between. */}
      {children}
      {!isAnimationComplete && (
        <Animated.View pointerEvents="auto" style={[styles.overlay, { backgroundColor: colors.background, opacity: overlayOpacity }]}>
          {/* Phase 1 — brand */}
          <Animated.View pointerEvents="none" style={[styles.center, { opacity: brandOpacity }]}>
            <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
              <Image source={require('@/assets/images/MySawari_nobg.png')} style={styles.logoImage} resizeMode="contain" />
            </Animated.View>
            <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], marginTop: 4 }}>
              <Text style={[styles.titleText, { color: colors.foreground }]}>MySawari</Text>
            </Animated.View>
            <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineY }], marginTop: 6 }}>
              <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Your ride, your way.</Text>
            </Animated.View>
          </Animated.View>

          {/* Phase 2 — minimal MySawari loading page */}
          {phase === 'loading' && (
            <Animated.View style={[styles.center, { opacity: loadingOpacity }]}>
              <Animated.Image
                source={require('@/assets/images/MySawari_nobg.png')}
                style={[styles.mark, { opacity: markOpacity, transform: [{ scale: markScale }] }]}
                resizeMode="contain"
                accessibilityLabel="Loading MySawari"
              />
              <View style={[styles.bar, { backgroundColor: colors.border }]}>
                <Animated.View
                  style={[styles.barFill, { backgroundColor: colors.primary, width: progress.interpolate({ inputRange: [0, 1], outputRange: [0, BAR_WIDTH] }) }]}
                />
              </View>

              {/* Only when something is wrong: icon actions, no paragraphs. */}
              {showProblem && (
                <View style={styles.actions}>
                  {loadFailed && !!onRetry && (
                    <Pressable accessibilityRole="button" accessibilityLabel="Retry" onPress={onRetry}
                      style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary }, pressed && { opacity: 0.7 }]}>
                      <Feather name="refresh-cw" size={15} color={colors.primaryForeground} />
                      <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Retry</Text>
                    </Pressable>
                  )}
                  <Pressable accessibilityRole="button" accessibilityLabel="Continue" onPress={() => setSkipWaiting(true)}
                    style={({ pressed }) => [styles.btn, { borderColor: colors.border, borderWidth: 1 }, pressed && { opacity: 0.7 }]}>
                    <Text style={[styles.btnText, { color: colors.foreground }]}>Continue</Text>
                    <Feather name="arrow-right" size={15} color={colors.foreground} />
                  </Pressable>
                </View>
              )}
            </Animated.View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  overlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, zIndex: 9999 },
  center: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  logoImage: { width: 220, height: 110 },
  titleText: { fontFamily: 'Inter_700Bold', fontSize: 32, letterSpacing: -0.5 },
  tagline: { fontFamily: 'Inter_500Medium', fontSize: 15, letterSpacing: 0.3 },
  mark: { width: 140, height: 70 },
  bar: { width: BAR_WIDTH, height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 22 },
  barFill: { height: 3, borderRadius: 2 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 28 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10 },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});
