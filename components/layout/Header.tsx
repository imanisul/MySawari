import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';

export function Header({
  title = 'My Sawari',
  back = false,
}: {
  title?: string;
  back?: boolean;
}) {
  const colors = useColors();
  const router = useRouter();

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
        style={({ pressed }) => [styles.headerTitleWrap, pressed && styles.pressed]}
      >
        {back && <Feather name="arrow-left" size={21} color={colors.foreground} />}
        <Text style={[styles.appName, { color: colors.foreground }]}>{title}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        testID="notifications"
        onPress={() => Haptics.selectionAsync()}
        style={({ pressed }) => [
          styles.notificationButton,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <Feather name="bell" size={17} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitleWrap: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  appName: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.5 },
  notificationButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  pressed: { opacity: 0.65 },
});
