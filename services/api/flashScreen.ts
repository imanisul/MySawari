import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image as ExpoImage } from 'expo-image';
import { BACKEND_URL, timedFetch } from '../backend/api';

export interface FlashScreenConfig {
  imageUrl: string;
  publicId?: string;
  isActive: boolean;
  version: number;
  durationSeconds: number; // default: 2.5 - 3 seconds
  updatedAt?: string;
  updatedByName?: string;
  // Legacy compatibility fields
  isEnabled?: boolean;
  bgImageUrl?: string;
  brandTitle?: string;
  brandTagline?: string;
  isOccasionActive?: boolean;
  backgroundColor?: string;
  gradientColors?: string[];
}

export const DEFAULT_FLASH_SCREEN_CONFIG: FlashScreenConfig = {
  imageUrl: '',
  isActive: false,
  version: 0,
  durationSeconds: 2.5,
  isEnabled: true,
  bgImageUrl: '',
  brandTitle: 'MySawari',
  brandTagline: 'Your ride, your way.',
  isOccasionActive: false,
  backgroundColor: '#FFFFFF',
  gradientColors: ['#FFFFFF', '#FFFFFF'],
};

const FLASH_STORAGE_KEY = '@mysawari_single_splash_config_v2';
const OPERATION_BACKEND_URL = 'https://mysawari-operation-backend.onrender.com/api/v1/flash-screen';

// In-memory module cache to guarantee synchronous, instant access on cold start
let memoryFlashConfig: FlashScreenConfig | null = null;
let preloadPromise: Promise<FlashScreenConfig> | null = null;
const listeners = new Set<(cfg: FlashScreenConfig) => void>();

export function subscribeToFlashScreenUpdates(cb: (cfg: FlashScreenConfig) => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

function notifyListeners(cfg: FlashScreenConfig) {
  listeners.forEach((cb) => {
    try {
      cb(cfg);
    } catch {
      // ignore
    }
  });
}

/**
 * Returns current flash screen configuration synchronously from memory.
 * Zero layout shift, zero blank frame on launch.
 */
export function getSynchronousFlashScreenConfig(): FlashScreenConfig {
  return memoryFlashConfig || DEFAULT_FLASH_SCREEN_CONFIG;
}

/**
 * Normalizes raw API or stored config into our clean FlashScreenConfig contract.
 */
function normalizeConfig(raw: any): FlashScreenConfig {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_FLASH_SCREEN_CONFIG;
  }

  const rawUrl = String(raw.imageUrl || raw.bgImageUrl || '').trim();
  const secureUrl = rawUrl ? rawUrl.replace(/^http:\/\//i, 'https://') : '';
  const isActive = raw.isActive !== undefined ? Boolean(raw.isActive) : (raw.isEnabled !== false);
  const version = Number(raw.version) || (raw.updatedAt ? new Date(raw.updatedAt).getTime() : 0);
  const duration = Number(raw.durationSeconds);
  const durationSeconds = !isNaN(duration) && duration >= 1 && duration <= 10 ? duration : 2.5;

  return {
    ...DEFAULT_FLASH_SCREEN_CONFIG,
    ...raw,
    imageUrl: secureUrl,
    bgImageUrl: secureUrl,
    publicId: raw.publicId || '',
    isActive,
    isEnabled: isActive,
    version,
    durationSeconds,
    brandTitle: raw.brandTitle || 'MySawari',
    brandTagline: raw.brandTagline || 'Your ride, your way.',
  };
}

/**
 * Pre-hydrates the flash screen configuration into memory immediately.
 * Called early in app bootstrap so AnimatedSplash always renders the PROPER ONE directly,
 * preventing any flash or double-screen switch.
 */
export function preloadFlashScreenConfig(): Promise<FlashScreenConfig> {
  if (preloadPromise) return preloadPromise;

  preloadPromise = (async () => {
    // 1. Instantly load locally cached configuration
    const cached = await getCachedFlashScreenConfig();

    // 2. If cached has an active image, prefetch it into disk cache immediately
    if (cached.isActive && cached.imageUrl) {
      ExpoImage.prefetch(cached.imageUrl, 'memory-disk').catch(() => {});
    }

    // 3. Fetch fresh remote configuration in background (timeout 2500ms to avoid blocking boot)
    fetchRemoteFlashScreenConfig().catch(() => {});

    return cached;
  })();

  return preloadPromise;
}

// Auto-trigger early pre-hydration as soon as the module is evaluated
preloadFlashScreenConfig().catch(() => {});

/**
 * Returns locally cached flash config from AsyncStorage and populates memory cache.
 * Guarantees zero blank screen or network delay on cold start.
 */
export async function getCachedFlashScreenConfig(): Promise<FlashScreenConfig> {
  if (memoryFlashConfig) {
    return memoryFlashConfig;
  }
  try {
    const raw = await AsyncStorage.getItem(FLASH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const normalized = normalizeConfig(parsed);
      memoryFlashConfig = normalized;
      return normalized;
    }
  } catch {
    // Graceful fallback to default
  }
  memoryFlashConfig = DEFAULT_FLASH_SCREEN_CONFIG;
  return DEFAULT_FLASH_SCREEN_CONFIG;
}

/**
 * Fetches the latest flash screen config from the backend.
 * Checks customer backend first, then falls back to operation backend.
 * Caches any received config into AsyncStorage and prefetches new image.
 */
export async function fetchRemoteFlashScreenConfig(): Promise<FlashScreenConfig | null> {
  // Strategy 1: Customer Backend
  try {
    const res = await timedFetch(`${BACKEND_URL}/flash-screen`, { method: 'GET' }, 3000);
    if (res.ok) {
      const json = await res.json();
      if (json?.success && json?.data) {
        return handleFreshRemoteConfig(json.data);
      }
    }
  } catch {
    // Attempt fallback to operation backend
  }

  // Strategy 2: Operation Backend direct fallback
  try {
    const res = await timedFetch(OPERATION_BACKEND_URL, { method: 'GET' }, 3000);
    if (res.ok) {
      const json = await res.json();
      if (json?.success && json?.data) {
        return handleFreshRemoteConfig(json.data);
      }
    }
  } catch {
    // Both failed (offline), stay with cache
  }

  return null;
}

async function handleFreshRemoteConfig(data: any): Promise<FlashScreenConfig> {
  const fresh = normalizeConfig(data);
  const previous = memoryFlashConfig;

  // Invalidate old cache or prefetch newly uploaded image if version or URL changed
  const hasChanged = !previous || previous.version !== fresh.version || previous.imageUrl !== fresh.imageUrl || previous.isActive !== fresh.isActive;

  if (hasChanged && fresh.isActive && fresh.imageUrl) {
    // Prefetch into disk cache for subsequent instant launches
    ExpoImage.prefetch(fresh.imageUrl, 'memory-disk').catch(() => {});
  }

  memoryFlashConfig = fresh;
  await AsyncStorage.setItem(FLASH_STORAGE_KEY, JSON.stringify(fresh)).catch(() => {});
  notifyListeners(fresh);
  return fresh;
}
