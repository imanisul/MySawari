import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, LayoutAnimation } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface MonthCalendarProps {
  start: Date | null;
  end: Date | null;
  onPress: (date: Date) => void;
}

export function MonthCalendar({ start, end, onPress }: MonthCalendarProps) {
  const colors = useColors();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [currentMonth, setCurrentMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

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

  const handlePress = (date: Date) => {
    if (date < today) return;
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onPress(date);
  };

  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 16, paddingBottom: 16 },
  monthSelector: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  monthArrow: { padding: 8 },
  monthName: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  weekHeader: { flexDirection: 'row', marginBottom: 8 },
  weekDay: { flex: 1, textAlign: 'center', fontFamily: 'Inter_500Medium', fontSize: 12 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dateCell: { width: '14.28%', aspectRatio: 1, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  dateCircle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', zIndex: 1 },
  dateText: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  highlight: { position: 'absolute', top: 4, bottom: 4, left: 0, right: 0 },
  highlightStart: { position: 'absolute', top: 4, bottom: 4, right: 0, left: '50%' },
  highlightEnd: { position: 'absolute', top: 4, bottom: 4, left: 0, right: '50%' },
});
