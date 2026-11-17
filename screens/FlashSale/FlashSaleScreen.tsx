import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
// Entrance animations each time the page opens (Reanimated honours the phone's Reduce Motion setting).
import Reanimated, { FadeInDown, FadeInUp, ZoomIn } from 'react-native-reanimated';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import Svg, { Ellipse, Path } from 'react-native-svg';
import { Feather } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { safeBack } from '@/utils/navigation';
import {
  ExclusiveOffer,
  exclusiveOffersQueryOptions,
  nextFlashSaleQueryOptions,
  recordOfferView,
  isOfferLive,
  claimExclusiveOffer,
} from '@/services/api/offers';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { formatTime12, getIndiaDateParts, getAvailability } from '@/utils/sawari';
import { FlashSaleHeroTitle } from '@/components/home/FlashSaleHeroTitle';
import { FlashSaleScheduledHeader, SCHEDULED_HEADER_VIEW } from '@/components/home/FlashSaleScheduledHeader';
import { FlashSaleSwipeCoach, hasSeenSwipeCoach, markSwipeCoachSeen } from '@/components/home/FlashSaleSwipeCoach';
import { formatCurrency, MYSAWARI_HUB_NAME } from '@/services/backend/pricingEngine';
import { BACKEND_URL } from '@/services/backend/api';
import * as Haptics from '@/utils/haptics';
import { LoginBottomSheet } from '@/components';
import FsTitle from '@/assets/images/flash_sale/fs_title.svg';
import FsTitleGlow from '@/assets/images/flash_sale/fs_title_glow.svg';
import FsRatingStar from '@/assets/images/flash_sale/fs_rating_star.svg';
import FsChevron from '@/assets/images/flash_sale/fs_chevron.svg';
import FsDash from '@/assets/images/flash_sale/fs_dash.svg';
import FsLock from '@/assets/images/flash_sale/fs_lock.svg';
import FsCrown from '@/assets/images/flash_sale/fs_crown.svg';
import FsStar from '@/assets/images/flash_sale/fs_star.svg';
import FsStarGlow from '@/assets/images/flash_sale/fs_star_glow.svg';
import FsStarSmall from '@/assets/images/flash_sale/fs_star_small.svg';
import FsStarSmallGlow from '@/assets/images/flash_sale/fs_star_small_glow.svg';
import { CustomAlert } from '@/components/common/CustomAlert';
import { ExclusiveOffersSection } from '@/components/home/ExclusiveOffersSection';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BG = '#3E2DC8';
const FONT = 'PlusJakartaSans_700Bold';
const FONT_SEMI = 'PlusJakartaSans_600SemiBold';
const FONT_MED = 'PlusJakartaSans_500Medium';
const GOLD = '#FBC422';
const GOLD_AMBER = '#F5BD47';
const STAR_PATH = 'M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z';
const WEEKDAYS = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];


/**
 * Gold crown (Figma Vector): #FBC422 with a 1.2px black outline and a 1px black hard shadow, rotated −24.98°.
 */
function PillCrown({ left = 17.48, top = -12 }: { left?: number; top?: number } = {}) {
  return (
    <View style={{ position: 'absolute', left, top, width: 20.028, height: 17.606, alignItems: 'center', justifyContent: 'center' }} pointerEvents="none">
      <View style={{ width: 16.663, height: 11.66, transform: [{ rotate: '-24.98deg' }] }}>
        <FsCrown width={20.0633} height={15.0599} style={{ position: 'absolute', left: -16.663 * 0.072, top: -11.66 * 0.1029 }} />
      </View>
    </View>
  );
}

/**
 * The ticket (Figma "Union" 353 × 361, radius 16, minus two 28-wide circles centred on its side edges at y 239.3):
 * the bites are real cut-outs, so the page shows through and the outline follows them.
 */
const TICKET_W = 353;
const TICKET_H = 361;
const BITE_R = 14;
const BITE_Y = 225.38 + 13.96;
const TICKET_PATH = [
  'M16.5 0.5', `H${TICKET_W - 16.5}`, `A16 16 0 0 1 ${TICKET_W - 0.5} 16.5`,
  `V${BITE_Y - BITE_R}`, `A${BITE_R} ${BITE_R} 0 0 0 ${TICKET_W - 0.5} ${BITE_Y + BITE_R}`,
  `V${TICKET_H - 16.5}`, `A16 16 0 0 1 ${TICKET_W - 16.5} ${TICKET_H - 0.5}`,
  'H16.5', `A16 16 0 0 1 0.5 ${TICKET_H - 16.5}`,
  `V${BITE_Y + BITE_R}`, `A${BITE_R} ${BITE_R} 0 0 0 0.5 ${BITE_Y - BITE_R}`,
  'V16.5', 'A16 16 0 0 1 16.5 0.5', 'Z',
].join(' ');
function TicketShape({ fill = 'none', stroke }: { fill?: string; stroke?: string }) {
  return (
    <Svg width={TICKET_W} height={TICKET_H} style={StyleSheet.absoluteFill} pointerEvents="none">
      <Path d={TICKET_PATH} fill={fill} stroke={stroke} strokeWidth={stroke ? 1 : 0} />
    </Svg>
  );
}

/**
 * The trip a deal books: its own dates if the Operation App set them, else its number of days from today, else
 * today → tomorrow; times from the offer. Used to fill the booking and to tell whether a car is free for it.
 */
function offerTrip(offer: any) {
  const label = (d: Date) => `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
  const today = new Date();
  const overnight = Boolean(offer?.isOvernight || (offer?.pickupTime?.includes('PM') && offer?.returnTime?.includes('AM')));
  const pickupT = offer?.rentalStartTime || offer?.pickupTime || (overnight ? '08:00 PM' : '08:00 AM');
  const returnT = offer?.rentalEndTime || offer?.returnTime || '08:00 AM';
  let start = today, end: Date, days: number;
  if (offer?.rentalStartDate && offer?.rentalEndDate) {
    start = new Date(offer.rentalStartDate);
    end = new Date(offer.rentalEndDate);
    days = offer.rentalDays || Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000));
  } else {
    days = Math.max(1, Number(offer?.rentalDays) || 1);
    end = new Date(today.getTime() + days * 86400000);
  }
  return { startLabel: label(start), endLabel: label(end), days, pickupT, returnT };
}

function indiaDayOrdinal(ms: number): number {
  const p = getIndiaDateParts(ms);
  return Date.UTC(p.year, p.month, p.date) / 86400000;
}

/** Arc slots (Figma Frame 2147226241, 312 wide): offset from the shown car → place, size and white ring strength. */
const ARC_SLOTS = [
  { offset: 0, left: 130, top: 12, size: 52, ring: '#FFFFFF' },
  { offset: 1, left: 208, top: 20, size: 44, ring: 'rgba(255,255,255,0.9)' },
  { offset: -1, left: 60, top: 20, size: 44, ring: 'rgba(255,255,255,0.9)' },
  { offset: 2, left: 272, top: 35, size: 40, ring: 'rgba(255,255,255,0.8)' },
  { offset: -2, left: 0, top: 35, size: 40, ring: 'rgba(255,255,255,0.8)' },
];

/** Gold sparkle at a ticket corner (Figma Star 8/14 big, Star 9/11 small): the star and its blurred glow. */
function Sparkle({ size, left, top }: { size: number; left: number; top: number }) {
  const big = size > 10;
  const box = big ? 13.867 : 6.934;
  const Star = big ? FsStar : FsStarSmall;
  const Glow = big ? FsStarGlow : FsStarSmallGlow;
  const star = big ? 15.2802 : 9.70707;
  const glow = big ? 55.469 : 10.466;
  return (
    <View style={{ position: 'absolute', left, top, width: box, height: box }} pointerEvents="none">
      <Glow width={glow} height={glow} style={{ position: 'absolute', left: (box - glow) / 2, top: (box - glow) / 2 }} />
      <Star width={star} height={star} style={{ position: 'absolute', left: (box - star) / 2, top: (box - star) / 2 }} />
    </View>
  );
}

/** Live ticking countdown timer box in top header (Images 6 & 7) */
function LiveCountdownHeader({ expiryMs, scale = 1 }: { expiryMs: number; scale?: number }) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const diffMs = Math.max(0, expiryMs - now);
  const totalSecs = Math.floor(diffMs / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <View style={[styles.liveHeaderWrap, scale < 1 && { transform: [{ scale }], marginBottom: -92.42 * (1 - scale) }]}>
      {/* Ellipse 13 glow (154 × 70 at 18, 10; exported with its blur, so it spills 118.7 each way) behind the title */}
      <FsTitleGlow width={391.449} height={307.449} style={{ position: 'absolute', left: 18 - 118.72, top: 10 - 118.72 }} pointerEvents="none" />
      {/* Frame 2147226232: the bolt + FLASH / SALE lettering, exported from Figma (172.87 × 92.42) */}
      <FsTitle width={174.073} height={92.4218} style={{ marginLeft: -1.2 }} />

      {/* Right: ENDS IN + 3 white square boxes */}
      <View style={styles.liveTimerCol}>
        <Text style={styles.endsInLabel}>ENDS IN</Text>
        <View style={styles.timerRow}>
          <View style={styles.timerUnit}>
            <View style={styles.timerBox}>
              <Text style={styles.timerNum}>{pad(hrs)}</Text>
            </View>
            <Text style={styles.timerUnitText}>Hrs</Text>
          </View>
          <View style={styles.timerUnit}>
            <View style={styles.timerBox}>
              <Text style={styles.timerNum}>{pad(mins)}</Text>
            </View>
            <Text style={styles.timerUnitText}>Min</Text>
          </View>
          <View style={styles.timerUnit}>
            <View style={styles.timerBox}>
              <Text style={styles.timerNum}>{pad(secs)}</Text>
            </View>
            <Text style={styles.timerUnitText}>Sec</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function FlashSaleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const { membership, selectCar, isAuthenticated, applyCoupon, setDates, setTimes, pickup, dropoff, setPickup, setDropoff } = useSawari();

  // Every phone: the layout is Figma's 393 × 852 frame. On narrower or shorter phones the fixed-size blocks shrink to
  // fit (never grow): the header and Coming Soon block to the width, the ticket to the width and to the room left
  // between the header and the photo row, centred in that room (on a 393 × 852 phone that is the Figma spot).
  const fitW = Math.min(1, (windowWidth - 24) / 361);
  const headerBottom = insets.top + 44 - 17 + 92.42 * fitW;
  const arcTop = windowHeight - 16 - Math.max(0, 75 - insets.bottom) - 86;
  const ticketScale = Math.max(0.6, Math.min(fitW, (arcTop - headerBottom - 16) / 417));
  const ticketTop = (headerBottom + arcTop) / 2 - 208.5 - (insets.top + 44);
  const { data: fleetVehicles = [] } = useVehicles();

  // Queries
  // Real time: every time the page opens it asks the server again and waits for that answer, instead of first showing
  // the offers remembered from earlier (an ended sale used to flash its car, then switch to "Coming Soon"). It then
  // refreshes every 20 s, and an offer is dropped the moment its end time passes, without waiting for a refresh.
  const { data: rawOffers = [], isFetchedAfterMount: offersFresh, isError: offersFailed, dataUpdatedAt: offersAt } = useQuery({ ...exclusiveOffersQueryOptions, refetchOnMount: 'always' });
  // A list fetched in the last minute (Home already loaded it) is shown at once; an older one waits for the server.
  const offersReady = offersFresh || offersFailed || (offersAt > 0 && Date.now() - offersAt < 60 * 1000);
  const offers = rawOffers.filter((o: any) => isOfferLive(o, Date.now(), true));
  const liveOffer = offersReady ? offers[0] || null : null;
  const isLive = Boolean(liveOffer);

  // Asked at the same time as the offers (not after them), so the two waits don't add up.
  const { data: nextSale, isFetchedAfterMount: nextFresh, isError: nextFailed, dataUpdatedAt: nextAt } = useQuery({
    ...nextFlashSaleQueryOptions,
    refetchOnMount: 'always',
  });
  const nextReady = nextFresh || nextFailed || (nextAt > 0 && Date.now() - nextAt < 60 * 1000);
  // Nothing is decided until the server has answered (both questions when there is no live sale).
  const ready = offersReady && (isLive || nextReady);

  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const scheduledStartsMs = nextSale?.startsAt ? new Date(nextSale.startsAt).getTime() : 0;
  const isScheduled = ready && !isLive && scheduledStartsMs > nowMs;
  const isComingSoon = ready && !isLive && !isScheduled;

  // Membership status
  const userTier = (membership?.plan || '').toLowerCase().trim();
  const isMember = Boolean(
    userTier &&
    userTier !== 'none' &&
    (!membership?.expiresAt || new Date(membership.expiresAt).getTime() > Date.now())
  );

  // Early access window state
  const earlyAccessMinutes = isLive
    ? (liveOffer?.earlyAccessHours ? Math.round(liveOffer.earlyAccessHours * 60) : 10)
    : (nextSale?.earlyAccessMinutes || 10);

  const earlyAccessEndsMs = useMemo(() => {
    if (isLive && liveOffer?.earlyAccessEndsAt) {
      return new Date(liveOffer.earlyAccessEndsAt).getTime();
    }
    return 0;
  }, [isLive, liveOffer]);

  const isEarlyAccessActive = isLive && (
    Boolean(offers.some((o: any) => o.isEarlyAccessLocked)) ||
    Boolean(offers.some((o: any) => o.isEarlyAccessUnlocked)) ||
    (earlyAccessEndsMs > nowMs)
  );

  const todayOrdinal = indiaDayOrdinal(nowMs);
  const saleOrdinal = scheduledStartsMs ? indiaDayOrdinal(scheduledStartsMs) : 0;
  const todayWeekday = new Date(todayOrdinal * 86400000).getUTCDay();
  const saleWeekday = saleOrdinal ? new Date(saleOrdinal * 86400000).getUTCDay() : -1;
  const isSaturdayPreview = isScheduled && todayWeekday === 6 && saleWeekday === 0 && saleOrdinal - todayOrdinal === 1;
  const isSundayNonMemberPreview = isScheduled && !isMember && todayWeekday === 0 && saleOrdinal === todayOrdinal;
  const isScheduledPreview = isSaturdayPreview || isSundayNonMemberPreview;

  // Only show vehicles supplied by the live or upcoming offer; never invent vehicle data for a preview.
  const displayCars = useMemo(() => {
    const list: any[] = [];
    const asId = (v: any) => (v && typeof v === 'object' ? String(v._id ?? v.id ?? '') : String(v ?? ''));
    const add = (offer: any, ref: any, dealPrice?: number, originalPrice?: number, vp?: any) => {
      const id = asId(ref);
      if (!id || list.some((c) => String(c.id) === id)) return;
      const fleet: any = fleetVehicles.find((fv: any) => String(fv.id ?? fv._id) === id);
      const car: any = fleet || (ref && typeof ref === 'object' ? { ...ref, id } : null);
      if (!car) return;
      // Booked: this car's deal stock is used up, or the car is already taken for the deal's dates.
      const trip = offerTrip(offer);
      const soldOut = Boolean(vp?.stockLimit != null && Number(vp.soldCount) >= Number(vp.stockLimit));
      const taken = fleet ? !getAvailability(fleet, trip.startLabel, trip.endLabel, trip.pickupT, trip.returnT).available : false;
      list.push({
        ...car,
        id,
        offer,
        booked: soldOut || taken,
        dealPrice: dealPrice ?? offer?.promotionalPrice ?? offer?.dealPrice ?? null,
        originalPrice: originalPrice ?? offer?.originalPrice ?? null,
      });
    };
    if (isLive) {
      for (const offer of offers as any[]) {
        (offer.vehiclePrices || []).forEach((vp: any) => add(offer, vp.vehicleId, vp.dealPrice, vp.originalPrice, vp));
        (offer.applicableVehicleIds || []).forEach((v: any) => add(offer, v));
        if (offer.vehicleId) add(offer, offer.vehicleId);
      }
      // Free cars first, booked ones after (still shown, locked).
      list.sort((a, b) => Number(!!a.booked) - Number(!!b.booked));
    } else if (isScheduled) {
      const offer = nextSale?.offer;
      if (offer) {
        (offer.vehiclePrices || []).forEach((vp: any) => add(offer, vp.vehicleId, vp.dealPrice, vp.originalPrice, vp));
        (offer.applicableVehicleIds || []).forEach((v: any) => add(offer, v));
        if (offer.vehicleId) add(offer, offer.vehicleId);
      }
      if (!list.length) {
        (nextSale?.images || []).forEach((url, i) => list.push({ id: `hidden-${i}`, images: [{ url }] }));
      }
    }
    return list;
  }, [offers, isLive, isScheduled, nextSale, fleetVehicles]);

  const [selectedCarIndex, setSelectedCarIndex] = useState(0);
  const slideX = useRef(new Animated.Value(0)).current; // the ticket's sideways slide while swiping between cars
  const activeCar: any = displayCars[selectedCarIndex] || displayCars[0] || {};
  const activeOffer: any = activeCar.offer || liveOffer || (isScheduled ? nextSale?.offer : null) || null;

  // Can the customer book this car now? (its own offer's early-access lock and members-only rule)
  const canBook = isLive && !activeCar.booked && !activeOffer?.isEarlyAccessLocked && (activeOffer?.isEligible !== false || isMember);

  // Scheduled preview days show the offer under the membership frost; other upcoming sales stay fully locked.
  const membersOnlyNow = (
    (isLive && !isMember && Boolean(activeOffer?.isEarlyAccessLocked || activeOffer?.isEligible === false)) ||
    (isScheduledPreview && !isMember)
  );
  const ticketLocked = isScheduled && !isScheduledPreview;
  // When it opens to everyone: the scheduled start, or (live, members' window) the early-access end.
  const opensMs = isScheduled
    ? scheduledStartsMs
    : (activeOffer?.earlyAccessEndsAt ? new Date(activeOffer.earlyAccessEndsAt).getTime() : earlyAccessEndsMs);
  // Before the sale: the scheduled header. Once a sale is live (members' window included): the live countdown.
  const showScheduledHeader = isScheduled;
  // A sale is planned but has no cars to show yet → the big "SCHEDULE ON <day>" lettering instead of a ticket.
  const showScheduleHero = isScheduled && displayCars.length === 0;

  // One-time swipe hint (Figma 1717:15289) over the first ticket that has more than one car to swipe through.
  const [coachVisible, setCoachVisible] = useState(false);
  const coachEligible = ready && !showScheduleHero && !isComingSoon && displayCars.length > 1;
  useEffect(() => {
    if (!coachEligible) return;
    let alive = true;
    hasSeenSwipeCoach().then((seen) => { if (alive && !seen) setCoachVisible(true); });
    return () => { alive = false; };
  }, [coachEligible]);
  const dismissCoach = useCallback(() => { setCoachVisible(false); markSwipeCoachSeen(); }, []);
  // Swiping (or tapping another car) is the hint done.
  useEffect(() => { if (selectedCarIndex !== 0 && coachVisible) dismissCoach(); }, [selectedCarIndex, coachVisible, dismissCoach]);

  // The car's own photo as an image source. The fleet gives full links, or the app's built-in picture of that model
  // when the car has no uploaded photo; a car straight from the offer gives {url} objects, maybe server-relative.
  const getCarImage = useCallback((car: any, _idx = 0): any => {
    const pick = (v: any): any => {
      if (!v) return null;
      if (typeof v === 'number') return v; // bundled picture (require)
      if (typeof v === 'string') {
        if (/^https?:\/\//.test(v)) return { uri: v };
        if (v.startsWith('/')) return { uri: `${BACKEND_URL.replace(/\/api$/, '')}${v}` };
        return null;
      }
      if (typeof v === 'object') return pick(v.uri ?? v.url ?? null);
      return null;
    };
    const fleet: any = fleetVehicles.find((fv: any) => String(fv.id ?? fv._id) === String(car?.id));
    return pick(car?.images?.[0]) ?? pick(car?.image) ?? pick(fleet?.images?.[0]) ?? pick(fleet?.image) ?? null;
  }, [fleetVehicles]);

  // The car's real name, as the dashboard has it.
  const carDisplayName = (activeCar.displayName || activeCar.vehicleName || activeCar.name || '').trim() || 'Vehicle';

  // The offer's rental length only ("1 Day", "3 Days"; hours for a shorter deal) — never its dates and times
  // (rentalPeriodLabel is "15 Nov 2026, 09:00 AM → 16 Nov 2026, 09:00 AM (1 Day (24h))").
  const durationLabel: string | null =
    (activeOffer?.rentalDays ? `${activeOffer.rentalDays} ${activeOffer.rentalDays === 1 ? 'Day' : 'Days'}` : null)
    || (activeOffer?.rentalHours ? `${activeOffer.rentalHours} Hours` : null);

  // The offer's real prices only (no estimates).
  const dealPrice: number | null = activeCar.dealPrice ?? null;
  const originalPrice: number | null = activeCar.originalPrice ?? null;

  // Swiping card gesture
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        // Take a clearly sideways drag before the buttons inside the ticket do, so the swipe always works.
        onMoveShouldSetPanResponderCapture: (_, g) => displayCars.length > 1 && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onMoveShouldSetPanResponder: (_, g) => displayCars.length > 1 && Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
        onPanResponderTerminationRequest: () => false,
        onPanResponderMove: (_, g) => slideX.setValue(g.dx),
        onPanResponderRelease: (_, g) => {
          const dir = g.dx < -60 || g.vx < -0.5 ? 1 : g.dx > 60 || g.vx > 0.5 ? -1 : 0;
          if (!dir) {
            Animated.spring(slideX, { toValue: 0, useNativeDriver: true, friction: 7 }).start();
            return;
          }
          Haptics.selectionAsync();
          // Slide out, swap the car, bring the next one in from the other side.
          Animated.timing(slideX, { toValue: -dir * windowWidth, duration: 160, useNativeDriver: true }).start(() => {
            setSelectedCarIndex((prev) => (prev + dir + displayCars.length) % displayCars.length);
            slideX.setValue(dir * windowWidth);
            Animated.spring(slideX, { toValue: 0, useNativeDriver: true, friction: 8 }).start();
          });
        },
        onPanResponderTerminate: () => Animated.spring(slideX, { toValue: 0, useNativeDriver: true }).start(),
      }),
    [displayCars.length, windowWidth, slideX]
  );

  // Book Now: claim the deal on the server (it hands back this customer's coupon, priced and held by the server), apply
  // that coupon, fill in the offer's dates and times, and open the car's page. The dates are locked unless the
  // offer is set to flexible in the Operation App.
  const [showLogin, setShowLogin] = useState(false);
  const [booking, setBooking] = useState(false);
  const handleBookNow = useCallback(async (justLoggedIn = false) => {
    if (booking || !activeOffer || !activeCar?.id || String(activeCar.id).startsWith('hidden-')) return;
    Haptics.selectionAsync();
    if (!isAuthenticated && !justLoggedIn) { setShowLogin(true); return; }
    if (activeCar.booked) return;
    if (!canBook) { router.push('/membership'); return; }

    setBooking(true);
    try {
      const offerId = String(activeOffer._id || activeOffer.id);
      recordOfferView(offerId);
      let code: string | undefined = activeOffer.activeClaim?.couponCode;
      if (!code) {
        const res = await claimExclusiveOffer(offerId);
        code = res.claim?.couponCode || res.claim?.claimToken;
        if (!res.success || !code) {
          CustomAlert.alert('Couldn’t book this deal', res.message || 'This offer couldn’t be claimed right now. Please try again.');
          return;
        }
      }

      const car = fleetVehicles.find((fv: any) => String(fv.id ?? fv._id) === String(activeCar.id)) || activeCar;
      selectCar(car);
      applyCoupon(code);

      const trip = offerTrip(activeOffer);
      setDates(`${trip.startLabel} – ${trip.endLabel}`, `${trip.days} ${trip.days === 1 ? 'Day' : 'Days'}`);
      setTimes(trip.pickupT, trip.returnT);
      if (!pickup?.name) setPickup({ id: 'hub_pickup', name: MYSAWARI_HUB_NAME, address: 'MySawari Hub, Kahilipara', latitude: 26.1412, longitude: 91.7645, source: 'database' });
      if (!dropoff?.name) setDropoff({ id: 'city_trip', name: 'Local City Trip', address: 'City limits / Self-drive destination', latitude: 26.1412, longitude: 91.7645, source: 'database' });

      const carId = String(car.id ?? car._id);
      const flexible = activeOffer.rentalPeriodMode === 'flexible';
      router.push({
        pathname: '/car-details',
        params: { id: carId, vehicleId: carId, allowExtend: 'true', ...(flexible ? {} : { lockDates: 'true', isFixedDates: 'true' }) },
      });
    } finally {
      setBooking(false);
    }
  }, [booking, activeOffer, activeCar, isAuthenticated, canBook, router, fleetVehicles, selectCar, applyCoupon, setDates, setTimes, pickup, dropoff, setPickup, setDropoff]);

  // View details action
  const handleViewDetails = useCallback(() => {
    Haptics.selectionAsync();
    const car = fleetVehicles.find((fv: any) => String(fv.id || fv._id) === String(activeCar.id || activeCar._id)) || activeCar;
    if (!car || String(car.id).startsWith('hidden-')) return;
    selectCar(car);
    // The deal's trip, so the car page shows its dates and price (and "Need more time?" to add days).
    if (activeOffer) {
      const trip = offerTrip(activeOffer);
      setDates(`${trip.startLabel} – ${trip.endLabel}`, `${trip.days} ${trip.days === 1 ? 'Day' : 'Days'}`);
      setTimes(trip.pickupT, trip.returnT);
    }
    router.push({ pathname: '/car-details', params: { id: String(car.id || car._id), allowExtend: 'true' } });
  }, [activeCar, activeOffer, fleetVehicles, router, selectCar, setDates, setTimes]);

  // Schedule text calculations
  const scheduleInfo = useMemo(() => {
    const timeMs = opensMs || scheduledStartsMs;
    if (!timeMs) return { weekday: 'SUNDAY', weekdayTitle: 'Sunday', timeStr: '8 AM', fullLabel: 'STARTS SUNDAY 8 AM', revealWeekday: 'SATURDAY' };
    const p = getIndiaDateParts(timeMs);
    const day = WEEKDAYS[new Date(Date.UTC(p.year, p.month, p.date)).getUTCDay()];
    const hour12 = p.hours % 12 === 0 ? 12 : p.hours % 12;
    const ampm = p.hours >= 12 ? 'PM' : 'AM';
    const timeStr = p.minutes > 0 ? `${hour12}:${String(p.minutes).padStart(2, '0')} ${ampm}` : `${hour12} ${ampm}`;
    return {
      weekday: day,
      weekdayTitle: day.charAt(0) + day.slice(1).toLowerCase(),
      timeStr,
      fullLabel: `STARTS ${day} ${timeStr}`,
      // The cars are revealed the day before the sale (Saturday for a Sunday sale).
      revealWeekday: WEEKDAYS[(WEEKDAYS.indexOf(day) + 6) % 7],
    };
  }, [opensMs, scheduledStartsMs]);

  // Expiry timestamp for live sale
  const expiryMs = useMemo(() => {
    if (liveOffer?.expiryDate) {
      return new Date(liveOffer.expiryDate).getTime();
    }
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    return end.getTime();
  }, [liveOffer]);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <Image
          source={require('@/assets/images/flash_sale/fs_rays.png')}
          style={{ position: 'absolute', left: -369, top: -134, width: 1130, height: 1130 }}
          contentFit="fill"
          transition={0}
        />
      </View>

      <View style={styles.topSpacer}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          hitSlop={12}
          onPress={() => safeBack(router)}
          style={styles.backBtn}
        >
          <Feather name="chevron-left" size={24} color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Content depending on state */}
      {!ready ? (
        // Waiting for the server's current answer
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 56 }}>
          <ActivityIndicator color="#FFFFFF" />
        </View>
      ) : isLive && displayCars.length === 0 ? (
        // Live offers that name no car (all cars / a category): the offers themselves.
        <View style={{ flex: 1, paddingBottom: insets.bottom }}>
          <ExclusiveOffersSection layout="list" />
        </View>
      ) : isComingSoon || showScheduleHero ? (
        // Figma 1717:15399 COMING SOON (nothing planned) / 1717:15415 SCHEDULE ON <day> (planned, cars not out yet).
        // Centred on the whole screen, as in the 852 frame; shrinks on narrow phones, never grows.
        <View
          style={styles.centerComingSoon}
          pointerEvents="none" // full-screen: never block the back button
          accessible
          accessibilityRole="header"
          accessibilityLabel={isComingSoon ? 'Flash Sale, coming soon' : `Flash Sale, schedule on ${scheduleInfo.revealWeekday.toLowerCase()}`}
        >
          <Reanimated.View entering={ZoomIn.springify().damping(13)}>
            <FlashSaleHeroTitle
              variant={isComingSoon ? 'comingSoon' : 'schedule'}
              weekday={scheduleInfo.revealWeekday}
              width={Math.min(393, windowWidth)}
            />
          </Reanimated.View>
        </View>
      ) : (
        // States 3, 4, 5, 6, 7: SCHEDULED or LIVE SALE
        <View style={styles.mainContainer}>
          {/* Header: Live countdown (Images 6 & 7) vs Scheduled (Images 3, 4, 5) */}
          <Reanimated.View entering={FadeInDown.duration(320)}>
          {isLive ? (
            <LiveCountdownHeader expiryMs={expiryMs} scale={fitW} />
          ) : showScheduledHeader ? (
            // Figma 1717:15185 "Schedule on <reveal day>" while the cars are hidden; "STARTS <DAY> <TIME>" on preview
            // day. The viewBox starts at Figma y 44, right under the 44-pt top bar.
            <View
              accessible
              accessibilityRole="header"
              accessibilityLabel={ticketLocked ? `Flash Sale, schedule on ${scheduleInfo.revealWeekday.toLowerCase()}` : `Flash Sale, ${scheduleInfo.fullLabel.toLowerCase()}`}
              style={{ alignSelf: 'center' }}
            >
              <FlashSaleScheduledHeader
                line={ticketLocked ? 'scheduleOn' : 'starts'}
                day={ticketLocked ? scheduleInfo.revealWeekday : scheduleInfo.weekday}
                time={scheduleInfo.timeStr}
                width={Math.min(SCHEDULED_HEADER_VIEW.w, windowWidth)}
              />
            </View>
          ) : null}
          </Reanimated.View>

          {/* Ticket Card + Sparkles: springs up from slightly smaller, just after the header */}
          <Reanimated.View entering={ZoomIn.delay(120).springify().damping(14)} style={StyleSheet.absoluteFill} pointerEvents="box-none">
          <View style={[styles.ticketSection, { position: 'absolute', left: (windowWidth - 353) / 2, top: ticketTop, transform: [{ scale: ticketScale }] }]}>
            <Sparkle size={13.867} left={-8.87} top={-9} />
            <Sparkle size={6.934} left={-12} top={-14} />
            <Sparkle size={13.867} left={348} top={-9} />
            <Sparkle size={6.934} left={358.07} top={-14} />

            <Animated.View style={[styles.ticketCard, { transform: [{ translateX: slideX }] }]} {...panResponder.panHandlers}>
              {/* Ticket shape (Figma Union/Subtract): rounded 16, with real half-circle bites cut out of both sides */}
              <TicketShape fill="#FEFDF0" />
              {/* Locked (before the sale): the Subtract frost, #595959 at 40%, over the whole ticket */}
              {ticketLocked && <TicketShape fill="rgba(89, 89, 89, 0.4)" />}
              {/* Line 18: 320 dashed line at (16.5, 240), #6152D8 40% → 100% → 40% (Figma export) */}
              <FsDash width={320} height={1} style={styles.dashedDivider} />

              {/* Photo Area */}
              <View style={styles.photoContainer}>
                <Image
                  source={getCarImage(activeCar, selectedCarIndex)}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  transition={200}
                />
                {/* Sold out (Figma 1844:16201): red ribbon across the photo's top-right corner, rotated 39.76° */}
                {isLive && activeCar.booked && (
                  <View style={styles.soldRibbonBox} pointerEvents="none">
                    <View style={styles.soldRibbon}>
                      <View style={styles.soldRibbonInner}>
                        <Text style={styles.soldRibbonText}>SOLD OUT</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Top-left Amber Duration Badge */}
                {!!durationLabel && (
                  <View style={styles.durationBadge}>
                    <Text style={styles.durationBadgeText}>{durationLabel}</Text>
                  </View>
                )}

                {ticketLocked ? (
                  // Figma 1717:15185: the car stays visible; a white card (329 × 77, 1px #FBC422 52%) closes the photo.
                  <View style={styles.lockedMembersCard}>
                    <Text style={styles.lockedMembersText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                      Members Get {earlyAccessMinutes} Minutes.
                    </Text>
                    <Text style={[styles.lockedMembersText, { color: BG }]} numberOfLines={1}>Exclusive Access.</Text>
                  </View>
                ) : displayCars.length > 1 ? (
                  // Frame 25: one dot per car in the sale (only when there is more than one), the shown car as a bar
                  <View style={styles.dotsRow}>
                    {displayCars.map((c, dotIdx) => (
                      <View key={String(c.id)} style={[styles.dot, dotIdx === selectedCarIndex && styles.dotActive]} />
                    ))}
                  </View>
                ) : null}
              </View>

              {/* Bottom Details Section */}
              {ticketLocked && opensMs > 0 ? (
                // Locked times row (Images 3 & 4)
                <View style={styles.lockedTimesRow}>
                  <View style={[styles.timeBox, styles.timeBoxGold]}>
                    <Text style={styles.timeBoxMain} numberOfLines={1}>
                      {formatTime12(opensMs - earlyAccessMinutes * 60000)} – {formatTime12(opensMs)}
                    </Text>
                    <Text style={[styles.timeBoxSub, { color: '#E58900' }]} numberOfLines={1}>
                      Exclusive Member Access
                    </Text>
                  </View>
                  <View style={styles.timeBox}>
                    <Text style={styles.timeBoxMain} numberOfLines={1}>
                      {formatTime12(opensMs)} onwards
                    </Text>
                    <Text style={styles.timeBoxSub} numberOfLines={1}>
                      Open to Everyone
                    </Text>
                  </View>
                </View>
              ) : (
                // Revealed Vehicle Details (Images 5, 6, 7)
                // Figma Frame 2147225778: 329 × 93 at (12, 256), #6152D8 5%, radius 8, padding 6, rows 6 apart.
                <View style={styles.detailsContainer}>
                  {/* Frame 2147225757: name + specs on the left, rating on the right (padding 0 4, 50 high) */}
                  <View style={styles.detailsRow1}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={styles.carTitle} numberOfLines={1}>{carDisplayName}</Text>
                      <View style={styles.specsRow}>
                        {[
                          activeCar.transmission,
                          activeCar.fuel || activeCar.fuelType,
                          activeCar.type === 'Bike' ? null : (parseInt(String(activeCar.seats ?? activeCar.seatingCapacity ?? ''), 10) ? `${parseInt(String(activeCar.seats ?? activeCar.seatingCapacity), 10)} Seater` : null),
                        ].filter(Boolean).map((spec, i) => (
                          <React.Fragment key={String(spec)}>
                            {i > 0 && <View style={styles.specDot} />}
                            <Text style={styles.specsText} numberOfLines={1}>{spec}</Text>
                          </React.Fragment>
                        ))}
                      </View>
                    </View>

                    {/* Only a real rating backed by real reviews */}
                    {Number(activeCar.reviewCount ?? activeCar.ratings?.reviewCount) > 0 && Number(activeCar.rating ?? activeCar.ratings?.averageRating) > 0 && (
                      <View style={styles.ratingCol}>
                        <View style={styles.ratingBadge}>
                          <Text style={styles.ratingNum}>{Number(activeCar.rating ?? activeCar.ratings?.averageRating).toFixed(1)}</Text>
                          <View style={{ width: 14, height: 14 }}>
                            <FsRatingStar width={10.8239} height={10.3534} style={{ position: 'absolute', left: 14 * 0.1134, top: 14 * 0.0958 }} />
                          </View>
                        </View>
                        <Text style={styles.reviewCount}>({Number(activeCar.reviewCount ?? activeCar.ratings?.reviewCount)} Reviews)</Text>
                      </View>
                    )}
                  </View>

                  {/* Frame 2147225762: price + struck price on the left, View Details on the right (padding 4, 25 high) */}
                  <View style={styles.detailsRow3}>
                    <View style={styles.priceRow}>
                      {dealPrice != null && <Text style={styles.dealPriceText}>{formatCurrency(dealPrice)}</Text>}
                      {dealPrice != null && originalPrice != null && originalPrice > dealPrice && (
                        <Text style={styles.struckPriceText}>{formatCurrency(originalPrice)}</Text>
                      )}
                    </View>
                    <Pressable hitSlop={10} onPress={handleViewDetails} style={({ pressed }) => [styles.viewDetailsRow, pressed && { opacity: 0.7 }]}>
                      <Text style={styles.viewDetailsText}>View Details</Text>
                      <FsChevron width={13} height={13} />
                    </Pressable>
                  </View>
                </View>
              )}
              {/* Members-only right now (non-member): the car is shown under the Subtract frost, #595959 at 40% */}
              {membersOnlyNow && <TicketShape fill="rgba(89, 89, 89, 0.4)" />}
              {/* Subtract: the 1px #FBC422 outline, following the bites, drawn over everything in the ticket */}
              <TicketShape stroke={GOLD} />
              {/* Frame 2147226247: "Members get early access" pill + line, above the frost */}
              {/* Frame 2147226248 pill: 250 × 39, gold 6% over a 10px blur, 1px #FBC422, fully rounded */}
              {membersOnlyNow && (
                <View style={styles.earlyAccessPillWrap} pointerEvents="none">
                  <View>
                    <View style={styles.earlyAccessOverlayPill}>
                      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(251, 196, 34, 0.06)' }]} />
                      <Text style={styles.earlyAccessWhiteText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                        Members get <Text style={styles.earlyAccessGoldText}>early access</Text>
                      </Text>
                    </View>
                    {/* Crown (Figma Vector): 16.66 × 11.66 at (17.48, −12), tilted −24.98°, sitting on the pill's edge */}
                    <PillCrown />
                  </View>
                  {/* 4 below the pill: how early, from the offer */}
                  <Text style={styles.earlyAccessSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                    Unlock this offer {earlyAccessMinutes} minutes early with Membership.
                  </Text>
                </View>
              )}
            </Animated.View>

            {/* Main CTA Button */}
            {isScheduled ? (
              isSundayNonMemberPreview ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => { Haptics.selectionAsync(); router.push('/membership'); }}
                  style={({ pressed }) => [styles.mainCtaBtn, styles.memberCta, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.mainCtaText}>Buy Membership to</Text>
                  <FsLock width={20} height={20} />
                  <Text style={styles.mainCtaText}>Unlock</Text>
                </Pressable>
              ) : ticketLocked && isMember ? (
                <View style={styles.mainCtaBtn}>
                  <Text style={styles.mainCtaText}>
                    Your early access opens at {formatTime12(scheduledStartsMs - earlyAccessMinutes * 60000)}
                  </Text>
                </View>
              ) : ticketLocked ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    router.push('/membership');
                  }}
                  style={({ pressed }) => [styles.mainCtaBtn, pressed && { opacity: 0.9 }]}
                >
                  <Text style={styles.mainCtaText}>Get Membership &amp; Unlock Early Access</Text>
                </Pressable>
              ) : (
                // Saturday preview before Sunday's sale.
                <Pressable
                  accessibilityRole="button"
                  onPress={() => {
                    Haptics.selectionAsync();
                    if (!isMember) {
                      router.push('/membership');
                    }
                  }}
                  style={({ pressed }) => [styles.mainCtaBtn, styles.memberCta, pressed && { opacity: 0.9 }]}
                >
                  <FsLock width={20} height={20} />
                  <Text style={styles.mainCtaText}>
                    Unlocks {scheduleInfo.weekdayTitle} at {scheduleInfo.timeStr}
                  </Text>
                </Pressable>
              )
            ) : isLive && activeCar.booked ? (
              // Sold out (Figma 1844:16246): red, nothing to tap
              <View style={[styles.mainCtaBtn, styles.soldCta]} accessibilityRole="button" accessibilityState={{ disabled: true }}>
                <Text style={[styles.mainCtaText, { color: '#FFFFFF' }]}>SOLD OUT</Text>
              </View>
            ) : membersOnlyNow ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => { Haptics.selectionAsync(); router.push('/membership'); }}
                style={({ pressed }) => [styles.mainCtaBtn, styles.memberCta, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.mainCtaText}>Buy Membership to</Text>
                <FsLock width={20} height={20} />
                <Text style={styles.mainCtaText}>Unlock</Text>
              </Pressable>
            ) : isLive && !canBook ? (
              // Live Early Access Window for non-member (Image 6)
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push('/membership');
                }}
                style={({ pressed }) => [styles.mainCtaBtn, styles.memberCta, pressed && { opacity: 0.9 }]}
              >
                <Text style={styles.mainCtaText}>Buy Membership to</Text>
                <FsLock width={20} height={20} />
                <Text style={styles.mainCtaText}>Unlock</Text>
              </Pressable>
            ) : (
              // Live Open to Member / Everyone -> BOOK NOW (Image 7)
              <Pressable
                accessibilityRole="button"
                onPress={() => handleBookNow()}
                style={({ pressed }) => [styles.mainCtaBtn, pressed && { opacity: 0.9 }]}
              >
                <Text style={[styles.mainCtaText, styles.bookNowText]}>{booking ? 'PLEASE WAIT…' : 'BOOK NOW'}</Text>
              </Pressable>
            )}
          </View>
          </Reanimated.View>

          {/* Frame 2147226241 (312 × 86, Figma top 675): the sale's cars on a dashed arc — the shown car in the middle
              (52, white 2px ring, crown), its neighbours either side (44, ring 90%), the next ones at the ends (40,
              ring 80%). Before the sale opens they are frosted with a gold ring instead (Ellipse 17/18/19). */}
          <Reanimated.View entering={FadeInUp.delay(220).duration(320)} style={[styles.arcWrap, { marginBottom: Math.max(0, 91 - 16 - insets.bottom) }]}>
            <Svg width={712} height={300} style={{ position: 'absolute', left: -200, top: 35 }} pointerEvents="none">
              <Ellipse cx={356} cy={150} rx={355.5} ry={149.5} stroke="rgba(255,255,255,0.4)" strokeWidth={1} strokeDasharray="6 6" fill="none" />
            </Svg>
            {ARC_SLOTS.slice(0, displayCars.length).map((slot) => {
              const n = displayCars.length;
              const idx = (((selectedCarIndex + slot.offset) % n) + n) % n;
              const car = displayCars[idx];
              const locked = ticketLocked;
              return (
                <Pressable
                  key={slot.offset}
                  accessibilityRole="button"
                  accessibilityLabel={slot.offset === 0 ? 'Car shown' : 'Show this car'}
                  onPress={() => { if (slot.offset !== 0) { Haptics.selectionAsync(); setSelectedCarIndex(idx); } }}
                  style={[
                    styles.arcThumb,
                    { left: slot.left, top: slot.top, width: slot.size, height: slot.size, borderRadius: slot.size / 2 },
                    locked ? { borderWidth: 1, borderColor: GOLD } : { borderWidth: 2, borderColor: slot.ring },
                  ]}
                >
                  <Image source={getCarImage(car, idx)} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={locked ? 12 : 0} transition={150} />
                  {locked && <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(89, 89, 89, 0.32)' }]} />}
                </Pressable>
              );
            })}
            {displayCars.length > 0 && <PillCrown left={128} top={2} />}
          </Reanimated.View>
        </View>
      )}
      {coachVisible && coachEligible && (
        <FlashSaleSwipeCoach
          ticketLeft={(windowWidth - 353) / 2}
          ticketTop={insets.top + 44 + ticketTop}
          ticketScale={ticketScale}
          onDismiss={dismissCoach}
        />
      )}
      <LoginBottomSheet
        visible={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={() => { setShowLogin(false); handleBookNow(true); }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },
  topSpacer: { height: 44, position: 'relative' },
  backBtn: {
    position: 'absolute',
    left: 16,
    top: 3,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },

  /* Live header with ticking countdown timer (Images 6 & 7) */
  // Frame 2147226221: 361 × 92.42 row, centred, 8 between the title and timer; the Figma row starts at y=86.
  liveHeaderWrap: {
    width: 361,
    height: 92.42,
    alignSelf: 'center',
    transform: [{ translateX: -8.4 }],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
    gap: 8,
    marginTop: -17,
  },
  liveTitleCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveTimerCol: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', gap: 6 },
  endsInLabel: { fontFamily: FONT, fontSize: 11.872, lineHeight: 17.8, color: '#FFFFFF', textAlign: 'center' },
  timerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 11.872 },
  timerUnit: { alignItems: 'center' },
  timerBox: { width: 40.07, paddingVertical: 5.936, borderRadius: 8.904, borderWidth: 1.484, borderColor: '#FF008B', backgroundColor: '#FFFBF0', alignItems: 'center', justifyContent: 'center' },
  timerNum: { fontFamily: FONT_SEMI, fontSize: 16.325, lineHeight: 24.5, color: '#6152D8', textAlign: 'center', includeFontPadding: false },
  timerUnitText: { fontFamily: FONT_SEMI, fontSize: 11.872, lineHeight: 17.8, color: '#FFFFFF', textAlign: 'center' },

  /* COMING SOON / SCHEDULE ON hero */
  // Centred on the whole screen (not the room under the back button): the hero's band is centred on Figma's 852.
  centerComingSoon: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Main Container */
  mainContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingBottom: 16,
  },

  /* Ticket Section */
  ticketSection: {
    alignSelf: 'center',
    width: 353,
    marginTop: 10,
  },
  // Shape, fill and outline are drawn by TicketShape (the bites can't be cut out of a plain rounded box).
  ticketCard: {
    width: 353,
    height: 361,
  },
  dashedDivider: { position: 'absolute', left: 16.5, top: 239, zIndex: 1 },

  /* Photo inside ticket */
  photoContainer: { position: 'absolute', left: 12, top: 12, width: 329, height: 212, borderRadius: 8, overflow: 'hidden', backgroundColor: '#FFFFFF' },
  durationBadge: { position: 'absolute', left: 6, top: 6, height: 28, paddingHorizontal: 10, borderRadius: 20, backgroundColor: '#FBC422', alignItems: 'center', justifyContent: 'center', zIndex: 3 },
  durationBadgeText: { fontFamily: FONT_SEMI, fontSize: 11, lineHeight: 16.5, color: '#3D0700', includeFontPadding: false },
  // Frame 2147226247: 269 × 60, pill + line 4 apart, centred; top = 50% − 30 − 23 of the 361 ticket = 127.5.
  // Figma 1724:14343: #FEFDF0, 1px #FBC422, radius 12, padding 8, 4 between text and lock.
  memberCta: { flexDirection: 'row', gap: 4, backgroundColor: '#FEFDF0', borderWidth: 1 },
  // Sold out ribbon: a 181.39 × 159.42 box at (195.81, −43.15) on the photo; the 206-wide band is centred in it and
  // rotated 39.76° — #EC2526 with 3 above and below, inside it #EA2626 with a 1px white border, "SOLD OUT" 17 semibold.
  soldRibbonBox: { position: 'absolute', left: 195.81, top: -43.15, width: 181.389, height: 159.418, alignItems: 'center', justifyContent: 'center' },
  soldRibbon: { width: 206, paddingVertical: 3, backgroundColor: '#EC2526', transform: [{ rotate: '39.76deg' }] },
  soldRibbonInner: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 10, paddingVertical: 1, backgroundColor: '#EA2626', borderWidth: 1, borderColor: '#FFFFFF' },
  soldRibbonText: { fontFamily: FONT_SEMI, fontSize: 17, lineHeight: 25.5, color: '#FFFFFF', includeFontPadding: false },
  // Sold out button (Figma 1844:16246): #EA2626, 1px #F5F5F5, white "SOLD OUT".
  soldCta: { backgroundColor: '#EA2626', borderColor: '#F5F5F5' },
  earlyAccessPillWrap: { position: 'absolute', left: 0, right: 0, top: 127.5, alignItems: 'center', gap: 4 },
  earlyAccessOverlayPill: {
    width: 250,
    height: 39,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: GOLD,
    borderRadius: 50,
    overflow: 'hidden',
  },
  earlyAccessWhiteText: {
    fontFamily: FONT,
    fontSize: 17,
    lineHeight: 21,
    color: '#FFFFFF',
    includeFontPadding: false,
  },
  earlyAccessGoldText: {
    fontFamily: FONT,
    color: GOLD,
  },
  earlyAccessSub: {
    width: 269,
    fontFamily: FONT_MED,
    fontSize: 11,
    lineHeight: 16.5,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  dotsRow: { position: 'absolute', bottom: 6, left: 0, right: 0, height: 4, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 5 },
  dot: { width: 4, height: 4, borderRadius: 20, backgroundColor: '#D4D4D4' },
  dotActive: { width: 16, height: 4, borderRadius: 20, backgroundColor: '#FFFFFF' },

  /* Locked overlay card (Images 3 & 4) */
  previewToggleBtn: {
    marginTop: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  previewToggleText: {
    fontFamily: FONT_SEMI,
    fontSize: 12,
    color: '#3E2DC8',
  },

  /* Locked times row (Images 3 & 4) */
  // Figma 1717:15185 members card: the bottom 77 of the photo, white, radius 8, two 17.3 semibold lines 26 apart.
  lockedMembersCard: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 77,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(251,196,34,0.52)',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  lockedMembersText: { fontFamily: FONT_SEMI, fontSize: 17.33, lineHeight: 26, color: '#262626', textAlign: 'center', includeFontPadding: false },
  // Figma: 329 × 93 at (12, 256) of the ticket, radius 10, 1px #FBC422 52%; the two boxes 155.5 × 77, 8 in, 2 apart.
  lockedTimesRow: {
    position: 'absolute',
    left: 12,
    top: 256,
    width: 329,
    height: 93,
    flexDirection: 'row',
    gap: 2,
    padding: 7,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(251,196,34,0.52)',
    backgroundColor: '#FFFFFF',
  },
  timeBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  timeBoxGold: {
    backgroundColor: '#FEFEF5',
    borderWidth: 1,
    borderColor: 'rgba(251,196,34,0.52)',
    borderRadius: 6,
  },
  timeBoxMain: {
    fontFamily: FONT,
    fontSize: 13,
    color: '#262626',
  },
  timeBoxSub: {
    fontFamily: FONT_SEMI,
    fontSize: 11,
    color: '#737373',
    marginTop: 2,
  },

  /* Revealed vehicle details (Images 5, 6, 7) */
  detailsContainer: { position: 'absolute', left: 12, top: 256, width: 329, height: 93, padding: 6, gap: 6, borderRadius: 8, backgroundColor: 'rgba(97, 82, 216, 0.05)' },
  detailsRow1: { height: 50, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  carTitle: { fontFamily: FONT_SEMI, fontSize: 17, lineHeight: 25.5, color: '#262626', includeFontPadding: false },
  ratingCol: { width: 67, alignItems: 'center', gap: 4 },
  ratingBadge: { height: 28, flexDirection: 'row', alignItems: 'center', gap: 2, paddingTop: 4, paddingBottom: 4, paddingLeft: 10, paddingRight: 9, borderRadius: 20, backgroundColor: '#2F3E75' },
  ratingNum: { fontFamily: FONT_SEMI, fontSize: 13, lineHeight: 19.5, color: '#FFFFFF', includeFontPadding: false },
  ratingStar: {
    fontFamily: FONT,
    fontSize: 11,
    color: GOLD_AMBER,
  },
  reviewCount: { fontFamily: FONT_MED, fontSize: 11, lineHeight: 16.5, color: '#525252' },
  specsText: { fontFamily: FONT_MED, fontSize: 13, lineHeight: 19.5, color: '#737373', flexShrink: 1 },
  specsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  specDot: { width: 3, height: 3, borderRadius: 2, backgroundColor: '#737373' },
  viewDetailsRow: { flexDirection: 'row', alignItems: 'center' },
  detailsRow3: { height: 25, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4, gap: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  dealPriceText: { fontFamily: FONT_SEMI, fontSize: 19, lineHeight: 24, color: '#262626', includeFontPadding: false },
  struckPriceText: { fontFamily: FONT_MED, fontSize: 13, lineHeight: 16, color: '#737373', textDecorationLine: 'line-through', marginBottom: 2 },
  viewDetailsText: { fontFamily: FONT_SEMI, fontSize: 11, lineHeight: 16.5, color: '#737373', textDecorationLine: 'underline' },

  /* Main CTA Button */
  // Figma: 352 × 43 with a 1px outline = 353 × 44, radius 12, 14 under the ticket.
  mainCtaBtn: { width: 353, height: 44, borderRadius: 12, backgroundColor: '#F4F6FA', borderWidth: 1, borderColor: GOLD, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginTop: 14, padding: 8 },
  mainCtaText: { fontFamily: FONT, fontSize: 17, lineHeight: 25.5, color: '#3E2DC8', textAlign: 'center' },
  bookNowText: {},

  /* Bottom Arc with 5 Circular Thumbnails */
  arcThumb: { position: 'absolute', overflow: 'hidden', backgroundColor: '#FFFFFF' },
  arcWrap: { alignSelf: 'center', width: 312, height: 86 },
  crownDealIcon: {
    position: 'absolute',
    top: -3,
    left: -3,
    width: 20,
    height: 20,
    transform: [{ rotate: '-24deg' }],
  },
});