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
  durationSeconds: 4, // Exactly 4 seconds default
  brandTitle: 'MySawari',
  brandTagline: 'Your ride, your way.',
  isOccasionActive: true,
  occasionName: 'MySawari',
  occasionGreeting: 'Your ride, your way.',
  occasionSubtext: '',
  occasionBadge: '',
  occasionTheme: 'diwali_animated',
  primaryColor: '#323E71',
  accentColor: '#E0A126',
  backgroundColor: '#F8F8F5',
  gradientColors: ['#F8F8F5', '#F8F8F5'],
  bgImageUrl: '',
  bgImageOpacity: 0.35,
  showLogo: true,
  showTagline: true,
  showProgressBar: false,
  showSkipButton: false,
  animationStyle: 'diwali_animated',
};

const FLASH_STORAGE_KEY = '@mysawari_flash_screen_config';
const OPERATION_BACKEND_URL = 'https://mysawari-operation-backend.onrender.com/api/v1/flash-screen';

/**
 * Returns locally cached flash config synchronously or near-instantaneously from AsyncStorage.
 * Guarantees zero blank screen or network delay on cold start.
 */
export async function getCachedFlashScreenConfig(): Promise<FlashScreenConfig> {
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

        return merged;
      }
    }
  } catch (err) {
    // Graceful fallback to default
  }
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
        await AsyncStorage.setItem(FLASH_STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch {
    // Both failed (offline), stay with cache
  }

  return null;
}
