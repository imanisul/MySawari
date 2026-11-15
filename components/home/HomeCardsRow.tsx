import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, Path, RadialGradient, Stop } from 'react-native-svg';
import { useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { useDealCars, dealPricing } from '@/hooks/useDealCars';

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

// Sparkles around the title (Figma Group 1171275686 …): position inside the 118-wide title box, size, colour.
const STARS = [
  { x: 97.87, y: 4.49, s: 6, c: '#FBC422' }, { x: 12.87, y: 3.49, s: 6, c: '#FBC422' },
  { x: 9.87, y: 25.49, s: 8, c: '#FFFFFF' }, { x: 99.87, y: 27.49, s: 7, c: '#FFFFFF' },
];

function PriceCard({ fromRate }: { fromRate: number }) {
  return (
    <LinearGradient colors={['#6152D8', '#CEC9F3']} style={styles.card} accessible accessibilityRole="header" accessibilityLabel={`Your ride, from just ${formatCurrency(fromRate)}`}>
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
            <Text style={[styles.priceLead, { marginVertical: -11.97 }]} numberOfLines={1} allowFontScaling={false}>Your ride,</Text>
            <Text style={[styles.priceLead, { marginVertical: -11.97 }]} numberOfLines={1} allowFontScaling={false}>from just</Text>
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

function DealsCard() {
  const router = useRouter();
  const [nowMs, setNowMs] = useState(() => Date.now());
  const [active, setActive] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const { dealCars, targetEndMs } = useDealCars(nowMs);
  const shown = dealCars.slice(0, 4);
  useEffect(() => {
    if (shown.length < 2) return;
    const t = setInterval(() => setActive((a) => (a + 1) % shown.length), 4000);
    return () => clearInterval(t);
  }, [shown.length]);

  // Nothing free until 8 AM: no card (no placeholder car).
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

  return (
    <LinearGradient colors={['#6152D8', '#ADA4F4']} style={[styles.card, styles.dealsCard]}>
      <View style={styles.dealsTop}>
        <View style={styles.dealsTitle}>
          {STARS.map((st, i) => (
            <Svg key={i} width={st.s} height={st.s} viewBox="0 0 24 24" style={{ position: 'absolute', left: st.x, top: st.y }} pointerEvents="none">
              <Path d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z" fill={st.c} />
            </Svg>
          ))}
          <Text style={styles.dealsToday} allowFontScaling={false}>Today’s</Text>
          <Text style={styles.dealsWord} allowFontScaling={false}>Deals</Text>
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
        <View style={styles.bars}>
          {shown.map((v: any, i) => <View key={String(v.id || v._id || i)} style={[styles.bar, i === Math.min(active, shown.length - 1) && { backgroundColor: '#FFFFFF' }]} />)}
        </View>
        <View style={{ gap: 6 }}>
          <Pressable onPress={open} accessibilityRole="button" accessibilityLabel={`${name}, ${formatCurrency(price)} for ${hours} hours`} style={styles.booking}>
            <Image source={photo} style={styles.carPhoto} contentFit="cover" transition={150} />
            <View style={styles.bookingText}>
              <View>
                {!!car.brand && <Text style={styles.brand} numberOfLines={1}>{car.brand}</Text>}
                <Text style={styles.name} numberOfLines={1}>{name}</Text>
              </View>
              <View style={styles.specs}>
                {specs.map((s, i) => (
                  <React.Fragment key={s}>
                    {i > 0 && <View style={styles.dot} />}
                    <Text style={styles.spec} numberOfLines={1}>{s}</Text>
                  </React.Fragment>
                ))}
              </View>
              <View style={styles.priceLine}>
                <Text style={styles.dealPrice}>{formatCurrency(price)}</Text>
                <Text style={styles.forHours}>for {hours} hours</Text>
              </View>
            </View>
          </Pressable>
          <Pressable onPress={open} accessibilityRole="button" style={styles.seeAll}>
            <Text style={styles.seeAllText}>See All</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

function FindCard() {
  return (
    <LinearGradient colors={['#6152D8', '#CEC9F3']} style={[styles.card, { justifyContent: 'center', alignItems: 'center', paddingHorizontal: 8, gap: 12 }]}>
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
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={W + 12}
      decelerationRate="fast"
      contentContainerStyle={{ paddingHorizontal: 16, gap: 12 }}
      style={{ height: H, flexGrow: 0 }}
    >
      {!!fromRate && <PriceCard fromRate={fromRate} />}
      <DealsCard />
      <FindCard />
    </ScrollView>
  );
}

const F700 = 'PlusJakartaSans_700Bold';
const styles = StyleSheet.create({
  card: { width: W, height: H, borderRadius: 12, overflow: 'hidden' },
  // price card
  priceBox: { position: 'absolute', width: 312.44, height: 164, left: (W - 312.44) / 2, top: (H - 164) / 2 + 0.5 },
  priceShadow: { position: 'absolute', left: (312.44 - 289.69) / 2 + 0.6, top: 126.89 },
  priceCars: { position: 'absolute', width: 312.44, height: 104.15, left: 0, top: 59.86 },
  priceRow: { position: 'absolute', top: 0, left: (312.44 - 282.48) / 2 - 0.6, width: 282.48, height: 93, flexDirection: 'row', alignItems: 'center', gap: 2.39 },
  priceLeadCol: { width: 128.09, alignItems: 'center' },
  priceLead: { fontFamily: F700, fontSize: 28.73, lineHeight: 43, letterSpacing: -0.57, color: '#FFFFFF', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 4.79 }, textShadowRadius: 7.18, includeFontPadding: false },
  priceAmount: { width: 152, fontFamily: F700, fontSize: 62.25, lineHeight: 93, letterSpacing: -1.25, color: '#FAC64C', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 3.83 }, textShadowRadius: 3.83, includeFontPadding: false },
  // deals card
  dealsCard: { padding: 8, justifyContent: 'space-between', gap: 12 },
  dealsTop: { height: 53.38, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, alignSelf: 'stretch' },
  dealsTitle: { width: 118, height: 53, alignItems: 'center', justifyContent: 'center' },
  dealsToday: { fontFamily: F700, fontSize: 20, lineHeight: 26, transform: [{ rotate: '-4deg' }], color: '#FBC422', textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 3 }, textShadowRadius: 3, includeFontPadding: false },
  dealsWord: { fontFamily: F700, fontSize: 30, lineHeight: 34, color: '#FFFFFF', marginTop: -4, textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 4, includeFontPadding: false },
  endsIn: { width: 97, gap: 2, justifyContent: 'center' },
  endsInText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, lineHeight: 12, color: '#FFFFFF', textAlign: 'center', includeFontPadding: false },
  timerBox: { width: 27, height: 27, borderRadius: 6, backgroundColor: '#FFFBF0', borderWidth: 1, borderColor: '#F9D774', alignItems: 'center', justifyContent: 'center' },
  timerNum: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16, color: '#6152D8', textAlign: 'center', includeFontPadding: false },
  timerLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 8, lineHeight: 12, color: '#FFFFFF', textAlign: 'center', includeFontPadding: false },
  bars: { flexDirection: 'row', gap: 10, height: 3 },
  bar: { flex: 1, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.49)' },
  booking: { height: 110, flexDirection: 'row', alignItems: 'flex-start', padding: 8, gap: 12, backgroundColor: '#FBFAFE', borderWidth: 1, borderColor: '#DEDAFB', borderRadius: 8 },
  carPhoto: { width: 120, height: 92, borderRadius: 6, backgroundColor: '#EEEAFD' },
  bookingText: { flex: 1, height: 92, justifyContent: 'center', gap: 10, paddingTop: 2, paddingBottom: 4 },
  brand: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, color: '#737373', includeFontPadding: false },
  name: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 26, color: '#262626', includeFontPadding: false },
  specs: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -6 },
  spec: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, color: '#737373', flexShrink: 1, includeFontPadding: false },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#737373' },
  priceLine: { flexDirection: 'row', alignItems: 'flex-end', gap: 6 },
  dealPrice: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 24, color: '#262626', includeFontPadding: false },
  forHours: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 16, color: '#737373', includeFontPadding: false },
  seeAll: { height: 31, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, backgroundColor: '#FBFAFE', borderWidth: 1, borderColor: '#E7EAF4', borderRadius: 6 },
  seeAllText: { fontFamily: F700, fontSize: 11, lineHeight: 16.5, color: '#6152D8', textTransform: 'uppercase', includeFontPadding: false },
  // find the perfect ride
  findTitle: { fontFamily: F700, fontSize: 24, lineHeight: 26.4, letterSpacing: -0.48, color: '#FFFFFF', textAlign: 'center', alignSelf: 'stretch', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 6 },
  tiles: { flexDirection: 'row', gap: 4, alignSelf: 'stretch' },
  tile: { flex: 1, height: 92, alignItems: 'center', justifyContent: 'center', paddingTop: 6, paddingBottom: 8, gap: 4, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BFC3D4', borderRadius: 12 },
  tileLabel: { width: 71, fontFamily: F700, fontSize: 9, lineHeight: 10.8, color: '#2B386A', textAlign: 'center' },
});
