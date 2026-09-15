import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, Image, Animated, Easing } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export function Header({
  title = 'My Sawari',
  back = false,
  hideLogo = false,
}: {
  title?: string;
  back?: boolean;
  hideLogo?: boolean;
}) {
  const colors = useColors();
  const router = useRouter();
  const { unreadCount, sawariCash, isAuthenticated } = useSawari();

  const flipAnim = useRef(new Animated.Value(0)).current;
  const [showRupee, setShowRupee] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(flipAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setShowRupee(prev => !prev);
        Animated.timing(flipAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [flipAnim]);

  const rotateX = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '90deg']
  });

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        testID={back ? 'back-button' : 'brand-home'}
        onPress={() => {
          Haptics.selectionAsync();
          if (back) router.back();
          else router.replace('/');
        }}
        style={styles.headerTitleWrap}
      >
        {back ? (
          <Feather name="arrow-left" size={21} color={colors.foreground} />
        ) : !hideLogo ? (
          <Image 
            source={require('../../assets/images/MySawari_nobg.png')} 
            style={styles.logo} 
            resizeMode="contain" 
          />
        ) : null}
        <Text style={[styles.appName, { color: colors.foreground }]}>{title}</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        {/* SawariCash Badge */}
        {!hideLogo && isAuthenticated && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="SawariCash Wallet"
            onPress={() => {
              Haptics.selectionAsync();
              router.push('/rewards');
            }}
            style={[
              styles.cashBadge,
              { backgroundColor: colors.card, borderColor: colors.border }
            ]}
          >
            <Animated.View style={{ transform: [{ rotateX }], width: 16, alignItems: 'center' }}>
              {showRupee ? (
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 14, color: colors.success, marginTop: -1 }}>₹</Text>
              ) : (
                <FontAwesome5 name="coins" size={14} color="#FFD700" />
              )}
            </Animated.View>
            <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: colors.foreground }}>
              {sawariCash}
            </Text>
          </Pressable>
        )}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          testID="notifications"
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/notifications');
          }}
          style={[
            styles.notificationButton,
            { backgroundColor: colors.card, borderColor: colors.border }
          ]}
        >
          <Feather name="bell" size={17} color={colors.foreground} />
          {unreadCount > 0 && (
            <View style={[styles.badge, { borderColor: colors.card }]}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitleWrap: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  logo: { width: 32, height: 32, borderRadius: 8 },
  appName: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.5 },
  notificationButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 44,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    width: 44,
  },
  cashBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#E53935',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_700Bold',
  },
  pressed: { opacity: 0.65 },
});
