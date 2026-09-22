import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, ActivityIndicator, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API } from '@/services/backend/api';
import { BookingSnapshot } from '@/services/backend/api';
import { MockRequests } from '@/utils/mockRequests';

export function ExtendBookingSheet({ visible, onClose, booking, onSuccess }: { visible: boolean; onClose: () => void; booking: BookingSnapshot; onSuccess: (updatedSnapshot: BookingSnapshot) => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [daysToAdd, setDaysToAdd] = useState(1);
  
  const [availability, setAvailability] = useState<{ available: boolean; message?: string; additionalAmount: number } | null>(null);

  const slideAnim = useRef(new Animated.Value(500)).current;

  const parseDate = (dateStr: string) => {
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

  const formatDate = (d: Date) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]}`;
  };

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }).start();
      checkAvailability(1);
    } else {
      Animated.timing(slideAnim, { toValue: 500, duration: 250, useNativeDriver: true }).start();
      setDaysToAdd(1);
      setAvailability(null);
    }
  }, [visible]);

  const incrementDays = () => {
    if (daysToAdd < 30) checkAvailability(daysToAdd + 1);
  };
  
  const decrementDays = () => {
    if (daysToAdd > 1) checkAvailability(daysToAdd - 1);
  };

  const dailyRate = booking.dailyRate || Math.round(booking.rentalAmount / booking.rentalDays) || 0;
  const estimatedTotal = dailyRate * daysToAdd;

  const checkAvailability = async (days: number) => {
    setDaysToAdd(days);
    setChecking(true);
    try {
      const res = await API.checkExtensionAvailability(booking.id, days, booking.driverMode === 'With Driver');
      setAvailability(res);
    } catch (e: any) {
      setAvailability({ available: false, message: e.message, additionalAmount: estimatedTotal });
    } finally {
      setChecking(false);
    }
  };

  const handleRequestExtension = async () => {
    setLoading(true);
    try {
      await MockRequests.requestExtension({
        bookingId: booking.id,
        daysToAdd,
        additionalAmount: availability?.additionalAmount || estimatedTotal,
        requestedAt: new Date().toISOString()
      });
      // Notify parent that a request was made
      onSuccess(booking); // We don't have the updated snapshot yet, but this triggers a refresh in the parent
      onClose();
    } catch(e: any) {
      Alert.alert('Request Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const currentReturnDate = formatDate(parseDate(booking.returnDate));
  const newReturnDate = formatDate(new Date(parseDate(booking.returnDate).getTime() + (daysToAdd * 24 * 60 * 60 * 1000)));
  const dropTimeStr = booking.dropTime ? ` at ${booking.dropTime}` : '';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 24), transform: [{ translateY: slideAnim }] }]}>
                    <>
              <View style={styles.header}>
                <View>
                  <Text style={[styles.title, { color: colors.foreground }]}>Extend Trip</Text>
                  <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium', marginTop: 4 }}>{booking.vehicleName}</Text>
                </View>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
                  <Feather name="x" size={24} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>

              <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: 'Inter_500Medium', marginBottom: 6, textAlign: 'center' }}>Current Return</Text>
                    <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'center' }}>{currentReturnDate}</Text>
                    {!!booking.dropTime && <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 2, textAlign: 'center' }}>{booking.dropTime}</Text>}
                  </View>
                  
                  <View style={{ paddingHorizontal: 12 }}>
                    <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                      <Ionicons name="arrow-forward" size={16} color={colors.primaryText} />
                    </View>
                  </View>
                  
                  <View style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{ color: colors.mutedForeground, fontSize: 11, fontFamily: 'Inter_600SemiBold', marginBottom: 6, textAlign: 'center' }}>New Return</Text>
                    <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 16, textAlign: 'center' }}>{newReturnDate}</Text>
                    {!!booking.dropTime && <Text style={{ color: colors.primaryText, fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 2, textAlign: 'center' }}>{booking.dropTime}</Text>}
                  </View>
                </View>

                <View style={styles.divider} />
                
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 }}>
                  <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 16, color: colors.foreground }}>Add Days</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.border, borderRadius: 24, padding: 4 }}>
                    <TouchableOpacity onPress={decrementDays} disabled={daysToAdd <= 1 || checking} style={{ padding: 10, backgroundColor: daysToAdd <= 1 ? 'transparent' : colors.card, borderRadius: 20 }}>
                      <Feather name="minus" size={18} color={daysToAdd <= 1 ? colors.mutedForeground : colors.foreground} />
                    </TouchableOpacity>
                    <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, color: colors.foreground, width: 44, textAlign: 'center' }}>{daysToAdd}</Text>
                    <TouchableOpacity onPress={incrementDays} disabled={daysToAdd >= 30 || checking} style={{ padding: 10, backgroundColor: colors.card, borderRadius: 20 }}>
                      <Feather name="plus" size={18} color={colors.foreground} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.divider} />

                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                  <View>
                    <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>Additional Rental</Text>
                    <Text style={{ color: colors.primaryText, fontFamily: 'Inter_500Medium', fontSize: 11, marginTop: 2 }}>
                      {`₹${dailyRate.toLocaleString('en-IN')} / day`}
                    </Text>
                  </View>
                  {checking ? (
                    <ActivityIndicator size="small" color={colors.primaryText} />
                  ) : (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 16 }}>₹{(availability?.additionalAmount || estimatedTotal).toLocaleString('en-IN')}</Text>
                      {!availability?.available && (
                        <Text style={{ color: colors.destructive, fontFamily: 'Inter_500Medium', fontSize: 10, marginTop: 2, maxWidth: 160, textAlign: 'right' }} numberOfLines={2}>
                          Extension request is subject to approval
                        </Text>
                      )}
                    </View>
                  )}
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.primaryBtn, { backgroundColor: colors.primary }]} 
                onPress={handleRequestExtension}
                disabled={loading || checking}
              >
                <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                  Request Extension
                </Text>
              </TouchableOpacity>
            </>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 400 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  closeBtn: { padding: 4 },
  card: { padding: 16, borderRadius: 12, marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, alignItems: 'center' },
  divider: { height: 1, backgroundColor: 'rgba(150,150,150,0.2)', marginVertical: 12 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 14, marginTop: 8 },
  dayPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 99, borderWidth: 1, marginRight: 8 },
  primaryBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  primaryBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  razorpayMock: { padding: 32, backgroundColor: '#1A1A1A', borderRadius: 20, width: '90%', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.5, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 15, borderWidth: 1, borderColor: '#333' }
});
