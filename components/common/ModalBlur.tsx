import React from 'react';
import { StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useBlurTarget } from './BlurTargetContext';

/** The one popup backdrop (Figma: #262626 at 32% over the page, blurred 1px). Every popup uses this and nothing else. */
export const POPUP_DIM = 'rgba(38,38,38,0.32)';

/**
 * Frosts and dims the page behind a popup or sheet. Put it first inside the modal's overlay; it ignores touches, so
 * taps still reach the backdrop. The overlay itself must have no colour of its own — a second dim on top of this
 * one made some popups far darker than others.
 * shortcut: expo-blur only blurs live content on iOS; Android falls back to the dim alone.
 */
export function ModalBlur({ sigmaX = 1, sigmaY = 1 }: { sigmaX?: number; sigmaY?: number } = {}) {
  const blurTarget = useBlurTarget();
  // Figma's 1px blur is a light frost: expo-blur's scale is 1–100, so ~6 per px.
  const intensity = Math.min(100, Math.max(1, Math.round(((Math.abs(sigmaX) + Math.abs(sigmaY)) / 2) * 6)));

  return (
    <>
      <BlurView
        pointerEvents="none"
        intensity={intensity}
        tint="default"
        blurTarget={blurTarget ?? undefined}
        blurMethod={blurTarget ? 'dimezisBlurView' : undefined}
        style={StyleSheet.absoluteFill}
      />
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: POPUP_DIM }]} />
    </>
  );
}
