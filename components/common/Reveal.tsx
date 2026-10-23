import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Reanimated from 'react-native-reanimated';
import { usePathname } from 'expo-router';
import { rise } from '@/components/common/motion';

// Screens already revealed this session: coming back to one (e.g. switching tabs) shows it instantly.
const revealedScreens = new Set<string>();

/**
 * Fades and lifts its content into place when it first appears. Use `delay` to stagger sections
 * so a screen builds itself top to bottom instead of popping in all at once.
 * (Reanimated honours the phone's "reduce motion" setting automatically.)
 */
export function Reveal({
  children,
  delay = 0,
  duration = 240,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const pathname = usePathname();
  // Decided once, on mount: later re-renders of the same screen must not restart or cancel the animation.
  const [animate] = React.useState(() => !revealedScreens.has(pathname));
  React.useEffect(() => {
    revealedScreens.add(pathname);
  }, [pathname]);

  return (
    <Reanimated.View entering={animate ? rise(delay, duration) : undefined} style={style}>
      {children}
    </Reanimated.View>
  );
}
