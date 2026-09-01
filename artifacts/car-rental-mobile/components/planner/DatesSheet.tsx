import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SheetFrame, SheetHeader } from '../layout/SheetFrame';
import { PrimaryButton } from '../ui/PrimaryButton';

export function DatesSheet() {
  const colors = useColors();
  const { setDates } = useSawari();
  const router = useRouter();
  const dates = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];
  return (
    <SheetFrame height={700}>
      <SheetHeader title="Where do you want to go?" subtitle="Find the right car for your journey." />
      <View style={styles.weekHeader}>
        {['S', 'M', 'T', 'W', 'TH', 'F', 'S'].map((day) => (
          <Text key={day} style={[styles.weekDay, { color: colors.mutedForeground }]}>{day}</Text>
        ))}
      </View>
      <View style={styles.calendarGrid}>
        {Array.from({ length: 6 }).map((_, index) => <View key={`empty-${index}`} style={styles.dateCell} />)}
        {dates.map((date) => {
          const isStart = date === 17;
          const isEnd = date === 20;
          const selected = isStart || isEnd;
          const inRange = date > 17 && date < 20;
          const highlighted = selected || inRange;
          
          return (
            <View key={date} style={styles.dateCell}>
              {highlighted && (
                <View
                  style={[
                    styles.highlight,
                    { backgroundColor: colors.tintLight },
                    isStart && styles.highlightStart,
                    isEnd && styles.highlightEnd,
                  ]}
                />
              )}
              <Pressable
                accessibilityRole="button"
                onPress={() => {}}
                style={[styles.dateCircle, selected && { backgroundColor: colors.navy }]}
              >
                <Text style={[styles.dateText, { color: selected ? colors.warmWhite : colors.foreground }]}>{date}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
      <View style={[styles.dateSummary, { borderTopColor: colors.border }]}>
        <Text style={[styles.dateDuration, { color: colors.mutedForeground }]}>3 days</Text>
        <Text style={[styles.dateRange, { color: colors.foreground }]}>17 Aug – 20 Aug</Text>
      </View>
      <PrimaryButton label="Apply Dates" icon={undefined} onPress={() => { setDates('17 Aug – 20 Aug', '3 days'); router.back(); }} />
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 27 },
  weekDay: { fontFamily: 'Inter_400Regular', fontSize: 14, textAlign: 'center', width: 33 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: 15 },
  dateCell: { alignItems: 'center', height: 42, justifyContent: 'center', marginBottom: 12, width: '14.28%', position: 'relative' },
  highlight: { position: 'absolute', height: 40, top: 1, bottom: 1, left: 0, right: 0 },
  highlightStart: { left: '50%', borderTopLeftRadius: 99, borderBottomLeftRadius: 99 },
  highlightEnd: { right: '50%', borderTopRightRadius: 99, borderBottomRightRadius: 99 },
  dateCircle: { alignItems: 'center', borderRadius: 99, height: 40, justifyContent: 'center', width: 40, zIndex: 1 },
  dateText: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  dateSummary: { borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 20 },
  dateDuration: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  dateRange: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
});
