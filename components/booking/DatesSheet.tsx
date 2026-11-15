import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView, LayoutAnimation, Alert, Linking, Modal, Animated } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import * as Haptics from '@/utils/haptics';
import Svg, {
  Circle,
  Defs,
  Path,
  LinearGradient as SvgLinearGradient,
  Stop,
} from 'react-native-svg';

import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { calculateRentalDays } from '@/services/backend/pricingEngine';
import { checkCarAvailability, buildBlocks, todayDayNum, toDayNum, dayNumAndTimeToMs, getIndiaDateParts, parseTimeToMinutes, dayNumToLabel, formatTime12 } from '@/utils/sawari';
import { SUPPORT_PHONE, SUPPORT_WHATSAPP_URL } from '@/constants/support';
import { ModalBlur } from '@/components/common/ModalBlur';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const MONTHS_AHEAD = 12;

const generateTimes = () => {
  const times = [];
  const st = new Date(2020, 0, 1, 0, 0, 0); 
  for (let i = 0; i < 48; i++) {
    const hours = st.getHours();
    const minutes = st.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes === 0 ? '00' : '30';
    times.push(`${displayHours}:${displayMinutes} ${ampm}`);
    st.setMinutes(st.getMinutes() + 30);
  }
  return times;
};
const ALL_TIMES = generateTimes();
// The design offers whole hours only; ALL_TIMES indices still drive the 8 AM rules below.
const isWholeHour = (time: string) => time.includes(':00');
const padTime = (time: string) => time.replace(/^(\d):/, '0$1:');
// One date picked = a same-day trip: pickup 8 AM, drop-off 8 PM by default (any hour after pickup can be chosen).
// Picking a second date makes it a multi-day trip, 8 AM to 8 AM.
const SAME_DAY_RETURN = '8:00 PM';
const DAY_TIME = '8:00 AM';

const HOUR = 3600 * 1000;
const hourLabel = (ms: number) => {
  const p = getIndiaDateParts(ms);
  const h = p.hours;
  return `${h % 12 || 12}:00 ${h >= 12 ? 'PM' : 'AM'}`;
};
/**
 * The free gap of a car that starts on `date`: the first whole hour (8 AM or later, never in the past) it is free, and the
 * whole hour its next booking begins (null = nothing follows). A car whose last booking ends at 1 PM is free from 1 PM.
 */
const carGapOn = (car: any, date: Date) => {
  const dayNum = toDayNum(date.getFullYear(), date.getMonth(), date.getDate());
  const blocks = buildBlocks(car, todayDayNum()).filter((b) => Number.isFinite(b.startMs)).sort((a, b) => a.startMs - b.startMs);
  const dayStart8Am = dayNumAndTimeToMs(dayNum, '08:00 AM', 480);
  const dayEndMs = dayNumAndTimeToMs(dayNum, '11:59 PM', 1439);
  let from = Math.ceil(Math.max(dayStart8Am, Date.now()) / HOUR) * HOUR;
  for (let c = blocks.find((b) => b.startMs < from + HOUR && b.endMs > from); c; c = blocks.find((b) => b.startMs < from + HOUR && b.endMs > from)) {
    if (!Number.isFinite(c.endMs)) return null;
    from = Math.ceil(c.endMs / HOUR) * HOUR;
  }
  if (from >= dayEndMs) return null;
  const next = blocks.find((b) => b.startMs > from);
  return { from, until: next ? Math.floor(next.startMs / HOUR) * HOUR : null };
};

// Monday-first weeks for one month; null pads the days before the 1st.
const monthWeeks = (year: number, month: number) => {
  const cells: (Date | null)[] = [];
  const first = new Date(year, month, 1);
  for (let i = 0; i < (first.getDay() + 6) % 7; i++) cells.push(null);
  for (const d = new Date(first); d.getMonth() === month; d.setDate(d.getDate() + 1)) cells.push(new Date(d));
  while (cells.length % 7) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
};

// Figma wheel: 142pt window, selected row 40pt in the middle, neighbours 30pt rows 2pt apart
// (centre-to-centre 37pt), faded out towards both edges.
const ROW = 37;
const WINDOW = 107.5; // 146 card - 4 + 4 padding - 22.5 title - 8 gap
const CAL_THUMB_H = 42;
const EDGE_PAD = WINDOW / 2 - ROW / 2;

type WheelPalette = { card: string; box: string; boxBorder: string; selected: string; idle: string };

/** Vertical snap wheel (Figma Pickup / Dropoff Time). `onPick` may refuse a time; the wheel then snaps back. */
function TimeWheel({ title, times, value, onPick, p, titleColor }: {
  title: string;
  times: string[];
  value: string;
  /** Returns false when the time is refused (e.g. before 8 AM). */
  onPick: (time: string) => boolean;
  p: WheelPalette;
  titleColor: string;
}) {
  const ref = useRef<ScrollView>(null);
  const index = Math.max(0, times.indexOf(value));

// Prevent animation on the initial render.
  const hasMounted = useRef(false);

  useEffect(() => {
    const t = setTimeout(() => {
      ref.current?.scrollTo({
        y: index * ROW,
        animated: hasMounted.current,
      });
  
      hasMounted.current = true;
    }, 50);
  
    return () => clearTimeout(t);
  }, [index, times.length]);

  const settle = (y: number) => {
    const i = Math.min(times.length - 1, Math.max(0, Math.round(y / ROW)));
    if (times[i] === value) return;
    // A refused pick leaves `value` unchanged, so put the wheel back on it.
    if (!onPick(times[i])) ref.current?.scrollTo({ y: index * ROW, animated: true });
  };

  return (
    <View style={[styles.wheelCard, { backgroundColor: p.card }]}>
      <Text style={[styles.wheelTitle, { color: titleColor }]}>{title}</Text>
      <View style={styles.wheel}>
        <View pointerEvents="none" style={[styles.wheelBox, { backgroundColor: p.box, borderColor: p.boxBorder }]} />
        <ScrollView
         ref={ref}
         nestedScrollEnabled
         showsVerticalScrollIndicator={false}
         snapToInterval={ROW}
         snapToAlignment="start"
         decelerationRate="fast"
         scrollEventThrottle={16}
         contentContainerStyle={{ paddingVertical: EDGE_PAD }}
         onMomentumScrollEnd={(e) =>
           settle(e.nativeEvent.contentOffset.y)
         }
        >
          {times.map((time, i) => (
            <Pressable
              key={time}
              accessibilityRole="button"
              accessibilityState={{ selected: i === index }}
              onPress={() => settle(i * ROW)}
              style={styles.wheelRow}
            >
              <Text style={[styles.wheelText, { color: i === index ? p.selected : p.idle }]}>{padTime(time)}</Text>
            </Pressable>
          ))}
        </ScrollView>
        {/* Figma mask (0 → 0.7 → 1 → 0.7 → 0 opacity), drawn as the card colour over the rows. */}
        <ExpoLinearGradient
  pointerEvents="none"
  colors={[p.card, `${p.card}4D`, `${p.card}00`, `${p.card}4D`, p.card]}
  locations={[0, 0.25, 0.5, 0.75, 1]}
  style={StyleSheet.absoluteFill}
/>
      </View>
    </View>
  );
}

export function DatesSheet() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  // fresh: opened right after choosing a destination (or for a trip whose dates have passed) — the
  // customer picks the dates themselves, nothing is pre-filled from an earlier search.
  const { returnBack, fresh, forSpecificCar, fromDestination, thenLocation, thenBook, deal: dealParam } = useLocalSearchParams<{
    /** From Today's Deals "Need more time?": the deal (day number, start/end ms, hourly rate) as JSON. */
    deal?: string;
    thenLocation?: string;
    thenBook?: string;
    returnBack?: string;
    fresh?: string;
    forSpecificCar?: string;
    fromDestination?: string;
  }>();
  const freshPick = fresh === 'true';
  const { setDates, setTimes, dateRange, pickupTime, returnTime, selectedCar, selectCar, dropoff, isDarkMode, isAuthenticated, applyCoupon } = useSawari();
  const deal = useMemo(() => {
    try { return dealParam ? (JSON.parse(dealParam) as { day: number; startMs: number; endMs: number; rate: number }) : null; } catch { return null; }
  }, [dealParam]);
  const isOffDay = (date: Date) => !!deal && toDayNum(date.getFullYear(), date.getMonth(), date.getDate()) === deal.day;
  const { data: fetchedVehicles = [] } = useVehicles();
  const liveSelectedCar = selectedCar ? (fetchedVehicles.find((v) => String(v.id) === String(selectedCar.id)) || selectedCar) : selectedCar;

  // Figma palette in light mode; dark mode keeps the theme tokens.
  const ui = isDarkMode
    ? { page: colors.background, text: colors.foreground, muted: colors.mutedForeground, border: colors.border, card: colors.card, cardBorder: colors.border, calendar: colors.card, month: colors.mutedForeground, band: colors.tintLight, navy: colors.primary, sel: colors.primary, onNavy: colors.primaryForeground, past: colors.mutedForeground, chipText: colors.primaryText, dash: colors.mutedForeground }
    : { page: '#FFFFFF', text: '#262626', muted: '#737373', border: '#D4D4D4', card: '#F4F6FA', cardBorder: '#E7EAF4', calendar: '#F9F9FB', month: '#525252', band: '#E9EAF1', navy: '#2F3E75', sel: '#6B5AED', onNavy: '#FFFFFF', past: '#A3A3A3', chipText: '#2F3E75', dash: '#A3A8C3' };

  const istTodayParts = getIndiaDateParts();
  const today = new Date(istTodayParts.year, istTodayParts.month, istTodayParts.date);
  today.setHours(0, 0, 0, 0);

  const parseDateStr = (dateStr: string) => {
    if (!dateStr || dateStr === 'Select') return null;
    const [day, month] = dateStr.split(' ');
    const monthIndex = MONTHS.indexOf(month);
    if (monthIndex === -1) return null;
    const d = new Date(today.getFullYear(), monthIndex, parseInt(day));
    d.setHours(0, 0, 0, 0);
    // Labels have no year: a month already behind us this year ("5 Jan" in October) is next year's.
    if (monthIndex < today.getMonth()) d.setFullYear(d.getFullYear() + 1);
    return d;
  };

  useEffect(() => {
    import('@/services/api/activity').then(({ ActivityAPI }) => {
      ActivityAPI.logActivity('open_dates_sheet', 'DatesSheet');
    });
  }, []);

  const initialStart = freshPick ? null : parseDateStr(dateRange.split(' – ')[0]);
  const initialEnd = freshPick ? null : parseDateStr(dateRange.split(' – ')[1]);

  const [start, setStart] = useState<Date | null>(initialStart && initialStart >= today ? initialStart : null);
  const [end, setEnd] = useState<Date | null>(initialEnd && initialStart && initialEnd >= initialStart ? initialEnd : null);
  
  const [tempPickupTime, setTempPickupTime] = useState<string | null>(!freshPick && pickupTime && pickupTime !== '--:--' ? pickupTime.replace(/^0/, '') : '8:00 AM');
  
  const [tempReturnTime, setTempReturnTime] = useState<string | null>(!freshPick && returnTime && returnTime !== '--:--' ? returnTime.replace(/^0/, '') : '8:00 AM');
  
  const [showEarlyPickupModal, setShowEarlyPickupModal] = useState(false);
  const [hasShownLateNotice, setHasShownLateNotice] = useState(false);
  const [showLateReturnModal, setShowLateReturnModal] = useState(false);
  // Popup shown when Apply finds the chosen car busy (Explore → car → dates): says when it is free.
  const [unavailable, setUnavailable] = useState<{ title: string; body: string; note?: string } | null>(null);

  // Slim scroll thumb (Figma: 4x42, 9 from the right edge) -- the native indicator is hidden.
  const calScroll = useRef(new Animated.Value(0)).current;
  const [calSize, setCalSize] = useState({ view: 0, content: 0 });
  const calThumbY = calScroll.interpolate({
    inputRange: [0, Math.max(1, calSize.content - calSize.view)],
    outputRange: [0, Math.max(0, calSize.view - CAL_THUMB_H)],
    extrapolate: 'clamp',
  });
  const months = Array.from({ length: MONTHS_AHEAD }, (_, i) => new Date(today.getFullYear(), today.getMonth() + i, 1));

  // A new start date: with a car chosen, pickup moves to when the car is free that day (after its last booking).
  const startDefaults = (date: Date) => {
    setHasShownLateNotice(false);
    autoMovedPickup.current = false;
    const gap = forSpecificCar === 'true' && liveSelectedCar ? carGapOn(liveSelectedCar, date) : null;
    if (gap) {
      setTempPickupTime(hourLabel(gap.from));
      const dayNum = toDayNum(date.getFullYear(), date.getMonth(), date.getDate());
      const dateEndMs = dayNumAndTimeToMs(dayNum, '11:59 PM', 1439);
      if (gap.until && gap.until <= dateEndMs && getIndiaDateParts(gap.until).hours < 20) {
        setTempReturnTime(hourLabel(gap.until));
      } else {
        setTempReturnTime(SAME_DAY_RETURN);
      }
    } else {
      setTempReturnTime(SAME_DAY_RETURN);
    }
  };

  // True Date Range Picker Logic
  const handlePress = (date: Date) => {
    if (isDisabledDay(date)) return;
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // If both are selected
    if (start && end) {
      if (date.getTime() === start.getTime()) {
        // Tapping start date deselects end date (leaves only start selected)
        setEnd(null);
        setTempReturnTime(SAME_DAY_RETURN);
        setHasShownLateNotice(false);
      } else if (date.getTime() === end.getTime()) {
        // Tapping end date deselects end date
        setEnd(null);
        setTempReturnTime(SAME_DAY_RETURN);
        setHasShownLateNotice(false);
      } else if (date > start && endsTrip(date)) {
        // Tapping another valid date after start changes the end date
        setEnd(date);
        setTempReturnTime(DAY_TIME);
        setHasShownLateNotice(false);
      } else {
        // Start fresh with this date as the new start
        setStart(date);
        setEnd(null);
        startDefaults(date);
      }
      return;
    }
    
    // If only start is selected
    if (start && !end) {
      if (date < start) {
        // Picked a date before start, make it the new start
        setStart(date);
        setEnd(null);
        startDefaults(date);
      } else if (date.getTime() === start.getTime()) {
        // Tapping the same start date again → deselect it entirely
        setStart(null);
        setEnd(null);
        setTempReturnTime(DAY_TIME);
        setHasShownLateNotice(false);
      } else if (!endsTrip(date)) {
        // The car is booked in between: this day starts a new trip instead.
        setStart(date);
        setEnd(null);
        startDefaults(date);
      } else {
        // Picked a date after start, make it the end: a multi-day trip, back to 8 AM drop-off.
        setEnd(date);
        setTempReturnTime(DAY_TIME);
        setHasShownLateNotice(false);
      }
      return;
    }
    
    // Default fallback (no dates selected)
    setStart(date);
    setEnd(null);
    startDefaults(date);
  };

  const handleClear = () => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStart(null);
    setEnd(null);
    setTempPickupTime('8:00 AM');
    setTempReturnTime('8:00 AM');
    setHasShownLateNotice(false);
  };

  const formatDateStr = (date: Date | null) => {
    if (!date) return 'Select';
    return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  };

  // Only a start date picked: a same-day trip (counted as 1 day). Tapping another date sets the real end.
  const effectiveEnd = end || start;
  const isSameDay = !!(start && effectiveEnd && start.getTime() === effectiveEnd.getTime());
  const rentalDays = start ? calculateRentalDays(formatDateStr(start), formatDateStr(effectiveEnd), tempPickupTime || '8:00 AM', tempReturnTime || '8:00 AM') : 0;
  const canApply = start !== null && effectiveEnd !== null && tempPickupTime !== null && tempReturnTime !== null;

  // Today: hours that have already passed are hidden from the Pickup wheel (3:43 PM → 4 PM onwards).
  const isToday = (d: Date | null) => !!d && d.getTime() === today.getTime();
  const firstHourToday = getIndiaDateParts().hours + 1;
  const hourOf = (time: string) => { const i = ALL_TIMES.indexOf(time); return i < 0 ? -1 : Math.floor(i / 2); };

  // With a pickup day chosen: can the trip end on `date`? Not past the car's next booking (8 AM return rule).
  const returnBlocked = (date: Date) => {
    if (!start || !liveSelectedCar) return true;
    const startDayNum = toDayNum(start.getFullYear(), start.getMonth(), start.getDate());
    const dateDayNum = toDayNum(date.getFullYear(), date.getMonth(), date.getDate());
    const pickupH = hourOf(tempPickupTime || DAY_TIME);
    const startPickupMs = dayNumAndTimeToMs(startDayNum, tempPickupTime || '08:00 AM', pickupH >= 0 ? pickupH * 60 : 480);
    const nextBlock = buildBlocks(liveSelectedCar, todayDayNum())
      .filter((b) => Number.isFinite(b.startMs))
      .sort((x, y) => x.startMs - y.startMs)
      .find((b) => b.startMs > startPickupMs);
    if (!nextBlock) return false; // nothing booked after pickup
    const nb = getIndiaDateParts(nextBlock.startMs);
    const nbDayNum = toDayNum(nb.year, nb.month, nb.date);
    if (dateDayNum > nbDayNum) return true; // would run through the next booking
    if (dateDayNum === nbDayNum) {
      // Same day: needs an hour before the booking; later day: the 8 AM return must be before it.
      return dateDayNum === startDayNum ? nextBlock.startMs - startPickupMs < HOUR : nb.hours < 8;
    }
    return false;
  };

  // A day is greyed out only when the car can neither be picked up nor returned on it. After a pickup day is
  // chosen, later days the car is free on stay tappable: they start a new trip if they can't end this one.
  const isDisabledDay = (date: Date) => {
    if (date < today) return true;
    if (isToday(date) && firstHourToday > 23) return true; // no pickup hour left today
    if (forSpecificCar === 'true' && liveSelectedCar) {
      const pickupOk = !!carGapOn(liveSelectedCar, date);
      if (start && date.getTime() === start.getTime()) return false; // tapping the start day deselects it
      if (start && date > start) return !pickupOk && returnBlocked(date);
      return !pickupOk;
    }
    return false;
  };

  // Tapping a later day ends the trip there when the car allows it; otherwise it becomes the new pickup day.
  const endsTrip = (date: Date) => !(forSpecificCar === 'true' && liveSelectedCar) || !returnBlocked(date);

  const handlePickupTime = (time: string) => {
    Haptics.selectionAsync();
    const timeIndex = ALL_TIMES.indexOf(time);
    if (timeIndex !== -1 && timeIndex < 16) {
      setShowEarlyPickupModal(true);
      return false;
    }
    setTempPickupTime(time);
    return true;
  };

  const handleReturnTime = (time: string) => {
    Haptics.selectionAsync();
    const timeIndex = ALL_TIMES.indexOf(time);
    if (timeIndex !== -1 && timeIndex < 16) {
      setShowEarlyPickupModal(true);
      return false;
    }
    if (start && effectiveEnd) {
      const isSameDaySelection = start.getTime() === effectiveEnd.getTime();
      if (!isSameDaySelection) {
        if (timeIndex > 16 && !hasShownLateNotice) {
          setShowLateReturnModal(true);
          setHasShownLateNotice(true);
        } else if (timeIndex <= 16) {
          setHasShownLateNotice(false);
        }
      }
    }
    setTempReturnTime(time);
    return true;
  };

  // "14 Nov, 10:00 AM" in India time, for the free-window note.
  const whenLabel = (ms: number) => `${getIndiaDateParts(ms).date} ${MONTHS[getIndiaDateParts(ms).month]}, ${hourLabel(ms)}`;
  // When the car is free around the chosen start day, else the next day it is.
  const freeWindowNote = (car: any, from: Date) => {
    const gapNote = (g: { from: number; until: number | null }) =>
      g.until ? `Free from ${whenLabel(g.from)} until ${whenLabel(g.until)}.` : `Free from ${whenLabel(g.from)}, with no booking after that.`;
    const here = carGapOn(car, from);
    if (here) return `On your pickup day: ${gapNote(here)}`;
    for (let i = 1; i <= 90; i++) {
      const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + i);
      const g = carGapOn(car, d);
      if (g) return `Next available: ${gapNote(g)}`;
    }
    return 'No free dates in the next 90 days.';
  };

  // For one car or bike: whether it is free for the chosen dates and times, shown above the button as you pick.
  const availLine = (() => {
    if (forSpecificCar !== 'true' || !liveSelectedCar || !start) return null;
    const noun = liveSelectedCar.type === 'Bike' ? 'Bike' : 'Car';
    if (deal && isOffDay(start) && (!end || end.getTime() === start.getTime())) {
      return { ok: true, text: `Today's Deal: ${noun} available until ${formatTime12(deal.endMs)}` };
    }
    const ok = checkCarAvailability(liveSelectedCar, formatDateStr(start), formatDateStr(effectiveEnd), tempPickupTime || '8:00 AM', tempReturnTime || '8:00 AM');
    return ok
      ? { ok: true, text: `${noun} is available for your dates` }
      : { ok: false, text: `${noun} is not available for these dates. ${freeWindowNote(liveSelectedCar, start)}` };
  })();

  const handleApply = () => {
    if (!start) return;
    // Only the "OFF" day chosen: book the Today's Deal itself (hourly price, its own hours), as the deal card does.
    if (deal && liveSelectedCar && isOffDay(start) && (!end || end.getTime() === start.getTime())) {
      const startMs = Math.max(deal.startMs, Math.floor(Date.now() / 60000) * 60000);
      const hours = Math.max(1, Math.ceil(Math.max(0, deal.endMs - startMs) / HOUR));
      const perDay = Number(liveSelectedCar.perDay || 0);
      const dealPrice = Math.min(perDay || Infinity, deal.rate * hours);
      const label = (ms: number) => { const q = getIndiaDateParts(ms); return dayNumToLabel(toDayNum(q.year, q.month, q.date)); };
      selectCar({ ...liveSelectedCar, hourlyRate: deal.rate } as any);
      applyCoupon(`TOPDEAL-${hours}`);
      setDates(`${label(startMs)} – ${label(deal.endMs)}`, '1 Day');
      setTimes(formatTime12(startMs), formatTime12(deal.endMs));
      router.replace({
        pathname: '/car-details',
        params: {
          id: String(liveSelectedCar.id), vehicleId: String(liveSelectedCar.id), lockDates: 'true', isFixedDates: 'true', isTopDeal: 'true',
          pickupTime: formatTime12(startMs), returnTime: formatTime12(deal.endMs),
          dealPrice: String(dealPrice), hourlyPrice: String(deal.rate), rentalHours: String(hours),
        },
      });
      return;
    }
    const finalReturnTime = tempReturnTime || '8:00 AM';
    const finalPickupTime = tempPickupTime || '8:00 AM';
    if (forSpecificCar === 'true' && liveSelectedCar) {
      const isAvail = checkCarAvailability(liveSelectedCar, formatDateStr(start), formatDateStr(effectiveEnd), finalPickupTime, finalReturnTime);
      if (!isAvail) {
        if (fromDestination === 'true') {
          // Check if another vehicle of the same type is available
          const altCar = fetchedVehicles.find((v) => v.type === liveSelectedCar.type && checkCarAvailability(v, formatDateStr(start), formatDateStr(effectiveEnd), finalPickupTime, finalReturnTime));
          if (altCar) {
            selectCar(altCar);
          } else {
            setUnavailable({ title: 'Vehicles In High Demand', body: 'Vehicles are not available for these selected dates. Please choose different dates.' });
            return;
          }
        } else {
          setUnavailable({ title: 'Car Not Available', body: 'The selected car is not available for these dates. Please choose different dates.', note: freeWindowNote(liveSelectedCar, start) });
          return;
        }
      }
    }

    setDates(`${formatDateStr(start)} – ${formatDateStr(effectiveEnd)}`, `${rentalDays} Day${rentalDays !== 1 ? 's' : ''}`);
    setTimes(finalPickupTime, finalReturnTime);
    
    import('@/services/api/activity').then(({ ActivityAPI }) => {
      ActivityAPI.logActivity('select_dates', 'DatesSheet', { 
        startDate: formatDateStr(start), 
        endDate: formatDateStr(effectiveEnd),
        pickupTime: finalPickupTime,
        returnTime: finalReturnTime,
        rentalDays
      });
    });

    if (thenBook === 'true' && isAuthenticated) {
      // Book Now: straight to payment (payment page handles pickup & drop)
      router.replace('/booking');
    } else if (forSpecificCar === 'true' || thenLocation === 'true' || fromDestination === 'true') {
      router.replace('/car-details');
    } else if (returnBack === 'true') {
      router.back();
    } else {
      // Swap this page for the results. Back from the results returns to Home.
      router.replace('/search');
    }
  };

  // Pickup: every whole hour (before 8 AM opens the Early Pickup popup); for today only the hours still ahead.
  const pickupTimes = ALL_TIMES.filter(isWholeHour).filter((t) => !isToday(start) || hourOf(t) >= firstHourToday);
  const startKey = start?.getTime();
  // Today with a pickup hour that has passed → the first hour still ahead (8 AM if it's before 8).
  // Moving to another date afterwards puts the pickup back to 8 AM.
  const autoMovedPickup = useRef(false);
  useEffect(() => {
    if (isToday(start)) {
      if (hourOf(tempPickupTime || DAY_TIME) >= firstHourToday) return;
      autoMovedPickup.current = true;
      setTempPickupTime(ALL_TIMES[Math.max(firstHourToday, 8) * 2]);
    } else if (start && autoMovedPickup.current) {
      autoMovedPickup.current = false;
      setTempPickupTime(DAY_TIME);
    }
  }, [startKey]); // eslint-disable-line react-hooks/exhaustive-deps
  // Same day: drop-off any whole hour after pickup (pickup 8 AM → 9 AM … 11 PM). Multi-day: every hour.
  const pickupHour = hourOf(tempPickupTime || DAY_TIME);
  const returnTimes = ALL_TIMES.filter(isWholeHour).filter((t) => !isSameDay || hourOf(t) > pickupHour);
  // Keep a same-day drop-off after the pickup: 8 PM by default, else the last hour of the day.
  // A pickup at 11 PM leaves no same-day hour, so the trip becomes 8 AM the next day.
  const endKey = effectiveEnd?.getTime();
  useEffect(() => {
    if (!start || !isSameDay) return;
    if (hourOf(tempReturnTime || DAY_TIME) > pickupHour) return;
    if (returnTimes.length === 0) {
      setEnd(new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1));
      setTempReturnTime(DAY_TIME);
      return;
    }
    setTempReturnTime(hourOf(SAME_DAY_RETURN) > pickupHour ? SAME_DAY_RETURN : returnTimes[returnTimes.length - 1]);
  }, [startKey, endKey, pickupHour]); // eslint-disable-line react-hooks/exhaustive-deps
  const wheel: WheelPalette = { card: isDarkMode ? colors.card : '#F9F9FB', box: ui.page, boxBorder: isDarkMode ? colors.border : '#EAECF1', selected: ui.chipText, idle: ui.muted };

  return (
    <View style={[styles.page, { backgroundColor: ui.page }]}>
      {/* One fixed screen, not a scrolling page: only the month list inside the calendar scrolls. */}
      <View style={[styles.content, { flex: 1, paddingTop: insets.top + 8 }]}>
        <View style={styles.headGroup}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: ui.text }]}>Select your date & time</Text>
          <Pressable onPress={handleClear} hitSlop={10} accessibilityRole="button">
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        </View>
        <Text style={[styles.note, { color: ui.muted }]}>*Note: 1 days = 8 AM to 8 AM the next days.</Text>
        </View>

        {/* Trip summary: start on the left, end on the right, day count on the dashed arc between. */}
        <View style={[styles.summary, { backgroundColor: ui.card, borderColor: ui.cardBorder }]}>
          <View style={styles.summarySide}>
            <Text style={[styles.summaryText, styles.summaryDate, { color: ui.text }]}>{start ? formatDateStr(start) : 'Start Date'}</Text>
            <Text style={[styles.summaryText, { color: ui.text }]}>{start && tempPickupTime ? padTime(tempPickupTime) : 'Pickup Time'}</Text>
          </View>
          {/* <View style={styles.summaryMid}> */}
            {/* <Svg width={162} height={34} viewBox="0 0 162 34" style={StyleSheet.absoluteFill}>
              <Path d="M5 16.5 Q81 0.5 157 16.5" stroke={ui.dash} strokeWidth={1} strokeDasharray="4 3" fill="none" />
              <Circle cx={5} cy={16.5} r={4.25} fill={ui.page} stroke={ui.navy} strokeWidth={2.5} />
              <Circle cx={157} cy={16.5} r={4.25} fill={ui.page} stroke={ui.navy} strokeWidth={2.5} />
            </Svg> */}
            <View style={styles.summaryMid}>
  <Svg
    width={162}
    height={34}
    viewBox="0 0 162 34"
    style={StyleSheet.absoluteFill}
  >
    <Defs>
  <SvgLinearGradient
    id="dashGradient"
    x1={0}
    y1={0}
    x2={150}
    y2={0}
    gradientUnits="userSpaceOnUse"
  >
    <Stop offset="0%" stopColor={ui.dash} stopOpacity={0} />
    <Stop offset="50%" stopColor={ui.dash} stopOpacity={1} />
    <Stop offset="100%" stopColor={ui.dash} stopOpacity={0} />
  </SvgLinearGradient>
</Defs>

    {/* Gradient dashed connecting line */}
    <Path
      d="M5 16.5 Q81 0.5 157 16.5"
      stroke="url(#dashGradient)"
      strokeWidth={1.5}
      strokeDasharray="5 4"
      fill="none"
    />

    {/* Left circle */}
    <Circle
      cx={6}
      cy={16.5}
      r={4.25}
      fill={ui.page}
      stroke={ui.navy}
      strokeWidth={2.5}
    />

    {/* Right circle */}
    <Circle
      cx={155}
      cy={16.5}
      r={4.25}
      fill={ui.page}
      stroke={ui.navy}
      strokeWidth={2.5}
    />
  </Svg>
            <Text style={[styles.summaryText, styles.summaryDays, { color: ui.text }]}>
              {rentalDays} {rentalDays === 1 ? 'day' : 'days'}
            </Text>
          </View>
          <View style={[styles.summarySide, { alignItems: 'flex-end' }]}>
            <Text style={[styles.summaryText, styles.summaryDate, { color: ui.text }]}>{effectiveEnd ? formatDateStr(effectiveEnd) : 'End Date'}</Text>
            <Text style={[styles.summaryText, { color: ui.text }]}>{effectiveEnd && tempReturnTime ? padTime(tempReturnTime) : 'Dropoff Time'}</Text>
          </View>
        </View>

        <View style={styles.dateBlock}>
        <Text style={[styles.section, { color: ui.text }]}>Select Date</Text>
        <View style={styles.weekHeader}>
          {WEEKDAYS.map((d, i) => (
            <Text key={i} style={[styles.weekDay, { color: ui.muted }]}>{d}</Text>
          ))}
        </View>

        <View style={styles.calendar}>
        <Animated.ScrollView
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          style={[styles.calendarScroll, { backgroundColor: ui.calendar }]}
          contentContainerStyle={styles.calendarContent}
          scrollEventThrottle={16}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: calScroll } } }], { useNativeDriver: true })}
          onLayout={(e) => { const view = e.nativeEvent.layout.height; setCalSize((c) => ({ ...c, view })); }}
          onContentSizeChange={(_, h) => setCalSize((c) => ({ ...c, content: h }))}
        >
          {months.map((m) => {
            const weeks = monthWeeks(m.getFullYear(), m.getMonth());
            return (
              <View key={m.toISOString()}>
                <Text style={[styles.monthName, { color: ui.month }]}>{MONTH_NAMES[m.getMonth()]} {m.getFullYear()}</Text>
                {weeks.map((week, w) => (
                  <View key={w} style={styles.week}>
                    {week.map((date, col) => {
                      if (!date) return <View key={col} style={styles.dayCell} />;
                      const disabled = isDisabledDay(date);
                      const isStart = !!start && date.getTime() === start.getTime();
                      const isEnd = !!effectiveEnd && date.getTime() === effectiveEnd.getTime();
                      const selected = isStart || isEnd;
                      const ranged = !!(start && effectiveEnd && start.getTime() !== effectiveEnd.getTime() && date >= start && date <= effectiveEnd);
                      const nextDay = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);
                      const rowStart = col === 0 || date.getDate() === 1;
                      const rowEnd = col === 6 || nextDay.getMonth() !== date.getMonth();
                      return (
                        <View key={col} style={styles.dayCell}>
                          {ranged && (
                            <View
                              style={[
                                styles.band,
                                { backgroundColor: ui.band },
                                isStart ? { left: '50%' } : rowStart && styles.bandLeftEdge,
                                isEnd ? { right: '50%' } : rowEnd && styles.bandRightEdge,
                              ]}
                            />
                          )}
                          <Pressable
                            accessibilityRole="button"
                            accessibilityState={{ selected, disabled }}
                            disabled={disabled}
                            onPress={() => handlePress(date)}
                            // Plain tap only: no highlight tint and no dim while pressing. The circle
                            // appears on the date once it is actually chosen.
                            android_disableSound
                            style={({ pressed }) => [
                              styles.dayCircle,
                              selected && { backgroundColor: ui.sel },
                              pressed && !selected && { backgroundColor: 'transparent' },
                              !selected && isOffDay(date) && { borderWidth: 1.5, borderColor: '#6B5AED' },
                            ]}
                          >
                            {isOffDay(date) && (
                              // Figma Frame 2147226285: tilted "OFF" tag on the deal day (white on a chosen day, purple otherwise).
                              <View pointerEvents="none" style={[styles.offTag, selected ? { backgroundColor: '#FFFFFF' } : { backgroundColor: '#6B5AED' }]}>
                                <Text style={[styles.offText, { color: selected ? '#6B5AED' : '#FFFFFF' }]} allowFontScaling={false}>OFF</Text>
                              </View>
                            )}
                            <Text
                              style={[
                                styles.dayText,
                                { color: selected ? ui.onNavy : disabled ? ui.past : ui.text },
                                disabled && !selected && date < today && styles.struck,
                              ]}
                            >
                              {date.getDate()}
                            </Text>
                          </Pressable>
                        </View>
                      );
                    })}
                  </View>
                ))}
              </View>
            );
          })}
        </Animated.ScrollView>
        {calSize.content > calSize.view && (
          <Animated.View pointerEvents="none" style={[styles.calThumb, { transform: [{ translateY: calThumbY }] }]} />
        )}
        </View>
        </View>

        <View style={styles.wheels}>
          <TimeWheel title="Pickup Time" times={pickupTimes} value={tempPickupTime || '8:00 AM'} onPick={handlePickupTime} p={wheel} titleColor={ui.month} />
          <TimeWheel title="Dropoff Time" times={returnTimes} value={tempReturnTime || '8:00 AM'} onPick={handleReturnTime} p={wheel} titleColor={ui.month} />
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: ui.page }]}>
        {availLine && (
          <View style={styles.availRow} accessibilityLiveRegion="polite">
            <Ionicons name={availLine.ok ? 'checkmark-circle' : 'close-circle'} size={14} color={availLine.ok ? '#339F79' : '#D04646'} />
            <Text style={[styles.availText, { color: availLine.ok ? '#339F79' : '#D04646' }]} numberOfLines={2}>{availLine.text}</Text>
          </View>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canApply }}
          disabled={!canApply}
          onPress={handleApply}
          style={({ pressed }) => [styles.cta, { backgroundColor: ui.navy }, !canApply && styles.ctaDisabled, pressed && { opacity: 0.9 }]}
        >
          <Text style={[styles.ctaText, { color: ui.onNavy }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            Search
          </Text>
        </Pressable>
      </View>

      {/* Figma "Early Pickup / Return": before 8 AM is arranged with the team. The round close button sits under the card. */}
      <Modal visible={showEarlyPickupModal} transparent animationType="fade" onRequestClose={() => setShowEarlyPickupModal(false)} statusBarTranslucent navigationBarTranslucent>
        <View style={styles.popupOverlay}>
          <ModalBlur />
          <View style={[styles.early, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
            <View style={[styles.earlyBadge, { backgroundColor: ui.navy }]}>
              <Text style={styles.earlyBadgeText}>!</Text>
            </View>
            {/* Figma 333×77: 29 title + 8 gap + two 20px body lines. */}
            <View style={styles.earlyCopy}>
            <Text style={[styles.earlyTitle, { color: ui.text, lineHeight: 29, marginTop: 0 }]}>Early Pickup / Return</Text>
            <Text style={[styles.earlyBody, { color: ui.muted, marginTop: 0, paddingHorizontal: 0, fontFamily: 'PlusJakartaSans_500Medium' }]}>
              For pickup or return timings before 8:00 AM, please contact our team to confirm availability.
            </Text>
            </View>
            <View style={styles.earlyActions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="WhatsApp us"
                onPress={() => Linking.openURL(SUPPORT_WHATSAPP_URL).catch(() => {})}
                style={({ pressed }) => [styles.earlyBtn, styles.earlyWa, pressed && { opacity: 0.85 }]}
              >
                <FontAwesome name="whatsapp" size={18} color="#25D366" />
                <Text style={styles.earlyWaText}>WhatsApp Us</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Call us"
                onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {})}
                style={({ pressed }) => [styles.earlyBtn, styles.earlyCall, { backgroundColor: ui.navy }, pressed && { opacity: 0.85 }]}
              >
                {/* Figma: 18px frame holding a glyph inset 8.33% (15px). */}
                <View style={{ width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="call" size={15} color="#FFFFFF" />
                </View>
                <Text style={styles.earlyCallText}>Call Us</Text>
              </Pressable>
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            onPress={() => setShowEarlyPickupModal(false)}
            style={({ pressed }) => [styles.earlyClose, { backgroundColor: isDarkMode ? colors.card : '#FAFAFA' }, pressed && { opacity: 0.7 }]}
          >
            <Svg width={20} height={20} viewBox="0 0 20 20">
              <Path d="M5 5L15 15M15 5L5 15" stroke={ui.muted} strokeWidth={1.2} strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>
      </Modal>

      {/* Figma "Late Return": returning after 8 AM adds a day. Same card as Early Pickup, round close button under it. */}
      <Modal visible={showLateReturnModal} transparent animationType="fade" onRequestClose={() => setShowLateReturnModal(false)} statusBarTranslucent navigationBarTranslucent>
        <View style={styles.popupOverlay}>
          <ModalBlur />
          <View style={[styles.early, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
            <Ionicons name="warning" size={30} color="#FACC15" />
            <View style={styles.earlyCopy}>
            <Text style={[styles.earlyTitle, { color: ui.text, lineHeight: 29, marginTop: 0 }]}>Late Return</Text>
            <Text style={[styles.earlyBody, { color: ui.muted, marginTop: 0, paddingHorizontal: 0, fontFamily: 'PlusJakartaSans_500Medium' }]}>
              Our standard rental day ends at 8:00 AM. Returning after this time adds{' '}
              <Text style={[styles.lateExtra, { color: ui.navy }]}>1 extra day</Text> to your rental.
            </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setShowLateReturnModal(false)}
              style={({ pressed }) => [styles.lateBtn, { backgroundColor: ui.navy }, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.lateBtnText}>Understood</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            onPress={() => setShowLateReturnModal(false)}
            style={({ pressed }) => [styles.earlyClose, { backgroundColor: isDarkMode ? colors.card : '#FAFAFA' }, pressed && { opacity: 0.7 }]}
          >
            <Svg width={20} height={20} viewBox="0 0 20 20">
              <Path d="M5 5L15 15M15 5L5 15" stroke={ui.muted} strokeWidth={1.2} strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>
      </Modal>

      {/* Car not available for the chosen dates: same card as Late Return, with when the car is free. */}
      <Modal visible={!!unavailable} transparent animationType="fade" onRequestClose={() => setUnavailable(null)} statusBarTranslucent navigationBarTranslucent>
        <View style={styles.popupOverlay}>
          <ModalBlur />
          <View style={[styles.early, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
            <Ionicons name="warning" size={30} color="#FACC15" />
            <View style={styles.earlyCopy}>
              <Text style={[styles.earlyTitle, { color: ui.text, lineHeight: 29, marginTop: 0 }]}>{unavailable?.title}</Text>
              <Text style={[styles.earlyBody, { color: ui.muted, marginTop: 0, paddingHorizontal: 0, fontFamily: 'PlusJakartaSans_500Medium' }]}>
                {unavailable?.body}
                {!!unavailable?.note && <Text style={[styles.lateExtra, { color: ui.navy }]}>{'\n'}{unavailable.note}</Text>}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => setUnavailable(null)}
              style={({ pressed }) => [styles.lateBtn, { backgroundColor: ui.navy }, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.lateBtnText}>Choose different dates</Text>
            </Pressable>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={8}
            onPress={() => setUnavailable(null)}
            style={({ pressed }) => [styles.earlyClose, { backgroundColor: isDarkMode ? colors.card : '#FAFAFA' }, pressed && { opacity: 0.7 }]}
          >
            <Svg width={20} height={20} viewBox="0 0 20 20">
              <Path d="M5 5L15 15M15 5L5 15" stroke={ui.muted} strokeWidth={1.2} strokeLinecap="round" />
            </Svg>
          </Pressable>
        </View>
      </Modal>

    </View>
  );
}

// Figma "Select your date & time" page (393pt frame, 16pt gutters).
const styles = StyleSheet.create({
  page: { flex: 1 },
  // Figma content frame: padding 8/16, 12 between the heading group, summary, calendar and time wheels.
  content: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  headGroup: { gap: 4 },
  dateBlock: { flex: 1, gap: 4 },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  backBtn: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  destField: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    height: 49,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  destText: { flex: 1, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, lineHeight: 22 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 29 },
  clear: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#DC2626' },
  // Figma: title row 29 + 4 gap + note 17 = the 50px frame.
  note: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 17 },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 62,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  summaryText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16 },
  summaryDate: { fontFamily: 'PlusJakartaSans_600SemiBold' },
  summarySide: { flex: 1 },
  // Dashed arc peaks above the day count; the two navy rings sit level with it.
  summaryMid: { width: 162, height: 34, alignItems: 'center' },
  summaryDays: { marginTop: 14.5 },
  // Figma: title 23 + 4 + weekday/calendar block 304 = the 331px frame.
  section: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 23 },
  weekHeader: { flexDirection: 'row' },
  weekDay: { flex: 1, textAlign: 'center', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },
  // Takes whatever height is left between the date row and the time wheels (Figma: 4 under the weekday row).
  calendar: { flex: 1, minHeight: 180 },
  calendarScroll: { flex: 1, borderRadius: 8 },
  // right: -7 = 9 from the screen edge, in the 16px gutter outside the calendar box (Figma).
  calThumb: { position: 'absolute', top: 0, right: -7, width: 4, height: CAL_THUMB_H, borderRadius: 20, backgroundColor: '#E5E5E5' },
  calendarContent: { paddingBottom: 8 },
  monthName: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 24, paddingLeft: 8, paddingTop: 4 },
  week: { flexDirection: 'row' },
  dayCell: { flex: 1, height: 36, alignItems: 'center', justifyContent: 'center' },
  band: { position: 'absolute', top: 1, bottom: 1, left: 0, right: 0 },
  bandLeftEdge: { left: 4, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
  bandRightEdge: { right: 4, borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  // opaque by default so a tap can override the platform's press tint with this same colour
  dayCircle: { width: 36, height: 36, borderRadius: 18, paddingBottom: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent'},
  dayText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 },
  struck: { textDecorationLine: 'line-through' },
  availRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, marginBottom: 8, paddingHorizontal: 4 },
  availText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16.5, flexShrink: 1, textAlign: 'center' },
  offTag: { position: 'absolute', top: -6, left: 18 - 11.5 - 10.36, width: 23, height: 14, borderRadius: 10, borderWidth: 1, borderColor: '#6B5AED', paddingHorizontal: 2, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-29.06deg' }], zIndex: 1 },
  offText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 8, lineHeight: 12, includeFontPadding: false },
  wheels: {
  flexDirection: 'row',
  gap: 12,
  height: 146,
},

wheelCard: {
  flex: 1,
  borderRadius: 8,
  padding: 4,
  gap: 8,
},

wheelTitle: {
  fontFamily: 'PlusJakartaSans_600SemiBold',
  fontSize: 15,
  lineHeight: 22.5,
  textAlign: 'center',
},

wheel: {
  height: WINDOW,
  overflow: 'hidden',
},

wheelBox: {
  position: 'absolute',
  left: 0,
  right: 0,
  top: WINDOW / 2 - 15,
  height: 30,
  borderRadius: 6,
  borderWidth: 1,
},

wheelRow: {
  height: ROW,
  alignItems: 'center',
  justifyContent: 'center',
  paddingHorizontal: 6,
},

wheelText: {
  fontFamily: 'PlusJakartaSans_600SemiBold',
  fontSize: 13,
  lineHeight: 17,
},
  // Figma footer: 393×86 = 16 + 54 button + 16 (plus the device's bottom inset).
  footer: { paddingHorizontal: 16, paddingTop: 16 },
  cta: { height: 54, padding: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28, textAlign: 'center' },
  // Figma popups: white card (radius 16) over a dimmed page, round close button underneath.
  popupOverlay: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, gap: 12 },
  // Figma "Early Pickup / Return" (357 wide): badge 30, title 18, body 13/20, WhatsApp 44 tall + Call 47 tall
  // side by side 12 apart, then the round 32 close button 12 under the card.
  early: { width: '100%', maxWidth: 357, borderRadius: 12, paddingHorizontal: 12, paddingTop: 20, paddingBottom: 12, alignItems: 'center' },
  earlyBadge: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  earlyBadgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, lineHeight: 20, color: '#FFFFFF' },
  earlyTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 26, textAlign: 'center', marginTop: 16 },
  earlyBody: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, lineHeight: 20, textAlign: 'center', paddingHorizontal: 8, marginTop: 10 },
  earlyCopy: { alignSelf: 'stretch', gap: 8, marginTop: 16 },
  earlyActions: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, alignSelf: 'stretch', marginTop: 23 },
  earlyBtn: { flex: 1, borderRadius: 8, padding: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  earlyWa: { height: 44, backgroundColor: '#F0FDF4' },
  earlyWaText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20, color: '#25D366', includeFontPadding: false, textAlignVertical: 'center' },
  earlyCall: { height: 47 },
  earlyCallText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22, color: '#FFFFFF', includeFontPadding: false, textAlignVertical: 'center' },
  // Figma "Frame 21": 32px #FAFAFA circle, 30 radius, with a 20px frame holding a 10px X (25% inset) in 1.2px #737373.
  earlyClose: { width: 32, height: 32, borderRadius: 30, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFAFA' },
  // Figma "Late Return": warning 30, title 19, body 13/20 with "1 extra day" in navy, full-width 46 button.
  lateExtra: { fontFamily: 'PlusJakartaSans_600SemiBold' },
  lateBtn: { alignSelf: 'stretch', height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  lateBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22, color: '#FFFFFF' },
});