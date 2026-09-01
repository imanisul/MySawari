import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { SheetFrame } from '@/components';

export default function PaymentErrorScreen() {
  const colors = useColors();
  const router = useRouter();
  return (
      <SheetFrame centered height={400}>
      <Feather name="alert-triangle" size={24} color={colors.destructive} style={styles.alertIcon} />
      <Text style={[styles.title, { color: colors.foreground }]}>Payment didn’t go through</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>No money was charged to your booking.</Text>
      <Pressable onPress={() => router.replace('/payment')} style={[styles.tryButton, { backgroundColor: colors.primary }]}>
        <Text style={[styles.buttonText, { color: colors.primaryForeground }]}>Try again</Text>
      </Pressable>
      <Pressable onPress={() => router.replace('/payment')} style={[styles.otherButton, { borderColor: colors.border }]}>
        <Text style={[styles.buttonText, { color: colors.foreground }]}>use another method</Text>
      </Pressable>
      <Pressable onPress={() => router.back()} style={styles.helpButton}>
        <Feather name="help-circle" size={15} color={colors.blue} />
        <Text style={[styles.helpText, { color: colors.blue }]}>Need help? Contact support</Text>
      </Pressable>
    </SheetFrame>
  );
}

const styles = StyleSheet.create({
  alertIcon: { alignSelf: 'center', backgroundColor: '#FBEAEA', borderRadius: 99, padding: 20 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 22, marginTop: 24, textAlign: 'center' },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 10, textAlign: 'center' },
  tryButton: { alignItems: 'center', borderRadius: 16, height: 56, justifyContent: 'center', marginTop: 28, width: '100%' },
  otherButton: { alignItems: 'center', borderRadius: 16, borderWidth: 1, height: 56, justifyContent: 'center', marginTop: 16, width: '100%' },
  buttonText: { fontFamily: 'Inter_500Medium', fontSize: 16 },
  helpButton: { alignItems: 'center', flexDirection: 'row', gap: 6, justifyContent: 'center', marginTop: 24 },
  helpText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
});