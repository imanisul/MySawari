import React from 'react';
import { Alert, Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { SOCIAL_LINKS, SocialLink } from '@/constants/social';

const ICON_SIZE = 16;

/** Row of MySawari's social accounts as small logos. Tapping one opens that account (in its app if installed). */
export function SocialLinks() {
  const colors = useColors();
  const links = SOCIAL_LINKS.filter((l) => !!l.url);
  if (links.length === 0) return null;

  const open = async (link: SocialLink) => {
    Haptics.selectionAsync();
    try {
      await Linking.openURL(link.url);
    } catch (e) {
      Alert.alert(`Could not open ${link.label}`, 'Please check your connection and try again.');
    }
  };

  return (
    <View style={styles.row}>
      {links.map((link) => (
        <Pressable
          key={link.id}
          accessibilityRole="link"
          accessibilityLabel={`Follow MySawari on ${link.label}`}
          onPress={() => open(link)}
          style={({ pressed }) => [styles.tap, pressed && styles.pressed]}
        >
          <Image
            source={link.image}
            resizeMode="contain"
            style={[styles.icon, link.themed && { tintColor: colors.foreground }]}
          />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 0, marginTop: 12 },
  // Logos sit close together (about 14 px apart). Each tap area is 30 wide x 44 tall so neighbours never overlap.
  tap: { width: 30, height: 44, alignItems: 'center', justifyContent: 'center' },
  icon: { width: ICON_SIZE, height: ICON_SIZE },
  pressed: { opacity: 0.55, transform: [{ scale: 0.92 }] },
});
