import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the floating bottom tab pill, without the space beneath it. */
export const BOTTOM_NAV_CONTENT_HEIGHT = 64;

/** Corner radius shared by the tab pill and the round Help button beside it. */
export const BOTTOM_NAV_RADIUS = 50;

/** Height of the white fade the bar sits on (Figma: 100px, transparent → white). */
export const BOTTOM_NAV_FADE_HEIGHT = 100;

/**
 * Distance from the screen's bottom edge to the bar. Figma stacks the bar above a 34px home-indicator
 * strip, so it clears that strip and then sits the design's 4px above it. `insetBottom` is the device's
 * own indicator inset: 0 on older iPhones, 34 on Face ID ones, and the 3-button bar's height on Android.
 */
export function bottomNavOffset(insetBottom: number) {
  return insetBottom + 4;
}

/** Total space the floating bottom tab bar occupies on this device: the pill plus the space beneath it. */
export function useBottomNavHeight() {
  const insets = useSafeAreaInsets();
  return BOTTOM_NAV_CONTENT_HEIGHT + bottomNavOffset(insets.bottom);
}
