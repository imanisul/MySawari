import React, { useEffect, useId, useRef, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Image, ImageSourcePropType, ScrollView, useWindowDimensions, Linking, Alert } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Defs, Text as SvgText, TextPath, G, RadialGradient, Rect, Stop, Ellipse } from 'react-native-svg';
import * as Haptics from '@/utils/haptics';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Image as CachedImage } from 'expo-image';
import { LoadingImage } from '@/components/common/LoadingImage';
import { CustomAlert } from '@/components/common/CustomAlert';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import BenefitCards from './BenefitCards';
import { formatCurrency, memberDayPrice, type QuoteParams } from '@/services/backend/pricingEngine';
import { offersQueryOptions, isOfferLive } from '@/services/api/offers';
import type { RecentSearch } from '@/utils/recentSearches';
import { Car, carTitle, getAvailability, bestFor, splitDateRange } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';
import { SOCIAL_LINKS } from '@/constants/social';
import { openStorePage } from '@/services/rateApp';
import LowestPriceIcon from '@/assets/images/benefit_lowest_price.png';
import UnlimitedKmIcon from '@/assets/images/benefit_unlimited_km.png';
import WellMaintainedIcon from '@/assets/images/benefit_well_maintained.png';
import ZeroDepositIcon from '@/assets/images/benefit_zero_deposit.png';
import ZeroCancellationIcon from '@/assets/images/benefit_zero_cancellation.png';
import WalletCoinsIcon from '@/assets/images/wallet_coins.png';
import ReferHandCoinIcon from '@/assets/images/refer_hand_coin.png';
import HomeTabCarIcon from '@/assets/images/home_tab_car.svg';
import HomeTabBikeIcon from '@/assets/images/home_tab_bike.svg';
import { BannerRays } from './FlashSaleBanner';

// Home page (Figma "Home"): purple banner, refer strip, Cars / Bikes search card, then the sections below.
/** Icons pre-sized to 4x their display size (smooth on every phone, unlike a 512 px picture shrunk 20x at draw time). */
const ICON = {
  walletCoins: require('@/assets/images/icons/wallet_coins.png'),
  referHandCoin: require('@/assets/images/icons/refer_hand_coin.png'),
  milestoneCoin: require('@/assets/images/icons/milestone_coin.png'),
};
function PicIcon({ source, size }: { source: any; size: number }) {
  return <CachedImage source={source} style={{ width: size, height: size }} contentFit="contain" transition={0} accessible={false} />;
}

export const HOME_PURPLE = '#323E71';
// Hero gradient (Figma Home frame): 180deg, #6152D8 to #CEC9F3.
export const HERO_TOP = '#332B72';
const HERO_BOTTOM = '#6B5AED';

// ── Top banner ───────────────────────────────────────────────────────────────

interface HeroSlideBase {
  id: string;
  code?: string;
  discount?: string;
  vehicleId?: string;
  position?: 'hero' | 'middle' | 'bottom' | 'position3' | string;
  destinationType?: string;
  destinationUrl?: string;
  destinationScreen?: string;
  buttonText?: string;
  badgeText?: string;
}

interface TextSlide extends HeroSlideBase {
  kind: 'text';
  lines: [string, string];
  sub: string[];
}

interface ImageSlide extends HeroSlideBase {
  kind: 'image';
  imageUrl: string;
}

interface ComboSlide extends HeroSlideBase {
  kind: 'combination';
  imageUrl: string;
  lines: [string, string];
  sub: string[];
}

/** "Your ride, from just ₹X" with the cars; X is the real lowest day rate (the `fromRate` prop). */
interface PriceSlide extends HeroSlideBase {
  kind: 'price';
}

/** The four benefit cards (security deposit, unlimited km, maintained, delivery) as one picture. */
interface BenefitsSlide extends HeroSlideBase {
  kind: 'benefits';
}

type HeroSlide = TextSlide | ImageSlide | ComboSlide | PriceSlide | BenefitsSlide;

// Default brand slides if no backend offers or to complement active offers.
const DEFAULT_SLIDES: HeroSlide[] = [];

function splitTitleIntoTwoLines(title?: string, lines?: [string, string] | string[]): [string, string] {
  if (lines && Array.isArray(lines) && lines.length >= 2 && lines[0]?.trim() && lines[1]?.trim()) {
    return [lines[0].trim().toUpperCase(), lines[1].trim().toUpperCase()];
  }
  if (lines && Array.isArray(lines) && lines.length === 1 && lines[0]?.trim()) {
    return splitWords(lines[0].trim());
  }
  if (title && title.trim()) {
    return splitWords(title.trim());
  }
  return ['LOWEST PRICE', 'GUARANTEED'];
}

function splitWords(text: string): [string, string] {
  const words = text.split(/\s+/);
  if (words.length === 1) {
    return [words[0].toUpperCase(), 'OFFER'];
  }
  const mid = Math.ceil(words.length / 2);
  return [words.slice(0, mid).join(' ').toUpperCase(), words.slice(mid).join(' ').toUpperCase()];
}

function parseSubtitleTags(subtitle?: string): string[] {
  if (!subtitle || !subtitle.trim()) {
    return ['Zero security Deposit', 'Pickup/ Drop-off Delivery', 'Self drive/ driver'];
  }
  const parts = subtitle
    .split(/[•|,|\n]/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return parts.length > 0 ? parts : ['Zero security Deposit', 'Pickup/ Drop-off Delivery', 'Self drive/ driver'];
}

// Sunburst (Figma): 36 thin wedges from the headline's centre, every other one lighter. The light
// wedges fade out towards the centre so the rays melt into a soft glow behind the headline.
function Sunburst({ width, height, cy }: { width: number; height: number; cy: number }) {
  const cx = width / 2, r = Math.hypot(width, height) * 1.2, n = 32; // 16 light rays, as in the design
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
const ARC_W = 337.86;
const ARC_H = 128.95;
const SHADOW = { dx: 3, dy: 5, color: '#1E2547' };
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

function ArcHeadline({ lines, idPrefix = 'arc' }: { lines: [string, string]; idPrefix?: string }) {
  const line0 = lines[0] || 'LOWEST PRICE';
  const line1 = lines[1] || 'GUARANTEED';

  const width0 = line0.length <= 12 ? 236 : Math.min(310, Math.max(220, line0.length * 19));
  const size0 = line0.length <= 12 ? 44 : Math.max(22, Math.floor((44 * 12) / line0.length));

  const width1 = line1.length <= 10 ? 164 : Math.min(280, Math.max(160, line1.length * 17));
  const size1 = line1.length <= 10 ? 31 : Math.max(18, Math.floor((31 * 10) / line1.length));

  const dynamicLines = [
    { y: 62, rise: 10, width: width0, size: size0, text: line0 },
    { y: 110, rise: 7, width: width1, size: size1, text: line1 },
  ];

  return (
    <Svg width={ARC_W} height={ARC_H} accessibilityLabel={`${line0} ${line1}`}>
      <Defs>
        {dynamicLines.map((l, i) => {
          const x0 = (ARC_W - l.width) / 2 - 12, x1 = (ARC_W + l.width) / 2 + 12;
          return <Path key={i} id={`${idPrefix}_${i}`} d={`M${x0},${l.y} Q${ARC_W / 2},${l.y - l.rise * 2} ${x1},${l.y}`} />;
        })}
      </Defs>
      {dynamicLines.map((l, i) => {
        const renderText = (fill: string, opacity = 1) => (
          <SvgText fill={fill} fillOpacity={opacity} fontFamily="Anton_400Regular" fontSize={l.size} textAnchor="middle">
            <TextPath href={`#${idPrefix}_${i}`} startOffset="50%" textLength={l.width} lengthAdjust="spacingAndGlyphs">{l.text}</TextPath>
          </SvgText>
        );
        return (
          <G key={i}>
            {SHADOW_TAPS.map((t, k) => <G key={k} transform={`translate(${t.x} ${t.y})`}>{renderText(SHADOW.color, t.o)}</G>)}
            {renderText('#FFFFFF')}
          </G>
        );
      })}
    </Svg>
  );
}

export function HomeHero({ topInset, city, onCityPress, sawariCash, onWallet, fromRate, children, vehicleType, onType, onDates }: {
  /** Lowest real day rate; the price slide is left out until it is known. */
  fromRate?: number;
  children?: React.ReactNode;
  vehicleType: 'car' | 'bike';
  onType: (t: 'car' | 'bike') => void;
  /** Opens the calendar to pick the rental dates. */
  onDates: () => void;
  topInset: number;
  city: string;
  /** Opens the city picker. */
  onCityPress?: () => void;
  sawariCash: number | null;
  onWallet: () => void;
}) {
  const router = useRouter();
  // Signed-out customers have no balance to show, but the pill stays in the header at zero so the
  // header keeps its shape and the reward is discoverable before signing in.
  const cash = sawariCash ?? 0;
  const { width } = useWindowDimensions();
  const [slide, setSlide] = useState(0);
  const pager = useRef<ScrollView>(null);
  const touching = useRef(false);
  const [height, setHeight] = useState(0);

  const { data: offers } = useQuery(offersQueryOptions);

  const slides = useMemo<HeroSlide[]>(() => {
    const lead: HeroSlide[] = [{ id: 'home-price-banner', kind: 'price' }];
    if (!offers || !Array.isArray(offers)) return [...lead, ...DEFAULT_SLIDES];

    const offerSlides: HeroSlide[] = [];

    offers.forEach((offer) => {
      if (!isOfferLive(offer)) return;

      // Special deals and exclusive offers MUST NEVER appear in the home hero banner!
      // They belong exclusively in the Exclusive Offers section.
      if (
        offer.isExclusive ||
        offer.type === 'special_deal' ||
        offer.type === 'coupon' ||
        offer.position === 'exclusive' ||
        Boolean(offer.promotionalPrice) ||
        Boolean(offer.dealPrice)
      ) {
        return;
      }

      // Only hero position banners appear in the top hero carousel
      if (offer.position && offer.position !== 'hero') return;

      const imageUrl = offer.image?.url || (typeof offer.image === 'string' ? offer.image : null);
      if (offer.type !== 'banner') return;

      const format = offer.displayFormat || (imageUrl && !offer.title ? 'image' : imageUrl && offer.title ? 'combination' : 'text');

      if (format === 'image' && imageUrl) {
        offerSlides.push({
          id: offer.id,
          kind: 'image',
          imageUrl,
          code: offer.code,
          discount: offer.discount,
          vehicleId: offer.vehicleId,
          position: offer.position || 'hero',
          destinationType: offer.destinationType,
          destinationUrl: offer.destinationUrl,
          destinationScreen: offer.destinationScreen,
          buttonText: offer.buttonText,
          badgeText: offer.badgeText,
        });
      } else if (format === 'combination' && imageUrl) {
        offerSlides.push({
          id: offer.id,
          kind: 'combination',
          imageUrl,
          lines: splitTitleIntoTwoLines(offer.title, offer.lines),
          sub: parseSubtitleTags(offer.subtitle),
          code: offer.code,
          discount: offer.discount,
          vehicleId: offer.vehicleId,
          position: offer.position || 'hero',
          destinationType: offer.destinationType,
          destinationUrl: offer.destinationUrl,
          destinationScreen: offer.destinationScreen,
          buttonText: offer.buttonText,
          badgeText: offer.badgeText,
        });
      } else {
        // text format
        offerSlides.push({
          id: offer.id,
          kind: 'text',
          lines: splitTitleIntoTwoLines(offer.title, offer.lines),
          sub: parseSubtitleTags(offer.subtitle),
          code: offer.code,
          discount: offer.discount,
          vehicleId: offer.vehicleId,
          position: offer.position || 'hero',
          destinationType: offer.destinationType,
          destinationUrl: offer.destinationUrl,
          destinationScreen: offer.destinationScreen,
          buttonText: offer.buttonText,
          badgeText: offer.badgeText,
        });
      }
    });

    return [...lead, ...DEFAULT_SLIDES, ...offerSlides];
  }, [offers, fromRate]);

  // Adaptive width across compact phones (360dp), modern phones (390-430dp), and tablets (460dp max)
  const cardWidth = Math.min(width - 32, 460);
  const priceBannerWidth = Math.min(width, 393);
  const priceBannerScale = priceBannerWidth / 393;

  const handleSlidePress = useCallback((s: HeroSlide | any) => {
    Haptics.selectionAsync();

    // 1. External website destination
    if (s.destinationType === 'external' && s.destinationUrl) {
      Linking.openURL(s.destinationUrl).catch(() => {
        Alert.alert('Could Not Open Link', `Unable to open: ${s.destinationUrl}`);
      });
      return;
    }

    // 2. Specific Vehicle Details destination
    if (s.destinationType === 'vehicle' || s.vehicleId) {
      if (s.code) Clipboard.setStringAsync(s.code);
      if (s.vehicleId) {
        router.push({
          pathname: '/car-details',
          params: {
            id: s.vehicleId,
            vehicleId: s.vehicleId,
            ...(s.code ? { promoCode: s.code } : {}),
          },
        });
        return;
      }
    }

    // 3. Offers & discounts destination
    if (s.destinationType === 'offers') {
      router.push('/offers');
      return;
    }

    // 4. Offer details destination
    if (s.destinationType === 'offer_details') {
      if (s.code) {
        Clipboard.setStringAsync(s.code);
        CustomAlert.alert('Code Copied! 🎟️', `Promo code "${s.code}" copied to clipboard! Paste it at checkout.`);
      }
      router.push('/offers');
      return;
    }

    // 5. Booking page destination
    if (s.destinationType === 'booking') {
      router.push('/search');
      return;
    }

    // 6. Specified internal app screen destination
    if (s.destinationType === 'screen' && s.destinationScreen) {
      router.push(s.destinationScreen as any);
      return;
    }

    // Default fallback: copy code if present
    if (s.code) {
      Clipboard.setStringAsync(s.code);
      CustomAlert.alert(
        'Code Copied! 🎟️',
        `Promo code "${s.code}" has been copied to your clipboard. Paste it at checkout to get your discount!`,
        [{ text: 'Great!' }]
      );
    }
  }, [router]);

  useEffect(() => {
    if (slide >= slides.length && slides.length > 0) {
      setSlide(0);
      pos.current = 0;
      pager.current?.scrollTo({ x: 0, animated: false });
    }
  }, [slides.length, slide]);

  // Slides move on their own every 4.5 s, always the same way (next banner slides in from the right), never while the
  // customer is swiping. After the last banner a copy of the first one slides in, then the pager jumps back to the real
  // first without animation, so it never sweeps backwards across all the banners.
  const pos = useRef(0);
  const count = slides.length;
  // The hero carousel adapts its height to the active slide.
  const kind = slides[slide % count]?.kind;
  const areaH = kind === 'price' ? 287 * priceBannerScale : kind === 'benefits' ? 186 : 166;
  const pagerTop = kind === 'price' ? 0 : kind === 'benefits' ? 0 : 9;
  useEffect(() => {
    if (count <= 1) return;
    let reset: ReturnType<typeof setTimeout> | undefined;
    const t = setInterval(() => {
      if (touching.current) return;
      pos.current += 1;
      pager.current?.scrollTo({ x: pos.current * width, animated: true });
      setSlide(pos.current % count);
      if (pos.current >= count) {
        reset = setTimeout(() => {
          pos.current = 0;
          pager.current?.scrollTo({ x: 0, animated: false });
        }, 600);
      }
    }, 4500);
    return () => { clearInterval(t); if (reset) clearTimeout(reset); };
  }, [count, width]);

  return (
    // Two stops, no mid-tones.
    <LinearGradient
      colors={[HERO_TOP, HERO_BOTTOM]}
      locations={[0, 0.9385]}
      style={{ paddingTop: topInset, borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' }}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
    >
      <View style={styles.heroTop}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`City: ${city}. Change city`}
            onPress={() => { Haptics.selectionAsync(); onCityPress?.(); }}
            hitSlop={8}
            style={({ pressed }) => [styles.cityRow, pressed && { opacity: 0.7 }]}
          >
            <Text style={styles.city}>{city}</Text>
            <Feather name="chevron-right" size={15} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.brandLine} numberOfLines={1} ellipsizeMode="tail">Kahilipara</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`SawariCash ${cash}`}
          testID="wallet-pill"
          onPress={onWallet}
          style={({ pressed }) => [styles.walletPill, pressed && { opacity: 0.85 }]}
        >
          <Text style={styles.walletText}>{cash}</Text>
          <PicIcon source={ICON.walletCoins} size={12} />
        </Pressable>
      </View>

      {/* Slide area is 166 tall (Figma 137→303): the price slide sits at its top, the benefit cards at its bottom. */}
      {count > 0 && <ScrollView
        ref={pager}
        style={{ height: areaH }}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScrollBeginDrag={() => { touching.current = true; }}
        onMomentumScrollEnd={(e) => {
          touching.current = false;
          let i = Math.round(e.nativeEvent.contentOffset.x / width);
          if (i >= count) { i = 0; pager.current?.scrollTo({ x: 0, animated: false }); } // swiped onto the copy of the first banner
          pos.current = i;
          setSlide(i);
        }}
      >
        {(count > 1 ? [...slides, slides[0]] : slides).map((s, index) => (
          <View key={`${s.id}-${index}`} style={{ width, height: areaH, alignItems: 'center', justifyContent: s.kind === 'benefits' ? 'flex-end' : 'center', paddingBottom: s.kind === 'benefits' ? 9 : 0 }}>
            {s.kind === 'benefits' ? (
              <>
                <Text style={styles.findHeadline} numberOfLines={1} adjustsFontSizeToFit accessibilityRole="header" accessibilityLabel="Find the Perfect Ride">Find the <Text style={{ color: '#FAC64C' }}>Perfect Ride</Text></Text>
                <BenefitCards width={Math.min(width, 492)} />
              </>
            ) : s.kind === 'price' ? (
              <View
                style={[styles.priceBanner, { transform: [{ scale: priceBannerScale }] }]}
                accessible
                accessibilityRole="header"
                accessibilityLabel={`Your ride, from just ${formatCurrency(fromRate || 0)}`}
              >
                <LinearGradient
                  colors={['#6152D8', '#CEC9F3']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <BannerRays style={styles.priceBannerRays} />
                <View style={styles.priceBannerText}>
                  <View style={styles.priceRow}>
                    <View style={styles.priceLeadCol}>
                      <Text style={[styles.priceLead, styles.priceLeadTop]} numberOfLines={1} allowFontScaling={false}>Your ride,</Text>
                      <Text style={styles.priceLead} numberOfLines={1} allowFontScaling={false}>from just</Text>
                    </View>
                    <Text
                      style={styles.priceAmount}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.72}
                      allowFontScaling={false}
                    >
                      {formatCurrency(fromRate || 999)}
                    </Text>
                  </View>
                </View>
                <Svg width={290} height={36} style={styles.priceCarShadow} pointerEvents="none">
                  <Defs>
                    <RadialGradient id={`heroCarShadow_${index}`} cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
                      <Stop offset="0" stopColor="#0E0E0E" stopOpacity={0.6} />
                      <Stop offset="0.45" stopColor="#0E0E0E" stopOpacity={0.3} />
                      <Stop offset="1" stopColor="#0E0E0E" stopOpacity={0} />
                    </RadialGradient>
                  </Defs>
                  <Ellipse cx={145} cy={18} rx={145} ry={18} fill={`url(#heroCarShadow_${index})`} />
                </Svg>
                <CachedImage source={require('@/assets/images/home_hero_cars.png')} style={styles.priceCars} contentFit="contain" transition={0} />
              </View>
            ) : s.kind === 'image' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Promotional banner"
                onPress={() => handleSlidePress(s)}
                style={({ pressed }) => [
                  styles.imageSlideCard,
                  { width: cardWidth },
                  pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
                ]}
              >
                <CachedImage source={{ uri: s.imageUrl }} style={styles.imageSlidePhoto} contentFit="cover" cachePolicy="memory-disk" transition={0} />
                {!!s.code && (
                  <View style={styles.bannerCodePill}>
                    <Feather name="scissors" size={10} color="#323E71" />
                    <Text style={styles.bannerCodeText}>CODE: {s.code}</Text>
                    <Feather name="copy" size={9} color="#323E71" />
                  </View>
                )}
                {!!s.discount && (
                  <View style={styles.bannerDiscountBadge}>
                    <Text style={styles.bannerDiscountText}>{s.discount}</Text>
                  </View>
                )}
              </Pressable>
            ) : s.kind === 'combination' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${s.lines[0]} ${s.lines[1]}`}
                onPress={() => handleSlidePress(s)}
                style={({ pressed }) => [
                  styles.comboSlideCard,
                  { width: cardWidth },
                  pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
                ]}
              >
                <CachedImage source={{ uri: s.imageUrl }} style={styles.imageSlidePhoto} contentFit="cover" cachePolicy="memory-disk" transition={0} />
                <LinearGradient
                  colors={['rgba(38, 47, 87, 0.45)', 'rgba(38, 47, 87, 0.85)']}
                  style={StyleSheet.absoluteFill}
                />
                <View style={styles.comboContent}>
                  <View style={{ transform: [{ scale: 0.84 }], marginTop: -10 }}>
                    <ArcHeadline lines={s.lines} idPrefix={`combo_${index}`} />
                  </View>
                  <View style={styles.comboSubRow}>
                    {s.sub.map((t, i) => (
                      <React.Fragment key={`${t}-${i}`}>
                        {i > 0 && <View style={styles.subDot} />}
                        <Text style={styles.sub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{t}</Text>
                      </React.Fragment>
                    ))}
                  </View>
                  {!!s.code && (
                    <View style={styles.comboCodePill}>
                      <Feather name="scissors" size={10} color="#FFE600" />
                      <Text style={styles.comboCodeText}>CODE: {s.code}</Text>
                      <Text style={styles.comboCopyHint}>(Tap to copy)</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole={s.code || s.vehicleId ? 'button' : undefined}
                onPress={s.code || s.vehicleId ? () => handleSlidePress(s) : undefined}
                style={styles.textSlideWrap}
              >
                <View style={styles.headlineBlock} accessible accessibilityRole="header" accessibilityLabel={`${s.lines[0]} ${s.lines[1]}`}>
                  <ArcHeadline lines={s.lines} idPrefix={`hero_${index}`} />
                </View>
                <View style={styles.subRow}>
                  {s.sub.map((t, i) => (
                    <React.Fragment key={`${t}-${i}`}>
                      {i > 0 && <View style={styles.subDot} />}
                      <Text style={styles.sub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{t}</Text>
                    </React.Fragment>
                  ))}
                </View>
                {!!s.code && (
                  <View style={styles.textCodeRow}>
                    <View style={styles.textCodePill}>
                      <Feather name="scissors" size={10} color="#FFE600" />
                      <Text style={styles.textCodeText}>Use code: {s.code} (Tap to copy)</Text>
                      <Feather name="copy" size={9} color="#FFFFFF" />
                    </View>
                  </View>
                )}
              </Pressable>
            )}
          </View>
        ))}
      </ScrollView>}

      {/* Page indicator: a short white thumb sliding along a faint track */}
      {slides.length > 1 && (
        <View style={[styles.pager, { marginTop: pagerTop }]}>
          <View style={[styles.thumb, { left: (slide * (36 - 18)) / Math.max(1, slides.length - 1) }]} />
        </View>
      )}
      <HeroTabs width={Math.min(width, 393)} vehicleType={vehicleType} onType={onType} />
      <HeroSearch onDates={onDates} />
      {children}
    </LinearGradient>
  );
}

// ── Hero tabs + search (Figma Frame 2147226254) ──────────────────────────────

/** Folder-style tabs: the active one is outlined and open at the bottom, the other shows a faint outline. */
function HeroTabs({ width, vehicleType, onType }: { width: number; vehicleType: 'car' | 'bike'; onType: (t: 'car' | 'bike') => void }) {
  const car = vehicleType === 'car';
  const line = 'rgba(255,255,255,0.65)';
  const faint = 'rgba(255,255,255,0.4)';
  return (
    <View style={{ height: 49, marginTop: 12, width }} accessibilityRole="tablist">
      <Svg width={393} height={49} viewBox="0 0 393 49" style={StyleSheet.absoluteFill} preserveAspectRatio="none" pointerEvents="none">
        {car ? (
          <>
            <Path d="M212 10 Q213 0.5 222 0.5 H352 Q360 0.5 363 9 L371 36 Q372 39 377 39" stroke={faint} strokeWidth={1} fill="none" />
            <Path d="M0 39 H22 Q26 39 27 33 L29 10 Q30 0.5 40 0.5 H170 Q177 0.5 179 9 L188 34 Q189.5 39 196 39 H393" stroke={line} strokeWidth={1} fill="rgba(51,43,114,0.45)" />
          </>
        ) : (
          <>
            <Path d="M30 10 Q31 0.5 40 0.5 H170 Q178 0.5 181 9 L189 36 Q190 39 195 39" stroke={faint} strokeWidth={1} fill="none" />
            <Path d="M0 39 H196 Q202 39 204 34 L213 9 Q215 0.5 224 0.5 H352 Q361 0.5 363 10 L367 33 Q368 39 373 39 H393" stroke={line} strokeWidth={1} fill="rgba(51,43,114,0.45)" />
          </>
        )}
      </Svg>
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, height: 49 }}>
        {([['car', 'Cars'], ['bike', 'Bikes & Scooters']] as const).map(([key, label]) => {
          const on = vehicleType === key;
          return (
            <Pressable key={key} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => { Haptics.selectionAsync(); onType(key); }} style={{ flex: 1, height: 39, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 26, color: on ? '#FFFFFF' : 'rgba(255,255,255,0.8)', includeFontPadding: false }} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function HeroSearch({ onDates }: { onDates: () => void }) {
  return (
    <View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: 14, marginTop: 9 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Choose Your Rental Dates"
        onPress={() => { Haptics.selectionAsync(); onDates(); }}
        style={({ pressed }) => [{ height: 51, flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#D1CCF9', borderRadius: 12 }, pressed && { opacity: 0.85 }]}
      >
        <Feather name="calendar" size={20} color="#737373" />
        <Text style={{ fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, lineHeight: 22.5, color: '#737373', includeFontPadding: false }} numberOfLines={1}>Select dates & times</Text>
      </Pressable>
    </View>
  );
}

// ── Section Promo Banners (Middle & Bottom positions) ────────────────────────

export function HomePromoBanner({ position = 'middle' }: { position?: 'middle' | 'bottom' | 'position3' | string }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { data: offers } = useQuery(offersQueryOptions);

  const banners = useMemo(() => {
    if (!offers || !Array.isArray(offers)) return [];
    return offers.filter((o) => {
      if (!o || !isOfferLive(o)) return false;
      // Special deals and exclusive offers MUST NOT appear in home promo banners
      if (o.type !== 'banner') return false;
      if (o.isExclusive || o.position === 'exclusive') return false;
      if (position === 'position3') {
        return (
          o.position === 'position3' ||
          o.position === 'promo3' ||
          o.position === '3' ||
          o.sortOrder === 3
        );
      }
      return o.position === position;
    });
  }, [offers, position]);

  if (!banners.length) return null;

  const cardWidth = Math.min(width - 32, 480);

  const handleBannerPress = (b: any) => {
    Haptics.selectionAsync();

    if (b.destinationType === 'external' && b.destinationUrl) {
      Linking.openURL(b.destinationUrl).catch(() => { });
      return;
    }
    if ((b.destinationType === 'vehicle' || !b.destinationType) && b.vehicleId) {
      if (b.code) Clipboard.setStringAsync(b.code);
      router.push({
        pathname: '/car-details',
        params: { id: b.vehicleId, vehicleId: b.vehicleId, ...(b.code ? { promoCode: b.code } : {}) },
      });
      return;
    }
    if (b.destinationType === 'offers' || b.destinationType === 'offer_details') {
      if (b.code) Clipboard.setStringAsync(b.code);
      router.push('/offers');
      return;
    }
    if (b.destinationType === 'booking') {
      router.push('/search');
      return;
    }
    if (b.destinationType === 'screen' && b.destinationScreen) {
      router.push(b.destinationScreen as any);
      return;
    }
    if (b.code) {
      Clipboard.setStringAsync(b.code);
      CustomAlert.alert('Code Copied! 🎟️', `Promo code "${b.code}" copied to clipboard! Paste at checkout.`);
    }
  };

  return (
    <View style={styles.promoBannerContainer}>
      {banners.map((b) => {
        const imageUrl = b.image?.url || (typeof b.image === 'string' ? b.image : null);
        if (!imageUrl) return null;

        return (
          <Pressable
            key={b.id || b._id}
            accessibilityRole="button"
            onPress={() => handleBannerPress(b)}
            style={({ pressed }) => [
              styles.promoBannerCard,
              { width: cardWidth },
              pressed && { opacity: 0.95, transform: [{ scale: 0.99 }] },
            ]}
          >
            <CachedImage
              source={{ uri: imageUrl }}
              style={styles.promoBannerPhoto}
              contentFit="cover"
              cachePolicy="memory-disk"
            />
            {(b.title || b.subtitle || b.badgeText || b.buttonText) && (
              <LinearGradient
                colors={['transparent', 'rgba(15, 23, 42, 0.82)']}
                style={StyleSheet.absoluteFill}
              />
            )}
            <View style={styles.promoBannerContent}>
              {!!b.badgeText && (
                <View style={styles.promoBannerBadge}>
                  <Text style={styles.promoBannerBadgeText}>{b.badgeText}</Text>
                </View>
              )}
              {!!b.title && <Text style={styles.promoBannerTitle}>{b.title}</Text>}
              {!!b.subtitle && <Text style={styles.promoBannerSubtitle}>{b.subtitle}</Text>}
              {!!b.buttonText && (
                <View style={styles.promoBannerCtaBtn}>
                  <Text style={styles.promoBannerCtaText}>{b.buttonText}</Text>
                  <Feather name="arrow-right" size={12} color="#FFFFFF" />
                </View>
              )}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

// ── Refer strip (sits on the banner's lower edge) ────────────────────────────

export function ReferStrip({ earnText, onPress }: { earnText: string; onPress: () => void }) {
  const p = useDetailsPalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Refer and earn ${earnText}. Earn 10% every time your friends complete a trip!`}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={({ pressed }) => [styles.refer, { backgroundColor: p.page, borderColor: p.deliveryBorder }, pressed && { opacity: 0.9 }]}
    >
      <View style={[styles.referIconWrap, { backgroundColor: p.iconBg }]}>
        <PicIcon source={ICON.referHandCoin} size={24} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.referTop}>
          <Text style={[styles.referTitle, { color: '#262626' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Refer & Earn up to {earnText}</Text>
          <View style={[styles.referBtn, { backgroundColor: p.navy }]}>
            <Text style={styles.referBtnText}>Refer</Text>
            <Feather name="arrow-right" size={8} color="#FFFFFF" />
          </View>
        </View>
        <Text style={[styles.referSub, { color: '#737373' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>Get 10% of your friend’s booking payment.</Text>
      </View>
    </Pressable>
  );
}

// ── Cars / Bikes + destination ───────────────────────────────────────────────

export function HomeSearchCard({ vehicleType, onType, onDates }: {
  vehicleType: 'car' | 'bike';
  onType: (t: 'car' | 'bike') => void;
  /** Opens the calendar to pick the rental dates. */
  onDates: () => void;
}) {
  const p = useDetailsPalette();
  const tabs = [{ key: 'car', label: 'Cars' }, { key: 'bike', label: 'Bikes & Scooters' }] as const;
  const rows = [
    { icon: 'calendar', label: 'Select dates & times', onPress: onDates, hint: 'Choose Your Rental Dates' },
  ] as const;
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
              style={[styles.tab, on && styles.tabOn]}
            >
              <Text style={[styles.tabText, { color: on ? '#2B386A' : '#737373' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
      {rows.map((r) => (
        <Pressable
          key={r.icon}
          accessibilityRole="button"
          accessibilityLabel={r.hint}
          onPress={() => { Haptics.selectionAsync(); r.onPress(); }}
          style={({ pressed }) => [styles.destBox, { backgroundColor: p.page, borderColor: p.deliveryBorder }, pressed && { opacity: 0.85 }]}
        >
          <Feather name={r.icon} size={20} color="#737373" />
          <Text style={[styles.destText, { color: '#737373' }]} numberOfLines={1}>{r.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

/** A trip the customer searched (where, which dates, what time), MakeMyTrip style: tap to resume or search again. */
export function TripSearchCard({ search, car, onPress, onRemove, onViewDetails }: {
  search: RecentSearch;
  /** The searched car, when the search was for one car: its availability for those dates is shown. */
  car?: Car & { availability?: any; isAvailable?: boolean };
  onPress: () => void;
  onRemove?: () => void;
  onViewDetails?: () => void;
}) {
  const p = useDetailsPalette();
  const time = search.pickupTime && search.returnTime ? `${search.pickupTime} – ${search.returnTime}` : '';
  // For a car search that is free for the searched dates and times: "View Details" (nothing when it is not).
  const [startLabel, endLabel] = car && search.dateRange && search.dateRange !== 'Upcoming Trip' ? splitDateRange(search.dateRange) : ['', ''];
  const availability = car ? getAvailability(car, startLabel || undefined, endLabel || undefined, search.pickupTime, search.returnTime) : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Search in ${search.dropoff.name}, ${search.dateRange}`}
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      style={({ pressed }) => [
        styles.tripCard,
        { backgroundColor: p.page, borderColor: p.deliveryBorder },
        pressed && { opacity: 0.85 },
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.tripWhere, { color: p.fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
          {car ? (search.carName || carTitle(car)) : search.dropoff.name}
        </Text>
        <View style={styles.tripLine}>
          <Feather name="calendar" size={11} color={p.muted} />
          <Text style={[styles.tripWhen, { color: p.muted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{search.dateRange}</Text>
        </View>
        {!!time && (
          <View style={styles.tripLine}>
            <Feather name="clock" size={11} color={p.muted} />
            <Text style={[styles.tripWhen, { color: p.muted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{time}</Text>
          </View>
        )}
        {availability?.available && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View details of ${search.carName || carTitle(car!)}`}
            hitSlop={8}
            onPress={() => { Haptics.selectionAsync(); (onViewDetails || onPress)(); }}
            style={({ pressed }) => [styles.tripStatus, pressed && { opacity: 0.7 }]}
          >
            <Text style={[styles.tripViewDetails, { color: p.muted }]}>View Details</Text>
            <Feather name="chevron-right" size={12} color={p.muted} />
          </Pressable>
        )}
      </View>
      {onRemove ? (
        <Pressable accessibilityRole="button" accessibilityLabel="Remove this search" onPress={onRemove} hitSlop={10}>
          <Feather name="x" size={16} color={p.muted} />
        </Pressable>
      ) : (
        <Feather name="chevron-right" size={16} color={p.muted} />
      )}
    </Pressable>
  );
}

type CategoryFilter = { body?: string; transmission?: string };
const BIKE_CATEGORIES = [
  { filter: { transmission: 'Manual' }, label: 'Bikes', image: require('@/assets/images/category_bike.png'), w: 90, h: 60 },
  { filter: { transmission: 'Automatic' }, label: 'Scooters', image: require('@/assets/images/category_scooter.png'), w: 90, h: 60 },
];
const CATEGORIES = [
  { filter: { body: 'SUV' }, label: 'SUVs', image: require('@/assets/images/category_suv.png'), w: 66, h: 44 },
  { filter: { body: 'Sedan' }, label: 'Sedans', image: require('@/assets/images/category_sedan.png'), w: 66, h: 44 },
  { filter: { body: 'Hatchback' }, label: 'Hatchbacks', image: require('@/assets/images/category_hatchback.png'), w: 66, h: 44 },
  { filter: { body: 'MUV' }, label: 'MUV / MPV', image: require('@/assets/images/category_muv.png'), w: 66, h: 44 },
];

/** "Explore Cars by Category" / "Explore Bikes & Scooters": crisp 2x cutouts inside soft radial-glow tiles. */
export function HomeCategories({ bike, onPick }: { bike?: boolean; onPick: (filter: CategoryFilter) => void }) {
  const p = useDetailsPalette();
  const isDark = p.page !== '#FFFFFF';
  const uid = useId().replace(/:/g, '');
  const items = bike ? BIKE_CATEGORIES : CATEGORIES;
  return (
    <View style={styles.catWrap}>
      <Text style={[styles.catTitle, { color: p.fg }]} accessibilityRole="header">{bike ? 'Explore Bikes & Scooters' : 'Explore Cars by Category'}</Text>
      <View style={styles.catRow}>
        {items.map((c, idx) => {
          const gradId = `catGrad_${uid}_${idx}`;
          return (
            <Pressable
              key={c.label}
              accessibilityRole="button"
              accessibilityLabel={c.label}
              onPress={() => { Haptics.selectionAsync(); onPick(c.filter); }}
              style={({ pressed }) => [styles.catItem, pressed && { opacity: 0.85 }]}
            >
              <View style={[styles.catTile, { borderColor: isDark ? p.deliveryBorder : '#BFC3D4', backgroundColor: isDark ? p.summary : '#E3E8F2' }]}>
                <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
                  <Defs>
                    <RadialGradient id={gradId} cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
                      <Stop offset="0.48" stopColor={isDark ? p.iconBg : '#FFFFFF'} />
                      <Stop offset="1" stopColor={isDark ? p.summary : '#E3E8F2'} />
                    </RadialGradient>
                  </Defs>
                  <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${gradId})`} />
                </Svg>
                <CachedImage
                  source={c.image}
                  style={{ width: c.w, height: c.h }}
                  contentFit="contain"
                  transition={0}
                />
              </View>
              <Text style={[styles.catLabel, { color: isDark ? p.fg : '#2B386A' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.78}>{c.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function HomeSectionTitle({ title, inset = true }: { title: string; inset?: boolean }) {
  const p = useDetailsPalette();
  return (
    <Text
      style={[styles.sectionTitle, inset ? styles.sectionTitleInset : styles.panelSectionTitle, { color: p.fg }]}
      accessibilityRole="header"
    >
      {title}
    </Text>
  );
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
  const tag = bestFor(car);
  const year = car.modelYear || car.registrationYear;
  const title = carTitle(car);
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
      <View style={[styles.pickImageWrap, { backgroundColor: p.iconBg, borderColor: p.deliveryBorder }]}>
        <LoadingImage source={images[shown]} contentFit="cover" transition={250} recyclingKey={`${car.id}-${shown}`} style={StyleSheet.absoluteFill} />
        {!!tag && (
          <View style={[styles.pickTag, { backgroundColor: p.navy }]}>
            <Text style={styles.pickTagText}>Best for {tag}</Text>
          </View>
        )}
      </View>
      <View style={styles.pickBody}>
        <View style={styles.pickTitleRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pickName, { color: p.fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{year && !title.includes(year) ? `${title} ${year}` : title}</Text>
            <View style={styles.pickMetaRow}>
              {meta.map((m, i) => (
                <React.Fragment key={m}>
                  {i > 0 && <View style={[styles.pickMetaDot, { backgroundColor: p.muted }]} />}
                  <Text style={[styles.pickMeta, { color: p.muted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{m}</Text>
                </React.Fragment>
              ))}
            </View>
          </View>
          {!!car.rating && ((car as any).reviewCount ?? 0) > 0 && (
            <View style={[styles.ratingPill, { backgroundColor: p.navy }]}>
              <Text style={styles.ratingText}>{car.rating.toFixed(1)}</Text>
              <Ionicons name="star" size={12} color={p.star} />
            </View>
          )}
        </View>
        <View style={styles.pickPriceRow}>
          <View style={styles.pickPrices}>
            <Text style={[styles.pickPrice, { color: p.fg }]}>{formatCurrency(memberPrice ?? car.perDay)}</Text>
            <Text style={[styles.pickPerDay, { color: p.muted }]}>/day</Text>
          </View>
          {/* Availability line */}
          <Text style={[styles.pickAvail, { color: (available || availability.availableToday || availability.nextAvailableFrom) && availability.reason !== 'service' ? AVAILABLE_GREEN : p.red }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
              {/* Dates only, never hours ("Available Today, 4 PM – 8 PM" was too much on a small card) */}
              {available
                ? 'Available now'
                : availability.nextAvailableFrom
                  ? `Available on ${cardDate(availability.nextAvailableFrom)}`
                  : availability.headline}
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
  const { isDarkMode: dark } = useSawari();
  const done = Math.min(rides, target);
  // Figma: an invisible stop at the start, then 1, 2, 3 and the coin, spaced evenly across the 335 bar
  // (centres at 76.5, 160, 243.5 and 327 → % of the bar). Stops are trip counts; the fill runs from 0 trips.
  const stops = [1, 2, 3].map((k) => Math.round((target * k) / 4)).concat(target);
  const AT = [22.84, 47.76, 72.69, 97.61];
  const fill = (() => {
    if (done >= target) return 100;
    let prevRides = 0, prevAt = 0;
    for (let i = 0; i < stops.length; i++) {
      if (done <= stops[i]) return prevAt + ((done - prevRides) / Math.max(1, stops[i] - prevRides)) * (AT[i] - prevAt);
      prevRides = stops[i]; prevAt = AT[i];
    }
    return 100;
  })();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Complete ${target} trips, get up to ${formatCurrency(reward)} rewards. ${done} of ${target} completed.`}
      onPress={onPress}
      // Figma "Membership" card: #EFEDFD fill, 1px #D1CCF9 border (dark mode keeps the palette's dark card).
      style={[styles.milestone, dark ? { backgroundColor: p.purpleBg, borderColor: p.memberBorder } : { backgroundColor: '#EFEDFD', borderColor: '#D1CCF9' }]}
    >
      <Image source={require('@/assets/images/MySawari_nobg.png')} style={styles.milestoneLogo} resizeMode="contain" />
      <Text style={[styles.milestoneTitle, { color: p.fg }]}>Complete {target} trips, earn {formatCurrency(reward)} off</Text>
      <Text style={[styles.milestoneSub, { color: p.muted }]}>Get {formatCurrency(reward)} off after completing {target} trips.</Text>

      <View style={styles.track}>
        <View style={styles.trackRail}>
          <View style={[styles.trackLine, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.trackLine, { backgroundColor: HOME_PURPLE, right: undefined, width: `${fill}%` }]} />
        </View>
        {stops.slice(0, 3).map((m, i) => {
          const reached = done >= m;
          return (
            <View key={i} style={[styles.mark, { left: `${AT[i]}%`, borderColor: reached ? HOME_PURPLE : 'rgba(97,82,216,0.32)', backgroundColor: reached ? HOME_PURPLE : '#FFFFFF' }]}>
              <Text style={[styles.markText, { color: reached ? '#FFFFFF' : p.muted }]}>{m}</Text>
            </View>
          );
        })}
        <View style={[styles.coin, { left: `${AT[3]}%` }]}>
          <PicIcon source={ICON.milestoneCoin} size={12} />
        </View>
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
      <CachedImage source={image} style={StyleSheet.absoluteFill} contentFit="cover" cachePolicy="memory-disk" transition={150} />
      {/* High-contrast gradient vignette ensuring white typography is always readable */}
      <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.45)', 'rgba(0,0,0,0.88)']} locations={[0.3, 0.65, 1]} style={StyleSheet.absoluteFill} />
      <View style={styles.destTileBody}>
        <Text style={styles.destTileTitle}>{title}</Text>
        <Text style={styles.destTileBlurb} numberOfLines={2}>{blurb}</Text>
      </View>
    </Pressable>
  );
}

// ── Benefits ─────────────────────────────────────────────────────────────────

// Design order and copy. Uses the pictures already in assets/images; `wide` takes the whole row (the fifth item).
// Design order and copy (five rows of the grid; `wide` takes the whole row).
// const BENEFITS: { title: string; sub: string; image: ImageSourcePropType; size: number; wide?: boolean }[] = [
//   { title: 'Lowest Price', sub: 'Guaranteed low rates', image: require('@/assets/images/benefit_lowest_price.png'), size: 20 },
//   { title: 'Unlimited KM', sub: 'Unlimited on 1+ day trips', image: require('@/assets/images/benefit_unlimited_km.png'), size: 24 },
//   { title: 'Well Maintained', sub: 'Regularly serviced', image: require('@/assets/images/benefit_well_maintained.png'), size: 24 },
//   { title: 'Zero Deposit', sub: 'No security deposit', image: require('@/assets/images/benefit_zero_deposit.png'), size: 24 },
//   { title: 'Zero cancellation/rescheduling fees', sub: '100% refund up to 24 hours before your trip', image: require('@/assets/images/benefit_zero_cancellation.png'), size: 24, wide: true },
// ];

const BENEFITS = [
  {
    title: 'Lowest Price',
    sub: 'Guaranteed low rates',
    image: LowestPriceIcon,
    size: 24,
  },
  {
    title: 'Unlimited KM',
    sub: 'Unlimited on 1+ day trips',
    image: UnlimitedKmIcon,
    size: 24,
  },
  {
    title: 'Well Maintained',
    sub: 'Regularly serviced',
    image: WellMaintainedIcon,
    size: 24,
  },
  {
    title: 'Zero Deposit',
    sub: 'No security deposit',
    image: ZeroDepositIcon,
    size: 24,
  },
  {
    title: 'Zero cancellation/rescheduling fees',
    sub: '100% refund up to 24 hours before your trip',
    image: ZeroCancellationIcon,
    size: 24,
    wide: true,
  },
];

export function BenefitsGrid() {
  const p = useDetailsPalette();
  return (
    <View style={styles.benefits}>
      {BENEFITS.map((b) => (
        <View key={b.title} style={[styles.benefit, b.wide && { flexBasis: '100%' }]} accessible accessibilityLabel={`${b.title}, ${b.sub}`}>
          <View style={styles.benefitCircle}>
            {/* <Image source={b.image} style={{ width: b.size, height: b.size }} resizeMode="contain" /> */}
            <PicIcon source={b.image} size={b.size} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.benefitTitle, { color: p.fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{b.title}</Text>
            <Text style={[styles.benefitSub, { color: p.muted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{b.sub}</Text>
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

/** "Rate us" strip: tonal surface, star badge, five small stars and a filled button; opens Google Play (Android) or the App Store (iPhone). */
export function RateUsCard() {
  const p = useDetailsPalette();
  const store = Platform.OS === 'ios' ? 'App Store' : 'Play Store';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Rate us on the ${store}`}
      onPress={() => { Haptics.selectionAsync(); openStorePage(); }}
      style={({ pressed }) => [styles.rate, { backgroundColor: p.purpleBg, borderColor: p.memberBorder }, pressed && { opacity: 0.92, transform: [{ scale: 0.99 }] }]}
    >
      <View style={[styles.rateBadge, { backgroundColor: p.page, borderColor: p.memberBorder }]}>
        <Ionicons name="star" size={24} color="#F5B301" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rateTitle, { color: p.fg }]} numberOfLines={1}>Enjoying MySawari?</Text>
        <View style={styles.rateLine}>
          {[0, 1, 2, 3, 4].map((i) => <Ionicons key={i} name="star" size={14} color="#F5B301" />)}
        </View>
        <Text style={[styles.rateSub, { color: p.muted }]}>Rate us on the {store}</Text>
      </View>
      <View style={[styles.rateBtn, { backgroundColor: HOME_PURPLE }]}>
        <Text style={styles.rateBtnText}>Rate</Text>
        <Feather name="arrow-up-right" size={10} color="#FFFFFF" />
      </View>
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
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 16, height: 64 }, cityRow: { flexDirection: 'row', alignItems: 'center', gap: 0 },
  city: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5, color: '#FFFFFF' },
  brandLine: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  // Figma: 72x42 pill, padding 14/12 (vertical is centred, not padded, so the 20px text is not clipped), radius 40, gap 4.
  // Figma: 72x42 pill, padding 14/12 (vertical is centred, not padded, so the 20px text is not clipped), radius 40, gap 4.
  walletPill: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, width: 72, height: 42, paddingHorizontal: 12, borderRadius: 40, backgroundColor: '#F0EFFD', borderWidth: 1, borderColor: '#D1CCF9' },
  walletCoin: { width: 12, height: 12 },
  walletText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20, color: '#2F3E75' },
  // Figma Home price banner: 393×287 card with the price lockup and SUV trio.
  findHeadline: { width: 300, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 28, lineHeight: 42, letterSpacing: -0.56, textAlign: 'center', color: '#FFFFFF', textShadowColor: 'rgba(0,0,0,0.25)', textShadowOffset: { width: 0, height: 4 }, textShadowRadius: 6, marginBottom: 9 },
  priceBanner: { width: 393, height: 287, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  priceBannerRays: { position: 'absolute', left: -83.8375, top: -136.8375 },
  priceBannerText: { position: 'absolute', left: 40.281, top: 60.5, width: 312.438, height: 164, alignItems: 'center' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2.394, height: 78, width: 312.438, zIndex: 1 },
  priceLeadCol: { minWidth: 128.088, height: 64, alignItems: 'center', justifyContent: 'center' },
  priceLead: {
    minWidth: 128.088,
    height: 43.1,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 28.73,
    lineHeight: 43.1,
    textAlign: 'center',
    letterSpacing: -0.5746,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.25)',
    textShadowOffset: { width: 0, height: 4.788 },
    textShadowRadius: 7.182,
    includeFontPadding: false,
  },
  priceLeadTop: { marginBottom: -11.971 },
  // Figma: 62/78, weight 680 (700Bold), gold #FAC64C, soft shadow.
  priceAmount: {
    minWidth: 127,
    maxWidth: 168,
    height: 78,
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 62.248,
    lineHeight: 78,
    textAlign: 'center',
    letterSpacing: -1.245,
    color: '#FAC64C',
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 3.831 },
    textShadowRadius: 3.831,
    includeFontPadding: false,
  },
  priceCarShadow: { position: 'absolute', top: 188.39, left: 51.65, width: 290, height: 36, zIndex: 2 },
  priceCars: { position: 'absolute', top: 120.5, left: 10.5, width: 372, height: 124, zIndex: 3 },
  headlineBlock: { alignItems: 'center', marginTop: 12 },
  // Figma: the promises start 117 below the headline block's top, i.e. 12 up into its 128.95 height.
  subRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: -12, paddingVertical: 4, paddingHorizontal: 8, minHeight: 25, alignSelf: 'stretch' },
  subDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#FFFFFF' },
  // The design's three promises: Semibold/xs in Neutral/50 (#F9F9FB), 6px apart.
  sub: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5, color: '#F9F9FB', flexShrink: 1 },
  // Figma: 36×4 track rgba(234,236,241,0.4) with a 12×4 Primary/blue-50 thumb.
  pager: { alignSelf: 'center', width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(234,236,241,0.4)', marginTop: 9, marginBottom: 10 },
  thumb: { position: 'absolute', top: 0, width: 18, height: 4, borderRadius: 20, backgroundColor: '#EAECF1' },

  // Hero dynamic offer slides
  imageSlideCard: {
    height: 148,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#262F57',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#1E2547',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageSlidePhoto: {
    ...StyleSheet.absoluteFill,
    width: '100%',
    height: '100%',
  },
  bannerCodePill: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  bannerCodeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 10,
    lineHeight: 14,
    color: '#323E71',
    letterSpacing: 0.5,
  },
  bannerDiscountBadge: {
    position: 'absolute',
    top: 10,
    left: 12,
    backgroundColor: '#FFE600',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  bannerDiscountText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 11,
    lineHeight: 14,
    color: '#1E2547',
    textTransform: 'uppercase',
  },
  comboSlideCard: {
    height: 148,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#262F57',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#1E2547',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    marginVertical: 4,
  },
  comboContent: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  comboSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: -16,
    paddingVertical: 4,
    paddingHorizontal: 8,
    minHeight: 25,
    alignSelf: 'stretch',
  },
  comboCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    marginTop: 6,
  },
  comboCodeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontSize: 9.5,
    lineHeight: 13,
    color: '#FFE600',
    letterSpacing: 0.4,
  },
  comboCopyHint: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 8.5,
    lineHeight: 12,
    color: '#FFFFFF',
    opacity: 0.85,
  },
  textSlideWrap: {
    alignItems: 'center',
  },
  textCodeRow: {
    alignItems: 'center',
    marginTop: 6,
  },
  textCodePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  textCodeText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    color: '#FFFFFF',
  },

  // Refer
  refer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 31, paddingLeft: 8, paddingRight: 8, paddingTop: 8, paddingBottom: 24, borderWidth: 1, borderBottomWidth: 0, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  // Figma: 40px circle (Neutral/50) around a 24px icon; title and the "Refer" pill share a row, the sub line sits under them.
  referIconWrap: { width: 40, height: 40, borderRadius: 40, alignItems: 'center', justifyContent: 'center' },
  referIcon: { width: 24, height: 24 },
  referTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  referTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20, flexShrink: 1 },
  referSub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5 },
  referBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, height: 20, paddingHorizontal: 8, borderRadius: 31 },
  referBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, lineHeight: 12, color: '#FFFFFF' },

  // Search
  // Figma: 361px card, 6 padding, 8 between the tabs and the destination box, shadow 0 2 15 4 rgba(47,62,117,.08).
  searchCard: { marginHorizontal: 16, padding: 6, borderWidth: 1, borderRadius: 16, shadowColor: '#2F3E75', shadowOpacity: 0.08, shadowRadius: 15, shadowOffset: { width: 0, height: 2 }, elevation: 3 },
  // Figma: 56 high frame, 4 padding, 12 gap, 1px #E7EAF4 border, 12 radius, 20%-opaque fill; the tabs fill what is left inside.
  tabs: { flexDirection: 'row', gap: 12, height: 56, padding: 4, borderWidth: 1, borderColor: '#E7EAF4', borderRadius: 12, backgroundColor: 'rgba(244,246,250,0.2)' },
  tab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, borderRadius: 10, borderWidth: 1, borderColor: 'transparent' },
  // Selected tab (design): #F9F9FB fill, soft lavender-grey border.
  tabOn: { backgroundColor: '#F9F9FB', borderColor: '#C4C6DC' },
  tabText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 26 },
  // Design: two rows (destination, dates), 49 high, 10 apart, 2px lavender border, radius 12, 12 padding, 9 gap.
  destBox: {
    marginTop: 10,
    width: '100%',
    height: 49,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 12,
    borderWidth: 2,
    paddingHorizontal: 12,
  },
  destIcon: { width: 20, height: 20 },
  destText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, lineHeight: 22.5 },

  catWrap: { paddingHorizontal: 16, paddingVertical: 8, gap: 10 },
  catTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5 },
  catRow: { flexDirection: 'row', gap: 9 },
  catItem: { flex: 1, alignItems: 'center', gap: 5 },
  catTile: { alignSelf: 'stretch', height: 68, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  catLabel: { alignSelf: 'stretch', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, lineHeight: 16, textAlign: 'center' },
  // Figma sections each pad 8 top and bottom, so blocks sit 16 apart; title to content is 12.
  sectionTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5 },
  sectionTitleInset: { marginBottom: 8, paddingHorizontal: 16 },
  panelSectionTitle: { marginBottom: 6 },

  tripCard: { width: 246, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12 },
  tripWhere: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },
  tripWhen: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16 },
  tripLine: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  // Recent car search: "View Details ›" when free for the searched dates.
  tripStatus: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 4 },
  tripViewDetails: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5, textDecorationLine: 'underline' },

  // Top picks
  pick: { width: 246, borderWidth: 1, borderRadius: 12, padding: 2, overflow: 'hidden' },
  // Figma: 240×144 photo, radius 8, 4px inset for the tag (top) and the dots (bottom).
  pickImageWrap: { height: 144, borderWidth: 1, borderRadius: 8, overflow: 'hidden' },
  pickTag: { position: 'absolute', top: 4, left: 4, height: 20, justifyContent: 'center', paddingHorizontal: 8, borderRadius: 20 },
  pickTagText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 9, lineHeight: 14, color: '#FFFFFF' },
  // 4 below the photo, then 6 between the title row and the price row (Figma gaps).
  pickBody: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 6 },
  pickTitleRow: { flexDirection: 'row', alignItems: 'center', height: 37 },
  pickName: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 19.5 },
  pickMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pickMetaDot: { width: 3, height: 3, borderRadius: 1.5 },
  pickMeta: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, flexShrink: 1 },
  ratingPill: { flexDirection: 'row', alignItems: 'center', paddingTop: 1, paddingRight: 4, paddingBottom: 2, paddingLeft: 5, height: 20, borderRadius: 20 },
  ratingText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5, color: '#FFFFFF' },
  pickPriceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: 4, marginHorizontal: -4, marginTop: 6 },
  // Figma trims both prices to cap height (leading-trim: cap), so their bottoms are the baseline.
  pickPrices: { flexDirection: 'row', alignItems: 'flex-end', gap: 2 },
  // Cap-height trim from Plus Jakarta Sans metrics (ascent 1.038em, descent 0.222em, cap 0.745em): 22.5 box → 11.2.
  pickPerDay: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, marginBottom: -4, includeFontPadding: false },
  pickPrice: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5, marginTop: -6.2, marginBottom: -5.1, includeFontPadding: false },
  pickStrike: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 14, marginTop: -3.3, marginBottom: -2.5, includeFontPadding: false },
  pickStrikeLine: { position: 'absolute', left: -1, right: -2, top: '50%', marginTop: -0.5, height: 1 },
  pickAvail: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 9, lineHeight: 14, letterSpacing: 0.18, flexShrink: 1 },

  // Milestone
  milestone: { marginHorizontal: 16, marginTop: 0, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8 },
  // The logo's artwork fills 360 × 316 of its 470 × 480 file; this shows that part at 32 × 27.
  milestoneLogo: { position: 'absolute', top: 11.5, right: 2, width: 42, height: 40, opacity: 0.32 },
  milestoneTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5 },
  milestoneSub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, marginTop: 3, marginRight: 40 },
  // The marks' centres sit 8 in from each edge, so the rail runs between them.
  track: { height: 16, marginTop: 12, justifyContent: 'center' },
  trackRail: { position: 'absolute', left: 0, right: 0, height: 6, borderRadius: 3, overflow: 'hidden' },
  trackLine: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 },
  // Figma "Highlighted number": 16 circle, 0.6 border #6152D8 32%, glow #6152D8 21% (2 blur, 1 spread).
  mark: { position: 'absolute', width: 16, height: 16, marginLeft: -8, borderRadius: 8, borderWidth: 0.6, alignItems: 'center', justifyContent: 'center', shadowColor: '#6152D8', shadowOpacity: 0.21, shadowRadius: 3, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  markText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 7.5, lineHeight: 10, includeFontPadding: false },
  // Figma: a 16px mark like the others, gold-tinted (rgba(251,188,4,.1) over white) with a soft gold glow, holding the 12px star coin.
  coin: { position: 'absolute', width: 16, height: 16, marginLeft: -8, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FEF8E5', shadowColor: '#FBBC04', shadowOpacity: 0.28, shadowRadius: 2, shadowOffset: { width: 0, height: 0 }, elevation: 2 },
  coinImage: { width: 12, height: 12 },
  milestoneFoot: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  milestoneCount: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5 },
  milestoneRight: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5 },

  // Destinations
  destTile: { width: 216, height: 144, borderRadius: 12, overflow: 'hidden', justifyContent: 'flex-end' },
  destTileBody: { padding: 12 },
  destTileTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5, color: '#FFFFFF' },
  destTileBlurb: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 16.5, color: '#FAFAFA' },

  // Benefits
  benefits: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, columnGap: 12, rowGap: 10 },
  // Two equal columns 12 apart: both start at 40% and grow into the rest of the row.
  benefit: { flexBasis: '40%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  benefitCircle: { width: 28, height: 28, borderRadius: 40, overflow: 'hidden', backgroundColor: 'rgba(234, 236, 241, 0.4)', alignItems: 'center', justifyContent: 'center' },
  benefitTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5 },
  benefitSub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5 },

  // Membership
  // Figma: 361x65 card, 10/8 padding, 12 gap; width follows the screen (16 side margins), height grows with the text.
  member: { marginHorizontal: 16, minHeight: 65, borderWidth: 1, borderRadius: 12, paddingVertical: 10, paddingHorizontal: 8, gap: 3, justifyContent: 'center', alignItems: 'stretch' },
  memberHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 3 },
  memberTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5, flexShrink: 1 },
  memberBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, height: 22, paddingHorizontal: 10, borderRadius: 31 },
  memberBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, lineHeight: 12, color: '#FFFFFF' },
  rate: { marginHorizontal: 16, marginTop: 16, flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 14, borderWidth: 1, borderRadius: 16 },
  rateBadge: { width: 46, height: 46, borderRadius: 23, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  rateTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, lineHeight: 22.5 },
  rateLine: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: 2 },
  rateSub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 18, marginTop: 2 },
  rateBtn: { flexDirection: 'row', alignItems: 'center', gap: 3, minHeight: 26, paddingHorizontal: 10, borderRadius: 13 },
  rateBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 10, lineHeight: 15, color: '#FFFFFF' },
  memberSub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5 },

  // Connect
  connect: { flexDirection: 'row', alignItems: 'stretch', gap: 12, marginHorizontal: 16, minHeight: 77, borderWidth: 1, borderRadius: 12, paddingTop: 12, paddingHorizontal: 12, paddingBottom: 16 },
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

  // Section Promo Banners (Middle & Bottom positions)
  promoBannerContainer: { paddingHorizontal: 16, alignItems: 'center', gap: 8 },
  promoBannerCard: { height: 160, borderRadius: 12, overflow: 'hidden', backgroundColor: '#1E293B', position: 'relative' },
  promoBannerPhoto: { width: '100%', height: '100%' },
  promoBannerContent: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12, justifyContent: 'flex-end' },
  promoBannerBadge: { alignSelf: 'flex-start', backgroundColor: '#FFE600', paddingHorizontal: 8, minHeight: 20, justifyContent: 'center', borderRadius: 20, marginBottom: 6 },
  promoBannerBadgeText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 9, lineHeight: 12, color: '#1E2547' },
  promoBannerTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22.5, color: '#FFFFFF' },
  promoBannerSubtitle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, color: 'rgba(255, 255, 255, 0.85)' },
  promoBannerCtaBtn: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginTop: 8, backgroundColor: '#323E71', paddingHorizontal: 12, minHeight: 28, borderRadius: 20 },
  promoBannerCtaText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16, color: '#FFFFFF' },
  bannerCtaPill: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(50, 62, 113, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  bannerCtaPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});