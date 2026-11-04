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

// MySawari signature brand color extracted directly from the logo mark
const BRAND_LOGO_COLOR = '#323E71';

/**
 * High-End Dynamic Flash Screen:
 *  - Pure white background screen with MySawari logo and brand name.
 *  - Text rendered in #323E71 (the exact signature color of the logo).
 *  - Clean presentation: no loading spinner/bar, no skip button.
 *  - 4-second duration (controllable dynamically from Operation App).
 *  - Smooth fade-in and exit transitions, adapting across all device aspect ratios.
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

  // Animated values
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.88)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(16)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const taglineY = useRef(new Animated.Value(16)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const occasionOpacity = useRef(new Animated.Value(0)).current;
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

    // Subtle gentle pulse loop for the logo mark
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.025,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.985,
          duration: 1300,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Timer completes after exactly durationMs (default 4 seconds)
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
  const logoSize = Math.min(windowWidth * (isTablet ? 0.3 : 0.44), 170);

  // Dynamic occasion content
  const isOccasionActive = config?.isOccasionActive && Boolean(config?.occasionName || config?.occasionBadge);
  const occasionBadgeText = config?.occasionBadge || '✨ Festive Special';
  const displayTitle = isOccasionActive && config?.occasionName ? config.occasionName : (config?.brandTitle || 'MySawari');
  const displayTagline = isOccasionActive && config?.occasionGreeting ? config.occasionGreeting : (config?.brandTagline || 'Your ride, your way.');
  const displaySubtext = isOccasionActive && config?.occasionSubtext ? config.occasionSubtext : null;

  // Background is pure clean white as requested
  const isCustomFestive = isOccasionActive && config?.gradientColors && config.gradientColors.length >= 2 && config.gradientColors[0] !== '#08142E';
  const activeGradients = isCustomFestive ? config.gradientColors : ['#FFFFFF', '#FFFFFF'];
  const brandTextColor = isCustomFestive ? (config?.primaryColor || BRAND_LOGO_COLOR) : BRAND_LOGO_COLOR;
  const brandTaglineColor = isCustomFestive ? (config?.accentColor || BRAND_LOGO_COLOR) : BRAND_LOGO_COLOR;
  const accentColor = config?.accentColor || BRAND_LOGO_COLOR;

  const showProblem = !isDataReady && (loadFailed || isSlow);

  return (
    <View style={styles.container}>
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
          {/* Status bar with dark icons for crisp readability on white screen */}
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          {/* Background Gradient / Solid White */}
          <LinearGradient
            colors={activeGradients as any}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
          />

          {/* Optional Occasion Poster Image if active */}
          {isCustomFestive && config?.bgImageUrl ? (
            <Image
              source={{ uri: config.bgImageUrl }}
              style={[
                StyleSheet.absoluteFill,
                { opacity: config.bgImageOpacity ?? 0.25 },
              ]}
              resizeMode="cover"
            />
          ) : null}

          {/* Centered Brand Content */}
          <Animated.View
            style={[
              styles.centerContent,
              {
                paddingTop: insets.top + 24,
                paddingBottom: insets.bottom + 24,
                opacity: brandOpacity,
              },
            ]}
          >
            {/* Occasion Badge (if festive occasion active) */}
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
                style={[styles.logoImage, { width: logoSize, height: logoSize }]}
                resizeMode="contain"
              />
            </Animated.View>

            {/* Brand Title: MySawari - Text colored in exact logo color #323E71 */}
            {config?.showLogo !== false && (
              <Animated.View
                style={{
                  opacity: titleOpacity,
                  transform: [{ translateY: titleY }],
                  marginTop: isSmallDevice ? 10 : 14,
                }}
              >
                <Text
                  style={[
                    styles.titleText,
                    {
                      fontSize: isSmallDevice ? 28 : isTablet ? 38 : 32,
                      color: brandTextColor,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {displayTitle}
                </Text>
              </Animated.View>
            )}

            {/* Tagline: Your ride, your way. - Text colored in logo tone */}
            {config?.showTagline !== false && (
              <Animated.View
                style={{
                  opacity: taglineOpacity,
                  transform: [{ translateY: taglineY }],
                  marginTop: isSmallDevice ? 6 : 8,
                  paddingHorizontal: 24,
                }}
              >
                <Text
                  style={[
                    styles.taglineText,
                    {
                      fontSize: isSmallDevice ? 13 : isTablet ? 17 : 15,
                      color: brandTaglineColor,
                    },
                  ]}
                  numberOfLines={2}
                >
                  {displayTagline}
                </Text>
              </Animated.View>
            )}

            {/* Occasion Subtext (if active) */}
            {displaySubtext && (
              <Animated.View style={{ opacity: occasionOpacity, marginTop: 8, paddingHorizontal: 28 }}>
                <Text style={[styles.occasionSubtext, { color: accentColor }]}>
                  {displaySubtext}
                </Text>
              </Animated.View>
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
                      pressed && { opacity: 0.75 },
                    ]}
                  >
                    <Feather name="refresh-cw" size={14} color="#323E71" />
                    <Text style={[styles.actionBtnText, { color: '#323E71' }]}>Retry</Text>
                  </Pressable>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Continue"
                  onPress={() => {
                    markSplashGone();
                    setIsAnimationComplete(true);
                  }}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    pressed && { opacity: 0.75 },
                  ]}
                >
                  <Text style={[styles.actionBtnText, { color: '#323E71' }]}>Continue</Text>
                  <Feather name="arrow-right" size={14} color="#323E71" />
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
    backgroundColor: '#F8FAFC',
    marginBottom: 16,
  },
  occasionBadgeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  logoImage: {
    maxWidth: 200,
  },
  titleText: {
    fontFamily: 'Inter_700Bold',
    color: BRAND_LOGO_COLOR,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  taglineText: {
    fontFamily: 'Inter_500Medium',
    color: BRAND_LOGO_COLOR,
    opacity: 0.85,
    letterSpacing: 0.3,
    textAlign: 'center',
  },
  occasionSubtext: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    letterSpacing: 0.2,
    textAlign: 'center',
    lineHeight: 16,
  },
  troubleActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 28,
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
  },
});
