import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, RefreshControl, Modal, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Alert, LayoutAnimation } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { ScreenHeader, StatusTimeline, Step, Dashes, PF, longStamp, rupees } from '@/components/profile/ProfileParts';
import { ModalBlur } from '@/components/common/ModalBlur';

type Tx = { id: string; type: string; label?: string; description?: string; amount: number; date: string; status?: string; reason?: string };
type WStage = 'processing' | 'review' | 'approved' | 'completed' | 'rejected';

/** Where a withdrawal request is, from the status the operations team sets on the transaction. */
function stageOf(t: Tx): WStage {
  const s = String(t.status || '').toUpperCase();
  if (['REJECTED', 'FAILED', 'DECLINED', 'CANCELLED'].includes(s)) return 'rejected';
  if (['PROCESSED', 'COMPLETED', 'PAID', 'SUCCESS', 'TRANSFERRED'].includes(s)) return 'completed';
  if (s === 'APPROVED') return 'approved';
  if (['UNDER_REVIEW', 'REVIEW', 'IN_REVIEW', 'VERIFYING'].includes(s)) return 'review';
  return 'processing';
}

function withdrawalSteps(stage: WStage, reason?: string): Step[] {
  const submitted: Step = { title: 'Request Submitted', sub: 'Your withdrawal request has been received successfully.', state: 'done' };
  const review: Step = { title: 'Under Review', sub: 'Your withdrawal request is being verified by our team.', state: stage === 'processing' ? 'todo' : 'done' };
  if (stage === 'rejected') {
    return [submitted, { ...review, state: 'done' }, { title: 'Withdrawal Rejected', sub: reason ? 'Your withdrawal request could not be approved. Please check the reason below.' : 'Your withdrawal request could not be approved. The amount stays in your wallet.', state: 'error' }];
  }
  return [
    submitted,
    review,
    { title: 'Withdrawal Approved', sub: 'Your request has been approved.', state: stage === 'approved' || stage === 'completed' ? 'done' : 'todo' },
    { title: 'Money Transferred', sub: 'Your withdrawal has been processed and sent to your selected bank account.', state: stage === 'completed' ? 'success' : 'todo' },
  ];
}

/**
 * Figma "Wallet": balance with Withdraw, then each withdrawal request (newest first) with its status and a
 * "View breakup" timeline — Processing / Rejected (with the team's reason) / Completed. The request still in
 * progress opens with its breakup. No requests → "Your rewards journey starts here".
 * Data: GET /customers/wallet (balance, withdrawable balance, transactions); POST /customers/wallet/withdraw.
 */
export default function MyWalletScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const { isAuthenticated, fetchWallet } = useSawari();
  const [wallet, setWallet] = useState<{ balance: number; withdrawable: number; txs: Tx[] } | null>(null);
  const [failed, setFailed] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [showWithdraw, setShowWithdraw] = useState(false);

  const load = useCallback(async () => {
    const w: any = await API.getWallet(true);
    if (w?.failed) { setFailed(true); return; }
    setFailed(false);
    const txs: Tx[] = (w.transactions || []).map((t: any, i: number) => ({
      id: String(t.id || t._id || i),
      type: String(t.type || '').toLowerCase(),
      label: t.label || t.description,
      amount: Number(t.amount) || 0,
      date: t.date || t.createdAt,
      status: t.status,
      reason: t.rejectionReason || t.reason || t.adminNote,
    })).sort((a: Tx, b: Tx) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setWallet({ balance: Number(w.walletBalance) || 0, withdrawable: Number(w.withdrawableBalance) || 0, txs }); // only what the server says can be withdrawn
    // The first withdrawal still in progress opens with its breakup (design).
    setOpen((cur) => {
      if (cur.size) return cur;
      const live = txs.find((t) => t.type === 'withdrawal' && !['completed', 'rejected'].includes(stageOf(t)));
      return live ? new Set([live.id]) : cur;
    });
  }, []);

  useFocusEffect(useCallback(() => { if (isAuthenticated) load(); }, [isAuthenticated, load]));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const toggle = (id: string) => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen((cur) => {
      const next = new Set(cur);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const statusLook = (st: WStage) =>
    st === 'rejected' ? { label: 'Rejected', color: '#EF4444' }
      : st === 'completed' ? { label: 'Completed', color: p.green }
        : st === 'approved' ? { label: 'Approved', color: p.navy }
          : st === 'review' ? { label: 'Under review…', color: p.navy }
            : { label: 'Processing…', color: p.navy };

  const balance = wallet?.balance ?? 0;
  // Design: the wallet lists withdrawal requests.
  const txs = (wallet?.txs ?? []).filter((t) => t.type === 'withdrawal');

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
      <ScreenHeader title="Wallet" />
      <ScrollView
        contentContainerStyle={[styles.content, txs.length === 0 && { flexGrow: 1 }]}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={[styles.balanceCard, { backgroundColor: p.soft, borderColor: p.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.balanceLabel, { color: p.fg }]}>Wallet Balance</Text>
            {wallet ? (
              <Text style={[styles.balance, { color: p.navy }]}>{rupees(balance, true).replace('₹', '₹\u2009')}</Text>
            ) : failed ? (
              <Text style={[styles.balanceErr, { color: p.red }]}>Couldn't load. Pull down to retry.</Text>
            ) : (
              <ActivityIndicator style={{ alignSelf: 'flex-start', marginTop: 8 }} color={p.muted} />
            )}
          </View>
          {!!wallet && wallet.withdrawable > 0 && (
            <Pressable accessibilityRole="button" onPress={() => { Haptics.selectionAsync(); setShowWithdraw(true); }} style={({ pressed }) => [styles.withdrawBtn, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}>
              <Text style={styles.withdrawText}>Withdraw</Text>
            </Pressable>
          )}
        </View>
        {!!wallet && wallet.withdrawable > 0 && wallet.withdrawable < balance && (
          <Text style={[styles.hint, { color: p.muted }]}>{rupees(wallet.withdrawable, true)} can be withdrawn. The rest can be used on your bookings.</Text>
        )}

        {wallet && txs.length === 0 && (
          <View style={styles.empty}>
            <Ionicons name="wallet-outline" size={22} color={p.fg} />
            <Text style={[styles.emptyTitle, { color: p.fg }]}>{balance > 0 ? 'No withdrawals yet' : 'Your rewards journey starts here'}</Text>
            <Text style={[styles.emptySub, { color: p.muted }]}>
              {balance > 0
                ? 'Your withdrawal requests and their status will show up here.'
                : 'Share MySawari with your friends and earn rewards when they take their first eligible trip.'}
            </Text>
            <Pressable accessibilityRole="link" onPress={() => router.push('/refer')} hitSlop={8}>
              <Text style={[styles.emptyLink, { color: p.navy }]}>Invite Friends</Text>
            </Pressable>
          </View>
        )}

        <View style={{ gap: 9, marginTop: 17 }}>
          {txs.map((t) => {
            if (t.type === 'withdrawal') {
              const st = stageOf(t);
              const look = statusLook(st);
              const isOpen = open.has(t.id);
              return (
                <View key={t.id} style={[styles.card, { borderColor: p.segBorder }]}>
                  <Pressable accessibilityRole="button" accessibilityState={{ expanded: isOpen }} onPress={() => toggle(t.id)} style={styles.cardTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.when, { color: p.fg }]}>{longStamp(t.date)}</Text>
                      <View style={styles.metaRow}>
                        <Text style={[styles.meta, { color: p.muted }]}>+{rupees(Math.abs(t.amount))}</Text>
                        <View style={[styles.metaDot, { backgroundColor: p.muted }]} />
                        <Text style={[styles.meta, { color: look.color }]}>{look.label}</Text>
                      </View>
                    </View>
                    <View style={styles.breakupRow}>
                      <Text style={[styles.breakup, { color: st === 'completed' ? p.muted : p.navy }]}>View breakup</Text>
                      <Feather name={isOpen ? 'chevron-up' : 'chevron-down'} size={12} color={st === 'completed' ? p.muted : p.navy} />
                    </View>
                  </Pressable>
                  {isOpen && (
                    <>
                      <Dashes color={p.segBorder} />
                      <View style={styles.cardBody}>
                        <Text style={[styles.bodyTitle, { color: p.fg }]}>Withdrawal Request</Text>
                        <StatusTimeline steps={withdrawalSteps(st, t.reason)} />
                        {st === 'rejected' && !!t.reason && (
                          <View style={[styles.reason, { backgroundColor: p.redBg, borderColor: p.redBorder }]}>
                            <Text style={[styles.reasonTitle, { color: p.red }]}>Reason</Text>
                            <Text style={[styles.reasonText, { color: p.sub }]}>{t.reason}</Text>
                          </View>
                        )}
                      </View>
                    </>
                  )}
                </View>
              );
            }
            const credit = t.amount >= 0 && t.type !== 'debit';
            return (
              <View key={t.id} style={[styles.card, styles.cardTop, { borderColor: p.segBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.when, { color: p.fg }]}>{longStamp(t.date)}</Text>
                  <Text style={[styles.meta, { color: p.muted }]} numberOfLines={1}>
                    <Text style={{ color: credit ? p.green : p.red }}>{credit ? '+' : '−'}{rupees(Math.abs(t.amount))}</Text>
                    {t.label ? `  •  ${t.label}` : ''}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {wallet && (
        <WithdrawSheet
          visible={showWithdraw}
          max={wallet.withdrawable}
          onClose={() => setShowWithdraw(false)}
          onDone={async (amount) => {
            setShowWithdraw(false);
            setOpen(new Set());
            await load();
            fetchWallet().catch(() => {});
            Alert.alert('Withdrawal requested', `Your request to withdraw ${rupees(amount)} has been sent to our team. You can follow it here.`);
          }}
        />
      )}
    </SafeAreaView>
  );
}

// ── Withdraw sheet (UPI or bank) → POST /customers/wallet/withdraw ─────────────
function WithdrawSheet({ visible, max, onClose, onDone }: { visible: boolean; max: number; onClose: () => void; onDone: (amount: number) => void }) {
  const p = useDetailsPalette();
  const insets = useSafeAreaInsets();
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'upi' | 'bank'>('upi');
  const [upi, setUpi] = useState('');
  const [bank, setBank] = useState({ accountHolderName: '', accountNumber: '', ifsc: '', bankName: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    const value = Math.floor(Number(amount));
    if (!value || value <= 0) return setError('Enter a valid amount.');
    if (value > max) return setError(`You can withdraw up to ${rupees(max)}.`);
    let details: any;
    if (method === 'upi') {
      if (!/^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(upi.trim())) return setError('Enter a valid UPI ID (e.g. name@okaxis).');
      details = { upiId: upi.trim() };
    } else {
      if (!bank.accountHolderName.trim() || !/^\d{9,18}$/.test(bank.accountNumber.trim()) || !/^[A-Z]{4}0[A-Z0-9]{6}$/i.test(bank.ifsc.trim()) || !bank.bankName.trim()) {
        return setError('Please fill in all bank details correctly.');
      }
      details = { ...bank, ifsc: bank.ifsc.trim().toUpperCase() };
    }
    setBusy(true);
    setError('');
    try {
      await API.requestWithdrawal(value, method, details);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setAmount(''); setUpi(''); setBank({ accountHolderName: '', accountNumber: '', ifsc: '', bankName: '' });
      onDone(value);
    } catch (e: any) {
      setError(e?.message || 'Could not request the withdrawal. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const field = (value: string, onChange: (t: string) => void, placeholder: string, extra: any = {}) => (
    <TextInput
      value={value}
      onChangeText={(t) => { onChange(t); if (error) setError(''); }}
      placeholder={placeholder}
      placeholderTextColor={p.muted}
      style={[styles.input, { borderColor: p.border, color: p.fg }]}
      selectionColor={p.navy}
      {...extra}
    />
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <ModalBlur />
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { backgroundColor: p.page, paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.sheetHead}>
            <Text style={[styles.sheetTitle, { color: p.fg }]}>Withdraw money</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={8}>
              <Feather name="x" size={20} color={p.sub} />
            </Pressable>
          </View>
          <Text style={[styles.sheetSub, { color: p.muted }]}>Up to {rupees(max, true)} can be withdrawn.</Text>
          {field(amount, (t) => setAmount(t.replace(/[^\d]/g, '')), 'Amount (₹)', { keyboardType: 'number-pad' })}
          <View style={styles.methods}>
            {(['upi', 'bank'] as const).map((m) => (
              <Pressable
                key={m}
                accessibilityRole="radio"
                accessibilityState={{ selected: method === m }}
                onPress={() => { Haptics.selectionAsync(); setMethod(m); setError(''); }}
                style={[styles.method, { borderColor: method === m ? p.navy : p.border, backgroundColor: method === m ? p.summary : p.page }]}
              >
                <Text style={[styles.methodText, { color: method === m ? p.navy : p.sub }]}>{m === 'upi' ? 'UPI' : 'Bank account'}</Text>
              </Pressable>
            ))}
          </View>
          {method === 'upi' ? (
            field(upi, setUpi, 'UPI ID (e.g. name@okaxis)', { autoCapitalize: 'none', autoCorrect: false })
          ) : (
            <>
              {field(bank.accountHolderName, (t) => setBank({ ...bank, accountHolderName: t }), 'Account holder name')}
              {field(bank.accountNumber, (t) => setBank({ ...bank, accountNumber: t.replace(/\D/g, '') }), 'Account number', { keyboardType: 'number-pad' })}
              {field(bank.ifsc, (t) => setBank({ ...bank, ifsc: t.toUpperCase() }), 'IFSC code', { autoCapitalize: 'characters', autoCorrect: false })}
              {field(bank.bankName, (t) => setBank({ ...bank, bankName: t }), 'Bank name')}
            </>
          )}
          {!!error && <Text style={[styles.error, { color: p.red }]}>{error}</Text>}
          <Pressable accessibilityRole="button" onPress={submit} disabled={busy} style={({ pressed }) => [styles.submit, { backgroundColor: p.navy }, (pressed || busy) && { opacity: 0.85 }]}>
            {busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitText}>Request withdrawal</Text>}
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  reason: { borderWidth: 1, borderRadius: 8, padding: 10, marginTop: 10 },
  reasonTitle: { fontFamily: PF.medium, fontSize: 12 },
  reasonText: { fontFamily: PF.regular, fontSize: 12, lineHeight: 17, marginTop: 2 },
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },
  balanceCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingTop: 15, paddingBottom: 13 },
  balanceLabel: { fontFamily: PF.regular, fontSize: 14 },
  balance: { fontFamily: PF.medium, fontSize: 26, lineHeight: 34, marginTop: 8 },
  balanceErr: { fontFamily: PF.regular, fontSize: 12, marginTop: 8 },
  withdrawBtn: { height: 29, paddingHorizontal: 11, borderRadius: 7, justifyContent: 'center' },
  withdrawText: { fontFamily: PF.regular, fontSize: 12.5, color: '#FFFFFF' },
  hint: { fontFamily: PF.regular, fontSize: 11.5, lineHeight: 17, marginTop: 6 },
  // Design: the empty message sits in the middle of the space under the balance card.
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingTop: 48, minHeight: 360 },
  emptyTitle: { fontFamily: PF.medium, fontSize: 19.5, lineHeight: 28, marginTop: 14, textAlign: 'center' },
  emptySub: { fontFamily: PF.regular, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 8 },
  emptyLink: { fontFamily: PF.medium, fontSize: 12.5, marginTop: 14 },
  card: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, minHeight: 64 },
  when: { fontFamily: PF.semibold, fontSize: 15, lineHeight: 23 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaDot: { width: 3, height: 3, borderRadius: 2 },
  meta: { fontFamily: PF.semibold, fontSize: 11, lineHeight: 17 },
  breakupRow: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 10 },
  breakup: { fontFamily: PF.semibold, fontSize: 11, lineHeight: 17 },
  cardBody: { padding: 12, gap: 12 },
  bodyTitle: { fontFamily: PF.semibold, fontSize: 15, lineHeight: 23 },
  sheetWrap: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(38,38,38,0.45)' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 18 },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: PF.medium, fontSize: 17 },
  sheetSub: { fontFamily: PF.regular, fontSize: 12, marginTop: 4, marginBottom: 6 },
  input: { height: 46, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, marginTop: 8, fontFamily: PF.regular, fontSize: 14 },
  methods: { flexDirection: 'row', gap: 8, marginTop: 10 },
  method: { flex: 1, height: 38, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  methodText: { fontFamily: PF.medium, fontSize: 13 },
  error: { fontFamily: PF.regular, fontSize: 12, marginTop: 8 },
  submit: { height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  submitText: { fontFamily: PF.semibold, fontSize: 16, color: '#FFFFFF' },
});