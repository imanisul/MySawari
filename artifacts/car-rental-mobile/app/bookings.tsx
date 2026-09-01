import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { BottomNavigation } from '@/components';

type BookingTab = 'Upcoming' | 'Active' | 'Completed';

export default function BookingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectedCar, dateRange, pickup, mode, bookingConfirmed, bookingStatus, setBookingStatus } = useSawari();
  const [tab, setTab] = useState<BookingTab>(bookingStatus === 'active' ? 'Active' : 'Upcoming');
  const tabs: BookingTab[] = ['Upcoming', 'Active', 'Completed'];

  const total = selectedCar.perDay * 3 + (mode === 'With Driver' ? 2400 : 500) - 300;

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Your booking</Text>
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          {tabs.map((item) => (
            <Pressable key={item} onPress={() => setTab(item)} style={styles.tab}>
              <Text style={[styles.tabText, { color: tab === item ? colors.foreground : colors.mutedForeground, fontFamily: tab === item ? 'Inter_500Medium' : 'Inter_400Regular' }]}>{item}</Text>
              {tab === item && <View style={[styles.tabUnderline, { backgroundColor: colors.foreground }]} />}
            </Pressable>
          ))}
        </View>
        {tab === 'Active' ? (
          <Pressable style={[styles.activeCard, { backgroundColor: colors.navy }]} onPress={() => router.push('/booking-detail')}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.statusText, { color: colors.primary }]}>Your rental is active</Text>
            </View>
            <View style={styles.activeCarRow}>
              <Image source={selectedCar.image} resizeMode="cover" style={styles.activeImage} />
              <View style={styles.activeCopy}>
                <Text style={[styles.activeName, { color: colors.warmWhite }]}>{selectedCar.name}</Text>
                <View style={styles.activeMetaRow}>
                  <Feather name={mode === 'With Driver' ? 'user' : 'aperture'} size={13} color={colors.mutedForeground} />
                  <Text style={[styles.activeMeta, { color: colors.mutedForeground }]}>{mode} · {pickup}</Text>
                </View>
                <Text style={[styles.activeMeta, { color: colors.mutedForeground, marginTop: 4 }]}>Return · 18 Aug · 09:00 AM</Text>
              </View>
            </View>
            <View style={[styles.rentalButton, { backgroundColor: colors.primary }]}>
              <Text style={[styles.rentalText, { color: colors.primaryForeground }]}>View Rental</Text>
            </View>
          </Pressable>
        ) : tab === 'Completed' ? (
          <EmptyState title="No completed trips" copy="Your finished rentals will appear here." />
        ) : bookingConfirmed ? (
          <Pressable
            accessibilityRole="button"
            testID="upcoming-booking"
            onPress={() => router.push('/booking-detail')}
            style={[styles.upcomingCard, { backgroundColor: colors.card }]}
          >
            <Image source={selectedCar.image} resizeMode="cover" style={styles.upcomingImage} />
            <View style={styles.upcomingCopy}>
              <View style={styles.upcomingTitleRow}>
                <Text style={[styles.upcomingName, { color: colors.foreground }]}>{selectedCar.name}</Text>
                <View style={styles.upcomingStatus}>
                  <View style={[styles.statusDot, { backgroundColor: colors.blue }]} />
                  <Text style={[styles.upcomingStatusText, { color: colors.foreground }]}>Upcoming</Text>
                </View>
              </View>
              <View style={styles.upcomingMetaRow}>
                <Feather name="calendar" size={13} color={colors.mutedForeground} />
                <Text style={[styles.upcomingMeta, { color: colors.mutedForeground }]}>{dateRange}</Text>
              </View>
              <View style={styles.upcomingMetaRow}>
                <Feather name="aperture" size={13} color={colors.mutedForeground} />
                <Text style={[styles.upcomingMeta, { color: colors.mutedForeground }]}>{pickup} · {mode}</Text>
              </View>
              <Text style={styles.upcomingPaidRow}>
                <Text style={[styles.upcomingPaidAmount, { color: colors.foreground }]}>₹{total.toLocaleString('en-IN')}</Text>
                <Text style={[styles.upcomingPaidText, { color: colors.mutedForeground }]}> paid</Text>
              </Text>
            </View>
          </Pressable>
        ) : (
          <EmptyState title="No upcoming trips" copy="Your next adventure is only a search away." />
        )}
      </View>
      <BottomNavigation />
    </View>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  const colors = useColors();
  const router = useRouter();
  return (
    <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.lightBlue }]}>
        <Feather name="map" size={22} color={colors.blue} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>{copy}</Text>
      <Pressable onPress={() => router.push('/planner')} style={[styles.browseButton, { backgroundColor: colors.primary }]}>
        <Text style={[styles.browseText, { color: colors.primaryForeground }]}>Find a car</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 22 },
  tabs: { flexDirection: 'row', gap: 24, marginTop: 24, borderBottomWidth: 1 },
  tab: { paddingBottom: 12, position: 'relative' },
  tabText: { fontSize: 14 },
  tabUnderline: { bottom: -1, height: 2, left: 0, position: 'absolute', right: 0 },
  upcomingCard: { borderRadius: 20, flexDirection: 'row', marginTop: 20, padding: 16 },
  upcomingImage: { borderRadius: 12, height: 86, width: 86 },
  upcomingCopy: { flex: 1, marginLeft: 16 },
  upcomingTitleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  upcomingName: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  upcomingStatus: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  upcomingStatusText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  upcomingMetaRow: { alignItems: 'center', flexDirection: 'row', gap: 8, marginTop: 6 },
  upcomingMeta: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  upcomingPaidRow: { marginTop: 10 },
  upcomingPaidAmount: { fontFamily: 'Inter_700Bold', fontSize: 14 },
  upcomingPaidText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  activeCard: { borderRadius: 20, marginTop: 20, padding: 16 },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  statusDot: { borderRadius: 99, height: 8, width: 8 },
  statusText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  activeCarRow: { alignItems: 'center', flexDirection: 'row', marginTop: 16 },
  activeImage: { borderRadius: 12, height: 76, width: 76 },
  activeCopy: { marginLeft: 16 },
  activeName: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  activeMetaRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 8 },
  activeMeta: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  rentalButton: { alignItems: 'center', borderRadius: 14, height: 48, justifyContent: 'center', marginTop: 20 },
  rentalText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  emptyCard: { alignItems: 'center', borderRadius: 20, marginTop: 24, padding: 32 },
  emptyIcon: { alignItems: 'center', borderRadius: 99, height: 56, justifyContent: 'center', width: 56 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, marginTop: 20 },
  emptyCopy: { fontFamily: 'Inter_400Regular', fontSize: 14, lineHeight: 22, marginTop: 8, textAlign: 'center' },
  browseButton: { borderRadius: 14, marginTop: 24, paddingHorizontal: 24, paddingVertical: 14 },
  browseText: { fontFamily: 'Inter_600SemiBold', fontSize: 14 },
});