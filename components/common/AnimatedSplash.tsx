import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image, Pressable, Easing, ActivityIndicator, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

// Module-level flag: the splash only shows on the very first cold app launch.
// After login or any navigation within the same session, it is skipped entirely.
let hasShownSplash = false;

// Phase 1 — the brand: "MySawari · Your ride, your way" stays up at least this long.
const BRAND_MS = 1400;
// After this long without data, say so instead of leaving the customer looking at a spinner.
const SLOW_LOAD_MS = 12000;

const ROAD_WIDTH = Math.min(Dimensions.get('window').width - 64, 320);
// Only things the app really offers (delivery toggle, sign-up bonus, referral commission).
const TIPS = [
  'Self-drive cars and bikes across the Northeast',
  'Get your vehicle delivered to your doorstep',
  'New here? Get ₹100 SawariCash when you sign up',
  'Refer a friend and earn 10% of their first trip',
];

export type SplashStep = { key: string; label: string; done: boolean };

/**
 * Launch sequence, shown over the app while it gets ready underneath:
 *  1. Brand  — logo, "MySawari", "Your ride, your way."
 *  2. Loading — a MySawari loading page that ticks off this person's data as it actually arrives
 *               (vehicles, offers, and for a signed-in customer their trips and wallet).
 * Skipped straight to the app when everything is already there by the end of the brand phase.
 */
export function AnimatedSplash({
  isReady,
  isDataReady = true,
  loadFailed = false,
  onRetry,
  steps = [],
  guest = true,
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
  guest?: boolean;
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
  const [tip, setTip] = useState(0);

  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const brandOpacity = useRef(new Animated.Value(1)).current;
  const loadingOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const carX = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;

  // Phase 1: brand entrance.
  useEffect(() => {
    if (skipSplash) return;
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 12, friction: 5, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 400, useNativeDriver: true }),
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

  // Loading page: the car drives along the road, tips rotate.
  useEffect(() => {
    if (phase !== 'loading') return;
    const drive = Animated.loop(
      Animated.timing(carX, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
    );
    drive.start();
    const tipTimer = setInterval(() => setTip((n) => (n + 1) % TIPS.length), 2600);
    return () => { drive.stop(); clearInterval(tipTimer); };
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
  const carTranslate = carX.interpolate({ inputRange: [0, 1], outputRange: [-40, ROAD_WIDTH - 40] });

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

          {/* Phase 2 — MySawari loading page */}
          {phase === 'loading' && (
            <Animated.View style={[styles.center, { opacity: loadingOpacity, paddingHorizontal: 32 }]}>
              <Text style={[styles.loadingKicker, { color: colors.primaryText }]}>MYSAWARI</Text>
              <Text style={[styles.loadingTitle, { color: colors.foreground }]}>
                {guest ? 'Getting your ride ready' : 'Welcome back! Getting things ready'}
              </Text>

              {/* The road */}
              <View style={[styles.road, { width: ROAD_WIDTH }]}>
                <Animated.Image
                  source={require('@/assets/images/header_car_final.png')}
                  style={[styles.roadCar, { transform: [{ translateX: carTranslate }] }]}
                  resizeMode="contain"
                />
                <View style={[styles.roadLine, { backgroundColor: colors.border }]}>
                  <Animated.View
                    style={[styles.roadFill, { backgroundColor: colors.primary, width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]}
                  />
                </View>
              </View>

              {/* What is loading, ticked off as it arrives */}
              <View style={[styles.steps, { width: ROAD_WIDTH }]}>
                {steps.map((s) => (
                  <View key={s.key} style={styles.stepRow}>
                    {s.done || isDataReady ? (
                      <View style={[styles.stepDone, { backgroundColor: colors.success }]}>
                        <Feather name="check" size={11} color="#FFF" />
                      </View>
                    ) : (
                      <ActivityIndicator size="small" color={colors.primary} style={styles.stepSpinner} />
                    )}
                    <Text style={[styles.stepText, { color: s.done || isDataReady ? colors.foreground : colors.mutedForeground }]}>{s.label}</Text>
                  </View>
                ))}
              </View>

              {showProblem ? (
                <View style={{ alignItems: 'center', gap: 12, marginTop: 20 }}>
                  <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                    {loadFailed ? "Couldn't load everything. Check your internet connection." : 'This is taking longer than usual…'}
                  </Text>
                  <View style={styles.actions}>
                    {loadFailed && !!onRetry && (
                      <Pressable accessibilityRole="button" onPress={onRetry}
                        style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary }, pressed && { opacity: 0.7 }]}>
                        <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Retry</Text>
                      </Pressable>
                    )}
                    <Pressable accessibilityRole="button" onPress={() => setSkipWaiting(true)}
                      style={({ pressed }) => [styles.btn, { borderColor: colors.border, borderWidth: 1 }, pressed && { opacity: 0.7 }]}>
                      <Text style={[styles.btnText, { color: colors.foreground }]}>Continue</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Text style={[styles.tip, { color: colors.mutedForeground }]}>{TIPS[tip]}</Text>
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
  loadingKicker: { fontFamily: 'Inter_700Bold', fontSize: 11, letterSpacing: 2 },
  loadingTitle: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.4, marginTop: 6, textAlign: 'center' },
  road: { marginTop: 28, height: 56, justifyContent: 'flex-end' },
  roadCar: { position: 'absolute', bottom: 6, left: 0, width: 80, height: 40 },
  roadLine: { height: 4, borderRadius: 2, overflow: 'hidden' },
  roadFill: { height: 4, borderRadius: 2 },
  steps: { marginTop: 24, gap: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stepDone: { width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  stepSpinner: { width: 18, height: 18, transform: [{ scale: 0.75 }] },
  stepText: { fontFamily: 'Inter_500Medium', fontSize: 13.5, flexShrink: 1 },
  tip: { fontFamily: 'Inter_400Regular', fontSize: 12.5, marginTop: 28, textAlign: 'center' },
  statusText: { fontFamily: 'Inter_500Medium', fontSize: 13, textAlign: 'center' },
  actions: { flexDirection: 'row', gap: 12 },
  btn: { paddingHorizontal: 22, paddingVertical: 10, borderRadius: 10 },
  btnText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});
