import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API } from '@/services/backend/api';
import { BookingSnapshot } from '@/services/backend/database';

export function ExtendBookingSheet({ visible, onClose, booking, onSuccess }: { visible: boolean; onClose: () => void; booking: BookingSnapshot; onSuccess: (updatedSnapshot: BookingSnapshot) => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [daysToAdd, setDaysToAdd] = useState(1);
  
  const [availability, setAvailability] = useState<{ available: boolean; message?: string; additionalAmount: number } | null>(null);

  const slideAnim = useRef(new Animated.Value(500)).current;

  const parseDate = (dateStr: string) => {
    if (dateStr === 'mock-date') dateStr = '20 Sep';
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

  const checkAvailability = async (days: number) => {
    setDaysToAdd(days);
    setChecking(true);
    try {
      const currentReturn = parseDate(booking.returnDate);
      const newReturn = new Date(currentReturn.getTime() + (days * 24 * 60 * 60 * 1000));
      
      const res = await API.checkExtensionAvailability(booking.id, newReturn.toISOString());
      setAvailability(res);
    } catch (e: any) {
      setAvailability({ available: false, message: e.message, additionalAmount: 0 });
    } finally {
      setChecking(false);
    }
  };

  const handleExtend = async () => {
    if (!availability?.available) return;
    setLoading(true);
    try {
      const currentReturn = parseDate(booking.returnDate);
      const newReturn = new Date(currentReturn.getTime() + (daysToAdd * 24 * 60 * 60 * 1000));
      const newReturnStr = formatDate(newReturn);
      
      const response = await API.extendBooking(booking.id, newReturnStr, availability.additionalAmount, daysToAdd);
      if (response.success) {
        onSuccess(response.snapshot);
        onClose();
      }
    } catch (e: any) {
      Alert.alert('Extension Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  const currentReturnDate = formatDate(parseDate(booking.returnDate));
  const newReturnDate = formatDate(new Date(parseDate(booking.returnDate).getTime() + (daysToAdd * 24 * 60 * 60 * 1000)));

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheet, { backgroundColor: colors.background, paddingBottom: Math.max(insets.bottom, 24), transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Extend Booking</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16 }}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 6 }}>Current Return</Text>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 18 }}>{currentReturnDate}</Text>
              </View>
              
              <View style={{ paddingHorizontal: 12 }}>
                <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primary + '15', alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="arrow-forward" size={18} color={colors.primary} />
                </View>
              </View>
              
              <View style={{ flex: 1, alignItems: 'center' }}>
                <Text style={{ color: colors.mutedForeground, fontSize: 12, fontFamily: 'Inter_600SemiBold', marginBottom: 6 }}>New Return</Text>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 18 }}>{newReturnDate}</Text>
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
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_500Medium' }}>Additional Rental</Text>
              {checking ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : availability?.available ? (
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold', fontSize: 16 }}>₹{availability.additionalAmount.toLocaleString('en-IN')}</Text>
              ) : (
                <Text style={{ color: colors.destructive, fontFamily: 'Inter_500Medium', fontSize: 13 }}>{availability?.message || 'Unavailable'}</Text>
              )}
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.primaryBtn, { backgroundColor: availability?.available ? colors.primary : colors.mutedForeground }]} 
            onPress={handleExtend}
            disabled={loading || checking || !availability?.available}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Text style={[styles.primaryBtnText, { color: colors.primaryForeground }]}>
                {availability?.available ? `Confirm Extension (Add ₹${availability.additionalAmount.toLocaleString('en-IN')} to balance)` : 'Unavailable'}
              </Text>
            )}
          </TouchableOpacity>
        </Animated.View>
      </View>
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
});
