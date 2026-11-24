import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Modal, Pressable, ScrollView, StyleSheet, Text, View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTripColors } from '@/components/booking/tripColors';
import { API, BookingSnapshot } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { BookingCard, FONT, RefundTimeline, SectionTitle, refundAmountOf, refundStage, rupees } from '@/components/booking/TripDetailParts';
import { Field } from '@/components/booking/CancelBookingSheet';
import { useKeyboardScroll } from '@/components/common/KeyboardAwareScrollViewCompat';
import { istDayMonthYear, formatTime12 } from '@/utils/sawari';

type PayoutType = 'original_payment' | 'upi' | 'bank_account';
const PAYOUT_OPTIONS = [
  { id: 'original_payment', label: 'Original Source' },
  { id: 'upi', label: 'UPI ID' },
  { id: 'bank_account', label: 'Bank Account' },
] as const;

const STAGE_TAG = {
  none: { label: 'No refund', fg: '#737373', bg: '#F5F5F5' },
  received: { label: 'In review', fg: '#B58703', bg: '#FEF9E7' },
  approved: { label: 'Approved', fg: '#6B5AED', bg: '#EEF0F7' },
  refunded: { label: 'Refunded', fg: '#008758', bg: '#E8F5EF' },
  rejected: { label: 'Rejected', fg: '#DC2626', bg: '#FEF2F2' },
};

const when = (s?: string) => {
  const d = s ? new Date(s) : null;
  return d && !isNaN(d.getTime()) ? `${istDayMonthYear(d)}, ${formatTime12(d)}` : '';
};

/**
 * Refund tracking page, drawn like "Cancellation request" (same header, booking card, timeline and fields).
 * Server calls are unchanged: API.updateRefundPayoutDetails for an existing refund, else API.requestRefund.
 */
export function RefundTrackingModal({ visible, onClose, booking, onRefundUpdated }: {
  visible: boolean;
  onClose: () => void;
  booking: BookingSnapshot;
  onRefundUpdated?: () => void;
}) {
  const c = useTripColors();
  const insets = useSafeAreaInsets();
  const { customer } = useSawari();
  const { data: vehicles = [] } = useVehicles();
  const image = vehicles.find((v) => v.id === booking.vehicleId)?.image;

  const refund = booking?.pendingRefund;
  const stage = refundStage(booking);
  const amount = refundAmountOf(booking);
  const savedType: PayoutType = refund?.refundType === 'bank_account' ? 'bank_account' : refund?.refundType === 'upi' ? 'upi' : 'original_payment';
  const tag = STAGE_TAG[stage];
  const kb = useKeyboardScroll();

  const [editing, setEditing] = useState(false);
  const [payoutType, setPayoutType] = useState<PayoutType>(savedType);
  const [upiId, setUpiId] = useState('');
  const [holder, setHolder] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [bankName, setBankName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  // Each open starts from the details saved on the server.
  useEffect(() => {
    if (!visible) return;
    const a = refund?.accountDetails;
    setEditing(false); setError(null); setSaved(false); setPayoutType(savedType);
    setUpiId(refund?.upiId || '');
    setHolder(a?.accountHolderName || customer?.name || '');
    setAccountNumber(a?.accountNumber || ''); setConfirmAccount(a?.accountNumber || '');
    setIfsc(a?.ifscCode || ''); setBankName(a?.bankName || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const copy = async (text: string, key: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const payoutError = (): string | null => {
    if (payoutType === 'original_payment') return null;
    if (payoutType === 'upi') return upiId.trim().includes('@') ? null : 'Enter a valid UPI ID (for example 9876543210@upi).';
    if (!holder.trim()) return 'Enter the account holder name.';
    if (!accountNumber.trim()) return 'Enter the account number.';
    if (accountNumber.trim() !== confirmAccount.trim()) return 'The account numbers don’t match.';
    if (ifsc.trim().length < 4) return 'Enter a valid IFSC code.';
    return null;
  };

  const save = async () => {
    const pe = payoutError();
    if (pe) { setError(pe); return; }
    setError(null);
    setSaving(true);
    const payout = {
      refundType: payoutType,
      upiId: payoutType === 'upi' ? upiId.trim() : undefined,
      accountDetails: payoutType === 'bank_account'
        ? { accountNumber: accountNumber.trim(), ifscCode: ifsc.trim().toUpperCase(), accountHolderName: holder.trim(), bankName: bankName.trim() }
        : undefined,
    };
    try {
      if (refund?.id) {
        await API.updateRefundPayoutDetails(refund.id, payout);
      } else {
        await API.requestRefund({
          bookingId: booking.id,
          amount,
          reason: 'Booking Cancelled',
          customerId: customer?.id || '',
          customerMobile: customer?.mobile || booking.customerMobile || '',
          ...payout,
        });
      }
      setEditing(false);
      setSaved(true);
      onRefundUpdated?.();
    } catch (e: any) {
      setError(e?.message || 'Couldn’t save your payout details. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Payout details can only change while the refund is still in review.
  const canEdit = stage === 'received';
  const dates = [
    ['Requested', when(refund?.requestedAt || booking?.cancelledAt)],
    [stage === 'rejected' ? 'Rejected' : 'Approved', when(refund?.approvedAt || refund?.rejectedAt)],
    ['Refunded', when(refund?.refundedAt)],
  ].filter(([, v]) => !!v);

  const DetailRow = ({ label, value, copyKey }: { label: string; value?: string; copyKey?: string }) => (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: c.mutedForeground }]}>{label}</Text>
      <Pressable disabled={!copyKey || !value} onPress={() => copy(value || '', copyKey || '')} style={styles.rowValueWrap} hitSlop={6}>
        <Text style={[styles.rowValue, { color: c.foreground }]} numberOfLines={1}>{value || '—'}</Text>
        {!!copyKey && !!value && (
          <Feather name={copied === copyKey ? 'check' : 'copy'} size={12} color={copied === copyKey ? c.success : c.mutedForeground} />
        )}
      </Pressable>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior="padding">
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <Pressable onPress={onClose} style={styles.back} accessibilityLabel="Back" hitSlop={8}>
            <Feather name="chevron-left" size={24} color={c.mutedForeground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: c.foreground }]}>Refund tracking</Text>
        </View>

        <ScrollView {...kb.scrollProps} contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
          <BookingCard booking={booking} image={image} compact />

          {/* Amount + status */}
          <View style={[styles.notice, { backgroundColor: c.lightBlue, borderColor: '#E7EAF4' }]}>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[styles.noticeLabel, { color: c.mutedForeground }]}>Refund amount</Text>
              <Text style={[styles.amount, { color: stage === 'refunded' ? c.success : c.foreground }]}>{rupees(amount)}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: tag.bg }]}>
              <Text style={[styles.tagText, { color: tag.fg }]}>{tag.label}</Text>
            </View>
          </View>

          {/* Progress */}
          <View style={{ gap: 4 }}>
            <SectionTitle title="Refund status" />
            <RefundTimeline booking={booking} />
            {refund?.transactionReference && stage === 'refunded' ? (
              <View style={{ marginTop: 8 }}><DetailRow label="UTR / reference" value={refund.transactionReference} copyKey="utr" /></View>
            ) : null}
          </View>

          {dates.length > 0 && (
            <View style={[styles.box, { borderColor: c.segBorder }]}>
              {dates.map(([label, value]) => <DetailRow key={label} label={label} value={value} />)}
            </View>
          )}

          {/* Payout destination */}
          {stage !== 'none' && (
            <View style={{ gap: 12 }}>
              <View style={styles.sectionRow}>
                <Text style={[styles.section, { color: c.foreground }]}>
                  {editing ? `Where should we send ${rupees(amount)}?` : 'Payout destination'}
                </Text>
                {canEdit && !editing && (
                  <Pressable onPress={() => { setSaved(false); setEditing(true); }} hitSlop={8} style={styles.editLink} accessibilityRole="button">
                    <Feather name="edit-2" size={13} color={c.navy} />
                    <Text style={[styles.editText, { color: c.navy }]}>Edit</Text>
                  </Pressable>
                )}
              </View>

              {editing ? (
                <>
                  <View style={styles.switchRow}>
                    {PAYOUT_OPTIONS.map((t) => {
                      const on = payoutType === t.id;
                      return (
                        <Pressable
                          key={t.id}
                          onPress={() => setPayoutType(t.id)}
                          style={[styles.switchBtn, { borderColor: on ? c.navy : c.border, backgroundColor: on ? c.navy : c.card }]}
                          accessibilityRole="radio"
                          accessibilityState={{ checked: on }}
                        >
                          <Text style={{ fontFamily: FONT.semibold, fontSize: 11.5, color: on ? '#FFFFFF' : c.mutedForeground }}>{t.label}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                  {payoutType === 'original_payment' ? (
                    <OriginalBox amount={amount} />
                  ) : payoutType === 'upi' ? (
                    <Field onFocus={kb.onFocus} label="UPI ID" value={upiId} onChange={setUpiId} placeholder="e.g. 9876543210@upi" />
                  ) : (
                    <>
                      <Field onFocus={kb.onFocus} label="Account holder name" value={holder} onChange={setHolder} placeholder="e.g. Rahul Sharma" />
                      <Field onFocus={kb.onFocus} label="Account number" value={accountNumber} onChange={setAccountNumber} placeholder="e.g. 123456789012" numeric />
                      <Field onFocus={kb.onFocus} label="Confirm account number" value={confirmAccount} onChange={setConfirmAccount} placeholder="Re-enter account number" numeric />
                      <Field onFocus={kb.onFocus} label="IFSC code" value={ifsc} onChange={(t) => setIfsc(t.toUpperCase())} placeholder="e.g. SBIN0001234" caps />
                      <Field onFocus={kb.onFocus} label="Bank name (optional)" value={bankName} onChange={setBankName} placeholder="e.g. State Bank of India" />
                    </>
                  )}
                </>
              ) : savedType === 'original_payment' ? (
                <OriginalBox amount={amount} />
              ) : (
                <View style={[styles.box, { borderColor: c.segBorder }]}>
                  {savedType === 'upi' ? (
                    <DetailRow label="UPI ID" value={refund?.upiId} copyKey="upi" />
                  ) : (
                    <>
                      <DetailRow label="Account holder" value={refund?.accountDetails?.accountHolderName} />
                      <DetailRow label="Account number" value={refund?.accountDetails?.accountNumber} copyKey="acc" />
                      <DetailRow label="IFSC code" value={refund?.accountDetails?.ifscCode} copyKey="ifsc" />
                      {!!refund?.accountDetails?.bankName && <DetailRow label="Bank name" value={refund.accountDetails.bankName} />}
                    </>
                  )}
                </View>
              )}
              {saved && <Text style={[styles.note, { color: c.success }]}>Payout details saved.</Text>}
            </View>
          )}

          <Text style={[styles.note, { color: c.mutedForeground }]}>
            Refunds are sent to your payout method within 5–7 business days after approval by MySawari.
          </Text>
        </ScrollView>

        {editing && (
          <View style={[styles.bottom, { paddingBottom: Math.max(insets.bottom, 8) + 8, backgroundColor: c.background }]}>
            {!!error && <Text style={[styles.note, { color: c.destructive }]}>{error}</Text>}
            <View style={styles.ctaRow}>
              <Pressable
                disabled={saving}
                onPress={() => { setEditing(false); setError(null); }}
                style={({ pressed }) => [styles.cta, styles.ctaGhost, { borderColor: c.segBorder, opacity: pressed ? 0.85 : 1 }]}
              >
                <Text style={[styles.ctaText, { color: c.mutedForeground }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Cancel</Text>
              </Pressable>
              <Pressable
                disabled={saving}
                onPress={save}
                style={({ pressed }) => [styles.cta, { flex: 1.4, backgroundColor: c.primary, opacity: pressed ? 0.85 : 1 }]}
              >
                {saving ? <ActivityIndicator color={c.primaryForeground} /> : <Text style={[styles.ctaText, { color: c.primaryForeground }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>Save details</Text>}
              </Pressable>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

function OriginalBox({ amount }: { amount: number }) {
  const c = useTripColors();
  return (
    <View style={[styles.originalBox, { backgroundColor: c.lightBlue, borderColor: '#E7EAF4' }]}>
      <Feather name="refresh-cw" size={16} color={c.navy} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={[styles.originalTitle, { color: c.foreground }]}>Original Payment Method</Text>
        <Text style={[styles.originalDesc, { color: c.mutedForeground }]}>
          {rupees(amount)} will be credited back to the account / card / UPI used during booking.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  back: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontFamily: FONT.semibold, fontSize: 19, lineHeight: 28 },
  body: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 24, gap: 16 },
  notice: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
  noticeLabel: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 17 },
  amount: { fontFamily: FONT.bold, fontSize: 22, lineHeight: 30 },
  tag: { borderRadius: 6, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontFamily: FONT.semibold, fontSize: 11, lineHeight: 16 },
  box: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 6 },
  rowLabel: { fontFamily: FONT.medium, fontSize: 12, lineHeight: 18 },
  rowValueWrap: { flexShrink: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  rowValue: { flexShrink: 1, fontFamily: FONT.semibold, fontSize: 13, lineHeight: 20 },
  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  section: { flex: 1, fontFamily: FONT.semibold, fontSize: 15, lineHeight: 23 },
  editLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editText: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 20 },
  switchRow: { flexDirection: 'row', gap: 8 },
  switchBtn: { flex: 1, minHeight: 38, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  originalBox: { flexDirection: 'row', gap: 10, borderWidth: 1, borderRadius: 8, padding: 12, alignItems: 'flex-start' },
  originalTitle: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 18 },
  originalDesc: { fontFamily: FONT.medium, fontSize: 11.5, lineHeight: 17 },
  note: { fontFamily: FONT.medium, fontSize: 12, lineHeight: 18 },
  bottom: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  ctaRow: { flexDirection: 'row', gap: 10 },
  cta: { flex: 1, minHeight: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ctaGhost: { borderWidth: 1 },
  ctaText: { fontFamily: FONT.semibold, fontSize: 17, lineHeight: 26 },
});
