import React, { useState, useRef, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView, LayoutAnimation, Alert, Linking, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SheetFrame, SheetHeader } from '../common/SheetFrame';
import { PrimaryButton } from '../common/PrimaryButton';
import { calculateRentalDays } from '@/services/backend/pricingEngine';
import { checkCarAvailability } from '@/utils/sawari';
import { SUPPORT_PHONE, SUPPORT_WHATSAPP_URL } from '@/constants/support';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

export function DatesSheet() {
  const colors = useColors();
  const router = useRouter();
  // fresh: opened right after choosing a destination (or for a trip whose dates have passed) — the
  // customer picks the dates themselves, nothing is pre-filled from an earlier search.
  const { returnBack, fresh, forSpecificCar } = useLocalSearchParams();
  const freshPick = fresh === 'true';
  const { setDates, setTimes, dateRange, pickupTime, returnTime, selectedCar, dropoff } = useSawari();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parseDateStr = (dateStr: string) => {
    if (!dateStr || dateStr === 'Select') return null;
    const [day, month] = dateStr.split(' ');
    const monthIndex = MONTHS.indexOf(month);
    if (monthIndex === -1) return null;
    const d = new Date(today.getFullYear(), monthIndex, parseInt(day));
    d.setHours(0, 0, 0, 0);
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
  
  const [tempPickupTime, setTempPickupTime] = useState<string | null>(!freshPick && pickupTime && pickupTime !== '--:--' ? pickupTime.replace(/^0/, '') : null);
  
  const [tempReturnTime, setTempReturnTime] = useState<string | null>(!freshPick && returnTime && returnTime !== '--:--' ? returnTime.replace(/^0/, '') : null);
  
  const [showEarlyPickupModal, setShowEarlyPickupModal] = useState(false);
  const [hasAutoJumpedLate, setHasAutoJumpedLate] = useState(false);
  const [showLateReturnModal, setShowLateReturnModal] = useState(false);

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const pickupScrollRef = useRef<ScrollView>(null);
  const returnScrollRef = useRef<ScrollView>(null);
  
  useEffect(() => {
    setTimeout(() => {
      // 8 AM is roughly index 16.
      pickupScrollRef.current?.scrollTo({ x: 1280, animated: false });
      returnScrollRef.current?.scrollTo({ x: 1280, animated: false });
    }, 100);
  }, []);

  const generateDaysInMonth = (year: number, month: number) => {
    const date = new Date(year, month, 1);
    const days = [];
    const firstDayIndex = date.getDay();
    for (let i = 0; i < firstDayIndex; i++) days.push(null);
    while (date.getMonth() === month) {
      days.push(new Date(date));
      date.setDate(date.getDate() + 1);
    }
    return days;
  };

  const days = generateDaysInMonth(currentMonth.getFullYear(), currentMonth.getMonth());

  const handleNextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  const handlePrevMonth = () => {
    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) setCurrentMonth(prev);
  };

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

  const formatDateStr = (date: Date | null) => {
    if (!date) return 'Select';
    return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  };

  const effectiveEnd = end || start;
  const isSameDay = !!(start && effectiveEnd && start.getTime() === effectiveEnd.getTime());
  const rentalDays = start ? calculateRentalDays(formatDateStr(start), formatDateStr(effectiveEnd), tempPickupTime || '8:00 AM', tempReturnTime || '8:00 AM') : 0;
  const canApply = start !== null && effectiveEnd !== null && tempPickupTime !== null && tempReturnTime !== null;

  return (
    <SheetFrame height="95%">
      <SheetHeader title="Select Dates & Time" />

      {/* Simplified Note */}
      <View style={{ paddingHorizontal: 12, marginBottom: 8 }}>
        <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.mutedForeground, textAlign: 'center' }}>
          *Note: 1 Day = 8:00 AM to 8:00 AM the next day.
        </Text>
      </View>

      {/* Selected Dates Display */}
      <View style={[styles.selectedHeader, { borderColor: colors.border, backgroundColor: colors.card }]}>
        <View style={styles.selectedCol}>
          <Text style={[styles.selectedLabel, { color: colors.mutedForeground }]}>Start</Text>
          <Text style={[styles.selectedValue, { color: start ? colors.foreground : colors.mutedForeground }]}>
            {formatDateStr(start)}
          </Text>
          <Text style={[styles.timeLabel, { color: start ? colors.blue : colors.mutedForeground }]}>
            {start ? (tempPickupTime || 'Select Time') : '--:--'}
          </Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Feather name="arrow-right" size={20} color={colors.mutedForeground} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: rentalDays > 0 ? colors.primaryText : colors.mutedForeground, marginTop: 4 }}>
            {rentalDays} Day{rentalDays !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.selectedCol}>
          <Text style={[styles.selectedLabel, { color: colors.mutedForeground }]}>End</Text>
          <Text style={[styles.selectedValue, { color: effectiveEnd ? colors.foreground : colors.mutedForeground }]}>
            {formatDateStr(effectiveEnd)}
          </Text>
          <Text style={[styles.timeLabel, { color: effectiveEnd ? colors.blue : colors.mutedForeground }]}>
            {effectiveEnd ? (tempReturnTime || 'Select Time') : '--:--'}
          </Text>
        </View>
      </View>

      <ScrollView style={{ flexShrink: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Calendar */}
        <View style={styles.monthSelector}>
          <Pressable onPress={handlePrevMonth} style={styles.monthArrow}>
            <Feather name="chevron-left" size={24} color={currentMonth > today ? colors.foreground : colors.muted} />
          </Pressable>
          <Text style={[styles.monthName, { color: colors.foreground }]}>
            {MONTHS[currentMonth.getMonth()]} {currentMonth.getFullYear()}
          </Text>
          <Pressable onPress={handleNextMonth} style={styles.monthArrow}>
            <Feather name="chevron-right" size={24} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.weekHeader}>
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
            <Text key={day} style={[styles.weekDay, { color: colors.mutedForeground }]}>{day}</Text>
          ))}
        </View>

        <View style={styles.calendarGrid}>
          {days.map((date, index) => {
            if (!date) return <View key={index} style={styles.dateCell} />;
            
            const isPastTemp = date < today;
            let isCarUnavailable = false;
            if (forSpecificCar === 'true' && selectedCar && date && !isPastTemp) {
              const dateStr = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
              isCarUnavailable = !checkCarAvailability(selectedCar, dateStr, dateStr);
            }
            const isPast = isPastTemp || isCarUnavailable;
            const isStart = start && date.getTime() === start.getTime();
            const isEnd = end && date.getTime() === end.getTime();
            const selected = isStart || isEnd;
            const inRange = start && end && date > start && date < end;
            
            return (
              <View key={index} style={styles.dateCell}>
                {inRange && <View style={[styles.highlight, { backgroundColor: colors.tintLight }]} />}
                {isStart && end && <View style={[styles.highlightStart, { backgroundColor: colors.tintLight }]} />}
                {isEnd && start && <View style={[styles.highlightEnd, { backgroundColor: colors.tintLight }]} />}
                
                <Pressable
                  accessibilityRole="button"
                  onPress={() => handlePress(date)}
                  disabled={isPast}
                  style={[styles.dateCircle, selected && { backgroundColor: colors.primary }]}
                >
                  <Text style={[
                    styles.dateText,
                    { color: selected ? colors.primaryForeground : isPast ? colors.mutedForeground : colors.foreground },
                    isPast && { opacity: 0.3 }
                  ]}>
                    {date.getDate()}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </View>

        {/* Quick Days Selection */}
        <View style={{ marginTop: 10 }}>
          <Text style={[styles.timeTitle, { color: colors.foreground }]}>Select Duration (Days)</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroll}>
            {[1, 2, 3, 4, 5, 7, 10, 15, 30].map(numDays => {
              const isSelected = rentalDays === numDays && !isSameDay;
              return (
                <Pressable
                  key={`quick_day_${numDays}`}
                  onPress={() => {
                    Haptics.selectionAsync();
                    const baseStart = start || new Date(today);
                    if (!start) setStart(baseStart);
                    
                    const newEnd = new Date(baseStart.getFullYear(), baseStart.getMonth(), baseStart.getDate() + numDays);
                    newEnd.setHours(0, 0, 0, 0);
                    setEnd(newEnd);
                    
                    setTempPickupTime('8:00 AM');
                    setTempReturnTime('8:00 AM');
                    setHasAutoJumpedLate(false);
                    
                    if (newEnd.getMonth() !== currentMonth.getMonth()) {
                       setCurrentMonth(new Date(newEnd.getFullYear(), newEnd.getMonth(), 1));
                    }
                  }}
                  style={[
                    styles.timeChip,
                    { borderColor: isSelected ? colors.primary : colors.border, paddingVertical: 6, paddingHorizontal: 12 },
                    isSelected && { backgroundColor: colors.primary }
                  ]}
                >
                  <Text style={[
                    styles.timeChipText,
                    { color: isSelected ? colors.primaryForeground : colors.foreground }
                  ]}>
                    {numDays} Day{numDays > 1 ? 's' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Time Selection */}
        <View style={styles.timeSection}>
          <Text style={[styles.timeTitle, { color: colors.foreground }]}>Pickup Time</Text>
          <ScrollView ref={pickupScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroll}>
            {ALL_TIMES.map((time) => {
              const selected = time === tempPickupTime;
              const isAnchorTime = time === '8:00 AM';
              return (
                <Pressable
                  key={'pickup_'+time}
                  onPress={() => {
                    Haptics.selectionAsync();
                    const timeIndex = ALL_TIMES.indexOf(time);
                    if (timeIndex !== -1 && timeIndex < 16) {
                      setShowEarlyPickupModal(true);
                      return;
                    }
                    setTempPickupTime(time);
                  }}
                  style={[
                    styles.timeChip,
                    { borderColor: selected ? colors.primary : colors.border },
                    selected && { backgroundColor: colors.primary },
                    !selected && isAnchorTime && { borderColor: colors.gold, backgroundColor: colors.gold + '10' }
                  ]}
                >
                  {isAnchorTime && !selected && <Feather name="star" size={10} color={colors.goldDark} style={{ marginRight: 4 }} />}
                  <Text style={[
                    styles.timeChipText,
                    { color: selected ? colors.primaryForeground : (isAnchorTime ? colors.goldDark : colors.foreground) }
                  ]}>
                    {time}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={[styles.timeTitle, { color: colors.foreground, marginTop: 12 }]}>Return Time</Text>
          <ScrollView ref={returnScrollRef} horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timeScroll}>
            {(isSameDay ? ALL_TIMES.slice(17) : ALL_TIMES).map((time) => {
              const selected = time === tempReturnTime;
              const isAnchorTime = time === '8:00 AM';
              return (
                <Pressable
                  key={'return_'+time}
                  onPress={() => {
                    Haptics.selectionAsync();
                    
                    const timeIndex = ALL_TIMES.indexOf(time);
                    if (timeIndex !== -1 && timeIndex < 16) {
                      setShowEarlyPickupModal(true);
                      return;
                    }


                    if (start && effectiveEnd) {
                      const isSameDaySelection = start.getTime() === effectiveEnd.getTime();
                      if (!isSameDaySelection) {
                        if (timeIndex > 16 && !hasAutoJumpedLate) {
                          const newEnd = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), effectiveEnd.getDate() + 1);
                          newEnd.setHours(0, 0, 0, 0);
                          setEnd(newEnd);
                          setHasAutoJumpedLate(true);
                          setShowLateReturnModal(true);
                          if (newEnd.getMonth() !== currentMonth.getMonth()) {
                            setCurrentMonth(new Date(newEnd.getFullYear(), newEnd.getMonth(), 1));
                          }
                        } else if (timeIndex <= 16 && hasAutoJumpedLate) {
                          const newEnd = new Date(effectiveEnd.getFullYear(), effectiveEnd.getMonth(), effectiveEnd.getDate() - 1);
                          newEnd.setHours(0, 0, 0, 0);
                          setEnd(newEnd);
                          setHasAutoJumpedLate(false);
                          if (newEnd.getMonth() !== currentMonth.getMonth()) {
                            setCurrentMonth(new Date(newEnd.getFullYear(), newEnd.getMonth(), 1));
                          }
                        }
                      }
                    }

                    setTempReturnTime(time);
                  }}
                  style={[
                    styles.timeChip,
                    { borderColor: selected ? colors.primary : colors.border },
                    selected && { backgroundColor: colors.primary },
                    !selected && isAnchorTime && { borderColor: colors.gold, backgroundColor: colors.gold + '10' }
                  ]}
                >
                  {isAnchorTime && !selected && <Feather name="star" size={10} color={colors.goldDark} style={{ marginRight: 4 }} />}
                  <Text style={[
                    styles.timeChipText,
                    { color: selected ? colors.primaryForeground : (isAnchorTime ? colors.goldDark : colors.foreground) }
                  ]}>
                    {time}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </ScrollView>

      <View style={{ paddingTop: 16 }}>
        <PrimaryButton 
          label={forSpecificCar === 'true' ? (!dropoff?.name ? "Next: Select Destination" : "Continue to Booking") : (returnBack === 'true' ? "Confirm Dates" : "Search Cars")}
          disabled={!canApply}
          onPress={() => {
            if (start) {
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
            }
          }}
        />
      </View>

      <Modal visible={showEarlyPickupModal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 }}>
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
          <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 8 }}>
            <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Feather name="info" size={32} color={colors.primary} />
            </View>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 20, color: colors.foreground, marginBottom: 8, textAlign: 'center' }}>Late Return</Text>
            <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
              Our standard time is 8:00 AM to 8:00 AM. Selecting this time adds 1 extra day to your rental.
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

    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  selectedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  selectedCol: {
    alignItems: 'center',
    flex: 1,
  },
  selectedLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    marginBottom: 4,
  },
  selectedValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },
  timeLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginTop: 2,
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthArrow: {
    padding: 8,
  },
  monthName: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
  },
  weekHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  weekDay: {
    width: 40,
    textAlign: 'center',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  dateCell: {
    width: '14.28%',
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginBottom: 0,
  },
  dateCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  dateText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  highlight: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  highlightStart: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: '50%',
    right: 0,
    zIndex: 1,
  },
  highlightEnd: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 0,
    right: '50%',
    zIndex: 1,
  },
  timeSection: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(128,140,160,0.25)',
    marginBottom: 8,
  },
  timeTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
    marginBottom: 6,
  },
  timeScroll: {
    paddingRight: 20,
    gap: 8,
  },
  timeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  timeChipText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 12,
  },
});
