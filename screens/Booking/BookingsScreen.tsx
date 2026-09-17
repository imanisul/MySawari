import React, { useState, useCallback } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { BottomNavigation, PrimaryButton } from '@/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BookingSnapshot } from '@/services/backend/database';
import { useSawari } from '@/context/SawariContext';
import { LoginBottomSheet } from '@/components';
import { API } from '@/services/backend/api';
import { CancelBookingSheet } from '@/components/booking/CancelBookingSheet';
import { ExtendBookingSheet } from '@/components/booking/ExtendBookingSheet';
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

  const [actionBooking, setActionBooking] = useState<BookingSnapshot | null>(null);
  const [actionType, setActionType] = useState<'cancel' | 'extend' | null>(null);

  // Fetch bookings when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const fetchBookings = async () => {
        try {
          if (!isAuthenticated) return;
          const userBookings = await API.getAllBookings();
          if (isActive) {
            // Sort by createdAt descending
            const sorted = userBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setBookings(sorted);
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
    const parseDate = (dateStr: string, isEnd = false) => {
      if (dateStr === 'mock-date') {
        dateStr = isEnd ? '20 Sep' : '15 Sep';
      }
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const parts = dateStr.split(' ');
      const monthPrefix = parts.length >= 2 ? parts[1].substring(0, 3) : '';
      if (parts.length >= 2 && months.includes(monthPrefix)) {
        const day = parseInt(parts[0], 10);
        const month = months.indexOf(monthPrefix);
        const year = new Date().getFullYear();
        return new Date(year, month, day);
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return new Date(`${dateStr} ${new Date().getFullYear()}`);
      return d;
    };

    // Check if the booking is currently ongoing (either explicitly marked or inferred by dates)
    const pickup = parseDate(b.pickupDate, false);
    const returnDt = parseDate(b.returnDate, true);
    returnDt.setHours(23, 59, 59, 999); // Cover the entire return day

    // Only infer if dates are valid
    const isOngoingInferred = !isNaN(pickup.getTime()) && !isNaN(returnDt.getTime()) 
      && b.status === 'CONFIRMED' 
      && pickup <= new Date() 
      && returnDt >= new Date();
      
    const isOngoing = b.status === 'ONGOING' || isOngoingInferred;

    if (tab === 'Upcoming') {
      return (b.status === 'CONFIRMED' || b.status === 'PENDING') && !isOngoing;
    }
    if (tab === 'Active') {
      return isOngoing;
    }
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
                    <Text style={[styles.upcomingMeta, { color: subtextColor }]}>
                      {booking.pickupDate === 'mock-date' ? '15 Sep' : booking.pickupDate} - {booking.returnDate === 'mock-date' ? '20 Sep' : booking.returnDate} ({booking.rentalDays} Days)
                    </Text>
                  </View>
                  {(!booking.pickupCharge && !booking.dropCharge) ? (
                    <View style={styles.upcomingMetaRow}>
                      <Feather name="map-pin" size={13} color={subtextColor} />
                      <Text style={[styles.upcomingMeta, { color: subtextColor }]} numberOfLines={1}>
                        {booking.dropoffLocationName || 'MySawari Office'}
                      </Text>
                    </View>
                  ) : (
                    <>
                      {!!booking.pickupCharge && booking.pickupCharge > 0 && (
                        <View style={styles.upcomingMetaRow}>
                          <Feather name="map-pin" size={13} color={subtextColor} />
                          <Text style={[styles.upcomingMeta, { color: subtextColor }]} numberOfLines={1}>
                            Pickup: {booking.pickupLocationName}
                          </Text>
                        </View>
                      )}
                      {!!booking.dropCharge && booking.dropCharge > 0 && (
                        <View style={styles.upcomingMetaRow}>
                          <Feather name="map-pin" size={13} color={subtextColor} />
                          <Text style={[styles.upcomingMeta, { color: subtextColor }]} numberOfLines={1}>
                            Drop: {booking.dropLocationName}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                  
                  <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 12 }} />
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ color: textColor, fontFamily: 'Inter_600SemiBold' }}>₹{booking.onlinePayableNow.toLocaleString('en-IN')} <Text style={{ color: subtextColor, fontFamily: 'Inter_400Regular', fontSize: 13 }}>paid online</Text></Text>
                    {booking.remainingRentalAmount > 0 && (
                      <Text style={{ color: subtextColor, fontSize: 12, fontFamily: 'Inter_500Medium' }}>Remaining: ₹{booking.remainingRentalAmount.toLocaleString('en-IN')}</Text>
                    )}
                  </View>
                  
                  {booking.status === 'CANCELLED' && booking.refundAmount !== undefined && booking.refundAmount > 0 && (
                    <View style={{ marginTop: 12, padding: 12, backgroundColor: booking.refundStatus === 'PROCESSING' ? '#FEF3C7' : colors.success + '15', borderRadius: 8 }}>
                      <Text style={{ color: booking.refundStatus === 'PROCESSING' ? '#D97706' : colors.success, fontFamily: 'Inter_500Medium', fontSize: 13 }}>
                        {booking.refundStatus === 'PROCESSING' ? 'Refund Processing' : 'Refund Processed'}: ₹{booking.refundAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}
                  {booking.status === 'CANCELLED' && booking.refundAmount === 0 && (
                    <View style={{ marginTop: 12, padding: 12, backgroundColor: colors.destructive + '15', borderRadius: 8 }}>
                      <Text style={{ color: colors.destructive, fontFamily: 'Inter_500Medium', fontSize: 13 }}>No Refund (Cancelled within 24 hours)</Text>
                    </View>
                  )}
                  {(tab === 'Upcoming' && (booking.status === 'CONFIRMED' || booking.status === 'PENDING')) && (
                    <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <Pressable 
                        onPress={(e) => { e.stopPropagation(); setActionBooking(booking); setActionType('cancel'); }}
                        style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.destructive }}
                      >
                        <Text style={{ color: colors.destructive, fontFamily: 'Inter_500Medium', fontSize: 13 }}>Cancel Trip</Text>
                      </Pressable>
                    </View>
                  )}
                  {tab === 'Active' && (
                    <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' }}>
                      <Pressable 
                        onPress={(e) => { e.stopPropagation(); setActionBooking(booking); setActionType('extend'); }}
                        style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.primary }}
                      >
                        <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_500Medium', fontSize: 13 }}>Extend Trip</Text>
                      </Pressable>
                    </View>
                  )}
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
      
      {actionBooking && actionType === 'cancel' && (
        <CancelBookingSheet
          visible={true}
          onClose={() => { setActionType(null); setActionBooking(null); }}
          booking={actionBooking}
          onSuccess={(updatedBooking) => {
            setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
            setActionType(null); setActionBooking(null);
          }}
        />
      )}
      {actionBooking && actionType === 'extend' && (
        <ExtendBookingSheet
          visible={true}
          onClose={() => { setActionType(null); setActionBooking(null); }}
          booking={actionBooking}
          onSuccess={(updatedBooking) => {
            setBookings(prev => prev.map(b => b.id === updatedBooking.id ? updatedBooking : b));
            setActionType(null); setActionBooking(null);
          }}
        />
      )}
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