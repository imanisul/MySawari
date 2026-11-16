import React, { useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from '@/utils/haptics';

export type FlashSaleButtonSize = 'tab' | 'sm' | 'md' | 'lg';

export interface FlashSaleButtonProps {
  /** Size variant:
   *  - 'tab': Fits seamlessly inside the BottomNavigation pill (42px height).
   *  - 'sm': Compact 48px standalone button.
   *  - 'md': Standard 62px card / banner button.
   *  - 'lg': Full 84px display lockup matching original Figma asset.
   */
  size?: FlashSaleButtonSize;
  /** Whether the button / tab is currently selected / active. */
  active?: boolean;
  /** Whether dark mode theme is active. */
  isDarkMode?: boolean;
  /** Optional custom tap handler. If provided, triggers haptics and spring animation. */
  onPress?: () => void;
  /** Additional container style. */
  style?: StyleProp<ViewStyle>;
  /** Test identifier. */
  testID?: string;
  /** Whether to disable the press interaction. */
  disabled?: boolean;
}

/**
 * Exact rounded solid lightning bolt vector matching Figma & design specification.
 * Normalized within a 29 × 28 bounding box with rounded tips, smooth diagonal slope,
 * energetic horizontal wing step, and rounded waist.
 */
const BOLT_PATH =
  'M17.5 0.5C18.8 0.5 19.8 1.5 19.4 2.8L18.2 13.0L26.5 13.8C27.8 14.0 28.5 15.6 27.6 16.7L19.5 26.8C19.0 27.4 18.2 27.8 17.5 27.8L9.8 27.8C8.8 27.8 8.1 26.8 8.5 25.9L10.5 21.2L2.0 20.8C0.6 20.7 -0.2 19.1 0.6 18.0L15.8 1.2C16.2 0.7 16.8 0.5 17.5 0.5Z';

// Figma bolt (13.33 × 16.67 inside a 20 × 20 icon frame).
const FIGMA_BOLT =
  'M9.928 1.666C10.022 1.399 10.023 1.107 9.93 0.84C9.837 0.572 9.656 0.344 9.416 0.193C9.177 0.042 8.893 -0.024 8.611 0.008C8.33 0.039 8.067 0.165 7.866 0.365L0.366 7.865C0.192 8.04 0.072 8.263 0.024 8.505C-0.024 8.748 0 8.999 0.095 9.227C0.19 9.456 0.35 9.651 0.555 9.788C0.761 9.926 1.002 9.999 1.25 9.999L4.585 9.999C4.651 9.999 4.717 10.015 4.776 10.046C4.835 10.077 4.886 10.121 4.924 10.175C4.963 10.23 4.988 10.293 4.997 10.358C5.006 10.424 4.999 10.492 4.977 10.554L3.405 14.999C3.31 15.267 3.31 15.558 3.403 15.826C3.496 16.093 3.677 16.322 3.917 16.473C4.157 16.624 4.441 16.689 4.722 16.658C5.004 16.626 5.267 16.5 5.467 16.299L12.967 8.799C13.142 8.624 13.261 8.402 13.309 8.159C13.357 7.917 13.332 7.666 13.238 7.437C13.143 7.209 12.983 7.014 12.777 6.877C12.572 6.739 12.33 6.666 12.083 6.666L8.752 6.666C8.686 6.666 8.62 6.65 8.56 6.62C8.501 6.589 8.45 6.544 8.412 6.49C8.373 6.436 8.348 6.373 8.339 6.306C8.33 6.24 8.337 6.173 8.359 6.11L9.928 1.666Z';

const SIZE_CONFIGS = {
  tab: {
    containerHeight: 42,
    boltWidth: 20,
    boltHeight: 19.3,
    badgeBottom: -2.5,
    badgeHeight: 10.5,
    badgeMinWidth: 24,
    badgePaddingH: 4.5,
    badgeRadius: 5.5,
    badgeFontSize: 6.8,
    badgeLineHeight: 9.5,
    gap: 1.5,
    labelFontSize: 8.5,
    labelLineHeight: 12,
  },
  sm: {
    containerHeight: 48,
    boltWidth: 22,
    boltHeight: 21.2,
    badgeBottom: -3,
    badgeHeight: 12,
    badgeMinWidth: 27,
    badgePaddingH: 5,
    badgeRadius: 6,
    badgeFontSize: 7.5,
    badgeLineHeight: 11,
    gap: 2,
    labelFontSize: 9.5,
    labelLineHeight: 13,
  },
  md: {
    containerHeight: 62,
    boltWidth: 29,
    boltHeight: 28,
    badgeBottom: -4,
    badgeHeight: 15,
    badgeMinWidth: 34,
    badgePaddingH: 6.5,
    badgeRadius: 7.5,
    badgeFontSize: 9,
    badgeLineHeight: 13,
    gap: 3.5,
    labelFontSize: 12,
    labelLineHeight: 16,
  },
  lg: {
    containerHeight: 84,
    boltWidth: 38,
    boltHeight: 36.6,
    badgeBottom: -5,
    badgeHeight: 19,
    badgeMinWidth: 44,
    badgePaddingH: 8,
    badgeRadius: 9.5,
    badgeFontSize: 11.5,
    badgeLineHeight: 16,
    gap: 5,
    labelFontSize: 15.5,
    labelLineHeight: 20,
  },
};

export const FLASH_PINK = '#FF008B';
export const FLASH_PURPLE = '#6B5AED';
export const FLASH_PURPLE_DARK = '#8B7EFF';

/**
 * FlashSaleButton
 * Pixel-perfect rendition of the signature MySawari Flash Sale button:
 * - Solid rounded vibrant purple lightning bolt
 * - Vibrant hot-pink badge with crisp white "Flash" text overlapping the bolt
 * - Bold purple "Sale" label centered cleanly beneath
 */
export function FlashSaleButton({
  size = 'tab',
  active = true,
  isDarkMode = false,
  onPress,
  style,
  testID = 'tab-flash-sale',
  disabled = false,
}: FlashSaleButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const cfg = SIZE_CONFIGS[size];
  const purpleColor = isDarkMode ? FLASH_PURPLE_DARK : FLASH_PURPLE;

  const handlePressIn = () => {
    if (disabled || !onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  };

  const handlePressOut = () => {
    if (disabled || !onPress) return;
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 80,
    }).start();
  };

  const handlePress = () => {
    if (disabled || !onPress) return;
    Haptics.selectionAsync();
    onPress();
  };

  // Bottom-bar tab: exact Figma (1730:26946 selected / 1730:26982 not selected), 51.8 × 42 frame.
  // Not selected = grey outline bolt + grey "Sale"; selected = purple bolt + label. The "Flash" tag is always #FF008B.
  const ink = active ? purpleColor : isDarkMode ? '#9A9A9A' : '#737373';
  const innerContent = size === 'tab' ? (
    <Animated.View style={[styles.tabInner, { transform: [{ scale: scaleAnim }] }]}>
      {/* Same 24pt icon box as the other tabs; the 20-unit Figma frame is scaled up, so the stroke is 1pt on screen. */}
      <View style={styles.tabIcon}>
        <Svg width={24} height={24} viewBox="-3.33 -1.67 20 20">
          <Path
            d={FIGMA_BOLT}
            fill={active ? purpleColor : 'none'}
            stroke={ink}
            strokeWidth={active ? 0.7 : 0.833}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </Svg>
      </View>
      <Text style={[styles.tabLabel, { color: ink }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} allowFontScaling={false}>Sale</Text>
      {/* Drawn last, inside the tab's own box (not hanging out of the 24pt icon box), so nothing clips or covers it. */}
      <View pointerEvents="none" style={[styles.tabBadge, { backgroundColor: FLASH_PINK }]}>
        <Text style={styles.tabBadgeText} allowFontScaling={false}>Flash</Text>
      </View>
    </Animated.View>
  ) : (
    <Animated.View
      style={[
        styles.inner,
        { transform: [{ scale: scaleAnim }] },
        !active && styles.inactiveOpacity,
      ]}
    >
      {/* Top Lockup: Bolt + Overlapping "Flash" Badge */}
      <View style={styles.iconWrapper}>
        <Svg
          width={cfg.boltWidth}
          height={cfg.boltHeight}
          viewBox="0 0 29 28"
          fill="none"
        >
          <Path d={BOLT_PATH} fill={purpleColor} />
        </Svg>

        <View
          pointerEvents="none"
          style={[
            styles.badge,
            {
              bottom: cfg.badgeBottom,
              height: cfg.badgeHeight,
              minWidth: cfg.badgeMinWidth,
              paddingHorizontal: cfg.badgePaddingH,
              borderRadius: cfg.badgeRadius,
              backgroundColor: FLASH_PINK,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                fontSize: cfg.badgeFontSize,
                lineHeight: cfg.badgeLineHeight,
              },
            ]}
            allowFontScaling={false}
          >
            Flash
          </Text>
        </View>
      </View>

      {/* Bottom Label: "Sale" */}
      <Text
        style={[
          styles.saleLabel,
          {
            color: purpleColor,
            fontSize: cfg.labelFontSize,
            lineHeight: cfg.labelLineHeight,
            marginTop: cfg.gap,
          },
          active && styles.saleLabelActive,
        ]}
        numberOfLines={1}
        allowFontScaling={false}
      >
        Sale
      </Text>
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="tab"
        accessibilityLabel="Flash Sale"
        accessibilityState={{ selected: active }}
        testID={testID}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        hitSlop={size === 'tab' ? { top: 6, bottom: 6 } : { top: 6, bottom: 6, left: 6, right: 6 }}
        style={({ pressed }) => [
          styles.container,
          { height: cfg.containerHeight },
          pressed && !active && { opacity: 0.7 },
          style,
        ]}
      >
        {innerContent}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { height: cfg.containerHeight },
        style,
      ]}
      testID={testID}
    >
      {innerContent}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  inner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    shadowColor: FLASH_PINK,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.35,
    shadowRadius: 2,
    elevation: 3,
  },
  badgeText: {
    fontFamily: 'PlusJakartaSans_700Bold',
    color: '#FFFFFF',
    fontWeight: '800',
    includeFontPadding: false,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  saleLabel: {
    fontFamily: 'PlusJakartaSans_700Bold',
    fontWeight: '700',
    textAlign: 'center',
    includeFontPadding: false,
  },
  saleLabelActive: {
    fontWeight: '800',
  },
  // Figma tab frame: column, padding 2/0, gap 2; icon 20 at y 4, tag 17 × 8 at y 19, "Sale" 8/12 at y 26.
  // Same box as the other tabs (BottomNavigation navItem): fills its flex slot, never a fixed width, so it
  // can't spill out of the pill on narrow phones. Column, gap 2: icon 24 + label 12.
  tabInner: {
    alignSelf: 'stretch',
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIcon: {
    width: 24,
    height: 24,
    alignItems: 'center',
  },
  // Figma: 17 × 8 tag over the bolt's foot (y 15 of the 20 icon frame → 18 at 24pt).
  // Figma Frame 2147226285: exactly 17 × 8, radius 10, padding 0/2, centred (−0.2) over the bolt's foot.
  // Fixed width + no wrapping so it can't grow or break on phones with wider font rendering.
  // Figma Frame 2147226285: 17 × 8, radius 10, centred (−0.2) over the bolt's foot: 18pt below the icon's top,
  // which sits at the top of this column (the column is 38 high: icon 24 + gap 2 + label 12).
  tabBadge: {
    position: 'absolute',
    top: 18,
    left: '50%',
    marginLeft: -17 / 2 - 0.2,
    width: 17,
    height: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  // The text box is the pill's full 17 (Figma's 2 + 13 + 2 padding, text centred), so Android's slightly wider
  // measuring of "Flash" can't wrap it onto a hidden second line.
  tabBadgeText: {
    width: 17,
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 5,
    lineHeight: 7.5,
    color: '#FFFFFF',
    includeFontPadding: false,
    textAlign: 'center',
  },
  // Same type as the other tab labels: 600, 8.5 / 12.
  tabLabel: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 8.5,
    lineHeight: 12,
    textAlign: 'center',
    includeFontPadding: false,
  },
  inactiveOpacity: {
    opacity: 0.92,
  },
});
