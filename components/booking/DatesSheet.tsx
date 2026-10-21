import React, { useState, useRef, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView, LayoutAnimation, Alert, Linking, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { calculateRentalDays } from '@/services/backend/pricingEngine';
import { checkCarAvailability } from '@/utils/sawari';
import { SUPPORT_PHONE, SUPPORT_WHATSAPP_URL } from '@/constants/support';

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
// A return after 9:00 AM is a late return: it adds one day (index 18 is 9:00 AM; 0 is 12:00 AM).
const LATE_RETURN_AFTER = 18;
// The design offers whole hours only; ALL_TIMES indices still drive the 8 AM rules below.
const isWholeHour = (time: string) => time.includes(':00');
const padTime = (time: string) => time.replace(/^(\d):/, '0$1:');

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
const WINDOW = 142;
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
        <LinearGradient
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
  const { returnBack, fresh, forSpecificCar } = useLocalSearchParams();
  const freshPick = fresh === 'true';
  const { setDates, setTimes, dateRange, pickupTime, returnTime, selectedCar, dropoff, isDarkMode } = useSawari();

  // Figma palette in light mode; dark mode keeps the theme tokens.
  const ui = isDarkMode
    ? { page: colors.background, text: colors.foreground, muted: colors.mutedForeground, border: colors.border, card: colors.card, cardBorder: colors.border, calendar: colors.card, month: colors.mutedForeground, band: colors.tintLight, navy: colors.primary, onNavy: colors.primaryForeground, past: colors.mutedForeground, chipText: colors.primaryText, dash: colors.mutedForeground }
    : { page: '#FFFFFF', text: '#262626', muted: '#737373', border: '#D4D4D4', card: '#F5F6FA', cardBorder: '#E7EAF4', calendar: '#F8F8FA', month: '#525252', band: '#E9EAF1', navy: '#2F3E75', onNavy: '#FFFFFF', past: '#A3A3A3', chipText: '#2F3E75', dash: '#A3A8C3' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Labels like "2 Jan" carry no year. Trips are booked from today onwards, so a month earlier than
  // the current one means next year (a range from late Dec into Jan keeps its January end).
  const parseDateStr = (dateStr: string, notBefore?: Date | null) => {
    if (!dateStr || dateStr === 'Select') return null;
    const [day, month] = dateStr.split(' ');
    const monthIndex = MONTHS.indexOf(month);
    if (monthIndex === -1) return null;
    let year = today.getFullYear();
    if (monthIndex < today.getMonth()) year += 1;
    let d = new Date(year, monthIndex, parseInt(day));
    // An end date can never fall before its start: if it does, it is in the following year.
    if (notBefore && d < notBefore) d = new Date(year + 1, monthIndex, parseInt(day));
    d.setHours(0, 0, 0, 0);
    return d;
  };

  useEffect(() => {
    import('@/services/api/activity').then(({ ActivityAPI }) => {
      ActivityAPI.logActivity('open_dates_sheet', 'DatesSheet');
    });
  }, []);

  const initialStart = freshPick ? null : parseDateStr(dateRange.split(' – ')[0]);
  const initialEnd = freshPick ? null : parseDateStr(dateRange.split(' – ')[1], initialStart);

  const [start, setStart] = useState<Date | null>(initialStart && initialStart >= today ? initialStart : null);
  const [end, setEnd] = useState<Date | null>(initialEnd && initialStart && initialEnd >= initialStart ? initialEnd : null);
  
  const [tempPickupTime, setTempPickupTime] = useState<string | null>(!freshPick && pickupTime && pickupTime !== '--:--' ? pickupTime.replace(/^0/, '') : '8:00 AM');
  
  const [tempReturnTime, setTempReturnTime] = useState<string | null>(!freshPick && returnTime && returnTime !== '--:--' ? returnTime.replace(/^0/, '') : '8:00 AM');
  
  const [showEarlyPickupModal, setShowEarlyPickupModal] = useState(false);
  const [hasAutoJumpedLate, setHasAutoJumpedLate] = useState(false);
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
      setTempReturnTime(null);
      setHasAutoJumpedLate(false);
      return;
    }
    
    // If only start is selected
    if (start && !end) {
      if (date < start) {
        // Picked a date before start, make it the new start
        setStart(date);
        setEnd(null);
        setTempReturnTime(null);
        setHasAutoJumpedLate(false);
      } else if (date.getTime() === start.getTime()) {
        // Tapping the same start date again → deselect it entirely
        setStart(null);
        setEnd(null);
        setTempReturnTime(null);
        setHasAutoJumpedLate(false);
      } else {
        // Picked a date after start, make it the end
        setEnd(date);
        setHasAutoJumpedLate(false);
      }
      return;
    }
    
    // Default fallback (should never hit if initialized properly)
    setStart(date);
    setEnd(null);
    setTempReturnTime(null);
    setHasAutoJumpedLate(false);
  };

  const handleClear = () => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStart(null);
    setEnd(null);
    setTempPickupTime('8:00 AM');
    setTempReturnTime('8:00 AM');
    setHasAutoJumpedLate(false);
  };

  const formatDateStr = (date: Date | null) => {
    if (!date) return 'Select';
    return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  };

  const effectiveEnd = end || start;
  const isSameDay = !!(start && effectiveEnd && start.getTime() === effectiveEnd.getTime());
  const rentalDays = start ? calculateRentalDays(formatDateStr(start), formatDateStr(effectiveEnd), tempPickupTime || '8:00 AM', tempReturnTime || '8:00 AM') : 0;
  const canApply = start !== null && effectiveEnd !== null && tempPickupTime !== null && tempReturnTime !== null;

  const isDisabledDay = (date: Date) => {
    if (date < today) return true;
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
        if (timeIndex > LATE_RETURN_AFTER && !hasAutoJumpedLate) {
          const newEnd = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), effectiveEnd.getDate() + 1);
          newEnd.setHours(0, 0, 0, 0);
          setEnd(newEnd);
          setHasAutoJumpedLate(true);
          setShowLateReturnModal(true);
        } else if (timeIndex <= LATE_RETURN_AFTER && hasAutoJumpedLate) {
          const newEnd = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), effectiveEnd.getDate() - 1);
          newEnd.setHours(0, 0, 0, 0);
          setEnd(newEnd);
          setHasAutoJumpedLate(false);
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
        Alert.alert('Car Not Available', 'The selected car is not available for these dates. Please choose different dates.');
        return;
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
    } else if (forSpecificCar === 'true') {
      if (!dropoff?.name) {
        router.replace({ pathname: '/dropoff', params: { forSpecificCar: 'true' } });
      } else {
        router.replace('/booking');
      }
    } else {
      router.dismissAll();
      setTimeout(() => {
        router.push('/search');
      }, 100);
    }
  };

  const pickupTimes = ALL_TIMES.filter(isWholeHour);
  const returnTimes = (isSameDay ? ALL_TIMES.slice(17) : ALL_TIMES).filter(isWholeHour);
  const wheel: WheelPalette = { card: isDarkMode ? colors.card : '#F9F9FB', box: ui.page, boxBorder: isDarkMode ? colors.border : '#EAECF1', selected: ui.chipText, idle: ui.muted };

  return (
    <View style={[styles.page, { backgroundColor: ui.page }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Change destination"
          onPress={() => router.push({ pathname: '/dropoff', params: { returnBack: 'true' } })}
          style={[styles.destField, { borderColor: ui.border }]}
        >
          <PinOutline color={ui.muted} />
          <Text style={[styles.destText, { color: ui.muted }]} numberOfLines={1}>
            {dropoff?.name || 'Select your Destination'}
          </Text>
          <Chevron color={ui.muted} />
        </Pressable>

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
          <View style={styles.summaryMid}>
            <Svg width={162} height={34} viewBox="0 0 162 34" style={StyleSheet.absoluteFill}>
              <Path d="M5 16.5 Q81 0.5 157 16.5" stroke={ui.dash} strokeWidth={1} strokeDasharray="4 3" fill="none" />
              <Circle cx={5} cy={16.5} r={4.25} fill={ui.page} stroke={ui.navy} strokeWidth={2.5} />
              <Circle cx={157} cy={16.5} r={4.25} fill={ui.page} stroke={ui.navy} strokeWidth={2.5} />
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
                      const isEnd = !!end && date.getTime() === end.getTime();
                      const selected = isStart || isEnd;
                      const ranged = !!(start && end && start.getTime() !== end.getTime() && date >= start && date <= end);
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
            {forSpecificCar === 'true' ? (!dropoff?.name ? "Next: Select Destination" : "Continue to Booking") : (returnBack === 'true' ? "Confirm Dates" : "Search Cars")}
          </Text>
        </Pressable>
      </View>

      {/* Figma notice card: 357 wide, white, 12px radius, 20/12/12 padding, 24 gap. */}
      <Modal visible={showEarlyPickupModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, width: 357, maxWidth: '100%', paddingTop: 20, paddingHorizontal: 12, paddingBottom: 12, gap: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.destructive + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Feather name="clock" size={32} color={colors.destructive} />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.foreground, marginBottom: 8, textAlign: 'center' }}>Early Timing</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              For vehicle timings before 8:00 AM, please connect with our Customer Care to confirm availability.
            </Text>
            
            <View style={{ width: '100%', gap: 12 }}>
              <Pressable 
                onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 14, gap: 8 }}
              >
                <Feather name="phone-call" size={18} color={colors.primaryForeground} />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.primaryForeground }}>Call Customer Care</Text>
              </Pressable>
              
              <Pressable 
                onPress={() => Linking.openURL(SUPPORT_WHATSAPP_URL)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#25D366', paddingVertical: 14, borderRadius: 14, gap: 8 }}
              >
                <Feather name="message-circle" size={18} color="#fff" />
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: "#fff" }}>WhatsApp Us</Text>
              </Pressable>
              
              <Pressable 
                onPress={() => setShowEarlyPickupModal(false)}
                style={{ paddingVertical: 14, alignItems: 'center', marginTop: 4 }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.mutedForeground }}>Close</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showLateReturnModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 12, width: 357, maxWidth: '100%', paddingTop: 20, paddingHorizontal: 12, paddingBottom: 12, gap: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Feather name="info" size={32} color={colors.primary} />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.foreground, marginBottom: 8, textAlign: 'center' }}>Late Return</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              Returns after 9:00 AM add 1 extra day to your rental.
            </Text>
            
            <View style={{ width: '100%', gap: 12 }}>
              <Pressable 
                onPress={() => setShowLateReturnModal(false)}
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 14, gap: 8 }}
              >
                <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 15, color: colors.primaryForeground }}>Understood</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

// Figma "Select your date & time" page (393pt frame, 16pt gutters).
const styles = StyleSheet.create({
  page: { flex: 1 },
  content: { paddingHorizontal: 16, paddingBottom: 24 },
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
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 20, lineHeight: 28 },
  clear: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 14, color: '#E5202E' },
  note: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, lineHeight: 16, marginTop: 4 },
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
  section: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 16, lineHeight: 24, marginTop: 12 },
  weekHeader: { flexDirection: 'row', marginTop: 10 },
  weekDay: { flex: 1, textAlign: 'center', fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, lineHeight: 20 },
  calendar: { height: 263, marginTop: 12, borderRadius: 8 },
  calendarContent: { paddingBottom: 8 },
  monthName: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 16, lineHeight: 24, paddingLeft: 8, paddingTop: 4, marginBottom: 6 },
  week: { flexDirection: 'row' },
  dayCell: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center' },
  band: { position: 'absolute', top: 1, bottom: 1, left: 0, right: 0 },
  bandLeftEdge: { left: 4, borderTopLeftRadius: 8, borderBottomLeftRadius: 8 },
  bandRightEdge: { right: 4, borderTopRightRadius: 8, borderBottomRightRadius: 8 },
  // opaque by default so a tap can override the platform's press tint with this same colour
  dayCircle: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  dayText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15 },
  struck: { textDecorationLine: 'line-through' },
  wheels: { flexDirection: 'row', gap: 12, marginTop: 12, height: 210 },
  wheelCard: { flex: 1, borderRadius: 8, padding: 4, gap: 12 },
  wheelTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 23, textAlign: 'center' },
  wheel: { height: WINDOW, overflow: 'hidden' },
  wheelBox: { position: 'absolute', left: 0, right: 0, top: WINDOW / 2 - 20, height: 40, borderRadius: 6, borderWidth: 1 },
  wheelRow: { height: ROW, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  wheelText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },
  // Figma CTA bar: 16 padding, 361×54 navy button, radius 12, 19/28 semibold white title.
  footer: { paddingHorizontal: 16, paddingTop: 16 },
  cta: { height: 54, padding: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaDisabled: { opacity: 0.5 },
  ctaText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28, textAlign: 'center' },
});
