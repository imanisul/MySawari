import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Animated, Easing, LayoutChangeEvent } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, ImageProps } from 'expo-image';

// A photo that fails (server busy processing it, a network blip) is retried a few times on its own
// before the "unavailable" placeholder is shown, instead of staying broken for the rest of the session.
const RETRY_DELAYS_MS = [2000, 5000, 12000];

// Keep track of URIs that loaded successfully in this session so cached images render immediately
// on scroll without flashing a placeholder or triggering layout updates.
const loadedUris = new Set<string>();

function getSourceKey(source: any): string {
  if (!source) return '';
  if (typeof source === 'number') return `local_${source}`;
  if (typeof source === 'string') return source;
  if (typeof source === 'object' && typeof source.uri === 'string') return source.uri;
  return '';
}

function optimizeCloudinaryUrl(source: any): any {
  if (!source) return source;
  
  let uri = '';
  if (typeof source === 'string') {
    uri = source;
  } else if (typeof source === 'object' && source.uri) {
    uri = source.uri;
  } else {
    return source;
  }

  if (uri.includes('res.cloudinary.com') && uri.includes('/upload/')) {
    if (!uri.includes('q_auto') && !uri.includes('w_')) {
      uri = uri.replace('/upload/', '/upload/q_auto,f_auto,w_800,c_limit/');
    }
  }

  if (typeof source === 'string') {
    return uri;
  }
  return { ...source, uri };
}

/**
 * Animated shimmer skeleton with a pulsing vehicle silhouette for loading vehicle images.
 */
export function AnimatedVehiclePlaceholder({ colors, isDark }: { colors: any; isDark: boolean }) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.4)).current;
  const scaleAnim = useRef(new Animated.Value(0.96)).current;

  useEffect(() => {
    const shimmer = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 0.9,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 1.05,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.96,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );

    shimmer.start();
    pulse.start();

    return () => {
      shimmer.stop();
      pulse.stop();
    };
  }, []);

  const baseWidth = Math.max(layout.width, 240);
  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-baseWidth, baseWidth * 1.5],
  });

  const baseBg = isDark ? '#1C1C1E' : '#F1EFEA';
  const highlight = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(255,255,255,0.55)';
  const iconColor = isDark ? '#6B7280' : '#A3A3A3';
  const badgeBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.65)';

  const showCarIcon = layout.height >= 55 || layout.height === 0;

  return (
    <View
      style={[StyleSheet.absoluteFill, { backgroundColor: baseBg, overflow: 'hidden' }]}
      onLayout={(e: LayoutChangeEvent) => {
        const { width, height } = e.nativeEvent.layout;
        setLayout({ width: Math.round(width), height: Math.round(height) });
      }}
      pointerEvents="none"
    >
      {/* Moving Shimmer Wave */}
      {layout.width > 0 && (
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            {
              width: layout.width,
              transform: [{ translateX }],
            },
          ]}
        >
          <LinearGradient
            colors={['rgba(255,255,255,0)', highlight, 'rgba(255,255,255,0)']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      )}

      {/* Pulsing Car Icon in Center */}
      {showCarIcon && (
        <View style={styles.centerCarContainer}>
          <Animated.View
            style={[
              styles.carBadge,
              {
                backgroundColor: badgeBg,
                opacity: pulseAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <Ionicons name="car-sport" size={layout.height > 140 ? 32 : 20} color={iconColor} />
          </Animated.View>
        </View>
      )}
    </View>
  );
}

export function isValidImageSource(source: any): boolean {
  if (!source) return false;
  if (typeof source === 'number') return true;
  if (typeof source === 'string') return source.trim().length > 0;
  if (typeof source === 'object') {
    if (typeof source.uri === 'string') return source.uri.trim().length > 0;
  }
  return false;
}

export function LoadingImage({ onLoad, onError, recyclingKey, ...props }: ImageProps) {
  const colors = useColors();
  const { isDarkMode } = useSawari();
  const valid = isValidImageSource(props.source);

  if (!valid) {
    return <AnimatedVehiclePlaceholder colors={colors} isDark={isDarkMode} />;
  }

  const srcKey = getSourceKey(props.source);
  const isLocal = typeof props.source === 'number';
  const isAlreadyLoaded = isLocal || (srcKey ? loadedUris.has(srcKey) : false);

  const [ready, setReady] = useState(isAlreadyLoaded);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  let optimizedSource = optimizeCloudinaryUrl(props.source);

  // Cache busting: append a retry query string so expo-image refetches the file without destroying the view.
  if (attempt > 0 && typeof optimizedSource === 'string') {
    optimizedSource = `${optimizedSource}${optimizedSource.includes('?') ? '&' : '?'}retry=${attempt}`;
  } else if (attempt > 0 && typeof optimizedSource === 'object' && optimizedSource.uri) {
    optimizedSource = { ...optimizedSource, uri: `${optimizedSource.uri}${optimizedSource.uri.includes('?') ? '&' : '?'}retry=${attempt}` };
  }

  useEffect(() => {
    const isNowReady = typeof props.source === 'number' || (srcKey ? loadedUris.has(srcKey) : false);
    setReady(isNowReady);
    setFailed(false);
    setAttempt(0);
  }, [srcKey]);

  useEffect(() => () => {
    if (retryTimer.current) clearTimeout(retryTimer.current);
  }, []);

  return (
    <>
      <Image
        {...props}
        recyclingKey={recyclingKey} // Let expo-image optimize recycling natively
        source={optimizedSource}
        cachePolicy="memory-disk"
        allowDownscaling={true}
        transition={props.transition ?? 250}
        onLoad={(e) => {
          if (srcKey) loadedUris.add(srcKey);
          setReady(true);
          setFailed(false);
          onLoad?.(e);
        }}
        onError={(e) => {
          if (attempt < RETRY_DELAYS_MS.length) {
            if (retryTimer.current) clearTimeout(retryTimer.current);
            retryTimer.current = setTimeout(() => setAttempt((a) => a + 1), RETRY_DELAYS_MS[attempt]);
            return;
          }
          setReady(true);
          setFailed(true);
          onError?.(e);
        }}
      />
      {failed && (
        <View style={[StyleSheet.absoluteFill, styles.failed, { backgroundColor: colors.muted }]} pointerEvents="none">
          <Feather name="image" size={28} color={colors.mutedForeground} />
        </View>
      )}
      {!ready && !failed && (
        <AnimatedVehiclePlaceholder colors={colors} isDark={isDarkMode} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  failed: { alignItems: 'center', justifyContent: 'center' },
  centerCarContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  carBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 1,
  },
});
