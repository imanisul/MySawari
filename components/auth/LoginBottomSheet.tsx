import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, Animated, TouchableWithoutFeedback, Keyboard, Linking, Alert } from 'react-native';
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import Notifications from '@/utils/notifications';

const OTP_LENGTH = 4;

/** "7356356123" → "73563 56XXX": the design's 5-5 grouping, last three digits masked. */
function formatMobile(mobile: string) {
  if (mobile.length <= 5) return mobile;
  return `${mobile.slice(0, 5)} ${mobile.slice(5, 7)}XXX`;
}

/**
 * The OTP is held as four fixed slots with a space standing in for an empty one (so a skipped box
 * keeps its position). Strip those before the code goes anywhere near the API.
 */
function otpCode(raw: string) {
  return raw.replace(/\s/g, '');
}

/**
 * Figma's neutral ramp for the auth sheets, in light mode.
 *
 * The app's shared palette is deliberately cool, while this design uses the warm neutral ramp —
 * the same scoping PhoneNumberSheet does, so nothing else in the app repaints. Dark mode keeps the
 * app's own tokens.
 */
const FIGMA = {
  title: '#262626',
  copy: '#737373',
  boxBg: '#FAFAFA',
  boxBorder: '#EAECF1',
  boxBorderFocused: '#EAECF1', // Figma: no focus ring, the caret marks the active box
  digit: '#262626',
  backBtnBg: '#F5F5F5',
  closeBtnBg: '#FAFAFA',
  icon: '#737373',
  panelBorder: '#E7EAF4',
  ctaBg: '#EAECF1',
  ctaLabel: '#A3A3A3',
  ctaActiveBg: '#2F3E75', // Primary/blue-500
  ctaActiveLabel: '#FFFFFF',
  errorBoxBg: '#FFFAFA',
  errorBoxBorder: '#FEF2F2', // Red/50
  errorText: '#EF4444', // Red/500
};

/**
 * The four 52×52 OTP boxes from the Figma.
 *
 * Each box is a real input so the caret, selection and keyboard behave natively: typing a digit
 * advances to the next box, backspace on an empty box steps back to the previous one, and pasting
 * a code fills them all. `onComplete` fires once the last digit lands.
 */
function OtpBoxes({
  value,
  onChange,
  onComplete,
  editable,
  error,
  ui,
}: {
  value: string;
  onChange: (next: string) => void;
  onComplete: (code: string) => void;
  editable: boolean;
  error: boolean;
  ui: typeof FIGMA;
}) {
  const inputs = useRef<(TextInput | null)[]>([]);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);

  // A rejected code is cleared, so retyping starts again from the first box.
  useEffect(() => {
    if (error) inputs.current[0]?.focus();
  }, [error]);

  // The code is held as four fixed slots, not a packed string. A box the customer skipped has to
  // stay *in place* — packing the digits would slide a later digit into an earlier box, so tapping
  // box 3 and typing would land the digit in box 2. Empty slots are carried as a space, which
  // survives the round-trip through the parent's string state, and are stripped before the code is
  // handed on.
  const slots = Array.from({ length: OTP_LENGTH }, (_, i) => (value[i] === ' ' ? '' : value[i] ?? ''));

  const commit = (next: string[]) => {
    // Empty slots travel as a space so a gap keeps its position; `otpCode()` strips them again
    // before the code is ever sent to the API.
    onChange(next.map((d) => d || ' ').join(''));
    // Only a code with every box filled is complete enough to verify.
    if (next.every((d) => d !== '')) onComplete(next.join(''));
  };

  const handleChange = (text: string, index: number) => {
    // Digits only; a pasted code arrives whole on one box and fills the rest from there.
    const typed = text.replace(/\D/g, '');
    const next = [...slots];

    if (!typed) {
      // Backspace on a filled box clears just that box.
      next[index] = '';
      commit(next);
      return;
    }

    if (typed.length > 1) {
      for (let i = 0; i < typed.length && index + i < OTP_LENGTH; i++) next[index + i] = typed[i];
      commit(next);
      inputs.current[Math.min(index + typed.length, OTP_LENGTH - 1)]?.focus();
      return;
    }

    next[index] = typed;
    commit(next);
    if (index < OTP_LENGTH - 1) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (key: string, index: number) => {
    // Backspace on an empty box steps back so a typo mid-code can be corrected.
    if (key === 'Backspace' && !slots[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.otpRow}>
      {slots.map((digit, i) => (
        <TextInput
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          style={[
            styles.otpBox,
            {
              backgroundColor: error ? ui.errorBoxBg : ui.boxBg,
              borderColor: error ? ui.errorBoxBorder : focusedIndex === i ? ui.boxBorderFocused : ui.boxBorder,
              color: ui.digit,
            },
          ]}
          value={digit}
          onChangeText={(t) => handleChange(t, i)}
          onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, i)}
          onFocus={() => setFocusedIndex(i)}
          onBlur={() => setFocusedIndex((cur) => (cur === i ? null : cur))}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          editable={editable}
          autoFocus={i === 0}
          textContentType="oneTimeCode"
          accessibilityLabel={`Digit ${i + 1} of ${OTP_LENGTH}`}
        />
      ))}
    </View>
  );
}

export function LoginBottomSheet({
  visible,
  onClose,
  onLoginSuccess,
  otpSentTo,
  required = false,
}: {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  /** Login is needed to continue (Bookings, Profile, booking a car): no close button and no tap-outside dismiss. */
  required?: boolean;
  /** Set when the OTP was already sent (PhoneNumberSheet): open on the code step for this number. */
  otpSentTo?: { mobile: string; isExistingUser: boolean } | null;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, isDarkMode } = useSawari();

  // The design's exact values in light mode; the app's own tokens in dark mode.
  const ui = isDarkMode
    ? {
        title: colors.foreground,
        copy: colors.mutedForeground,
        boxBg: colors.muted,
        boxBorder: colors.border,
        boxBorderFocused: colors.blue,
        digit: colors.foreground,
        backBtnBg: colors.secondary,
        closeBtnBg: colors.secondary,
        icon: colors.mutedForeground,
        panelBorder: colors.border,
        ctaBg: colors.disabledBg,
        ctaLabel: colors.disabledText,
        ctaActiveBg: colors.primary,
        ctaActiveLabel: colors.primaryForeground,
        errorBoxBg: colors.muted,
        errorBoxBorder: colors.error,
        errorText: colors.error,
      }
    : FIGMA;

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [otpError, setOtpError] = useState(false);
  const [nameConfirmed, setNameConfirmed] = useState(false);
  
  const slideAnim = useRef(new Animated.Value(400)).current;
  const [keyboardUp, setKeyboardUp] = useState(false);

  // With the keyboard up the sheet sits flush on it (Figma: 16px bottom padding, no home-indicator inset).
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', () => setKeyboardUp(true));
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setKeyboardUp(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  // Countdown timer for Resend OTP
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0 && step === 2) {
      interval = setInterval(() => setResendTimer(prev => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer, step]);

  // Slide up animation when visible
  useEffect(() => {
    if (visible) {
      setStep(otpSentTo ? 2 : 1);
      setMobile(otpSentTo?.mobile ?? '');
      setOtp('');
      setOtpError(false);
      setName('');
      setReferralCode('');
      setNameConfirmed(false);
      setIsExistingUser(!!otpSentTo?.isExistingUser);
      setResendTimer(otpSentTo ? 30 : 0);
      
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
        tension: 65,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 400,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const performLogin = async (finalName: string) => {
    try {
      setLoading(true);
      const { token, refreshToken, user } = await API.verifyOtp(mobile, otpCode(otp), finalName, isExistingUser ? '' : referralCode);
      await login(token, refreshToken, user);
      
      // Request Notifications Permission Just-In-Time — without holding the sheet open until it is answered.
      Notifications.getPermissionsAsync()
        .then(({ status }: { status: string }) => (status !== 'granted' ? Notifications.requestPermissionsAsync() : null))
        .catch((error: any) => console.warn('Failed to request notification permission:', error));

      onClose();
      // After the modal is closed, continue the interrupted flow
      // (e.g. navigate to search, booking, membership, etc.)
      if (onLoginSuccess) {
        setTimeout(() => onLoginSuccess(), 300);
      }
    } catch (e: any) {
      if (step === 2) {
        setOtpError(true);
        setOtp('');
      } else {
        Alert.alert('Error', e.message || 'Invalid OTP');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = async () => {
    if (step === 1 && mobile.length >= 10) {
      try {
        setLoading(true);
        const res = await API.sendOtp(mobile);
        setIsExistingUser(!!res.isExistingUser);
        setStep(2);
        setOtpError(false);
        setResendTimer(30);
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to send OTP');
      } finally {
        setLoading(false);
      }
    } else if (step === 2 && otpCode(otp).length === OTP_LENGTH) {
      if (isExistingUser) {
        await performLogin('');
      } else {
        setStep(3);
      }
    } else if (step === 3 && name.trim().length > 0) {
      await performLogin(name.trim());
    }
  };

  /**
   * The 4th digit landed. An existing customer is signed in straight away; a new one moves on to
   * the name step, which is where their profile is created.
   */
  const handleOtpComplete = async (code: string) => {
    if (loading || code.length !== OTP_LENGTH) return;
    if (!isExistingUser) {
      setStep(3);
      return;
    }
    try {
      setLoading(true);
      const { token, refreshToken, user } = await API.verifyOtp(mobile, code, '', '');
      await login(token, refreshToken, user);
      Notifications.getPermissionsAsync()
        .then(({ status }: { status: string }) => (status !== 'granted' ? Notifications.requestPermissionsAsync() : null))
        .catch(() => {});
      onClose();
      if (onLoginSuccess) setTimeout(() => onLoginSuccess(), 300);
    } catch (e: any) {
      setOtpError(true);
      setOtp(''); // clear the boxes so the code can be retyped
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    try {
      setLoading(true);
      await API.sendOtp(mobile);
      setResendTimer(30);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const isButtonEnabled = () => {
    if (step === 1) return mobile.length >= 10;
    if (step === 2) return otpCode(otp).length === OTP_LENGTH;
    if (step === 3) return name.trim().length > 0 && nameConfirmed;
    return false;
  };

  const getButtonText = () => {
    if (loading) return 'Please wait...';
    if (step === 1) return 'Send OTP';
    if (step === 2) return 'Verify OTP';
    if (step === 3) return 'Continue';
    return 'Next';
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.overlay}>
          {/* Background dismiss — only allowed on step 1 (mobile entry), never while loading */}
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => { if (step === 1 && !loading && !required) onClose(); }}
          />
          
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
            style={{ width: '100%', justifyContent: 'flex-end', flex: 1 }}
          >
            <Animated.View style={[
              styles.sheet, 
              { 
                backgroundColor: colors.card,
                borderColor: ui.panelBorder,
                transform: [{ translateY: slideAnim }],
                paddingBottom: keyboardUp ? 16 : Math.max(insets.bottom, 16),
              }
            ]}>

              {/* Figma header: a back arrow on the OTP step, the title centred, and a close X. The name
                  step has its own left-aligned title + copy and no buttons. */}
              {step === 3 ? (
                <View style={styles.nameHeader}>
                  <Text style={[styles.title, { color: ui.title }]}>Let’s complete your profile</Text>
                  <Text style={[styles.nameSubtitle, { color: ui.copy }]}>Add your details to get started with MySawari.</Text>
                </View>
              ) : (
              <View style={styles.headerRow}>
                {step === 2 ? (
                  <TouchableOpacity
                    onPress={() => { setStep(1); setOtp(''); }}
                    style={[styles.roundBtn, { backgroundColor: ui.backBtnBg }]}
                    accessibilityRole="button"
                    accessibilityLabel="Back to mobile number"
                  >
                    <Feather name="chevron-left" size={24} color={ui.icon} />
                  </TouchableOpacity>
                ) : (
                  <View style={styles.roundBtnSpacer} />
                )}
                <Text style={[styles.title, { color: ui.title }]} numberOfLines={1}>
                  {step === 1 ? 'Enter your mobile number' : step === 2 ? 'Verify your account' : 'What is your name?'}
                </Text>
                {required ? (
                  <View style={styles.roundBtnSpacer} />
                ) : (
                <TouchableOpacity
                  onPress={onClose}
                  style={[styles.roundBtn, { backgroundColor: ui.closeBtnBg }]}
                  accessibilityRole="button"
                  accessibilityLabel="Close"
                >
                  <Feather name="x" size={20} color={ui.icon} />
                </TouchableOpacity>
                )}
              </View>
              )}

              {step === 1 && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
                  <Text style={[styles.subtitle, { color: ui.copy, marginBottom: 0 }]}>
                    We will send a 4-digit code via WhatsApp.
                  </Text>
                </View>
              )}

              {/* Step 1: Mobile */}
              {step === 1 && (
                <View style={[styles.inputBox, { borderColor: colors.border, backgroundColor: colors.muted }]}>
                  <Text style={[styles.countryCode, { color: colors.foreground }]}>+91</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="99999 99999"
                    placeholderTextColor={colors.mutedForeground}
                    keyboardType="number-pad"
                    value={mobile}
                    // Digits only; a pasted "+91 98765 43210" or "098765 43210" drops the prefix.
                    onChangeText={(t) => {
                      const d = t.replace(/\D/g, '');
                      setMobile(d.length > 10 && /^(91|0)/.test(d) ? d.slice(-10) : d.slice(0, 10));
                    }}
                    autoFocus
                  />
                </View>
              )}

              {/* Step 2: OTP — auto-verifies on the 4th digit so the user never has to tap Verify */}
              {step === 2 && (
                <>
                  <Text style={[styles.otpCopy, { color: ui.copy }]}>
                    Enter the 4-digit code sent to WhatsApp{' '}
                    <Text style={[styles.otpCopyStrong, { color: ui.title }]}>+91 {formatMobile(mobile)}</Text>
                    {' · '}
                    <Text
                      style={[styles.otpCopyStrong, { color: ui.title }]}
                      onPress={() => { setStep(1); setOtp(''); }}
                      accessibilityRole="button"
                    >
                      Change
                    </Text>
                  </Text>

                  <OtpBoxes
                    value={otp}
                    onChange={(next) => { setOtp(next); setOtpError(false); }}
                    onComplete={handleOtpComplete}
                    editable={!loading}
                    error={otpError}
                    ui={ui}
                  />

                  {otpError && (
                    <Text style={[styles.otpError, { color: ui.errorText }]} accessibilityLiveRegion="polite">
                      Invalid code. Please try again
                    </Text>
                  )}

                  <Text style={[styles.resend, { color: ui.copy }]}>
                    Didn't receive the OTP?{' '}
                    <Text
                      style={resendTimer > 0 ? undefined : [styles.resendAction, { color: colors.blue }]}
                      onPress={resendTimer > 0 || loading ? undefined : handleResendOtp}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: resendTimer > 0 || loading }}
                    >
                      {resendTimer > 0 ? `Resend in 00:${resendTimer.toString().padStart(2, '0')}` : 'Resend'}
                    </Text>
                  </Text>
                </>
              )}

              {/* Step 3: Name — Figma: name field + hint, referral field, ID-name confirmation. */}
              {step === 3 && (
                <View style={styles.nameBody}>
                  <View style={{ gap: 4 }}>
                    <Text style={[styles.nameLabel, { color: ui.copy }]}>FULL NAME</Text>
                    <View style={[styles.nameField, { backgroundColor: ui.boxBg, borderColor: ui.boxBorder }]}>
                      <TextInput
                        style={[styles.nameInput, { color: ui.digit }]}
                        placeholder="Enter your full name"
                        placeholderTextColor={ui.copy}
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                        autoComplete="name"
                        textContentType="name"
                        autoFocus
                      />
                    </View>
                  </View>
                  <View style={[styles.nameField, { backgroundColor: ui.boxBg, borderColor: ui.boxBorder }]}>
                    <TextInput
                      style={[styles.nameInput, { color: ui.digit }]}
                      placeholder="Referral Code (Optional)"
                      placeholderTextColor={ui.copy}
                      value={referralCode}
                      // Codes are letters and digits only; a pasted space, dash or emoji would make signup fail.
                      onChangeText={(t) => setReferralCode(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20))}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      maxLength={20}
                    />
                  </View>
                  <TouchableOpacity
                    style={styles.confirmRow}
                    onPress={() => setNameConfirmed((v) => !v)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: nameConfirmed }}
                    activeOpacity={0.7}
                  >
                    <MaterialCommunityIcons
                      name={nameConfirmed ? 'checkbox-marked' : 'checkbox-blank-outline'}
                      size={18}
                      color={nameConfirmed ? ui.ctaActiveBg : ui.copy}
                      style={styles.confirmIcon}
                    />
                    <Text style={[styles.nameHint, { color: ui.copy, flex: 1 }]}>
                      I confirm that my full name matches the name on my valid government-issued ID.
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  { backgroundColor: isButtonEnabled() ? ui.ctaActiveBg : ui.ctaBg, marginBottom: step === 1 ? 20 : 0 },
                ]}
                disabled={!isButtonEnabled() || loading}
                onPress={handleNext}
              >
                <Text style={[styles.actionText, { color: isButtonEnabled() ? ui.ctaActiveLabel : ui.ctaLabel }]}>
                  {getButtonText()}
                </Text>
              </TouchableOpacity>
              
              {step === 1 && <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, textAlign: 'center', color: colors.mutedForeground, marginTop: 8, marginBottom: 8 }}>
                By continuing, you agree to our{' '}
                <Text 
                  style={{ textDecorationLine: 'underline', color: colors.foreground }}
                  onPress={() => Linking.openURL('https://mysawari.in/terms/')}
                >
                  Terms and Conditions
                </Text>
                {' '}and{' '}
                <Text 
                  style={{ textDecorationLine: 'underline', color: colors.foreground }}
                  onPress={() => Linking.openURL('https://mysawari.in/privacy/')}
                >
                  Privacy Policy
                </Text>.
              </Text>}
              
            </Animated.View>
            {/* Full-sheet loading overlay — prevents double-taps while the API request is in flight */}
            {loading && (
              <View style={[StyleSheet.absoluteFill, { alignItems: 'center', justifyContent: 'center', borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: 'transparent' }]} pointerEvents="box-only" />
            )}
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(38,38,38,0.32)', // Figma scrim
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  // Figma: 32px circles, back on #F5F5F5 and close on #FAFAFA.
  roundBtn: {
    width: 32,
    height: 32,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundBtnSpacer: { width: 32, height: 32 },
  title: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 19,
    lineHeight: 28.5,
  },
  closeBtn: {
    padding: 4,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 24,
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    marginBottom: 24,
  },
  // Figma OTP step: a centred 13px line, four 52×52 boxes 8px apart, then the resend line.
  otpCopy: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  otpCopyStrong: { fontFamily: 'PlusJakartaSans_600SemiBold' },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    height: 52,
  },
  otpBox: {
    width: 52,
    height: 52,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    textAlign: 'center',
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 17,
  },
  resend: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  // Figma name step: title + copy 8px apart, then fields, hint and confirmation 16px apart.
  nameHeader: { gap: 8, marginBottom: 16 },
  nameSubtitle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, lineHeight: 22.5 },
  nameBody: { gap: 16, marginBottom: 16 },
  nameLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 16 },
  nameField: { borderRadius: 8, borderWidth: 1, height: 52, justifyContent: 'center', paddingHorizontal: 12 },
  nameInput: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 17, height: '100%', padding: 0 },
  nameHint: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 19.5 },
  confirmRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  confirmIcon: { marginTop: 1 },
  otpError: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 16,
  },
  resendAction: { fontFamily: 'PlusJakartaSans_600SemiBold' },
  countryCode: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 18,
    height: '100%',
  },
  // Figma CTA: 54px, radius 12, Semibold 19.
  actionBtn: {
    height: 54,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 19,
    lineHeight: 28.5,
  }
});
