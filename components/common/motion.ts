import { withDelay, withTiming, Easing } from 'react-native-reanimated';

/**
 * Entrance for cards and sections: they settle a few pixels into place at full opacity.
 * No opacity fade, so an elevated card never shows up as a washed-out grey box with a shadow
 * while it fades in. Delay is capped so long lists don't build up slowly.
 */
export function rise(delay = 0, duration = 240) {
  return () => {
    'worklet';
    const d = Math.min(delay, 240);
    return {
      initialValues: { transform: [{ translateY: 12 }] },
      animations: {
        transform: [{ translateY: withDelay(d, withTiming(0, { duration, easing: Easing.out(Easing.cubic) })) }],
      },
    };
  };
}
