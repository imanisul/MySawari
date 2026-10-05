import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

/**
 * The car details page's bottom bar: ONE full-width call to action and no price. The price breakdown is
 * only shown on the payment page, once the customer has chosen their destination and trip details.
 *  - available     → "Book Now" (asks to log in first when needed)
 *  - not available → "Check Availability" (opens destination + dates to check other dates)
 */
export function StickyBookingBar({
  isAvailable = true,
  onNeedLogin,
  onBookNow,
  onCheckAvailability,
}: {
  isAvailable?: boolean;
  onCheckAvailability?: () => void;
  onNeedLogin?: () => void;
  onBookNow?: () => void;
}) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useSawari();

  const label = isAvailable ? 'Book Now' : 'Check Availability';
  const onPress = isAvailable
    ? () => {
        if (isAuthenticated) {
          onBookNow ? onBookNow() : router.push('/booking');
        } else {
          onNeedLogin?.();
        }
      }
    : onCheckAvailability;
  const disabled = !onPress;

  return (
    <View style={[styles.bottomBarPremium, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => [
          styles.bottomButtonPremium,
          styles.fullButton,
          { backgroundColor: colors.primary },
          pressed && styles.pressed,
          disabled && { opacity: 0.5 },
        ]}
      >
        {!isAvailable && <Feather name="calendar" size={18} color={colors.primaryForeground} style={{ marginRight: 8 }} />}
        <Text style={[styles.bottomButtonText, { color: colors.primaryForeground, marginRight: isAvailable ? 8 : 0 }]}>{label}</Text>
        {isAvailable && <Feather name="arrow-right" size={18} color={colors.primaryForeground} />}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomBarPremium: {
    alignItems: 'center',
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    position: 'absolute',
    width: '100%',
    elevation: 20,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  bottomButtonPremium: {
    alignItems: 'center',
    borderRadius: 16,
    flexDirection: 'row',
    height: 54,
    justifyContent: 'center',
    paddingHorizontal: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  bottomButtonText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 16,
    marginRight: 8,
  },
  fullButton: {
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  }
});
