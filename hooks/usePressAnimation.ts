import { useRef, useCallback } from 'react';
import { Animated } from 'react-native';

export function usePressAnimation(
  defaultScale = 1,
  pressedScale = 0.97,
  defaultOpacity = 1,
  pressedOpacity = 1
) {
  const scaleAnim = useRef(new Animated.Value(defaultScale)).current;
  const opacityAnim = useRef(new Animated.Value(defaultOpacity)).current;
  const elevationAnim = useRef(new Animated.Value(1)).current; // 1 = level1, 0 = level0

  const onPressIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: pressedScale,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: pressedOpacity,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(elevationAnim, {
        toValue: 0,
        duration: 100,
        useNativeDriver: false, // box-shadow / elevation cannot use native driver
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, elevationAnim, pressedScale, pressedOpacity]);

  const onPressOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: defaultScale,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: defaultOpacity,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(elevationAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start();
  }, [scaleAnim, opacityAnim, elevationAnim, defaultScale, defaultOpacity]);

  return {
    scaleAnim,
    opacityAnim,
    elevationAnim,
    onPressIn,
    onPressOut,
  };
}
