import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Easing,
  useWindowDimensions,
  StatusBar,
  Pressable,
} from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import { useColors } from '@/hooks/useColors';
import {
  DEFAULT_FLASH_SCREEN_CONFIG,
  FlashScreenConfig,
  getCachedFlashScreenConfig,
  fetchRemoteFlashScreenConfig,
} from '@/services/api/flashScreen';

const AnimatedG = Animated.createAnimatedComponent(G);

// Module-level flag: the splash only shows on the very first cold app launch.
let hasShownSplash = false;

// Screens that must not animate while the launch overlay still covers them subscribe here.
const splashGoneListeners = new Set<() => void>();

/** Runs `cb` once the launch splash is off screen — immediately if it already is. */
export function onSplashGone(cb: () => void): () => void {
  if (hasShownSplash) {
    cb();
    return () => { };
  }
  splashGoneListeners.add(cb);
  return () => splashGoneListeners.delete(cb);
}

function markSplashGone() {
  hasShownSplash = true; // Never show splash again this session
  const pending = [...splashGoneListeners];
  splashGoneListeners.clear();
  pending.forEach((cb) => cb());
}

// After this long without data, show retry action
const SLOW_LOAD_MS = 14000;

export type SplashStep = { key: string; label: string; done: boolean };

// MySawari signature brand colors
const BRAND_LOGO_COLOR = '#1C2A53';
const FESTIVE_BG = '#FAF9F5';
const FESTIVE_INK = '#1C2A53';
const FESTIVE_SUB = '#5B688A';
const FESTIVE_LINE = '#D9DCE8';
const FESTIVE_GOLD = '#E0A126';

/**
 * High-End Dynamic Flash Screen:
 *  - Animated Festive Mode (Diwali):
 *      * Top hanging garland string lights with twinkling diamond lanterns.
 *      * Twinkling 4-point sparkle stars.
 *      * Center rotating dashed orbit rings (clockwise + counter-clockwise) with soft pulsing radial glow.
 *      * Spring-scale entrance for MySawari logo mark.
 *      * Diya badge with flickering golden flame and "HAPPY DIWALI".
 *      * Bottom road track with progress bar and cute animated car driving synchronously across the line.
 *      * Subtitle: "Lighting up every journey this festive season".
 *  - Classic Mode:
 *      * Pure white background with signature logo and brand typography.
 *  - Configurable duration (default 4 seconds) and live control from Operation App.
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
  isDataReady?: boolean;
  loadFailed?: boolean;
  onRetry?: () => void;
  steps?: SplashStep[];
  children: React.ReactNode;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const skipSplash = useRef(hasShownSplash).current;
  const [isAnimationComplete, setIsAnimationComplete] = useState(skipSplash);
  const [config, setConfig] = useState<FlashScreenConfig>(DEFAULT_FLASH_SCREEN_CONFIG);
  const [brandDone, setBrandDone] = useState(false);
  const [isSlow, setIsSlow] = useState(false);

  // Common animated values
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(14)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(14)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // Celestial / Signature animation values
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinReverseAnim = useRef(new Animated.Value(0)).current;
  const twinkle1 = useRef(new Animated.Value(0.2)).current;
  const twinkle2 = useRef(new Animated.Value(0.2)).current;
  const twinkle3 = useRef(new Animated.Value(0.2)).current;
  const twinkle4 = useRef(new Animated.Value(0.2)).current;
  const glowScale = useRef(new Animated.Value(1)).current;

  // Load cached config immediately on mount, then sync in background
  useEffect(() => {
    let active = true;
    getCachedFlashScreenConfig().then((cached) => {
      if (active && cached) {
        setConfig(cached);
      }
    });

    fetchRemoteFlashScreenConfig().then((fresh) => {
      if (active && fresh) {
        setConfig(fresh);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  // Compute actual duration in ms: default 4 seconds (4000ms)
  const durationMs = useMemo(() => {
    const sec = Number(config?.durationSeconds);
    if (!isNaN(sec) && sec >= 1 && sec <= 15) {
      return sec * 1000;
    }
    return 4000;
  }, [config?.durationSeconds]);

  // If flash screen is disabled by admin, complete immediately
  useEffect(() => {
    if (config?.isEnabled === false && !skipSplash) {
      markSplashGone();
      setIsAnimationComplete(true);
    }
  }, [config?.isEnabled, skipSplash]);

  // Entrance animations and timer
  useEffect(() => {
    if (skipSplash || config?.isEnabled === false) return;

    // Fade in brand container
    Animated.timing(brandOpacity, {
      toValue: 1,
      duration: 350,
      useNativeDriver: true,
    }).start();

    // Staggered entrance
    Animated.stagger(120, [
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 20, friction: 6, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 350, useNativeDriver: true }),
      ]),
    ]).start();

    // Celestial animated loops
    const spinLoop = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 38000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinLoop.start();

    const spinRevLoop = Animated.loop(
      Animated.timing(spinReverseAnim, {
        toValue: 1,
        duration: 52000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spinRevLoop.start();

    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.06, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    glowLoop.start();

    const makeTwinkle = (val: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.2, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    };
    const t1Loop = makeTwinkle(twinkle1, 0);
    const t2Loop = makeTwinkle(twinkle2, 450);
    const t3Loop = makeTwinkle(twinkle3, 900);
    const t4Loop = makeTwinkle(twinkle4, 1350);
    t1Loop.start();
    t2Loop.start();
    t3Loop.start();
    t4Loop.start();

    // Timer completes after exactly durationMs (default 4 seconds)
    const t = setTimeout(() => {
      setBrandDone(true);
    }, durationMs);

    return () => {
      clearTimeout(t);
      spinLoop.stop();
      spinRevLoop.stop();
      glowLoop.stop();
      t1Loop.stop();
      t2Loop.stop();
      t3Loop.stop();
      t4Loop.stop();
    };
  }, [durationMs, skipSplash, config?.isEnabled]);

  // Handle slow loads
  useEffect(() => {
    if (skipSplash || isDataReady) return;
    setIsSlow(false);
    const t = setTimeout(() => setIsSlow(true), SLOW_LOAD_MS);
    return () => clearTimeout(t);
  }, [isDataReady, skipSplash, loadFailed]);

  const canExit = (isReady && isDataReady) || brandDone;

  // Exit transition: when configured duration has played and app is ready
  useEffect(() => {
    if (skipSplash || !brandDone || !canExit) return;

    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      markSplashGone();
      setIsAnimationComplete(true);
    });
  }, [brandDone, canExit, skipSplash]);

  // Responsive device metrics
  const isSmallDevice = windowWidth < 375;
  const isTablet = windowWidth >= 768;
  const ringSize = Math.min(windowWidth * (isTablet ? 0.38 : 0.54), 220);
  // Brand and tagline content
  const displayTitle = config?.brandTitle || 'MySawari';
  const displayTagline = config?.brandTagline || 'Your ride, your way.';

  // Interpolated animated values for celestial rings
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spinReverse = spinReverseAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  // Background and text colors
  const activeBg = FESTIVE_BG;
  const brandTextColor = FESTIVE_INK;
  const brandTaglineColor = FESTIVE_SUB;

  const showProblem = !isDataReady && (loadFailed || isSlow);

  return (
    <View style={styles.container}>
      {/* App renders underneath directly to prevent blank flicker */}
      {children}

      {!isAnimationComplete && config?.isEnabled !== false && (
        <Animated.View
          pointerEvents="auto"
          style={[
            styles.overlay,
            {
              backgroundColor: activeBg,
              opacity: overlayOpacity,
            },
          ]}
        >
          {/* Status bar with dark icons for crisp clarity */}
          <StatusBar barStyle="dark-content" backgroundColor={activeBg} />

          {/* Optional Occasion Poster or Animated Media if uploaded */}
          {config?.bgImageUrl ? (
            <ExpoImage
              source={{ uri: config.bgImageUrl }}
              style={[
                StyleSheet.absoluteFill,
                { opacity: config.bgImageOpacity ?? 0.35 },
              ]}
              contentFit="cover"
              autoplay
            />
          ) : null}

          {/* ======================================================== */}
          {/* MYSAWARI SIGNATURE ANIMATED FLASH SCREEN */}
          {/* ======================================================== */}
          <Animated.View
            style={[
              styles.diwaliContainer,
              {
                paddingTop: insets.top,
                paddingBottom: insets.bottom,
                opacity: brandOpacity,
              },
            ]}
          >
            {/* 1. Top Decorative Garland String Lights */}
            <View pointerEvents="none" style={styles.garlandWrap}>
              <Svg viewBox="0 0 400 70" width="100%" height={Math.min(windowHeight * 0.12, 72)} preserveAspectRatio="xMidYMin meet">
                <Path d="M0 4 Q100 40 200 14 Q300 -8 400 26" fill="none" stroke={FESTIVE_LINE} strokeWidth={1.2} />
                <AnimatedG opacity={twinkle1} fill={FESTIVE_GOLD}>
                  <Path d="M30 15 l4 7 l-4 7 l-4 -7 Z" />
                  <Path d="M255 6 l4 7 l-4 7 l-4 -7 Z" />
                </AnimatedG>
                <AnimatedG opacity={twinkle2} fill={FESTIVE_GOLD}>
                  <Path d="M165 20 l4 7 l-4 7 l-4 -7 Z" />
                  <Path d="M388 22 l4 7 l-4 7 l-4 -7 Z" />
                </AnimatedG>
                <AnimatedG opacity={twinkle3} fill={FESTIVE_GOLD}>
                  <Path d="M75 25 l4 7 l-4 7 l-4 -7 Z" />
                  <Path d="M300 6 l4 7 l-4 7 l-4 -7 Z" />
                </AnimatedG>
                <AnimatedG opacity={twinkle4} fill={FESTIVE_GOLD}>
                  <Path d="M120 27 l4 7 l-4 7 l-4 -7 Z" />
                  <Path d="M210 12 l4 7 l-4 7 l-4 -7 Z" />
                  <Path d="M345 12 l4 7 l-4 7 l-4 -7 Z" />
                </AnimatedG>
              </Svg>
            </View>

            {/* 2. Twinkling 4-Point Sparkle Stars */}
            <Animated.View pointerEvents="none" style={[styles.starAbsolute, { top: '22%', left: '11%', opacity: twinkle2 }]}>
              <Svg viewBox="0 0 10 10" width={13} height={13}>
                <Path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill={FESTIVE_GOLD} />
              </Svg>
            </Animated.View>
            <Animated.View pointerEvents="none" style={[styles.starAbsolute, { top: '30%', right: '12%', opacity: twinkle4 }]}>
              <Svg viewBox="0 0 10 10" width={16} height={16}>
                <Path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill={FESTIVE_GOLD} />
              </Svg>
            </Animated.View>
            <Animated.View pointerEvents="none" style={[styles.starAbsolute, { bottom: '26%', left: '14%', opacity: twinkle1 }]}>
              <Svg viewBox="0 0 10 10" width={12} height={12}>
                <Path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill={FESTIVE_GOLD} />
              </Svg>
            </Animated.View>
            <Animated.View pointerEvents="none" style={[styles.starAbsolute, { bottom: '33%', right: '11%', opacity: twinkle3 }]}>
              <Svg viewBox="0 0 10 10" width={14} height={14}>
                <Path d="M5 0 L6 4 L10 5 L6 6 L5 10 L4 6 L0 5 L4 4 Z" fill={FESTIVE_GOLD} />
              </Svg>
            </Animated.View>

            {/* 3. Center Orbiting Celestial Rings, Halo & Brand Typography */}
            <View style={styles.diwaliCenterBlock}>
              <View style={[styles.ringsWrap, { width: ringSize, height: ringSize }]}>
                {/* Soft Radial Halo */}
                <Animated.View
                  style={[
                    styles.haloGlow,
                    {
                      width: ringSize * 0.94,
                      height: ringSize * 0.94,
                      borderRadius: ringSize * 0.47,
                      transform: [{ scale: glowScale }],
                    },
                  ]}
                />

                {/* Outer Clockwise Dashed Golden Ring with Markers */}
                <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', transform: [{ rotate: spin }] }]}>
                  <Svg viewBox="0 0 200 200" width={ringSize} height={ringSize}>
                    <Circle cx="100" cy="100" r="96" fill="none" stroke={FESTIVE_GOLD} strokeWidth={1.6} strokeDasharray="1.5 8" strokeLinecap="round" />
                    <G fill={FESTIVE_GOLD}>
                      <Path d="M100 0 l3 6 l-3 6 l-3 -6 Z" />
                      <Path d="M200 100 l-6 3 l-6 -3 l6 -3 Z" />
                      <Path d="M100 200 l3 -6 l-3 -6 l-3 6 Z" />
                      <Path d="M0 100 l6 3 l6 -3 l-6 -3 Z" />
                    </G>
                  </Svg>
                </Animated.View>

                {/* Inner Counter-Clockwise Dot Ring */}
                <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', transform: [{ rotate: spinReverse }] }]}>
                  <Svg viewBox="0 0 200 200" width={ringSize * 0.86} height={ringSize * 0.86}>
                    <Circle cx="100" cy="100" r="97" fill="none" stroke={FESTIVE_LINE} strokeWidth={1} />
                    <G fill={FESTIVE_LINE}>
                      <Circle cx="100" cy="3" r="2.5" />
                      <Circle cx="197" cy="100" r="2.5" />
                      <Circle cx="100" cy="197" r="2.5" />
                      <Circle cx="3" cy="100" r="2.5" />
                      <Circle cx="168.6" cy="31.4" r="2" />
                      <Circle cx="168.6" cy="168.6" r="2" />
                      <Circle cx="31.4" cy="168.6" r="2" />
                      <Circle cx="31.4" cy="31.4" r="2" />
                    </G>
                  </Svg>
                </Animated.View>

                {/* MySawari Brand Emblem Logo */}
                <Animated.Image
                  source={require('@/assets/images/diwali_splash/e4dbf1fccac9f7627d383d6daa9ade36.png')}
                  style={[
                    styles.diwaliEmblem,
                    {
                      width: ringSize * 0.48,
                      height: ringSize * 0.48,
                      opacity: logoOpacity,
                      transform: [{ scale: logoScale }],
                    },
                  ]}
                  resizeMode="contain"
                />
              </View>

              {/* 4. Brand Typography */}
              <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], marginTop: 18 }}>
                <Text style={[styles.diwaliBrandTitle, { fontSize: isSmallDevice ? 34 : isTablet ? 46 : 40 }]}>
                  {displayTitle}
                </Text>
              </Animated.View>

              <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineY }], marginTop: 8 }}>
                <Text style={[styles.diwaliBrandTagline, { fontSize: isSmallDevice ? 15 : isTablet ? 19 : 17 }]}>
                  {displayTagline}
                </Text>
              </Animated.View>
            </View>

            {/* Fallback actions if connection is slow */}
            {showProblem && (
              <View style={[styles.troubleActions, { position: 'absolute', bottom: Math.max(insets.bottom, 16) + 16 }]}>
                {loadFailed && !!onRetry && (
                  <Pressable accessibilityRole="button" onPress={onRetry} style={styles.actionBtn}>
                    <Feather name="refresh-cw" size={13} color="#323E71" />
                    <Text style={styles.actionBtnText}>Retry</Text>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    markSplashGone();
                    setIsAnimationComplete(true);
                  }}
                  style={styles.actionBtn}
                >
                  <Text style={styles.actionBtnText}>Continue</Text>
                  <Feather name="arrow-right" size={13} color="#323E71" />
                </Pressable>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    zIndex: 99999,
  },
  // Diwali Layout Styles
  diwaliContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    width: '100%',
  },
  garlandWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 2,
  },
  starAbsolute: {
    position: 'absolute',
    zIndex: 2,
  },
  diwaliCenterBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 420,
  },
  ringsWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  haloGlow: {
    position: 'absolute',
    backgroundColor: 'rgba(224, 161, 38, 0.16)',
    zIndex: 0,
  },
  diwaliEmblem: {
    zIndex: 3,
  },
  diwaliBrandTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '800',
    color: FESTIVE_INK,
    letterSpacing: -0.8,
    textAlign: 'center',
  },
  diwaliBrandTagline: {
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: FESTIVE_SUB,
    letterSpacing: 0.2,
    textAlign: 'center',
  },

  troubleActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#323E71',
  },
});

