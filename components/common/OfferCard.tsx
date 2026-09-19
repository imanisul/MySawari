import React from 'react';
import { Pressable, StyleSheet, Text, View, Animated, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usePressAnimation } from '@/hooks/usePressAnimation';
import { shadows } from '@/constants/shadows';
import { LinearGradient } from 'expo-linear-gradient';

import { Offer } from '@/services/api/offers';

export const OfferCard = React.memo(function OfferCard({ offer }: { offer: Offer }) {
  const { scaleAnim, opacityAnim, onPressIn, onPressOut } = usePressAnimation(1, 0.98, 1, 1);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${offer.discount} discount on ${offer.title}, ${offer.subtitle}. Expires ${offer.expiry}. Code ${offer.code}`}
      testID={`offer-${offer.id}`}
      onPress={() => {
        // Optional: Trigger action
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
            // Only apply shadow opacity reduction on iOS via JS interpolation, 
            // since Android elevation interpolation can be tricky. We use simple elevation.
          },
        ]}
      >
        {offer.image && (
          <Image source={offer.image} style={StyleSheet.absoluteFill} resizeMode="cover" />
        )}
        <LinearGradient
          colors={offer.image ? ['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)'] : offer.gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
        {/* Top row: icon + discount badge */}
        <View style={styles.topRow}>
          <View style={styles.iconCircle}>
            <Feather name={offer.icon} size={18} color="#FFF" />
          </View>
          <View style={styles.discountBadge}>
            <Text style={styles.discountText}>{offer.discount}</Text>
          </View>
        </View>

        {/* Title & subtitle */}
        <Text style={styles.title} numberOfLines={1}>{offer.title}</Text>
        <Text style={styles.subtitle} numberOfLines={2}>{offer.subtitle}</Text>

        <View style={styles.bottomRow}>
          <View style={styles.codePill}>
            <Feather name="scissors" size={11} color="rgba(255,255,255,0.8)" style={{ marginRight: 6 }} />
            <Text style={styles.codeText} numberOfLines={1} adjustsFontSizeToFit>{offer.code}</Text>
          </View>
          <Text style={styles.expiry}>{offer.expiry}</Text>
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
    backgroundColor: '#FFF', // Needed for shadow
  },
  gradient: {
    padding: 18,
    height: 175,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  discountBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
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
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginTop: 14,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingLeft: 10,
    paddingRight: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderStyle: 'dashed',
    maxWidth: '65%',
  },
  codeText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 1,
    flexShrink: 1,
  },
  expiry: {
    fontFamily: 'Inter_400Regular',
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
});
