import React, { useState, useRef, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView, LayoutAnimation, Alert, Linking, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
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
import { checkCarAvailability } from '@/utils/sawari';
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

function PinOutline({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" stroke={color} strokeWidth={1.44} strokeLinecap="round" strokeLinejoin="round" />
      <Circle cx={12} cy={10} r={3} stroke={color} strokeWidth={1.44} />
    </Svg>
  );
}

function Chevron({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M7.5 15L12.5 10L7.5 5" stroke={color} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Figma wheel: 142pt window, selected row 40pt in the middle, neighbours 30pt rows 2pt apart
// (centre-to-centre 37pt), faded out towards both edges.
const ROW = 37;
const WINDOW = 120;
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

  // Keep the wheel on the current value (first render, Clear, refused picks, same-day list change).
  useEffect(() => {
    const t = setTimeout(() => ref.current?.scrollTo({ y: index * ROW, animated: false }), 0);
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
          decelerationRate="fast"
          contentContainerStyle={{ paddingVertical: EDGE_PAD }}
          onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.y)}
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
  const { returnBack, fresh, forSpecificCar, fromDestination } = useLocalSearchParams<{
    returnBack?: string;
    fresh?: string;
    forSpecificCar?: string;
    fromDestination?: string;
  }>();
  const freshPick = fresh === 'true';
  const { data: fetchedVehicles = [] } = useVehicles();
  const { setDates, setTimes, dateRange, pickupTime, returnTime, selectedCar, selectCar, dropoff, isDarkMode } = useSawari();

  // Figma palette in light mode; dark mode keeps the theme tokens.
  const ui = isDarkMode
    ? { page: colors.background, text: colors.foreground, muted: colors.mutedForeground, border: colors.border, card: colors.card, cardBorder: colors.border, calendar: colors.card, month: colors.mutedForeground, band: colors.tintLight, navy: colors.primary, onNavy: colors.primaryForeground, past: colors.mutedForeground, chipText: colors.primaryText, dash: colors.mutedForeground }
    : { page: '#FFFFFF', text: '#262626', muted: '#737373', border: '#D4D4D4', card: '#F5F6FA', cardBorder: '#E7EAF4', calendar: '#F8F8FA', month: '#525252', band: '#E9EAF1', navy: '#2F3E75', onNavy: '#FFFFFF', past: '#A3A3A3', chipText: '#2F3E75', dash: '#A3A8C3' };

  const today = new Date();
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

  const months = Array.from({ length: MONTHS_AHEAD }, (_, i) => new Date(today.getFullYear(), today.getMonth() + i, 1));

  // True Date Range Picker Logic
  const handlePress = (date: Date) => {
    if (date < today) return; 
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    // If both are selected, reset and start fresh with this date as the new start
    if (start && end) {
      setStart(date);
      setEnd(null);
      setTempReturnTime(SAME_DAY_RETURN);
      setHasShownLateNotice(false);
      return;
    }
    
    // If only start is selected
    if (start && !end) {
      if (date < start) {
        // Picked a date before start, make it the new start
        setStart(date);
        setEnd(null);
        setTempReturnTime(SAME_DAY_RETURN);
        setHasShownLateNotice(false);
      } else if (date.getTime() === start.getTime()) {
        // Tapping the same start date again → deselect it entirely
        setStart(null);
        setEnd(null);
        setTempReturnTime(DAY_TIME);
        setHasShownLateNotice(false);
      } else {
        // Picked a date after start, make it the end: a multi-day trip, back to 8 AM drop-off.
        setEnd(date);
        setTempReturnTime(DAY_TIME);
        setHasShownLateNotice(false);
      }
      return;
    }
    
    // Default fallback (should never hit if initialized properly)
    setStart(date);
    setEnd(null);
    setTempReturnTime(SAME_DAY_RETURN);
    setHasShownLateNotice(false);
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
  const firstHourToday = new Date().getHours() + 1;
  const hourOf = (time: string) => { const i = ALL_TIMES.indexOf(time); return i < 0 ? -1 : Math.floor(i / 2); };

  const isDisabledDay = (date: Date) => {
    if (date < today) return true;
    if (isToday(date) && firstHourToday > 23) return true; // no pickup hour left today
    if (forSpecificCar === 'true' && selectedCar) {
      const dateStr = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
      return !checkCarAvailability(selectedCar, dateStr, dateStr);
    }
    return false;
  };

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

  const handleApply = () => {
    if (!start) return;
    const finalReturnTime = tempReturnTime || '8:00 AM';
    const finalPickupTime = tempPickupTime || '8:00 AM';
    if (forSpecificCar === 'true' && selectedCar) {
      const isAvail = checkCarAvailability(selectedCar, formatDateStr(start), formatDateStr(effectiveEnd));
      if (!isAvail) {
        if (fromDestination === 'true') {
          // Check if another vehicle of the same type is available
          const altCar = fetchedVehicles.find((v) => v.type === selectedCar.type && checkCarAvailability(v, formatDateStr(start), formatDateStr(effectiveEnd)));
          if (altCar) {
            selectCar(altCar);
          } else {
            Alert.alert('Vehicles In High Demand', 'Vehicles are not available for these selected dates. Please choose different dates.');
            return;
          }
        } else {
          Alert.alert('Car Not Available', 'The selected car is not available for these dates. Please choose different dates.');
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

    if (returnBack === 'true') {
      router.back();
    } else if (fromDestination === 'true') {
      // Flow from home Top Destination card: destination and car are already selected, proceed directly to car details
      router.replace('/car-details');
    } else if (forSpecificCar === 'true') {
      if (dropoff?.name) {
        // Destination already selected, return to car details directly
        router.replace('/car-details');
      } else {
        // Needs destination: go to dropoff
        router.replace({ pathname: '/dropoff', params: { forSpecificCar: 'true' } });
      }
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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topNavRow}>
          {/* <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={10}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backBtn,
              { backgroundColor: isDarkMode ? colors.card : '#F5F6FA', borderColor: ui.border },
              pressed && { opacity: 0.7 },
            ]}
          >
            <Feather name="chevron-left" size={22} color={ui.text} />
          </Pressable> */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Change destination"
            onPress={() => router.push({ pathname: '/dropoff', params: { returnBack: 'true' } })}
            style={[styles.destField, { flex: 1, borderColor: ui.border }]}
          >
            <PinOutline color={dropoff?.name ? ui.muted : ui.muted} />
            <Text style={[styles.destText, { color: dropoff?.name ? ui.muted : ui.muted }]} numberOfLines={1}>
              {dropoff?.name || 'Select your Destination'}
            </Text>
            <Chevron color={ui.muted} />
          </Pressable>
        </View>

        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: ui.text }]}>Select your date & time</Text>
          <Pressable onPress={handleClear} hitSlop={10} accessibilityRole="button">
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        </View>
        <Text style={[styles.note, { color: ui.muted }]}>*Note: 1 days = 8 AM to 8 AM the next days.</Text>

        {/* Trip summary: start on the left, end on the right, day count on the dashed arc between. */}
        <View style={[styles.summary, { backgroundColor: ui.card, borderColor: ui.cardBorder }]}>
          <View style={styles.summarySide}>
            <Text style={[styles.summaryText, { color: ui.text }]}>{start ? formatDateStr(start) : 'Start Date'}</Text>
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
            <Text style={[styles.summaryText, { color: ui.text }]}>{effectiveEnd ? formatDateStr(effectiveEnd) : 'End Date'}</Text>
            <Text style={[styles.summaryText, { color: ui.text }]}>{effectiveEnd && tempReturnTime ? padTime(tempReturnTime) : 'Dropoff Time'}</Text>
          </View>
        </View>

        <Text style={[styles.section, { color: ui.text }]}>Select Date</Text>
        <View style={styles.weekHeader}>
          {WEEKDAYS.map((d, i) => (
            <Text key={i} style={[styles.weekDay, { color: ui.muted }]}>{d}</Text>
          ))}
        </View>

        <ScrollView nestedScrollEnabled style={[styles.calendar, { backgroundColor: ui.calendar }]} contentContainerStyle={styles.calendarContent}>
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
                              selected && { backgroundColor: ui.navy },
                              pressed && !selected && { backgroundColor: 'transparent' },
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayText,
                                { color: selected ? ui.onNavy : disabled ? ui.past : ui.text },
                                disabled && styles.struck,
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
        </ScrollView>

        <View style={styles.wheels}>
          <TimeWheel title="Pickup Time" times={pickupTimes} value={tempPickupTime || '8:00 AM'} onPick={handlePickupTime} p={wheel} titleColor={ui.month} />
          <TimeWheel title="Dropoff Time" times={returnTimes} value={tempReturnTime || '8:00 AM'} onPick={handleReturnTime} p={wheel} titleColor={ui.month} />
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: ui.page }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canApply }}
          disabled={!canApply}
          onPress={handleApply}
          style={({ pressed }) => [styles.cta, { backgroundColor: ui.navy }, !canApply && styles.ctaDisabled, pressed && { opacity: 0.9 }]}
        >
          <Text style={[styles.ctaText, { color: ui.onNavy }]} numberOfLines={1}>
            {returnBack === 'true' || forSpecificCar === 'true' || fromDestination === 'true' ? 'Confirm Dates' : 'Search'}
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
            <Text style={[styles.earlyTitle, { color: ui.text }]}>Early Pickup / Return</Text>
            <Text style={[styles.earlyBody, { color: ui.muted }]}>
              For pickup or return timings before 8:00 AM, please contact our team to confirm availability.
            </Text>
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
                <FontAwesome name="phone" size={16} color="#FFFFFF" />
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
            <Feather name="x" size={18} color={ui.muted} />
          </Pressable>
        </View>
      </Modal>

      {/* Figma "Late Return": returning after 8 AM adds a day. Same card as Early Pickup, round close button under it. */}
      <Modal visible={showLateReturnModal} transparent animationType="fade" onRequestClose={() => setShowLateReturnModal(false)} statusBarTranslucent navigationBarTranslucent>
        <View style={styles.popupOverlay}>
          <ModalBlur />
          <View style={[styles.early, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
            <Ionicons name="warning" size={30} color="#FACC15" />
            <Text style={[styles.earlyTitle, { color: ui.text }]}>Late Return</Text>
            <Text style={[styles.earlyBody, styles.lateBody, { color: ui.muted }]}>
              Our standard rental day ends at 8:00 AM. Returning after this time adds{' '}
              <Text style={[styles.lateExtra, { color: ui.navy }]}>1 extra day</Text> to your rental.
            </Text>
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
            <Feather name="x" size={18} color={ui.muted} />
          </Pressable>
        </View>
      </Modal>

    </View>
  );
}

// Figma "Select your date & time" page (393pt frame, 16pt gutters).
const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
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
    gap: 10,
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  destText: { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 16 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28.5 },
  clear: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#DC2626' },
  note: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16.5},
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 61,
    marginTop: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
  summaryText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 17 },
  summarySide: { flex: 1 },
  // Dashed arc peaks above the day count; the two navy rings sit level with it.
  summaryMid: { width: 162, height: 34, alignItems: 'center' },
  summaryDays: { marginTop: 14.5 },
  section: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 24, marginTop: 12 },
  weekHeader: { flexDirection: 'row', marginTop: 4 },
  weekDay: { flex: 1, textAlign: 'center', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 19.5 },
  calendar: { height: 263, marginTop: 12, borderRadius: 8 },
  calendarContent: { paddingBottom: 8 },
  monthName: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 24, paddingLeft: 8, paddingTop: 4 },
  week: { flexDirection: 'row' },
  dayCell: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center' },
  band: { position: 'absolute', top: 1, bottom: 1, left: 0, right: 0 },
  bandLeftEdge: { left: 4, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
  bandRightEdge: { right: 4, borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  // opaque by default so a tap can override the platform's press tint with this same colour
  dayCircle: { width: 34, height: 34, borderRadius: 18,paddingBottom: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent'},
  dayText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13 },
  struck: { textDecorationLine: 'line-through' },
  wheels: {
  flexDirection: 'row',
  gap: 12,
  marginTop: 8,
  height: 156,
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
  footer: { paddingHorizontal: 16 },
  cta: { height: 54, padding: 4, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28, textAlign: 'center' },
  // Figma popups: white card (radius 16) over a dimmed page, round close button underneath.
  popupOverlay: { flex: 1, backgroundColor: 'rgba(38,38,38,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, gap: 12 },
  // Figma "Early Pickup / Return" (357 wide): badge 30, title 18, body 13/20, WhatsApp 44 tall + Call 47 tall
  // side by side 12 apart, then the round 32 close button 12 under the card.
  early: { width: '100%', maxWidth: 357, borderRadius: 16, paddingHorizontal: 12, paddingTop: 22, paddingBottom: 12, alignItems: 'center' },
  earlyBadge: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  earlyBadgeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, lineHeight: 20, color: '#FFFFFF' },
  earlyTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 26, textAlign: 'center', marginTop: 16 },
  earlyBody: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, lineHeight: 20, textAlign: 'center', paddingHorizontal: 8, marginTop: 10 },
  earlyActions: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, alignSelf: 'stretch', marginTop: 23 },
  earlyBtn: { flex: 1, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  earlyWa: { height: 44, backgroundColor: '#F0FDF4' },
  earlyWaText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, color: '#25D366' },
  earlyCall: { height: 47, gap: 10 },
  earlyCallText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 16, lineHeight: 22, color: '#FFFFFF' },
  earlyClose: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  // Figma "Late Return": warning 30, title 19, body 13/20 with "1 extra day" in navy, full-width 46 button.
  lateBody: { marginTop: 9 },
  lateExtra: { fontFamily: 'PlusJakartaSans_600SemiBold' },
  lateBtn: { alignSelf: 'stretch', height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  lateBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22, color: '#FFFFFF' },
});