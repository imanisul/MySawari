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
        <Text style={[styles.title, { color: colors.foreground }]}>You're all set</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Your {selectedCar.name} is booked. Details sent to your phone.
        </Text>
        <View style={[styles.confirmationCard, { backgroundColor: colors.card }]}>
          <View style={styles.referenceRow}>
            <Text style={[styles.cardLabel, { color: colors.mutedForeground }]}>Booking reference</Text>
            <Text style={[styles.reference, { color: colors.foreground }]}>MS-6816</Text>
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
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => router.replace('/')} style={[styles.homeButton, { borderColor: colors.border }]}>
          <Text style={[styles.actionText, { color: colors.foreground }]}>Back to home</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/bookings')} style={[styles.bookingsButton, { backgroundColor: colors.primary }]}>
          <Text style={[styles.actionText, { color: colors.primaryForeground }]}>View my bookings</Text>
        </Pressable>
      </View>
    </View>
  );
}

function InfoRow({ icon, value }: { icon: React.ComponentProps<typeof Feather>['name']; value: string }) {
  const colors = useColors();
  return (
    <View style={styles.infoRow}>
      <Feather name={icon} size={15} color={colors.mutedForeground} />
      <Text style={[styles.infoText, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 60, flex: 1 },
  checkCircle: { alignItems: 'center', borderRadius: 99, height: 86, justifyContent: 'center', width: 86 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 26, letterSpacing: -0.5, marginTop: 24 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 15, lineHeight: 22, marginTop: 12, textAlign: 'center', paddingHorizontal: 20 },
  confirmationCard: { borderRadius: 24, marginTop: 32, paddingHorizontal: 20, paddingVertical: 20, width: '100%' },
  referenceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardLabel: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  reference: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  carRow: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', marginTop: 16, paddingTop: 16 },
  carImage: { borderRadius: 12, height: 60, width: 72 },
  carName: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginLeft: 16 },
  carMode: { fontFamily: 'Inter_400Regular', fontSize: 13, marginLeft: 16, marginTop: 4 },
  infoRow: { alignItems: 'center', flexDirection: 'row', gap: 12, marginTop: 16 },
  infoText: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  paidRow: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 20, paddingTop: 20 },
  paidLabel: { fontFamily: 'Inter_500Medium', fontSize: 15 },
  paidValue: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.5 },
  actions: { flexDirection: 'row', gap: 16, paddingHorizontal: 24, paddingBottom: 40, width: '100%' },
  homeButton: { alignItems: 'center', borderRadius: 16, borderWidth: 1, flex: 1, height: 56, justifyContent: 'center' },
  bookingsButton: { alignItems: 'center', borderRadius: 16, flex: 1, height: 56, justifyContent: 'center' },
  actionText: { fontFamily: 'Inter_500Medium', fontSize: 15 },
});