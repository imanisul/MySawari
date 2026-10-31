import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTripColors } from '@/components/booking/tripColors';
import { API, BookingSnapshot } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { BookingCard, FONT, refundQuote, rupees } from '@/components/booking/TripDetailParts';
import { ModalBlur } from '@/components/common/ModalBlur';

const REASONS = [
  'My plans have changed',
  'I need different dates or timings',
  'I want a different vehicle',
  'Pricing or payment concerns',
];

/**
 * "Cancellation request" screen (Figma: Booking → Cancellation request, eligible / not eligible / request submitted).
 * Same props as before, so BookingsScreen and BookingDetailScreen open it unchanged.
 * Server calls are the ones the app already made: API.cancelBooking, then API.requestRefund when a refund is due.
 */
export function CancelBookingSheet({
  visible, onClose, booking, onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  booking: BookingSnapshot;
  onSuccess: (updatedSnapshot: BookingSnapshot) => void;
}) {
  const c = useTripColors();
  const insets = useSafeAreaInsets();
  const { customer } = useSawari();
  const { data: vehicles = [] } = useVehicles();
  const image = vehicles.find((v) => v.id === booking.vehicleId)?.image;
  const { eligible, refund } = refundQuote(booking);

  const [reason, setReason] = useState<string | null>(null);
  const [typed, setTyped] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<BookingSnapshot | null>(null);
  const [refundNote, setRefundNote] = useState<string | null>(null);

  // Where the refund is paid (the refund request needs it; it can also be changed later from Trip Details).
  const [payoutType, setPayoutType] = useState<'original_payment' | 'upi' | 'bank_account'>('original_payment');
  const [upiId, setUpiId] = useState('');
  const [holder, setHolder] = useState(customer?.name || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');

  useEffect(() => {
    if (visible) {
      setReason(null); setTyped(''); setAgreed(false); setError(null); setDone(null); setRefundNote(null);
    }
  }, [visible]);

  const finalReason = [reason, typed.trim()].filter(Boolean).join(' — ');
  const canSubmit = !!finalReason && agreed && !loading;

  const payoutError = (): string | null => {
    if (refund <= 0) return null;
    if (payoutType === 'original_payment') return null;
    if (payoutType === 'upi') return upiId.trim().includes('@') ? null : 'Enter a valid UPI ID (for example 9876543210@upi) to receive your refund.';
    if (!holder.trim()) return 'Enter the account holder name.';
    if (!accountNumber.trim()) return 'Enter the account number.';
    if (accountNumber.trim() !== confirmAccount.trim()) return 'The account numbers don’t match.';
    if (ifsc.trim().length < 4) return 'Enter a valid IFSC code.';
    return null;
  };

  const submit = async () => {
    const pe = payoutError();
    if (pe) { setError(pe); return; }
    setError(null);
    setLoading(true);
    try {
      const payoutPayload = refund > 0 ? {
        refundType: payoutType,
        upiId: payoutType === 'upi' ? upiId.trim() : undefined,
        accountDetails: payoutType === 'bank_account'
          ? { accountNumber: accountNumber.trim(), ifscCode: ifsc.trim().toUpperCase(), accountHolderName: holder.trim(), bankName: bankName.trim() }
          : undefined,
      } : undefined;

      const res = await API.cancelBooking(booking.id, finalReason, booking, payoutPayload);
      if (!res.success) throw new Error('The booking could not be cancelled. Please try again or contact support.');
      if (refund > 0) {
        // The booking is already cancelled at this point: ensure refund details are synced to database
        try {
          await API.requestRefund({
            bookingId: booking.id,
            amount: refund,
            reason: finalReason || 'Booking Cancelled',
            customerId: customer?.id || '',
            customerMobile: customer?.mobile || booking.customerMobile || '',
            refundType: payoutType,
            upiId: payoutType === 'upi' ? upiId.trim() : undefined,
            accountDetails: payoutType === 'bank_account'
              ? { accountNumber: accountNumber.trim(), ifscCode: ifsc.trim().toUpperCase(), accountHolderName: holder.trim(), bankName: bankName.trim() }
              : undefined,
          });
        } catch (e: any) {
          if (__DEV__) console.warn('Secondary requestRefund warning:', e?.message);
        }
      }
      setDone(res.snapshot);
    } catch (e: any) {
      setError(e?.message || 'Cancellation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeSubmitted = () => {
    const snap = done;
    setDone(null);
    if (snap) onSuccess(snap);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={done ? closeSubmitted : onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={onClose} style={styles.back} accessibilityLabel="Back" hitSlop={8}>
            <Feather name="chevron-left" size={24} color={c.mutedForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Cancellation request</Text>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <BookingCard booking={booking} image={image} compact />

          {/* Refund eligibility */}
          {/* Design: grey box when refundable; white box with a pink border and red title when not. */}
          <View style={[styles.notice, eligible ? { backgroundColor: c.lightBlue, borderColor: '#E7EAF4' } : { backgroundColor: c.background, borderColor: '#FEF2F2' }]}>
            <Text style={[styles.noticeTitle, { color: eligible ? c.foreground : c.destructive }]}>
              {eligible ? 'You’re eligible for a full refund' : 'You’re not eligible for a full refund'}
            </Text>
            <Text style={[styles.noticeBody, { color: c.mutedForeground }]}>
              {eligible
                ? `You’re cancelling more than 24 hours before pickup. Your ${rupees(booking.onlinePayableNow)} booking amount is refundable under the applicable cancellation policy.`
                : `Your booking was canceled less than 24 hours before pickup. As per our cancellation policy, the ${rupees(booking.onlinePayableNow)} booking amount is non-refundable.`}
            </Text>
          </View>

          {/* Reason */}
          <View style={{ gap: 12 }}>
            <Text style={[styles.section, { color: c.foreground }]}>Why are you cancelling?</Text>
            <View style={{ gap: 8 }}>
              {REASONS.map((r) => {
                const on = reason === r;
                return (
                  <Pressable key={r} onPress={() => setReason(on ? null : r)} style={styles.radioRow} accessibilityRole="radio" accessibilityState={{ checked: on }}>
                    <View style={[styles.radio, { borderColor: on ? c.navy : '#BFC3D4', backgroundColor: c.background }]}>
                      {on && <View style={[styles.radioDot, { backgroundColor: c.navy }]} />}
                    </View>
                    <Text style={[styles.radioText, { color: c.foreground }]}>{r}</Text>
                  </Pressable>
                );
              })}
            </View>
            <TextInput
              value={typed}
              onChangeText={setTyped}
              placeholder="Type your reason"
              placeholderTextColor={c.mutedForeground}
              multiline
              style={[styles.input, styles.reasonInput, { borderColor: c.segBorder, backgroundColor: c.background, color: c.foreground }]}
            />
          </View>

          {/* Refund payout details (needed for the refund request) */}
          {refund > 0 && (
            <View style={{ gap: 12 }}>
              <Text style={[styles.section, { color: c.foreground }]}>Where should we send {rupees(refund)}?</Text>
              <View style={styles.switchRow}>
                {([
                  { id: 'original_payment', label: 'Original Source' },
                  { id: 'upi', label: 'UPI ID' },
                  { id: 'bank_account', label: 'Bank Account' },
                ] as const).map((t) => {
                  const on = payoutType === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => setPayoutType(t.id)}
                      style={[styles.switchBtn, { borderColor: on ? c.navy : c.border, backgroundColor: on ? c.navy : c.card }]}
                    >
                      <Text style={{ fontFamily: FONT.semibold, fontSize: 11.5, color: on ? '#FFFFFF' : c.mutedForeground }}>
                        {t.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {payoutType === 'original_payment' ? (
                <View style={[styles.originalBox, { backgroundColor: c.lightBlue, borderColor: '#E7EAF4' }]}>
                  <Feather name="refresh-cw" size={16} color={c.navy} style={{ marginTop: 2 }} />
                  <View style={{ flex: 1, gap: 3 }}>
                    <Text style={[styles.originalTitle, { color: c.foreground }]}>Original Payment Method</Text>
                    <Text style={[styles.originalDesc, { color: c.mutedForeground }]}>
                      Refund of {rupees(refund)} will be credited back directly to the source account / card / UPI used during booking within 5–7 business days after approval.
                    </Text>
                  </View>
                </View>
              ) : payoutType === 'upi' ? (
                <Field label="UPI ID" value={upiId} onChange={setUpiId} placeholder="e.g. 9876543210@upi" />
              ) : (
                <>
                  <Field label="Account holder name" value={holder} onChange={setHolder} placeholder="e.g. Rahul Sharma" />
                  <Field label="Account number" value={accountNumber} onChange={setAccountNumber} placeholder="e.g. 123456789012" numeric />
                  <Field label="Confirm account number" value={confirmAccount} onChange={setConfirmAccount} placeholder="Re-enter account number" numeric />
                  <Field label="IFSC code" value={ifsc} onChange={(t) => setIfsc(t.toUpperCase())} placeholder="e.g. SBIN0001234" caps />
                  <Field label="Bank name (optional)" value={bankName} onChange={setBankName} placeholder="e.g. State Bank of India" />
                </>
              )}
            </View>
          )}
        </ScrollView>

        {/* Policy + CTA */}
        <View style={[styles.bottom, { paddingBottom: insets.bottom + 8, backgroundColor: c.background }]}>
          <Pressable onPress={() => setAgreed(!agreed)} style={styles.agreeRow} accessibilityRole="checkbox" accessibilityState={{ checked: agreed }}>
            <View style={[styles.check, { borderColor: agreed ? c.navy : '#BFC3D4', backgroundColor: agreed ? c.navy : 'transparent' }]}>
              {agreed && <Feather name="check" size={12} color="#FFFFFF" />}
            </View>
            <Text style={[styles.agreeText, { color: c.mutedForeground }]}>
              I agree to the rental terms, cancellation policy, and vehicle usage guidelines.
            </Text>
          </Pressable>
          {!!error && <Text style={[styles.error, { color: c.destructive }]}>{error}</Text>}
          <Pressable
            disabled={!canSubmit}
            onPress={submit}
            style={({ pressed }) => [styles.cta, { backgroundColor: canSubmit ? c.primary : c.disabledBg, opacity: pressed ? 0.85 : 1 }]}
          >
            {loading ? (
              <ActivityIndicator color={c.primaryForeground} />
            ) : (
              <Text style={[styles.ctaText, { color: canSubmit ? c.primaryForeground : c.disabledText }]}>Cancellation request</Text>
            )}
          </Pressable>
        </View>

        {/* Request submitted */}
        {!!done && (
          <View style={[StyleSheet.absoluteFill, styles.popupOverlay, { backgroundColor: 'transparent' }]}>
            <ModalBlur />
            <LinearGradient colors={['#FFFFFF', '#EAECF1']} style={styles.popup}>
              <View style={{ alignItems: 'center', gap: 8 }}>
                <View style={[styles.popupIcon, { backgroundColor: c.navy }]}>
                  <Feather name="check" size={20} color="#FFFFFF" />
                </View>
                <View style={{ gap: 4, alignSelf: 'stretch' }}>
                  <Text style={[styles.popupTitle, { color: c.foreground }]}>Request submitted</Text>
                  <Text style={[styles.popupBody, { color: c.mutedForeground }]}>
                    We’ve received your cancellation request. Our team will review it and update you on the next steps.
                  </Text>
                </View>
              </View>
              <View style={[styles.next, { backgroundColor: c.background, borderColor: '#EAECF1' }]}>
                <Text style={[styles.nextTitle, { color: c.foreground }]}>What’s next</Text>
                <View style={styles.nextDashes}>
                  {Array.from({ length: 40 }, (_, i) => <View key={i} style={styles.nextDash} />)}
                </View>
                <View style={{ gap: 6 }}>
                  {['We’ll review your cancellation request.', 'We’ll confirm your refund eligibility and amount.', 'We’ll share your refund status and timeline.'].map((t) => (
                    <View key={t} style={styles.nextRow}>
                      <Feather name="check-circle" size={12} color={c.navy} />
                      <Text style={[styles.nextText, { color: c.mutedForeground }]}>{t}</Text>
                    </View>
                  ))}
                </View>
              </View>
              {!!refundNote && <Text style={[styles.error, { color: c.warning, textAlign: 'center' }]}>{refundNote}</Text>}
            </LinearGradient>
            <Pressable onPress={closeSubmitted} style={[styles.popupClose, { backgroundColor: '#FAFAFA' }]} accessibilityLabel="Close">
              <Feather name="x" size={20} color={c.mutedForeground} />
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Field({ label, value, onChange, placeholder, numeric, caps }: {
  label: string; value: string; onChange: (t: string) => void; placeholder: string; numeric?: boolean; caps?: boolean;
}) {
  const c = useTripColors();
  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontFamily: FONT.medium, fontSize: 12, color: c.mutedForeground }}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={c.mutedForeground}
        keyboardType={numeric ? 'number-pad' : 'default'}
        autoCapitalize={caps ? 'characters' : 'none'}
        autoCorrect={false}
        style={[styles.input, { borderColor: c.segBorder, backgroundColor: c.background, color: c.foreground }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  back: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONT.semibold, fontSize: 19, lineHeight: 28 },
  body: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 16 },
  notice: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12, gap: 2 },
  noticeTitle: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 20 },
  noticeBody: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 17 },
  section: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 23 },
  radioRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 20 },
  radio: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  radioDot: { width: 4, height: 4, borderRadius: 2 },
  radioText: { fontFamily: FONT.medium, fontSize: 13, lineHeight: 20 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, height: 46, fontFamily: FONT.medium, fontSize: 13 },
  reasonInput: { minHeight: 46, height: undefined, paddingVertical: 12, lineHeight: 20, textAlignVertical: 'top' },
  switchRow: { flexDirection: 'row', gap: 8 },
  switchBtn: { flex: 1, height: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bottom: { paddingHorizontal: 16, paddingTop: 8, gap: 16 },
  agreeRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  check: { width: 16, height: 16, borderRadius: 4, borderWidth: 1, marginTop: 2, alignItems: 'center', justifyContent: 'center' },
  agreeText: { flex: 1, fontFamily: FONT.medium, fontSize: 13, lineHeight: 20 },
  error: { fontFamily: FONT.medium, fontSize: 13, lineHeight: 18 },
  cta: { height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaText: { fontFamily: FONT.semibold, fontSize: 17, lineHeight: 26 },
  popupOverlay: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, gap: 8 },
  popup: { width: '100%', maxWidth: 320, borderRadius: 20, borderWidth: 1, borderColor: '#EAECF1', paddingTop: 20, paddingHorizontal: 12, paddingBottom: 12, gap: 16 },
  // Figma: 33px navy circle with a white check, centred in a 40px slot.
  popupIcon: { width: 33, height: 33, borderRadius: 17, marginVertical: 3.5, alignItems: 'center', justifyContent: 'center' },
  popupTitle: { fontFamily: FONT.semibold, fontSize: 17, lineHeight: 26, textAlign: 'center' },
  popupBody: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 16, textAlign: 'center' },
  next: { borderWidth: 1, borderRadius: 10, paddingTop: 10, paddingHorizontal: 12, paddingBottom: 14, gap: 8 },
  nextTitle: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 20 },
  nextDashes: { flexDirection: 'row', gap: 3, overflow: 'hidden' },
  nextDash: { width: 4, height: 1, backgroundColor: '#EAECF1' },
  nextRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextText: { flex: 1, fontFamily: FONT.medium, fontSize: 11, lineHeight: 17 },
  popupClose: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  originalBox: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 8, padding: 12, alignItems: 'flex-start' },
  originalTitle: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 18 },
  originalDesc: { fontFamily: FONT.medium, fontSize: 11.5, lineHeight: 17 },
});