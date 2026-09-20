import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Image } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export function AnimatedSplash({ isReady, children }: { isReady: boolean, children: React.ReactNode }) {
  const colors = useColors();
  const { isDarkMode } = useSawari();
  
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
    if (isReady) {
      // Small delay so the user can see the text if it loaded too fast
      setTimeout(() => {
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          setIsAnimationComplete(true);
        });
      }, 1500); // Hold for 1.5s so they can admire it!
    }
  }, [isReady]);

  if (isAnimationComplete) {
    return <>{children}</>;
  }

  return (
    <View style={styles.container}>
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
