import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export function SectionHeading({
  title,
  kicker,
  action,
  onAction,
}: {
  title: string;
  kicker?: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <View>
        {kicker && <Text style={[styles.sectionKicker, { color: colors.mutedForeground }]}>{kicker}</Text>}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {action && (
        <Pressable
          accessibilityRole="button"
          testID={`action-${action.toLowerCase().replaceAll(' ', '-')}`}
          onPress={onAction}
          style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
        >
          <Text style={[styles.viewAllText, { color: colors.blue }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 26 },
  sectionKicker: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.6 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 20, letterSpacing: -0.5, marginTop: 4 },
  viewAll: { padding: 4 },
  viewAllText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  pressed: { opacity: 0.65 },
});
