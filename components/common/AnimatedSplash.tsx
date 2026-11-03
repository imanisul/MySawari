import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Image,
  Pressable,
  Easing,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import {
  DEFAULT_FLASH_SCREEN_CONFIG,
  FlashScreenConfig,
  getCachedFlashScreenConfig,
  fetchRemoteFlashScreenConfig,
} from '@/services/api/flashScreen';

// Module-level flag: the splash only shows on the very first cold app launch.
// After login or any navigation within the same session, it is skipped entirely.
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

/**
 * High-End Dynamic Flash Screen:
 *  - Displays "MySawari · Your ride, your way."
 *  - Default duration: exactly 4 seconds (4000ms), controllable dynamically from the Operation App.
 *  - Supports festive / occasion themes (Diwali, Bihu, New Year, Puja, etc.) configured via Operation App.
 *  - Responsive & adaptive layout across all mobile devices, tablets, and screen aspect ratios.
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
  const [skipWaiting, setSkipWaiting] = useState(false);

  // Animated values
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.85)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(18)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(18)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const occasionOpacity = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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
    return 4000; // 4 seconds default
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
      Animated.timing(occasionOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();

    // Gentle pulse loop for the logo mark
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.03,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.98,
          duration: 1200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Progress bar fills over the configured duration
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: durationMs,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Timer completes after exactly durationMs
    const t = setTimeout(() => {
      setBrandDone(true);
    }, durationMs);

    return () => {
      clearTimeout(t);
      pulseLoop.stop();
    };
  }, [durationMs, skipSplash, config?.isEnabled]);

  // Handle slow loads
  useEffect(() => {
    if (skipSplash || isDataReady) return;
    setIsSlow(false);
    const t = setTimeout(() => setIsSlow(true), SLOW_LOAD_MS);
    return () => clearTimeout(t);
  }, [isDataReady, skipSplash, loadFailed]);

  const canExit = (isReady && isDataReady) || skipWaiting || brandDone;

  // Exit transition: when configured duration has played and app is ready
  useEffect(() => {
    if (skipSplash || !brandDone || !canExit) return;

    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 450,
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
  const logoWidth = Math.min(windowWidth * (isTablet ? 0.35 : 0.62), 250);
  const logoHeight = Math.round(logoWidth * 0.48);
  const progressBarWidth = Math.min(windowWidth * 0.45, 160);

  // Dynamic occasion content
  const isOccasionActive = config?.isOccasionActive && Boolean(config?.occasionName || config?.occasionBadge);
  const occasionBadgeText = config?.occasionBadge || '✨ Festive Special';
  const displayTitle = isOccasionActive && config?.occasionName ? config.occasionName : (config?.brandTitle || 'MySawari');
  const displayTagline = isOccasionActive && config?.occasionGreeting ? config.occasionGreeting : (config?.brandTagline || 'Your ride, your way.');
  const displaySubtext = isOccasionActive && config?.occasionSubtext ? config.occasionSubtext : null;

  // Background gradient: fallback to premium deep royal navy
  const activeGradients = (config?.gradientColors && config.gradientColors.length >= 2)
    ? config.gradientColors
    : ['#08142E', '#0A1F4F'];
  const accentColor = config?.accentColor || '#F59E0B';

  const showProblem = !isDataReady && (loadFailed || isSlow);

  return (
    <View style={[styles.container, { backgroundColor: activeGradients[0] }]}>
      {/* App renders underneath directly to prevent white blink on transition */}
      {children}

      {!isAnimationComplete && config?.isEnabled !== false && (
        <Animated.View
          pointerEvents="auto"
          style={[
            styles.overlay,
            {
              opacity: overlayOpacity,
            },
          ]}
        >
          {/* Background Gradient */}
          <LinearGradient
            colors={activeGradients as any}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          {/* Optional Occasion Poster Image with dark vignette */}
          {config?.bgImageUrl ? (
            <Image
              source={{ uri: config.bgImageUrl }}
              style={[
                StyleSheet.absoluteFill,
                { opacity: config.bgImageOpacity ?? 0.3 },
              ]}
              resizeMode="cover"
            />
          ) : null}

          {/* Optional Skip Button (Top Right) */}
          {config?.showSkipButton !== false && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Skip intro"
              onPress={() => {
                setSkipWaiting(true);
                Animated.timing(overlayOpacity, {
                  toValue: 0,
                  duration: 280,
                  easing: Easing.out(Easing.cubic),
                  useNativeDriver: true,
                }).start(() => {
                  markSplashGone();
                  setIsAnimationComplete(true);
                });
              }}
              style={({ pressed }) => [
                styles.skipButton,
                {
                  top: Math.max(insets.top + 12, 18),
                  borderColor: 'rgba(255, 255, 255, 0.28)',
                },
                pressed && { opacity: 0.65 },
              ]}
            >
              <Text style={styles.skipButtonText}>Skip</Text>
              <Feather name="chevron-right" size={13} color="#CBD5E1" />
            </Pressable>
          )}

          {/* Safe Area Container */}
          <Animated.View
            style={[
              styles.centerContent,
              {
                paddingTop: insets.top + 20,
                paddingBottom: insets.bottom + 20,
                opacity: brandOpacity,
              },
            ]}
          >
            {/* Occasion Badge (e.g. 🪔 Happy Diwali / 🌸 Rongali Bihu) */}
            {isOccasionActive && (
              <Animated.View
                style={[
                  styles.occasionBadgePill,
                  {
                    borderColor: accentColor,
                    opacity: occasionOpacity,
                  },
                ]}
              >
                <Text style={[styles.occasionBadgeText, { color: accentColor }]}>
                  {occasionBadgeText}
                </Text>
              </Animated.View>
            )}

            {/* Brand Logo with Spring Scale & Gentle Pulse */}
            <Animated.View
              style={{
                opacity: logoOpacity,
                transform: [
                  { scale: Animated.multiply(logoScale, pulseAnim) },
                ],
              }}
            >
              <Image
                source={require('@/assets/images/MySawari_nobg.png')}
                style={[styles.logoImage, { width: logoWidth, height: logoHeight }]}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Brand Title: MySawari */}
            {config?.showLogo !== false && (
              <Animated.View
                style={{
                  opacity: titleOpacity,
                  transform: [{ translateY: titleY }],
                  marginTop: isSmallDevice ? 4 : 8,
                }}
              >
                <Text
                  style={[
                    styles.titleText,
                    {
                      fontSize: isSmallDevice ? 26 : isTablet ? 38 : 32,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {displayTitle}
                </Text>
              </Animated.View>
            )}

            {/* Tagline: Your ride, your way. */}
            {config?.showTagline !== false && (
              <Animated.View
                style={{
                  opacity: taglineOpacity,
                  transform: [{ translateY: taglineY }],
                  marginTop: isSmallDevice ? 4 : 8,
                  paddingHorizontal: 24,
                }}
              >
                <Text
                  style={[
                    styles.taglineText,
                    {
                      fontSize: isSmallDevice ? 13 : isTablet ? 17 : 15,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {displayTagline}
                </Text>
              </Animated.View>
            )}

            {/* Occasion Subtext (e.g. Special festive discount) */}
            {displaySubtext && (
              <Animated.View style={{ opacity: occasionOpacity, marginTop: 6, paddingHorizontal: 28 }}>
                <Text style={[styles.occasionSubtext, { color: accentColor }]}>
                  {displaySubtext}
                </Text>
              </Animated.View>
            )}

            {/* Dynamic Progress Indicator Bar (lasting configured duration) */}
            {config?.showProgressBar !== false && (
              <View
                style={[
                  styles.progressBarTrack,
                  {
                    width: progressBarWidth,
                    backgroundColor: 'rgba(255, 255, 255, 0.22)',
                  },
                ]}
              >
                <Animated.View
                  style={[
                    styles.progressBarFill,
                    {
                      backgroundColor: accentColor,
                      width: progressAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, progressBarWidth],
                      }),
                    },
                  ]}
                />
              </View>
            )}

            {/* Fallback actions if connection is slow */}
            {showProblem && (
              <View style={styles.troubleActions}>
                {loadFailed && !!onRetry && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Retry"
                    onPress={onRetry}
                    style={({ pressed }) => [
                      styles.actionBtn,
                      { backgroundColor: accentColor },
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Feather name="refresh-cw" size={14} color="#08142E" />
                    <Text style={[styles.actionBtnText, { color: '#08142E' }]}>Retry</Text>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Continue"
                  onPress={() => setSkipWaiting(true)}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    { borderColor: 'rgba(255, 255, 255, 0.4)', borderWidth: 1 },
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Text style={[styles.actionBtnText, { color: '#FFFFFF' }]}>Continue</Text>
                  <Feather name="arrow-right" size={14} color="#FFFFFF" />
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
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 99999,
  },
  skipButton: {
    position: 'absolute',
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.42)',
    borderWidth: 1,
    zIndex: 100000,
  },
  skipButtonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    color: '#E2E8F0',
    letterSpacing: 0.3,
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
    paddingHorizontal: 20,
  },
  occasionBadgePill: {
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.2,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    marginBottom: 16,
  },
  occasionBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  logoImage: {
    maxWidth: 260,
  },
  titleText: {
    fontFamily: 'Inter_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.6,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  taglineText: {
    fontFamily: 'Inter_500Medium',
    color: '#CBD5E1',
    letterSpacing: 0.4,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  occasionSubtext: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.2,
    textAlign: 'center',
    lineHeight: 16,
  },
  progressBarTrack: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 24,
  },
  progressBarFill: {
    height: 3,
    borderRadius: 2,
  },
  troubleActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  actionBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
});
