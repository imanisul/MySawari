import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Category, categories } from '@/utils/sawari';

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
            style={({ pressed }) => [
              styles.category,
              { backgroundColor: active ? colors.primary : colors.card },
              { borderColor: active ? colors.primary : colors.border },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: active ? '#000000' : colors.foreground },
                active && styles.categoryTextSelected,
              ]}
            >
              {item}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  categoryRow: { gap: 12, paddingTop: 14, paddingHorizontal: 20, paddingBottom: 10 },
  category: { 
    alignItems: 'center', 
    justifyContent: 'center',
    paddingVertical: 8, 
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  categoryTextSelected: { fontFamily: 'Inter_700Bold' },
  pressed: { opacity: 0.65 },
});
