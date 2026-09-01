import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { DriverMode } from '@/lib/sawari';

export function DriverModeRow({
  mode,
  onChange,
}: {
  mode: DriverMode;
  onChange: (mode: DriverMode) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.driverModeRow}>
      {(['Self Drive', 'With Driver'] as DriverMode[]).map((item) => {
        const active = mode === item;
        return (
          <Pressable
            key={item}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            testID={`mode-${item.toLowerCase().replaceAll(' ', '-')}`}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(item);
            }}
            style={({ pressed }) => [
              styles.driverModeChoice,
              {
                backgroundColor: active ? colors.primary : colors.card,
                borderColor: active ? colors.primary : colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.driverModeText, { color: active ? colors.primaryForeground : colors.foreground }]}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  driverModeRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  driverModeChoice: { borderRadius: 12, borderWidth: 1, flex: 1, paddingVertical: 12, alignItems: 'center' },
  driverModeText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  pressed: { opacity: 0.65 },
});
