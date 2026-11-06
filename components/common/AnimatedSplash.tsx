import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Image,
  Easing,
  StatusBar,
  Pressable,
  Text,
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  DEFAULT_FLASH_SCREEN_CONFIG,
  FlashScreenConfig,
  getCachedFlashScreenConfig,
  fetchRemoteFlashScreenConfig,
  getSynchronousFlashScreenConfig,
  subscribeToFlashScreenUpdates,
} from '@/services/api/flashScreen';

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

/**
 * Dynamic Single Splash Screen:
 * - Exactly ONE active splash screen.
 * - Displays active uploaded image full-screen if configured and active.
 * - Otherwise displays the default high-resolution MySawari splash screen.
 * - Local disk caching with version-based invalidation.
 * - Seamless graceful offline fallback without blocking app startup.
 * - Lightweight, smooth fade exit transition.
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
  const skipSplash = useRef(hasShownSplash).current;
  const [isAnimationComplete, setIsAnimationComplete] = useState(skipSplash);
  const [config, setConfig] = useState<FlashScreenConfig>(getSynchronousFlashScreenConfig);
  const [customImageError, setCustomImageError] = useState(false);
  const [brandDone, setBrandDone] = useState(false);
  const [isSlow, setIsSlow] = useState(false);

  // Common animated values for lightweight fade
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // Hydrate local cache and subscribe to remote updates
  useEffect(() => {
    let active = true;

    // Load cached config immediately
    getCachedFlashScreenConfig()
      .then((cached) => {
        if (active && cached) {
          setConfig(cached);
        }
      })
      .catch(() => {});

    // Listen to updates if fresh remote arrives
    const unsubscribe = subscribeToFlashScreenUpdates((fresh) => {
      if (active && fresh) {
        setConfig(fresh);
      }
    });

    // Check remote in background
    fetchRemoteFlashScreenConfig().catch(() => {});

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  // Compute duration in ms: default 2.5 - 3 seconds (2500ms - 3000ms)
  const durationMs = useMemo(() => {
    const sec = Number(config?.durationSeconds);
    if (!isNaN(sec) && sec >= 1 && sec <= 10) {
      return sec * 1000;
    }
    return 2500;
  }, [config?.durationSeconds]);

  // If splash screen is explicitly disabled by admin, complete immediately
  useEffect(() => {
    if (config?.isEnabled === false && !skipSplash) {
      markSplashGone();
      setIsAnimationComplete(true);
    }
  }, [config?.isEnabled, skipSplash]);

  // Duration timer: guarantees splash screen does not block app startup
  useEffect(() => {
    if (skipSplash || config?.isEnabled === false || brandDone) return;
    const t = setTimeout(() => {
      setBrandDone(true);
    }, durationMs);
    return () => clearTimeout(t);
  }, [durationMs, skipSplash, config?.isEnabled, brandDone]);

  // Handle slow network fallback
  useEffect(() => {
    if (skipSplash || isDataReady) return;
    setIsSlow(false);
    const t = setTimeout(() => setIsSlow(true), SLOW_LOAD_MS);
    return () => clearTimeout(t);
  }, [isDataReady, skipSplash, loadFailed]);

  const canExit = (isReady && isDataReady) || brandDone;

  // Smooth lightweight exit fade transition
  useEffect(() => {
    if (skipSplash || !brandDone || !canExit) return;

    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      markSplashGone();
      setIsAnimationComplete(true);
    });
  }, [brandDone, canExit, skipSplash, overlayOpacity]);

  // Determine which single image to show:
  // If custom image exists, is active, and hasn't errored -> custom image.
  // Otherwise -> default local MySawari splash screen.
  const hasCustomActiveImage = Boolean(
    config?.isActive && config?.imageUrl && !customImageError
  );

  const showProblem = !isDataReady && (loadFailed || isSlow);

  return (
    <View style={styles.container}>
      {/* App renders underneath directly to prevent any blank flicker */}
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
          <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

          {/* ======================================================== */}
          {/* THE SINGLE SPLASH SCREEN (NO MULTIPLE SLIDES / CAROUSELS) */}
          {/* ======================================================== */}
          {hasCustomActiveImage ? (
            <ExpoImage
              source={{ uri: config.imageUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              cachePolicy="memory-disk"
              priority="high"
              onError={() => {
                // Seamless graceful fallback to default splash on error
                setCustomImageError(true);
              }}
            />
          ) : (
            <Image
              source={require('@/assets/images/splash_final.png')}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
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
    backgroundColor: '#FFFFFF',
    zIndex: 99999,
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
