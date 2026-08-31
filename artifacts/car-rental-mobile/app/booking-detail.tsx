import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export default function BookingDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectedCar, mode, pickup } = useSawari();
  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={[styles.circle, { borderColor: colors.border }]}><Feather name="arrow-left" size={17} color={colors.foreground} /></Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Payment</Text>
        </View>
        <View style={[styles.referenceCard, { backgroundColor: colors.card }]}>
          <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>Booking ID</Text>
          <Text style={[styles.reference, { color: colors.foreground }]}>MS-20260817-001</Text>
          <View style={styles.status}><View style={[styles.statusDot, { backgroundColor: colors.blue }]} /><Text style={[styles.statusText, { color: colors.foreground }]}>Upcoming</Text></View>
        </View>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>VEHICLE</Text>
        <View style={[styles.vehicleCard, { backgroundColor: colors.card }]}>
          <Image source={selectedCar.image} resizeMode="cover" style={styles.hero} />
          <Text style={[styles.vehicleName, { color: colors.foreground }]}>{selectedCar.name}</Text>
          <Text style={[styles.vehicleMeta, { color: colors.mutedForeground }]}>{selectedCar.seats} · {selectedCar.fuel} · {selectedCar.transmission}</Text>
          <Text style={[styles.vehicleMeta, { color: colors.mutedForeground }]}>Unlimited km</Text>
        </View>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TRIP</Text>
        <View style={styles.tripBoxes}>
          <View style={[styles.tripBox, { backgroundColor: colors.card }]}><Text style={[styles.boxLabel, { color: colors.mutedForeground }]}>PICKUP</Text><Text style={[styles.boxValue, { color: colors.foreground }]}>{pickup}</Text><Text style={[styles.boxMeta, { color: colors.mutedForeground }]}>17 Aug · 10:00 AM</Text></View>
          <View style={[styles.tripBox, { backgroundColor: colors.card }]}><Text style={[styles.boxLabel, { color: colors.mutedForeground }]}>RETURN</Text><Text style={[styles.boxValue, { color: colors.foreground }]}>{pickup}</Text><Text style={[styles.boxMeta, { color: colors.mutedForeground }]}>20 Aug · 10:00 AM</Text></View>
        </View>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CUSTOMER</Text>
        <View style={[styles.customerCard, { backgroundColor: colors.card }]}>
          <CustomerRow label="Full name" value="Jatin Prajapat" />
          <CustomerRow label="Mobile" value="1234565433" />
          <CustomerRow label="Email" value="jatinprajapat682@gmail.com" />
          <CustomerRow label="Driving licence" value="23456543456y65434" />
        </View>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DRIVING OPTION</Text>
        <View style={[styles.driveCard, { backgroundColor: colors.card }]}>
          <Feather name="disc" size={17} color={colors.foreground} />
          <View><Text style={[styles.driveName, { color: colors.foreground }]}>{mode}</Text><Text style={[styles.driveMeta, { color: colors.mutedForeground }]}>You drive · no driver charges</Text></View>
        </View>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PAYMENT</Text>
        <View style={[styles.paymentCard, { backgroundColor: colors.card }]}>
          <CustomerRow label="Rental (3 days)" value="₹7,500" />
          <CustomerRow label="Additional charges" value="₹500" />
          <CustomerRow label="Discount" value="-₹300" accent />
          <CustomerRow label="Paid today" value="₹7,700" strong />
          <CustomerRow label="Security deposit (at pickup)" value="₹2,000" />
        </View>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RENTAL INFORMATION</Text>
        <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
          <Text style={[styles.infoText, { color: colors.mutedForeground }]}>Free cancellation until 24h before pickup. Unlimited kilometres. Carry your original driving licence and a valid ID at pickup.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

function CustomerRow({ label, value, accent = false, strong = false }: { label: string; value: string; accent?: boolean; strong?: boolean }) {
  const colors = useColors();
  return <View style={styles.customerRow}><Text style={[styles.customerLabel, { color: colors.mutedForeground }]}>{label}</Text><Text style={[strong ? styles.customerStrong : styles.customerValue, { color: accent ? colors.blue : colors.foreground }]}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 35, paddingHorizontal: 30, paddingTop: 16 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 13 },
  circle: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 36, justifyContent: 'center', width: 36 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  referenceCard: { borderRadius: 15, flexDirection: 'row', marginTop: 20, padding: 13 },
  smallLabel: { fontFamily: 'Inter_400Regular', fontSize: 9, flex: 1 },
  reference: { fontFamily: 'Inter_600SemiBold', fontSize: 10, marginRight: 12 },
  status: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  statusDot: { borderRadius: 99, height: 6, width: 6 },
  statusText: { fontFamily: 'Inter_400Regular', fontSize: 9 },
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 0.8, marginTop: 23 },
  vehicleCard: { borderRadius: 15, marginTop: 10, overflow: 'hidden', paddingBottom: 13 },
  hero: { height: 145, width: '100%' },
  vehicleName: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginLeft: 13, marginTop: 12 },
  vehicleMeta: { fontFamily: 'Inter_400Regular', fontSize: 10, marginLeft: 13, marginTop: 5 },
  tripBoxes: { flexDirection: 'row', gap: 8, marginTop: 10 },
  tripBox: { borderRadius: 13, flex: 1, padding: 12 },
  boxLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 8 },
  boxValue: { fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 9 },
  boxMeta: { fontFamily: 'Inter_400Regular', fontSize: 8, marginTop: 3 },
  customerCard: { borderRadius: 14, marginTop: 10, paddingHorizontal: 13 },
  customerRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 34 },
  customerLabel: { fontFamily: 'Inter_400Regular', fontSize: 9 },
  customerValue: { fontFamily: 'Inter_400Regular', fontSize: 9 },
  customerStrong: { fontFamily: 'Inter_600SemiBold', fontSize: 11 },
  driveCard: { alignItems: 'center', borderRadius: 14, flexDirection: 'row', gap: 13, marginTop: 10, padding: 13 },
  driveName: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  driveMeta: { fontFamily: 'Inter_400Regular', fontSize: 9, marginTop: 3 },
  paymentCard: { borderRadius: 14, marginTop: 10, padding: 13 },
  infoBox: { borderRadius: 14, marginTop: 10, padding: 13 },
  infoText: { fontFamily: 'Inter_400Regular', fontSize: 9, lineHeight: 15 },
});