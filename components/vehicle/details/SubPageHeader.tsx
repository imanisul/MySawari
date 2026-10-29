import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDetailsPalette } from './detailsPalette';

/** Grey round back button + title, with a hairline under it (FAQs, Policy Agreements). */
export function SubPageHeader({ title }: { title: string }) {
  const p = useDetailsPalette();
  const router = useRouter();
  return (
    <View style={[styles.header, { borderBottomColor: p.divider }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={({ pressed }) => [styles.backBtn, { backgroundColor: p.iconBg }, pressed && { opacity: 0.7 }]}
      >
        <Feather name="chevron-left" size={18} color={p.sub} />
      </Pressable>
      <Text style={[styles.title, { color: p.fg }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingHorizontal: 16, paddingVertical: 4, borderBottomWidth: 1 },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 26 },
});
