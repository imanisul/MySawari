import React, { useState, useEffect, useCallback } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { BottomNavigation, PrimaryButton, Page } from '@/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BookingSnapshot } from '@/services/backend/database';
import { useSawari } from '@/context/SawariContext';
import { LoginBottomSheet } from '@/components';

type BookingTab = 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';

export default function BookingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useSawari();
  const [showLogin, setShowLogin] = useState(false);
  
  const [tab, setTab] = useState<BookingTab>('Upcoming');
  const tabs: BookingTab[] = ['Upcoming', 'Active', 'Completed', 'Cancelled'];
  
  const [bookings, setBookings] = useState<BookingSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch bookings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchBookings = async () => {
        try {
          if (!isAuthenticated) return;
          const storedBookings = await AsyncStorage.getItem('@my_bookings');
          if (isActive && storedBookings) {
            setBookings(JSON.parse(storedBookings));
          }
        } catch (e) {
          console.error("Failed to load bookings", e);
        } finally {
          if (isActive) setLoading(false);
        }
      };
      fetchBookings();
      return () => { isActive = false; };
    }, [isAuthenticated])
  );

  const filteredBookings = bookings.filter((b) => {
    if (tab === 'Upcoming') return b.status === 'CONFIRMED' || b.status === 'PENDING';
    if (tab === 'Active') return b.status === 'CONFIRMED'; // Using CONFIRMED as active for now
    if (tab === 'Completed') return b.status === 'COMPLETED';
    if (tab === 'Cancelled') return b.status === 'CANCELLED' || b.status === 'FAILED';
    return false;
  });

  if (!isAuthenticated) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Feather name="calendar" size={64} color={colors.mutedForeground} style={{ marginBottom: 24 }} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, textAlign: 'center', marginBottom: 12, color: colors.foreground }}>
            Start Your Journey
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, textAlign: 'center', color: colors.mutedForeground, marginBottom: 32 }}>
            Unlock seamless bookings. Log in to reserve your Sawari and track all your upcoming trips here.
          </Text>
          <View style={{ width: '100%' }}>
            <PrimaryButton 
              label="Log In to Book Sawari" 
              icon="arrow-right"
              onPress={() => setShowLogin(true)} 
            />
          </View>
        </View>
        <LoginBottomSheet visible={showLogin} onClose={() => setShowLogin(false)} />
        <BottomNavigation />
      </View>
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingTop: Math.max(insets.top + 16, 16) }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Your bookings</Text>
        <View style={{ borderBottomColor: colors.border, borderBottomWidth: 1, marginTop: 24 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
            {tabs.map((item) => (
              <Pressable key={item} onPress={() => setTab(item)} style={styles.tab}>
                <Text style={[styles.tabText, { color: tab === item ? colors.foreground : colors.mutedForeground, fontFamily: tab === item ? 'Inter_500Medium' : 'Inter_400Regular' }]}>{item}</Text>
                {tab === item && <View style={[styles.tabUnderline, { backgroundColor: colors.foreground }]} />}
              </Pressable>
            ))}
          </ScrollView>
        </View>
        
        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 64 }} />
        ) : filteredBookings.length > 0 ? (
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: 8 }} showsVerticalScrollIndicator={false}>
            {filteredBookings.map((booking) => {
              const isActive = tab === 'Active';
              const cardBg = isActive ? colors.surfaceStrong : colors.card;
              const cardBorder = isActive ? colors.surfaceStrong : colors.border;
              const textColor = isActive ? '#FFF' : colors.foreground;
              const subtextColor = isActive ? '#A0AABF' : colors.mutedForeground;
              const dividerColor = isActive ? '#2A364C' : colors.border;

              return (
              <Pressable
                key={booking.id}
                onPress={() => router.push(`/booking-detail?id=${booking.id}` as any)}
                style={[
                  styles.upcomingCard, 
                  { 
                    backgroundColor: cardBg, 
                    borderColor: cardBorder, 
                    borderWidth: 1 
                  }
                ]}
              >
                <View style={styles.upcomingCopy}>
                  <View style={styles.upcomingTitleRow}>
                    <Text style={[styles.upcomingName, { color: textColor }]}>{booking.vehicleName}</Text>
                    <View style={styles.upcomingStatus}>
                      <View style={[
                        styles.statusDot, 
                        { backgroundColor: 
                            booking.status === 'CONFIRMED' ? colors.primary : 
                            booking.status === 'PENDING' ? colors.blue : 
                            (booking.status === 'CANCELLED' || booking.status === 'FAILED') ? colors.destructive : 
                            colors.mutedForeground 
                        }
                      ]} />
                      <Text style={[styles.upcomingStatusText, { color: textColor }]}>{booking.status}</Text>
                    </View>
                  </View>
                  <View style={styles.upcomingMetaRow}>
                    <Feather name="calendar" size={13} color={subtextColor} />
                    <Text style={[styles.upcomingMeta, { color: subtextColor }]}>{booking.pickupDate} - {booking.returnDate} ({booking.rentalDays} Days)</Text>
                  </View>
                  <View style={styles.upcomingMetaRow}>
                    <Feather name="map-pin" size={13} color={subtextColor} />
                    <Text style={[styles.upcomingMeta, { color: subtextColor }]}>{booking.pickupLocationName}</Text>
                  </View>
                  
                  <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 12 }} />
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: textColor, fontFamily: 'Inter_600SemiBold' }}>₹{booking.onlinePayableNow.toLocaleString('en-IN')} <Text style={{ color: subtextColor, fontFamily: 'Inter_400Regular', fontSize: 13 }}>paid online</Text></Text>
                    {booking.remainingRentalAmount > 0 && (
                      <Text style={{ color: subtextColor, fontSize: 12, fontFamily: 'Inter_500Medium' }}>Remaining: ₹{booking.remainingRentalAmount.toLocaleString('en-IN')}</Text>
                    )}
                  </View>
                </View>
              </Pressable>
              );
            })}
          </ScrollView>
        ) : (
          <EmptyState title={`No ${tab.toLowerCase()} trips`} copy={`Your ${tab.toLowerCase()} rentals will appear here.`} colors={colors} />
        )}
      </View>
      <BottomNavigation />
    </View>
  );
}

function EmptyState({ title, copy, colors }: { title: string; copy: string, colors: any }) {
  return (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="map" size={24} color={colors.foreground} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text>
      <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>{copy}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 24, letterSpacing: -0.5 },
  tabs: { gap: 24, paddingBottom: 2 },
  tab: { paddingVertical: 12, position: 'relative' },
  tabText: { fontSize: 15 },
  tabUnderline: { bottom: 0, height: 2, left: 0, position: 'absolute', right: 0 },
  upcomingCard: { borderRadius: 16, flexDirection: 'row', marginBottom: 16, overflow: 'hidden' },
  upcomingCopy: { flex: 1, padding: 16 },
  upcomingTitleRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  upcomingName: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  upcomingStatus: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  statusDot: { borderRadius: 99, height: 6, width: 6 },
  upcomingStatusText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  upcomingMetaRow: { alignItems: 'center', flexDirection: 'row', gap: 6, marginTop: 8 },
  upcomingMeta: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  emptyContainer: { alignItems: 'center', flex: 1, justifyContent: 'center', marginTop: -60 },
  emptyCircle: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 64, justifyContent: 'center', width: 64 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18, marginTop: 24 },
  emptyCopy: { fontFamily: 'Inter_400Regular', fontSize: 15, marginTop: 8, textAlign: 'center' },
});