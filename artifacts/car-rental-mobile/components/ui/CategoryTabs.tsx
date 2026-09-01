import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Category, categories } from '@/lib/sawari';

export function CategoryTabs({
  selected,
  onSelect,
}: {
  selected: Category;
  onSelect: (category: Category) => void;
}) {
  const colors = useColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
      {categories.map((item) => {
        const active = item === selected;
        return (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            testID={`category-${item.toLowerCase()}`}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(item);
            }}
            style={({ pressed }) => [styles.category, pressed && styles.pressed]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: active ? colors.foreground : colors.mutedForeground },
                active && styles.categoryTextSelected,
              ]}
            >
              {item}
            </Text>
            {active && <View style={[styles.categoryUnderline, { backgroundColor: colors.foreground }]} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoryRow: { gap: 20, paddingTop: 14 },
  category: { alignItems: 'center', paddingBottom: 7 },
  categoryText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  categoryTextSelected: { fontFamily: 'Inter_500Medium' },
  categoryUnderline: { bottom: 0, height: 1.5, position: 'absolute', width: 20 },
  pressed: { opacity: 0.65 },
});
