import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ImageSourcePropType, ScrollView, useWindowDimensions, Linking, Alert } from 'react-native';
import { Feather, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, Text as SvgText, TextPath, G, RadialGradient, Stop } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { LoadingImage } from '@/components/common/LoadingImage';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { formatCurrency, memberDayPrice, type QuoteParams } from '@/services/backend/pricingEngine';
import { Car, getAvailability, getCarHighlights } from '@/utils/sawari';
import { SOCIAL_LINKS } from '@/constants/social';

// Home page (Figma "Home"): purple banner, refer strip, Cars / Bikes search card, then the sections below.
export const HOME_PURPLE = '#6152D8';

// ── Top banner ───────────────────────────────────────────────────────────────

// Each slide is something MySawari really offers (the same promises as the Benefits grid).
const SLIDES: { lines: [string, string]; sub: string[] }[] = [
  { lines: ['LOWEST PRICE', 'GUARANTEED'], sub: ['Zero security Deposit', 'Pickup/ Drop-off Delivery', 'Self drive/ driver'] },
  { lines: ['DOORSTEP', 'DELIVERY'], sub: ['Anywhere in Guwahati', 'Pickup/ Drop-off Delivery', 'Self drive/ driver'] },
];

// Sunburst (Figma): 36 thin wedges from the headline's centre, every other one lighter. The light
// wedges fade out towards the centre so the rays melt into a soft glow behind the headline.
function Sunburst({ width, height, cy }: { width: number; height: number; cy: number }) {
  const cx = width / 2, r = Math.hypot(width, height) * 1.2, n = 36;
  const reach = Math.hypot(width / 2, Math.max(cy, height - cy));
  const wedges = Array.from({ length: n / 2 }, (_, i) => {
    // Offset half a wedge so a dark ray points straight up, as in the design.
    const a0 = ((i * 2 + 0.5) / n) * Math.PI * 2, a1 = ((i * 2 + 1.5) / n) * Math.PI * 2;
    return `M${cx},${cy} L${cx + r * Math.cos(a0)},${cy + r * Math.sin(a0)} L${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} Z`;
  });
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <RadialGradient id="rays" cx={cx} cy={cy} r={reach} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0} />
          <Stop offset="0.25" stopColor="#FFFFFF" stopOpacity={0.05} />
          <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.13} />
        </RadialGradient>
      </Defs>
      {wedges.map((d, i) => <Path key={i} d={d} fill="url(#rays)" />)}
    </Svg>
  );
}

// Headline lettering (Figma): plain white condensed caps on a gentle upward arch, each letter fanning
// with the curve, and a soft blurred shadow falling down-right. The blur is built from faint stacked
// copies (SVG filters on text are unreliable on Android). Widths are fixed to the design's.
const ARC_W = 320;
const ARC_LINES = [
  { y: 62, rise: 10, width: 236, size: 44 },
  { y: 110, rise: 7, width: 164, size: 31 },
];
const SHADOW = { dx: 3, dy: 5, color: '#1E1466' };
// Rings of offsets around the shadow's centre; inner copies darker, outer fainter → a soft edge.
const SHADOW_TAPS = [
  { r: 0, n: 1, o: 0.08 },
  { r: 2, n: 8, o: 0.03 },
  { r: 4, n: 12, o: 0.016 },
  { r: 6, n: 16, o: 0.008 },
].flatMap(({ r, n, o }) => Array.from({ length: n }, (_, i) => ({
  x: SHADOW.dx + r * Math.cos((i / n) * Math.PI * 2),
  y: SHADOW.dy + r * Math.sin((i / n) * Math.PI * 2),
  o,
})));

function ArcHeadline({ lines }: { lines: [string, string] }) {
  return (
    <Svg width={ARC_W} height={132} accessibilityLabel={lines.join(' ')}>
      <Defs>
        {ARC_LINES.map((l, i) => {
          const x0 = (ARC_W - l.width) / 2 - 12, x1 = (ARC_W + l.width) / 2 + 12;
          return <Path key={i} id={`arc${i}`} d={`M${x0},${l.y} Q${ARC_W / 2},${l.y - l.rise * 2} ${x1},${l.y}`} />;
        })}
      </Defs>
      {ARC_LINES.map((l, i) => {
        const text = (fill: string, opacity = 1) => (
          <SvgText fill={fill} fillOpacity={opacity} fontFamily="Anton_400Regular" fontSize={l.size} textAnchor="middle">
            <TextPath href={`#arc${i}`} startOffset="50%" textLength={l.width} lengthAdjust="spacingAndGlyphs">{lines[i]}</TextPath>
          </SvgText>
        );
        return (
          <G key={i}>
            {SHADOW_TAPS.map((t, k) => <G key={k} transform={`translate(${t.x} ${t.y})`}>{text(SHADOW.color, t.o)}</G>)}
            {text('#FFFFFF')}
          </G>
        );
      })}
    </Svg>
  );
}

export function HomeHero({ topInset, city, sawariCash, onWallet, children }: {
  children?: React.ReactNode;
  topInset: number;
  city: string;
  sawariCash: number | null;
  onWallet: () => void;
}) {
  // Signed-out customers have no balance to show, but the pill stays in the header at zero so the
  // header keeps its shape and the reward is discoverable before signing in.
  const cash = sawariCash ?? 0;
  const { width } = useWindowDimensions();
  const [slide, setSlide] = useState(0);
  const pager = useRef<ScrollView>(null);
  const touching = useRef(false);
  const [height, setHeight] = useState(0);

  // Slides move on their own every 4 s, but never while the customer is swiping them.
  useEffect(() => {
    const t = setInterval(() => {
      if (touching.current) return;
      setSlide((s) => {
        const next = (s + 1) % SLIDES.length;
        pager.current?.scrollTo({ x: next * width, animated: true });
        return next;
      });
    }, 4000);
    return () => clearInterval(t);
  }, [width]);

  return (
    // linear-gradient(180deg, #6152D8 0%, #CEC9F3 100%) — the design's two stops, no mid-tones.
    <LinearGradient
      colors={[HOME_PURPLE, '#CEC9F3']}
      style={{ paddingTop: topInset, paddingBottom: 16 }}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      {height > 0 && <Sunburst width={width} height={height} cy={topInset + 128} />}

      <View style={styles.heroTop}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <View style={styles.cityRow}>
            <Text style={styles.city}>{city}</Text>
            <Feather name="chevron-right" size={15} color="#FFFFFF" />
          </View>
          <Text style={styles.brandLine} numberOfLines={1}>MySawari - Self Drive Car Rental Guwahati</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`SawariCash ${cash}`}
          testID="wallet-pill"
          onPress={onWallet}
          style={({ pressed }) => [styles.walletPill, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.walletText}>{cash}</Text>
          <FontAwesome5 name="coins" size={12} color="#F5A524" />
        </Pressable>
      </View>

      <ScrollView
        ref={pager}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => { touching.current = true; }}
        onMomentumScrollEnd={(e) => { touching.current = false; setSlide(Math.round(e.nativeEvent.contentOffset.x / width)); }}
      >
        {SLIDES.map((s) => (
          <View key={s.lines[0]} style={{ width, alignItems: 'center' }}>
            <View style={styles.headlineBlock} accessible accessibilityRole="header" accessibilityLabel={`${s.lines[0]} ${s.lines[1]}`}>
              <ArcHeadline lines={s.lines} />
            </View>
            <View style={styles.subRow}>
              {s.sub.map((t, i) => (
                <React.Fragment key={t}>
                  {i > 0 && <View style={styles.subDot} />}
                  <Text style={styles.sub}>{t}</Text>
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Page indicator: a short white thumb sliding along a faint track */}
      <View style={styles.pager}>
        <View style={[styles.thumb, { left: (slide * (36 - 12)) / Math.max(1, SLIDES.length - 1) }]} />
      </View>
      {children}
    </LinearGradient>
  );
}

// ── Refer strip (sits on the banner's lower edge) ────────────────────────────

export function ReferStrip({ earnText, onPress }: { earnText: string; onPress: () => void }) {
  const p = useDetailsPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Refer and earn ${earnText}. Get 10% of your friend's booking payment.`}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={({ pressed }) => [styles.refer, { backgroundColor: p.page, borderColor: p.deliveryBorder }, pressed && { opacity: 0.9 }]}
    >
      <Image source={require('@/assets/images/refer_hand_coin.png')} style={styles.referIcon} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.referTitle, { color: p.fg }]}>Refer & Earn {earnText}</Text>
        <Text style={[styles.referSub, { color: p.sub }]} numberOfLines={1}>Get 10% of your friend’s booking payment.</Text>
      </View>
      <View style={[styles.referBtn, { backgroundColor: p.navy }]}>
        <Text style={styles.referBtnText}>Refer</Text>
        <Feather name="arrow-right" size={10} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

// ── Cars / Bikes + destination ───────────────────────────────────────────────

export function HomeSearchCard({ vehicleType, onType, onDestination }: {
  vehicleType: 'car' | 'bike';
  onType: (t: 'car' | 'bike') => void;
  onDestination: () => void;
}) {
  const p = useDetailsPalette();
  const tabs: { key: 'car' | 'bike'; label: string; image: ImageSourcePropType; size: { width: number; height: number } }[] = [
    { key: 'car', label: 'Cars', image: require('@/assets/images/home_tab_car.png'), size: { width: 35, height: 26 } },
    { key: 'bike', label: 'Bikes', image: require('@/assets/images/home_tab_bike.png'), size: { width: 28, height: 23.5 } },
  ];
  return (
    <View style={[styles.searchCard, { backgroundColor: p.page, borderColor: p.segBorder }]}>
      <View style={styles.tabs}>
        {tabs.map((t) => {
          const on = vehicleType === t.key;
          return (
            <Pressable
              key={t.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: on }}
              onPress={() => { Haptics.selectionAsync(); onType(t.key); }}
              style={[styles.tab, on && { backgroundColor: p.segOn, borderColor: p.radioRing }]}
            >
              <Image source={t.image} style={t.size} resizeMode="contain" />
              <Text style={[styles.tabText, { color: on ? p.navy : p.muted }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select your destination"
        onPress={() => { Haptics.selectionAsync(); onDestination(); }}
        style={({ pressed }) => [styles.destRing, { borderColor: p.deliveryBorder }, pressed && { opacity: 0.85 }]}
      >
        <View style={[styles.destField, { backgroundColor: p.page }]}>
          <Image source={require('@/assets/images/search_icon.png')} style={[styles.destIcon, { tintColor: p.muted }]} />
          <Text style={[styles.destText, { color: p.muted }]}>Select your Destination</Text>
        </View>
      </Pressable>
    </View>
  );
}

export function HomeSectionTitle({ title }: { title: string }) {
  const p = useDetailsPalette();
  return <Text style={[styles.sectionTitle, { color: p.fg }]} accessibilityRole="header">{title}</Text>;
}

// ── Top picks card ───────────────────────────────────────────────────────────

/** "13 Oct" → "13 oct." as the card design writes it. */
const cardDate = (label: string) => label.replace(/^(\d{1,2}) ([A-Za-z]{3})[a-z]*\.?/, (_, d, m) => `${d} ${m.toLowerCase()}.`);

// Figma "Success" green for the availability line on the cards.
const AVAILABLE_GREEN = '#339F79';

export function TopPickCard({ car, membership, onPress }: { car: Car & { availability?: any; isAvailable?: boolean }; membership?: QuoteParams['membership']; onPress: () => void }) {
  const p = useDetailsPalette();
  const images: ImageSourcePropType[] = (car as any).images?.length ? (car as any).images : [car.image];
  // Top picks show the first photo only: no auto-slide (the design's card is static).
  const shown = 0;

  const availability = car.availability ?? getAvailability(car);
  const available = car.isAvailable !== false && availability.available;
  const tag = getCarHighlights(car)[0];
  const brand = car.manufacturer;
  const name = [car.model, car.variant].filter(Boolean).join(' ') || car.displayName || car.name;
  const year = car.modelYear || car.registrationYear;
  const title = brand ? `${brand} ${name}` : name;
  // Members see their price with the day rate struck through; everyone else sees the day rate.
  const memberPrice = memberDayPrice(car.perDay, membership);
  const meta = [car.transmission, car.fuel, car.type === 'Bike' ? null : (/seat/i.test(car.seats) ? car.seats : `${car.seats} Seater`)].filter(Boolean) as string[];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}, ${formatCurrency(car.perDay)} per day, ${available ? 'available' : availability.headline}`}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={({ pressed }) => [styles.pick, { backgroundColor: p.summary, borderColor: p.deliveryBorder }, pressed && { opacity: 0.9 }]}
    >
      <View style={[styles.pickImageWrap, { backgroundColor: p.iconBg }]}>
        <LoadingImage source={images[shown]} contentFit="cover" transition={250} recyclingKey={`${car.id}-${shown}`} style={StyleSheet.absoluteFill} />
        {!!tag && (
          <View style={[styles.pickTag, { backgroundColor: p.navy }]}>
            <Text style={styles.pickTagText}>Best for {tag}</Text>
          </View>
        )}
        {images.length > 1 && (
          <View style={styles.pickDots}>
            {images.slice(0, 5).map((_, i) => <View key={i} style={[styles.pickDot, i === shown % 5 && styles.pickDotOn]} />)}
          </View>
        )}
      </View>
      <View style={styles.pickBody}>
        <View style={styles.pickTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pickName, { color: p.fg }]} numberOfLines={1}>{year && !title.includes(year) ? `${title} ${year}` : title}</Text>
            <View style={styles.pickMetaRow}>
              {meta.map((m, i) => (
                <React.Fragment key={m}>
                  {i > 0 && <View style={[styles.pickMetaDot, { backgroundColor: p.muted }]} />}
                  <Text style={[styles.pickMeta, { color: p.muted }]} numberOfLines={1}>{m}</Text>
                </React.Fragment>
              ))}
            </View>
          </View>
          {!!car.rating && (
            <View style={[styles.ratingPill, { backgroundColor: p.navy }]}>
              <Text style={styles.ratingText}>{car.rating.toFixed(1)}</Text>
              <Ionicons name="star" size={12} color={p.star} />
            </View>
          )}
        </View>
        <View style={styles.pickPriceRow}>
          <View style={styles.pickPrices}>
            <Text style={[styles.pickPrice, { color: p.fg }]}>{formatCurrency(memberPrice ?? car.perDay)}</Text>
            {memberPrice != null && (
              <View>
                <Text style={[styles.pickStrike, { color: p.muted }]}>{formatCurrency(car.perDay)}</Text>
                <View style={[styles.pickStrikeLine, { backgroundColor: p.muted }]} />
              </View>
            )}
          </View>
          <Text style={[styles.pickAvail, { color: available || availability.nextAvailableFrom ? AVAILABLE_GREEN : p.red }]} numberOfLines={1}>
            {available ? 'Available now' : availability.nextAvailableFrom ? `Available on ${cardDate(availability.nextAvailableFrom)}` : availability.headline}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// ── Trip milestone ───────────────────────────────────────────────────────────

const MILESTONE_RED = '#D04646';

export function TripMilestoneCard({ rides, target, reward, claimable, claiming, onClaim, onPress }: {
  rides: number;
  target: number;
  reward: number;
  claimable: boolean;
  claiming: boolean;
  onClaim: () => void;
  onPress: () => void;
}) {
  const p = useDetailsPalette();
  const done = Math.min(rides, target);
  // Four stops spread evenly from edge to edge: three numbered marks, then the reward coin.
  const stops = [1, 2, 3].map((k) => Math.round((target * k) / 4)).concat(target);
  // How far the purple fill reaches: straight between the stops it has passed.
  const fill = (() => {
    if (done <= stops[0]) return 0;
    for (let i = 1; i < stops.length; i++) {
      if (done <= stops[i]) return (i - 1 + (done - stops[i - 1]) / (stops[i] - stops[i - 1])) / (stops.length - 1);
    }
    return 1;
  })();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Complete ${target} trips, earn ${formatCurrency(reward)} off. ${done} of ${target} completed.`}
      onPress={onPress}
      style={[styles.milestone, { backgroundColor: p.purpleBg, borderColor: p.memberBorder }]}
    >
      <Image source={require('@/assets/images/MySawari_nobg.png')} style={styles.milestoneLogo} resizeMode="contain" />
      <Text style={[styles.milestoneTitle, { color: p.fg }]}>Complete {target} trips, earn {formatCurrency(reward)} off</Text>
      <Text style={[styles.milestoneSub, { color: p.muted }]}>Get {formatCurrency(reward)} off after completing {target} trips.</Text>

      <View style={styles.track}>
        <View style={styles.trackRail}>
          <View style={[styles.trackLine, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.trackLine, { backgroundColor: HOME_PURPLE, right: undefined, width: `${fill * 100}%` }]} />
        </View>
        {stops.slice(0, 3).map((m, i) => {
          const reached = done >= m;
          return (
            <View key={i} style={[styles.mark, { left: `${(i / 3) * 100}%`, borderColor: reached ? HOME_PURPLE : '#FFFFFF', backgroundColor: reached ? HOME_PURPLE : '#FFFFFF' }]}>
              <Text style={[styles.markText, { color: reached ? '#FFFFFF' : p.muted }]}>{m}</Text>
            </View>
          );
        })}
        <Image source={require('@/assets/images/milestone_coin.png')} style={[styles.coin, { left: '100%' }]} />
      </View>

      <View style={styles.milestoneFoot}>
        <Text style={[styles.milestoneCount, { color: p.muted }]}>{done}/{target} Completed</Text>
        {claimable ? (
          <Pressable accessibilityRole="button" onPress={onClaim} disabled={claiming} hitSlop={8}>
            <Text style={[styles.milestoneRight, { color: p.green }]}>{claiming ? 'Claiming…' : `Claim ${formatCurrency(reward)}`}</Text>
          </Pressable>
        ) : (
          <Text style={[styles.milestoneRight, { color: MILESTONE_RED }]}>Expires in 1 year</Text>
        )}
      </View>
    </Pressable>
  );
}

// ── Top destination tile ─────────────────────────────────────────────────────

/** `faded`: the photo already has the design's dark fade (and rounded corners) baked in, so none is drawn over it. */
export function DestinationTile({ image, faded, title, blurb, onPress }: { image: ImageSourcePropType; faded?: boolean; title: string; blurb: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={`${title}. ${blurb}`} onPress={() => { Haptics.selectionAsync(); onPress(); }} style={({ pressed }) => [styles.destTile, pressed && { opacity: 0.9 }]}>
      <Image source={image} style={StyleSheet.absoluteFill} resizeMode="cover" />
      {!faded && <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} locations={[0.35, 1]} style={StyleSheet.absoluteFill} />}
      <View style={styles.destTileBody}>
        <Text style={styles.destTileTitle}>{title}</Text>
        <Text style={styles.destTileBlurb} numberOfLines={2}>{blurb}</Text>
      </View>
    </Pressable>
  );
}

// ── Benefits ─────────────────────────────────────────────────────────────────

// Design order and copy. Uses the pictures already in assets/images; `wide` takes the whole row (the fifth item).
const BENEFITS: { title: string; sub: string; image: ImageSourcePropType; size: number; wide?: boolean }[] = [
  { title: 'Lowest Price', sub: 'Guaranteed', image: require('@/assets/images/benefit_exclusive_discounts.png'), size: 37 },
  { title: 'Unlimited KM', sub: 'Wide Variety of Cars', image: require('@/assets/images/benefit_save_more.png'), size: 37 },
  { title: 'Well Maintained', sub: 'Wide Variety of Vehicles', image: require('@/assets/images/benefit_special_rewards.png'), size: 37 },
  { title: 'Zero Cancellation', sub: 'Wide Variety of Vehicles', image: require('@/assets/images/benefit_special_rewards.png'), size: 37 },
  { title: 'Zero Cancellation/ Rescheduling Fees', sub: 'Zero Security Deposit', image: require('@/assets/images/benefit_special_rewards.png'), size: 37, wide: true },
];

export function BenefitsGrid() {
  const p = useDetailsPalette();
  return (
    <View style={styles.benefits}>
      {BENEFITS.map((b) => (
        <View key={b.title} style={[styles.benefit, b.wide && { flexBasis: '100%' }]} accessible accessibilityLabel={`${b.title}, ${b.sub}`}>
          <View style={styles.benefitCircle}>
            <Image source={b.image} style={{ width: b.size, height: b.size }} resizeMode="contain" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.benefitTitle, { color: p.fg }]} numberOfLines={1}>{b.title}</Text>
            <Text style={[styles.benefitSub, { color: p.muted }]} numberOfLines={1}>{b.sub}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export function MemberBenefitsCard({ isMember, onPress }: { isMember: boolean; onPress: () => void }) {
  const p = useDetailsPalette();
  return (
    <Pressable accessibilityRole="button" onPress={() => { Haptics.selectionAsync(); onPress(); }} style={({ pressed }) => [styles.member, { backgroundColor: p.purpleBg, borderColor: p.memberBorder }, pressed && { opacity: 0.9 }]}>
      <View style={styles.memberHead}>
        <Text style={[styles.memberTitle, { color: p.fg }]}>{isMember ? 'Your Member Benefits' : 'Unlock Member Benefits'}</Text>
        <View style={[styles.memberBtn, { backgroundColor: HOME_PURPLE }]}>
          <Text style={styles.memberBtnText}>{isMember ? 'My Membership' : 'Buy Membership'}</Text>
          <Feather name="arrow-right" size={8} color="#FFFFFF" />
        </View>
      </View>
      <Text style={[styles.memberSub, { color: p.muted }]}>Get exclusive offers and save more on every trip.</Text>
    </Pressable>
  );
}

// The design shows the logos in grey (Figma "luminosity" on white); these are the same logos converted to grey.
const SOCIAL_GREY: Partial<Record<string, ImageSourcePropType>> = {
  linkedin: require('@/assets/images/social/linkedin_grey.png'),
  instagram: require('@/assets/images/social/instagram_grey.png'),
  facebook: require('@/assets/images/social/facebook_grey.png'),
};

export function ConnectCard() {
  const p = useDetailsPalette();
  // Design order: LinkedIn, Instagram, Facebook, X — an account without a link yet is left out.
  const order = ['linkedin', 'instagram', 'facebook', 'x'];
  const links = SOCIAL_LINKS.filter((l) => !!l.url).sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  const open = async (url: string, label: string) => {
    Haptics.selectionAsync();
    try { await Linking.openURL(url); } catch { Alert.alert(`Could not open ${label}`, 'Please check your connection and try again.'); }
  };
  return (
    <View style={[styles.connect, { borderColor: p.segBorder, backgroundColor: p.page }]}>
      <View style={styles.connectLeft}>
        <Text style={[styles.connectTitle, { color: p.fg }]}>Connect with us</Text>
        <View style={styles.socials}>
          {links.map((l) => (
            <Pressable key={l.id} accessibilityRole="link" accessibilityLabel={`Follow MySawari on ${l.label}`} onPress={() => open(l.url, l.label)} hitSlop={6}>
              {l.themed ? (
                // X is one colour: drawn in the text colour so it shows in dark mode.
                <Image source={l.image} style={[styles.socialX, { tintColor: p.fg }]} resizeMode="contain" />
              ) : (
                <Image source={SOCIAL_GREY[l.id] ?? l.image} style={[styles.socialIcon, l.id === 'linkedin' && { width: 21.12 }]} resizeMode="contain" />
              )}
            </Pressable>
          ))}
        </View>
      </View>
      <View style={styles.connectRight}>
        <Image source={require('@/assets/images/MySawari_logo_trim.png')} style={styles.connectLogo} resizeMode="contain" />
        <Text style={[styles.connectTag, { color: p.muted }]}>Your Ride, your way!</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Banner
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, paddingTop: 8 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  city: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5, color: '#FFFFFF' },
  brandLine: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  // Figma: 72x42 pill, padding 14/12 (vertical is centred, not padded, so the 20px text is not clipped), radius 40, gap 4.
  walletPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, width: 72, height: 42, paddingHorizontal: 12, borderRadius: 40, backgroundColor: '#F0EFFD', borderWidth: 1, borderColor: '#D1CCF9' },
  walletText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20, color: '#2F3E75' },
  headlineBlock: { alignItems: 'center', marginTop: 12 },
  subRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, paddingHorizontal: 8 },
  subDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#FFFFFF' },
  // The design's three promises: Semibold/xs in Neutral/50 (#F9F9FB), 6px apart.
  sub: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5, color: '#F9F9FB' },
  pager: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.45)', marginTop: 16, marginBottom: 12 },
  thumb: { position: 'absolute', top: 0, width: 12, height: 4, borderRadius: 2, backgroundColor: '#FFFFFF' },

  // Refer
  refer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 31, paddingLeft: 8, paddingRight: 8, paddingTop: 8, paddingBottom: 24, borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  referIcon: { width: 24, height: 24 },
  // The two lines sit 2 apart (the row's gap); the strip's own 8 padding does the rest.
  referTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 19.5 },
  referSub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5 },
  referBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, height: 19, paddingHorizontal: 8, borderRadius: 10, alignSelf: 'flex-start', marginTop: 8 },
  referBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, lineHeight: 12, color: '#FFFFFF' },

  // Search
  searchCard: { marginHorizontal: 16, padding: 6, borderWidth: 1, borderRadius: 16, shadowColor: '#2F3E75', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  tabs: { flexDirection: 'row', gap: 12 },
  tab: { flex: 1, height: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  tabText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 26 },
  destRing: { marginTop: 10, borderWidth: 3, borderRadius: 12 },
  destField: { height: 47, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 9, paddingHorizontal: 12 },
  destIcon: { width: 20, height: 20 },
  destText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, lineHeight: 22.5 },

  sectionTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5, marginTop: 28, marginBottom: 12, paddingHorizontal: 16 },

  // Top picks
  pick: { width: 246, borderWidth: 1, borderRadius: 12, padding: 2, overflow: 'hidden' },
  pickImageWrap: { height: 144, borderRadius: 10, overflow: 'hidden' },
  pickTag: { position: 'absolute', top: 4, left: 4, height: 20, justifyContent: 'center', paddingHorizontal: 8.5, borderRadius: 10 },
  pickTagText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 8, color: '#FFFFFF' },
  pickDots: { position: 'absolute', bottom: 4.5, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 5 },
  pickDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)' },
  pickDotOn: { width: 12, height: 3.5, backgroundColor: '#FFFFFF' },
  pickBody: { paddingHorizontal: 4, paddingTop: 6, paddingBottom: 6 },
  pickTitleRow: { flexDirection: 'row', alignItems: 'center', height: 37 },
  pickName: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 19.5 },
  pickMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pickMetaDot: { width: 3, height: 3, borderRadius: 1.5 },
  pickMeta: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, flexShrink: 1 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', paddingTop: 1, paddingRight: 4, paddingBottom: 2, paddingLeft: 5, height: 20, borderRadius: 20 },
  ratingText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5, color: '#FFFFFF' },
  pickPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 4, marginHorizontal: -4, marginTop: 4 },
  // Figma trims both prices to cap height (leading-trim: cap), so their bottoms are the baseline.
  pickPrices: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  // Cap-height trim from Plus Jakarta Sans metrics (ascent 1.038em, descent 0.222em, cap 0.745em): 22.5 box → 11.2.
  pickPrice: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5, marginTop: -6.2, marginBottom: -5.1, includeFontPadding: false },
  pickStrike: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 14, marginTop: -3.3, marginBottom: -2.5, includeFontPadding: false },
  pickStrikeLine: { position: 'absolute', left: -1, right: -2, top: '50%', marginTop: -0.5, height: 1 },
  pickAvail: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 8, lineHeight: 12, letterSpacing: 0.16, flexShrink: 1 },

  // Milestone
  milestone: { marginHorizontal: 16, marginTop: 24, borderWidth: 1, borderRadius: 11, paddingHorizontal: 13, paddingTop: 9, paddingBottom: 8.5 },
  // The logo's artwork fills 360 × 316 of its 470 × 480 file; this shows that part at 32 × 27.
  milestoneLogo: { position: 'absolute', top: 11.5, right: 2, width: 42, height: 43, opacity: 0.32 },
  milestoneTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5 },
  milestoneSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 16.5, marginTop: 3, marginRight: 40 },
  // The marks' centres sit 8 in from each edge, so the rail runs between them.
  track: { height: 16, marginTop: 12, marginHorizontal: 8, justifyContent: 'center' },
  trackRail: { position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3, overflow: 'hidden' },
  trackLine: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  mark: { position: 'absolute', width: 16, height: 16, marginLeft: -8, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center', shadowColor: '#6152D8', shadowOpacity: 0.35, shadowRadius: 3, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  markText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 7.5, lineHeight: 10, includeFontPadding: false },
  // 22 × 22 including its glow; the coin itself is 16, the same as the marks.
  coin: { position: 'absolute', width: 22, height: 22, marginLeft: -11 },
  milestoneFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  milestoneCount: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 16.5 },
  milestoneRight: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 16.5 },

  // Destinations
  destTile: { width: 216, height: 144, borderRadius: 12, overflow: 'hidden', justifyContent: 'flex-end' },
  destTileBody: { padding: 12 },
  destTileTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5, color: '#FFFFFF' },
  destTileBlurb: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 16.5, color: '#FAFAFA' },

  // Benefits
  benefits: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, columnGap: 12, rowGap: 12 },
  // Two equal columns 12 apart: both start at 40% and grow into the rest of the row.
  benefit: { flexBasis: '40%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitCircle: { width: 37, height: 37, borderRadius: 40, overflow: 'hidden', backgroundColor: 'rgba(234, 236, 241, 0.4)', alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 19.5 },
  benefitSub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5 },

  // Membership
  member: { marginHorizontal: 16, marginTop: 20, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8 },
  memberHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3 },
  memberTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5, flexShrink: 1 },
  memberBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, height: 22, paddingHorizontal: 10, borderRadius: 31 },
  memberBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, lineHeight: 12, color: '#FFFFFF' },
  memberSub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, marginTop: 3 },

  // Connect
  connect: { flexDirection: 'row', alignItems: 'stretch', gap: 12, marginHorizontal: 16, marginTop: 20, borderWidth: 1, borderRadius: 12, paddingTop: 12, paddingHorizontal: 12, paddingBottom: 16 },
  connectLeft: { flex: 1, gap: 6 },
  connectTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5 },
  // Slots as in Figma: LinkedIn 21.12 wide, the others 18, X 17.92 × 16 inside 1 padding.
  socials: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, height: 18 },
  socialIcon: { width: 18, height: 18 },
  socialX: { width: 17.92, height: 16, margin: 1 },
  connectRight: { flex: 1, alignItems: 'flex-end', paddingTop: 1, gap: 6 },
  // The logo fills what is left of the 47 tall row above the tagline (32).
  connectLogo: { flex: 1, width: 33.6, maxHeight: 32 },
  // Cap-height trim (leading-trim: cap): 16.5 box → 8.2 (Plus Jakarta Sans: ascent 1.038em, descent 0.222em, cap 0.745em).
  connectTag: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, marginTop: -4.5, marginBottom: -3.8, textAlign: 'right', alignSelf: 'stretch', includeFontPadding: false },
});