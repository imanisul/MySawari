import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { useDealCars, dealPricing, useOpenTopDeal } from '@/hooks/useDealCars';
import HomeCardSunburst from '@/assets/images/home_card_sunburst.svg';
import HomeDealsTitle from '@/assets/images/home_deals_title.svg';

/** Figma Frame 2147226269: a row of 340 × 248 purple cards (price, Today's Deals, "Find the Perfect Ride"), gap 12. */
const W = 340;
const H = 248;
const pad2 = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

const TILES = [
  { label: 'Security Deposit', img: require('@/assets/images/hero_benefit_zero_deposit.png'), w: 69 },
  { label: 'Unlimited Kilometer', img: require('@/assets/images/hero_benefit_unlimited_km.png'), w: 60 },
  { label: 'Expertly Maintained', img: require('@/assets/images/hero_benefit_maintained.png'), w: 69 },
  { label: 'DoorStep Delivery', img: require('@/assets/images/hero_benefit_doorstep.png'), w: 68 },
];

function PriceCard({ fromRate }: { fromRate: number }) {
  return (
    <LinearGradient colors={['#6152D8', '#CEC9F3']} style={styles.card} accessible accessibilityRole="header" accessibilityLabel={`Your ride, from just ${formatCurrency(fromRate)}`}>
      <HomeCardSunburst style={styles.cardSunburst} pointerEvents="none" />
      {/* Frame 2147226207: 312.44 × 164, centred in the card */}
      <View style={styles.priceBox}>
        <Svg width={289.69} height={35.91} style={styles.priceShadow} pointerEvents="none">
          <Defs>
            <RadialGradient id="homeCarShadow" cx="50%" cy="50%" rx="50%" ry="50%">
              <Stop offset="0" stopColor="#0E0E0E" stopOpacity={0.6} />
              <Stop offset="1" stopColor="#0E0E0E" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx={144.845} cy={17.955} rx={144.845} ry={17.955} fill="url(#homeCarShadow)" />
        </Svg>
        <Image source={require('@/assets/images/home_hero_cars.png')} style={styles.priceCars} contentFit="contain" transition={0} />
        <View style={styles.priceRow}>
          <View style={styles.priceLeadCol}>
            {/* Frame 2147226205: two 43-tall lines overlapping by 11.97 (Figma's negative gap) → 74.03 tall */}
            <Text style={styles.priceLead} numberOfLines={1} allowFontScaling={false}>Your ride,</Text>
            <Text style={[styles.priceLead, { marginTop: -11.97 }]} numberOfLines={1} allowFontScaling={false}>from just</Text>
          </View>
          <Text style={styles.priceAmount} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} allowFontScaling={false}>{formatCurrency(fromRate)}</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

function TimerBox({ value, label }: { value: number; label: string }) {
  return (
    <View style={{ width: 27, alignItems: 'center' }}>
      <View style={styles.timerBox}><Text style={styles.timerNum} allowFontScaling={false}>{pad2(value)}</Text></View>
      <Text style={styles.timerLabel} allowFontScaling={false}>{label}</Text>
    </View>
  );
}

// How long each deal car stays up before the next (WhatsApp-status style).
const STORY_MS = 4000;

function DealsCard({ onAvailabilityChange }: { onAvailabilityChange: (available: boolean) => void }) {
  const router = useRouter();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const { dealCars, targetEndMs } = useDealCars(nowMs);
  // Every car and bike in Today's Deals, one after another like WhatsApp status.
  const shown = dealCars;
  useEffect(() => {
    onAvailabilityChange(shown.length > 0);
  }, [shown.length, onAvailabilityChange]);
  // The shown car's bar fills over STORY_MS, then the next car comes up (back to the first after the last).
  const progress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (active >= shown.length && shown.length) setActive(0);
  }, [active, shown.length]);
  useEffect(() => {
    if (!shown.length) return;
    progress.setValue(0);
    const run = Animated.timing(progress, { toValue: 1, duration: STORY_MS, easing: Easing.linear, useNativeDriver: false });
    run.start(({ finished }) => { if (finished && shown.length > 1) setActive((a) => (a + 1) % shown.length); });
    return () => run.stop();
  }, [active, shown.length, progress]);

  // Nothing free until 8 AM: no card (no placeholder car).
  const openTopDeal = useOpenTopDeal(); // a hook: before the early return below
  if (!shown.length) return null;
  const car: any = shown[Math.min(active, shown.length - 1)];

  const left = Math.max(0, targetEndMs - nowMs);
  const startMs = (car.dealStartMs || 0) > nowMs ? car.dealStartMs : Math.floor(nowMs / 60000) * 60000;
  const hours = Math.max(1, Math.ceil(Math.max(0, (car.dealEndMs || targetEndMs) - startMs) / 3600000));
  const { price } = dealPricing(car, hours);
  const seats = parseInt(String(car.seats || ''), 10);
  const specs = [car.transmission, car.fuel || car.fuelType, car.type === 'Bike' || !seats ? null : `${seats} seats`].filter(Boolean) as string[];
  const name = car.displayName || car.vehicleName || car.name || 'Vehicle';
  const photo = car.images?.[0] || car.image;
  const open = () => { Haptics.selectionAsync(); router.push('/top-deals'); };
  // Tapping the car books that deal straight away: its dates, times and places are filled in, as on the deals page.
  const openCar = () => openTopDeal(car, targetEndMs, nowMs);

  return (
    <LinearGradient colors={['#6152D8', '#ADA4F4']} style={[styles.card, styles.dealsCard]}>
      <View style={styles.dealsTop}>
        <View style={styles.dealsTitle}>
          <HomeDealsTitle style={styles.dealsArtwork} pointerEvents="none" />
        </View>
        <View style={styles.endsIn}>
          <Text style={styles.endsInText} allowFontScaling={false}>ENDS IN</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TimerBox value={left / 3600000} label="Hrs" />
            <TimerBox value={(left % 3600000) / 60000} label="Min" />
            <TimerBox value={(left % 60000) / 1000} label="Sec" />
          </View>
        </View>
      </View>

      <View style={{ alignSelf: 'stretch', gap: 8 }}>
        {/* One bar per deal car: seen ones full, the shown one filling, the rest empty (Figma 3px bars, 10 apart) */}
        <View style={[styles.bars, { gap: shown.length > 6 ? 4 : 10 }]}>
          {shown.map((v: any, i) => {
            const at = Math.min(active, shown.length - 1);
            return (
              <View key={String(v.id || v._id || i)} style={styles.bar}>
                {i < at && <View style={styles.barFill} />}
                {i === at && (
                  <Animated.View style={[styles.barFill, { width: shown.length > 1 ? progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) : '100%' }]} />
                )}
              </View>
            );
          })}
        </View>
        <View style={{ gap: 6 }}>
          <Pressable onPress={openCar} accessibilityRole="button" accessibilityLabel={`${name}, ${formatCurrency(price)} for ${hours} hours`} style={styles.booking}>
            <Image source={photo} style={styles.carPhoto} contentFit="cover" transition={150} />
            {/* Frame 2147225778: 174 × 92, padding 2/4/4/0, gap 10 — [brand + name, specs] 2 apart (62), then the price (14) */}
            <View style={styles.bookingText}>
              <View style={{ gap: 2, alignSelf: 'stretch' }}>
              <View>
                {!!car.brand && <Text allowFontScaling={false} style={styles.brand} numberOfLines={1}>{car.brand}</Text>}
                <Text allowFontScaling={false} style={styles.name} numberOfLines={1}>{name}</Text>
              </View>
              <View style={styles.specs}>
                {specs.map((s, i) => (
                  <React.Fragment key={s}>
                    {i > 0 && <View style={styles.dot} />}
                    <Text allowFontScaling={false} style={styles.spec} numberOfLines={1}>{s}</Text>
                  </React.Fragment>
                ))}
              </View>
              </View>
              <View style={styles.priceLine}>
                <Text allowFontScaling={false} style={styles.dealPrice}>{formatCurrency(price)}</Text>
                <Text allowFontScaling={false} style={styles.forHours}>for {hours} hours</Text>
              </View>
            </View>
          </Pressable>
          <Pressable onPress={open} accessibilityRole="button" style={styles.seeAll}>
            <Text allowFontScaling={false} style={styles.seeAllText}>See All</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

function FindCard() {
  return (
    <LinearGradient colors={['#6152D8', '#CEC9F3']} style={[styles.card, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, gap: 12 }]}>
      <HomeCardSunburst style={styles.cardSunburst} pointerEvents="none" />
      <Text style={styles.findTitle} allowFontScaling={false}>Find the Perfect Ride</Text>
      <View style={styles.tiles}>
        {TILES.map((t) => (
          <View key={t.label} style={styles.tile}>
            <Image source={t.img} style={{ width: t.w, height: 46 }} contentFit="contain" transition={0} />
            <Text style={styles.tileLabel} allowFontScaling={false}>{t.label}</Text>
          </View>
        ))}
      </View>
    </LinearGradient>
  );
}

export function HomeCardsRow({ fromRate }: { fromRate?: number }) {
  const scrollRef = useRef<ScrollView>(null);
  const [dealsAvailable, setDealsAvailable] = useState(false);
  const positionedAtDeals = useRef(false);
  const onAvailabilityChange = useCallback((available: boolean) => setDealsAvailable(available), []);
  // Cards are drawn at the Figma 340 × 248. On a 393 phone the next card peeks 37 in; narrower screens (Moto Edge with
  // a larger display size, small phones) shrink the whole card to keep that peek instead of running off the edge.
  const { width: winW } = useWindowDimensions();
  const k = Math.min(1, (winW - 53) / W);
  const step = W * k + 12;
  const fit = (card: React.ReactNode) => (
    <View style={{ width: W * k, height: H * k }}>
      <View style={{ width: W, height: H, transform: [{ scale: k }], marginLeft: -(W * (1 - k)) / 2, marginTop: -(H * (1 - k)) / 2 }}>
        {card}
      </View>
    </View>
  );

  useEffect(() => {
    if (!fromRate || !dealsAvailable || positionedAtDeals.current) return;
    const frame = requestAnimationFrame(() => scrollRef.current?.scrollTo({ x: step, y: 0, animated: false }));
    positionedAtDeals.current = true;
    return () => cancelAnimationFrame(frame);
  }, [fromRate, dealsAvailable, step]);

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      showsHorizontalScrollIndicator={false}
      // Each card stops with its left edge on the page's 16px margin, in line with the tiles above, and one swipe moves
      // exactly one card (it used to centre cards 26.5 in and could fly past a card on a quick flick).
      snapToInterval={step}
      snapToAlignment="start"
      disableIntervalMomentum
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      style={{ height: H * k, flexGrow: 0 }}
    >
      {!!fromRate && fit(<PriceCard fromRate={fromRate} />)}
      {fit(<DealsCard onAvailabilityChange={onAvailabilityChange} />)}
      {fit(<FindCard />)}
    </ScrollView>
  );
}

const F700 = 'PlusJakartaSans_700Bold';
const styles = StyleSheet.create({
  card: { width: W, height: H, borderRadius: 12, overflow: 'hidden' },
  cardSunburst: { position: 'absolute', left: -110.5, top: -156.5, opacity: 0.18 },
  // price card
  priceBox: { position: 'absolute', width: 312.44, height: 164, left: (W - 312.44) / 2, top: (H - 164) / 2 + 0.5 },
  // The cars picture (522 × 174) has empty space round the cars (they fill x 37–490, y 32–158 of it). The design's
  // cars span x 9–331, y 118–215 of the 340 card, so the picture is drawn 371 × 123.7 at card (−17.3, 95.2) — given
  // here inside priceBox (which starts at 13.78, 42.5). The ground shadow follows the cars' wheels down.
  priceShadow: { position: 'absolute', left: (312.44 - 289.69) / 2 + 0.6, top: 146 },
  priceCars: { position: 'absolute', width: 371, height: 123.7, left: -17.3 - 13.78, top: 95.2 - 42.5 },
  priceRow: { position: 'absolute', top: -1, left: (312.44 - 282.48) / 2 - 0.6, width: 282.48, height: 93, flexDirection: 'row', alignItems: 'center', gap: 2.39 },
  priceLeadCol: { width: 128.09, height: 74.03, alignItems: 'center' },
  priceLead: { fontFamily: F700, fontSize: 28.73, lineHeight: 43, letterSpacing: -0.57, color: '#FFFFFF', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 4.79 }, textShadowRadius: 7.18, includeFontPadding: false },
  priceAmount: { width: 152, fontFamily: F700, fontSize: 62.25, lineHeight: 93, letterSpacing: -1.25, color: '#FAC64C', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 3.83 }, textShadowRadius: 3.83, includeFontPadding: false },
  // deals card
  dealsCard: { padding: 8, justifyContent: 'space-between', gap: 12 },
  dealsTop: { height: 53.38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, alignSelf: 'stretch' },
  dealsTitle: { width: 118, height: 53, alignItems: 'center', justifyContent: 'center', overflow: 'visible' },
  dealsArtwork: { position: 'absolute', top: -5, left: 0 },
  endsIn: { width: 97, gap: 2, justifyContent: 'center' },
  endsInText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, lineHeight: 12, color: '#FFFFFF', textAlign: 'center', includeFontPadding: false },
  timerBox: { width: 27, height: 27, borderRadius: 6, backgroundColor: '#FFFBF0', borderWidth: 1, borderColor: '#F9D774', alignItems: 'center', justifyContent: 'center' },
  timerNum: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16, color: '#6152D8', textAlign: 'center', includeFontPadding: false },
  timerLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 8, lineHeight: 12, color: '#FFFFFF', textAlign: 'center', includeFontPadding: false },
  bars: { flexDirection: 'row', gap: 10, height: 3 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.49)', overflow: 'hidden' },
  barFill: { position: 'absolute', left: 0, top: 0, bottom: 0, width: '100%', borderRadius: 2, backgroundColor: '#FFFFFF' },
  // Booking Card (110 high, padding 8) holding Frame 2147225883: photo + text, 12 apart, centred both ways in 306 × 92.
  booking: { height: 110, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 8, gap: 12, backgroundColor: '#FBFAFE', borderWidth: 1, borderColor: '#DEDAFB', borderRadius: 8 },
  carPhoto: { width: 120, height: 92, borderRadius: 6, backgroundColor: '#EEEAFD' },
  // Frame 2147225778: 174 × 92 column, top-aligned content and bottom price, left-aligned, padding 2/4/4/0.
  bookingText: { flex: 1, height: 92, justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: 2, paddingRight: 4, paddingBottom: 2 },
  brand: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, color: '#737373', includeFontPadding: false },
  name: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 22, color: '#262626', includeFontPadding: false },
  specs: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  spec: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, color: '#737373', flexShrink: 1, includeFontPadding: false },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#737373' },
  // Frame 2147225958: price and "for N hours" baseline-aligned with exact 6px gap.
  priceLine: { flexDirection: 'row', alignItems: 'baseline', gap: 6, alignSelf: 'stretch' },
  dealPrice: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 24, color: '#262626', includeFontPadding: false },
  forHours: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 18, color: '#737373', includeFontPadding: false },
  seeAll: { height: 31, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, backgroundColor: '#FBFAFE', borderWidth: 1, borderColor: '#E7EAF4', borderRadius: 6 },
  seeAllText: { fontFamily: F700, fontSize: 11, lineHeight: 16.5, color: '#6152D8', textTransform: 'uppercase', includeFontPadding: false },
  // find the perfect ride
  findTitle: { fontFamily: F700, fontSize: 24, lineHeight: 26.4, letterSpacing: -0.48, color: '#FFFFFF', textAlign: 'center', alignSelf: 'stretch', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 6 },
  tiles: { flexDirection: 'row', gap: 4, alignSelf: 'stretch' },
  tile: { flex: 1, height: 92, alignItems: 'center', justifyContent: 'center', paddingTop: 6, paddingBottom: 8, gap: 4, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BFC3D4', borderRadius: 12 },
  tileLabel: { width: 71, fontFamily: F700, fontSize: 9, lineHeight: 10.8, color: '#2B386A', textAlign: 'center' },
});
