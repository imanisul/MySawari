import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

export function BottomNavigation() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const items: { label: string; route: '/' | '/explore' | '/bookings'; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    { label: 'Home', route: '/', icon: 'home-outline' },
    { label: 'Explore', route: '/explore', icon: 'compass-outline' },
    { label: 'Bookings', route: '/bookings', icon: 'ticket-outline' },
  ];

  return (
    <View
      style={[
        styles.bottomNavigation,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 7),
        },
      ]}
    >
      {items.map((item) => {
        const active = item.route === '/' ? pathname === '/' : pathname.startsWith(item.route);
        const activeIcon = active ? (item.icon.replace('-outline', '') as React.ComponentProps<typeof Ionicons>['name']) : item.icon;
        return (
          <Pressable
            key={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            testID={`tab-${item.label.toLowerCase()}`}
            onPress={() => {
              Haptics.selectionAsync();
              router.push(item.route);
            }}
            style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
          >
            <Ionicons name={activeIcon} size={21} color={active ? colors.foreground : colors.mutedForeground} />
            <Text style={[styles.navLabel, { color: active ? colors.foreground : colors.mutedForeground }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNavigation: { borderTopWidth: 1, bottom: 0, flexDirection: 'row', justifyContent: 'space-around', left: 0, paddingTop: 10, position: 'absolute', right: 0 },
  navItem: { alignItems: 'center', gap: 4, minWidth: 72, paddingVertical: 2 },
  navLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  pressed: { opacity: 0.65 },
});
