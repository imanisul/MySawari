import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export function PrivacyBanner() {
  const { hasSeenPermissions, completeOnboarding } = useSawari();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // If already seen or still loading from storage, don't show
  if (hasSeenPermissions !== false) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, paddingBottom: Math.max(insets.bottom, 16) }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        We use basic activity tracking to improve your experience and offer personalized recommendations. By continuing to use MySawari, you agree to our Privacy Policy and Terms of Service.
      </Text>
      <Pressable
        style={({ pressed }) => [styles.button, { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
        onPress={() => completeOnboarding?.()}
      >
        <Text style={styles.buttonText}>I Understand</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 10,
    zIndex: 9999,
  },
  text: {
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
    textAlign: 'center',
  },
  button: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
