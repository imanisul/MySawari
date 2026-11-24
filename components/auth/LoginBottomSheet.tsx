import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, AppState, BackHandler, Dimensions, Easing, Keyboard, LayoutAnimation, Modal, Pressable, StyleSheet, Text, TextInput, View, useWindowDimensions,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useKeyboardPad } from '@/hooks/useKeyboardPad';
import { Feather } from '@expo/vector-icons';
import * as Haptics from '@/utils/haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import Notifications from '@/utils/notifications';
import { ModalBlur } from '@/components/common/ModalBlur';
import { PolicyDocumentScreen, PolicyKey } from '@/screens/Support/PolicyScreen';
import {
  getPendingReferral,
  detectReferralFromClipboard,
  clearPendingReferral,
  PendingReferral,
} from '@/utils/referralLinkHandler';

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
const RESEND_SECONDS = 30;

/**
 * Last code sent to each number in this app session (outlives the sheet, which resets every time it opens).
 * The server allows one send per number every 30 s, so tapping "Send OTP" again for the same number (after editing
 * it, or closing and reopening the sheet) reuses that code and its timer instead of asking the server again — which
 * only answered "Please wait 25 seconds".
 */
const lastSends = new Map<string, { at: number; cooldownSec: number; otpId: string | null; isExisting: boolean }>();
const secondsLeft = (mobile: string, now = Date.now()) => {
  const s = lastSends.get(mobile);
  return s ? Math.max(0, Math.ceil((s.at + s.cooldownSec * 1000 - now) / 1000)) : 0;
};
/** The server's "Please wait 25 seconds before requesting another OTP" → 25, else 0. */
const serverWaitSeconds = (msg: string) => {
  const m = msg.match(/wait\s+(\d+)\s+sec/i);
  return m ? parseInt(m[1], 10) || 0 : 0;
};
const HAS_LOGGED_IN_KEY = '@mysawari_has_logged_in_before';
// Read once when the app starts, so the sheet knows on its very first frame whether to ask for the terms
// (it used to show the tick for a moment on every open until the saved flag arrived, which jumped the layout).
let loggedInBefore: boolean | null = null;
AsyncStorage.getItem(HAS_LOGGED_IN_KEY).then((v) => { loggedInBefore = v === 'true'; }).catch(() => {});
const markLoggedIn = () => { loggedInBefore = true; AsyncStorage.setItem(HAS_LOGGED_IN_KEY, 'true').catch(() => {}); };
const SHEET_OFFSET = Dimensions.get('window').height;

/** Extracts a 6-digit OTP code from SMS text, WhatsApp messages, or raw clipboard content. */
export function extractOtpCode(text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  // 1. Raw exact 6 digits: "123456"
  if (/^\d{6}$/.test(trimmed)) return trimmed;
  // 2. WhatsApp bold: "*123456*" or "* 123456 *"
  const starMatch = trimmed.match(/\*\s*(\d{6})\s*\*/);
  if (starMatch && starMatch[1]) return starMatch[1];
  // 3. Keyword followed by 6 digits (allowing symbols like :, *, -, spaces, quotes, newlines)
  const kw = trimmed.match(/(?:otp|code|verification|login|mysawari|password|pin)[^\d]{0,25}(\d{6})\b/i);
  if (kw && kw[1]) return kw[1];
  // 4. "123456 is your verification code / OTP"
  const trail = trimmed.match(/\b(\d{6})\b[^\d]{0,20}(?:is\s+your|to\s+login|for\s+mysawari)/i);
  if (trail && trail[1]) return trail[1];
  // 5. Standalone 6-digit sequence not part of phone number
  const matches = trimmed.match(/(?<!\d)\d{6}(?!\d)/g);
  if (matches && matches.length === 1) return matches[0];
  if (matches && matches.length > 1) {
    const near = trimmed.match(/(?:otp|code|verification|login|mysawari)[\s\S]*?(?<!\d)(\d{6})(?!\d)/i);
    if (near && near[1]) return near[1];
    return matches[0];
  }
  return null;
}

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
  navy: '#6B5AED',
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
/** The typed code without any non-digits or hidden formatting characters. */
const digitsOf = (v: string) => String(v || '').replace(/\D/g, '').slice(0, OTP_LENGTH);
const isOtpError = (msg: string) => /\botp\b|incorrect|invalid/i.test(msg) && !/referral/i.test(msg);

const formatAuthError = (err: any): string => {
  const msg = String(err?.message || '');
  if (!msg) return 'Invalid code. Please try again';
  if (/expired/i.test(msg)) return 'OTP has expired. Please tap Resend to get a new code.';
  if (/too many|wait|cooldown|blocked|locked/i.test(msg)) return msg;
  if (isOtpError(msg)) return 'Invalid code. Please try again';
  return msg;
};

export function LoginBottomSheet({
  visible, onClose, onLoginSuccess, required = false,
}: {
  visible: boolean;
  onClose: () => void;
  onLoginSuccess?: () => void;
  /** Legacy prop (callers still pass it): the sheet shows no SKIP any more. */
  showSkip?: boolean;
  /** Mandatory sign-in (first launch): no way to dismiss the sheet. Otherwise tapping outside closes it. */
  required?: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const kb = useKeyboardPad();
  const { login, saveProfile, isDarkMode } = useSawari();
  const ui = isDarkMode
    ? {
        sheet: colors.card, title: colors.foreground, copy: colors.mutedForeground, faint: colors.mutedForeground,
        fieldBg: colors.muted, fieldBorder: colors.border, field2: colors.border, fieldFocus: colors.mutedForeground,
        navy: '#3E509A', onNavy: '#FFFFFF', disabledBg: colors.disabledBg, disabledText: colors.disabledText,
        roundBtn: colors.secondary, error: colors.destructive, errorBg: colors.destructive + '14', errorBorder: colors.destructive + '40',
      }
    : LIGHT;

  // Each step eases in (fade + a short rise); the final "done" step pops its check mark in.
  // Focus the number field once the sheet has finished sliding up. With autoFocus the keyboard rose while the sheet
  // was still moving, and the two motions fought each other (the "shake").
  const phoneRef = useRef<TextInput>(null);
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);
  const slidingRef = useRef(false);
  const isVerifyingRef = useRef(false);
  const stepAnim = useRef(new Animated.Value(1)).current;
  const sheetAnim = useRef(new Animated.Value(SHEET_OFFSET)).current;
  const doneScale = useRef(new Animated.Value(0)).current;
  const [welcomeName, setWelcomeName] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'profile' | 'done'>('phone');
  const stepRef = useRef(step);
  stepRef.current = step;
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpId, setOtpId] = useState<string | null>(null);
  const [isExisting, setIsExisting] = useState(false);
  const [isFirstTime, setIsFirstTime] = useState(loggedInBefore !== true);
  const [flagKnown, setFlagKnown] = useState(loggedInBefore !== null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [referral, setReferral] = useState('');
  const [pendingReferral, setPendingReferral] = useState<PendingReferral | null>(null);
  const [referralValidating, setReferralValidating] = useState(false);
  const [referralStatusMsg, setReferralStatusMsg] = useState<{ text: string; valid: boolean } | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);
  const [focus, setFocus] = useState<string | null>(null);
  const [viewingPolicy, setViewingPolicy] = useState<PolicyKey | null>(null);

  // Android can drop the first focus() in a Modal that just opened (its window isn't focused yet), so check once and retry.
  const focusPhone = () => {
    phoneRef.current?.focus();
    setTimeout(() => {
      if (stepRef.current !== 'phone' || Keyboard.isVisible()) return;
      phoneRef.current?.blur();
      phoneRef.current?.focus();
    }, 250);
  };

  // Fresh sheet every time it opens.
  useEffect(() => {
    API.warmUpBackend();
    if (!visible) return;
    setStep('phone'); setMobile(''); setOtp(''); setOtpId(null); setIsExisting(false);
    setName(''); setEmail(''); setReferral(''); setConfirmed(false);
    setLoading(false); setError(null); setResendIn(0);
    setViewingPolicy(null);
    setReferralStatusMsg(null);

    // If user has logged in before on this device, it's 2nd time: don't show tick button and auto-accept
    if (loggedInBefore !== null) { setIsFirstTime(!loggedInBefore); setTermsAccepted(loggedInBefore); }
    AsyncStorage.getItem(HAS_LOGGED_IN_KEY)
      .then((val) => {
        const hasLoggedIn = val === 'true';
        loggedInBefore = hasLoggedIn;
        setIsFirstTime(!hasLoggedIn);
        setTermsAccepted(hasLoggedIn);
        setFlagKnown(true);
      })
      .catch(() => {
        setIsFirstTime(true);
        setTermsAccepted(false);
        setFlagKnown(true);
      });

    // Detect referral from pending storage or clipboard (Navi pattern)
    getPendingReferral().then((ref) => {
      if (ref) {
        setPendingReferral(ref);
        setReferral(ref.code);
        setReferralStatusMsg({ text: `Referred by ${ref.referrerName}`, valid: true });
      } else {
        detectReferralFromClipboard().then((clipRef) => {
          if (clipRef) {
            setPendingReferral(clipRef);
            setReferral(clipRef.code);
            setReferralStatusMsg({ text: `Referred by ${clipRef.referrerName}`, valid: true });
          }
        }).catch(() => {});
      }
    }).catch(() => {});

    sheetAnim.setValue(SHEET_OFFSET);
    slidingRef.current = true;
    Animated.timing(sheetAnim, {
      toValue: 0,
      duration: 320,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      slidingRef.current = false;
      // Keyboard up the moment the sheet lands (not on a fixed timer that could fire late or mid-slide).
      if (stepRef.current === 'phone') focusPhone();
    });
  }, [visible]);

  // Ensure referral code is populated if detected during flow when entering profile step
  useEffect(() => {
    if (step === 'profile' && !referral) {
      getPendingReferral().then((ref) => {
        if (ref) {
          setPendingReferral(ref);
          setReferral(ref.code);
          setReferralStatusMsg({ text: `Referred by ${ref.referrerName}`, valid: true });
        }
      }).catch(() => {});
    }
  }, [step, referral]);

  // Debounced real-time validation when user types or edits referral code on Profile step
  useEffect(() => {
    if (step !== 'profile') return;
    const clean = referral.trim().toUpperCase();
    if (!clean) {
      setReferralStatusMsg(null);
      setReferralValidating(false);
      return;
    }
    if (pendingReferral && pendingReferral.code === clean) {
      setReferralStatusMsg({ text: `Referred by ${pendingReferral.referrerName}`, valid: true });
      setReferralValidating(false);
      return;
    }
    if (clean.length < 4) {
      setReferralStatusMsg(null);
      setReferralValidating(false);
      return;
    }

    setReferralValidating(true);
    const timer = setTimeout(async () => {
      try {
        const res = await API.validateReferralCode(clean);
        if (res && res.valid) {
          setReferralStatusMsg({ text: `Referred by ${res.referrerName}`, valid: true });
          setPendingReferral({
            code: clean,
            referrerName: res.referrerName,
            rewardText: res.rewardText,
            bonusSawariCash: res.bonusSawariCash,
            detectedAt: Date.now(),
          });
        } else {
          setReferralStatusMsg({ text: 'Referral code not found', valid: false });
        }
      } catch (err: any) {
        setReferralStatusMsg({ text: err?.message || 'Referral code not found', valid: false });
      } finally {
        setReferralValidating(false);
      }
    }, 450);

    return () => clearTimeout(timer);
  }, [step, referral, pendingReferral]);

  useEffect(() => {
    // The sheet changes height between steps; easing that (and only fading the content in) keeps it from jolting.
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    stepAnim.setValue(0);
    Animated.timing(stepAnim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    if (step === 'done') {
      doneScale.setValue(0);
      Animated.spring(doneScale, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
    }
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!visible || step !== 'phone') return;

    // Opening: the slide's end focuses it (above). Coming back to this step inside an open sheet: focus right away.
    if (slidingRef.current) return;
    const t = setTimeout(focusPhone, 60);

    return () => clearTimeout(t);
  }, [visible, step]);

  // Resend countdown.
  useEffect(() => {
    if (step !== 'otp' || resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [step, resendIn]);

  const openTerms = () => {
    Keyboard.dismiss();
    setViewingPolicy('terms');
  };

  const openPrivacy = () => {
    Keyboard.dismiss();
    setViewingPolicy('privacy');
  };

  const askForNotifications = () => {
    Notifications.getPermissionsAsync()
      .then(({ status }: { status: string }) => (status !== 'granted' ? Notifications.requestPermissionsAsync() : null))
      .catch(() => {});
  };

  const finish = (sessionSaved: Promise<unknown> = Promise.resolve()) => {
    Keyboard.dismiss();
    clearPendingReferral().catch(() => {});
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

    setError(null);
    setStep('done');

    // Smooth auto-dismiss: checkmark pops with spring, then auto-closes after 800ms
    setTimeout(() => {
      if (!mountedRef.current) return;
      onClose();

      // Run the success callback after the session has been saved.
      sessionSaved
        .catch(() => {})
        .then(() => {
          if (onLoginSuccess && mountedRef.current) {
            setTimeout(() => {
              if (mountedRef.current) onLoginSuccess();
            }, 200);
          }
        });
    }, 800);
  };

  // ── Auto-detect OTP from clipboard (SMS / WhatsApp) ──
  const lastDetectedOtp = useRef<string | null>(null);
  const [detectedClipOtp, setDetectedClipOtp] = useState<string | null>(null);

  const checkClipboardForOtp = async () => {
    if (step !== 'otp' || loading || isVerifyingRef.current) return;
    try {
      const hasString = await Clipboard.hasStringAsync();
      if (!hasString) return;
      const text = await Clipboard.getStringAsync();
      if (!text) return;
      const detected = extractOtpCode(text);
      if (detected && detected.length === OTP_LENGTH) {
        setDetectedClipOtp(detected);
        // Automatically fill and verify if user has not yet entered a full code
        if (detected !== lastDetectedOtp.current && (!otp || otp.trim().length === 0)) {
          lastDetectedOtp.current = detected;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          setOtp(detected);
          verify(detected);
        }
      }
    } catch {}
  };

  useEffect(() => {
    if (step !== 'otp') {
      setDetectedClipOtp(null);
      return;
    }
    // Check clipboard immediately on entering OTP step (only while OTP box is still empty)
    if (!otp || otp.trim().length === 0) {
      checkClipboardForOtp();
    }
    const timer = setTimeout(() => {
      if (mountedRef.current && (!otp || otp.trim().length === 0)) checkClipboardForOtp();
    }, 400);

    // Gentle 3s polling while waiting with an empty OTP box (avoids native bridge / iOS paste-banner spam)
    const interval = setInterval(() => {
      if (mountedRef.current && (!otp || otp.trim().length === 0)) {
        checkClipboardForOtp();
      }
    }, 3000);

    // AppState listener for switching from WhatsApp / SMS back to app (instant catch!)
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && mountedRef.current) {
        checkClipboardForOtp();
      }
    });

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      sub.remove();
    };
  }, [step, loading, otp]);

  // ── Step 1: phone ──
  useEffect(() => { LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); }, [error]);

  const sendOtp = async () => {
    if (mobile.length !== 10 || (isFirstTime && !termsAccepted) || loading || isVerifyingRef.current) return;
    Haptics.selectionAsync().catch(() => {});
    setError(null);

    // A code already went to this number moments ago: go straight to entering it, with the time left to resend.
    const left = secondsLeft(mobile);
    const prev = lastSends.get(mobile);
    if (left > 0 && prev) {
      setIsExisting(prev.isExisting);
      if (prev.isExisting) { setIsFirstTime(false); setTermsAccepted(true); }
      setOtpId(prev.otpId);
      setOtp('');
      setResendIn(left);
      setStep('otp');
      return;
    }

    setLoading(true);
    lastDetectedOtp.current = null;
    setDetectedClipOtp(null);
    try {
      const res = await API.sendOtp(mobile);
      const existing = !!res.isExistingUser;
      setIsExisting(existing);
      if (existing) {
        setIsFirstTime(false);
        setTermsAccepted(true);
        markLoggedIn();
      }
      setOtpId(res.otpId || null);
      setOtp('');
      const cooldown = typeof res.cooldownSec === 'number' && res.cooldownSec > 0 ? res.cooldownSec : RESEND_SECONDS;
      lastSends.set(mobile, { at: Date.now(), cooldownSec: cooldown, otpId: res.otpId || null, isExisting: existing });
      setResendIn(cooldown);
      setStep('otp');

      // Direct auto-fetch if returned (dev/reviewer mode)
      if (res.otp && String(res.otp).length === OTP_LENGTH) {
        const autoOtp = String(res.otp);
        setTimeout(() => {
          setOtp(autoOtp);
          lastDetectedOtp.current = autoOtp;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          verify(autoOtp);
        }, 500);
      }
    } catch (e: any) {
      const msg = String(e?.message || '');
      const wait = serverWaitSeconds(msg);
      if (wait > 0) {
        // The server already sent a code to this number (another tap, another device): it is on its way, so
        // carry on to entering it with the server's own timer — no error.
        setOtp('');
        setResendIn(wait);
        setStep('otp');
      } else {
        setError(msg || 'Could not send the code. Please check your number and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (resendIn > 0 || loading || isVerifyingRef.current) return;
    // The sheet's timer can be behind the last send (sheet reopened): never ask the server before 30 s are up.
    const left = secondsLeft(mobile);
    if (left > 0) { setResendIn(left); return; }
    setLoading(true); setError(null);
    lastDetectedOtp.current = null;
    setDetectedClipOtp(null);
    try {
      const res = await API.sendOtp(mobile);
      setOtpId(res.otpId || null);
      setOtp('');
      const cooldown = typeof res.cooldownSec === 'number' && res.cooldownSec > 0 ? res.cooldownSec : RESEND_SECONDS;
      lastSends.set(mobile, { at: Date.now(), cooldownSec: cooldown, otpId: res.otpId || null, isExisting });
      setResendIn(cooldown);
      if (res.otp && String(res.otp).length === OTP_LENGTH) {
        const autoOtp = String(res.otp);
        setTimeout(() => {
          setOtp(autoOtp);
          lastDetectedOtp.current = autoOtp;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
          verify(autoOtp);
        }, 500);
      }
    } catch (e: any) {
      const msg = String(e?.message || '');
      const wait = serverWaitSeconds(msg);
      if (wait > 0) {
        // Too soon by the server's clock: just run the timer again (it already says when Resend is ready).
        setResendIn(wait);
      } else {
        setError(msg || 'Could not resend the code. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: code ──
  const verify = async (raw = otp) => {
    const code = digitsOf(raw);
    if (code.length !== OTP_LENGTH || isVerifyingRef.current || loading) return;
    isVerifyingRef.current = true;
    setError(null);
    setLoading(true);
    if (!isExisting) {
      // A new customer's code is checked here, once, so a wrong or expired code is found now — not after
      // they have filled in their name and referral code. The account is created together with the name (next step).
      try {
        const checkRes = await API.checkOtp(mobile, code, otpId || undefined);
        if (checkRes?.matchedOtpId) {
          setOtpId(checkRes.matchedOtpId);
        }
        setStep('profile');
      } catch (e: any) {
        setError(formatAuthError(e));
        setOtp('');
      } finally {
        setLoading(false);
        isVerifyingRef.current = false;
      }
      return;
    }
    try {
      const { token, refreshToken, user } = await API.verifyOtp(mobile, code, '', '', otpId || undefined);
      markLoggedIn();
      setWelcomeName(String(user?.name || '').trim().split(/\s+/)[0] || '');
      // "You're in" shows the moment the server says yes; the session is saved underneath it.
      finish(login(token, refreshToken, user));
      askForNotifications();
    } catch (e: any) {
      setError(formatAuthError(e));
      setOtp('');
    } finally {
      setLoading(false);
      isVerifyingRef.current = false;
    }
  };

  // ── Step 3: profile (new customers) ──
  const emailOk = !email.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const canCreate = name.trim().length >= 2 && confirmed && emailOk && !loading && !isVerifyingRef.current;

  const createAccount = async () => {
    if (!canCreate || isVerifyingRef.current) return;
    isVerifyingRef.current = true;
    Haptics.selectionAsync().catch(() => {});
    setLoading(true); setError(null);
    try {
      const { token, refreshToken, user } = await API.verifyOtp(mobile, digitsOf(otp), name.trim(), referral, otpId || undefined);
      markLoggedIn();
      clearPendingReferral().catch(() => {});
      setWelcomeName(name.trim().split(/\s+/)[0]);
      const sessionSaved = login(token, refreshToken, user);
      // Email is optional and saved once the session exists; a failure here never blocks sign-in.
      if (email.trim()) sessionSaved.then(() => saveProfile({ email: email.trim() })).catch(() => {});
      askForNotifications();
      finish(sessionSaved);
    } catch (e: any) {
      const msg = String(e?.message || '');
      if (isOtpError(msg) || /expired/i.test(msg)) {
        // The code turned out to be wrong or expired: back to the code step with the design's error state.
        setOtp('');
        setStep('otp');
        setError(formatAuthError(e));
      } else {
        setError(msg || 'Could not create your account. Please try again.');
      }
    } finally {
      setLoading(false);
      isVerifyingRef.current = false;
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
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {
        if (step === 'done') return;
        if (viewingPolicy) {
          setViewingPolicy(null);
        } else if (loading) {
          // wait for the request to finish
        } else if (!required) {
          onClose();
        } else {
          // Phone button back never returns to the number step; only "Change" on the code step goes back.
          BackHandler.exitApp();
        }
      }}
      statusBarTranslucent
      navigationBarTranslucent
    >
      {viewingPolicy ? (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: ui.sheet, zIndex: 999 }]}>
          <PolicyDocumentScreen policyKey={viewingPolicy} onBack={() => setViewingPolicy(null)} />
        </View>
      ) : (
        <View ref={kb.ref} collapsable={false} style={styles.overlay}>
          <ModalBlur />
          <Pressable style={StyleSheet.absoluteFill} onPress={() => (step === 'phone' && !loading && !required ? onClose() : Keyboard.dismiss())} accessibilityLabel="Close" />
          {/* The white sheet runs down behind the keyboard; its content sits above it. */}
          <Animated.View style={[styles.sheet, { backgroundColor: ui.sheet, paddingBottom: kb.pad > 0 ? kb.pad + 16 : Math.max(insets.bottom, 16), transform: [{ translateY: sheetAnim }] }]}>

          <Animated.View style={[styles.stepWrap, { opacity: stepAnim }]}>
          {step === 'phone' && (
            <>
              <View style={styles.headRow}>
                <Text style={[styles.title, { color: ui.title, flex: 1 }]}>Get started with MySawari</Text>
              </View>
              <Text style={[styles.copy, { color: ui.copy }]}>We'll use your phone number to verify your account. No spam, we promise.</Text>

              {!!pendingReferral && (
                <View style={[styles.naviBanner, { backgroundColor: isDarkMode ? '#1F2747' : '#EEF0F7', borderColor: isDarkMode ? '#262F57' : '#D5D9EA' }]}>
                  <View style={styles.naviBannerLeft}>
                    <View style={[styles.naviIconCircle, { backgroundColor: '#6B5AED' }]}>
                      <Feather name="gift" size={13} color="#FFFFFF" />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.naviBannerTitle, { color: isDarkMode ? '#E3E6F1' : '#1F2747' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                        Referred by <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{pendingReferral.referrerName}</Text>
                      </Text>
                      <Text style={[styles.naviBannerSub, { color: isDarkMode ? '#A5B4FC' : '#6B5AED' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                        {pendingReferral.rewardText || '100 SawariCash on signup'} • Applied
                      </Text>
                    </View>
                  </View>
                  <View style={styles.naviPillBadge}>
                    <Feather name="check" size={11} color="#059669" />
                    <Text style={styles.naviPillText}>Applied</Text>
                  </View>
                </View>
              )}

              <View style={field('phone')}>
                <Text style={[styles.cc, { color: ui.copy }]}>+91</Text>
                <TextInput
                  value={group(mobile)}
                  onChangeText={(t) => {
                    const d = t.replace(/\D/g, '');
                    // A pasted "+91 98765 43210" or "098765 43210" drops the prefix.
                    const clean = d.length > 10 && /^(91|0)/.test(d) ? d.slice(-10) : d.slice(0, 10);
                    setMobile(clean);
                    setError(null);
                    if (clean.length === 10) {
                      API.checkUser(clean).then((exists) => {
                        if (exists) {
                          setIsExisting(true);
                          setIsFirstTime(false);
                          setTermsAccepted(true);
                          markLoggedIn();
                        } else {
                          setIsExisting(false);
                          // checkUser also says "no" on a slow or failed call: a phone that has logged in before
                          // already accepted the terms, so only a first-ever login on it is asked again.
                          AsyncStorage.getItem(HAS_LOGGED_IN_KEY).then((val) => {
                            const seen = val === 'true';
                            setIsFirstTime(!seen);
                            setTermsAccepted(seen);
                          }).catch(() => {});
                        }
                      }).catch(() => {});
                    }
                  }}
                  onFocus={() => setFocus('phone')}
                  onBlur={() => setFocus(null)}
                  keyboardType="number-pad"
                  textContentType="telephoneNumber"
                  autoComplete="tel"
                  maxLength={11}
                  ref={phoneRef}
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={sendOtp}
                  style={[styles.input, { color: ui.title }]}
                  accessibilityLabel="Mobile number"
                />
              </View>
              {!!error && <Text style={[styles.error, { color: ui.error, textAlign: 'left' }]}>{error}</Text>}
              {/* Returning customers already agreed on their first login. */}
              {isFirstTime && flagKnown ? (
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
              ) : null}
            </>
          )}

          {step === 'otp' && (
            <>
              <View style={styles.otpHead}>
                <View style={styles.round} />
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
              {detectedClipOtp && otp !== detectedClipOtp && (
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync().catch(() => {});
                    setOtp(detectedClipOtp);
                    lastDetectedOtp.current = detectedClipOtp;
                    verify(detectedClipOtp);
                  }}
                  style={[styles.detectedOtpChip, { borderColor: ui.navy + '40', backgroundColor: ui.roundBtn }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Autofill code ${detectedClipOtp}`}
                >
                  <Feather name="clipboard" size={13} color={ui.navy} />
                  <Text style={[styles.detectedOtpText, { color: ui.navy }]}>
                    Paste detected OTP:{' '}
                    <Text style={{ fontFamily: 'PlusJakartaSans_700Bold' }}>{detectedClipOtp}</Text>
                  </Text>
                </Pressable>
              )}
              <OtpBoxes
                value={otp}
                onChange={(v) => { setOtp(v); if (error) setError(null); }}
                onComplete={(code) => { verify(code); }}
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
                <View style={{ gap: 4 }}>
                  <View style={field('ref')}>
                    <TextInput
                      value={referral}
                      // Codes are letters and digits only; a pasted space, dash or emoji would make signup fail.
                      onChangeText={(t) => {
                        const clean = t.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20);
                        setReferral(clean);
                      }}
                      onFocus={() => setFocus('ref')}
                      onBlur={() => setFocus(null)}
                      placeholder="Referral Code (Optional)"
                      placeholderTextColor={ui.copy}
                      autoCapitalize="characters"
                      autoCorrect={false}
                      style={[styles.input, { color: ui.title }]}
                    />
                    {referralValidating && (
                      <ActivityIndicator size="small" color={ui.navy} style={{ marginRight: 6 }} />
                    )}
                    {referralStatusMsg?.valid && !referralValidating && (
                      <Feather name="check-circle" size={18} color="#059669" style={{ marginRight: 6 }} />
                    )}
                    {referralStatusMsg && !referralStatusMsg.valid && !referralValidating && (
                      <Feather name="x-circle" size={18} color={ui.error} style={{ marginRight: 6 }} />
                    )}
                  </View>
                  {referralStatusMsg && (
                    <Text style={[styles.referredBy, { color: referralStatusMsg.valid ? '#059669' : ui.error }]}>
                      {referralStatusMsg.text}
                    </Text>
                  )}
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
          {step === 'done' && (
            <Pressable
              onPress={() => {
                onClose();
                if (onLoginSuccess) setTimeout(() => onLoginSuccess(), 100);
              }}
              style={styles.doneWrap}
              accessibilityRole="button"
              accessibilityLabel="Continue to app"
            >
              <Animated.View style={[styles.doneCircle, { backgroundColor: ui.navy, transform: [{ scale: doneScale }] }]}>
                <Feather name="check" size={34} color={ui.onNavy} />
              </Animated.View>
              <Text style={[styles.title, styles.center, { color: ui.title }]}>{welcomeName ? `Welcome, ${welcomeName}!` : "You're all set!"}</Text>
              <Text style={[styles.copy, styles.center, { color: ui.copy, marginTop: 0 }]}>You're signed in.</Text>
            </Pressable>
          )}
          </Animated.View>

          {step !== 'done' && (
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
              <Text style={[styles.ctaText, { color: cta.enabled ? ui.onNavy : ui.disabledText }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{cta.label}</Text>
            )}
          </Pressable>
          )}
        </Animated.View>
      </View>
      )}
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
  const { width: winW } = useWindowDimensions();
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
    let digits = text.replace(/\D/g, '');
    if (text.length > 1 && digits.length !== OTP_LENGTH) {
      const extracted = extractOtpCode(text);
      if (extracted) digits = extracted;
    }
    const next = [...slots];
    if (!digits) { next[i] = ''; commit(next); return; }
    if (digits.length >= OTP_LENGTH) {
      const full = digits.slice(0, OTP_LENGTH).split('');
      commit(full);
      inputs.current[OTP_LENGTH - 1]?.focus();
      return;
    }
    if (digits.length > 1) {
      if (digits.length === 2 && slots[i]) {
        const newChar = digits[1] || digits[0];
        next[i] = newChar;
        commit(next);
        if (i < OTP_LENGTH - 1) inputs.current[i + 1]?.focus();
        return;
      }
      for (let k = 0; k < digits.length && i + k < OTP_LENGTH; k++) next[i + k] = digits[k];
      commit(next);
      inputs.current[Math.min(i + digits.length, OTP_LENGTH - 1)]?.focus();
      return;
    }
    next[i] = digits;
    commit(next);
    if (i < OTP_LENGTH - 1) inputs.current[i + 1]?.focus();
  };

  // Six 46-wide boxes + gaps need 306 + the sheet's 32 padding: narrower phones (320 wide) pushed the last box
  // off the screen. Shrink the boxes to fit there instead.
  const boxW = Math.min(46, (winW - 32 - 5 * 6) / 6);
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
          maxLength={i === 0 ? 64 : OTP_LENGTH}
          editable={editable}
          autoFocus={i === 0}
          selectTextOnFocus
          accessibilityLabel={`Digit ${i + 1} of ${OTP_LENGTH}`}
          style={[
            styles.otpBox,
            {
              width: boxW,
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
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'transparent' },
  // Design: white sheet, 1px #E7EAF4 border (not on the bottom edge), 24 top corners, 16 side padding, 16 between blocks.
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: '#E7EAF4', paddingHorizontal: 16, paddingTop: 20, gap: 16 },
  // The one small line under the referral field: "Referred by <name>".
  referredBy: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 18, marginLeft: 4 },
  stepWrap: { gap: 16 },
  doneWrap: { alignItems: 'center', gap: 12, paddingVertical: 28 },
  doneCircle: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  headRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28 },
  center: { textAlign: 'center' },
  copy: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 22, marginTop: -8 },
  copyPlain: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 15, lineHeight: 22 },
  small: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20 },
  field: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 4 },
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
  cta: { minHeight: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28 },

  // Navi referral banner (Step 1)
  naviBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 10,
    marginTop: -4,
  },
  naviBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  naviIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  naviBannerTitle: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13,
    lineHeight: 18,
  },
  naviBannerSub: {
    fontFamily: 'PlusJakartaSans_500Medium',
    fontSize: 11.5,
    lineHeight: 16,
  },
  naviPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  naviPillText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
    color: '#059669',
  },
  detectedOtpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignSelf: 'center',
    borderWidth: 1,
    marginTop: -4,
  },
  detectedOtpText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 12,
  },

  // Navi referral card (Step 3)
});