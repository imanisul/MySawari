import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Height of the floating bottom tab pill (and the round Help button), without the space beneath it. */
export const BOTTOM_NAV_CONTENT_HEIGHT = 64;

/** Corner radius shared by the tab pill and the round Help button beside it. */
export const BOTTOM_NAV_RADIUS = 50;

/** Height of the white fade the bar sits on (Figma: 100px, transparent → white). */
export const BOTTOM_NAV_FADE_HEIGHT = 100;

/** Space between the tab pill and the Help button. */
export const BOTTOM_NAV_GAP = 12;

/**
 * Distance from the screen's bottom edge to the bar: the device's own bottom inset (34 on Face ID iPhones,
 * the gesture or 3-button bar on Android) plus 4, as in the design (34 + 4 = 38 on an iPhone). Phones that
 * report no inset still get a small margin so the bar never touches the edge.
 *
 * This is the ONLY place the bar's position is decided: the bar itself and every screen that leaves room
 * for it (useBottomNavHeight) read it, so the two can't disagree.
 */
export function bottomNavOffset(insetBottom: number) {
  return Math.max(insetBottom, 8) + 4;
}

/** Total space the floating bottom tab bar occupies on this device: the pill plus the space beneath it. */
export function useBottomNavHeight() {
  const insets = useSafeAreaInsets();
  return BOTTOM_NAV_CONTENT_HEIGHT + bottomNavOffset(insets.bottom);
}