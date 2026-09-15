import React, { useState, useRef } from 'react';
import { Linking, Pressable, StyleSheet, View, Animated } from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { usePathname } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { shadows } from '@/constants/shadows';
import { usePressAnimation } from '@/hooks/usePressAnimation';

const HIDDEN_ROUTES = [
  '/payment',
  '/payment-processing',
  '/car-details',
  '/booking-detail',
  '/booking',
];

export function FloatingSupport() {
  const pathname = usePathname();
  const isHidden = HIDDEN_ROUTES.includes(pathname);

  // Return early BEFORE calling any hooks if hidden
  if (isHidden) {
    return null;
  }

  return <FloatingSupportInner />;
}

function FloatingSupportInner() {
  const colors = useColors();
  const [isOpen, setIsOpen] = useState(false);
  const animation = useRef(new Animated.Value(0)).current;

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const toValue = isOpen ? 0 : 1;
    Animated.spring(animation, {
      toValue,
      friction: 6,
      useNativeDriver: true,
    }).start();
    setIsOpen(!isOpen);
  };

  const { scaleAnim: waScale, opacityAnim: waOpacity, onPressIn: waPressIn, onPressOut: waPressOut } = usePressAnimation();
  const { scaleAnim: phScale, opacityAnim: phOpacity, onPressIn: phPressIn, onPressOut: phPressOut } = usePressAnimation();
  const { scaleAnim: mainScale, opacityAnim: mainOpacity, onPressIn: mainPressIn, onPressOut: mainPressOut } = usePressAnimation();

  const handleWhatsApp = () => {
    Haptics.selectionAsync();
    Linking.openURL('whatsapp://send?text=Hello MySawari&phone=+919365557500');
    toggleMenu();
  };

  const handleCall = () => {
    Haptics.selectionAsync();
    Linking.openURL('tel:+919355023248');
    toggleMenu();
  };

  const waStyle = {
    transform: [
      { scale: animation },
      { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [20, -10] }) }
    ],
    opacity: animation
  };

  const phStyle = {
    transform: [
      { scale: animation },
      { translateY: animation.interpolate({ inputRange: [0, 1], outputRange: [20, -10] }) }
    ],
    opacity: animation
  };

  const mainRotation = animation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg']
  });

  return (
    <View style={styles.container} pointerEvents="box-none">
      
      {/* Phone Button */}
      <Animated.View style={phStyle}>
        <Pressable
          onPress={handleCall}
          onPressIn={phPressIn}
          onPressOut={phPressOut}
          style={[styles.buttonWrap, { display: isOpen ? 'flex' : 'none' }]}
          disabled={!isOpen}
        >
          <Animated.View style={[styles.miniFab, shadows.level2, { backgroundColor: colors.blue, transform: [{ scale: phScale }], opacity: phOpacity }]}>
            <Feather name="phone" size={20} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
      </Animated.View>

      {/* WhatsApp Button */}
      <Animated.View style={waStyle}>
        <Pressable
          onPress={handleWhatsApp}
          onPressIn={waPressIn}
          onPressOut={waPressOut}
          style={[styles.buttonWrap, { display: isOpen ? 'flex' : 'none' }]}
          disabled={!isOpen}
        >
          <Animated.View style={[styles.miniFab, shadows.level2, { backgroundColor: '#25D366', transform: [{ scale: waScale }], opacity: waOpacity }]}>
            <FontAwesome name="whatsapp" size={22} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
      </Animated.View>

      {/* Main Toggle Button */}
      <Pressable
        onPress={toggleMenu}
        onPressIn={mainPressIn}
        onPressOut={mainPressOut}
        style={styles.buttonWrap}
      >
        <Animated.View style={[
          styles.fab, 
          shadows.level3, 
          { 
            backgroundColor: colors.foreground, 
            transform: [{ scale: mainScale }, { rotate: mainRotation }], 
            opacity: mainOpacity 
          }
        ]}>
          <Feather name="message-circle" size={26} color={colors.background} />
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above bottom nav
    right: 20,
    gap: 12,
    alignItems: 'flex-end',
    zIndex: 999,
  },
  buttonWrap: {
    padding: 2, // touch area
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  }
});
