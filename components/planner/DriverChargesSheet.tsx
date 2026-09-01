import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { SheetFrame } from '../layout/SheetFrame';

export function DriverChargesSheet() {
  const colors = useColors();
  const router = useRouter();
  return (
    <SheetFrame centered height={185}>
      <View style={styles.chargesHeader}>
        <Text style={[styles.chargesTitle, { color: colors.foreground }]}>Driver charges</Text>
        <Pressable onPress={() => router.back()} accessibilityLabel="Close">
          <Feather name="x" size={20} color={colors.mutedForeground} />
        </Pressable>
      </View>
      <Text style={[styles.chargesCopy, { color: colors.mutedForeground }]}>
        Driver charges are calculated based on the rental duration and applicable service conditions.
      </Text>
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  chargesHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  chargesTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 20 },
  chargesCopy: { fontFamily: 'Inter_400Regular', fontSize: 16, lineHeight: 24, marginTop: 12 },
});
