import React from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export function SheetFrame({
  children,
  centered = false,
  height,
  fill = false,
}: {
  children: React.ReactNode;
  centered?: boolean;
  height?: number | string;
  /**
   * For sheets with a text field: the sheet takes a share of the *available* height (not a fixed
   * minimum), so when the keyboard opens it shrinks with the screen and the header + field stay in view.
   */
  fill?: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const Root: any = fill ? KeyboardAvoidingView : View;
  return (
    <Root
      style={[styles.sheetScreen, { backgroundColor: colors.overlay }]}
      {...(fill ? { behavior: Platform.OS === 'ios' ? 'padding' : undefined } : null)}
    >
      <Pressable style={StyleSheet.absoluteFill} onPress={() => router.back()} />
      <View
        style={[
          styles.sheet,
          centered && styles.centeredSheet,
          { backgroundColor: colors.card },
          !centered && { paddingBottom: insets.bottom + 18 },
          centered && { paddingBottom: 28 },
          fill ? styles.fillSheet : height ? { minHeight: height as any } : undefined,
        ]}
      >
        {!centered && <View style={[styles.grabber, { backgroundColor: colors.border }]} />}
        {children}
      </View>
    </Root>
  );
}

export function SheetHeader({
  title,
  subtitle,
  onClose = () => router.back(),
}: {
  title: string;
  subtitle?: string;
  onClose?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sheetHeader}>
      <View style={styles.sheetHeaderCopy}>
        <Text style={[styles.sheetTitle, { color: colors.foreground }]}>{title}</Text>
        {subtitle && <Text style={[styles.sheetSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text>}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Close"
        testID="close-sheet"
        onPress={onClose}
        style={[styles.closeButton, { backgroundColor: colors.secondary }]}
      >
        <Feather name="x" size={20} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sheetScreen: { flex: 1, justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingHorizontal: 30, paddingTop: 14, maxHeight: '90%' },
  centeredSheet: { alignSelf: 'center', borderRadius: 28, justifyContent: 'center', marginHorizontal: 8, paddingTop: 28, width: '96%', maxHeight: '90%' },
  fillSheet: { height: '92%', maxHeight: '92%' },
  grabber: { alignSelf: 'center', borderRadius: 99, height: 6, marginBottom: 20, width: 53 },
  sheetHeader: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  sheetHeaderCopy: { flex: 1, paddingRight: 18 },
  sheetTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 28, letterSpacing: -0.8, lineHeight: 33 },
  sheetSubtitle: { fontFamily: 'Inter_400Regular', fontSize: 16, marginTop: 4 },
  closeButton: { alignItems: 'center', borderRadius: 99, height: 44, justifyContent: 'center', width: 44 },
});
