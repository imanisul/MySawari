import React, { useRef, useState } from 'react';
import { Animated, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { BottomBlur } from '@/components/common/BottomBlur';
import Svg, { Circle, Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { BOTTOM_NAV_CONTENT_HEIGHT, BOTTOM_NAV_FADE_HEIGHT, BOTTOM_NAV_GAP, BOTTOM_NAV_RADIUS, bottomNavOffset } from '@/hooks/useBottomNavHeight';
import { useSawari } from '@/context/SawariContext';
import { useRegisterNavHelp } from '@/hooks/useSupportFab';
import { shadows } from '@/constants/shadows';
import { SUPPORT_PHONE, SUPPORT_WHATSAPP_URL } from '@/constants/support';

type IconProps = { color: string; fill: string; active: boolean };
type Route = '/' | '/explore' | '/bookings' | '/profile';

// Icons render at 24pt (design, 1pt strokes): 24-unit icons use STROKE, 18-unit icons are scaled up by 4/3 and use STROKE_18.
const ICON = 24;
const STROKE = 1;
const STROKE_18 = 0.75;

// Exact Figma path (18px frame, 1px stroke); the door is a notch in the outline.
const HOME_PATH =
  'M11.25 9.75V15.75H14.25C14.648 15.75 15.029 15.592 15.311 15.311C15.592 15.029 15.75 14.648 15.75 14.25V7.5C15.75 7.282 15.703 7.066 15.611 6.868C15.519 6.67 15.385 6.495 15.218 6.354L9.968 1.854C9.697 1.625 9.355 1.5 9 1.5C8.645 1.5 8.303 1.625 8.032 1.854L2.782 6.354C2.615 6.495 2.481 6.67 2.389 6.868C2.297 7.066 2.25 7.282 2.25 7.5V14.25C2.25 14.648 2.408 15.029 2.689 15.311C2.971 15.592 3.352 15.75 3.75 15.75H6.75V9.75C6.75 9.551 6.829 9.36 6.97 9.22C7.11 9.079 7.301 9 7.5 9H10.5C10.699 9 10.89 9.079 11.03 9.22C11.171 9.36 11.25 9.551 11.25 9.75Z';

function HomeIcon({ color, active }: IconProps) {
  return (
    <Svg width={ICON} height={ICON} viewBox="0 0 18 18" fill="none">
      <Path d={HOME_PATH} fill={active ? color : 'none'} stroke={color} strokeWidth={STROKE_18} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

function ExploreIcon({ color, fill, active }: IconProps) {
  return (
    <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} fill={active ? color : 'none'} stroke={color} strokeWidth={STROKE} />
      <Path
        d="m16.24 7.76-1.8 5.41a2 2 0 0 1-1.27 1.27L7.76 16.24l1.8-5.41a2 2 0 0 1 1.27-1.27z"
        stroke={active ? fill : color}
        strokeWidth={STROKE}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Exact Figma "road" (24px frame, 1px stroke): the road outline, then the three centre dashes.
const ROAD_PATH =
  'M2.0774 18.449C1.99207 18.7467 1.97706 19.0602 2.03355 19.3648C2.09004 19.6693 2.21649 19.9566 2.40293 20.2039C2.58938 20.4512 2.83072 20.6519 3.10794 20.79C3.38515 20.9282 3.69067 21.0001 4.0004 21H20.0004C20.3101 21.0002 20.6156 20.9284 20.8929 20.7904C21.1701 20.6524 21.4115 20.4518 21.598 20.2046C21.7846 19.9574 21.9112 19.6702 21.9678 19.3657C22.0244 19.0612 22.0096 18.7478 21.9244 18.45L17.9244 4.45C17.8049 4.03205 17.5524 3.66443 17.2052 3.40279C16.8581 3.14116 16.4351 2.99976 16.0004 3H8.0004C7.56569 2.99976 7.14273 3.14116 6.79557 3.40279C6.44841 3.66443 6.19594 4.03205 6.0764 4.45L2.0774 18.449Z';

function ActivityIcon({ color, fill, active }: IconProps) {
  const line = active ? fill : color;
  return (
    <Svg width={ICON} height={ICON} viewBox="0 0 24 24" fill="none">
      <Path d={ROAD_PATH} fill={active ? color : 'none'} stroke={color} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M12 17V21M12 5V3M12 9V12" stroke={line} strokeWidth={STROKE} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// Exact Figma paths (18px frame, 1px stroke): head, then shoulders.
const PROFILE_PATHS = [
  'M9 9.75C11.071 9.75 12.75 8.071 12.75 6C12.75 3.929 11.071 2.25 9 2.25C6.929 2.25 5.25 3.929 5.25 6C5.25 8.071 6.929 9.75 9 9.75Z',
  'M13.242 11.507C14.368 12.633 15.625 14.5 15 15.75C14.375 17 3.375 17 3 15.75C2.625 14.5 3.632 12.633 4.757 11.507C5.882 10.382 7.408 9.75 9 9.75C10.591 9.75 12.117 10.382 13.242 11.507Z',
];

function ProfileIcon({ color, active }: IconProps) {
  return (
    <Svg width={ICON} height={ICON} viewBox="0 0 18 18" fill="none">
      {PROFILE_PATHS.map((d) => (
        <Path key={d} d={d} fill={active ? color : 'none'} stroke={color} strokeWidth={STROKE_18} strokeLinecap="round" strokeLinejoin="round" />
      ))}
    </Svg>
  );
}

// Exact Figma paths (18px frame, 1px stroke). The fill path goes over the headband and straight back,
// so only the ear cups are solid; the outline path draws the band, and the tail is the mic.
const HEADSET_FILL =
  'M2.25 8.25H4.5C4.898 8.25 5.279 8.408 5.561 8.689C5.842 8.971 6 9.352 6 9.75V12C6 12.398 5.842 12.779 5.561 13.061C5.279 13.342 4.898 13.5 4.5 13.5H3.75C3.352 13.5 2.971 13.342 2.689 13.061C2.408 12.779 2.25 12.398 2.25 12V8.25C2.25 7.364 2.425 6.486 2.764 5.667C3.103 4.848 3.6 4.104 4.227 3.477C4.854 2.85 5.598 2.353 6.417 2.014C7.236 1.675 8.114 1.5 9 1.5C9.886 1.5 10.764 1.675 11.583 2.014C12.402 2.353 13.146 2.85 13.773 3.477C14.4 4.104 14.897 4.848 15.236 5.667C15.575 6.486 15.75 7.364 15.75 8.25V12C15.75 12.398 15.592 12.779 15.311 13.061C15.029 13.342 14.648 13.5 14.25 13.5H13.5C13.102 13.5 12.721 13.342 12.439 13.061C12.158 12.779 12 12.398 12 12V9.75C12 9.352 12.158 8.971 12.439 8.689C12.721 8.408 13.102 8.25 13.5 8.25H15.75C15.75 7.364 15.575 6.486 15.236 5.667C14.897 4.848 14.4 4.104 13.773 3.477C13.146 2.85 12.402 2.353 11.583 2.014C10.764 1.675 9.886 1.5 9 1.5C8.114 1.5 7.236 1.675 6.417 2.014C5.598 2.353 4.854 2.85 4.227 3.477C3.6 4.104 3.103 4.848 2.764 5.667C2.425 6.486 2.25 7.364 2.25 8.25Z';
const HEADSET_OUTLINE =
  'M2.25 8.25H4.5C4.898 8.25 5.279 8.408 5.561 8.689C5.842 8.971 6 9.352 6 9.75V12C6 12.398 5.842 12.779 5.561 13.061C5.279 13.342 4.898 13.5 4.5 13.5H3.75C3.352 13.5 2.971 13.342 2.689 13.061C2.408 12.779 2.25 12.398 2.25 12V8.25ZM2.25 8.25C2.25 7.364 2.425 6.486 2.764 5.667C3.103 4.848 3.6 4.104 4.227 3.477C4.854 2.85 5.598 2.353 6.417 2.014C7.236 1.675 8.114 1.5 9 1.5C9.886 1.5 10.764 1.675 11.583 2.014C12.402 2.353 13.146 2.85 13.773 3.477C14.4 4.104 14.897 4.848 15.236 5.667C15.575 6.486 15.75 7.364 15.75 8.25M15.75 8.25V12C15.75 12.398 15.592 12.779 15.311 13.061C15.029 13.342 14.648 13.5 14.25 13.5H13.5C13.102 13.5 12.721 13.342 12.439 13.061C12.158 12.779 12 12.398 12 12V9.75C12 9.352 12.158 8.971 12.439 8.689C12.721 8.408 13.102 8.25 13.5 8.25H15.75Z';
const HEADSET_MIC = 'M15.75 12V13.5C15.75 14.296 15.434 15.059 14.871 15.621C14.309 16.184 13.546 16.5 12.75 16.5H9';

function HeadsetIcon({ color }: { color: string }) {
  return (
    <Svg width={ICON} height={ICON} viewBox="0 0 18 18" fill="none">
      <Path d={HEADSET_FILL} fill={color} />
      <Path d={HEADSET_OUTLINE} stroke={color} strokeWidth={STROKE_18} strokeLinecap="round" strokeLinejoin="round" />
      <Path d={HEADSET_MIC} stroke={color} strokeWidth={STROKE_18} strokeLinecap="round" strokeLinejoin="round" />
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
        <Text style={[styles.navLabel, { color: helpColor }]} numberOfLines={1} maxFontSizeMultiplier={1.15}>Help</Text>
      </Pressable>
    </View>
  );
}

const ALL_ITEMS: {
  id: string;
  label: string;
  route: Route;
  Icon: (p: IconProps) => React.ReactElement;
}[] = [
  { id: 'home', label: 'Home', route: '/', Icon: HomeIcon },
  { id: 'explore', label: 'Explore', route: '/explore', Icon: ExploreIcon },
  { id: 'bookings', label: 'My Trips', route: '/bookings', Icon: ActivityIcon },
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
          {ALL_ITEMS.map(({ id, label, route, Icon }) => {
            const active = route === '/' ? pathname === '/' : pathname.startsWith(route);
            const color = active ? activeInk : inactiveInk;
            return (
              <Pressable
                key={id}
                accessibilityRole="tab"
                accessibilityLabel={label}
                accessibilityState={{ selected: active }}
                testID={`tab-${id}`}
                onPress={() => {
                  if (active) return;
                  Haptics.selectionAsync();
                  // Home stays mounted at the bottom of the stack so coming back to it is instant
                  // (replacing it would rebuild the whole screen); the other tabs swap on top of it.
                  if (route === '/') router.dismissTo('/');
                  else if (pathname === '/') router.push(route);
                  else router.replace(route);
                }}
                hitSlop={{ top: 6, bottom: 6 }}
                style={({ pressed }) => [styles.navItem, pressed && !active && { opacity: 0.7 }]}
              >
                <Icon color={color} fill={isDarkMode ? colors.card : '#FFFFFF'} active={active} />
                <Text
                  style={[styles.navLabel, active && styles.navLabelActive, { color }]}
                  numberOfLines={1}
                  // Big system font sizes used to push the labels out of the pill.
                  maxFontSizeMultiplier={1.15}
                  adjustsFontSizeToFit
                  minimumFontScale={0.85}
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
const NAV_ACTIVE = '#2F3E75'; // Primary/blue-500 (Figma active tab: icon and label)
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
  row: { alignItems: 'flex-end', flexDirection: 'row', gap: BOTTOM_NAV_GAP },
  // Design: 285×64 pill (fluid width here, so it fills wider phones), 1px #E7EAF4 border, 8px padding and 4 between tabs, soft upward glow.
  pill: {
    flex: 1,
    minWidth: 0,
    alignItems: 'center',
    borderColor: '#E7EAF4',
    borderRadius: BOTTOM_NAV_RADIUS,
    borderWidth: 1,
    flexDirection: 'row',
    height: BOTTOM_NAV_CONTENT_HEIGHT,
    padding: 8,
    gap: 4,
    boxShadow: NAV_SHADOW,
  },
  helpCol: { alignItems: 'center' },
  // Design: 64×64 circle, Green/green-50 fill, #DCEFE8 border, 8px padding, 2 between icon and label.
  help: {
    alignItems: 'center',
    backgroundColor: '#E6F3EE',
    borderColor: '#DCEFE8',
    borderRadius: BOTTOM_NAV_RADIUS,
    borderWidth: 1,
    gap: 2,
    padding: 8,
    height: BOTTOM_NAV_CONTENT_HEIGHT,
    justifyContent: 'center',
    width: BOTTOM_NAV_CONTENT_HEIGHT,
    boxShadow: NAV_SHADOW,
  },
  helpMenu: { alignItems: 'center', gap: 12, marginBottom: 12 },
  helpOption: { alignItems: 'center', borderRadius: 24, height: 48, justifyContent: 'center', width: 48 },
  // Equal-width tabs: padding 2 + icon 24 + gap 2 + label 12 + 2 = 42, in a 46px-high slot of the 64 pill.
  navItem: {
    alignItems: 'center',
    flexBasis: 0,
    flexGrow: 1,
    minWidth: 0,
    gap: 2,
    height: 46,
    paddingVertical: 2,
    justifyContent: 'center',
  },
  // Design: Plus Jakarta Sans 600, 8px / 12px, in every state.
  navLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 8,
    lineHeight: 12,
    textAlign: 'center',
  },
  navLabelActive: {},
});