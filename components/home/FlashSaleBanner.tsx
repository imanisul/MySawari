import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';
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

/**
 * Figma "Repeat group 1": 18 rays (one every 20°) of white 70% → 0, laid over the banner with mix-blend overlay.
 * Drawn in code: the exported SVG repeats the ray through `<use href="#Repeat%20group…">`, an id react-native-svg
 * can't resolve, and it has no blend modes, so the overlay's lightening is matched with a lower opacity instead.
 */
const RAY = 'M260.716 0.687536H299.959L285.057 280.338H275.619L260.716 0.687536Z';
function BannerRays({ style }: { style?: object }) {
  return (
    <Svg width={560.68} height={560.68} viewBox="0 0 560.675 560.675" style={style} pointerEvents="none">
      <Defs>
        <LinearGradient id="bannerRay" x1="280.338" y1="0.6875" x2="280.338" y2="280.338" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.7} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <G opacity={0.33}>
        {Array.from({ length: 18 }, (_, i) => (
          <Path key={i} d={RAY} fill="url(#bannerRay)" transform={`rotate(${i * 20} 280.3375 280.3375)`} />
        ))}
      </G>
    </Svg>
  );
}

import { useQuery } from '@tanstack/react-query';
import { exclusiveOffersQueryOptions, isOfferLive, nextFlashSaleQueryOptions } from '@/services/api/offers';
import { getIndiaDateParts } from '@/utils/sawari';

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
/** "LIVE TODAY 8PM" / "LIVE TOMORROW 8AM" / "LIVE ON SUNDAY 8AM" / "LIVE ON 22 NOV 8AM" in India time; null if none. */
function saleWhen(startsAt?: string | null): string | null {
  const ms = startsAt ? new Date(startsAt).getTime() : NaN;
  if (!Number.isFinite(ms) || ms <= Date.now()) return null;
  const p = getIndiaDateParts(ms);
  const day = (t: number) => { const q = getIndiaDateParts(t); return Date.UTC(q.year, q.month, q.date) / 86400000; };
  const ahead = day(ms) - day(Date.now());
  const h = p.hours % 12 || 12;
  const time = `${h}${p.minutes ? `:${String(p.minutes).padStart(2, '0')}` : ''}${p.hours >= 12 ? 'PM' : 'AM'}`;
  if (ahead <= 0) return `LIVE TODAY ${time}`;
  if (ahead === 1) return `LIVE TOMORROW ${time}`;
  if (ahead < 7) return `LIVE ON ${WEEKDAYS[new Date(Date.UTC(p.year, p.month, p.date)).getUTCDay()]} ${time}`;
  return `LIVE ON ${p.date} ${MONTHS[p.month]} ${time}`;
}

export function FlashSaleBanner() {
  const router = useRouter();
  const { data: offers = [] } = useQuery(exclusiveOffersQueryOptions);
  // Only offers still running right now — a remembered offer that has ended never shows as LIVE, even before the refresh.
  const isLive = offers.some((o: any) => isOfferLive(o, Date.now(), true));
  // The second line follows the real sale: live now, else the next scheduled sale's day and time (set in the Operation
  // App), else coming soon.
  // Always loaded (not only when nothing is live) so the Flash Sale page opens with it already known.
  const { data: nextSale } = useQuery(nextFlashSaleQueryOptions);
  const subText = isLive ? 'LIVE NOW · BOOK DEALS' : saleWhen(nextSale?.startsAt) ?? 'COMING SOON';
  // Its lettering sits at fixed spots on a 361-wide card: on narrower phones the whole banner shrinks to fit.
  const { width } = useWindowDimensions();
  const k = Math.min(1, (width - 32) / 361);

  return (
    <View style={[styles.row, { height: 106 * k }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Flash Sale"
        onPress={() => { Haptics.selectionAsync(); router.push('/flash-sale'); }}
        style={({ pressed }) => [styles.card, k < 1 && { transform: [{ scale: k }], marginHorizontal: -(361 * (1 - k)) / 2 }, pressed && { opacity: 0.92 }]}
      >
        <BannerRays style={styles.rays} />
        <View style={styles.text}>
          <View style={{ width: 183.21, height: 32.58, marginVertical: -3.1, alignItems: 'center', justifyContent: 'center' }}>
            <Bolt width={12.08} line={0.42} near={0.35} far={1.04} style={{ left: 2.32, top: 6.27 }} />
            {/* Figma: upright, 0.93 black outline, 0.78 black + 2.33 #FF008B drop shadows; 156.73 wide (size 26.6 fits it) */}
            <Lettering text="FLASH SALE" width={156.73} size={26.6} shadow={{ dx: -2.33, dy: 2.33, color: '#FF008B' }} near={0.78} outline={0.93} skew="0deg" scaleY={1.15} font="PlusJakartaSans_700Bold" />
            <Bolt width={12.08} line={0.42} near={0.35} far={1.04} style={{ left: 166.47, top: 6.27 }} />
          </View>
          <View style={{ marginTop: -4 }}>
            <Lettering text={subText} width={260} size={23} shadow={{ dx: -0.78, dy: 0.78, color: '#000000' }} near={0.78} outline={0.93} skew="0deg" scaleY={1.15} font="PlusJakartaSans_700Bold" />
          </View>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { height: 106, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  card: { width: 361, height: 106, borderRadius: 16, backgroundColor: '#3E2DC8', overflow: 'hidden' },
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
