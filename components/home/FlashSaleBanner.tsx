import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Stop, Text as SvgText, TextPath } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';

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

function CurvedLettering({ id, text, width, size, shadow, font, near, outline = 1, rise = 4 }: {
  id: string; text: string; width: number; size: number; shadow: { dx: number; dy: number; color: string };
  font: string; near?: number; outline?: number; rise?: number;
}) {
  const baseline = size + 1;
  const path = `M 0 ${baseline} Q ${width / 2} ${baseline - rise * 2} ${width} ${baseline}`;
  const nx = near !== undefined ? Math.sign(shadow.dx) * near : shadow.dx * 0.4;
  const ny = near !== undefined ? Math.sign(shadow.dy) * near : shadow.dy * 0.4;
  const copy = (color: string, dx: number, dy: number, key: string) => (
    <G key={key} transform={`translate(${dx},${dy})`}>
      <SvgText fontFamily={font} fontSize={size} fill={color} textAnchor="middle">
        <TextPath href={`#${id}`} startOffset="50%" textAnchor="middle">{text}</TextPath>
      </SvgText>
    </G>
  );
  return (
    <Svg width={width} height={size * 1.15} viewBox={`0 0 ${width} ${size * 1.15}`} style={{ transform: [{ scaleY: 1.15 }] }} pointerEvents="none">
      <Defs>
        <Path id={id} d={path} />
      </Defs>
      {copy(shadow.color, shadow.dx, shadow.dy, 's')}
      {copy('#000000', nx, ny, 'sb')}
      {NUDGE.map(([dx, dy], i) => copy('#000000', dx * outline, dy * outline, `o${i}`))}
      {copy('#FFFFFF', 0, 0, 'text')}
    </Svg>
  );
}

/** Gold bolt (Figma Vector): 1.2px black outline, then a 1px black and a 3px #E58900 hard shadow down-right. */
export function Bolt({ style, width = 13, line = 1.2, near = 1, far = 3 }: { style?: object; width?: number; line?: number; near?: number; far?: number }) {
  const d = 'M8.94014 0.575406C7.05022 0.360281 5.142 0.360281 3.25209 0.575406L1.29556 0.798659C1.15518 0.814791 1.02468 0.878901 0.92611 0.980149C0.827543 1.0814 0.76696 1.21358 0.754602 1.35434L0.603722 3.04959C0.350843 5.89926 0.350843 8.76572 0.603722 11.6154L0.754602 13.3106C0.768093 13.4634 0.838288 13.6055 0.951357 13.709C1.06443 13.8125 1.21217 13.87 1.36548 13.87H3.9059V22.9498C3.90613 23.0767 3.94573 23.2004 4.01924 23.3039C4.09275 23.4074 4.19655 23.4855 4.31633 23.5275C4.43611 23.5695 4.56597 23.5733 4.68799 23.5383C4.81002 23.5034 4.91821 23.4315 4.99764 23.3325L5.47726 22.7314C8.33492 19.1541 10.6105 15.1485 12.2202 10.8622L12.4533 10.2403C12.4882 10.1475 12.5001 10.0476 12.4879 9.9492C12.4758 9.8508 12.4399 9.75681 12.3835 9.67529C12.3271 9.59377 12.2517 9.52714 12.1639 9.48113C12.0761 9.43511 11.9784 9.41107 11.8792 9.41107H8.55128L11.4033 1.6193C11.4353 1.53211 11.447 1.43879 11.4377 1.34639C11.4283 1.25399 11.3981 1.16492 11.3494 1.08589C11.3006 1.00686 11.2345 0.939948 11.1561 0.890192C11.0776 0.840436 10.9889 0.809138 10.8967 0.798659L8.94014 0.575406Z';
  const u = 14 / width; // screen px → drawing units
  return (
    <Svg width={width + far} height={(width * 26) / 14 + far} viewBox={`0 0 ${14 + far * u} ${26 + far * u}`} style={[{ position: 'absolute' }, style]} pointerEvents="none">
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
export function BannerRays({ style }: { style?: object }) {
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
/**
 * The design's line "EVERY SUNDAY" + "8AM" (the time gets the hand-drawn underline), from the next sale's real day and
 * time in India time. Null when there's no upcoming sale.
 */
function saleWhen(startsAt?: string | null): { lead: string; time: string } | null {
  const ms = startsAt ? new Date(startsAt).getTime() : NaN;
  if (!Number.isFinite(ms) || ms <= Date.now()) return null;
  const p = getIndiaDateParts(ms);
  const h = p.hours % 12 || 12;
  const time = `${h}${p.minutes ? `:${String(p.minutes).padStart(2, '0')}` : ''}${p.hours >= 12 ? 'PM' : 'AM'}`;
  return { lead: `EVERY ${WEEKDAYS[new Date(Date.UTC(p.year, p.month, p.date)).getUTCDay()]}`, time };
}

/** Figma "Vector 3": the hand-drawn white underline under the time (1.55 stroke, thin black drop shadow). */
const UNDERLINE = 'M0.0038 0.7799C0.0038 0.7799 14.1727 0.7077 22.7766 1.178C32.1027 1.6877 45.8303 2.8166 45.8303 2.8166';
function Underline({ width }: { width: number }) {
  return (
    <Svg width={width} height={4.37} viewBox="0 0 45.8938 4.36582" preserveAspectRatio="none" pointerEvents="none">
      <Path d={UNDERLINE} stroke="#000000" strokeWidth={1.55} transform="translate(0.6 0.6)" fill="none" />
      <Path d={UNDERLINE} stroke="#FFFFFF" strokeWidth={1.55} fill="none" />
    </Svg>
  );
}

const LINE2_SHADOW = { dx: -0.78, dy: 0.78, color: '#000000' };

export function FlashSaleBanner() {
  const router = useRouter();
  const { data: offers = [] } = useQuery(exclusiveOffersQueryOptions);
  // Only offers still running right now — a remembered offer that has ended never shows as LIVE, even before the refresh.
  const isLive = offers.some((o: any) => isOfferLive(o, Date.now(), true));
  // The second line follows the real sale: live now, else the next scheduled sale's day and time (set in the Operation
  // App), else the weekly schedule.
  // Always loaded (not only when nothing is live) so the Flash Sale page opens with it already known.
  const { data: nextSale } = useQuery(nextFlashSaleQueryOptions);
  const when = isLive ? null : saleWhen(nextSale?.startsAt);
  const subText = isLive ? 'LIVE NOW · BOOK DEALS' : when ? null : 'EVERY SUNDAY 8AM';
  const [timeW, setTimeW] = React.useState(0);
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
          <View style={{ width: 199.21, height: 32.58, marginVertical: -3.1, alignItems: 'center', justifyContent: 'center' }}>
            <Bolt width={12.08} line={0.42} near={0.35} far={1.04} style={{ left: 3.32, top: 6.27 }} />
            {/* Figma: upright, 0.93 black outline, 0.78 black + 2.33 #FF008B drop shadows; 156.73 wide (size 26.6 fits it) */}
            <CurvedLettering id="flashSaleTitleArc" text="FLASH SALE" width={156.73} size={26} shadow={{ dx: -2.33, dy: 2.33, color: '#FF008B' }} near={0.78} outline={0.93} font="PlusJakartaSans_700Bold" rise={8.5} />
            <Bolt width={12.08} line={0.42} near={0.35} far={1.04} style={{ left: 183.85, top: 6.27 }} />
          </View>
          <View style={styles.lettering}>
            {subText === 'EVERY SUNDAY 8AM' ? (
              <CurvedLettering id="flashSaleScheduleArc" text={subText} width={260} size={22} shadow={{ dx: -0.78, dy: 0.78, color: '#000000' }} near={0.78} outline={0.93} font="PlusJakartaSans_700Bold" rise={8.5} />
            ) : when ? (
              // Design: "EVERY SUNDAY 8AM" — day, then the time with the hand-drawn underline under it.
              <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
                <Lettering text={when.lead} size={23} shadow={LINE2_SHADOW} near={0.78} outline={0.93} skew="0deg" scaleY={1.15} font="PlusJakartaSans_700Bold" />
                <View onLayout={(e) => setTimeW(e.nativeEvent.layout.width)}>
                  <Lettering text={when.time} size={23} shadow={LINE2_SHADOW} near={0.78} outline={0.93} skew="0deg" scaleY={1.15} font="PlusJakartaSans_700Bold" />
                  {timeW > 0 && (
                    <View style={{ alignItems: 'center', marginTop: 1, transform: [{ rotate: '-1deg' }] }}>
                      <Underline width={timeW * 0.96} />
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <Lettering text={subText ?? 'LIVE NOW · BOOK DEALS'} width={260} size={23} shadow={LINE2_SHADOW} near={0.78} outline={0.93} skew="1deg" scaleY={1.15} font="PlusJakartaSans_700Bold" />
            )}
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
  // Figma Group 1171275692: 223.93 × 63.84 (both lines + the underline), centred +0.47 across, +1.92 down.
  text: { position: 'absolute', top: (106 - 63.84) / 2 + 1.92, left: (361 - 223.93) / 2 + 0.47, width: 223.93, height: 63.84, alignItems: 'center', overflow: 'visible' },
  lettering: {
     marginTop: -2, 
    //  transform: [{ rotate: '-1deg' }],
  }
});
