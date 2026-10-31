import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Clipboard from 'expo-clipboard';
import { API } from '@/services/backend/api';

export const PENDING_REFERRAL_KEY = '@mysawari_pending_referral';
const LAST_CHECKED_CLIPBOARD_HASH_KEY = '@mysawari_last_checked_clipboard';

export interface PendingReferral {
  code: string;
  referrerName: string;
  rewardText: string;
  bonusSawariCash?: number;
  detectedAt: number;
}

/**
 * Extracts a referral code from a URL, message text, or raw code string.
 * Handles:
 * - URL params: ?code=XYZ, ?ref=XYZ, ?referralCode=XYZ
 * - Share messages: "Use my code *XYZ*", "invite code XYZ", "code: XYZ"
 * - Standalone codes: "XYZ123" (excluding pure numbers / phone numbers)
 */
export function extractReferralCode(text: string): string | null {
  if (!text || typeof text !== 'string') return null;
  const trimmed = text.trim();
  if (!trimmed || trimmed.length < 3) return null;

  // 1. URL parameter check (?code=... or &code=... or ?ref=...)
  const urlParamMatch = trimmed.match(/[?&](?:code|ref|referralCode)=([A-Za-z0-9_-]{4,20})/i);
  if (urlParamMatch && urlParamMatch[1]) {
    return urlParamMatch[1].toUpperCase();
  }

  // 2. Share message patterns (e.g. "code *XYZ*", "code: XYZ", "use my code XYZ")
  const messagePatterns = [
    /(?:use\s+my\s+code|invite\s+code|referral\s+code|my\s+code)\s*[:*]?\s*([A-Za-z0-9]{4,15})\b/i,
    /\*([A-Za-z0-9]{5,15})\*/, // text inside asterisks like *ANISUL99*
  ];

  for (const pattern of messagePatterns) {
    const match = trimmed.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].toUpperCase();
      if (!/^\d+$/.test(candidate)) { // not pure numbers (e.g. not a phone or OTP)
        return candidate;
      }
    }
  }

  // 3. Standalone code string check (e.g. copied code directly)
  // Must be 5-12 alphanumeric characters, not a pure number (phone number), and not an email
  if (/^[A-Za-z0-9]{5,12}$/.test(trimmed)) {
    const upper = trimmed.toUpperCase();
    const isPureDigits = /^\d+$/.test(upper);
    const isCommonWord = ['MYSAWARI', 'PAYMENT', 'BOOKING', 'RENTAL', 'SUPPORT', 'STATUS'].includes(upper);
    if (!isPureDigits && !isCommonWord) {
      return upper;
    }
  }

  return null;
}

/**
 * Saves a verified pending referral to persistent storage.
 */
export async function savePendingReferral(data: {
  code: string;
  referrerName: string;
  rewardText?: string;
  bonusSawariCash?: number;
}): Promise<PendingReferral> {
  const item: PendingReferral = {
    code: data.code.trim().toUpperCase(),
    referrerName: data.referrerName || 'MySawari Member',
    rewardText: data.rewardText || '100 SawariCash on signup',
    bonusSawariCash: data.bonusSawariCash || 100,
    detectedAt: Date.now(),
  };
  try {
    await AsyncStorage.setItem(PENDING_REFERRAL_KEY, JSON.stringify(item));
  } catch (err) {
    if (__DEV__) console.warn('Failed to save pending referral:', err);
  }
  return item;
}

/**
 * Retrieves the pending referral if it exists and hasn't expired (expires in 14 days).
 */
export async function getPendingReferral(): Promise<PendingReferral | null> {
  try {
    const raw = await AsyncStorage.getItem(PENDING_REFERRAL_KEY);
    if (!raw) return null;
    const parsed: PendingReferral = JSON.parse(raw);
    if (!parsed || !parsed.code) return null;

    // Check expiry (14 days)
    const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;
    if (Date.now() - (parsed.detectedAt || 0) > FOURTEEN_DAYS_MS) {
      await clearPendingReferral();
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clears the pending referral after sign up or when dismissed.
 */
export async function clearPendingReferral(): Promise<void> {
  try {
    await AsyncStorage.removeItem(PENDING_REFERRAL_KEY);
  } catch {}
}

/**
 * Deep-link handler: extracts referral code from incoming URL and validates it with backend.
 */
export async function handleDeepLinkReferralUrl(url: string): Promise<PendingReferral | null> {
  try {
    if (!url || typeof url !== 'string') return null;
    const code = extractReferralCode(url);
    if (!code) return null;

    // Validate with backend
    const validated = await API.validateReferralCode(code);
    if (validated && validated.valid) {
      return await savePendingReferral({
        code: validated.referralCode || code,
        referrerName: validated.referrerName,
        rewardText: validated.rewardText,
        bonusSawariCash: validated.bonusSawariCash,
      });
    }
  } catch (err) {
    if (__DEV__) console.warn('handleDeepLinkReferralUrl error:', err);
  }
  return null;
}

/**
 * Clipboard auto-detector (Navi style):
 * When an invited user opens the app or sheet without a pending referral, checks the clipboard.
 * Avoids repeated checks by caching a hash of the last checked clipboard text.
 */
export async function detectReferralFromClipboard(): Promise<PendingReferral | null> {
  try {
    const existing = await getPendingReferral();
    if (existing) return existing;

    const hasClipboard = await Clipboard.hasStringAsync();
    if (!hasClipboard) return null;

    const clipboardText = await Clipboard.getStringAsync();
    if (!clipboardText || clipboardText.trim().length < 3) return null;

    const clean = clipboardText.trim();
    // Quick cache check to avoid hammering the backend on every open
    const lastChecked = await AsyncStorage.getItem(LAST_CHECKED_CLIPBOARD_HASH_KEY);
    if (lastChecked === clean) {
      return null;
    }

    // Save that we checked this text
    await AsyncStorage.setItem(LAST_CHECKED_CLIPBOARD_HASH_KEY, clean).catch(() => {});

    const code = extractReferralCode(clean);
    if (!code) return null;

    // Validate with backend
    const validated = await API.validateReferralCode(code);
    if (validated && validated.valid) {
      return await savePendingReferral({
        code: validated.referralCode || code,
        referrerName: validated.referrerName,
        rewardText: validated.rewardText,
        bonusSawariCash: validated.bonusSawariCash,
      });
    }
  } catch (err) {
    // Non-blocking: silently ignore errors so app launch is never disrupted
  }
  return null;
}
