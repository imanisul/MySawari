import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import Notifications from '@/utils/notifications';
import { ModalBlur } from '@/components/common/ModalBlur';

/**
 * Sign-in sheet (design: "Get started with My Sawari" → "Verify your account" → "Let's complete your profile").
 *
 * One sheet runs the whole flow, so the number is typed once and one OTP is sent:
 *  1. Phone   — POST /auth/send-otp (the reply says whether the number already has an account)
 *  2. Code    — existing customer: POST /auth/verify-otp signs in straight away
 *               new customer: the code is kept and sent with the profile in step 3
 *  3. Profile — new customers only: POST /auth/verify-otp with the name and referral code creates the account,
 *               then the optional email is saved with PUT /customers/profile
 * These are the same calls (and the same order) the app used before.
 */

const OTP_LENGTH = 6;
const RESEND_SECONDS = 60;
const HAS_LOGGED_IN_KEY = '@mysawari_has_logged_in_before';

// Design palette (light). Dark mode keeps the app's own tokens.
const LIGHT = {
  sheet: '#FFFFFF',
  title: '#262626',
  copy: '#737373',
  faint: '#A3A3A3',
  fieldBg: '#FAFAFA',
  fieldBorder: '#EAECF1',
  field2: '#E5E5E5', // name and email boxes use Neutral/200
  fieldFocus: '#A3A3A3',
  navy: '#2F3E75',
  onNavy: '#FFFFFF',
  disabledBg: '#EAECF1',
  disabledText: '#A3A3A3',
  roundBtn: '#F5F5F5',
  error: '#EF4444',
  errorBg: '#FFFAFA',
  errorBorder: '#FEF2F2',
};

/** "7356356123" → "73563 56123" (the design's 5-5 grouping). */
const group = (m: string) => (m.length <= 5 ? m : `${m.slice(0, 5)} ${m.slice(5)}`);
/** "+91 73563 56XXX" — the last three digits hidden, as in the design. */
const masked = (m: string) => `+91 ${m.slice(0, 5)} ${m.slice(5, 7)}XXX`;
/** The typed code without the gaps kept for skipped boxes. */
const digitsOf = (v: string) => v.replace(/\s/g, '');
const isOtpError = (msg: string) => /otp|code|invalid|incorrect|expired|wrong/i.test(msg);

export function LoginBottomSheet({
  visible, onClose, onLoginSuccess, required = false,
}: {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  /** "SKIP" on the phone step (closes the sheet). */
  showSkip?: boolean;
  /** If true, user cannot dismiss without logging in. */
  required?: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, saveProfile, isDarkMode } = useSawari();
  const ui = isDarkMode
    ? {
        sheet: colors.card, title: colors.foreground, copy: colors.mutedForeground, faint: colors.mutedForeground,
        fieldBg: colors.muted, fieldBorder: colors.border, field2: colors.border, fieldFocus: colors.mutedForeground,
        navy: '#3E509A', onNavy: '#FFFFFF', disabledBg: colors.disabledBg, disabledText: colors.disabledText,
        roundBtn: colors.secondary, error: colors.destructive, errorBg: colors.destructive + '14', errorBorder: colors.destructive + '40',
      }
    : LIGHT;

  const router = useRouter();
  const [step, setStep] = useState<'phone' | 'otp' | 'profile'>('phone');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [isExisting, setIsExisting] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referral, setReferral] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [focus, setFocus] = useState<string | null>(null);

  // Fresh sheet every time it opens.
  useEffect(() => {
    if (!visible) return;
    setStep('phone'); setMobile(''); setOtp(''); setOtpId(null); setIsExisting(false);
    setName(''); setEmail(''); setReferral(''); setConfirmed(false);
    setLoading(false); setError(null); setResendIn(0);

    // If user has logged in before on this device, it's 2nd time: don't show tick button and auto-accept
    AsyncStorage.getItem(HAS_LOGGED_IN_KEY)
      .then((val) => {
        const hasLoggedIn = val === 'true';
        setIsFirstTime(!hasLoggedIn);
        setTermsAccepted(hasLoggedIn);
      })
      .catch(() => {
        setIsFirstTime(true);
        setTermsAccepted(false);
      });
  }, [visible]);

  // Resend countdown.
  useEffect(() => {
    if (step !== 'otp' || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendIn]);

  const openTerms = () => {
    Keyboard.dismiss();
    onClose();
    router.push('/terms');
  };

  const openPrivacy = () => {
    Keyboard.dismiss();
    onClose();
    router.push('/privacy');
  };

  const askForNotifications = () => {
    Notifications.getPermissionsAsync()
      .then(({ status }: { status: string }) => (status !== 'granted' ? Notifications.requestPermissionsAsync() : null))
      .catch(() => {});
  };

  const finish = () => {
    Keyboard.dismiss();
    onClose();
    if (onLoginSuccess) setTimeout(() => onLoginSuccess(), 300);
  };

  // ── Step 1: phone ──
  const sendOtp = async () => {
    if (mobile.length !== 10 || (isFirstTime && !termsAccepted) || loading) return;
    Haptics.selectionAsync().catch(() => {});
    setLoading(true); setError(null);
    try {
      const res = await API.sendOtp(mobile);
      const existing = !!res.isExistingUser;
      setIsExisting(existing);
      if (existing) {
        setIsFirstTime(false);
        setTermsAccepted(true);
        AsyncStorage.setItem(HAS_LOGGED_IN_KEY, 'true').catch(() => {});
      }
      setOtpId(res.otpId || null);
      setOtp('');
      setResendIn(RESEND_SECONDS);
      setStep('otp');
    } catch (e: any) {
      setError(e?.message || 'Could not send the code. Please check your number and try again.');
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0 || loading) return;
    setLoading(true); setError(null);
    try {
      const res = await API.sendOtp(mobile);
      setOtpId(res.otpId || null);
      setOtp('');
      setResendIn(RESEND_SECONDS);
    } catch (e: any) {
      setError(e?.message || 'Could not resend the code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: code ──
  const verify = async (raw = otp) => {
    const code = digitsOf(raw);
    if (code.length !== OTP_LENGTH || loading) return;
    setError(null);
    if (!isExisting) {
      // A new customer's account is created together with their name (next step).
      setStep('profile');
      return;
    }
    setLoading(true);
    try {
      const { token, refreshToken, user } = await API.verifyOtp(mobile, code, '', '', otpId || undefined);
      await AsyncStorage.setItem(HAS_LOGGED_IN_KEY, 'true').catch(() => {});
      await login(token, refreshToken, user);
      askForNotifications();
      finish();
    } catch (e: any) {
      const msg = String(e?.message || '');
      setError(isOtpError(msg) || !msg ? 'Invalid code. Please try again' : msg);
      setOtp('');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: profile (new customers) ──
  const emailOk = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canCreate = name.trim().length >= 2 && confirmed && emailOk && !loading;

  const createAccount = async () => {
    if (!canCreate) return;
    Haptics.selectionAsync().catch(() => {});
    setLoading(true); setError(null);
    try {
      const { token, refreshToken, user } = await API.verifyOtp(mobile, digitsOf(otp), name.trim(), referral, otpId || undefined);
      await AsyncStorage.setItem(HAS_LOGGED_IN_KEY, 'true').catch(() => {});
      await login(token, refreshToken, user);
      // Email is optional and saved after the account exists; a failure here never blocks sign-in.
      if (email.trim()) saveProfile({ email: email.trim() }).catch(() => {});
      askForNotifications();
      finish();
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (isOtpError(msg)) {
        // The code turned out to be wrong or expired: back to the code step with the design's error state.
        setOtp('');
        setStep('otp');
        setError('Invalid code. Please try again');
      } else {
        setError(msg || 'Could not create your account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const back = () => { setStep('phone'); setOtp(''); setError(null); };

  // ── Render ──
  const cta = step === 'phone'
    ? { label: 'Send OTP', enabled: mobile.length === 10 && (isFirstTime ? termsAccepted : true) && !loading, onPress: sendOtp }
    : step === 'otp'
      ? { label: 'Verify & Continue', enabled: digitsOf(otp).length === OTP_LENGTH && !loading, onPress: () => verify() }
      : { label: 'Continue', enabled: canCreate, onPress: createAccount };

  const field = (key: string, border = ui.fieldBorder) => [
    styles.field,
    { backgroundColor: ui.fieldBg, borderColor: focus === key ? ui.fieldFocus : border },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={() => (step === 'otp' ? back() : !loading && !required && onClose())} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.overlay}>
        <ModalBlur />
        <Pressable style={StyleSheet.absoluteFill} onPress={() => (step === 'phone' && !loading && !required ? onClose() : Keyboard.dismiss())} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: ui.sheet, paddingBottom: Math.max(insets.bottom, 16) }]}>

          {step === 'phone' && (
            <>
              <View style={styles.headRow}>
                <Text style={[styles.title, { color: ui.title, flex: 1 }]}>Get started with My Sawari</Text>
              </View>
              <Text style={[styles.copy, { color: ui.copy }]}>We'll use your phone number to verify your account. No spam, we promise.</Text>
              <View style={field('phone')}>
                <Text style={[styles.cc, { color: ui.copy }]}>+91</Text>
                <TextInput
                  value={group(mobile)}
                  onChangeText={(t) => {
                    const d = t.replace(/\D/g, '');
                    // A pasted "+91 98765 43210" or "098765 43210" drops the prefix.
                    setMobile(d.length > 10 && /^(91|0)/.test(d) ? d.slice(-10) : d.slice(0, 10));
                    setError(null);
                  }}
                  onFocus={() => setFocus('phone')}
                  onBlur={() => setFocus(null)}
                  keyboardType="number-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  maxLength={11}
                  autoFocus
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={sendOtp}
                  style={[styles.input, { color: ui.title }]}
                  accessibilityLabel="Mobile number"
                />
              </View>
              {!!error && <Text style={[styles.error, { color: ui.error, textAlign: 'left' }]}>{error}</Text>}
              {isFirstTime ? (
                <View style={styles.checkRow}>
                  <Pressable
                    onPress={() => setTermsAccepted((accepted) => !accepted)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: termsAccepted }}
                    accessibilityLabel="Agree to Terms and Conditions and Privacy Policy"
                    hitSlop={6}
                  >
                    <View style={[styles.check, { borderColor: termsAccepted ? ui.navy : ui.faint, backgroundColor: termsAccepted ? ui.navy : 'transparent' }]}>
                      {termsAccepted && <Feather name="check" size={10} color="#FFFFFF" />}
                    </View>
                  </Pressable>
                  <Text style={[styles.terms, { color: ui.copy }]}>
                    By continuing, you agree to our{' '}
                    <Text style={{ color: ui.navy, textDecorationLine: 'underline' }} onPress={openTerms}>Terms &amp; Conditions</Text>
                    {'  '}and{' '}
                    <Text style={{ color: ui.navy, textDecorationLine: 'underline' }} onPress={openPrivacy}>Privacy Policy</Text>.
                  </Text>
                </View>
              ) : (
                <Text style={[styles.terms, { color: ui.copy, textAlign: 'center', marginTop: 4 }]}>
                  By continuing, you agree to our{' '}
                  <Text style={{ color: ui.navy, textDecorationLine: 'underline' }} onPress={openTerms}>Terms &amp; Conditions</Text>
                  {'  '}and{' '}
                  <Text style={{ color: ui.navy, textDecorationLine: 'underline' }} onPress={openPrivacy}>Privacy Policy</Text>.
                </Text>
              )}
            </>
          )}

          {step === 'otp' && (
            <>
              <View style={styles.otpHead}>
                <Pressable onPress={back} style={[styles.round, { backgroundColor: ui.roundBtn }]} accessibilityRole="button" accessibilityLabel="Back">
                  <Feather name="chevron-left" size={24} color={ui.copy} />
                </Pressable>
                <Text style={[styles.title, styles.center, { color: ui.title, flex: 1 }]}>Verify your account</Text>
                {required ? <View style={styles.round} /> : (
                <Pressable onPress={() => !loading && onClose()} style={[styles.round, { backgroundColor: ui.fieldBg }]} accessibilityRole="button" accessibilityLabel="Close">
                  <Feather name="x" size={20} color={ui.copy} />
                </Pressable>)}
              </View>
              <Text style={[styles.small, styles.center, { color: ui.copy }]}>
                Enter the 6-digit code sent to WhatsApp{'\n'}{masked(mobile)} ·{' '}
                <Text style={{ color: ui.navy, fontFamily: 'PlusJakartaSans_600SemiBold' }} onPress={back} accessibilityRole="button">Change</Text>
              </Text>
              <OtpBoxes
                value={otp}
                onChange={(v) => { setOtp(v); if (error) setError(null); }}
                onComplete={(code) => { if (isExisting) verify(code); }}
                editable={!loading}
                ui={ui}
                hasError={!!error}
              />
              {!!error && <Text style={[styles.error, { color: ui.error, marginTop: 0 }]}>{error}</Text>}
              <Text style={[styles.small, styles.center, { color: ui.copy }]}>
                Didn't receive the OTP?{' '}
                {resendIn > 0 ? (
                  <Text>Resend in 00:{String(resendIn).padStart(2, '0')}</Text>
                ) : (
                  <Text style={{ color: ui.navy, fontFamily: 'PlusJakartaSans_600SemiBold' }} onPress={resend} accessibilityRole="button">Resend</Text>
                )}
              </Text>
            </>
          )}

          {step === 'profile' && (
            <>
              <View style={{ gap: 8, minHeight: 60, justifyContent: 'center' }}>
                <Text style={[styles.title, { color: ui.title }]}>Let’s complete your profile</Text>
                <Text style={[styles.copyPlain, { color: ui.copy }]}>Add your details to get started with MySawari.</Text>
              </View>
              <View style={{ gap: 12, minHeight: 190 }}>
                <View style={{ gap: 4 }}>
                  <Text style={[styles.label, { color: ui.copy }]}>FULL NAME</Text>
                  <View style={field('name', ui.field2)}>
                    <TextInput
                      value={name}
                      onChangeText={(t) => { setName(t.replace(/\s{2,}/g, ' ').slice(0, 60)); setError(null); }}
                      onFocus={() => setFocus('name')}
                      onBlur={() => setFocus(null)}
                      placeholder="Enter your full name"
                      placeholderTextColor={ui.copy}
                      autoCapitalize="words"
                      textContentType="name"
                      autoComplete="name"
                      autoFocus
                      style={[styles.input, { color: ui.title }]}
                    />
                  </View>
                </View>
                <View style={{ gap: 4 }}>
                  <Text style={[styles.label, { color: ui.copy }]}>EMAIL ADDRESS</Text>
                  <View style={field('email', ui.field2)}>
                    <TextInput
                      value={email}
                      onChangeText={(t) => { setEmail(t.trim()); setError(null); }}
                      onFocus={() => setFocus('email')}
                      onBlur={() => setFocus(null)}
                      placeholder="Enter your email address"
                      placeholderTextColor={ui.copy}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      textContentType="emailAddress"
                      autoComplete="email"
                      style={[styles.input, { color: ui.title }]}
                    />
                  </View>
                  <Text style={[styles.small, { color: emailOk ? ui.copy : ui.error }]}>
                    {emailOk ? 'We’ll use this for booking updates and receipts.' : 'Please enter a valid email address.'}
                  </Text>
                </View>
              </View>
              <View style={field('ref')}>
                <TextInput
                  value={referral}
                  // Codes are letters and digits only; a pasted space, dash or emoji would make signup fail.
                  onChangeText={(t) => setReferral(t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20))}
                  onFocus={() => setFocus('ref')}
                  onBlur={() => setFocus(null)}
                  placeholder="Referral Code(Optional)"
                  placeholderTextColor={ui.copy}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  style={[styles.input, { color: ui.title }]}
                />
              </View>
              <Pressable onPress={() => setConfirmed((v) => !v)} style={styles.checkRow} accessibilityRole="checkbox" accessibilityState={{ checked: confirmed }}>
                <View style={[styles.check, { borderColor: confirmed ? ui.navy : ui.faint, backgroundColor: confirmed ? ui.navy : 'transparent' }]}>
                  {confirmed && <Feather name="check" size={10} color="#FFFFFF" />}
                </View>
                <Text style={[styles.checkText, { color: ui.copy }]}>
                  I confirm that my full name matches the name on my valid government-issued ID.
                </Text>
              </Pressable>
              {!!error && <Text style={[styles.error, { color: ui.error, textAlign: 'left' }]}>{error}</Text>}
            </>
          )}

          <Pressable
            disabled={!cta.enabled}
            onPress={cta.onPress}
            accessibilityRole="button"
            accessibilityState={{ disabled: !cta.enabled }}
            testID={`login-${step}-cta`}
            style={({ pressed }) => [styles.cta, { backgroundColor: cta.enabled || loading ? ui.navy : ui.disabledBg, opacity: pressed ? 0.9 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color={ui.onNavy} />
            ) : (
              <Text style={[styles.ctaText, { color: cta.enabled ? ui.onNavy : ui.disabledText }]}>{cta.label}</Text>
            )}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/**
 * Four code boxes. Each is a real input: typing moves to the next box, backspace on an empty box steps back,
 * and a pasted (or SMS-autofilled) code fills them all. Gaps are kept as spaces so a skipped box stays in place.
 */
function OtpBoxes({ value, onChange, onComplete, editable, ui, hasError }: {
  value: string;
  onChange: (next: string) => void;
  onComplete: (code: string) => void;
  editable: boolean;
  ui: typeof LIGHT;
  hasError: boolean;
}) {
  const inputs = useRef<(TextInput | null)[]>([]);
  const [focused, setFocused] = useState<number | null>(null);
  const slots = Array.from({ length: OTP_LENGTH }, (_, i) => (value[i] && value[i] !== ' ' ? value[i] : ''));

  // A cleared code (wrong code, resend) puts the cursor back in the first box.
  useEffect(() => { if (!value) setTimeout(() => inputs.current[0]?.focus(), 50); }, [value]);

  const commit = (next: string[]) => {
    onChange(next.map((d) => d || ' ').join('').replace(/\s+$/, ''));
    if (next.every(Boolean)) onComplete(next.join(''));
  };

  const change = (text: string, i: number) => {
    const digits = text.replace(/\D/g, '');
    const next = [...slots];
    if (!digits) { next[i] = ''; commit(next); return; }
    if (digits.length > 1) {
      for (let k = 0; k < digits.length && i + k < OTP_LENGTH; k++) next[i + k] = digits[k];
      commit(next);
      inputs.current[Math.min(i + digits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    next[i] = digits;
    commit(next);
    if (i < OTP_LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  return (
    <View style={styles.otpRow}>
      {slots.map((d, i) => (
        <TextInput
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          value={d}
          onChangeText={(t) => change(t, i)}
          onKeyPress={({ nativeEvent }) => { if (nativeEvent.key === 'Backspace' && !slots[i] && i > 0) inputs.current[i - 1]?.focus(); }}
          onFocus={() => setFocused(i)}
          onBlur={() => setFocused((c) => (c === i ? null : c))}
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete={i === 0 ? 'sms-otp' : 'off'}
          maxLength={OTP_LENGTH}
          editable={editable}
          autoFocus={i === 0}
          selectTextOnFocus
          accessibilityLabel={`Digit ${i + 1} of ${OTP_LENGTH}`}
          style={[
            styles.otpBox,
            {
              color: ui.title,
              backgroundColor: hasError ? ui.errorBg : ui.fieldBg,
              borderColor: hasError ? ui.errorBorder : focused === i ? ui.fieldFocus : ui.fieldBorder,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(38,38,38,0.32)' },
  // Design: white sheet, 1px #E7EAF4 border (not on the bottom edge), 24 top corners, 16 side padding, 16 between blocks.
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: '#E7EAF4', paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28 },
  center: { textAlign: 'center' },
  copy: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, lineHeight: 22, marginTop: -8 },
  copyPlain: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, lineHeight: 22 },
  small: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, height: 52, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12 },
  cc: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 17 },
  input: { flex: 1, height: '100%', padding: 0, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 17 },
  terms: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20 },
  otpHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  round: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  otpRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  otpBox: { width: 46, height: 50, borderWidth: 1, borderRadius: 8, textAlign: 'center', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 18, padding: 0 },
  error: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: -4 },
  label: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 17 },
  checkRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  check: { width: 15, height: 15, borderRadius: 4, borderWidth: 1.5, marginTop: 4, alignItems: 'center', justifyContent: 'center' },
  checkText: { flex: 1, fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20 },
  cta: { height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28 },
});