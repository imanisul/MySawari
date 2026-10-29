import React from 'react';
import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useBlurTarget } from './BlurTargetContext';

/**
 * Blurs the page behind a popup or sheet (Figma: the screen under a popup is frosted, not just dimmed).
 * Put it first inside the modal's dim layer; it ignores touches, so taps still reach the backdrop.
 * shortcut: expo-blur only blurs live content on iOS; Android falls back to the dim colour.
 */
export function ModalBlur({ sigmaX = 2, sigmaY = 2 }: { sigmaX?: number; sigmaY?: number } = {}) {
  const blurTarget = useBlurTarget();
  const intensity = Math.min(100, Math.max(1, Math.round((Math.abs(sigmaX) + Math.abs(sigmaY)) / 2)));

  return (
    <BlurView
      pointerEvents="none"
      intensity={intensity}
      tint="dark"
      blurTarget={blurTarget ?? undefined}
      blurMethod={blurTarget ? 'dimezisBlurView' : undefined}
      style={StyleSheet.absoluteFill}
    />
  );
}
