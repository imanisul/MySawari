import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SheetFrame, SheetHeader } from '../layout/SheetFrame';
import { PrimaryButton } from '../ui/PrimaryButton';

export function DriverOptionSheet() {
  const colors = useColors();
  const { mode, setMode } = useSawari();
  const router = useRouter();
  return (
    <SheetFrame height={530}>
      <SheetHeader title="Driving option" subtitle="Choose how you want to travel" />
      <OptionCard
        title="Self Drive"
        description="You drive the vehicle yourself."
        price="No driver charges"
        icon="aperture"
        selected={mode === 'Self Drive'}
        onPress={() => setMode('Self Drive')}
      />
      <OptionCard
        title="With Driver"
        description="Travel with a professional driver."
        price="From ₹800/day"
        icon="user"
        selected={mode === 'With Driver'}
        onPress={() => setMode('With Driver')}
      />
      <View style={{ marginTop: 24 }}>
        <PrimaryButton label="Confirm Option" icon={undefined} onPress={() => router.back()} />
      </View>
    </SheetFrame>
  );
}

function OptionCard({
  title,
  description,
  price,
  icon,
  selected,
  onPress,
}: {
  title: string;
  description: string;
  price: string;
  icon: React.ComponentProps<typeof Feather>['name'];
  selected: boolean;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.optionCard,
        { borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.tintLight : colors.card },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.optionIcon, { backgroundColor: selected ? colors.card : colors.secondary }]}>
        <Feather name={icon} size={21} color={colors.foreground} />
      </View>
      <View style={styles.optionCopy}>
        <View style={styles.optionTitleRow}>
          <Text style={[styles.optionTitle, { color: colors.foreground }]}>{title}</Text>
          {title === 'With Driver' && <Feather name="info" size={15} color={colors.mutedForeground} />}
        </View>
        <Text style={[styles.optionDescription, { color: colors.mutedForeground }]}>{description}</Text>
        <Text style={[styles.optionPrice, { color: colors.foreground }]}>{price}</Text>
      </View>
      <View style={[styles.radio, { borderColor: selected ? colors.navy : colors.border, backgroundColor: selected ? colors.navy : colors.card }]}>
        {selected && <Feather name="check" size={13} color={colors.primary} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  optionCard: { alignItems: 'center', borderRadius: 20, borderWidth: 1, flexDirection: 'row', marginTop: 16, padding: 16 },
  optionIcon: { alignItems: 'center', borderRadius: 16, height: 46, justifyContent: 'center', width: 46 },
  optionCopy: { flex: 1, marginLeft: 16 },
  optionTitleRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  optionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  optionDescription: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4 },
  optionPrice: { fontFamily: 'Inter_500Medium', fontSize: 13, marginTop: 8 },
  radio: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 22, justifyContent: 'center', width: 22 },
  pressed: { opacity: 0.65 },
});
