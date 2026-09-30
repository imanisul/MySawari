import React, { useState, useCallback, useEffect } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { BottomNavigation, PrimaryButton } from '@/components';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Reanimated, { FadeIn } from 'react-native-reanimated';
import { BookingSnapshot } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';
import { LoginBottomSheet } from '@/components';
import { API } from '@/services/backend/api';
import { CancelBookingSheet } from '@/components/booking/CancelBookingSheet';
import { ExtendBookingSheet } from '@/components/booking/ExtendBookingSheet';
import { BookingSkeleton } from '@/components/loading/BookingSkeleton';
import { ReviewModal, ReviewTrip } from '@/components/booking/ReviewModal';
import { rise } from '@/components/common/motion';
type BookingTab = 'Upcoming' | 'Active' | 'Completed' | 'Cancelled';

export default function BookingsScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useSawari();
  const [showLogin, setShowLogin] = useState(false);
  
  const [tab, setTab] = useState<BookingTab>('Upcoming');
  const [initialTabSet, setInitialTabSet] = useState(false);
  const tabs: BookingTab[] = ['Upcoming', 'Active', 'Completed', 'Cancelled'];
  
  const [actionBooking, setActionBooking] = useState<BookingSnapshot | null>(null);
  const [actionType, setActionType] = useState<'cancel' | 'extend' | null>(null);
  const [reviewTrip, setReviewTrip] = useState<ReviewTrip | null>(null);

  // Which trips the customer has already reviewed, so every completed trip shows the right action.
  const { data: myReviews } = useQuery({
    queryKey: ['myReviews'],
    queryFn: () => API.reviews.mine(),
    enabled: isAuthenticated === true,
    staleTime: 60 * 1000,
  });
  const hasReviewed = (b: BookingSnapshot) =>
    !!myReviews && (myReviews.bookingIds.includes(b.id) || myReviews.legacyCarIds.includes(String(b.vehicleId)));
  
  const { data: bookings = [], isLoading: loading, isError: fetchError, refetch } = useQuery({
    queryKey: ['bookings'],
    queryFn: async () => {
      if (!isAuthenticated) return [];
      const userBookings = await API.getAllBookings();
      return userBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    enabled: isAuthenticated === true,
    staleTime: 15 * 1000,
    refetchInterval: 30 * 1000, // status changes (e.g. trip completed by the ops team) appear on their own
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (!loading && !initialTabSet) {
      if (bookings && bookings.length > 0) {
        if (bookings.some(b => b.status === 'ONGOING')) {
          setTab('Active');
        } else if (bookings.some(b => b.status === 'CONFIRMED' || b.status === 'PENDING')) {
          setTab('Upcoming');
        } else if (bookings.some(b => b.status === 'COMPLETED')) {
          setTab('Completed');
        }
      }
      setInitialTabSet(true);
    }
  }, [loading, bookings, initialTabSet]);

  // A booking is Active only once the operations app has handed the vehicle to the customer
  // (status vehicle_handover, mapped to ONGOING). Reaching the start date never moves it: until the
  // handover it stays in Upcoming.
  const filteredBookings = bookings.filter((b) => {
    if (tab === 'Upcoming') return b.status === 'CONFIRMED' || b.status === 'PENDING';
    if (tab === 'Active') return b.status === 'ONGOING';
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
        <View style={{ marginTop: 24, marginBottom: 12, marginHorizontal: -24 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 24 }}>
            {tabs.map((item) => {
              const isSelected = tab === item;
              return (
                <Pressable 
                  key={item} 
                  onPress={() => setTab(item)} 
                  style={{
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    borderRadius: 99,
                    backgroundColor: isSelected ? colors.primary : colors.card,
                    borderWidth: 1,
                    borderColor: isSelected ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ 
                    color: isSelected ? colors.primaryForeground : colors.foreground, 
                    fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_500Medium',
                    fontSize: 14 
                  }}>
                    {item}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
        
        {loading ? (
          <Reanimated.View entering={FadeIn.duration(200)} style={{ paddingTop: 8, paddingBottom: insets.bottom + 100 }}>
            <BookingSkeleton index={0} />
            <BookingSkeleton index={1} />
            <BookingSkeleton index={2} />
          </Reanimated.View>
        ) : fetchError ? (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyCircle, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="alert-circle" size={24} color={colors.destructive} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Connection Error</Text>
            <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>Could not load your bookings.</Text>
            <Pressable onPress={() => refetch()} style={{ marginTop: 16, padding: 12, backgroundColor: colors.primary, borderRadius: 8 }}>
              <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_500Medium' }}>Retry</Text>
            </Pressable>
          </View>
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
              <Reanimated.View key={booking.id} entering={rise()}>
                <Pressable
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
                    <Text style={[styles.upcomingName, { color: textColor, fontSize: 18, fontFamily: 'Inter_700Bold' }]}>{booking.vehicleName}</Text>
                    <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 6,
                        backgroundColor: 
                            booking.status === 'ONGOING' ? colors.success + '15' :
                            booking.status === 'CONFIRMED' ? '#04785715' : 
                            booking.status === 'PENDING' ? '#3B82F615' : 
                            (booking.status === 'CANCELLED' || booking.status === 'FAILED') ? colors.destructive + '15' : 
                            colors.mutedForeground + '15',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 6
                    }}>
                      <View style={[
                        styles.statusDot, 
                        { backgroundColor: 
                            booking.status === 'ONGOING' ? colors.success :
                            booking.status === 'CONFIRMED' ? '#047857' : 
                            booking.status === 'PENDING' ? '#3B82F6' : 
                            (booking.status === 'CANCELLED' || booking.status === 'FAILED') ? colors.destructive : 
                            colors.mutedForeground 
                        }
                      ]} />
                      <Text style={{ 
                        fontFamily: 'Inter_600SemiBold', 
                        fontSize: 11,
                        color: 
                            booking.status === 'ONGOING' ? (isActive ? textColor : colors.success) :
                            booking.status === 'CONFIRMED' ? (isActive ? textColor : '#047857') : 
                            booking.status === 'PENDING' ? (isActive ? textColor : '#3B82F6') : 
                            (booking.status === 'CANCELLED' || booking.status === 'FAILED') ? (isActive ? textColor : colors.destructive) : 
                            (isActive ? textColor : colors.mutedForeground)
                      }}>{booking.status}</Text>
                    </View>
                  </View>
                  <View style={{ marginTop: 12, gap: 6 }}>
                    <View style={styles.upcomingMetaRow}>
                      <View style={{ width: 24, alignItems: 'center' }}><Feather name="calendar" size={14} color={subtextColor} /></View>
                      <View>
                        <Text style={[styles.upcomingMeta, { color: subtextColor, fontSize: 12 }]}>Pickup Date & Time</Text>
                        <Text style={[styles.upcomingMeta, { color: textColor, fontFamily: 'Inter_500Medium', marginTop: 2 }]}>{booking.pickupDate} at {booking.pickupTime || '10:00 AM'}</Text>
                      </View>
                    </View>
                    <View style={styles.upcomingMetaRow}>
                      <View style={{ width: 24, alignItems: 'center' }}><Feather name="clock" size={14} color={subtextColor} /></View>
                      <View>
                        <Text style={[styles.upcomingMeta, { color: subtextColor, fontSize: 12 }]}>Drop Date & Time</Text>
                        <Text style={[styles.upcomingMeta, { color: textColor, fontFamily: 'Inter_500Medium', marginTop: 2 }]}>{booking.returnDate} at {booking.dropTime || '10:00 AM'}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={{ marginTop: 6, gap: 6 }}>
                    {(!booking.pickupCharge && !booking.dropCharge) ? (
                      <View style={styles.upcomingMetaRow}>
                        <View style={{ width: 24, alignItems: 'center' }}><Feather name="map-pin" size={14} color={subtextColor} /></View>
                        <Text style={[styles.upcomingMeta, { color: textColor, flex: 1 }]} numberOfLines={2}>
                          {booking.dropoffLocationName || 'MySawari Office'}
                        </Text>
                      </View>
                    ) : (
                      <>
                        {!!booking.pickupCharge && booking.pickupCharge > 0 && (
                          <View style={styles.upcomingMetaRow}>
                            <View style={{ width: 24, alignItems: 'center' }}><Feather name="map-pin" size={14} color={subtextColor} /></View>
                            <Text style={[styles.upcomingMeta, { color: textColor, flex: 1 }]} numberOfLines={2}>
                              Pickup: {booking.pickupLocationName}
                            </Text>
                          </View>
                        )}
                        {!!booking.dropCharge && booking.dropCharge > 0 && (
                          <View style={styles.upcomingMetaRow}>
                            <View style={{ width: 24, alignItems: 'center' }}><Feather name="map-pin" size={14} color={subtextColor} /></View>
                            <Text style={[styles.upcomingMeta, { color: textColor, flex: 1 }]} numberOfLines={2}>
                              Drop: {booking.dropLocationName}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                  
                  <View style={{ height: 1, backgroundColor: dividerColor, marginVertical: 16 }} />
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View>
                      <Text style={{ color: subtextColor, fontSize: 12, fontFamily: 'Inter_500Medium' }}>Booking Amount</Text>
                      <Text style={{ color: textColor, fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 2 }}>₹{booking.onlinePayableNow.toLocaleString('en-IN')}</Text>
                    </View>
                    {booking.remainingRentalAmount > 0 && (
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={{ color: subtextColor, fontSize: 12, fontFamily: 'Inter_500Medium' }}>Balance Due</Text>
                        <Text style={{ color: textColor, fontFamily: 'Inter_700Bold', fontSize: 16, marginTop: 2 }}>₹{booking.remainingRentalAmount.toLocaleString('en-IN')}</Text>
                      </View>
                    )}
                  </View>
                  
                  {booking.status === 'CANCELLED' && booking.refundAmount !== undefined && booking.refundAmount > 0 && (
                    <View style={{ marginTop: 12, padding: 12, backgroundColor: booking.refundStatus === 'PROCESSING' ? colors.warning + '14' : colors.success + '1A', borderRadius: 8 }}>
                      <Text style={{ color: booking.refundStatus === 'PROCESSING' ? colors.warning : colors.success, fontFamily: 'Inter_500Medium', fontSize: 13 }}>
                        {booking.refundStatus === 'PROCESSING' ? 'Refund Processing' : 'Refund Processed'}: ₹{booking.refundAmount.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  )}
                  {booking.status === 'CANCELLED' && booking.refundAmount === 0 && (
                    <View style={{ marginTop: 12, padding: 12, backgroundColor: colors.destructive + '15', borderRadius: 8 }}>
                      <Text style={{ color: colors.destructive, fontFamily: 'Inter_500Medium', fontSize: 13 }}>No Refund (Cancelled within 24 hours)</Text>
                    </View>
                  )}
                  <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end' }}>
                    {(tab === 'Upcoming' && (booking.status === 'CONFIRMED' || booking.status === 'PENDING')) && (
                      <Pressable 
                        onPress={(e) => { e.stopPropagation(); setActionBooking(booking); setActionType('cancel'); }}
                        style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.destructive }}
                      >
                        <Text style={{ color: colors.destructive, fontFamily: 'Inter_500Medium', fontSize: 13 }}>Cancel Trip</Text>
                      </Pressable>
                    )}
                    
                    {((booking.status === 'CONFIRMED' || booking.status === 'ONGOING') && (booking.pickupCharge || 0) > 0) && (
                      <Pressable 
                        onPress={(e) => { 
                          e.stopPropagation();
                          import('react-native').then(({ Linking }) => {
                            Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(booking.pickupLocationName || 'Kahilipara, Guwahati')}`);
                          });
                        }}
                        style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#047857', marginLeft: 12 }}
                      >
                        <Text style={{ color: '#FFFFFF', fontFamily: 'Inter_500Medium', fontSize: 13 }}>Track Vehicle</Text>
                      </Pressable>
                    )}
                    {tab === 'Completed' && booking.status === 'COMPLETED' && (
                      hasReviewed(booking) ? (
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8 }}>
                          <Feather name="check-circle" size={14} color={colors.success} />
                          <Text style={{ color: colors.success, fontFamily: 'Inter_500Medium', fontSize: 13 }}>Reviewed</Text>
                        </View>
                      ) : (
                        <Pressable
                          onPress={(e) => { e.stopPropagation(); setReviewTrip({ bookingId: booking.id, carId: String(booking.vehicleId), vehicleName: booking.vehicleName }); }}
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.primary }}
                        >
                          <Feather name="star" size={14} color={colors.primaryForeground} />
                          <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_500Medium', fontSize: 13 }}>Write a review</Text>
                        </Pressable>
                      )
                    )}
                    {(() => {
                      const hasPendingExt = booking.extensions?.some((e: any) => e.status === 'pending');
                      const hasRejectedExt = booking.extensions?.some((e: any) => e.status === 'rejected');
                      if (hasPendingExt) {
                        return (
                          <View style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: '#F59E0B20', marginLeft: 12 }}>
                            <Text style={{ color: '#B45309', fontFamily: 'Inter_500Medium', fontSize: 13 }}>Extension Pending</Text>
                          </View>
                        );
                      }
                      
                      if (!hasRejectedExt && (tab === 'Active' || (tab === 'Upcoming' && booking.status === 'CONFIRMED'))) {
                        return (
                          <Pressable 
                            onPress={(e) => { e.stopPropagation(); setActionBooking(booking); setActionType('extend'); }}
                            style={{ paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8, backgroundColor: colors.primary, marginLeft: 12 }}
                          >
                            <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_500Medium', fontSize: 13 }}>Extend Trip</Text>
                          </Pressable>
                        );
                      }
                      return null;
                    })()}
                  </View>
                </View>
              </Pressable>
              </Reanimated.View>
              );
            })}
          </ScrollView>
        ) : (
          <EmptyState title={`No ${tab.toLowerCase()} trips`} copy={`Your ${tab.toLowerCase()} rentals will appear here.`} colors={colors} />
        )}
      </View>
      <BottomNavigation />

      <ReviewModal trip={reviewTrip} onClose={() => setReviewTrip(null)} />
      
      {actionBooking && actionType === 'cancel' && (
        <CancelBookingSheet
          visible={true}
          onClose={() => { setActionType(null); setActionBooking(null); }}
          booking={actionBooking}
          onSuccess={(updatedBooking) => {
            refetch();
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
            refetch();
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