import React from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Haptics from '@/utils/haptics';
import { exclusiveOffersQueryOptions, isOfferLive, nextFlashSaleQueryOptions } from '@/services/api/offers';
import { getIndiaDateParts } from '@/utils/sawari';

/**
 * Figma "Home" / "Frame 2147226271": the Flash Sale banner.
 * 361 × 106, #3E2DC8, radius 16, flex: none (fixed size, never grows). Tap opens the Flash Sale screen.
 *
 *   ⚡ FLASH SALE ⚡        white, 0.93 black outline, 0.78 black + 2.33 #FF008B hard shadows (down-left)
 *   EVERY SUNDAY 8AM       white, 0.93 black outline, 0.78 black hard shadow; time has a hand-drawn underline
 */

const CARD_W = 361;
const CARD_H = 106;
const SIDE_PADDING = 16;

// Design font is a heavy geometric sans. Use 800 if it's loaded in the app, otherwise fall back to 700.
const FONT = 'PlusJakartaSans_800ExtraBold';

/* ------------------------------------------------------------------------------------------------ */
/* Lettering                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

// React Native has no text stroke: the outline is 8 black copies nudged around the white text,
// and each hard offset shadow is one more copy behind them.
const NUDGE: [number, number][] = [
  [-1, 0], [1, 0], [0, -1], [0, 1],
  [-0.7, -0.7], [0.7, 0.7], [-0.7, 0.7], [0.7, -0.7],
];

type Shadow = { dx: number; dy: number; color: string };

/**
 * Outlined lettering with hard offset shadows.
 * `shadow`: the far (coloured) shadow. `near`: distance of the thin black shadow (default 0.4 × the far one).
 * `outline`: outline thickness. `skew` / `scaleY`: slant and vertical stretch (the Figma font is taller than ours).
 */
export function Lettering({
  text, width, size, shadow, font = FONT, near, outline = 1, skew = '0deg', scaleY = 1,
}: {
  text: string; width?: number; size: number; shadow: Shadow; font?: string;
  near?: number; outline?: number; skew?: string; scaleY?: number;
}) {
  const lineHeight = Math.round(size * 1.15);
  const base = {
    fontFamily: font,
    fontSize: size,
    lineHeight,
    width,
    textAlign: 'center' as const,
    includeFontPadding: false,
  };
  // Only shrink-to-fit when a fixed width is given; otherwise every copy must render at exactly the same size,
  // or the outline drifts off the white letters.
  const fit = width !== undefined;

  const copy = (color: string, dx: number, dy: number, key: string) => (
    <Text
      key={key}
      allowFontScaling={false}
      numberOfLines={1}
      adjustsFontSizeToFit={fit}
      style={[base, styles.abs, { left: dx, top: dy, color }]}
    >
      {text}
    </Text>
  );

  const nx = near !== undefined ? Math.sign(shadow.dx) * near : shadow.dx * 0.4;
  const ny = near !== undefined ? Math.sign(shadow.dy) * near : shadow.dy * 0.4;

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={{ width, height: lineHeight, transform: [{ skewX: skew }, { scaleY }] }}
    >
      {copy(shadow.color, shadow.dx, shadow.dy, 'far')}
      {copy('#000000', nx, ny, 'near')}
      {NUDGE.map(([dx, dy], i) => copy('#000000', dx * outline, dy * outline, `o${i}`))}
      <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit={fit} style={[base, { color: '#FFFFFF' }]}>
        {text}
      </Text>
    </View>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Bolt                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

const BOLT_PATH =
  'M8.94014 0.575406C7.05022 0.360281 5.142 0.360281 3.25209 0.575406L1.29556 0.798659C1.15518 0.814791 1.02468 0.878901 0.92611 0.980149C0.827543 1.0814 0.76696 1.21358 0.754602 1.35434L0.603722 3.04959C0.350843 5.89926 0.350843 8.76572 0.603722 11.6154L0.754602 13.3106C0.768093 13.4634 0.838288 13.6055 0.951357 13.709C1.06443 13.8125 1.21217 13.87 1.36548 13.87H3.9059V22.9498C3.90613 23.0767 3.94573 23.2004 4.01924 23.3039C4.09275 23.4074 4.19655 23.4855 4.31633 23.5275C4.43611 23.5695 4.56597 23.5733 4.68799 23.5383C4.81002 23.5034 4.91821 23.4315 4.99764 23.3325L5.47726 22.7314C8.33492 19.1541 10.6105 15.1485 12.2202 10.8622L12.4533 10.2403C12.4882 10.1475 12.5001 10.0476 12.4879 9.9492C12.4758 9.8508 12.4399 9.75681 12.3835 9.67529C12.3271 9.59377 12.2517 9.52714 12.1639 9.48113C12.0761 9.43511 11.9784 9.41107 11.8792 9.41107H8.55128L11.4033 1.6193C11.4353 1.53211 11.447 1.43879 11.4377 1.34639C11.4283 1.25399 11.3981 1.16492 11.3494 1.08589C11.3006 1.00686 11.2345 0.939948 11.1561 0.890192C11.0776 0.840436 10.9889 0.809138 10.8967 0.798659L8.94014 0.575406Z';

/** Gold bolt (Figma Vector): black outline, then a thin black and a wider #E58900 hard shadow down-right. */
export function Bolt({
  style, width = 13, line = 1.2, near = 1, far = 3,
}: { style?: object; width?: number; line?: number; near?: number; far?: number }) {
  const u = 14 / width; // screen px → drawing units
  return (
    <Svg
      width={width + far}
      height={(width * 26) / 14 + far}
      viewBox={`0 0 ${14 + far * u} ${26 + far * u}`}
      style={style}
      pointerEvents="none"
    >
      <Path d={BOLT_PATH} fill="#E58900" transform={`translate(${far * u},${far * u})`} />
      <Path d={BOLT_PATH} fill="#000000" transform={`translate(${near * u},${near * u})`} />
      <Path d={BOLT_PATH} fill="#FBC422" stroke="#000000" strokeWidth={line * u} strokeLinejoin="round" />
    </Svg>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Rays                                                                                              */
/* ------------------------------------------------------------------------------------------------ */

/**
 * Figma "Repeat group 1": 18 rays (one every 20°), white 70% → 0, overlay blend.
 * Drawn in code because the exported SVG uses `<use href>` ids react-native-svg can't resolve; the overlay's
 * lightening is approximated with group opacity (mixBlendMode on the Svg is used where RN supports it).
 */
const RAYS_SIZE = 560.675;
const RAYS_C = RAYS_SIZE / 2;
const RAY = 'M260.716 0.687536H299.959L285.057 280.338H275.619L260.716 0.687536Z';

export function BannerRays({ style }: { style?: object }) {
  return (
    <Svg width={RAYS_SIZE} height={RAYS_SIZE} viewBox={`0 0 ${RAYS_SIZE} ${RAYS_SIZE}`} style={style} pointerEvents="none">
      <Defs>
        <LinearGradient id="bannerRay" x1={RAYS_C} y1="0.6875" x2={RAYS_C} y2={RAYS_C} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.7} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
        </LinearGradient>
      </Defs>
      <G opacity={0.33}>
        {Array.from({ length: 18 }, (_, i) => (
          <Path key={i} d={RAY} fill="url(#bannerRay)" transform={`rotate(${i * 20} ${RAYS_C} ${RAYS_C})`} />
        ))}
      </G>
    </Svg>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Underline                                                                                         */
/* ------------------------------------------------------------------------------------------------ */

/** Figma "Vector 3": hand-drawn white underline (1.55 stroke) with a thin black drop shadow. Stretches to its box. */
const UNDERLINE =
  'M0.0038 0.7799C0.0038 0.7799 14.1727 0.7077 22.7766 1.178C32.1027 1.6877 45.8303 2.8166 45.8303 2.8166';

function Underline() {
  return (
    <Svg width="100%" height={4.37} viewBox="0 0 45.8938 4.36582" preserveAspectRatio="none" pointerEvents="none">
      <Path d={UNDERLINE} stroke="#000000" strokeWidth={1.55} strokeLinecap="round" transform="translate(0.6 0.6)" fill="none" />
      <Path d={UNDERLINE} stroke="#FFFFFF" strokeWidth={1.55} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

/* ------------------------------------------------------------------------------------------------ */
/* Sale timing                                                                                       */
/* ------------------------------------------------------------------------------------------------ */

const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const DEFAULT_WHEN = { lead: 'EVERY SUNDAY', time: '8AM' };

/** "EVERY SUNDAY" + "8AM" from the next sale's real start, in India time. Null when it isn't in the future. */
function saleWhen(startsAt: string | null | undefined, now: number): { lead: string; time: string } | null {
  const ms = startsAt ? new Date(startsAt).getTime() : NaN;
  if (!Number.isFinite(ms) || ms <= now) return null;
  const p = getIndiaDateParts(ms);
  const h = p.hours % 12 || 12;
  const mins = p.minutes ? `:${String(p.minutes).padStart(2, '0')}` : '';
  const time = `${h}${mins}${p.hours >= 12 ? 'PM' : 'AM'}`;
  const weekday = WEEKDAYS[new Date(Date.UTC(p.year, p.month, p.date)).getUTCDay()];
  return { lead: `EVERY ${weekday}`, time };
}

/** Current time, refreshed every 30s so LIVE / upcoming flips on its own without a refetch. */
function useNow(intervalMs = 30_000) {
  const [now, setNow] = React.useState(() => Date.now());
  React.useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

/* ------------------------------------------------------------------------------------------------ */
/* Banner                                                                                            */
/* ------------------------------------------------------------------------------------------------ */

const TITLE = { size: 26.6, shadow: { dx: -2.33, dy: 2.33, color: '#FF008B' }, near: 0.78, outline: 0.93, scaleY: 1.15 };
const LINE2 = { size: 23, shadow: { dx: -0.78, dy: 0.78, color: '#000000' }, near: 0.78, outline: 0.93, scaleY: 1.15 };
const BOLT = { width: 12.08, line: 0.42, near: 0.35, far: 1.04 };

export function FlashSaleBanner() {
  const router = useRouter();
  const now = useNow();

  const { data: offers = [] } = useQuery(exclusiveOffersQueryOptions);
  // Always loaded (not only when nothing is live) so the Flash Sale page opens with it already known.
  const { data: nextSale } = useQuery(nextFlashSaleQueryOptions);

  // Only offers running right now — a cached offer that has ended never shows as LIVE.
  const isLive = offers.some((o: any) => isOfferLive(o, now, true));
  // Live now → "LIVE NOW · BOOK DEALS"; else next scheduled sale (Operation App); else the weekly default.
  const when = isLive ? null : saleWhen(nextSale?.startsAt, now) ?? DEFAULT_WHEN;

  // The lettering is laid out on a fixed 361-wide card: on narrower phones the whole card scales down to fit.
  const { width: screenW } = useWindowDimensions();
  const k = Math.min(1, (screenW - SIDE_PADDING * 2) / CARD_W);

  const a11yLabel = when ? `Flash Sale, ${when.lead.toLowerCase()} at ${when.time}` : 'Flash Sale, live now, book deals';

  return (
    <View style={[styles.row, { height: CARD_H * k }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={a11yLabel}
        onPress={() => {
          Haptics.selectionAsync();
          router.push('/flash-sale');
        }}
        style={({ pressed }) => [
          styles.card,
          k < 1 && { transform: [{ scale: k }], marginHorizontal: -(CARD_W * (1 - k)) / 2, marginVertical: -(CARD_H * (1 - k)) / 2 },
          pressed && styles.pressed,
        ]}
      >
        <BannerRays style={styles.rays} />

        <View style={styles.content} pointerEvents="none">
          {/* ⚡ FLASH SALE ⚡ — one straight row, bolts equidistant from the words, centred on the card. */}
          <View style={styles.titleRow}>
            <Bolt {...BOLT} style={styles.bolt} />
            <Lettering text="FLASH SALE" {...TITLE} />
            <Bolt {...BOLT} style={styles.bolt} />
          </View>

          {when ? (
            <View style={styles.whenRow}>
              <Lettering text={when.lead} {...LINE2} />
              {/* The underline hangs below the time without adding height, so both lines stay centred. */}
              <View>
                <Lettering text={when.time} {...LINE2} />
                <View style={styles.underline}>
                  <Underline />
                </View>
              </View>
            </View>
          ) : (
            <Lettering text="LIVE NOW · BOOK DEALS" {...LINE2} />
          )}
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  abs: { position: 'absolute' },

  row: {
    paddingHorizontal: SIDE_PADDING,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Figma "Home": 361 × 106, #3E2DC8, radius 16, flex: none.
  card: {
    width: CARD_W,
    height: CARD_H,
    flexGrow: 0,
    flexShrink: 0,
    borderRadius: 16,
    backgroundColor: '#3E2DC8',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.92 },

  // Rays centred on the card (ray centre at x 180.5, y ~52).
  rays: {
    position: 'absolute',
    left: CARD_W / 2 - RAYS_C,
    top: CARD_H / 2 - RAYS_C - 1,
    mixBlendMode: 'overlay',
  },

  // Figma Group 1171275692: 63.84 high, sitting 1.92 below centre. Full card width so a long line
  // ("EVERY WEDNESDAY 10:30PM") stays on one line.
  content: {
    alignSelf: 'stretch',
    alignItems: 'center',
    transform: [{ translateY: 1.92 }],
  },

  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bolt: { marginTop: 2 },

  whenRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, marginTop: 2 },

  underline: {
    position: 'absolute',
    top: '100%',
    left: '2%',
    right: '2%',
    marginTop: 1,
    transform: [{ rotate: '-1deg' }],
  },
});