import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';
import FlashSaleRays from '@/assets/images/home_banner_rays.svg';
import FlashSaleTitle from '@/assets/images/home_flash_sale_title.svg';
import FlashSaleUnderline from '@/assets/images/home_flash_sale_underline.svg';

/** Figma "Frame 2147226271": the Flash Sale banner, 361 × 106 on #3E2DC8 (tap opens the Today's Deals screen). */

// React Native has no text stroke: the black outline is four black copies nudged around the white text,
// and the hard offset shadow is one more copy behind them.
const NUDGE = [[-1, 0], [1, 0], [0, -1], [0, 1], [-0.7, -0.7], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7]];

function Lettering({ text, width, size, lineHeight, shadow }: { text: string; width: number; size: number; lineHeight: number; shadow: { dx: number; dy: number; color: string } }) {
  const base = { fontFamily: 'Anton_400Regular', fontSize: size, lineHeight, width, textAlign: 'center' as const, includeFontPadding: false };
  const copy = (color: string, dx: number, dy: number, key: string) => (
    <Text key={key} allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit style={[base, { position: 'absolute', left: dx, top: dy, color }]}>{text}</Text>
  );
  return (
    <View style={{ width, height: lineHeight, transform: [{ skewX: '-6deg' }] }}>
      {copy(shadow.color, shadow.dx, shadow.dy, 's')}
      {copy('#000000', shadow.dx * 0.4, shadow.dy * 0.4, 'sb')}
      {NUDGE.map(([dx, dy], i) => copy('#000000', dx, dy, `o${i}`))}
      <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit style={[base, { color: '#FFFFFF' }]}>{text}</Text>
    </View>
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
          <Lettering text="EVERY SUNDAY 8AM" width={223.93} size={24} lineHeight={21.724} shadow={{ dx: -0.8, dy: 0.8, color: '#000000' }} />
        </View>
        <View style={styles.underlineFrame} pointerEvents="none">
          <FlashSaleUnderline />
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 106, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  card: { width: 361, maxWidth: '100%', height: 106, borderRadius: 16, backgroundColor: '#3E2DC8', overflow: 'hidden' },
  rays: { position: 'absolute', left: -100, top: -228.5, mixBlendMode: 'overlay' },
  text: { position: 'absolute', top: 23, left: (361 - 223.93) / 2 + 0.47, width: 223.93, height: 54.307, alignItems: 'center', overflow: 'visible' },
  underlineFrame: {
    position: 'absolute',
    left: 247,
    top: 84,
    width: 45.855,
    height: 2.84,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '-1deg' }],
  },
});
