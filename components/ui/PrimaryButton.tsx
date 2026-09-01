import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export function PrimaryButton({
  label,
  onPress,
  icon = 'arrow-right',
}: {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Feather>['name'];
}) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.primaryButton,
        { backgroundColor: colors.primary },
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.primaryButtonText, { color: colors.primaryForeground }]}>{label}</Text>
      {icon && <Feather name={icon} size={18} color={colors.primaryForeground} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primaryButton: { alignItems: 'center', borderRadius: 17, flexDirection: 'row', height: 70, justifyContent: 'center', marginTop: 20 },
  primaryButtonText: { fontFamily: 'Inter_500Medium', fontSize: 20, marginRight: 12 },
  pressed: { opacity: 0.65 },
});
