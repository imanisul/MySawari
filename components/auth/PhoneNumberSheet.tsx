import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import { CustomAlert } from '@/components/common/CustomAlert';

/** Height of the sheet's own content — the slide distance is measured from this, not a fixed guess. */
const SHEET_FALLBACK_HEIGHT = 313;

/**
 * Figma's own neutral ramp for this sheet, in light mode.
 *
 * The app's shared palette is deliberately *cool* ("Neutrals are cool — they sit naturally next to
 * navy", constants/colors.ts), while this design uses the warm neutral ramp (#262626 / #737373 /
 * #A3A3A3 / #D4D4D4). Overriding the shared tokens would repaint every other screen, so the Figma
 * values live here instead — the same thing LocationSheet does with its own `ui` palette.
 *
 * Dark mode keeps the app's tokens: the design is light-only, and the palette is already tuned for
 * contrast on a dark surface.
 */
const FIGMA = {
  panelBorder: '#E7EAF4',
  title: '#262626',
  copy: '#737373',
  skip: '#D4D4D4',
  fieldBg: '#FAFAFA',
  fieldBorder: '#EAECF1',
  fieldBorderFocused: '#D4D4D4',
  countryCode: '#737373',
  input: '#262626',
  terms: '#737373',
  termsLink: '#2F3E75', // Primary/blue-500
  ctaBg: '#EAECF1',
  ctaLabel: '#A3A3A3',
  ctaActiveBg: '#2F3E75', // Primary/blue-500, once all 10 digits are in
  ctaActiveLabel: '#FFFFFF',
};

/**
 * "Get started with My Sawari" — the phone-number sheet that rises from the bottom over Home.
 *
 * Figma reference: white sheet, 24px top corners, title + copy with SKIP on the right, a +91 field,
 * the terms line, and a full-width CTA that stays grey until the number is complete.
 */
export function PhoneNumberSheet({
  visible,
  onClose,
  onOtpSent,
}: {
  visible: boolean;
  onClose: () => void;
  onOtpSent?: (mobile: string, isExistingUser: boolean) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isDarkMode } = useSawari();

  // The design's exact values in light mode; the app's own tokens in dark mode.
  const ui = isDarkMode
    ? {
        panelBorder: colors.border,
        title: colors.foreground,
        copy: colors.mutedForeground,
        skip: colors.disabledText,
        fieldBg: colors.muted,
        fieldBorder: colors.border,
        fieldBorderFocused: colors.blue,
        countryCode: colors.mutedForeground,
        input: colors.foreground,
        terms: colors.mutedForeground,
        termsLink: colors.blue,
        ctaBg: colors.disabledBg,
        ctaLabel: colors.disabledText,
        ctaActiveBg: colors.primary,
        ctaActiveLabel: colors.primaryForeground,
      }
    : FIGMA;

  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const [keyboardUp, setKeyboardUp] = useState(false);

  const slide = useRef(new Animated.Value(SHEET_FALLBACK_HEIGHT)).current;
  const fade = useRef(new Animated.Value(0)).current;
  const sheetHeight = useRef(SHEET_FALLBACK_HEIGHT);

  // With the keyboard up, the sheet sits flush on it (Figma: 16px bottom padding, no home-indicator inset).
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardUp(true));
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardUp(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const isValid = mobile.length === 10;
  const canContinue = isValid && !loading;

  // Slide up on open, down on close. The scrim fades in step with the sheet.
  useEffect(() => {
    if (visible) {
      setMobile('');
      setLoading(false);
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

  const handleContinue = async () => {
    if (!canContinue) return;
    Haptics.selectionAsync().catch(() => {});
    setLoading(true);
    try {
      const res = await API.sendOtp(mobile);
      onClose();
      // Hand the number to the OTP step, which opens once this sheet has slid away.
      setTimeout(() => onOtpSent?.(mobile, !!res?.isExistingUser), 260);
    } catch (e: any) {
      CustomAlert.alert('Could not send OTP', e?.message || 'Please check your number and try again.', [{ text: 'OK' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root} pointerEvents={visible ? 'auto' : 'none'}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => !loading && onClose()} />
      </Animated.View>

      {/* Android resizes the window for the keyboard on its own; iOS needs the padding. */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard} pointerEvents="box-none">
      <Animated.View
        onLayout={(e) => { sheetHeight.current = e.nativeEvent.layout.height || SHEET_FALLBACK_HEIGHT; }}
        style={[
          styles.sheet,
          {
            backgroundColor: colors.card,
            borderColor: ui.panelBorder,
            paddingBottom: keyboardUp ? 16 : Math.max(insets.bottom, 16),
            transform: [{ translateY: slide }],
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: ui.title }]}>Get started with My Sawari</Text>
            <Text style={[styles.subtitle, { color: ui.copy }]}>
              We'll use your phone number to verify your account. No spam, we promise.
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Skip"
            testID="phone-sheet-skip"
            hitSlop={10}
            onPress={() => !loading && onClose()}
          >
            <Text style={[styles.skip, { color: ui.skip }]}>SKIP</Text>
          </Pressable>
        </View>

        <View
          style={[
            styles.field,
            { backgroundColor: ui.fieldBg, borderColor: focused ? ui.fieldBorderFocused : ui.fieldBorder },
          ]}
        >
          <Text style={[styles.countryCode, { color: ui.countryCode }]}>+91</Text>
          <TextInput
            style={[styles.input, { color: ui.input }]}
            placeholder="99999 99999"
            placeholderTextColor={ui.countryCode}
            keyboardType="number-pad"
            value={mobile}
            // Digits only; a pasted "+91 98765 43210" or "098765 43210" drops the prefix.
            onChangeText={(t) => {
              const d = t.replace(/\D/g, '');
              setMobile(d.length > 10 && /^(91|0)/.test(d) ? d.slice(-10) : d.slice(0, 10));
            }}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            maxLength={10}
            editable={!loading}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
            autoFocus={visible}
          />
        </View>

        <Text style={[styles.terms, { color: ui.terms }]}>
          By continuing, you agree to our{' '}
          <Text
            style={[styles.termsLink, { color: ui.termsLink }]}
            onPress={() => Linking.openURL('https://mysawari.in/terms/')}
          >
            Terms &amp; Conditions
          </Text>{' '}
          and{' '}
          <Text
            style={[styles.termsLink, { color: ui.termsLink }]}
            onPress={() => Linking.openURL('https://mysawari.in/privacy/')}
          >
            Privacy Policy
          </Text>
          .
        </Text>

        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !canContinue }}
          testID="phone-sheet-continue"
          disabled={!canContinue}
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: canContinue ? ui.ctaActiveBg : ui.ctaBg,
              opacity: pressed && canContinue ? 0.9 : 1,
            },
          ]}
        >
          <Text style={[styles.ctaText, { color: canContinue ? ui.ctaActiveLabel : ui.ctaLabel }]}>
            {loading ? 'Sending...' : 'Send OTP'}
          </Text>
        </Pressable>
      </Animated.View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'flex-end', zIndex: 40 },
  keyboard: { flex: 1, justifyContent: 'flex-end' },
  scrim: { backgroundColor: 'rgba(38,38,38,0.32)' }, // Figma scrim, same as LoginBottomSheet
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 16,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.12, shadowRadius: 16 },
      android: { elevation: 24 },
    }),
  },
  // Figma sets this sheet in Plus Jakarta Sans (already loaded app-wide), not the app's Inter.
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 },
  headerCopy: { flex: 1, gap: 8 },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28.5 },
  subtitle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, lineHeight: 22.5 },
  skip: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 19.5 },
  field: {
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 12,
    height: 52,
    paddingHorizontal: 12,
  },
  countryCode: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 17, lineHeight: 25.5 },
  input: { flex: 1, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 17, height: '100%', padding: 0 },
  terms: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 19.5 },
  termsLink: { textDecorationLine: 'underline' },
  cta: {
    alignItems: 'center',
    borderRadius: 12,
    flexDirection: 'row',
    height: 54,
    justifyContent: 'center',
  },
  ctaText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28.5 },
});
