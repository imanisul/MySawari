import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

const BRANDS = ['Toyota', 'BMW', 'Honda', 'Hyundai', 'Kia'];

export function BrandTabs() {
  const colors = useColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {BRANDS.map((brand) => (
        <View key={brand} style={[styles.brandCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="award" size={16} color={colors.foreground} />
          <Text style={[styles.brandText, { color: colors.foreground }]}>{brand}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 12, paddingBottom: 16 },
  brandCard: { alignItems: 'center', borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 12 },
  brandText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
});
