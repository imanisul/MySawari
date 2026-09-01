import React from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export default function BookingDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectedCar, dateRange, durationDays, pickup, mode, pickupTime, returnTime, customer } = useSawari();

  const days = durationDays || 1;
  const total = selectedCar.perDay * days + (mode === 'With Driver' ? 2400 : 500) - 300;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={[styles.circle, { borderColor: colors.border }]}><Feather name="chevron-left" size={20} color={colors.foreground} /></Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Payment</Text>
        </View>
        <View style={[styles.referenceCard, { backgroundColor: colors.card }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.smallLabel, { color: colors.mutedForeground }]}>Booking ID</Text>
            <Text style={[styles.reference, { color: colors.foreground }]}>MS-20260817-001</Text>
          </View>
          <View style={styles.status}><View style={[styles.statusDot, { backgroundColor: colors.blue }]} /><Text style={[styles.statusText, { color: colors.foreground }]}>Upcoming</Text></View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>VEHICLE</Text>
        <View style={[styles.vehicleCard, { backgroundColor: colors.card }]}>
          <Image source={selectedCar.image} resizeMode="cover" style={styles.hero} />
          <View style={styles.vehicleBody}>
            <Text style={[styles.vehicleName, { color: colors.foreground }]}>{selectedCar.name}</Text>
            <View style={styles.vehicleMetaRow}>
              <View style={styles.metaItem}><Feather name="users" size={13} color={colors.mutedForeground} /><Text style={[styles.metaText, { color: colors.mutedForeground }]}>{selectedCar.seats}</Text></View>
              <View style={styles.metaItem}><Feather name="droplet" size={13} color={colors.mutedForeground} /><Text style={[styles.metaText, { color: colors.mutedForeground }]}>{selectedCar.fuel}</Text></View>
              <View style={styles.metaItem}><Feather name="aperture" size={13} color={colors.mutedForeground} /><Text style={[styles.metaText, { color: colors.mutedForeground }]}>{selectedCar.transmission}</Text></View>
            </View>
            <View style={[styles.metaItem, { marginTop: 8 }]}><Feather name="refresh-cw" size={13} color={colors.mutedForeground} /><Text style={[styles.metaText, { color: colors.mutedForeground }]}>Unlimited km</Text></View>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TRIP</Text>
        <View style={styles.tripBoxes}>
          <View style={[styles.tripBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.boxLabel, { color: colors.mutedForeground }]}>PICKUP</Text>
            <Text style={[styles.boxValue, { color: colors.foreground }]}>{pickup}</Text>
            <Text style={[styles.boxMeta, { color: colors.mutedForeground }]}>{dateRange.split('–')[0]?.trim() || '17 Aug'} · {pickupTime}</Text>
          </View>
          <View style={[styles.tripBox, { backgroundColor: colors.card }]}>
            <Text style={[styles.boxLabel, { color: colors.mutedForeground }]}>RETURN</Text>
            <Text style={[styles.boxValue, { color: colors.foreground }]}>{pickup}</Text>
            <Text style={[styles.boxMeta, { color: colors.mutedForeground }]}>{dateRange.split('–')[1]?.trim() || '20 Aug'} · {returnTime}</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CUSTOMER</Text>
        <View style={[styles.customerCard, { backgroundColor: colors.card }]}>
          <CustomerRow icon="user" label="Full name" value={customer.name} border />
          <CustomerRow icon="smartphone" label="Mobile" value={customer.mobile} border />
          <CustomerRow icon="mail" label="Email" value={customer.email} border />
          <CustomerRow icon="shield" label="Driving licence" value={customer.license} />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DRIVING OPTION</Text>
        <View style={[styles.driveCard, { backgroundColor: colors.card }]}>
          <View style={[styles.driveIcon, { backgroundColor: colors.primary }]}>
            <Feather name="aperture" size={20} color={colors.foreground} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.driveName, { color: colors.foreground }]}>{mode}</Text>
            <Text style={[styles.driveMeta, { color: colors.mutedForeground }]}>You drive · no driver charges</Text>
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PAYMENT</Text>
        <View style={[styles.paymentCard, { backgroundColor: colors.card }]}>
          <PaymentRow label={`Rental (${days} days)`} value={`₹${(selectedCar.perDay * days).toLocaleString('en-IN')}`} />
          <PaymentRow label="Additional charges" value={`₹${mode === 'With Driver' ? '2,400' : '500'}`} />
          <PaymentRow label="Discount" value="-₹300" accent />
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <PaymentRow label="Paid today" value={`₹${total.toLocaleString('en-IN')}`} strong />
          <PaymentRow label="Security deposit (at pickup)" value="₹2,000" mutedValue />
        </View>

        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RENTAL INFORMATION</Text>
        <View style={[styles.infoBox, { backgroundColor: colors.card }]}>
          <Feather name="info" size={16} color={colors.mutedForeground} style={{ marginTop: 2 }} />
          <Text style={[styles.infoText, { color: colors.mutedForeground, flex: 1 }]}>
            Free cancellation until 24h before pickup. Unlimited kilometres. Carry your original driving licence and a valid ID at pickup. Deposit refunded within 3 days of return.
          </Text>
        </View>

        <Pressable style={styles.helpLink}>
          <Feather name="help-circle" size={16} color={colors.blue} />
          <Text style={[styles.helpText, { color: colors.blue }]}>Need help with this booking?</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function CustomerRow({ icon, label, value, border = false }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; value: string; border?: boolean }) {
  const colors = useColors();
  return (
    <View style={[styles.customerRow, border && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
      <Feather name={icon} size={18} color={colors.mutedForeground} />
      <View style={styles.customerCopy}>
        <Text style={[styles.customerLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[styles.customerValue, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

function PaymentRow({ label, value, accent = false, strong = false, mutedValue = false }: { label: string; value: string; accent?: boolean; strong?: boolean; mutedValue?: boolean }) {
  const colors = useColors();
  return (
    <View style={styles.paymentRow}>
      <Text style={[strong ? styles.paymentLabelStrong : styles.paymentLabel, { color: strong ? colors.foreground : colors.mutedForeground }]}>{label}</Text>
      <Text style={[strong ? styles.paymentValueStrong : styles.paymentValue, { color: accent ? colors.success : (mutedValue ? colors.mutedForeground : colors.foreground) }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingBottom: 60, paddingHorizontal: 24, paddingTop: 16 },
  topBar: { alignItems: 'center', flexDirection: 'row', gap: 16 },
  circle: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 42, justifyContent: 'center', width: 42 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 20 },
  referenceCard: { borderRadius: 16, flexDirection: 'row', alignItems: 'center', marginTop: 24, padding: 16 },
  smallLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  reference: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginTop: 4 },
  status: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  statusDot: { borderRadius: 99, height: 8, width: 8 },
  statusText: { fontFamily: 'Inter_500Medium', fontSize: 13 },
  sectionLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 11, letterSpacing: 0.5, marginTop: 32, marginBottom: 12 },
  vehicleCard: { borderRadius: 20, overflow: 'hidden' },
  hero: { height: 160, width: '100%' },
  vehicleBody: { padding: 16 },
  vehicleName: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  vehicleMetaRow: { flexDirection: 'row', gap: 16, marginTop: 8 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  tripBoxes: { flexDirection: 'row', gap: 12 },
  tripBox: { borderRadius: 16, flex: 1, padding: 16 },
  boxLabel: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  boxValue: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginTop: 6 },
  boxMeta: { fontFamily: 'Inter_400Regular', fontSize: 12, marginTop: 4 },
  customerCard: { borderRadius: 20, paddingHorizontal: 20 },
  customerRow: { alignItems: 'center', flexDirection: 'row', paddingVertical: 16, gap: 16 },
  customerCopy: { flex: 1 },
  customerLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  customerValue: { fontFamily: 'Inter_500Medium', fontSize: 14, marginTop: 2 },
  driveCard: { alignItems: 'center', borderRadius: 20, flexDirection: 'row', gap: 16, padding: 16 },
  driveIcon: { alignItems: 'center', borderRadius: 12, height: 48, justifyContent: 'center', width: 48 },
  driveName: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  driveMeta: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 2 },
  paymentCard: { borderRadius: 20, padding: 20, gap: 12 },
  paymentRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  paymentLabel: { fontFamily: 'Inter_400Regular', fontSize: 14 },
  paymentValue: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  paymentLabelStrong: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
  paymentValueStrong: { fontFamily: 'Inter_700Bold', fontSize: 15 },
  divider: { height: 1, marginVertical: 4, width: '100%' },
  infoBox: { borderRadius: 20, flexDirection: 'row', gap: 12, padding: 16 },
  infoText: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 20 },
  helpLink: { alignItems: 'center', flexDirection: 'row', gap: 8, justifyContent: 'center', marginTop: 40 },
  helpText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
});