import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Content height of the bottom tab bar (icon + label + its padding), without the safe-area inset. */
export const BOTTOM_NAV_CONTENT_HEIGHT = 56;

/**
 * Total space the fixed bottom tab bar occupies on this device: its content
 * plus the safe-area inset (home indicator on iPhone, gesture bar on Android).
 */
export function useBottomNavHeight() {
  const insets = useSafeAreaInsets();
  return BOTTOM_NAV_CONTENT_HEIGHT + Math.max(insets.bottom, 7);
}
