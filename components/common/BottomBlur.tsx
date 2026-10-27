import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

/**
 * The strip above the bottom bars (tab bar, Book Now bar, sticky buttons). No blur: the page simply fades
 * softly into the bar's white so the buttons stay readable.
 *
 * BlurHost / BlurTarget stay as plain views so the pages that use them keep working unchanged.
 */

export function BlurHost({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={style}>{children}</View>;
}

export function BlurTarget({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={style}>{children}</View>;
}

export function BottomBlur({ height, fadeTo = '#FFFFFF', style }: { height: number; fadeTo?: string; style?: StyleProp<ViewStyle> }) {
  const hex = fadeTo.length === 7 ? fadeTo : '#FFFFFF';
  return (
    <View pointerEvents="none" style={[styles.strip, { height }, style]}>
      {/* Figma: linear-gradient(180deg, rgba(255,255,255,0) 0%, #FFFFFF 100%), a straight two-stop fade. */}
      <LinearGradient colors={[`${hex}00`, hex]} style={StyleSheet.absoluteFill} />
    </View>
  );
}

const styles = StyleSheet.create({
  strip: { position: 'absolute', left: 0, right: 0, bottom: 0 },
});