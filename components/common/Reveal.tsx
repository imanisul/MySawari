import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import Reanimated, { FadeInDown } from 'react-native-reanimated';

/**
 * Fades and lifts its content into place when it first appears. Use `delay` to stagger sections
 * so a screen builds itself top to bottom instead of popping in all at once.
 * (Reanimated honours the phone's "reduce motion" setting automatically.)
 */
export function Reveal({
  children,
  delay = 0,
  duration = 420,
  style,
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Reanimated.View entering={FadeInDown.delay(delay).duration(duration)} style={style}>
      {children}
    </Reanimated.View>
  );
}
