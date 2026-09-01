import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { BottomNavigation } from './BottomNavigation';

export function Page({
  children,
  scroll = true,
  bottomNav = false,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  bottomNav?: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const content = (
    <View
      style={[
        styles.pageContent,
        {
          paddingTop: insets.top + 9,
          paddingBottom: insets.bottom + (bottomNav ? 80 : 24),
        },
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
      {bottomNav && <BottomNavigation />}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  pageContent: { paddingHorizontal: 24 },
});
