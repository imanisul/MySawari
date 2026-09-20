import React, { useEffect } from 'react';
import { ViewStyle, StyleSheet, View } from 'react-native';
import Reanimated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withRepeat, 
  withSequence, 
  withTiming, 
  withDelay
} from 'react-native-reanimated';
import { useColors } from '@/hooks/useColors';
import { LinearGradient } from 'expo-linear-gradient';

interface SkeletonProps {
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  borderRadius?: number;
  style?: ViewStyle;
  delay?: number;
}

export function Skeleton({ width = '100%', height = 20, borderRadius = 8, style, delay = 0 }: SkeletonProps) {
  const colors = useColors();
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 800 }),
          withTiming(0.4, { duration: 800 })
        ),
        -1, // infinite
        true // reverse
      )
    );
  }, [delay, opacity]);

  const rStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Reanimated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.muted,
          overflow: 'hidden',
        },
        style,
        rStyle,
      ]}
    >
      <LinearGradient
        colors={[
          'rgba(255,255,255,0)',
          'rgba(255,255,255,0.1)',
          'rgba(255,255,255,0)'
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFillObject}
      />
    </Reanimated.View>
  );
}
