import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SheetFrame, SheetHeader } from '../layout/SheetFrame';
import { PrimaryButton } from '../ui/PrimaryButton';

export function TimesSheet() {
  const colors = useColors();
  const { pickupTime, returnTime, setTimes } = useSawari();
  const router = useRouter();
  
  const [localPickup, setLocalPickup] = useState(pickupTime);
  const [localReturn, setLocalReturn] = useState(returnTime);
  
  const options = ['06:00 AM', '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM'];
  
  return (
    <SheetFrame height={460}>
      <SheetHeader title="Select pickup & return time" />
      <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>Pickup</Text>
      <TimePills options={options} selected={localPickup} onSelect={setLocalPickup} />
      <Text style={[styles.timeLabel, { color: colors.mutedForeground, marginTop: 23 }]}>Return</Text>
      <TimePills options={options} selected={localReturn} onSelect={setLocalReturn} />
      <View style={{ marginTop: 24 }}>
        <PrimaryButton label="Apply Time" icon={undefined} onPress={() => { setTimes(localPickup, localReturn); router.back(); }} />
      </View>
    </SheetFrame>
  );
}

function TimePills({ options, selected, onSelect }: { options: string[]; selected: string; onSelect: (val: string) => void }) {
  const colors = useColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.timePills}>
      {options.map((option) => (
        <Pressable 
          key={option} 
          onPress={() => onSelect(option)}
          style={[styles.timePill, { borderColor: option === selected ? colors.navy : colors.border, backgroundColor: option === selected ? colors.navy : colors.card }]}>
          <Text style={[styles.timeText, { color: option === selected ? colors.warmWhite : colors.foreground }]}>{option}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  timeLabel: { fontFamily: 'Inter_400Regular', fontSize: 16, marginTop: 32 },
  timePills: { gap: 12, marginTop: 12, paddingBottom: 6 },
  timePill: { borderRadius: 99, borderWidth: 1, paddingHorizontal: 22, paddingVertical: 14 },
  timeText: { fontFamily: 'Inter_500Medium', fontSize: 15 },
});
