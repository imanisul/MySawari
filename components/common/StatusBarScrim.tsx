import React from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

/**
 * A strip in the page colour behind the status bar. For screens whose content scrolls edge to edge:
 * without it the content slides up under the clock and battery icons and collides with them.
 */
export function StatusBarScrim() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, backgroundColor: colors.background, zIndex: 10 }}
    />
  );
}
