import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { formatCurrency } from '@/services/backend/pricingEngine';

export function StickyBookingBar({
  isAvailable = true,
  onViewBreakdown,
  onNeedLogin,
  onBookNow,
}: {
  isAvailable?: boolean;
  onViewBreakdown?: () => void;
  onNeedLogin?: () => void;
  onBookNow?: () => void;
}) {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { pricingQuote, isQuoteLoading, isAuthenticated } = useSawari();

  return (
    <View style={[styles.bottomBarPremium, { 
      backgroundColor: colors.card, 
      paddingBottom: Math.max(insets.bottom, 16) 
    }]}>
      <Pressable
        style={styles.priceContainer}
        onPress={onViewBreakdown}
        disabled={!onViewBreakdown}
        accessibilityRole={onViewBreakdown ? 'button' : undefined}
        accessibilityLabel="View price breakdown"
      >
        {!isAvailable ? (
          <View>
            <Text style={[styles.bottomLabel, { color: '#DC2626', fontFamily: 'Inter_600SemiBold', fontSize: 16 }]}>Not Available</Text>
          </View>
        ) : (
          <>
            <Text style={[styles.bottomLabel, { color: colors.mutedForeground }]}>Payable Now</Text>

            {isQuoteLoading ? (
              <Text style={[styles.bottomPrice, { color: colors.foreground, fontSize: 16 }]}>Calculating...</Text>
            ) : (
              <Text style={[styles.bottomPrice, { color: colors.foreground }]}>
                {formatCurrency(pricingQuote?.onlinePayableNow || 0)}
              </Text>
            )}

            <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 11, color: colors.primaryText, marginTop: 2 }}>View breakdown</Text>
          </>
        )}
      </Pressable>
      
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          if (isAuthenticated) {
            onBookNow ? onBookNow() : router.push('/booking');
          } else {
            onNeedLogin?.();
          }
        }}
        disabled={!isAvailable || isQuoteLoading}
        style={({ pressed }) => [
          styles.bottomButtonPremium, 
          { backgroundColor: !isAvailable ? colors.muted : colors.primary }, 
          pressed && isAvailable && styles.pressed,
          (!isAvailable || isQuoteLoading) && { opacity: 0.5 }
        ]}
      >
        <Text style={[
          styles.bottomButtonText,
          { color: !isAvailable ? colors.mutedForeground : colors.primaryForeground }
        ]}>
          Book Now
        </Text>
        <Feather name="arrow-right" size={18} color={!isAvailable ? colors.mutedForeground : colors.primaryForeground} />
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
  priceContainer: {
    flex: 1,
  },
  bottomLabel: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  bottomPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    marginTop: 2,
    letterSpacing: -0.5,
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
  pressed: {
    opacity: 0.7,
  }
});
