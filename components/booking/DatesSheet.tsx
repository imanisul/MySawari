import React, { useState, useRef, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View, ScrollView, LayoutAnimation } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SheetFrame, SheetHeader } from '../common/SheetFrame';
import { PrimaryButton } from '../common/PrimaryButton';
import { calculateRentalDays } from '@/services/backend/pricingEngine';

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
  const { setDates, setTimes, dateRange, pickupTime, returnTime } = useSawari();
  const router = useRouter();

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

  const initialStart = parseDateStr(dateRange.split(' – ')[0]);
  const initialEnd = parseDateStr(dateRange.split(' – ')[1]);

  const [start, setStart] = useState<Date | null>(initialStart && initialStart >= today ? initialStart : null);
  const [end, setEnd] = useState<Date | null>(initialEnd && initialStart && initialEnd > initialStart ? initialEnd : null);
  
  const [tempPickupTime, setTempPickupTime] = useState(pickupTime || '8:00 AM');
  const [tempReturnTime, setTempReturnTime] = useState(returnTime || '8:00 AM');

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
      return;
    }
    
    // If only start is selected
    if (start && !end) {
      if (date < start) {
        // Picked a date before start, make it the new start
        setStart(date);
      } else {
        // Picked a date after start, make it the end
        setEnd(date);
      }
      return;
    }
    
    // Default fallback (should never hit if initialized properly)
    setStart(date);
    setEnd(null);
  };

  const formatDateStr = (date: Date | null) => {
    if (!date) return 'Select';
    return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  };

  const rentalDays = start && end ? calculateRentalDays(formatDateStr(start), formatDateStr(end), tempPickupTime, tempReturnTime) : 0;
  const canApply = start && end && start < end;

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
          <Text style={[styles.selectedLabel, { color: colors.mutedForeground }]}>Start Sawari</Text>
          <Text style={[styles.selectedValue, { color: start ? colors.foreground : colors.mutedForeground }]}>
            {formatDateStr(start)}
          </Text>
          <Text style={[styles.timeLabel, { color: start ? colors.blue : colors.mutedForeground }]}>
            {start ? tempPickupTime : '--:--'}
          </Text>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Feather name="arrow-right" size={20} color={colors.mutedForeground} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 12, color: rentalDays > 0 ? colors.primary : colors.mutedForeground, marginTop: 4 }}>
            {rentalDays} Day{rentalDays !== 1 ? 's' : ''}
          </Text>
        </View>

        <View style={styles.selectedCol}>
          <Text style={[styles.selectedLabel, { color: colors.mutedForeground }]}>End Sawari</Text>
          <Text style={[styles.selectedValue, { color: end ? colors.foreground : colors.mutedForeground }]}>
            {formatDateStr(end)}
          </Text>
          <Text style={[styles.timeLabel, { color: end ? colors.blue : colors.mutedForeground }]}>
            {end ? tempReturnTime : '--:--'}
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
            
            const isPast = date < today;
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
              const diffDays = (start && end) ? Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) : 0;
              const isSelected = diffDays === numDays;
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
                    
                    setTempReturnTime('8:00 AM');
                    
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
            {ALL_TIMES.map((time) => {
              const selected = time === tempReturnTime;
              const isAnchorTime = time === '8:00 AM';
              return (
                <Pressable
                  key={'return_'+time}
                  onPress={() => {
                    Haptics.selectionAsync();
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
          label="Search Cars"
          disabled={!canApply}
          onPress={() => {
            if (start && end) {
              setDates(`${formatDateStr(start)} – ${formatDateStr(end)}`, `${rentalDays} Days`);
              setTimes(tempPickupTime, tempReturnTime);
              router.dismissAll();
              router.push('/search');
            }
          }} 
        />
      </View>
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
    borderTopColor: '#e5e5e5',
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
