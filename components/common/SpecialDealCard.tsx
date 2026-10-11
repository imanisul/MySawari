import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Animated } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePressAnimation } from '@/hooks/usePressAnimation';
import { shadows } from '@/constants/shadows';
import { LinearGradient } from 'expo-linear-gradient';
import { LoadingImage } from '@/components/common/LoadingImage';
import { useColors } from '@/hooks/useColors';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export interface SpecialDeal {
  _id: string;
  title: string;
  subtitle: string;
  vehicleId?: string;
  originalPrice?: number;
  dealPrice?: number;
  discountPercent?: number;
  expiryDate: string;
  gradientColors: [string, string];
  icon: string;
  image?: { url: string; publicId?: string };
  active: boolean;
}

function getTimeRemaining(expiryDate: string) {
  const diff = new Date(expiryDate).getTime() - Date.now();
  if (diff <= 0) return 'Expired';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  if (days > 7) return `${days} days left`;
  if (days > 0) return `${days}d ${hours}h left`;
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  return `${hours}h ${mins}m left`;
}

export const SpecialDealCard = React.memo(function SpecialDealCard({ deal, onPress }: { deal: SpecialDeal, onPress?: () => void }) {
  const { scaleAnim, opacityAnim, onPressIn, onPressOut } = usePressAnimation(1, 0.97, 1, 1);
  const colors = useColors();
  const router = useRouter();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [timeLeft, setTimeLeft] = useState(() => getTimeRemaining(deal.expiryDate));

  // Pulse animation on the deal badge
  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.05, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  // Update countdown every minute
  useEffect(() => {
    const timer = setInterval(() => setTimeLeft(getTimeRemaining(deal.expiryDate)), 60_000);
    return () => clearInterval(timer);
  }, [deal.expiryDate]);

  const hasImage = !!deal.image?.url;
  const gradients: [string, string] = (deal.gradientColors?.length >= 2
    ? deal.gradientColors
    : ['#FF416C', '#FF4B2B']) as [string, string];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Special deal: ${deal.title}. ${deal.subtitle}. ${timeLeft}`}
      testID={`special-deal-${deal._id}`}
      onPress={() => {
        Haptics.selectionAsync();
        if (onPress) {
          onPress();
        } else if (deal.vehicleId) {
          // If the deal is tied to a vehicle and no custom handler is provided, navigate to explore
          router.push('/explore');
        }
      }}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
    >
      <Animated.View
        style={[
          styles.card,
          shadows.level1,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim,
          },
        ]}
      >
        {/* Background image or gradient */}
        {hasImage && (
          <LoadingImage
            source={{ uri: deal.image!.url }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        )}
        <LinearGradient
          colors={hasImage ? ['rgba(0,0,0,0.15)', 'rgba(0,0,0,0.88)'] : gradients}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.3, y: 1 }}
          style={styles.gradient}
        >
          {/* Top: Deal badge + discount */}
          <View style={styles.topRow}>
            <Animated.View style={[styles.dealBadge, { transform: [{ scale: pulseAnim }] }]}>
              <Feather name="zap" size={12} color="#FFD700" />
              <Text style={styles.dealBadgeText}>SPECIAL DEAL</Text>
            </Animated.View>
            {deal.discountPercent != null && deal.discountPercent > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{deal.discountPercent}% OFF</Text>
              </View>
            )}
          </View>

          {/* Title + subtitle */}
          <View style={styles.contentArea}>
            <Text style={styles.title} numberOfLines={2}>{deal.title}</Text>
            <Text style={styles.subtitle} numberOfLines={2}>{deal.subtitle}</Text>
          </View>

          {/* Bottom: Price + Expiry */}
          <View style={styles.bottomRow}>
            <View style={styles.priceRow}>
              {deal.originalPrice != null && deal.originalPrice > 0 && (
                <Text style={styles.originalPrice}>₹{deal.originalPrice.toLocaleString('en-IN')}/day</Text>
              )}
              {deal.dealPrice != null && deal.dealPrice > 0 && (
                <Text style={styles.dealPrice}>₹{deal.dealPrice.toLocaleString('en-IN')}/day</Text>
              )}
            </View>
            <View style={styles.expiryPill}>
              <Feather name="clock" size={10} color="rgba(255,255,255,0.8)" />
              <Text style={styles.expiryText}>{timeLeft}</Text>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    width: 290,
    backgroundColor: '#FFF',
  },
  gradient: {
    padding: 18,
    height: 200,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dealBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  dealBadgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    color: '#FFD700',
    letterSpacing: 1,
  },
  discountBadge: {
    backgroundColor: 'rgba(255,59,48,0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  discountText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
    lineHeight: 22,
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 4,
    lineHeight: 17,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  originalPrice: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'line-through',
  },
  dealPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  expiryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  expiryText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 10,
    color: 'rgba(255,255,255,0.85)',
  },
});
