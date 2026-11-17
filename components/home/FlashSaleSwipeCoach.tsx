import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Feather } from '@expo/vector-icons';

// shortcut: simple stand-in for the Figma 1717:15289 swipe hint so the Flash Sale screen builds; swap for the drawn one.
const KEY = '@flash_sale_swipe_coach_seen';

export async function hasSeenSwipeCoach(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(KEY)) === '1'; } catch { return true; }
}

export function markSwipeCoachSeen(): void {
  AsyncStorage.setItem(KEY, '1').catch(() => {});
}

/** One-time "swipe to see more cars" hint over the ticket (353 wide in Figma); any tap dismisses it. */
export function FlashSaleSwipeCoach({ ticketLeft, ticketTop, ticketScale, onDismiss }: {
  ticketLeft: number;
  ticketTop: number;
  ticketScale: number;
  onDismiss: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Swipe to see more cars. Tap to close." onPress={onDismiss} style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.45)' }]}>
      <View style={[styles.hint, { left: ticketLeft, top: ticketTop + 120 * ticketScale, width: 353 * ticketScale }]}>
        <Feather name="chevrons-left" size={22} color="#FFFFFF" />
        <Text style={styles.text} allowFontScaling={false}>Swipe to see more cars</Text>
        <Feather name="chevrons-right" size={22} color="#FFFFFF" />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hint: { position: 'absolute', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  text: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#FFFFFF' },
});
