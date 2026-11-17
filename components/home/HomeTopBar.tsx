import React from 'react';
import { Image, ImageSourcePropType, ImageStyle, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Path, RadialGradient, Stop } from 'react-native-svg';
import HomeHeaderChevron from '@/assets/images/home_header_chevron.svg';
import HomeHeaderCalendar from '@/assets/images/home_header_calendar.svg';

/**
 * Figma "Frame 2147226296" (iPhone 16 - 77 top block): 393 × 210 below the status bar, gradient #332B72 → #6B5AED
 * (93.85%), bottom corners 20. Rows: header 0–64 · tabs 76–122 (tab line at 122) · date field 145–196 · 14 below.
 */

export const HERO_TOP = '#332B72';
const HERO_BOTTOM = '#6B5AED';

const F = {
  medium: 'PlusJakartaSans_500Medium',
  semi: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

/*
 * Tab artwork, from the Figma export of Frame 2147226296 (coordinates below are offsets from a tab's centre, y from the
 * top of the tabs at 76; the line is at y 46 = 122 on the frame). Both tabs share one shape; `e` widens or narrows its
 * flat parts so the slopes and corners stay the same on any screen width.
 */

/** The raised (selected) tab inside the Union outline: rounded feet ±94.92 on the line, flat top ±68.27. */
function raisedTab(cx: number, e: number, y0 = 0) {
  const X = (dx: number) => (cx + (dx < 0 ? dx - e : dx + e)).toFixed(2);
  const Y = (y: number) => (y + y0).toFixed(2);
  return (
    `C${X(-90.28)} ${Y(46)} ${X(-86.25)} ${Y(42.81)} ${X(-85.19)} ${Y(38.29)} ` +
    `L${X(-78)} ${Y(7.71)} C${X(-76.94)} ${Y(3.19)} ${X(-72.91)} ${Y(0)} ${X(-68.27)} ${Y(0)} ` +
    `H${X(68.27)} C${X(72.91)} ${Y(0)} ${X(76.94)} ${Y(3.19)} ${X(78)} ${Y(7.71)} ` +
    `L${X(85.19)} ${Y(38.29)} C${X(86.25)} ${Y(42.81)} ${X(90.28)} ${Y(46)} ${X(94.92)} ${Y(46)}`
  );
}

/** The open (unselected) tab's outline (Figma mask0): straight sides from ±87 on the line, flat top ±68.27. */
function selectedTab(cx: number, e: number) {
  const X = (dx: number) => (cx + (dx < 0 ? dx - e : dx + e)).toFixed(2);
  return (
    `M${X(87)} 46 L${X(78.005)} 7.71 C${X(76.943)} 3.19 ${X(72.911)} 0.5 ${X(68.27)} 0.5 ` +
    `H${X(-68.27)} C${X(-72.911)} 0.5 ${X(-76.943)} 3.19 ${X(-78.005)} 7.71 L${X(-87)} 46`
  );
}

type Props = {
  topInset: number;
  city: string;
  address?: string;
  onCityPress: () => void;
  sawariCash: number;
  vehicleType: 'car' | 'bike' | string;
  onType: (t: 'car' | 'bike') => void;
  dateLabel?: string;
  onDates: () => void;
};

/** 1,250 / 12,500 / 1,25,000 (Indian grouping); bad values show 0. */
function formatCash(n: number) {
  const v = Number.isFinite(Number(n)) ? Math.max(0, Math.floor(Number(n))) : 0;
  return v.toLocaleString('en-IN');
}

export function HomeTopBar({
  topInset, city, address = 'Kahilipara',
  onCityPress, sawariCash, vehicleType, onType, dateLabel, onDates,
}: Props) {
  // Everything in the tab artwork is laid out from the block's real width, not Figma's 393.
  const { width: windowW } = useWindowDimensions();
  const [W, setW] = React.useState(windowW);
  const selected = vehicleType === 'bike' ? 'bike' : 'car';
  return (
    <LinearGradient
      colors={[HERO_TOP, HERO_BOTTOM]}
      locations={[0, 0.9385]}
      style={[s.hero, { paddingTop: topInset }]}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
    >
      {/* Tabs artwork from 76 down to the bottom of the block (behind the tab labels and the date field). */}
      <TabArt width={W} selected={selected} style={{ top: topInset + 76 }} />
      {/* Location + SawariCash */}
      <View style={s.header}>
        <Pressable style={s.locWrap} onPress={onCityPress} hitSlop={6} accessibilityRole="button" accessibilityLabel={`${city}, ${address}. Change location`}>
          <View style={s.cityRow}>
            <Text allowFontScaling={false} style={s.city}>{city}</Text>
            <HomeHeaderChevron />
          </View>
          <Text allowFontScaling={false} style={s.address} numberOfLines={1}>{address}</Text>
        </Pressable>
        <View style={s.cashPill} accessible accessibilityLabel={`SawariCash ${formatCash(sawariCash)}`}>
          <Text allowFontScaling={false} style={s.cashText} numberOfLines={1}>{formatCash(sawariCash)}</Text>
          <Image source={require('@/assets/images/home_header_cash_icon.png')} style={{ width: 12, height: 12 }} resizeMode="contain" />
        </View>
      </View>

      <TypeTabs value={selected} onChange={onType} />

      {/* Select dates & times */}
      <View style={s.searchWrap}>
        <DateSearchBox dateLabel={dateLabel} onDates={onDates} />
      </View>
    </LinearGradient>
  );
}

/** "Select dates & times" field (361 × 51, 2px #D1CCF9, radius 12): in the header, and pinned at the top on scroll. */
export function DateSearchBox({ dateLabel, onDates }: { dateLabel?: string; onDates: () => void }) {
  return (
    <Pressable style={s.search} onPress={onDates} accessibilityRole="button" accessibilityLabel={dateLabel ? `Trip dates ${dateLabel}` : 'Select dates and times'}>
      <HomeHeaderCalendar />
      <Text allowFontScaling={false} style={[s.searchText, !!dateLabel && { color: '#262626' }]} numberOfLines={1}>
        {dateLabel || 'Select dates & times'}
      </Text>
    </Pressable>
  );
}

/** Frame 2147226253: Cars / Bikes & Scooters tab switch (Figma iPhone 16 - 77) */
function TypeTabs({ value, onChange }: { value: 'car' | 'bike'; onChange: (t: 'car' | 'bike') => void }) {
  return (
    <View style={s.tabsFrame} accessibilityRole="tablist">
      {/* Cars */}
      <Pressable
        onPress={() => onChange('car')}
        style={s.tabItem}
        accessibilityRole="tab"
        accessibilityState={{ selected: value === 'car' }}
      >
        <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[s.tabText, value === 'car' ? s.tabActive : s.tabInactive]}>
          Cars
        </Text>
      </Pressable>

      {/* Bikes & Scooters */}
      <Pressable
        onPress={() => onChange('bike')}
        style={s.tabItem}
        accessibilityRole="tab"
        accessibilityState={{ selected: value === 'bike' }}
      >
        <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[s.tabText, value === 'bike' ? s.tabActive : s.tabInactive]}>
          Bikes & Scooters
        </Text>
      </Pressable>
    </View>
  );
}

/**
 * The tab artwork, as in the Figma export:
 * - Union: the line at 122 across the whole width, rising into the raised SELECTED tab, and everything below the
 *   line down to the bottom of the block. Filled #332B72 (at 76) → #6B5AED (at 198), so it is a shade darker than the
 *   block's own gradient. Its 1px cream #FEFDF0 edge fades from 100% at the tab top to 0 at 203.5 (≈ 64% on the line).
 * - The other (unselected) tab is open: no fill, only its outline lit by a soft cream glow (Figma Ellipse 132 × 91,
 *   blur 42, masked to the outline). The glow centres 49.47 right of that tab's centre and 20.5 below its top, so its
 *   right side is the bright one and its left side fades out.
 * - Cars selected: dark tab over Cars, glow on the Bikes outline (Figma 1855:15387). Bikes selected: dark tab over
 *   Bikes, glow on the Cars outline (Figma 1903:16133).
 * Tab centres are the label centres: each half of the row (16 padding each side).
 */
function TabArt({ width: W, selected, style }: { width: number; selected: 'car' | 'bike'; style?: object }) {
  const col = (W - 32) / 2;
  const e = (col - 180.5) / 2; // 180.5 = Figma column width on a 393 screen
  const carX = 16 + col / 2;
  const bikeX = 16 + col * 1.5;
  // The SELECTED tab is the raised dark one; the other tab is open, only its outline lit by the glow.
  const raisedX = selected === 'car' ? carX : bikeX;
  const openX = selected === 'car' ? bikeX : carX;
  // Figma: the glow sits 49.47 right of the open tab's centre in both states (336.47 over Bikes when Cars is
  // selected, 155.47 over Cars when Bikes is selected).
  const glowX = openX + 49.47;
  const left = (raisedX - 94.92 - e).toFixed(2);
  const H = 140; // to the block's bottom (210 − 76) and a little past it; the block clips the rest
  const unionFill = `M-1 46 H${left} ${raisedTab(raisedX, e)} H${W + 1} V${H} H-1 Z`;
  const unionEdge = `M-1 46.5 H${left} ${raisedTab(raisedX, e, 0.5)} H${W + 1}`;
  return (
    <Svg width={W} height={H} style={[s.tabArt, style]} pointerEvents="none">
      <Defs>
        <SvgLinearGradient id="unionFill" x1="0" y1="0" x2="0" y2="122" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={HERO_TOP} />
          <Stop offset="1" stopColor={HERO_BOTTOM} />
        </SvgLinearGradient>
        <SvgLinearGradient id="unionEdge" x1="0" y1="0" x2="0" y2="127.5" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FEFDF0" stopOpacity={1} />
          <Stop offset="1" stopColor="#FEFDF0" stopOpacity={0} />
        </SvgLinearGradient>
        {/* The blurred ellipse's light (Gaussian blur 42 worked out), as a radial fade */}
        <RadialGradient id="tabGlow" cx={glowX} cy="20.5" rx="150" ry="120" fx={glowX} fy="20.5" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FEFDF0" stopOpacity={0.64} />
          <Stop offset="0.2" stopColor="#FEFDF0" stopOpacity={0.57} />
          <Stop offset="0.4" stopColor="#FEFDF0" stopOpacity={0.4} />
          <Stop offset="0.6" stopColor="#FEFDF0" stopOpacity={0.2} />
          <Stop offset="0.8" stopColor="#FEFDF0" stopOpacity={0.07} />
          <Stop offset="1" stopColor="#FEFDF0" stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Path d={selectedTab(openX, e)} fill="none" stroke="url(#tabGlow)" strokeWidth={1} />
      <Path d={unionFill} fill="url(#unionFill)" />
      <Path d={unionEdge} fill="none" stroke="url(#unionEdge)" strokeWidth={1} />
    </Svg>
  );
}

/* ───────────── Category tiles (SUV / Sedan / Hatchback / MUV) ───────────── */

export type CategoryTile = {
  label: string;
  value: string;
  image: ImageSourcePropType;
  imageFrameWidth: number;
  /** Figma nudges each label a fraction off centre (left: 50% − 30 ± x). */
  labelShift?: number;
  imageStyle: ImageStyle;
};

export const CAR_CATEGORIES: CategoryTile[] = [
  {
    label: 'SUV',
    value: 'SUV',
    image: require('../../assets/images/home_category_suv.png'),
    imageFrameWidth: 74,
    labelShift: -0.12,
    imageStyle: {},
  },
  {
    label: 'Sedan',
    value: 'Sedan',
    image: require('../../assets/images/home_category_sedan.png'),
    imageFrameWidth: 79,
    labelShift: -0.38,
    imageStyle: {},
  },
  {
    label: 'Hatchback',
    value: 'Hatchback',
    image: require('../../assets/images/home_category_hatchback.png'),
    imageFrameWidth: 78,
    labelShift: 0.38,
    imageStyle: {},
  },
  {
    label: 'MUV / MPV',
    value: 'MUV',
    image: require('../../assets/images/home_category_muv.png'),
    imageFrameWidth: 74,
    labelShift: 0.12,
    imageStyle: {},
  },
];

export function CategoryTiles({ items, onPick, dark }: { items: CategoryTile[]; onPick: (t: CategoryTile) => void; dark?: boolean }) {
  return (
    <View style={s.tiles}>
      {items.map((t) => (
        <Pressable key={t.value} style={{ flex: 1 }} onPress={() => onPick(t)} accessibilityRole="button" accessibilityLabel={t.label}>
          <View style={[s.tile, { backgroundColor: dark ? '#1F1B3D' : '#F7F6FE' }]}>
            <View style={[s.tileImageFrame, { width: t.imageFrameWidth, maxWidth: '100%' }]}>
              <Image source={t.image} style={s.tileImg} resizeMode="contain" />
            </View>
            {/* Label tab (Figma 1781:15405): white, top corners 6, a 1px inside stroke that is #6B5AED at the top and
                fades to nothing at the bottom (linear gradient, top → bottom) */}
            <View style={[s.tileLabelWrap, !!t.labelShift && { transform: [{ translateX: t.labelShift }] }, dark && { backgroundColor: '#1A1D29' }]}>
              <FadeOutline id={`tileEdge${t.value}`} width={60} height={19} vertical start={1} end={0} d="M0.5 19 V6.5 A6 6 0 0 1 6.5 0.5 H53.5 A6 6 0 0 1 59.5 6.5 V19" />
              <Text allowFontScaling={false} style={[s.tileLabel, dark && { color: '#E5E7EB' }]} numberOfLines={1}>{t.label}</Text>
            </View>
            {/* The tile's 1px border is drawn last, as Figma draws a frame's stroke over its children: it runs along the
                label's bottom too, instead of being covered by it. */}
            <View pointerEvents="none" style={[s.tileStroke, dark && { borderColor: 'rgba(107,90,237,0.35)' }]} />
          </View>
        </Pressable>
      ))}
    </View>
  );
}


/** "Bikes" / "Scooters" label: white, left corners rounded, 1px purple outline strongest on the left, none on the right. */
function BikeLabel({ text, dark }: { text: string; dark?: boolean }) {
  return (
    <View style={[s.bikeBadge, dark && { backgroundColor: '#1A1D29' }]}>
      {/* Open on the right (it runs into the tile's edge): top, left and bottom, purple fading out to the right */}
      <FadeOutline id={`bikeEdge${text}`} width={76} height={27} start={1} hold={0.4} d="M76 0.5 H6.5 A6 6 0 0 0 0.5 6.5 V20.5 A6 6 0 0 0 6.5 26.5 H76" />
      {/* Narrow / curved-edge phones: the label shrinks with the tile and the word shrinks to fit, never spills out. */}
      <Text allowFontScaling={false} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={[s.bikeBadgeText, dark && { color: '#E5E7EB' }]}>{text}</Text>
    </View>
  );
}

/**
 * 1px label outline drawn in SVG so it can fade along its length (a border can't). Bike labels (Figma): #6B5AED solid
 * over the left 40%, fading to nothing at the right edge. Car tile labels: #6B5AED at the top fading down.
 */
function FadeOutline({ id, width, height, d, start = 0.7, end = 0, hold = 0, vertical = false }: { id: string; width: number; height: number; d: string; start?: number; end?: number; hold?: number; vertical?: boolean }) {
  // `hold`: stays at full strength this far along before it starts to fade (bike labels: 40%).
  const stops: [number, number][] = hold > 0 ? [[0, start], [hold, start], [1, end]] : [[0, start], [1, end]];
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        {/* Only <Stop> elements inside a gradient: react-native-svg reads every child's props, so a conditional
            `{x && <Stop />}` that turns out false crashes it. */}
        <SvgLinearGradient id={id} x1="0" y1="0" x2={vertical ? 0 : width} y2={vertical ? height : 0} gradientUnits="userSpaceOnUse">
          {stops.map(([offset, opacity]) => (
            <Stop key={offset} offset={offset} stopColor="#6B5AED" stopOpacity={opacity} />
          ))}
        </SvgLinearGradient>
      </Defs>
      <Path d={d} stroke={`url(#${id})`} strokeWidth={1} fill="none" />
    </Svg>
  );
}

/* ───────────── Bike & Scooter Category tiles (Frame 2147226276) ───────────── */

export function BikeCategoryTiles({ onPick, dark }: { onPick: (filter: { transmission?: string; category?: string }) => void; dark?: boolean }) {
  return (
    <View style={s.bikeTilesRow}>
      {/* Frame 2147226269: Bikes */}
      <Pressable
        style={s.bikeTileWrap}
        onPress={() => onPick({ transmission: 'Manual', category: 'Bike' })}
        accessibilityRole="button"
        accessibilityLabel="Bikes"
      >
        <View style={[s.bikeTile, dark && { backgroundColor: '#1F1B3D', borderColor: 'rgba(107, 90, 237, 0.4)' }]}>
          <View style={s.bikeImgBox}>
            <Image source={require('../../assets/images/category_bike.png')} style={[s.bikeImg, { marginLeft: 12.45 }]} resizeMode="contain" />
          </View>
          <BikeLabel text="Bikes" dark={dark} />
        </View>
      </Pressable>

      {/* Frame 2147226270: Scooters */}
      <Pressable
        style={s.bikeTileWrap}
        onPress={() => onPick({ transmission: 'Automatic', category: 'Bike' })}
        accessibilityRole="button"
        accessibilityLabel="Scooters"
      >
        <View style={[s.bikeTile, dark && { backgroundColor: '#1F1B3D', borderColor: 'rgba(107, 90, 237, 0.4)' }]}>
          <View style={s.bikeImgBox}>
            <Image source={require('../../assets/images/category_scooter.png')} style={[s.bikeImg, { marginLeft: 14.1 }]} resizeMode="contain" />
          </View>
          <BikeLabel text="Scooters" dark={dark} />
        </View>
      </Pressable>
    </View>
  );
}

/* ───────────── Refer strip (sits on top of the trip-milestone card) ───────────── */

export function ReferCard({ amount = '₹50+', onPress, dark }: { amount?: string; onPress: () => void; dark?: boolean }) {
  return (
    // Outline as in the design: #6B5AED along the top, fading down the sides to the card's lavender (no bottom edge:
    // the strip sits on the milestone card).
    <LinearGradient colors={['rgba(107, 90, 237, 0.85)', 'rgba(107, 90, 237, 0.16)']} style={s.referEdge}>
    <Pressable onPress={onPress} accessibilityRole="button" style={[s.refer, dark && { backgroundColor: '#1F2233' }]}>
      <View style={[s.referIcon, dark && { backgroundColor: '#2A2D3E' }]}>
        <Image source={require('../../assets/images/refer_hand_coin.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.referTop}>
          <Text allowFontScaling={false} style={[s.referTitle, dark && { color: '#F3F4F6' }]}>Refer & Earn {amount}</Text>
          <View style={s.referBtn}>
            <Text allowFontScaling={false} style={s.referBtnText}>Refer</Text>
            <Ionicons name="arrow-forward" size={8} color="#FFFFFF" />
          </View>
        </View>
        <Text allowFontScaling={false} style={[s.referSub, dark && { color: '#9CA3AF' }]} numberOfLines={1}>Get 10% of your friend’s booking payment.</Text>
      </View>
    </Pressable>
    </LinearGradient>
  );
}

/** Light rounded container used around Recommended Cars and Top Destination. */
export function Panel({ children, dark, variant = 'recommended' }: { children: React.ReactNode; dark?: boolean; variant?: 'recommended' | 'destinations' }) {
  return (
    <View
      style={[
        s.panel,
        variant === 'destinations' && s.destinationPanel,
        dark && { backgroundColor: '#161925', borderColor: '#262A3A' },
      ]}
    >
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  hero: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' },
  // Fixed 64: the tab artwork is pinned at topInset + 76, so this row must never grow.
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, height: 64 },
  locWrap: { flex: 1 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  city: { fontFamily: F.semi, fontSize: 15, lineHeight: 22, color: '#FFFFFF' },
  address: { fontFamily: F.medium, fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.8)' },
  cashPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    minWidth: 72, height: 42, paddingHorizontal: 12, borderRadius: 40,
    backgroundColor: '#F0EFFD', borderWidth: 1, borderColor: '#D1CCF9',
  },
  cashText: { fontFamily: F.semi, fontSize: 13, color: '#2F3E75' },
  headerArtwork: { position: 'absolute' },
  // Frame 2147226253: Cars / Bikes & Scooters tab switch
  tabsFrame: {
    height: 49,
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    alignSelf: 'stretch',
  },
  // Tab artwork: from the top of the tabs (Figma 76) to the bottom of the block, full width.
  tabArt: { position: 'absolute', left: 0 },
  // Each label is kept inside its tab's sloped sides (≈15 in from the column edge at mid-height).
  tabItem: {
    flex: 1,
    height: 49,
    paddingHorizontal: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontFamily: F.semi, // no fontWeight: with a custom family Android would swap in the system font
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    includeFontPadding: false,
  },
  tabActive: {
    color: '#FFFFFF',
  },
  tabInactive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  // Date field 145–196, 14 below it → 210 total (Figma). 64 + 12 + 49 + 8 + 12 = 145.
  searchWrap: { marginTop: 8, paddingTop: 12, paddingHorizontal: 16, paddingBottom: 14 },
  search: {
    height: 51, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12,
    backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#D1CCF9', borderRadius: 12,
  },
  searchText: { flex: 1, fontFamily: F.medium, fontSize: 15, lineHeight: 22, color: '#737373' },
  tiles: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 16 },
  tile: {
    // Figma Frame 2147226269: 51 high, flat #F7F6FE, 1px rgba(107,90,237,0.16) (drawn on top by tileStroke), radius 8.
    height: 51, borderRadius: 8, borderWidth: 1, borderColor: 'transparent',
    alignItems: 'center', paddingHorizontal: 8, paddingTop: 2, paddingBottom: 2, overflow: 'hidden',
  },
  tileStroke: { position: 'absolute', top: -1, left: -1, right: -1, bottom: -1, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(107,90,237,0.16)' },
  tileImageFrame: { height: 45, position: 'relative', flexShrink: 0 },
  tileImg: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' },
  // Figma 60 × 19 tab at the bottom (padding 2/4/1); its gradient stroke is the FadeOutline SVG inside it.
  tileLabelWrap: {
    position: 'absolute', bottom: -1, alignSelf: 'center', width: 60, height: 19,
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 6, borderTopRightRadius: 6,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingTop: 2, paddingBottom: 1, paddingHorizontal: 4,
  },
  tileLabel: { flex: 1, fontFamily: F.bold, fontSize: 9, lineHeight: 14, color: '#262626', textAlign: 'center' },

  // Frame 2147226276: Bikes & Scooters
  bikeTilesRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, marginTop: 16 },
  bikeTileWrap: { flex: 1, height: 51 },
  bikeTile: {
    // Figma Frame 2147226269 (bikes): 51 high, flat #EFEDFD, 1px #D1CCF9, radius 8, padding 2/0, picture and label apart.
    flex: 1, height: 51, flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#EFEDFD',
    alignItems: 'center', paddingVertical: 2, borderWidth: 1, borderColor: '#D1CCF9',
    borderRadius: 8, overflow: 'hidden',
  },
  // The space left of the label (Figma 98.5 wide). The picture is 72.3 × 48.2 (the 3:2 PNG at 73% of that box),
  // 12.45 (bike) / 14.1 (scooter) in from its left, centred top to bottom, as in Figma 1903:16133.
  bikeImgBox: { flex: 1, minWidth: 0, alignSelf: 'stretch', justifyContent: 'center' },
  bikeImg: { width: 72.3, height: 48.2, maxWidth: '100%' },
  // 76 × 27 label, left corners 6, padding 4; its fading outline is the FadeOutline SVG inside it.
  bikeBadge: {
    width: 76, maxWidth: '50%', flexShrink: 1, height: 27, backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 6, borderBottomLeftRadius: 6,
    alignItems: 'center', justifyContent: 'center', padding: 4,
  },
  bikeBadgeText: { alignSelf: 'stretch', fontFamily: F.bold, fontSize: 11, lineHeight: 16, textAlign: 'center', color: '#262626' },
  // Frame 2147225720: 331 × 57, flat top-rounded strip sitting directly on the milestone card
  // 331 × 57 strip: a 1px edge on top and sides (referEdge), the #EFEDFD strip inside (padding 8 − 1 for the edge).
  referEdge: { marginHorizontal: 31, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingTop: 1, paddingHorizontal: 1 },
  refer: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 7, paddingHorizontal: 7, paddingBottom: 8, backgroundColor: '#EFEDFD', borderTopLeftRadius: 15, borderTopRightRadius: 15 },
  referIcon: { width: 40, height: 40, borderRadius: 40, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center' },
  referTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  referTitle: { fontFamily: F.semi, fontSize: 13, lineHeight: 20, color: '#262626', includeFontPadding: false },
  referSub: { fontFamily: F.medium, fontSize: 11, lineHeight: 16.5, color: '#737373', includeFontPadding: false },
  referBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, height: 20, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#6B5AED', borderRadius: 31 },
  referBtnText: { fontFamily: F.bold, fontSize: 8, lineHeight: 12, color: '#FFFFFF', includeFontPadding: false },
  panel: {
    marginHorizontal: 16, padding: 8, borderRadius: 12,
    backgroundColor: '#F7F6FE', borderWidth: 1, borderColor: '#EFEDFD', overflow: 'hidden',
  },
  destinationPanel: { backgroundColor: '#F8FCFA', borderColor: '#E4F1ED' },
});