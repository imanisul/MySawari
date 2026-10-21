import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { LocationResult } from '@/utils/sawari';
import { LocationSearchBody } from './LocationSearchBody';

/** Height of the sheet's own content — the slide distance is measured from this, not a fixed guess. */
const SHEET_FALLBACK_HEIGHT = 520;

/**
 * "Set Location" — the destination search that rises from the bottom over Home, with the keyboard
 * moving in step with it.
 *
 * It shares its search field and results list with the routed `LocationSheet` (both render
 * `LocationSearchBody`), but unlike that route it never navigates: picking a place hands the
 * destination back to the caller, which closes the sheet and moves the flow on.
 *
 * Figma reference: white sheet, 24px top corners, the search field pinned under the header, then
 * the results list — the panel and the keyboard rising as one unit.
 */
export function SetLocationSheet({
  visible,
  onClose,
  onSelect,
}: {
  visible: boolean;
  onClose: () => void;
  /** The chosen destination. The caller persists it and decides where to go next. */
  onSelect: (loc: LocationResult) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const slide = useRef(new Animated.Value(SHEET_FALLBACK_HEIGHT)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const sheetHeight = useRef(SHEET_FALLBACK_HEIGHT);

  // Slide up on open, down on close. The scrim fades in step with the sheet.
  useEffect(() => {
    if (visible) {
      slide.setValue(sheetHeight.current);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(slide, { toValue: 0, useNativeDriver: true, friction: 9, tension: 68 }),
      ]).start();
    } else {
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(fade, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(slide, { toValue: sheetHeight.current, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
      ]).start();
    }
  }, [visible, fade, slide]);

  return (
    <View style={styles.root} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close location search" />
      </Animated.View>

      {/* behavior 'padding' on iOS lifts the sheet with the keyboard, so panel and keyboard rise together. */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.avoider}
        pointerEvents="box-none"
      >
        <Animated.View
          onLayout={(e) => { sheetHeight.current = e.nativeEvent.layout.height || SHEET_FALLBACK_HEIGHT; }}
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
              paddingBottom: Math.max(insets.bottom, 16),
              transform: [{ translateY: slide }],
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={[styles.title, { color: colors.foreground }]}>Set Location</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                Where should we bring your ride? Search a place or use your current location.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              testID="set-location-close"
              hitSlop={10}
              onPress={onClose}
              style={[styles.closeButton, { backgroundColor: colors.secondary }]}
            >
              <Feather name="x" size={20} color={colors.foreground} />
            </Pressable>
          </View>

          <LocationSearchBody mode="destination" onSelect={onSelect} autoFocus={visible} />
        </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 40 },
  avoider: { width: '100%', justifyContent: 'flex-end', maxHeight: '92%' },
  scrim: { backgroundColor: 'rgba(16,27,46,0.45)' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 20,
    maxHeight: '100%',
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 24 },
    }),
  },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  headerCopy: { flex: 1, gap: 8 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 19, lineHeight: 29 },
  subtitle: { fontFamily: 'Inter_500Medium', fontSize: 15, lineHeight: 22 },
  closeButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
});
