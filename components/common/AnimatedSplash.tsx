import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing, Image, Dimensions } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const { width, height } = Dimensions.get('window');

export function AnimatedSplash({ children }: { children: React.ReactNode }) {
  const [isAppReady, setIsAppReady] = useState(false);
  const [isSplashAnimationComplete, setAnimationComplete] = useState(false);
  
  // Logo animations
  const logoScale = useRef(new Animated.Value(0.2)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoRotate = useRef(new Animated.Value(-10)).current;
  
  // Brand text animations
  const brandOpacity = useRef(new Animated.Value(0)).current;
  const brandTranslateY = useRef(new Animated.Value(30)).current;
  const brandScale = useRef(new Animated.Value(0.8)).current;
  
  // Tagline animations
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(20)).current;
  
  // Decorative line animation
  const lineWidth = useRef(new Animated.Value(0)).current;
  
  // Container fade out
  const containerOpacity = useRef(new Animated.Value(1)).current;
  const containerScale = useRef(new Animated.Value(1)).current;
  
  // Shimmer / glow pulse
  const glowOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const prepare = async () => {
      try {
        await SplashScreen.hideAsync();
        setIsAppReady(true);
      } catch (e) {
        console.warn(e);
      }
    };
    prepare();
  }, []);

  useEffect(() => {
    if (isAppReady) {
      Animated.sequence([
        // Phase 1: Logo bounces in with subtle rotation
        Animated.parallel([
          Animated.timing(logoOpacity, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.spring(logoScale, {
            toValue: 1,
            friction: 6,
            tension: 40,
            useNativeDriver: true,
          }),
          Animated.timing(logoRotate, {
            toValue: 0,
            duration: 700,
            easing: Easing.out(Easing.back(1.5)),
            useNativeDriver: true,
          }),
        ]),
        
        // Phase 2: Glow pulse on logo
        Animated.sequence([
          Animated.timing(glowOpacity, {
            toValue: 0.6,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(glowOpacity, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]),
        
        // Phase 3: Brand name slides up and scales in
        Animated.parallel([
          Animated.timing(brandOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.spring(brandTranslateY, {
            toValue: 0,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }),
          Animated.spring(brandScale, {
            toValue: 1,
            friction: 7,
            tension: 50,
            useNativeDriver: true,
          }),
        ]),
        
        // Phase 4: Decorative line expands + tagline fades in
        Animated.parallel([
          Animated.timing(lineWidth, {
            toValue: 1,
            duration: 400,
            easing: Easing.out(Easing.ease),
            useNativeDriver: false, // width can't use native driver
          }),
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(taglineTranslateY, {
            toValue: 0,
            duration: 500,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        
        // Phase 5: Hold for a moment
        Animated.delay(900),
        
        // Phase 6: Zoom out + fade the whole splash
        Animated.parallel([
          Animated.timing(containerOpacity, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.in(Easing.ease),
          }),
          Animated.timing(containerScale, {
            toValue: 1.15,
            duration: 500,
            useNativeDriver: true,
            easing: Easing.in(Easing.ease),
          }),
        ]),
      ]).start(() => {
        setAnimationComplete(true);
      });
    }
  }, [isAppReady]);

  const spin = logoRotate.interpolate({
    inputRange: [-10, 0],
    outputRange: ['-10deg', '0deg'],
  });

  const animatedLineWidth = lineWidth.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 60],
  });

  return (
    <View style={{ flex: 1 }}>
      {children}
      
      {!isSplashAnimationComplete && (
        <Animated.View style={[
          StyleSheet.absoluteFill,
          styles.container,
          { 
            opacity: containerOpacity,
            transform: [{ scale: containerScale }],
          }
        ]}>
          {/* Background gradient effect using layered views */}
          <View style={styles.bgLayer1} />
          <View style={styles.bgLayer2} />
          
          {/* Logo with glow */}
          <View style={styles.logoContainer}>
            {/* Glow ring behind logo */}
            <Animated.View style={[
              styles.glowRing,
              { opacity: glowOpacity }
            ]} />
            
            <Animated.View style={{
              alignItems: 'center',
              transform: [
                { scale: logoScale },
                { rotate: spin },
              ],
              opacity: logoOpacity,
            }}>
              <Image
                source={require('../../assets/images/MySawari_nobg.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </Animated.View>
          </View>
          
          {/* Brand Name */}
          <Animated.Text style={[
            styles.brandText,
            { 
              opacity: brandOpacity, 
              transform: [
                { translateY: brandTranslateY },
                { scale: brandScale },
              ] 
            }
          ]}>
            MySawari
          </Animated.Text>
          
          {/* Decorative line */}
          <View style={styles.lineContainer}>
            <Animated.View style={[
              styles.decorativeLine,
              { width: animatedLineWidth }
            ]} />
          </View>
          
          {/* Tagline */}
          <Animated.Text style={[
            styles.tagline,
            { 
              opacity: taglineOpacity, 
              transform: [{ translateY: taglineTranslateY }] 
            }
          ]}>
            Your ride, your way.
          </Animated.Text>
          
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99999,
  },
  bgLayer1: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#FAFAF9',
  },
  bgLayer2: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 213, 79, 0.06)',
    borderTopLeftRadius: height * 0.5,
    borderTopRightRadius: height * 0.5,
    top: height * 0.3,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  glowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(255, 213, 79, 0.25)',
  },
  logo: {
    width: 140,
    height: 140,
  },
  brandText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 36,
    letterSpacing: -1.5,
    color: '#1A1A2E',
    marginTop: 16,
  },
  lineContainer: {
    height: 3,
    marginTop: 14,
    marginBottom: 10,
    alignItems: 'center',
  },
  decorativeLine: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFD54F',
  },
  tagline: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    color: '#6B7280',
    letterSpacing: 0.5,
  },
  bottomBranding: {
    position: 'absolute',
    bottom: 60,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bottomText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9CA3AF',
    letterSpacing: 0.3,
  },
  bottomDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#FFD54F',
    marginHorizontal: 8,
  },
});
