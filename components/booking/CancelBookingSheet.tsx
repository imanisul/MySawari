import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  Alert,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API, BookingSnapshot } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';

export function CancelBookingSheet({
  visible,
  onClose,
  booking,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  booking: BookingSnapshot;
  onSuccess: (updatedSnapshot: BookingSnapshot) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { customer } = useSawari();

  const [loading, setLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(400)).current;

  // Payout Method State
  const [payoutType, setPayoutType] = useState<'upi' | 'bank_account'>('upi');
  const [upiId, setUpiId] = useState('');
  const [accountHolderName, setAccountHolderName] = useState(customer?.name || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');
  const [bankName, setBankName] = useState('');

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 50, friction: 8 }).start();
    } else {
      Animated.timing(slideAnim, { toValue: 400, duration: 250, useNativeDriver: true }).start();
    }
  }, [visible]);

  const parseDate = (dateStr: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const parts = dateStr.trim().split(' ');
    const monthPrefix = parts.length >= 2 ? parts[1].substring(0, 3) : '';
    if (parts.length >= 2 && months.includes(monthPrefix)) {
      const day = parseInt(parts[0], 10);
      const month = months.indexOf(monthPrefix);
      const year = parts.length >= 3 && /^\d{4}$/.test(parts[2]) ? parseInt(parts[2], 10) : new Date().getFullYear();
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

  const handleCancel = async () => {
    if (refund > 0) {
      if (payoutType === 'upi') {
        const cleanUpi = upiId.trim();
        if (!cleanUpi || !cleanUpi.includes('@')) {
          Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID (e.g. mobile@upi or name@bank) to receive your refund.');
          return;
        }
      } else {
        if (!accountHolderName.trim()) {
          Alert.alert('Missing Detail', 'Please enter Account Holder Name.');
          return;
        }
        if (!accountNumber.trim()) {
          Alert.alert('Missing Detail', 'Please enter Account Number.');
          return;
        }
        if (accountNumber.trim() !== confirmAccountNumber.trim()) {
          Alert.alert('Mismatch', 'Account numbers do not match.');
          return;
        }
        if (ifscCode.trim().length < 4) {
          Alert.alert('Invalid IFSC', 'Please enter a valid IFSC Code.');
          return;
        }
      }
    }

    setLoading(true);
    try {
      const response = await API.cancelBooking(booking.id, 'Change of plans', booking);
      if (response.success) {
        if (refund > 0) {
          await API.requestRefund({
            bookingId: booking.id,
            amount: refund,
            reason: 'Booking Cancelled',
            customerId: customer?.id || '',
            customerMobile: customer?.mobile || booking.customerMobile || '',
            refundType: payoutType,
            upiId: payoutType === 'upi' ? upiId.trim() : undefined,
            accountDetails: payoutType === 'bank_account' ? {
              accountNumber: accountNumber.trim(),
              ifscCode: ifscCode.trim().toUpperCase(),
              accountHolderName: accountHolderName.trim(),
              bankName: bankName.trim(),
            } : undefined,
          });
        }
        Alert.alert(
          'Booking Cancelled',
          refund > 0
            ? `Your booking has been cancelled. Refund of ₹${refund.toLocaleString('en-IN')} has been requested and can be tracked in your trip details.`
            : 'Your booking has been successfully cancelled.',
          [
            {
              text: 'OK',
              onPress: () => {
                onSuccess(response.snapshot);
                onClose();
              },
            },
          ]
        );
      } else {
        Alert.alert('Cancellation Failed', 'The booking could not be cancelled. Please try again or contact support.');
      }
    } catch (e: any) {
      Alert.alert('Cancellation Failed', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, 20),
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.foreground }]}>Cancel Booking?</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 10 }}>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Are you sure you want to cancel your booking for the {booking.vehicleName}?
            </Text>

            <View style={{ backgroundColor: colors.destructive + '15', padding: 12, borderRadius: 8, marginBottom: 16 }}>
              <Text style={{ color: colors.destructive, fontFamily: 'Inter_500Medium', fontSize: 13, lineHeight: 18 }}>
                Important: Cancellations made less than 24 hours before pickup are non-refundable.
              </Text>
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
              <View style={styles.row}>
                <Text style={{ color: colors.mutedForeground }}>Amount Paid</Text>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_600SemiBold' }}>
                  ₹{booking.onlinePayableNow.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.row}>
                <Text style={{ color: colors.mutedForeground }}>Cancellation Fee</Text>
                <Text style={{ color: colors.destructive, fontFamily: 'Inter_600SemiBold' }}>
                  ₹{fee.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.row}>
                <Text style={{ color: colors.foreground, fontFamily: 'Inter_700Bold' }}>Refund Amount</Text>
                <Text style={{ color: colors.success, fontFamily: 'Inter_700Bold' }}>
                  ₹{refund.toLocaleString('en-IN')}
                </Text>
              </View>
            </View>

            {/* Payout Details Input Form if refund > 0 */}
            {refund > 0 && (
              <View style={[styles.payoutCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.payoutCardTitle, { color: colors.foreground }]}>
                  Refund Payout Method
                </Text>
                <Text style={[styles.payoutCardSubtitle, { color: colors.mutedForeground }]}>
                  Choose where you'd like your refund of ₹{refund.toLocaleString('en-IN')} deposited.
                </Text>

                {/* Method selector tabs */}
                <View style={styles.tabContainer}>
                  <TouchableOpacity
                    style={[
                      styles.tabBtn,
                      payoutType === 'upi' && { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
                    ]}
                    onPress={() => setPayoutType('upi')}
                  >
                    <MaterialCommunityIcons
                      name="cellphone-wireless"
                      size={16}
                      color={payoutType === 'upi' ? '#FFF' : colors.mutedForeground}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.tabBtnText,
                        { color: payoutType === 'upi' ? '#FFF' : colors.mutedForeground },
                      ]}
                    >
                      UPI ID
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.tabBtn,
                      payoutType === 'bank_account' && { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
                    ]}
                    onPress={() => setPayoutType('bank_account')}
                  >
                    <MaterialCommunityIcons
                      name="bank"
                      size={16}
                      color={payoutType === 'bank_account' ? '#FFF' : colors.mutedForeground}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.tabBtnText,
                        { color: payoutType === 'bank_account' ? '#FFF' : colors.mutedForeground },
                      ]}
                    >
                      Bank Transfer
                    </Text>
                  </TouchableOpacity>
                </View>

                {payoutType === 'upi' ? (
                  <View style={styles.inputGroup}>
                    <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>UPI ID</Text>
                    <TextInput
                      style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                      placeholder="e.g. 9876543210@upi or name@okhdfcbank"
                      placeholderTextColor="#9CA3AF"
                      value={upiId}
                      onChangeText={setUpiId}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Text style={[styles.helperText, { color: colors.mutedForeground }]}>
                      Amount will be transferred directly to this UPI ID upon approval.
                    </Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Account Holder Name</Text>
                      <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                        placeholder="e.g. Rahul Sharma"
                        placeholderTextColor="#9CA3AF"
                        value={accountHolderName}
                        onChangeText={setAccountHolderName}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Account Number</Text>
                      <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                        placeholder="e.g. 123456789012"
                        placeholderTextColor="#9CA3AF"
                        value={accountNumber}
                        onChangeText={setAccountNumber}
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Confirm Account Number</Text>
                      <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                        placeholder="Re-enter account number"
                        placeholderTextColor="#9CA3AF"
                        value={confirmAccountNumber}
                        onChangeText={setConfirmAccountNumber}
                        keyboardType="number-pad"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>IFSC Code</Text>
                      <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                        placeholder="e.g. SBIN0001234"
                        placeholderTextColor="#9CA3AF"
                        value={ifscCode}
                        onChangeText={(t) => setIfscCode(t.toUpperCase())}
                        autoCapitalize="characters"
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>Bank Name (Optional)</Text>
                      <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                        placeholder="e.g. State Bank of India"
                        placeholderTextColor="#9CA3AF"
                        value={bankName}
                        onChangeText={setBankName}
                      />
                    </View>
                  </>
                )}
              </View>
            )}

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
              {loading ? (
                <ActivityIndicator size="small" color={colors.destructive} />
              ) : (
                <Text style={[styles.destructiveBtnText, { color: colors.destructive }]}>
                  Continue Cancellation
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  closeBtn: { padding: 4 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20, marginBottom: 16 },
  card: { padding: 14, borderRadius: 12, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  divider: { height: 1, backgroundColor: 'rgba(150,150,150,0.2)', marginVertical: 8 },
  primaryBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  primaryBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  destructiveBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 10 },
  destructiveBtnText: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  payoutCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  payoutCardTitle: { fontSize: 15, fontFamily: 'Inter_600SemiBold', marginBottom: 4 },
  payoutCardSubtitle: { fontSize: 12, fontFamily: 'Inter_400Regular', marginBottom: 12 },
  tabContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  tabBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  inputGroup: { marginBottom: 10 },
  inputLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  helperText: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
});

