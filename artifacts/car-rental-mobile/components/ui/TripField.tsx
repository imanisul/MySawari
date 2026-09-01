import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export function TripField({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>['name'];
  label: string;
  value: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tripField, pressed && styles.pressed]}
    >
      <Feather name={icon} size={23} color={colors.foreground} />
      <View style={styles.tripFieldCopy}>
        <Text style={[styles.tripFieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.tripFieldValue, { color: colors.foreground }]}>{value}</Text>
      </View>
      <Feather name="chevron-right" size={22} color={colors.mutedForeground} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tripField: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', minHeight: 96, paddingVertical: 13 },
  tripFieldCopy: { flex: 1, marginLeft: 24 },
  tripFieldLabel: { fontFamily: 'Inter_400Regular', fontSize: 16 },
  tripFieldValue: { fontFamily: 'Inter_600SemiBold', fontSize: 23, marginTop: 3 },
  pressed: { opacity: 0.65 },
});
