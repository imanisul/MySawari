import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export default function ConfirmationScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectedCar, mode, pickup, dateRange, duration, pickupTime, returnTime } = useSawari();
  const payToday = selectedCar.perDay * 3 + (mode === 'With Driver' ? 2400 : 500) - 300;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
          <Feather name="check" size={30} color={colors.primaryForeground} />
        </View>
        <Text style={[styles.title, { color: colors.foreground }]}>You&apos;re all set</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your {selectedCar.name} is booked. Details sent to your phone.
        </Text>
        <View style={[styles.confirmationCard, { backgroundColor: colors.card }]}>
          <View style={styles.referenceRow}>
            <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Booking reference</Text>
            <Text style={[styles.reference, { color: colors.foreground }]}>MS-26816</Text>
          </View>
          <View style={[styles.carRow, { borderTopColor: colors.border }]}>
            <Image source={selectedCar.image} resizeMode="cover" style={styles.carImage} />
            <View>
              <Text style={[styles.carName, { color: colors.foreground }]}>{selectedCar.name}</Text>
              <Text style={[styles.carMode, { color: colors.mutedForeground }]}>{mode}</Text>
            </View>
          </View>
          <InfoRow icon="map-pin" value={pickup} />
          <InfoRow icon="calendar" value={`${dateRange} · ${duration}`} />
          <InfoRow icon="clock" value={`${pickupTime} – ${returnTime}`} />
          <View style={[styles.paidRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.paidLabel, { color: colors.foreground }]}>Paid today</Text>
            <Text style={[styles.paidValue, { color: colors.foreground }]}>₹{payToday.toLocaleString('en-IN')}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <Pressable onPress={() => router.replace('/')} style={[styles.homeButton, { borderColor: colors.foreground }]}>
            <Text style={[styles.actionText, { color: colors.foreground }]}>Back to home</Text>
          </Pressable>
          <Pressable onPress={() => router.replace('/bookings')} style={[styles.bookingsButton, { backgroundColor: colors.primary }]}>
            <Text style={[styles.actionText, { color: colors.primaryForeground }]}>View my bookings</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function InfoRow({ icon, value }: { icon: React.ComponentProps<typeof Feather>['name']; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={13} color={colors.mutedForeground} />
      <Text style={[styles.infoText, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { alignItems: 'center', paddingHorizontal: 41, paddingTop: 55 },
  checkCircle: { alignItems: 'center', borderRadius: 99, height: 76, justifyContent: 'center', width: 76 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 29, letterSpacing: -0.8, marginTop: 26 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 20, marginTop: 10, textAlign: 'center' },
  confirmationCard: { borderRadius: 22, marginTop: 29, paddingHorizontal: 18, paddingVertical: 16, width: '100%' },
  referenceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  reference: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  carRow: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', marginTop: 17, paddingTop: 16 },
  carImage: { borderRadius: 12, height: 62, width: 76 },
  carName: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginLeft: 14 },
  carMode: { fontFamily: 'Inter_400Regular', fontSize: 11, marginLeft: 14, marginTop: 5 },
  infoRow: { alignItems: 'center', flexDirection: 'row', gap: 9, marginTop: 14 },
  infoText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  paidRow: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 16, paddingTop: 16 },
  paidLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  paidValue: { fontFamily: 'Inter_600SemiBold', fontSize: 17 },
  actions: { flexDirection: 'row', gap: 12, marginTop: 120, width: '100%' },
  homeButton: { alignItems: 'center', borderRadius: 16, borderWidth: 1, flex: 1, height: 54, justifyContent: 'center' },
  bookingsButton: { alignItems: 'center', borderRadius: 16, flex: 1, height: 54, justifyContent: 'center' },
  actionText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
});