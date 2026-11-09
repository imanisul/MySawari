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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image as ExpoImage } from 'expo-image';
import {
  FlashScreenConfig,
  getCachedFlashScreenConfig,
  fetchRemoteFlashScreenConfig,
  getSynchronousFlashScreenConfig,
  subscribeToFlashScreenUpdates,
} from '@/services/api/flashScreen';

const AnimatedG = Animated.createAnimatedComponent(G);

// Module-level flag: the splash only shows on the very first cold app launch per session.
let hasShownSplash = false;

// Screens that must not animate while the launch overlay still covers them subscribe here.
const splashGoneListeners = new Set<() => void>();

/** Runs `cb` once the launch splash is off screen — immediately if it already is. */
export function onSplashGone(cb: () => void): () => void {
  if (hasShownSplash) {
    cb();
    return () => {};
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

// After this long without ready signal, show retry / continue action
const SLOW_LOAD_MS = 10000;

export type SplashStep = { key: string; label: string; done: boolean };

// MySawari signature brand colors & Senior Designer Diwali Palette
const FESTIVE_BG = '#FCFBF7';
const FESTIVE_INK = '#1C2A53';
const FESTIVE_SUB = '#5A6689';
const FESTIVE_MUTED = '#8C97B2';
const FESTIVE_LINE = '#EAD5B0';
const FESTIVE_GOLD = '#D49A3D';
const FESTIVE_GOLD_DARK = '#B45309';
const FESTIVE_AMBER = '#E08714';
const FESTIVE_HALO = 'rgba(212, 154, 61, 0.14)';

/**
 * High-End Dynamic Splash Screen:
 *  - Mode 1: Senior Designer Diwali Special / Festive Animated Mode:
 *      * Top toran hanging garland arch with marigold bells and sparkling sacred lamps.
 *      * Twinkling 4-point auspicious gold stars.
 *      * Centerpiece concentric rotating gold mandala geometry (clockwise dashed orbit + counter-clockwise petals).
 *      * Authentic MySawari monogram emblem with soft breathing golden halo aura.
 *      * Handcrafted brass Diya with living flickering sinusoidal flame.
 *      * "✦ HAPPY DIWALI ✦" ribbon and "Festival of Lights • Lighting Every Journey".
 *      * Bottom grounding sacred lotus petal arc.
 *  - Mode 2: Custom Admin Uploaded Splash Screen (when uploaded and festive mode is off).
 *  - Mode 3: Signature Classic MySawari Branding.
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
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();

  const skipSplash = useRef(hasShownSplash).current;
  const [isAnimationComplete, setIsAnimationComplete] = useState(skipSplash);
  const [config, setConfig] = useState<FlashScreenConfig>(getSynchronousFlashScreenConfig);
  const [customImageError, setCustomImageError] = useState(false);
  const [brandDone, setBrandDone] = useState(false);
  const [isSlow, setIsSlow] = useState(false);
  const entranceStartedRef = useRef(false);

  // Common animated values
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(12)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(12)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // Celestial / Signature Diwali animation values
  const spinAnim = useRef(new Animated.Value(0)).current;
  const spinReverseAnim = useRef(new Animated.Value(0)).current;
  const twinkle1 = useRef(new Animated.Value(0.2)).current;
  const twinkle2 = useRef(new Animated.Value(0.2)).current;
  const twinkle3 = useRef(new Animated.Value(0.2)).current;
  const twinkle4 = useRef(new Animated.Value(0.2)).current;
  const glowScale = useRef(new Animated.Value(1)).current;
  const flameAnim = useRef(new Animated.Value(0)).current;

  // Hydrate local cache and subscribe to remote updates
  useEffect(() => {
    let active = true;

    getCachedFlashScreenConfig()
      .then((cached) => {
        if (active && cached) {
          setConfig(cached);
        }
      })
      .catch(() => {});

    const unsubscribe = subscribeToFlashScreenUpdates((fresh) => {
      if (active && fresh) {
        setConfig(fresh);
      }
    });

    fetchRemoteFlashScreenConfig().catch(() => {});

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Brand splash is capped at 1.2s whatever the Operation app's Flash screen setting says; it exits earlier once data is ready.
  const durationMs = useMemo(() => {
    const sec = Number(config?.durationSeconds);
    return !isNaN(sec) && sec >= 1 && sec <= 12 ? Math.min(sec * 1000, 1200) : 1200;
  }, [config?.durationSeconds]);

  // If splash screen is explicitly disabled by admin, complete immediately
  useEffect(() => {
    if (config?.isEnabled === false && !skipSplash) {
      markSplashGone();
      setIsAnimationComplete(true);
    }
  }, [config?.isEnabled, skipSplash]);

  // Entrance & Loop animations
  useEffect(() => {
    if (skipSplash || config?.isEnabled === false || entranceStartedRef.current) return;
    entranceStartedRef.current = true;

    // Fade in brand container
    Animated.timing(brandOpacity, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();

    // Staggered entrance for logo, title & tagline
    Animated.stagger(60, [
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, tension: 22, friction: 6, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(taglineY, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]),
    ]).start();

    // Rotating celestial loops
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

    // Breathing glow aura
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowScale, { toValue: 1.07, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(glowScale, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    glowLoop.start();

    // Living diya flame flicker
    const flameLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(flameAnim, { toValue: 1, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(flameAnim, { toValue: 0, duration: 650, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    flameLoop.start();

    // Twinkling 4-point stars
    const makeTwinkle = (val: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
          Animated.timing(val, { toValue: 0.2, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        ])
      );
    };
    const t1 = makeTwinkle(twinkle1, 0);
    const t2 = makeTwinkle(twinkle2, 450);
    const t3 = makeTwinkle(twinkle3, 900);
    const t4 = makeTwinkle(twinkle4, 1350);
    t1.start();
    t2.start();
    t3.start();
    t4.start();

    return () => {
      spinLoop.stop();
      spinRevLoop.stop();
      glowLoop.stop();
      flameLoop.stop();
      t1.stop();
      t2.stop();
      t3.stop();
      t4.stop();
    };
  }, [skipSplash, config?.isEnabled]);

  // Duration timer
  useEffect(() => {
    if (skipSplash || config?.isEnabled === false || brandDone) return;
    const t = setTimeout(() => {
      setBrandDone(true);
    }, durationMs);
    return () => clearTimeout(t);
  }, [durationMs, skipSplash, config?.isEnabled, brandDone]);

  // Handle slow loads
  useEffect(() => {
    if (skipSplash || isDataReady) return;
    setIsSlow(false);
    const t = setTimeout(() => setIsSlow(true), SLOW_LOAD_MS);
    return () => clearTimeout(t);
  }, [isDataReady, skipSplash, loadFailed]);

  const canExit = (isReady && isDataReady) || brandDone;

  // Smooth exit fade transition
  useEffect(() => {
    if (skipSplash || !brandDone || !canExit) return;

    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 240,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      markSplashGone();
      setIsAnimationComplete(true);
    });
  }, [brandDone, canExit, skipSplash, overlayOpacity]);

  // Responsive device metrics
  const isSmallDevice = windowWidth < 375;
  const isTablet = windowWidth >= 768;
  const ringSize = Math.min(windowWidth * (isTablet ? 0.38 : 0.54), 220);

  // Content values
  const displayTitle = config?.brandTitle || 'MySawari';
  const displayTagline = config?.occasionGreeting || config?.brandTagline || 'Festival of Lights • Lighting Every Journey';
  const displayBadge = config?.occasionBadge || '✦ HAPPY DIWALI ✦';

  // Interpolated animated values for celestial rings
  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const spinReverse = spinReverseAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-360deg'] });

  // Living flame breathing animations
  const flameScaleY = flameAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1.09, 0.95],
  });
  const flameScaleX = flameAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.94, 1.05],
  });
  const flameTranslateY = flameAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, -1.8, 0.4],
  });

  // Mode Selection:
  // Festive mode is active if:
  // - isOccasionActive is true (default during Diwali)
  // - OR occasionTheme is diwali_animated / diwali_gold
  // - OR animationStyle is diwali_animated
  // - OR no custom static image was uploaded
  const isFestiveMode = Boolean(
    config?.isOccasionActive ||
    config?.occasionTheme === 'diwali_animated' ||
    config?.occasionTheme === 'diwali_gold' ||
    config?.animationStyle === 'diwali_animated' ||
    (!config?.imageUrl && !config?.bgImageUrl && config?.isOccasionActive !== false)
  );

  const hasCustomActiveImage = Boolean(
    !isFestiveMode && config?.isActive && (config?.imageUrl || config?.bgImageUrl) && !customImageError
  );

  const activeBg = isFestiveMode ? FESTIVE_BG : (config?.backgroundColor || '#FFFFFF');
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
          <StatusBar barStyle="dark-content" backgroundColor={activeBg} />

          {/* ======================================================== */}
          {/* MODE 1: SENIOR DESIGNER DIWALI SPECIAL / FESTIVE MODE     */}
          {/* ======================================================== */}
          {isFestiveMode ? (
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
              {/* 1. Auspicious Top Toran Canopy with Hanging Marigold Bells & Lights */}
              <View pointerEvents="none" style={styles.garlandWrap}>
                <Svg viewBox="0 0 400 68" width="100%" height={Math.min(windowHeight * 0.11, 70)} preserveAspectRatio="xMidYMin meet">
                  {/* Delicate festive garland arch */}
                  <Path d="M 0 6 Q 100 28 200 12 Q 300 -4 400 22" fill="none" stroke={FESTIVE_LINE} strokeWidth={1.2} />

                  {/* Left Bell */}
                  <Path d="M 50 17 L 50 34" stroke={FESTIVE_LINE} strokeWidth={1} />
                  <AnimatedG opacity={twinkle1}>
                    <Circle cx="50" cy="36" r="3" fill={FESTIVE_AMBER} />
                    <Path d="M 46 40 L 54 40 L 52 46 L 48 46 Z" fill={FESTIVE_GOLD} />
                  </AnimatedG>

                  {/* Left-center Marigold Droplet */}
                  <Path d="M 120 22 L 120 38" stroke={FESTIVE_LINE} strokeWidth={1} />
                  <AnimatedG opacity={twinkle3}>
                    <Circle cx="120" cy="40" r="3.5" fill={FESTIVE_GOLD} />
                    <Circle cx="120" cy="40" r="1.5" fill="#FFFBEB" />
                  </AnimatedG>

                  {/* Center Sacred Hanging Motif */}
                  <Path d="M 200 12 L 200 32" stroke={FESTIVE_LINE} strokeWidth={1} />
                  <AnimatedG opacity={twinkle2}>
                    <Path d="M 200 32 L 204 38 L 200 44 L 196 38 Z" fill={FESTIVE_GOLD} />
                    <Circle cx="200" cy="48" r="2.2" fill={FESTIVE_AMBER} />
                  </AnimatedG>

                  {/* Right-center Marigold Droplet */}
                  <Path d="M 280 8 L 280 26" stroke={FESTIVE_LINE} strokeWidth={1} />
                  <AnimatedG opacity={twinkle4}>
                    <Circle cx="280" cy="28" r="3.5" fill={FESTIVE_GOLD} />
                    <Circle cx="280" cy="28" r="1.5" fill="#FFFBEB" />
                  </AnimatedG>

                  {/* Right Bell */}
                  <Path d="M 350 17 L 350 35" stroke={FESTIVE_LINE} strokeWidth={1} />
                  <AnimatedG opacity={twinkle1}>
                    <Circle cx="350" cy="37" r="3" fill={FESTIVE_AMBER} />
                    <Path d="M 346 41 L 354 41 L 352 47 L 348 47 Z" fill={FESTIVE_GOLD} />
                  </AnimatedG>
                </Svg>
              </View>

              {/* 2. Soft Twinkling Auspicious 4-Point Stars */}
              <Animated.View pointerEvents="none" style={[styles.starAbsolute, { top: '18%', left: '11%', opacity: twinkle2 }]}>
                <Svg viewBox="0 0 12 12" width={13} height={13}>
                  <Path d="M6 0 L7.2 4.8 L12 6 L7.2 7.2 L6 12 L4.8 7.2 L0 6 L4.8 4.8 Z" fill={FESTIVE_GOLD} />
                </Svg>
              </Animated.View>
              <Animated.View pointerEvents="none" style={[styles.starAbsolute, { top: '24%', right: '13%', opacity: twinkle4 }]}>
                <Svg viewBox="0 0 12 12" width={15} height={15}>
                  <Path d="M6 0 L7.2 4.8 L12 6 L7.2 7.2 L6 12 L4.8 7.2 L0 6 L4.8 4.8 Z" fill={FESTIVE_GOLD} />
                </Svg>
              </Animated.View>
              <Animated.View pointerEvents="none" style={[styles.starAbsolute, { bottom: '24%', left: '13%', opacity: twinkle1 }]}>
                <Svg viewBox="0 0 12 12" width={12} height={12}>
                  <Path d="M6 0 L7.2 4.8 L12 6 L7.2 7.2 L6 12 L4.8 7.2 L0 6 L4.8 4.8 Z" fill={FESTIVE_GOLD} />
                </Svg>
              </Animated.View>
              <Animated.View pointerEvents="none" style={[styles.starAbsolute, { bottom: '28%', right: '11%', opacity: twinkle3 }]}>
                <Svg viewBox="0 0 12 12" width={14} height={14}>
                  <Path d="M6 0 L7.2 4.8 L12 6 L7.2 7.2 L6 12 L4.8 7.2 L0 6 L4.8 4.8 Z" fill={FESTIVE_GOLD} />
                </Svg>
              </Animated.View>

              {/* 3. Centerpiece Block: Sacred Mandala Halo + MySawari Emblem + Handcrafted Diya */}
              <View style={styles.diwaliCenterBlock}>
                {/* Festive Occasion Header Ribbon */}
                <Animated.View style={[styles.festiveBadgeRow, { opacity: titleOpacity }]}>
                  <View style={styles.festiveBadgeLine} />
                  <Text style={styles.festiveBadgeText}>{displayBadge}</Text>
                  <View style={styles.festiveBadgeLine} />
                </Animated.View>

                {/* Concentric Rotating Mandala Geometry + Authentic Brand Emblem */}
                <View style={[styles.ringsWrap, { width: ringSize, height: ringSize, marginTop: 14 }]}>
                  {/* Soft Breathing Golden Aura */}
                  <Animated.View
                    style={[
                      styles.haloGlow,
                      {
                        width: ringSize * 0.95,
                        height: ringSize * 0.95,
                        borderRadius: (ringSize * 0.95) / 2,
                        transform: [{ scale: glowScale }],
                      },
                    ]}
                  />

                  {/* Outer Clockwise Delicate Dashed Gold Ring with 4 Cardinal Diamonds */}
                  <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', transform: [{ rotate: spin }] }]}>
                    <Svg viewBox="0 0 200 200" width={ringSize} height={ringSize}>
                      <Circle cx="100" cy="100" r="95" fill="none" stroke={FESTIVE_GOLD} strokeWidth={1.4} strokeDasharray="3 7" strokeLinecap="round" />
                      <G fill={FESTIVE_GOLD}>
                        <Path d="M100 0 L103 5 L100 10 L97 5 Z" />
                        <Path d="M200 100 L195 103 L190 100 L195 97 Z" />
                        <Path d="M100 200 L103 195 L100 190 L97 195 Z" />
                        <Path d="M0 100 L5 103 L10 100 L5 97 Z" />
                      </G>
                    </Svg>
                  </Animated.View>

                  {/* Inner Counter-Clockwise Auspicious Petal Ring */}
                  <Animated.View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', transform: [{ rotate: spinReverse }] }]}>
                    <Svg viewBox="0 0 200 200" width={ringSize * 0.86} height={ringSize * 0.86}>
                      <Circle cx="100" cy="100" r="96" fill="none" stroke={FESTIVE_LINE} strokeWidth={0.9} />
                      <G fill={FESTIVE_GOLD}>
                        <Circle cx="100" cy="4" r="2.2" />
                        <Circle cx="196" cy="100" r="2.2" />
                        <Circle cx="100" cy="196" r="2.2" />
                        <Circle cx="4" cy="100" r="2.2" />
                        <Circle cx="167.9" cy="32.1" r="1.8" />
                        <Circle cx="167.9" cy="167.9" r="1.8" />
                        <Circle cx="32.1" cy="167.9" r="1.8" />
                        <Circle cx="32.1" cy="32.1" r="1.8" />
                      </G>
                    </Svg>
                  </Animated.View>

                  {/* The Authentic MySawari Monogram Emblem */}
                  <Animated.Image
                    source={require('@/assets/images/MySawari_nobg.png')}
                    style={[
                      styles.diwaliEmblem,
                      {
                        width: ringSize * 0.54,
                        height: ringSize * 0.54,
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }],
                      },
                    ]}
                    resizeMode="contain"
                  />
                </View>

                {/* 4. Handcrafted Traditional Diya (Living Sacred Flame) */}
                <Animated.View
                  style={[
                    styles.diwaliDiyaWrap,
                    {
                      opacity: logoOpacity,
                      transform: [{ scale: logoScale }],
                    },
                  ]}
                >
                  <Svg viewBox="0 0 80 50" width={isSmallDevice ? 64 : 74} height={isSmallDevice ? 40 : 46}>
                    {/* Soft Warmth under Diya */}
                    <Circle cx="40" cy="36" r="24" fill={FESTIVE_HALO} />

                    {/* Terracotta Brass Bowl */}
                    <Path
                      d="M 16 28 C 26 34, 54 34, 64 28 C 67 31, 64 36, 57 41 C 48 45, 32 45, 23 41 C 16 36, 13 31, 16 28 Z"
                      fill="#B45309"
                      stroke="#92400E"
                      strokeWidth={0.8}
                    />
                    {/* Golden Bowl Rim Highlight */}
                    <Path
                      d="M 16 28 C 26 33, 54 33, 64 28 C 54 30, 26 30, 16 28 Z"
                      fill={FESTIVE_GOLD}
                    />
                  </Svg>

                  {/* Living Flame with Gentle sin-wave Flicker */}
                  <Animated.View
                    style={[
                      styles.flameAbsolute,
                      {
                        transform: [
                          { translateY: flameTranslateY },
                          { scaleY: flameScaleY },
                          { scaleX: flameScaleX },
                        ],
                      },
                    ]}
                  >
                    <Svg viewBox="0 0 40 30" width={isSmallDevice ? 32 : 36} height={isSmallDevice ? 24 : 28}>
                      {/* Outer Warm Amber Flame */}
                      <Path
                        d="M 20 2 C 26 10, 28 15, 24 20 C 22 22, 18 22, 16 20 C 12 15, 14 10, 20 2 Z"
                        fill="#F59E0B"
                      />
                      {/* Inner Sacred Radiant Core */}
                      <Path
                        d="M 20 6 C 23 12, 25 15, 22 18 C 21 19, 19 19, 18 18 C 15 15, 17 12, 20 6 Z"
                        fill="#FFFBEB"
                      />
                    </Svg>
                  </Animated.View>
                </Animated.View>

                {/* 5. Brand Typography Hierarchy */}
                <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }], marginTop: 8 }}>
                  <Text style={[styles.diwaliBrandTitle, { fontSize: isSmallDevice ? 32 : isTablet ? 44 : 38 }]}>
                    {displayTitle}
                  </Text>
                </Animated.View>

                <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineY }], marginTop: 6 }}>
                  <Text style={[styles.diwaliBrandTagline, { fontSize: isSmallDevice ? 14 : isTablet ? 18 : 16 }]}>
                    {displayTagline}
                  </Text>
                </Animated.View>

                {config?.occasionSubtext ? (
                  <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineY }], marginTop: 4 }}>
                    <Text style={styles.diwaliOccasionSubtext}>
                      {config.occasionSubtext}
                    </Text>
                  </Animated.View>
                ) : null}
              </View>

              {/* 6. Auspicious Bottom Grounding Lotus Petal Arc */}
              <View pointerEvents="none" style={styles.bottomLotusWrap}>
                <Svg viewBox="0 0 240 36" width={Math.min(windowWidth * 0.6, 220)} height={32} preserveAspectRatio="xMidYMax meet">
                  <Path
                    d="M 20 34 Q 120 12 220 34"
                    fill="none"
                    stroke={FESTIVE_LINE}
                    strokeWidth={1}
                  />
                  <Path
                    d="M 60 34 Q 120 20 180 34"
                    fill="none"
                    stroke={FESTIVE_GOLD}
                    strokeWidth={0.8}
                    strokeDasharray="2 4"
                  />
                  <Circle cx="120" cy="18" r="2.5" fill={FESTIVE_GOLD} />
                </Svg>
              </View>
            </Animated.View>
          ) : hasCustomActiveImage ? (
            /* ======================================================== */
            /* MODE 2: CUSTOM ADMIN UPLOADED SPLASH IMAGE               */
            /* ======================================================== */
            <ExpoImage
              source={{ uri: config.imageUrl || config.bgImageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="high"
              onError={() => {
                setCustomImageError(true);
              }}
            />
          ) : (
            /* ======================================================== */
            /* MODE 3: SIGNATURE CLASSIC SPLASH                         */
            /* ======================================================== */
            <View style={styles.classicContainer}>
              <Image
                source={require('@/assets/images/splash_final.png')}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Fallback trouble actions if connection is completely unresponsive */}
          {showProblem && (
            <View
              style={[
                styles.troubleActions,
                {
                  position: 'absolute',
                  bottom: Math.max(insets.bottom, 16) + 16,
                },
              ]}
            >
              {loadFailed && !!onRetry && (
                <Pressable
                  accessibilityRole="button"
                  onPress={onRetry}
                  style={styles.actionBtn}
                >
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
    zIndex: 99999,
  },
  classicContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
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
    backgroundColor: FESTIVE_HALO,
    zIndex: 0,
  },
  festiveBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  festiveBadgeLine: {
    width: 22,
    height: 1,
    backgroundColor: FESTIVE_GOLD,
    opacity: 0.65,
  },
  festiveBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: FESTIVE_GOLD_DARK,
    letterSpacing: 3.5,
    textTransform: 'uppercase',
  },
  diwaliEmblem: {
    zIndex: 3,
  },
  diwaliDiyaWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -8,
    position: 'relative',
    zIndex: 4,
  },
  flameAbsolute: {
    position: 'absolute',
    top: -3,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  diwaliBrandTitle: {
    fontFamily: 'Inter_700Bold',
    fontWeight: '800',
    color: FESTIVE_INK,
    letterSpacing: -0.6,
    textAlign: 'center',
  },
  diwaliBrandTagline: {
    fontFamily: 'Inter_500Medium',
    fontWeight: '500',
    color: FESTIVE_SUB,
    letterSpacing: 0.25,
    textAlign: 'center',
  },
  diwaliOccasionSubtext: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12.5,
    color: FESTIVE_MUTED,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  bottomLotusWrap: {
    position: 'absolute',
    bottom: 14,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  troubleActions: {
    flexDirection: 'row',
    alignSelf: 'center',
    gap: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#323E71',
  },
});
