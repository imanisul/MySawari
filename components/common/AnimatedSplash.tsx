import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

// How long the finished brand animation stays before the app fades in.
const SPLASH_HOLD_MS = 1000;

export function AnimatedSplash({ isReady, children }: { isReady: boolean, children: React.ReactNode }) {
  const colors = useColors();
  const { isDarkMode } = useSawari();
  
  // The app is built underneath the splash as it starts to fade, so the screens' own entrance
  // animations play as the splash lifts (instead of the app appearing only after it has gone).
  const [showChildren, setShowChildren] = useState(false);
  // State to track if the splash screen should still be mounted
  const [isAnimationComplete, setIsAnimationComplete] = useState(false);
  
  // Animation values
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  
  const titleTranslateY = useRef(new Animated.Value(20)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;

  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;

  // Entry Animation
  useEffect(() => {
    Animated.stagger(150, [
      Animated.parallel([
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 12,
          friction: 5,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(titleOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(titleTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        })
      ])
    ]).start();
  }, []);

  // Exit Animation triggered when app is ready
  useEffect(() => {
    if (!isReady) return;
    // Short hold so the brand animation is seen; the vehicles are loading in the background meanwhile.
    const hold = setTimeout(() => {
      setShowChildren(true); // mount the app under the splash…
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimationComplete(true); // …and remove the splash once it has faded out
      });
    }, SPLASH_HOLD_MS);
    return () => clearTimeout(hold);
  }, [isReady]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Always the same position in the tree, so the app never remounts when the splash goes away. */}
      {showChildren ? children : null}
      {!isAnimationComplete && (
      <Animated.View style={[
        styles.splashScreen, 
        { 
          backgroundColor: colors.background,
          opacity: opacityAnim,
        }
      ]}>
        <View style={styles.content}>
          <Animated.View style={{ 
            opacity: logoOpacity,
            transform: [{ scale: logoScale }] 
          }}>
            <Image 
              source={require('@/assets/images/MySawari_nobg.png')} 
              style={[styles.logoImage, isDarkMode && { tintColor: '#FFFFFF' }]} 
              resizeMode="contain"
            />
          </Animated.View>
          
          <Animated.View style={{ 
            opacity: titleOpacity,
            transform: [{ translateY: titleTranslateY }],
            marginTop: 4
          }}>
            <Text style={[styles.titleText, { color: colors.foreground }]}>MySawari</Text>
          </Animated.View>

          <Animated.View style={{ 
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
            marginTop: 6
          }}>
            <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Your ride, your way.</Text>
          </Animated.View>
        </View>
      </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  splashScreen: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 220,
    height: 110,
    marginBottom: 0,
  },
  titleText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 32,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    letterSpacing: 0.3,
  }
});
