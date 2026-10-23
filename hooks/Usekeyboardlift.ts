import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, Keyboard, KeyboardEvent, Platform, View } from 'react-native';
export function useKeyboardLift() {
  const containerRef = useRef<View>(null);
  const lift = useRef(new Animated.Value(0)).current;
  const keyboardTop = useRef<number | null>(null);
  const containerBottom = useRef<number | null>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const apply = useCallback(
    (duration?: number) => {
      const top = keyboardTop.current;
      const bottom = containerBottom.current;
      const toValue = top == null || bottom == null ? 0 : Math.max(0, bottom - top);
      Animated.timing(lift, {
        toValue,
        duration: duration && duration > 0 ? duration : 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    },
    [lift],
  );

  const measure = useCallback(
    (duration?: number) => {
      const node = containerRef.current;
      if (!node) {
        apply(duration);
        return;
      }
      node.measureInWindow((_x, y, _w, h) => {
        if (h > 0) containerBottom.current = y + h;
        apply(duration);
      });
    },
    [apply],
  );

  /** Pass to the container's `onLayout` so a resize (Android adjustResize, rotation) re-measures. */
  const onContainerLayout = useCallback(() => measure(), [measure]);

  useEffect(() => {
    const ios = Platform.OS === 'ios';

    const topOf = (e: KeyboardEvent) =>
      e.endCoordinates.screenY || Dimensions.get('window').height - e.endCoordinates.height;

    // The keyboard may already be up when the sheet mounts.
    const metrics = Keyboard.metrics?.();
    if (metrics && metrics.height > 0) {
      keyboardTop.current = metrics.screenY;
      setKeyboardVisible(true);
    }

    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e: KeyboardEvent) => {
      keyboardTop.current = topOf(e);
      setKeyboardVisible(true);
      measure(e.duration);
    });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', (e: KeyboardEvent) => {
      keyboardTop.current = null;
      setKeyboardVisible(false);
      apply(e?.duration);
    });

    return () => {
      show.remove();
      hide.remove();
    };
  }, [apply, measure]);

  return { containerRef, onContainerLayout, lift, keyboardVisible };
}