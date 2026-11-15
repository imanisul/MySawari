import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';
import FlashSaleRays from '@/assets/images/home_banner_rays.svg';
import FlashSaleTitle from '@/assets/images/home_flash_sale_title.svg';
import FlashSaleUnderline from '@/assets/images/home_flash_sale_underline.svg';

/** Figma "Frame 2147226271": the Flash Sale banner, 361 × 106 on #3E2DC8 (tap opens the Today's Deals screen). */

// React Native has no text stroke: the black outline is four black copies nudged around the white text,
// and the hard offset shadow is one more copy behind them.
const NUDGE = [[-1, 0], [1, 0], [0, -1], [0, 1], [-0.7, -0.7], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7]];

/**
 * Outlined lettering with a hard offset shadow. `near`: offset of the thin black shadow (default 0.4 × the main one);
 * `outline`: outline thickness; `skew` / `scaleY`: slant and vertical stretch (the Figma font is taller than ours).
 */
export function Lettering({ text, width, size, shadow, font = 'Anton_400Regular', near, outline = 1, skew = '-6deg', scaleY = 1 }: {
  text: string; width?: number; size: number; shadow: { dx: number; dy: number; color: string }; font?: string;
  near?: number; outline?: number; skew?: string; scaleY?: number;
}) {
  const base = { fontFamily: font, fontSize: size, lineHeight: size * 1.15, width, textAlign: 'center' as const, includeFontPadding: false };
  const copy = (color: string, dx: number, dy: number, key: string) => (
    <Text key={key} allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit style={[base, { position: 'absolute', left: dx, top: dy, color }]}>{text}</Text>
  );
  const nx = near !== undefined ? Math.sign(shadow.dx) * near : shadow.dx * 0.4;
  const ny = near !== undefined ? Math.sign(shadow.dy) * near : shadow.dy * 0.4;
  return (
    <View style={{ width, height: size * 1.15, transform: [{ skewX: skew }, { scaleY }] }}>
      {copy(shadow.color, shadow.dx, shadow.dy, 's')}
      {copy('#000000', nx, ny, 'sb')}
      {NUDGE.map(([dx, dy], i) => copy('#000000', dx * outline, dy * outline, `o${i}`))}
      <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit style={[base, { color: '#FFFFFF' }]}>{text}</Text>
    </View>
  );
}

/** Gold bolt (Figma Vector): 1.2px black outline, then a 1px black and a 3px #E58900 hard shadow down-right. */
export function Bolt({ style, width = 13, line = 1.2, near = 1, far = 3 }: { style?: object; width?: number; line?: number; near?: number; far?: number }) {
  const d = 'M7.5 0.5 L0.8 13 H5.6 L3.6 22.6 L11.3 9.6 H6.4 Z';
  const u = 12.08 / width; // screen px → drawing units
  return (
    <Svg width={width + far} height={(width * 23.15) / 12.08 + far} viewBox={`0 0 ${12.08 + far * u} ${23.15 + far * u}`} style={[{ position: 'absolute' }, style]} pointerEvents="none">
      <Path d={d} fill="#E58900" transform={`translate(${far * u},${far * u})`} />
      <Path d={d} fill="#000000" transform={`translate(${near * u},${near * u})`} />
      <Path d={d} fill="#FBC422" stroke="#000000" strokeWidth={line * u} />
    </Svg>
  );
}

export function FlashSaleBanner() {
  const router = useRouter();
  return (
    <View style={styles.row}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Flash Sale, every Sunday 8 AM"
        onPress={() => { Haptics.selectionAsync(); router.push('/flash-sale'); }}
        style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
      >
        <FlashSaleRays style={styles.rays} pointerEvents="none" />
        <View style={styles.text}>
          <FlashSaleTitle />
          <Lettering text="EVERY SUNDAY 8AM" width={223.93} size={30} shadow={{ dx: -0.8, dy: 0.8, color: '#000000' }} />
        </View>
        <FlashSaleUnderline style={styles.underline} pointerEvents="none" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 106, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  card: { width: 361, maxWidth: '100%', height: 106, borderRadius: 16, backgroundColor: '#3E2DC8', overflow: 'hidden' },
  rays: { position: 'absolute', left: -100, top: -227.5 },
  text: { position: 'absolute', top: 23, left: (361 - 223.93) / 2 + 0.47, width: 223.93, alignItems: 'center' },
  underline: { position: 'absolute', left: 247, top: 82.8, transform: [{ rotate: '-1deg' }] },
});
