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
export function LoadingImage({ onLoad, onError, ...props }: ImageProps) {
  const colors = useColors();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A different photo starts fresh.
  const sourceKey = JSON.stringify(props.source ?? null);
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
        // Changing the key remounts the image, which makes expo-image request it again.
        key={`${sourceKey}#${attempt}`}
        {...props}
        onLoad={(e) => {
          setReady(true);
          setFailed(false);
          onLoad?.(e);
        }}
        onError={(e) => {
          if (attempt < RETRY_DELAYS_MS.length) {
            if (retryTimer.current) clearTimeout(retryTimer.current);
            retryTimer.current = setTimeout(() => setAttempt((a) => a + 1), RETRY_DELAYS_MS[attempt]);
            return; // keep the shimmer up while we try again
          }
          setReady(true); // never leave a shimmer running over a photo that failed
          setFailed(true);
          onError?.(e);
        }}
      />
      {failed && (
        <View style={[StyleSheet.absoluteFill, styles.failed, { backgroundColor: colors.muted }]} pointerEvents="none">
          <Feather name="image" size={28} color={colors.mutedForeground} />
        </View>
      )}
      {!ready && (
        <Reanimated.View exiting={FadeOut.duration(150)} style={StyleSheet.absoluteFill} pointerEvents="none">
          <SkeletonGroup style={StyleSheet.absoluteFill}>
            <Skeleton width="100%" height="100%" borderRadius={0} />
          </SkeletonGroup>
        </Reanimated.View>
      )}
    </>
  );
}

const styles = StyleSheet.create({ failed: { alignItems: 'center', justifyContent: 'center' } });
