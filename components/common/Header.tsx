import React from 'react';
import { Pressable, StyleSheet, Text, View, Image, TextStyle } from 'react-native';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useSawari } from '@/context/SawariContext';

export function Header({
  title = 'My Sawari',
  back = false,
  hideLogo = false,
  absolute = false,
  leading,
  titleStyle,
  horizontalPadding = 20,
}: {
  title?: string;
  back?: boolean;
  hideLogo?: boolean;
  absolute?: boolean;
  /** Replaces the logo + app name on the left (Home shows a personal greeting there instead). */
  leading?: React.ReactNode;
  /** Overrides the title text style for screens whose design sets its own (e.g. Explore's 24px title). */
  titleStyle?: TextStyle;
  /** Side padding of the bar; screens with a 16px gutter (Explore) pass 16. */
  horizontalPadding?: number;
}) {
  const colors = useColors();
  const router = useRouter();
  const { unreadCount, sawariCash, isAuthenticated, favorites, isDarkMode } = useSawari();

  const insets = useSafeAreaInsets();

  const content = (
    <View style={[{ paddingTop: insets.top }, !absolute ? { backgroundColor: colors.background } : undefined]}>
      <View style={[styles.header, { paddingBottom: 8, paddingHorizontal: horizontalPadding }]}>
        {leading && !back ? <View style={{ flex: 1, marginRight: 12 }}>{leading}</View> : (
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
              style={[styles.logo, isDarkMode && { tintColor: '#FFFFFF' }]} 
              resizeMode="contain" 
            />
          ) : null}
          <Text style={[styles.appName, { color: colors.foreground }, titleStyle]}>{title}</Text>
        </Pressable>
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          
          {/* Wishlist Badge - Only show if they have items */}
          {!hideLogo && favorites?.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Wishlist"
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/wishlist');
              }}
              style={[
                styles.notificationButton,
                { backgroundColor: colors.card, borderColor: colors.border }
              ]}
            >
              <Feather name="heart" size={17} color={colors.foreground} />
            </Pressable>
          )}

          {/* SawariCash Badge */}
          {!hideLogo && isAuthenticated && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="SawariCash Wallet"
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/rewards');
              }}
              style={({ pressed }) => [
                styles.cashBadge,
                isDarkMode && { backgroundColor: colors.card, borderColor: colors.border },
                pressed && styles.pressed,
              ]}
            >
              <Text style={[styles.cashText, isDarkMode && { color: colors.foreground }]}>{sawariCash}</Text>
              <FontAwesome5 name="coins" size={14} color="#F5A524" />
            </Pressable>
          )}

        </View>
      </View>
    </View>
  );

  if (absolute) {
    return (
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 100 }}>
        <BlurView intensity={isDarkMode ? 30 : 80} tint={isDarkMode ? 'dark' : 'light'}>
          {content}
        </BlurView>
      </View>
    );
  }

  return content;
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
  // SawariCash pill + bell (Figma): lavender pill with the balance then a coin stack, light grey bell.
  cashBadge: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    justifyContent: 'center',
    backgroundColor: '#EEEBFD',
    borderColor: '#C9C2F7',
  },
  cashText: { fontFamily: 'Inter_500Medium', fontSize: 15, color: '#2F3E75' },
  bellButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    backgroundColor: '#F7F7F7',
    borderColor: '#E5E5E5',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 3,
    elevation: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Inter_700Bold',
  },
  pressed: { opacity: 0.65 },
});
