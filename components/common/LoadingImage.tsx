import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Image, ImageProps } from 'expo-image';
import Reanimated, { FadeOut } from 'react-native-reanimated';
import { Skeleton, SkeletonGroup } from '@/components/common/Skeleton';

// A photo that fails (server busy processing it, a network blip) is retried a few times on its own
// before the "unavailable" placeholder is shown, instead of staying broken for the rest of the session.
const RETRY_DELAYS_MS = [2000, 5000, 12000];

/**
 * A photo that shows a shimmer placeholder until it has loaded, then fades the photo in.
 * The placeholder only appears if the photo takes a moment, so cached/local images never flash it.
 * Sizing and layout come from `style`, exactly like a normal Image.
 */
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

export function LoadingImage({ onLoad, onError, recyclingKey, ...props }: ImageProps) {
  const colors = useColors();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  let optimizedSource = optimizeCloudinaryUrl(props.source);
  // Keyed on the photo itself, not the retry URL below: keying on that reset `attempt` to 0 on every retry,
  // so a failing photo re-requested forever every 2 s and never showed the "unavailable" placeholder.
  const sourceKey = JSON.stringify(optimizedSource ?? null);

  // Cache busting: append a retry query string so expo-image refetches the file without destroying the view.
  if (attempt > 0 && typeof optimizedSource === 'string') {
    optimizedSource = `${optimizedSource}${optimizedSource.includes('?') ? '&' : '?'}retry=${attempt}`;
  } else if (attempt > 0 && typeof optimizedSource === 'object' && optimizedSource.uri) {
    optimizedSource = { ...optimizedSource, uri: `${optimizedSource.uri}${optimizedSource.uri.includes('?') ? '&' : '?'}retry=${attempt}` };
  }

  useEffect(() => {
    setReady(false);
    setFailed(false);
    setAttempt(0);
  }, [sourceKey]);

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
        onLoad={(e) => {
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
        <Reanimated.View exiting={FadeOut.duration(200)} style={StyleSheet.absoluteFill} pointerEvents="none">
          <SkeletonGroup style={StyleSheet.absoluteFill}>
            <Skeleton width="100%" height="100%" borderRadius={0} />
          </SkeletonGroup>
        </Reanimated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({ failed: { alignItems: 'center', justifyContent: 'center' } });
