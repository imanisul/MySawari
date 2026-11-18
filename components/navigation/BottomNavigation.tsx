import React, { useEffect, useRef, useState } from 'react';
import { Animated, BackHandler, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { BottomBlur } from '@/components/common/BottomBlur';
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from '@/utils/haptics';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { BOTTOM_NAV_CONTENT_HEIGHT, BOTTOM_NAV_FADE_HEIGHT, BOTTOM_NAV_GAP, BOTTOM_NAV_RADIUS, bottomNavOffset } from '@/hooks/useBottomNavHeight';
import { useSawari } from '@/context/SawariContext';
import { useRegisterNavHelp } from '@/hooks/useSupportFab';
import { shadows } from '@/constants/shadows';
import { SUPPORT_PHONE, SUPPORT_WHATSAPP_URL } from '@/constants/support';

type IconProps = { color: string; fill: string; active: boolean };
type Route = '/' | '/explore' | '/flash-sale' | '/bookings' | '/profile';

/*
 * Tab icons, exactly as in the Figma bar (exports 1730:26940 active / 1730:26976 inactive). Each tab icon is a
 * 20 × 20 frame with a 1px line; the selected one is filled. The paths are Figma's own, in the bar's coordinates,
 * so each icon's viewBox is its 20 × 20 frame in that space (top at y 95).
 */
// 1.2× Figma's 20 so the icons fill the taller 64 bar (they looked too small at 20). The SVGs keep their viewBox.
const ICON = 24;
const LINE = 1;

const HOME_PATH = 'M61.3984 112.502V105.835C61.3984 105.614 61.3106 105.402 61.1544 105.246C60.9981 105.089 60.7861 105.002 60.5651 105.002H57.2318C57.0108 105.002 56.7988 105.089 56.6425 105.246C56.4862 105.402 56.3984 105.614 56.3984 105.835V112.502H53.0651C52.6231 112.502 52.1992 112.326 51.8866 112.014C51.574 111.701 51.3984 111.277 51.3984 110.835V103.335C51.3984 103.093 51.4512 102.853 51.5533 102.633C51.6553 102.413 51.8041 102.218 51.9893 102.062L57.8226 97.0617C58.1234 96.8075 58.5046 96.668 58.8984 96.668C59.2923 96.668 59.6734 96.8075 59.9743 97.0617L65.8076 102.062C65.9928 102.218 66.1416 102.413 66.2436 102.633C66.3457 102.853 66.3985 103.093 66.3984 103.335V110.835C66.3984 111.277 66.2228 111.701 65.9103 112.014C65.5977 112.326 65.1738 112.502 64.7318 112.502H61.3984Z';
function HomeIcon({ color, active }: IconProps) {
  return (
    <Svg width={ICON} height={ICON} viewBox="48.898 95 20 20" fill="none">
      <Path d={HOME_PATH} fill={active ? color : 'none'} stroke={color} strokeWidth={LINE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const BOLT_PATH = 'M117.959 98.334C118.054 98.0668 118.054 97.7755 117.961 97.5078C117.868 97.2401 117.687 97.012 117.448 96.8608C117.208 96.7096 116.924 96.6443 116.642 96.6756C116.361 96.7069 116.098 96.833 115.898 97.0331L108.398 104.533C108.223 104.708 108.104 104.931 108.055 105.173C108.007 105.416 108.032 105.667 108.126 105.895C108.221 106.124 108.381 106.319 108.587 106.456C108.792 106.594 109.034 106.667 109.281 106.667H112.616C112.683 106.667 112.748 106.683 112.807 106.714C112.866 106.745 112.917 106.789 112.956 106.843C112.994 106.898 113.019 106.96 113.028 107.026C113.037 107.092 113.031 107.159 113.008 107.222L111.436 111.667C111.342 111.935 111.341 112.226 111.434 112.494C111.527 112.761 111.708 112.99 111.948 113.141C112.188 113.292 112.472 113.357 112.754 113.326C113.035 113.294 113.298 113.168 113.498 112.967L120.998 105.467C121.173 105.292 121.292 105.07 121.34 104.827C121.388 104.585 121.363 104.334 121.269 104.105C121.174 103.877 121.014 103.682 120.809 103.545C120.603 103.407 120.361 103.334 120.114 103.334H116.783C116.717 103.334 116.651 103.318 116.592 103.287C116.532 103.257 116.481 103.212 116.443 103.158C116.404 103.103 116.379 103.041 116.37 102.974C116.361 102.908 116.368 102.841 116.39 102.778L117.959 98.334Z';
function SaleIcon({ color, active }: IconProps) {
  return (
    <Svg width={ICON} height={ICON} viewBox="104.695 95 20 20" fill="none">
      <Path d={BOLT_PATH} fill={active ? color : 'none'} stroke={color} strokeWidth={0.833} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// "Search": the lens fills when selected; the handle stays 1px in both states (Figma).
const SEARCH_LENS = 'M176.333 104.167C176.333 107.849 173.349 110.833 169.667 110.833C165.985 110.833 163 107.849 163 104.167C163 100.485 165.985 97.5 169.667 97.5C173.349 97.5 176.333 100.485 176.333 104.167Z';
const SEARCH_HANDLE = 'M177.999 112.499L174.383 108.883';
function SearchIcon({ color, active }: IconProps) {
  return (
    <Svg width={ICON} height={ICON} viewBox="160.5 95 20 20" fill="none">
      <Path d={SEARCH_LENS} fill={active ? color : 'none'} stroke={color} strokeWidth={LINE} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={SEARCH_HANDLE} stroke={color} strokeWidth={LINE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// "My Trips": the road; when selected it fills and its centre dashes turn the bar's colour.
const ROAD_PATH = 'M218.029 110.374C217.958 110.622 217.946 110.884 217.993 111.137C218.04 111.391 218.145 111.63 218.301 111.837C218.456 112.043 218.657 112.21 218.888 112.325C219.119 112.44 219.374 112.5 219.632 112.5H232.965C233.223 112.5 233.478 112.44 233.709 112.325C233.94 112.21 234.141 112.043 234.297 111.837C234.452 111.631 234.557 111.392 234.605 111.138C234.652 110.884 234.639 110.623 234.569 110.375L231.235 98.7083C231.136 98.36 230.925 98.0537 230.636 97.8357C230.347 97.6176 229.994 97.4998 229.632 97.5H222.965C222.603 97.4998 222.25 97.6176 221.961 97.8357C221.672 98.0537 221.461 98.36 221.362 98.7083L218.029 110.374Z';
const ROAD_DASHES = 'M226.297 109.168V112.501 M226.297 99.1667V97.5 M226.297 102.5V105';
function TripsIcon({ color, fill, active }: IconProps) {
  return (
    <Svg width={ICON} height={ICON} viewBox="216.297 95 20 20" fill="none">
      <Path d={ROAD_PATH} fill={active ? color : 'none'} stroke={color} strokeWidth={LINE} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={ROAD_DASHES} stroke={active ? fill : color} strokeWidth={LINE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

const PROFILE_PATHS = ['M286.263 101.667C286.263 103.968 284.398 105.833 282.096 105.833C279.795 105.833 277.93 103.968 277.93 101.667C277.93 99.3655 279.795 97.5 282.096 97.5C284.398 97.5 286.263 99.3655 286.263 101.667Z', 'M288.766 112.499C289.46 111.11 288.063 109.035 286.813 107.785C285.563 106.534 283.867 105.832 282.099 105.832C280.331 105.832 278.635 106.534 277.385 107.785C276.135 109.035 275.016 111.11 275.433 112.499C275.849 113.888 288.071 113.888 288.766 112.499Z'];
function ProfileIcon({ color, active }: IconProps) {
  return (
    <Svg width={ICON} height={ICON} viewBox="272.096 95 20 20" fill="none">
      {PROFILE_PATHS.map((p) => (
        <Path key={p} d={p} fill={active ? color : 'none'} stroke={color} strokeWidth={LINE} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}

// "Flash" tag under the bolt: 17 × 8, radius 4, Figma's own lettering; pink when Sale is selected, purple otherwise.
const FLASH_TEXT = 'M108.623 116V112.275H111.048V112.8H109.213V113.92H110.848V114.445H109.213V116H108.623ZM111.488 116V112.215H112.053V116H111.488ZM113.523 116.06C113.34 116.06 113.178 116.028 113.038 115.965C112.902 115.898 112.795 115.808 112.718 115.695C112.642 115.578 112.603 115.442 112.603 115.285C112.603 115.138 112.635 115.007 112.698 114.89C112.765 114.773 112.867 114.675 113.003 114.595C113.14 114.515 113.312 114.458 113.518 114.425L114.458 114.27V114.715L113.628 114.86C113.478 114.887 113.368 114.935 113.298 115.005C113.228 115.072 113.193 115.158 113.193 115.265C113.193 115.368 113.232 115.453 113.308 115.52C113.388 115.583 113.49 115.615 113.613 115.615C113.767 115.615 113.9 115.582 114.013 115.515C114.13 115.448 114.22 115.36 114.283 115.25C114.347 115.137 114.378 115.012 114.378 114.875V114.18C114.378 114.047 114.328 113.938 114.228 113.855C114.132 113.768 114.002 113.725 113.838 113.725C113.688 113.725 113.557 113.765 113.443 113.845C113.333 113.922 113.252 114.022 113.198 114.145L112.728 113.91C112.778 113.777 112.86 113.66 112.973 113.56C113.087 113.457 113.218 113.377 113.368 113.32C113.522 113.263 113.683 113.235 113.853 113.235C114.067 113.235 114.255 113.275 114.418 113.355C114.585 113.435 114.713 113.547 114.803 113.69C114.897 113.83 114.943 113.993 114.943 114.18V116H114.403V115.51L114.518 115.525C114.455 115.635 114.373 115.73 114.273 115.81C114.177 115.89 114.065 115.952 113.938 115.995C113.815 116.038 113.677 116.06 113.523 116.06ZM116.604 116.06C116.327 116.06 116.084 115.992 115.874 115.855C115.667 115.718 115.522 115.535 115.439 115.305L115.874 115.1C115.947 115.253 116.047 115.375 116.174 115.465C116.304 115.555 116.447 115.6 116.604 115.6C116.737 115.6 116.846 115.57 116.929 115.51C117.012 115.45 117.054 115.368 117.054 115.265C117.054 115.198 117.036 115.145 116.999 115.105C116.962 115.062 116.916 115.027 116.859 115C116.806 114.973 116.751 114.953 116.694 114.94L116.269 114.82C116.036 114.753 115.861 114.653 115.744 114.52C115.631 114.383 115.574 114.225 115.574 114.045C115.574 113.882 115.616 113.74 115.699 113.62C115.782 113.497 115.897 113.402 116.044 113.335C116.191 113.268 116.356 113.235 116.539 113.235C116.786 113.235 117.006 113.297 117.199 113.42C117.392 113.54 117.529 113.708 117.609 113.925L117.174 114.13C117.121 114 117.036 113.897 116.919 113.82C116.806 113.743 116.677 113.705 116.534 113.705C116.411 113.705 116.312 113.735 116.239 113.795C116.166 113.852 116.129 113.927 116.129 114.02C116.129 114.083 116.146 114.137 116.179 114.18C116.212 114.22 116.256 114.253 116.309 114.28C116.362 114.303 116.417 114.323 116.474 114.34L116.914 114.47C117.137 114.533 117.309 114.633 117.429 114.77C117.549 114.903 117.609 115.063 117.609 115.25C117.609 115.41 117.566 115.552 117.479 115.675C117.396 115.795 117.279 115.89 117.129 115.96C116.979 116.027 116.804 116.06 116.604 116.06ZM118.163 116V112.215H118.728V113.825L118.638 113.755C118.704 113.585 118.811 113.457 118.958 113.37C119.104 113.28 119.274 113.235 119.468 113.235C119.668 113.235 119.844 113.278 119.998 113.365C120.151 113.452 120.271 113.572 120.358 113.725C120.444 113.878 120.488 114.053 120.488 114.25V116H119.928V114.405C119.928 114.268 119.901 114.153 119.848 114.06C119.798 113.963 119.728 113.89 119.638 113.84C119.548 113.787 119.444 113.76 119.328 113.76C119.214 113.76 119.111 113.787 119.018 113.84C118.928 113.89 118.856 113.963 118.803 114.06C118.753 114.157 118.728 114.272 118.728 114.405V116H118.163Z';
function FlashBadge({ active }: { active: boolean }) {
  return (
    <Svg width={20.4} height={9.6} viewBox="106 110 17 8" style={styles.badge} pointerEvents="none">
      <Rect x={106} y={110} width={17} height={8} rx={4} fill={active ? '#FF008B' : '#6B5AED'} />
      <Path d={FLASH_TEXT} fill="#FFFFFF" />
    </Svg>
  );
}

// Help headset: a 24 × 24 frame (the only icon at 24), cups solid, band and mic as 1px lines.
const HEADSET_PATH = 'M348 105H351C351.53 105 352.039 105.211 352.414 105.586C352.789 105.961 353 106.47 353 107V110C353 110.53 352.789 111.039 352.414 111.414C352.039 111.789 351.53 112 351 112H350C349.47 112 348.961 111.789 348.586 111.414C348.211 111.039 348 110.53 348 110V105C348 103.818 348.233 102.648 348.685 101.556C349.137 100.464 349.8 99.4718 350.636 98.636C351.472 97.8003 352.464 97.1374 353.556 96.6851C354.648 96.2328 355.818 96 357 96C358.182 96 359.352 96.2328 360.444 96.6851C361.536 97.1374 362.528 97.8003 363.364 98.636C364.2 99.4718 364.863 100.464 365.315 101.556C365.767 102.648 366 103.818 366 105V110C366 110.53 365.789 111.039 365.414 111.414C365.039 111.789 364.53 112 364 112H363C362.47 112 361.961 111.789 361.586 111.414C361.211 111.039 361 110.53 361 110V107C361 106.47 361.211 105.961 361.586 105.586C361.961 105.211 362.47 105 363 105H366C366 103.818 365.767 102.648 365.315 101.556C364.863 100.464 364.2 99.4718 363.364 98.636C362.528 97.8003 361.536 97.1374 360.444 96.6851C359.352 96.2328 358.182 96 357 96C355.818 96 354.648 96.2328 353.556 96.6851C352.464 97.1374 351.472 97.8003 350.636 98.636C349.8 99.4718 349.137 100.464 348.685 101.556C348.233 102.648 348 103.818 348 105Z';
const HEADSET_MIC = 'M366 110V112C366 113.061 365.579 114.078 364.828 114.828C364.078 115.579 363.061 116 362 116H357';
function HeadsetIcon({ color }: { color: string }) {
  return (
    <Svg width={28} height={28} viewBox="345 94 24 24" fill="none">
      <Path d={HEADSET_PATH} fill={color} stroke={color} strokeWidth={LINE} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={HEADSET_MIC} stroke={color} strokeWidth={LINE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Round Help button beside the tab pill; opens WhatsApp / Call options above it. */
function HelpButton() {
  useRegisterNavHelp();
  const colors = useColors();
  const { isDarkMode } = useSawari();
  const helpColor = isDarkMode ? colors.foreground : HELP_INK;
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  // Intercept Android hardware back when Help menu is open to dismiss it
  useEffect(() => {
    if (!open) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      toggle(false);
      return true;
    });
    return () => sub.remove();
  }, [open]);

  // The menu sits in layout (not absolutely) so the bar grows upward to hold it:
  // Android drops taps that land outside a parent's bounds.
  const toggle = (next = !open) => {
    Haptics.selectionAsync();
    if (next) {
      setOpen(true);
      Animated.spring(anim, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(anim, {
        toValue: 0,
        duration: 140,
        useNativeDriver: true,
      }).start(() => setOpen(false));
    }
  };

  const optionStyle = {
    opacity: anim,
    transform: [
      { scale: anim },
      {
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [16, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.helpCol}>
      {open && (
        <Animated.View style={[styles.helpMenu, optionStyle]}>
          <Pressable
            accessibilityLabel="Call support"
            testID="help-call"
            onPress={() => {
              toggle(false);
              Linking.openURL(`tel:${SUPPORT_PHONE}`).catch(() => {});
            }}
            style={[styles.helpOption, shadows.level2, { backgroundColor: '#3F58C4' }]}
          >
            <Feather name="phone" size={20} color="#FFFFFF" />
          </Pressable>
          <Pressable
            accessibilityLabel="WhatsApp support"
            testID="help-whatsapp"
            onPress={() => {
              toggle(false);
              Linking.openURL(`${SUPPORT_WHATSAPP_URL}?text=${encodeURIComponent('Hello MySawari')}`).catch(() => {});
            }}
            style={[styles.helpOption, shadows.level2, { backgroundColor: '#25D366' }]}
          >
            <FontAwesome name="whatsapp" size={22} color="#FFFFFF" />
          </Pressable>
        </Animated.View>
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Help"
        accessibilityState={{ expanded: open }}
        testID="tab-help"
        onPress={() => toggle()}
        style={({ pressed }) => [styles.help, isDarkMode && { backgroundColor: colors.card, borderColor: colors.border }, pressed && { opacity: 0.85 }]}
      >
        <HeadsetIcon color={helpColor} />
        <Text style={[styles.navLabel, styles.helpLabel, { color: helpColor }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} allowFontScaling={false}>Help</Text>
      </Pressable>
    </View>
  );
}

const ALL_ITEMS: {
  id: string;
  label: string;
  route: Route;
  Icon: (p: IconProps) => React.ReactElement;
  /** Small pink tag over the icon (the Sale tab's "Flash"). */
  badge?: string;
}[] = [
  { id: 'home', label: 'Home', route: '/', Icon: HomeIcon },
  { id: 'flash-sale', label: 'Sale', route: '/flash-sale', Icon: SaleIcon, badge: 'Flash' },
  { id: 'explore', label: 'Search', route: '/explore', Icon: SearchIcon },
  { id: 'bookings', label: 'My Trips', route: '/bookings', Icon: TripsIcon },
  { id: 'profile', label: 'Profile', route: '/profile', Icon: ProfileIcon },
];

export function BottomNavigation() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const { isDarkMode } = useSawari();
  const activeInk = isDarkMode ? NAV_ACTIVE_DARK : NAV_ACTIVE;
  const inactiveInk = isDarkMode ? colors.mutedForeground : NAV_INACTIVE;

  const offset = bottomNavOffset(insets.bottom);
  // Figma fades the page out to white under the bar; dark mode fades to its own background.
  const fadeTo = isDarkMode ? colors.background : '#FFFFFF';
  const fadeHeight = BOTTOM_NAV_FADE_HEIGHT + offset - 4;

  return (
    <View pointerEvents="box-none" style={[styles.container, { paddingBottom: offset }]} testID="bottom-nav">
      {/* Figma: backdrop blur under the bar, fading to white (Android blurs the page's <BlurTarget>). */}
      <BottomBlur height={fadeHeight} fadeTo={fadeTo} />
      <View pointerEvents="box-none" style={styles.row}>
        <View style={[styles.pill, { backgroundColor: isDarkMode ? colors.card : '#FFFFFF' }]}>
          {ALL_ITEMS.map(({ id, label, route, Icon, badge }) => {
            const active = route === '/' ? pathname === '/' : pathname.startsWith(route);

            const color = active ? activeInk : inactiveInk;
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityLabel={badge ? `${label}, ${badge}` : label}
                accessibilityState={{ selected: active }}
                testID={`tab-${id}`}
                onPress={() => {
                  if (active) return;
                  Haptics.selectionAsync();
                  // Home stays mounted at the bottom of the stack so coming back to it is instant
                  // (replacing it would rebuild the whole screen); the other tabs swap on top of it.
                  if (route === '/') router.dismissTo('/');
                  // The Sale tab opens from Home on top of it, like the other tabs.
                  else if (pathname === '/') router.push(route);
                  else router.replace(route);
                }}
                hitSlop={{ top: 6, bottom: 6 }}
                style={({ pressed }) => [styles.navItem, pressed && !active && { opacity: 0.7 }]}
              >
                <View style={styles.iconWrapper}>
                  <Icon color={color} fill={isDarkMode ? colors.card : '#FFFFFF'} active={active} />
                  {!!badge && <FlashBadge active={active} />}
                </View>
                <Text
                  style={[styles.navLabel, { color }]}
                  numberOfLines={1}
                  // Fixed size like the "Sale" tab: the tab is 48 high (2 + icon 24 + 2 + label 14 + 2 = 44 inside), so any
                  // system-font enlargement grew the 12pt line and cut the label off at the bottom. On narrow phones
                  // (iPhone 6 / SE, ~37–48 per tab) a long label like "My Trips" shrinks to fit instead of clipping.
                  allowFontScaling={false}
                  adjustsFontSizeToFit
                  minimumFontScale={0.8}
                >
                  {label}
                </Text>
              </Pressable>
            ); 
          })}
        </View>
        <HelpButton />
      </View>
    </View>
  );
}

const HELP_INK = '#008758'; // Green/green-500 (design Help button icon and label)
const NAV_ACTIVE = '#6B5AED'; // Figma tab icons and labels
const NAV_ACTIVE_DARK = '#A5B6FF';
const NAV_INACTIVE = '#737373'; // Neutral/500
// Figma's two-layer upward glow, drawn the same on iOS and Android.
const NAV_SHADOW = '0px -60px 24px rgba(47, 62, 117, 0.01), 0px -34px 20px rgba(47, 62, 117, 0.05)';

const styles = StyleSheet.create({
  // Pinned to the screen bottom; the space under the bar comes from bottomNavOffset() only (the same number
  // useBottomNavHeight() gives screens), so content padding always matches where the bar really is.
  container: { bottom: 0, left: 0, paddingHorizontal: 16, position: 'absolute', right: 0 },
  fade: { bottom: 0, left: 0, position: 'absolute', right: 0 },
  // flex-end: opening the Help menu grows the Help column upward without lifting the tab pill.
  // Figma bar: 361 wide on a 393 phone (pill flex + 12 + Help 56). Tablets / wide screens: kept at a phone-like width,
  // centred, so the tabs don't spread out across the whole screen.
  row: { alignItems: 'flex-end', flexDirection: 'row', gap: BOTTOM_NAV_GAP, width: '100%', maxWidth: 480, alignSelf: 'center' },
  // Figma Frame 2147225836: 293×56 pill (fluid width flex: 1), 1px #F0EFFD border, padding 6px 8px, gap 4px, soft upward glow.
  pill: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    borderColor: '#F0EFFD',
    borderRadius: BOTTOM_NAV_RADIUS,
    borderWidth: 1,
    flexDirection: 'row',
    height: BOTTOM_NAV_CONTENT_HEIGHT,
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
    boxShadow: NAV_SHADOW,
    shadowColor: '#6B5AED',
    shadowOffset: { width: 0, height: -34 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
  },
  helpCol: { alignItems: 'center' },
  // Design: 56×56 circle, Green/green-50 fill, #DCEFE8 border, 8px padding, 2 between icon and label.
  // Headset 24 at y 94–118 and the label's baseline at 127 (Figma), so no gap between them.
  help: {
    alignItems: 'center',
    backgroundColor: '#E6F3EE',
    borderColor: '#DCEFE8',
    borderRadius: BOTTOM_NAV_CONTENT_HEIGHT / 2,
    borderWidth: 1,
    gap: 0,
    padding: 8,
    height: BOTTOM_NAV_CONTENT_HEIGHT,
    justifyContent: 'center',
    width: BOTTOM_NAV_CONTENT_HEIGHT,
    boxShadow: NAV_SHADOW,
    shadowColor: '#6B5AED',
    shadowOffset: { width: 0, height: -34 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 8,
  },
  helpMenu: { alignItems: 'center', gap: 12, marginBottom: 12 },
  helpOption: { alignItems: 'center', borderRadius: BOTTOM_NAV_CONTENT_HEIGHT / 2, height: BOTTOM_NAV_CONTENT_HEIGHT, justifyContent: 'center', width: BOTTOM_NAV_CONTENT_HEIGHT },
  // Figma tab: 42 high, equal widths (52.2 on a 393 phone): icon 20 at y 95–115, label baseline at 126.
  navItem: {
    alignItems: 'center',
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
    gap: 2,
    height: 48,
    paddingVertical: 2,
    paddingHorizontal: 0,
    justifyContent: 'center',
  },
  iconWrapper: {
    width: ICON,
    height: ICON,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  // Figma's Plus Jakarta Sans 600 8 / 12, scaled 1.2× with the icons for the 64 bar ("My Trips" ≈ 40 wide; it
  // still shrinks to fit on the narrowest phones).
  navLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 10,
    lineHeight: 14,
    textAlign: 'center',
    includeFontPadding: false,
  },
  helpLabel: { marginTop: -0.25 },
  // "Flash" tag: Figma rect (106, 110) on the bolt's frame (104.7, 95) → 1.3 in, 15 down (3 below the icon).
  badge: { position: 'absolute', left: 1.566, top: 18 }, // Figma spot × 1.2 with the icon
});