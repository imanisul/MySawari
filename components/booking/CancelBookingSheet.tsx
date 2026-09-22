import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API } from '@/services/backend/api';
import { BookingSnapshot } from '@/services/backend/api';
import { MockRequests } from '@/utils/mockRequests';

export function CancelBookingSheet({ visible, onClose, booking, onSuccess }: { visible: boolean; onClose: () => void; booking: BookingSnapshot; onSuccess: (updatedSnapshot: BookingSnapshot) => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const handleCancel = async () => {
    setLoading(true);
    try {
      const response = await API.cancelBooking(booking.id, 'Change of plans');
      if (response.success) {
        if (refund > 0) {
          await MockRequests.requestRefund({
            bookingId: booking.id,
            refundAmount: refund,
            requestedAt: new Date().toISOString()
          });
        }
        onSuccess(response.snapshot);
        onClose();
      }
    } catch (e: any) {
      Alert.alert('Cancellation Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

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

  const pickupDate = parseDate(booking.pickupDate);
  const hoursDifference = (pickupDate.getTime() - new Date().getTime()) / (1000 * 60 * 60);
  
  let fee = 0;
  let refund = 0;
  if (hoursDifference >= 24) {
    fee = 0;
    refund = booking.onlinePayableNow;
  } else {
    fee = booking.onlinePayableNow;
    refund = 0;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 24), transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Cancel Booking?</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            Are you sure you want to cancel your booking for the {booking.vehicleName}?
          </Text>

          <View style={{ backgroundColor: colors.destructive + '15', padding: 12, borderRadius: 8, marginBottom: 20 }}>
            <Text style={{ color: colors.destructive, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18 }}>
              Important: Cancellations made less than 24 hours before pickup are non-refundable.
            </Text>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={styles.row}>
              <Text style={{ color: colors.mutedForeground }}>Amount Paid</Text>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>₹{booking.onlinePayableNow.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.row}>
              <Text style={{ color: colors.mutedForeground }}>Cancellation Fee</Text>
              <Text style={{ color: colors.destructive, fontFamily: 'Inter_600SemiBold' }}>₹{fee.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold' }}>Refund Amount</Text>
              <Text style={{ color: colors.success, fontFamily: 'Inter_700Bold' }}>₹{refund.toLocaleString('en-IN')}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: colors.primary }]} 
            onPress={onClose}
            disabled={loading}
          >
            <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>Keep Booking</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.destructiveBtn, { borderColor: colors.border, borderWidth: 1 }]} 
            onPress={handleCancel}
            disabled={loading}
          >
            {loading ? <ActivityIndicator size="small" color={colors.destructive} /> : <Text style={[styles.destructiveBtnText, { color: colors.destructive }]}>Continue Cancellation</Text>}
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, minHeight: 300 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  closeBtn: { padding: 4 },
  subtitle: { fontSize: 15, fontFamily: 'Inter_400Regular', lineHeight: 22, marginBottom: 24 },
  card: { padding: 16, borderRadius: 12, marginBottom: 24 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  divider: { height: 1, backgroundColor: 'rgba(150,150,150,0.2)', marginVertical: 8 },
  primaryBtn: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
  primaryBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  destructiveBtn: { padding: 16, borderRadius: 12, alignItems: 'center' },
  destructiveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
});
