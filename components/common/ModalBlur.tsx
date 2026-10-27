import React from 'react';
import { StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';

/**
 * Blurs the page behind a popup or sheet (Figma: the screen under a popup is frosted, not just dimmed).
 * Put it first inside the modal's dim layer; it ignores touches, so taps still reach the backdrop.
 * shortcut: expo-blur only blurs live content on iOS; Android falls back to the dim colour.
 */
export function ModalBlur() {
  return <BlurView pointerEvents="none" intensity={20} tint="default" style={StyleSheet.absoluteFill} />;
}
