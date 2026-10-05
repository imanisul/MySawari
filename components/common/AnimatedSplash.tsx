import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image, Pressable, Easing } from 'react-native';
import { useColors } from '@/hooks/useColors';

// Module-level flag: the splash only shows on the very first cold app launch.
// After login or any navigation within the same session, it is skipped entirely.
let hasShownSplash = false;

// Shortest time the brand screen stays up, counted from when it first appears (data loads meanwhile).
const MIN_SPLASH_MS = 1200;
// After this long without data, say so instead of leaving the customer looking at a spinner.
const SLOW_LOAD_MS = 12000;

export function AnimatedSplash({
  isReady,
  isDataReady = true,
  loadFailed = false,
  onRetry,
  children,
}: {
  isReady: boolean;
  /** The live data the first screen needs (vehicles) has arrived from the server. */
  isDataReady?: boolean;
  /** Loading that data failed after retries. */
  loadFailed?: boolean;
  onRetry?: () => void;
  children: React.ReactNode;
}) {
  const colors = useColors();
  const mountedAt = useRef(Date.now()).current;
  const [isSlow, setIsSlow] = useState(false);
  // The customer chose to go in without waiting for the data (the screens show their own loading/error states).
  const [skipWaiting, setSkipWaiting] = useState(false);
  
  // If splash was already shown this session, skip it entirely
  const skipSplash = useRef(hasShownSplash).current;

  // State to track if the splash screen should still be mounted
  const [isAnimationComplete, setIsAnimationComplete] = useState(skipSplash);
  
  // Animation values
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // Loading bar shown under the tagline: creeps towards 90% while waiting, fills to 100% when data arrives.
  const loaderOpacity = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const [barDone, setBarDone] = useState(false);

  // Entry Animation
  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 12,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        })
      ]),
      Animated.timing(loaderOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
    Animated.timing(progress, {
      toValue: 0.9,
      duration: 6000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    if (!isDataReady && !skipWaiting) return;
    progress.stopAnimation();
    Animated.timing(progress, {
      toValue: 1,
      duration: 250,
      useNativeDriver: false,
    }).start(() => setBarDone(true));
  }, [isDataReady, skipWaiting]);

  useEffect(() => {
    if (skipSplash || isDataReady) return;
    setIsSlow(false);
    const t = setTimeout(() => setIsSlow(true), SLOW_LOAD_MS);
    return () => clearTimeout(t);
  }, [isDataReady, skipSplash, loadFailed]);

  // Exit animation: once the app is ready and its live data has loaded (or the customer chose to continue).
  const canExit = isReady && (isDataReady || skipWaiting) && barDone;
  useEffect(() => {
    if (!canExit || skipSplash) return;
    const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - mountedAt));
    const t = setTimeout(() => {
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }).start(() => {
        hasShownSplash = true; // Never show splash again this session
        setIsAnimationComplete(true);
      });
    }, wait);
    return () => clearTimeout(t);
  }, [canExit]);

  const showProblem = !isDataReady && (loadFailed || isSlow);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* The real app is mounted underneath from the start (not swapped in after the fade), so the
          splash fading away reveals the already-painted screen directly — no blank/white frame between
          "splash gone" and "app appears". */}
      {children}
      {!isAnimationComplete && (
        <Animated.View
          pointerEvents="auto"
          style={[
            styles.splashScreen,
            {
              backgroundColor: colors.background,
              opacity: opacityAnim,
            }
          ]}>
          <View style={styles.content}>
            <Animated.View style={{
              opacity: logoOpacity,
              transform: [{ scale: logoScale }]
            }}>
              <Image
                source={require('@/assets/images/MySawari_nobg.png')}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </Animated.View>

            <Animated.View style={{
              opacity: titleOpacity,
              transform: [{ translateY: titleTranslateY }],
              marginTop: 4
            }}>
              <Text style={[styles.titleText, { color: colors.foreground }]}>MySawari</Text>
            </Animated.View>

            <Animated.View style={{
              opacity: taglineOpacity,
              transform: [{ translateY: taglineTranslateY }],
              marginTop: 6
            }}>
              <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Your ride, your way.</Text>
            </Animated.View>

            <View style={styles.status}>
              {showProblem ? (
                <>
                  <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                    {loadFailed ? "Couldn't load vehicles. Check your internet connection." : 'This is taking longer than usual…'}
                  </Text>
                  <View style={styles.actions}>
                    {loadFailed && !!onRetry && (
                      <Pressable
                        accessibilityRole="button"
                        onPress={onRetry}
                        style={({ pressed }) => [styles.btn, { backgroundColor: colors.primary }, pressed && { opacity: 0.7 }]}
                      >
                        <Text style={[styles.btnText, { color: colors.primaryForeground }]}>Retry</Text>
                      </Pressable>
                    )}
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setSkipWaiting(true)}
                      style={({ pressed }) => [styles.btn, { borderColor: colors.border, borderWidth: 1 }, pressed && { opacity: 0.7 }]}
                    >
                      <Text style={[styles.btnText, { color: colors.foreground }]}>Continue</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <Animated.View style={{ opacity: loaderOpacity, alignItems: 'center', gap: 12 }}>
                  <View style={[styles.track, { backgroundColor: colors.border }]}>
                    <Animated.View
                      style={[
                        styles.bar,
                        {
                          backgroundColor: colors.primary,
                          width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.statusText, { color: colors.mutedForeground }]}>
                    {isDataReady ? 'Ready' : 'Getting everything ready for you…'}
                  </Text>
                </Animated.View>
              )}
            </View>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  splashScreen: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 220,
    height: 110,
    marginBottom: 0,
  },
  titleText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    letterSpacing: 0.3,
  },
  status: {
    marginTop: 40,
    minHeight: 72,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  track: {
    width: 180,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    height: 4,
    borderRadius: 2,
  },
  statusText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  btn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  btnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
});
