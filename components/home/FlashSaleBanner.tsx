import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';

/** Figma "Frame 2147226271": the Flash Sale banner, 361 × 106 on #3E2DC8 (tap opens the Today's Deals screen). */

// React Native has no text stroke: the black outline is four black copies nudged around the white text,
// and the hard offset shadow is one more copy behind them.
const NUDGE = [[-1, 0], [1, 0], [0, -1], [0, 1], [-0.7, -0.7], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7]];

function Lettering({ text, width, size, shadow }: { text: string; width: number; size: number; shadow: { dx: number; dy: number; color: string } }) {
  const base = { fontFamily: 'Anton_400Regular', fontSize: size, lineHeight: size * 1.15, width, textAlign: 'center' as const, includeFontPadding: false };
  const copy = (color: string, dx: number, dy: number, key: string) => (
    <Text key={key} allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit style={[base, { position: 'absolute', left: dx, top: dy, color }]}>{text}</Text>
  );
  return (
    <View style={{ width, height: size * 1.15, transform: [{ skewX: '-6deg' }] }}>
      {copy(shadow.color, shadow.dx, shadow.dy, 's')}
      {copy('#000000', shadow.dx * 0.4, shadow.dy * 0.4, 'sb')}
      {NUDGE.map(([dx, dy], i) => copy('#000000', dx, dy, `o${i}`))}
      <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit style={[base, { color: '#FFFFFF' }]}>{text}</Text>
    </View>
  );
}

function Bolt({ style }: { style?: object }) {
  const d = 'M7.5 0.5 L0.8 13 H5.6 L3.6 22.6 L11.3 9.6 H6.4 Z';
  return (
    <Svg width={13} height={24} viewBox="0 0 12.08 23.15" style={[{ position: 'absolute' }, style]} pointerEvents="none">
      <Path d={d} fill="#E58900" transform="translate(1,1)" />
      <Path d={d} fill="#FBC422" stroke="#000000" strokeWidth={0.5} />
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
        <View style={styles.text}>
          <View style={{ width: 183.21, height: 32.58, marginVertical: -3.1, alignItems: 'center', justifyContent: 'center' }}>
            <Bolt style={{ left: 2.32, top: 6.27 }} />
            <Lettering text="FLASH SALE" width={156.73} size={28} shadow={{ dx: -2.3, dy: 2.3, color: '#FF008B' }} />
            <Bolt style={{ left: 166.47, top: 6.27 }} />
          </View>
          <Lettering text="EVERY SUNDAY 8AM" width={223.93} size={30} shadow={{ dx: -0.8, dy: 0.8, color: '#000000' }} />
        </View>
        <View style={styles.underline} pointerEvents="none" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 106, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center' },
  card: { width: 361, maxWidth: '100%', height: 106, borderRadius: 16, backgroundColor: '#3E2DC8', overflow: 'hidden' },
  text: { position: 'absolute', top: 23, left: (361 - 223.93) / 2 + 0.47, width: 223.93, alignItems: 'center' },
  underline: { position: 'absolute', left: 247, top: 84, width: 45.83, height: 2.04, borderRadius: 2, backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOpacity: 1, shadowRadius: 0, shadowOffset: { width: 0, height: 0.8 }, transform: [{ rotate: '-1deg' }] },
});
