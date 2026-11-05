import AsyncStorage from '@react-native-async-storage/async-storage';
import { BACKEND_URL, timedFetch } from '../backend/api';

export interface FlashScreenConfig {
  isEnabled: boolean;
  durationSeconds: number; // default: 4 seconds
  brandTitle: string;
  brandTagline: string;
  isOccasionActive: boolean;
  occasionName?: string;
  occasionGreeting?: string;
  occasionSubtext?: string;
  occasionBadge?: string;
  occasionTheme?: string;
  primaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  gradientColors?: string[];
  bgImageUrl?: string;
  bgImageOpacity?: number;
  showLogo?: boolean;
  showTagline?: boolean;
  showProgressBar?: boolean;
  showSkipButton?: boolean;
  animationStyle?: string;
  startDate?: string | null;
  endDate?: string | null;
}

export const DEFAULT_FLASH_SCREEN_CONFIG: FlashScreenConfig = {
  isEnabled: true,
  durationSeconds: 4,
  brandTitle: 'MySawari',
  brandTagline: 'Your ride, your way.',
  isOccasionActive: false,
  occasionName: '',
  occasionGreeting: '',
  occasionSubtext: '',
  occasionBadge: '',
  occasionTheme: 'classic',
  primaryColor: '#1C2A53',
  accentColor: '#E0A126',
  backgroundColor: '#FFFFFF',
  gradientColors: ['#FFFFFF', '#FFFFFF'],
  bgImageUrl: '',
  bgImageOpacity: 1,
  showLogo: true,
  showTagline: true,
  showProgressBar: false,
  showSkipButton: false,
  animationStyle: 'smooth_fade',
};

const FLASH_STORAGE_KEY = '@mysawari_flash_screen_config';
const OPERATION_BACKEND_URL = 'https://mysawari-operation-backend.onrender.com/api/v1/flash-screen';

// In-memory module cache to ensure synchronous access without mode-switch flickers
let memoryFlashConfig: FlashScreenConfig | null = null;
let preloadPromise: Promise<FlashScreenConfig> | null = null;

export function getSynchronousFlashScreenConfig(): FlashScreenConfig {
  return memoryFlashConfig || DEFAULT_FLASH_SCREEN_CONFIG;
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

    // 2. Fetch fresh remote configuration in parallel (timeout 1800ms to avoid blocking boot)
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
      if (typeof parsed === 'object' && parsed !== null) {
        const merged: FlashScreenConfig = {
          ...DEFAULT_FLASH_SCREEN_CONFIG,
          ...parsed,
          durationSeconds: Number(parsed.durationSeconds) > 0 ? Number(parsed.durationSeconds) : 4,
          showProgressBar: false,
          showSkipButton: false,
        };

        if (merged.backgroundColor === '#08142E') {
          merged.backgroundColor = merged.isOccasionActive ? '#F8F8F5' : '#FFFFFF';
          merged.gradientColors = merged.isOccasionActive ? ['#F8F8F5', '#F8F8F5'] : ['#FFFFFF', '#FFFFFF'];
        }

        memoryFlashConfig = merged;
        return merged;
      }
    }
  } catch (err) {
    // Graceful fallback to default
  }
  memoryFlashConfig = DEFAULT_FLASH_SCREEN_CONFIG;
  return DEFAULT_FLASH_SCREEN_CONFIG;
}

/**
 * Fetches the latest flash screen config from the backend.
 * Checks customer backend first, then falls back to operation backend.
 * Caches any received config into AsyncStorage.
 */
export async function fetchRemoteFlashScreenConfig(): Promise<FlashScreenConfig | null> {
  // Strategy 1: Customer Backend
  try {
    const res = await timedFetch(`${BACKEND_URL}/flash-screen`, { method: 'GET' }, 3500);
    if (res.ok) {
      const json = await res.json();
      if (json?.success && json?.data) {
        const merged: FlashScreenConfig = {
          ...DEFAULT_FLASH_SCREEN_CONFIG,
          ...json.data,
          durationSeconds: Number(json.data.durationSeconds) > 0 ? Number(json.data.durationSeconds) : 4,
        };
        memoryFlashConfig = merged;
        await AsyncStorage.setItem(FLASH_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch {
    // Attempt fallback to operation backend
  }

  // Strategy 2: Operation Backend direct fallback
  try {
    const res = await timedFetch(OPERATION_BACKEND_URL, { method: 'GET' }, 3500);
    if (res.ok) {
      const json = await res.json();
      if (json?.success && json?.data) {
        const merged: FlashScreenConfig = {
          ...DEFAULT_FLASH_SCREEN_CONFIG,
          ...json.data,
          durationSeconds: Number(json.data.durationSeconds) > 0 ? Number(json.data.durationSeconds) : 4,
        };
        memoryFlashConfig = merged;
        await AsyncStorage.setItem(FLASH_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch {
    // Both failed (offline), stay with cache
  }

  return null;
}
