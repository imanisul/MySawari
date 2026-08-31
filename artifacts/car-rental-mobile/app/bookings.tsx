import React, { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { BottomNavigation } from '@/components/sawari';

type BookingTab = 'Upcoming' | 'Active' | 'Completed';

export default function BookingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { selectedCar, bookingConfirmed, bookingStatus, setBookingStatus } = useSawari();
  const [tab, setTab] = useState<BookingTab>(bookingStatus === 'active' ? 'Active' : 'Upcoming');
  const tabs: BookingTab[] = ['Upcoming', 'Active', 'Completed'];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.foreground }]}>Your booking</Text>
        <View style={[styles.tabs, { borderBottomColor: colors.border }]}>
          {tabs.map((item) => (
            <Pressable key={item} onPress={() => setTab(item)} style={styles.tab}>
              <Text style={[styles.tabText, { color: tab === item ? colors.foreground : colors.mutedForeground }]}>{item}</Text>
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
                <Text style={[styles.activeMeta, { color: colors.mutedForeground }]}>{bookingStatus === 'active' ? 'With Driver · Jaipur' : 'Self Drive · Bikaner'}</Text>
                <Text style={[styles.activeMeta, { color: colors.mutedForeground }]}>Return · 18 Aug · 09:00 AM</Text>
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
              <Text style={[styles.upcomingMeta, { color: colors.mutedForeground }]}>{selectedCar.seats} · {dateCopy()}</Text>
              <Text style={[styles.upcomingPaid, { color: colors.foreground }]}>₹7,700 paid</Text>
            </View>
          </Pressable>
        ) : (
          <EmptyState title="No upcoming trips" copy="Your next adventure is only a search away." />
        )}
        {bookingConfirmed && tab === 'Upcoming' && (
          <Pressable onPress={() => { setBookingStatus('active'); setTab('Active'); }} style={styles.demoLink}>
            <Text style={[styles.demoText, { color: colors.blue }]}>View active rental state</Text>
          </Pressable>
        )}
      </View>
      <BottomNavigation />
    </View>
  );
}

function dateCopy() {
  return '17 Aug – 20 Aug';
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
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 27 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  tabs: { flexDirection: 'row', gap: 25, marginTop: 18, borderBottomWidth: 1 },
  tab: { paddingBottom: 10, position: 'relative' },
  tabText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  tabUnderline: { bottom: -1, height: 1, left: 0, position: 'absolute', right: 0 },
  upcomingCard: { borderRadius: 16, flexDirection: 'row', marginTop: 14, padding: 10 },
  upcomingImage: { borderRadius: 11, height: 74, width: 74 },
  upcomingCopy: { flex: 1, marginLeft: 11 },
  upcomingTitleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  upcomingName: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  upcomingStatus: { alignItems: 'center', flexDirection: 'row', gap: 5 },
  upcomingStatusText: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  upcomingMeta: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 6 },
  upcomingPaid: { fontFamily: 'Inter_600SemiBold', fontSize: 10, marginTop: 4 },
  activeCard: { borderRadius: 18, marginTop: 16, padding: 13 },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  statusDot: { borderRadius: 99, height: 7, width: 7 },
  statusText: { fontFamily: 'Inter_500Medium', fontSize: 10 },
  activeCarRow: { alignItems: 'center', flexDirection: 'row', marginTop: 12 },
  activeImage: { borderRadius: 10, height: 62, width: 78 },
  activeCopy: { marginLeft: 11 },
  activeName: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  activeMeta: { fontFamily: 'Inter_400Regular', fontSize: 10, marginTop: 4 },
  rentalButton: { alignItems: 'center', borderRadius: 14, height: 44, justifyContent: 'center', marginTop: 13 },
  rentalText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  emptyCard: { alignItems: 'center', borderRadius: 18, marginTop: 22, padding: 24 },
  emptyIcon: { alignItems: 'center', borderRadius: 99, height: 50, justifyContent: 'center', width: 50 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 17, marginTop: 16 },
  emptyCopy: { fontFamily: 'Inter_400Regular', fontSize: 13, lineHeight: 19, marginTop: 7, textAlign: 'center' },
  browseButton: { borderRadius: 13, marginTop: 20, paddingHorizontal: 22, paddingVertical: 13 },
  browseText: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  demoLink: { alignItems: 'center', marginTop: 18 },
  demoText: { fontFamily: 'Inter_400Regular', fontSize: 11 },
});