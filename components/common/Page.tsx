import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { BottomNavigation } from '../navigation/BottomNavigation';

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
          // Only apply wrapper padding if Page is handling the scrolling.
          // Otherwise, it hard-clips FlatLists.
          paddingBottom: scroll ? insets.bottom + (bottomNav ? 80 : 24) : 0,
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
  pageContent: { flex: 1 },
});
