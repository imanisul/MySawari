import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SheetFrame, SheetHeader } from '../layout/SheetFrame';
import { PrimaryButton } from '../ui/PrimaryButton';

export function TimesSheet() {
  const colors = useColors();
  const { setTimes } = useSawari();
  const router = useRouter();
  const options = ['06:00 AM', '08:00 AM', '09:00 AM', '10:00 AM'];
  return (
    <SheetFrame height={430}>
      <SheetHeader title="Select pickup & return time" />
      <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>Pickup</Text>
      <TimePills options={options} selected="10:00 AM" />
      <Text style={[styles.timeLabel, { color: colors.mutedForeground, marginTop: 23 }]}>Return</Text>
      <TimePills options={options} selected="10:00 AM" />
      <PrimaryButton label="Apply Time" icon={undefined} onPress={() => { setTimes('10:00 AM', '10:00 AM'); router.back(); }} />
    </SheetFrame>
  );
}

function TimePills({ options, selected }: { options: string[]; selected: string }) {
  const colors = useColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timePills}>
      {options.map((option) => (
        <Pressable key={option} style={[styles.timePill, { borderColor: option === selected ? colors.navy : colors.border, backgroundColor: option === selected ? colors.navy : colors.card }]}>
          <Text style={[styles.timeText, { color: option === selected ? colors.warmWhite : colors.foreground }]}>{option}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  timeLabel: { fontFamily: 'Inter_400Regular', fontSize: 16, marginTop: 32 },
  timePills: { gap: 12, marginTop: 12, paddingBottom: 6 },
  timePill: { borderRadius: 14, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10 },
  timeText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
});
