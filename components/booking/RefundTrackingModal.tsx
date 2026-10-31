import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTripColors } from '@/components/booking/tripColors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { API, BookingSnapshot } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';
import * as Clipboard from 'expo-clipboard';
import { ModalBlur } from '@/components/common/ModalBlur';

interface RefundTrackingModalProps {
  visible: boolean;
  onClose: () => void;
  booking: BookingSnapshot;
  onRefundUpdated?: () => void;
}

export function RefundTrackingModal({
  visible,
  onClose,
  booking,
  onRefundUpdated,
}: RefundTrackingModalProps) {
  const colors = useTripColors();
  const insets = useSafeAreaInsets();
  const { customer } = useSawari();

  const refund = booking?.pendingRefund;
  const status = (refund?.status || 'pending').toLowerCase();
  const refundAmount = refund?.refundAmount || booking?.refundAmount || 0;

  // Edit / Input state for pending payout update
  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState<'original_payment' | 'upi' | 'bank_account'>(
    refund?.refundType === 'bank_account' ? 'bank_account' : refund?.refundType === 'upi' ? 'upi' : 'original_payment'
  );
  const [upiId, setUpiId] = useState(refund?.upiId || '');
  const [accountNumber, setAccountNumber] = useState(
    refund?.accountDetails?.accountNumber || ''
  );
  const [confirmAccountNumber, setConfirmAccountNumber] = useState(
    refund?.accountDetails?.accountNumber || ''
  );
  const [ifscCode, setIfscCode] = useState(
    refund?.accountDetails?.ifscCode || ''
  );
  const [accountHolderName, setAccountHolderName] = useState(
    refund?.accountDetails?.accountHolderName || ''
  );
  const [bankName, setBankName] = useState(
    refund?.accountDetails?.bankName || ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const copyToClipboard = async (text: string, key: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  const handleSavePayoutDetails = async () => {
    if (editType === 'upi') {
      const cleanUpi = upiId.trim();
      if (!cleanUpi || !cleanUpi.includes('@')) {
        Alert.alert('Invalid UPI ID', 'Please enter a valid UPI ID (e.g. mobile@upi or name@bank).');
        return;
      }
    } else if (editType === 'bank_account') {
      if (!accountHolderName.trim()) {
        Alert.alert('Missing Detail', 'Please enter Account Holder Name.');
        return;
      }
      if (!accountNumber.trim()) {
        Alert.alert('Missing Detail', 'Please enter Account Number.');
        return;
      }
      if (accountNumber.trim() !== confirmAccountNumber.trim()) {
        Alert.alert('Account Number Mismatch', 'Account numbers do not match.');
        return;
      }
      if (ifscCode.trim().length < 4) {
        Alert.alert('Invalid IFSC', 'Please enter a valid IFSC code.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (refund?.id) {
        await API.updateRefundPayoutDetails(refund.id, {
          refundType: editType,
          upiId: editType === 'upi' ? upiId.trim() : undefined,
          accountDetails: editType === 'bank_account' ? {
            accountNumber: accountNumber.trim(),
            ifscCode: ifscCode.trim().toUpperCase(),
            accountHolderName: accountHolderName.trim(),
            bankName: bankName.trim(),
          } : undefined,
        });
      } else {
        await API.requestRefund({
          bookingId: booking.id,
          amount: refundAmount,
          reason: 'Booking Cancelled',
          customerId: customer?.id || '',
          customerMobile: customer?.mobile || booking.customerMobile || '',
          refundType: editType,
          upiId: editType === 'upi' ? upiId.trim() : undefined,
          accountDetails: editType === 'bank_account' ? {
            accountNumber: accountNumber.trim(),
            ifscCode: ifscCode.trim().toUpperCase(),
            accountHolderName: accountHolderName.trim(),
            bankName: bankName.trim(),
          } : undefined,
        });
      }
      Alert.alert('Updated', 'Payout details saved successfully!');
      setIsEditing(false);
      if (onRefundUpdated) onRefundUpdated();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to update payout details');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine stage flags
  const isRejected = status === 'rejected';
  const isApproved = status === 'approved' || status === 'refunded';
  const isRefunded = status === 'refunded';

  const badgeColor = isRefunded
    ? '#10B981'
    : isApproved
    ? '#4F46E5'
    : isRejected
    ? '#EF4444'
    : '#F59E0B';

  const badgeBg = isRefunded
    ? '#D1FAE5'
    : isApproved
    ? '#EEF2FF'
    : isRejected
    ? '#FEE2E2'
    : '#FEF3C7';

  const badgeLabel = isRefunded
    ? 'REFUNDED'
    : isApproved
    ? 'APPROVED'
    : isRejected
    ? 'REJECTED'
    : 'IN REVIEW';

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.overlay}>
        <ModalBlur />
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              paddingBottom: Math.max(insets.bottom, 24),
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={[styles.title, { color: colors.foreground }]}>Refund Tracking</Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {booking?.vehicleName || 'Booking'} • #{booking?.id?.slice(-6)?.toUpperCase()}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Feather name="x" size={22} color={colors.foreground} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {/* Amount Banner */}
            <View style={[styles.amountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>Total Refund Amount</Text>
                <Text style={[styles.amountValue, { color: colors.foreground }]}>
                  ₹{(refundAmount || 0).toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={[styles.badge, { backgroundColor: badgeBg }]}>
                <Text style={[styles.badgeText, { color: badgeColor }]}>{badgeLabel}</Text>
              </View>
            </View>

            {/* Stepper / Timeline */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Refund Progress Stages</Text>

              {/* Step 1: Requested */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View style={[styles.circle, styles.circleActive]}>
                    <Feather name="check" size={14} color="#FFF" />
                  </View>
                  <View style={[styles.line, (isApproved || isRejected) ? styles.lineActive : styles.linePending]} />
                </View>
                <View style={styles.timelineRight}>
                  <Text style={[styles.stepTitle, { color: colors.foreground }]}>Refund Requested</Text>
                  <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                    Request submitted by customer
                  </Text>
                  <Text style={[styles.stepTime, { color: colors.mutedForeground }]}>
                    {formatDate(refund?.requestedAt || booking?.cancelledAt)}
                  </Text>
                </View>
              </View>

              {/* Step 2: Under Review / Approved / Rejected */}
              <View style={styles.timelineItem}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.circle,
                      isRejected
                        ? styles.circleRejected
                        : isApproved
                        ? styles.circleActive
                        : styles.circlePending,
                    ]}
                  >
                    {isRejected ? (
                      <Feather name="x" size={14} color="#FFF" />
                    ) : isApproved ? (
                      <Feather name="check" size={14} color="#FFF" />
                    ) : (
                      <Feather name="clock" size={12} color="#FFF" />
                    )}
                  </View>
                  <View style={[styles.line, isRefunded ? styles.lineActive : styles.linePending]} />
                </View>
                <View style={styles.timelineRight}>
                  <Text
                    style={[
                      styles.stepTitle,
                      { color: isRejected ? '#EF4444' : isApproved ? colors.foreground : '#D97706' },
                    ]}
                  >
                    {isRejected ? 'Request Rejected' : isApproved ? 'Approved by Operations' : 'Under Review by Operations'}
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                    {isRejected
                      ? refund?.rejectionReason || 'Refund criteria not met.'
                      : isApproved
                      ? 'Payout approved and queued for bank/UPI transfer'
                      : 'Operations team is verifying trip and cancellation details'}
                  </Text>
                  {(refund?.approvedAt || refund?.rejectedAt) && (
                    <Text style={[styles.stepTime, { color: colors.mutedForeground }]}>
                      {formatDate(refund?.approvedAt || refund?.rejectedAt)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Step 3: Refunded / Money Sent */}
              <View style={[styles.timelineItem, { marginBottom: 0 }]}>
                <View style={styles.timelineLeft}>
                  <View
                    style={[
                      styles.circle,
                      isRefunded
                        ? styles.circleActive
                        : isRejected
                        ? styles.circleDisabled
                        : styles.circlePendingEmpty,
                    ]}
                  >
                    {isRefunded ? (
                      <Feather name="check" size={14} color="#FFF" />
                    ) : (
                      <MaterialCommunityIcons
                        name="bank-transfer"
                        size={14}
                        color={isRejected ? '#9CA3AF' : colors.mutedForeground}
                      />
                    )}
                  </View>
                </View>
                <View style={styles.timelineRight}>
                  <Text
                    style={[
                      styles.stepTitle,
                      { color: isRefunded ? '#10B981' : isRejected ? colors.mutedForeground : colors.foreground },
                    ]}
                  >
                    {isRefunded ? 'Refund Processed & Credited' : 'Money Transfer to Account/UPI'}
                  </Text>
                  <Text style={[styles.stepDesc, { color: colors.mutedForeground }]}>
                    {isRefunded
                      ? `Transferred via ${refund?.refundType === 'bank_account' ? 'Bank Transfer' : 'UPI'}${refund?.transactionReference ? ` (UTR: ${refund.transactionReference})` : ''}`
                      : isRejected
                      ? 'Process halted due to rejection'
                      : 'Amount will be credited directly to your payout method once approved'}
                  </Text>
                  {refund?.refundedAt && (
                    <Text style={[styles.stepTime, { color: colors.mutedForeground }]}>
                      {formatDate(refund?.refundedAt)}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Payout Details Section */}
            <View style={[styles.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.payoutHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons
                    name={refund?.refundType === 'bank_account' ? 'bank' : 'cellphone-wireless'}
                    size={20}
                    color="#4F46E5"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 0 }]}>
                    Payout Destination
                  </Text>
                </View>

                {status === 'pending' && !isEditing && (
                  <TouchableOpacity
                    onPress={() => setIsEditing(true)}
                    style={styles.editBtn}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Feather name="edit-2" size={13} color="#4F46E5" />
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                )}
              </View>

              {!isEditing ? (
                <View style={styles.payoutDetailsBox}>
                  {refund?.refundType === 'bank_account' || refund?.accountDetails?.accountNumber ? (
                    <>
                      <View style={styles.payoutRow}>
                        <Text style={[styles.payoutLabel, { color: colors.mutedForeground }]}>Account Number</Text>
                        <TouchableOpacity
                          style={styles.copyableRow}
                          onPress={() =>
                            copyToClipboard(refund?.accountDetails?.accountNumber || '', 'acc')
                          }
                        >
                          <Text style={[styles.payoutVal, { color: colors.foreground }]}>
                            {refund?.accountDetails?.accountNumber || '—'}
                          </Text>
                          <Feather
                            name={copiedKey === 'acc' ? 'check' : 'copy'}
                            size={12}
                            color={copiedKey === 'acc' ? '#10B981' : colors.mutedForeground}
                            style={{ marginLeft: 6 }}
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.payoutRow}>
                        <Text style={[styles.payoutLabel, { color: colors.mutedForeground }]}>IFSC Code</Text>
                        <TouchableOpacity
                          style={styles.copyableRow}
                          onPress={() =>
                            copyToClipboard(refund?.accountDetails?.ifscCode || '', 'ifsc')
                          }
                        >
                          <Text style={[styles.payoutVal, { color: colors.foreground }]}>
                            {refund?.accountDetails?.ifscCode || '—'}
                          </Text>
                          <Feather
                            name={copiedKey === 'ifsc' ? 'check' : 'copy'}
                            size={12}
                            color={copiedKey === 'ifsc' ? '#10B981' : colors.mutedForeground}
                            style={{ marginLeft: 6 }}
                          />
                        </TouchableOpacity>
                      </View>

                      <View style={styles.payoutRow}>
                        <Text style={[styles.payoutLabel, { color: colors.mutedForeground }]}>Account Holder</Text>
                        <Text style={[styles.payoutVal, { color: colors.foreground }]}>
                          {refund?.accountDetails?.accountHolderName || '—'}
                        </Text>
                      </View>

                      {!!refund?.accountDetails?.bankName && (
                        <View style={styles.payoutRow}>
                          <Text style={[styles.payoutLabel, { color: colors.mutedForeground }]}>Bank Name</Text>
                          <Text style={[styles.payoutVal, { color: colors.foreground }]}>
                            {refund.accountDetails.bankName}
                          </Text>
                        </View>
                      )}
                    </>
                  ) : refund?.upiId ? (
                    <View style={styles.payoutRow}>
                      <Text style={[styles.payoutLabel, { color: colors.mutedForeground }]}>UPI ID</Text>
                      <TouchableOpacity
                        style={styles.copyableRow}
                        onPress={() => copyToClipboard(refund.upiId || '', 'upi')}
                      >
                        <Text style={[styles.payoutVal, { color: colors.foreground }]}>{refund.upiId}</Text>
                        <Feather
                          name={copiedKey === 'upi' ? 'check' : 'copy'}
                          size={12}
                          color={copiedKey === 'upi' ? '#10B981' : colors.mutedForeground}
                          style={{ marginLeft: 6 }}
                        />
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ paddingVertical: 4, gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Feather name="refresh-cw" size={14} color="#4F46E5" />
                        <Text style={[styles.payoutVal, { color: colors.foreground, fontFamily: 'Outfit-SemiBold' }]}>
                          Original Payment Method
                        </Text>
                      </View>
                      <Text style={{ color: colors.mutedForeground, fontSize: 12.5, lineHeight: 18 }}>
                        Refund will be credited back directly to the original account, card, or UPI app used during booking.
                      </Text>
                    </View>
                  )}
                </View>
              ) : (
                /* Edit Mode Form */
                <View style={styles.editForm}>
                  <View style={styles.typeSelector}>
                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        editType === 'original_payment' && { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
                      ]}
                      onPress={() => setEditType('original_payment')}
                    >
                      <Text
                        style={[
                          styles.typeBtnText,
                          { color: editType === 'original_payment' ? '#FFF' : colors.mutedForeground },
                        ]}
                      >
                        Original
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        editType === 'upi' && { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
                      ]}
                      onPress={() => setEditType('upi')}
                    >
                      <Text
                        style={[
                          styles.typeBtnText,
                          { color: editType === 'upi' ? '#FFF' : colors.mutedForeground },
                        ]}
                      >
                        UPI ID
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.typeBtn,
                        editType === 'bank_account' && { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
                      ]}
                      onPress={() => setEditType('bank_account')}
                    >
                      <Text
                        style={[
                          styles.typeBtnText,
                          { color: editType === 'bank_account' ? '#FFF' : colors.mutedForeground },
                        ]}
                      >
                        Bank Account
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {editType === 'original_payment' ? (
                    <View style={{ paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#F3F4F6', gap: 4 }}>
                      <Text style={{ fontFamily: 'Outfit-Medium', fontSize: 13, color: colors.foreground }}>
                        Return to original payment method
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.mutedForeground, lineHeight: 17 }}>
                        No extra payout details needed. The refund will automatically be credited to the original payment source.
                      </Text>
                    </View>
                  ) : editType === 'upi' ? (
                    <View style={styles.inputGroup}>
                      <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>UPI ID</Text>
                      <TextInput
                        style={[styles.input, { borderColor: colors.border, color: colors.foreground }]}
                        placeholder="e.g. 9876543210@upi or name@okaxis"
                        placeholderTextColor="#9CA3AF"
                        value={upiId}
                        onChangeText={setUpiId}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
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
                          placeholder="e.g. 1234567890"
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

                  <View style={styles.editActions}>
                    <TouchableOpacity
                      style={[styles.cancelBtn, { borderColor: colors.border }]}
                      onPress={() => setIsEditing(false)}
                      disabled={submitting}
                    >
                      <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                      onPress={handleSavePayoutDetails}
                      disabled={submitting}
                    >
                      {submitting ? (
                        <ActivityIndicator size="small" color="#FFF" />
                      ) : (
                        <Text style={styles.saveBtnText}>Save Details</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Note */}
            <View style={[styles.noteBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="info" size={15} color="#4F46E5" style={{ marginTop: 2, marginRight: 8 }} />
              <Text style={[styles.noteText, { color: colors.mutedForeground }]}>
                Refunds are processed to the specified payout method within 24–48 business hours after approval by Mysawari.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold' },
  subtitle: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(150,150,150,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  amountLabel: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  amountValue: { fontSize: 22, fontFamily: 'Inter_700Bold', marginTop: 4 },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
  },
  badgeText: { fontSize: 11, fontFamily: 'Inter_700Bold', letterSpacing: 0.5 },
  sectionCard: {
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 28,
    marginRight: 12,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleActive: { backgroundColor: '#10B981' },
  circlePending: { backgroundColor: '#F59E0B' },
  circlePendingEmpty: { backgroundColor: '#E5E7EB' },
  circleRejected: { backgroundColor: '#EF4444' },
  circleDisabled: { backgroundColor: '#D1D5DB' },
  line: {
    width: 2,
    flex: 1,
    minHeight: 28,
    marginTop: 4,
  },
  lineActive: { backgroundColor: '#10B981' },
  linePending: { backgroundColor: '#E5E7EB' },
  timelineRight: { flex: 1 },
  stepTitle: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  stepDesc: { fontSize: 12, fontFamily: 'Inter_400Regular', marginTop: 2, lineHeight: 17 },
  stepTime: { fontSize: 11, fontFamily: 'Inter_400Regular', marginTop: 4 },
  payoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#EEF2FF',
    gap: 4,
  },
  editBtnText: { color: '#4F46E5', fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  payoutDetailsBox: {
    backgroundColor: 'rgba(150,150,150,0.05)',
    borderRadius: 10,
    padding: 12,
  },
  payoutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  payoutLabel: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  payoutVal: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  copyableRow: { flexDirection: 'row', alignItems: 'center' },
  editForm: { marginTop: 4 },
  typeSelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  typeBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  inputGroup: { marginBottom: 12 },
  inputLabel: { fontSize: 12, fontFamily: 'Inter_500Medium', marginBottom: 4 },
  input: {
    height: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  saveBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveBtnText: { color: '#FFF', fontSize: 13, fontFamily: 'Inter_600SemiBold' },
  noteBox: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  noteText: { flex: 1, fontSize: 12, fontFamily: 'Inter_400Regular', lineHeight: 17 },
  primaryBtn: {
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryBtnText: {
    fontFamily: 'Inter_600SemiBold',
  },
});