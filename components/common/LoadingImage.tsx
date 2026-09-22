import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { Image, ImageProps } from 'expo-image';
import Reanimated, { FadeOut } from 'react-native-reanimated';
import { Skeleton, SkeletonGroup } from '@/components/common/Skeleton';

/**
 * A photo that shows a shimmer placeholder until it has loaded, then fades the photo in.
 * The placeholder only appears if the photo takes a moment, so cached/local images never flash it.
 * Sizing and layout come from `style`, exactly like a normal Image.
 */
export function LoadingImage({ onLoad, onError, ...props }: ImageProps) {
  const colors = useColors();
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <>
      <Image
        {...props}
        onLoad={(e) => {
          setReady(true);
          onLoad?.(e);
        }}
        onError={(e) => {
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
