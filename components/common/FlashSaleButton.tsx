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

  const innerContent = (
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
        hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
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
  inactiveOpacity: {
    opacity: 0.92,
  },
});
