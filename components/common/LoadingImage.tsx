import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
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

export function LoadingImage({ onLoad, onError, recyclingKey, ...props }: ImageProps) {
  const colors = useColors();
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
        transition={props.transition ?? 150}
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
        <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.muted }]} pointerEvents="none" />
      )}
    </>
  );
}

const styles = StyleSheet.create({ failed: { alignItems: 'center', justifyContent: 'center' } });
