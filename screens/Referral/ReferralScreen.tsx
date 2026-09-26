import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  TextInput,
  Share,
  ScrollView,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import { Page, Header, PrimaryButton, KeyboardAwareScrollViewCompat } from '@/components';
import { useColors } from '@/hooks/useColors';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSawari } from '@/context/SawariContext';
import { API, invalidateWalletCache } from '@/services/backend/api';
import { useRouter } from 'expo-router';
import Reanimated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { rise } from '@/components/common/motion';
import { ReferralSkeleton } from '@/components/loading/ScreenSkeletons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import QRCode from 'react-native-qrcode-svg';

// ── Constants ────────────────────────────────────────────────────────────────
const REFERRAL_BASE_URL = 'https://mysawari.com/refer';
const DEVICE_REFERRALS_KEY = '@sawari_device_referrals';
const WITHDRAWALS_KEY = '@sawari_withdrawals';
const SCREEN_WIDTH = Dimensions.get('window').width;

// ── Types ────────────────────────────────────────────────────────────────────
interface WithdrawalRecord {
  id: string;
  amount: number;
  upiId: string;
  status: 'PENDING' | 'PROCESSED' | 'REJECTED';
  requestedAt: string;
  processedAt?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
};

const formatCurrency = (amount: number) => `₹${amount.toLocaleString('en-IN')}`;

export default function ReferScreen() {
  const colors = useColors();
  const router = useRouter();
  const { customer, isAuthenticated, isAuthLoading, sawariCash } = useSawari();
  const insets = useSafeAreaInsets();

  // ── State ────────────────────────────────────────────────────────────────
  const [config, setConfig] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [friendName, setFriendName] = useState('');
  const [friendMobile, setFriendMobile] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addedMessage, setAddedMessage] = useState('');

  // Tabs
  const [mainTab, setMainTab] = useState<'refer' | 'my_referrals'>('refer');
  const [activeTab, setActiveTab] = useState<'referrals' | 'earnings'>('referrals');

  // Withdraw
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank'>('upi');
  const [withdrawUpi, setWithdrawUpi] = useState('');
  const [bankDetails, setBankDetails] = useState({
    accountNumber: '',
    ifsc: '',
    bankName: '',
    accountHolderName: ''
  });
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');
  
  // Wallet
  const [walletBalance, setWalletBalance] = useState(0);
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  // QR
  const [showQrPopup, setShowQrPopup] = useState(false);

  // ── Derived ──────────────────────────────────────────────────────────────
  const referralCode = customer.referralCode || 'SIGNUP-TO-REFER';
  const referralLink = `${REFERRAL_BASE_URL}?code=${referralCode}`;

  const totalEarned = useMemo(
    () => referrals.reduce((sum: number, r: any) => sum + (r.commissionAmount || 0), 0),
    [referrals],
  );
  const completedCount = useMemo(
    () => referrals.filter((r: any) => r.status === 'REWARDED').length,
    [referrals],
  );
  const pendingWithdrawals = useMemo(
    () => transactions.filter(t => t.type === 'withdrawal' && t.status === 'PENDING').reduce((s, t) => s + Math.abs(t.amount), 0),
    [transactions],
  );
  // Real wallet balance from backend overrides local calculation
  const availableToWithdraw = withdrawableBalance;

  // Earnings rows: combine referral rewards with actual wallet transactions
  const earningsHistory = useMemo(() => {
    // Only show transactions as earnings history
    const rows = transactions.map(t => ({
      id: t.id || t._id,
      type: t.type as 'referral' | 'withdrawal',
      label: t.label,
      amount: t.amount,
      date: t.date,
      status: t.status,
    }));

    return rows.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  }, [transactions]);

  // ── Data loading ─────────────────────────────────────────────────────────
  const loadWallet = useCallback(async () => {
    if (!isAuthenticated || !customer.id) return;
    try {
      const w = await API.getWallet(true);
      setWalletBalance(w.walletBalance || 0);
      setWithdrawableBalance(w.withdrawableBalance || 0);
      setTransactions(w.transactions || []);
    } catch {}
  }, [isAuthenticated, customer.id]);

  const refreshReferrals = useCallback(async () => {
    if (!isAuthenticated || !customer.id) return;
    const list = await API.getReferrals(customer.id);
    setReferrals(list);
    await loadWallet();
  }, [isAuthenticated, customer.id, loadWallet]);

  useEffect(() => {
    async function loadData() {
      try {
        const [appConfig, userReferrals] = await Promise.allSettled([
          API.getAppConfig(),
          isAuthenticated && customer.id ? API.getReferrals(customer.id) : Promise.resolve(null),
        ]);
        if (appConfig.status === 'fulfilled') setConfig(appConfig.value);
        if (userReferrals.status === 'fulfilled' && userReferrals.value) {
          setReferrals(userReferrals.value);
          if (userReferrals.value.some((r: any) => r.commissionAmount > 0)) invalidateWalletCache();
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    if (isAuthenticated && customer.id) {
      loadWallet();
    }
  }, [isAuthenticated, customer.id, loadWallet]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleCopy = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(referralCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await Share.share({
        message: `🚗 Hey! Use my MySawari referral code *${referralCode}* to get ₹100 off on your first ride!\n\nDownload now: ${referralLink}`,
        title: 'Share MySawari Referral',
      });
    } catch {}
  };

  const handleAddFriend = async () => {
    const mobile = friendMobile.replace(/\D/g, '').slice(-10);
    setAddedMessage('');
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setAddError('Enter a valid 10-digit mobile number');
      return;
    }

    // Device-level duplicate check
    try {
      const stored = await AsyncStorage.getItem(DEVICE_REFERRALS_KEY);
      const deviceReferrals: string[] = stored ? JSON.parse(stored) : [];
      if (deviceReferrals.includes(mobile)) {
        setAddError('This number has already been referred from this device.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
    } catch {}

    setAdding(true);
    setAddError('');
    try {
      await API.addReferral(mobile, friendName);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Track on device
      try {
        const stored = await AsyncStorage.getItem(DEVICE_REFERRALS_KEY);
        const deviceReferrals: string[] = stored ? JSON.parse(stored) : [];
        deviceReferrals.push(mobile);
        await AsyncStorage.setItem(DEVICE_REFERRALS_KEY, JSON.stringify(deviceReferrals));
      } catch {}

      setFriendName('');
      setFriendMobile('');
      setAddedMessage('Added! You earn 10% once their first trip is completed.');
      await refreshReferrals();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setAddError(e?.message || 'Could not add this number. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount, 10);
    if (!amount || amount <= 0) {
      setWithdrawError('Enter a valid amount');
      return;
    }
    if (amount > availableToWithdraw) {
      setWithdrawError(`Maximum available: ${formatCurrency(availableToWithdraw)}`);
      return;
    }
    
    let details: any = {};
    if (withdrawMethod === 'upi') {
      if (!withdrawUpi.trim() || !withdrawUpi.includes('@')) {
        setWithdrawError('Enter a valid UPI ID (e.g. name@upi)');
        return;
      }
      details = { upiId: withdrawUpi.trim() };
    } else {
      if (!bankDetails.accountNumber.trim() || !bankDetails.ifsc.trim() || !bankDetails.bankName.trim() || !bankDetails.accountHolderName.trim()) {
        setWithdrawError('Please fill all bank details');
        return;
      }
      details = { ...bankDetails };
    }

    setWithdrawing(true);
    setWithdrawError('');

    try {
      await API.requestWithdrawal(amount, withdrawMethod, details);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setWithdrawAmount('');
      setWithdrawUpi('');
      setBankDetails({ accountNumber: '', ifsc: '', bankName: '', accountHolderName: '' });
      setShowWithdraw(false);
      
      await loadWallet();

      Alert.alert(
        'Withdrawal Requested',
        `Your withdrawal of ${formatCurrency(amount)} has been submitted to the operations team. It will be processed soon.`,
        [{ text: 'OK' }],
      );
    } catch (e: any) {
      setWithdrawError(e.message || 'Failed to request withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  // ── Auth loading / unauthenticated states ────────────────────────────────
  if (isAuthLoading) {
    return (
      <Page scroll={false}>
        <Header title="Refer & Earn" back />
        <ReferralSkeleton />
      </Page>
    );
  }

  if (!isAuthenticated) {
    return (
      <Page>
        <Header title="Refer & Earn" back />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Feather name="lock" size={64} color={colors.mutedForeground} style={{ marginBottom: 24 }} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, textAlign: 'center', marginBottom: 12, color: colors.foreground }}>
            Login to Refer & Earn
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, textAlign: 'center', color: colors.mutedForeground, marginBottom: 32 }}>
            Sign in to get your unique referral code and start earning 10% commission on every friend's first ride.
          </Text>
          <View style={{ width: '100%' }}>
            <PrimaryButton
              label="Go to Login"
              onPress={() => router.push('/profile')}
            />
          </View>
        </View>
      </Page>
    );
  }

  if (loading) {
    return (
      <Page scroll={false}>
        <Header title="Refer & Earn" back />
        <ReferralSkeleton />
      </Page>
    );
  }

  const rewardAmountText = config?.referralRewardType === 'PERCENTAGE' ? `${config.referralRewardAmount}% commission` : `₹${config?.referralRewardAmount || 10}`;
  const discountText = config?.referralDiscountType === 'FLAT' ? `₹${config.referralDiscountAmount} off` : `${config?.referralDiscountAmount || 100}% off`;

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Page scroll={false}>
      <Header title="Refer & Earn" back />

      <Reanimated.View entering={rise()} style={{ flex: 1 }}>
        <KeyboardAwareScrollViewCompat bottomOffset={72} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* ═══════════════════════════════════════════════════════════════
              MAIN TABS
             ═══════════════════════════════════════════════════════════════ */}
          <View style={[styles.mainTabBar, { borderBottomColor: colors.border }]}>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: mainTab === 'refer' }}
              onPress={() => setMainTab('refer')}
              style={[styles.mainTab, mainTab === 'refer' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            >
              <Text style={[styles.mainTabText, { color: mainTab === 'refer' ? colors.primary : colors.mutedForeground }]}>Refer & Earn</Text>
            </Pressable>
            <Pressable
              accessibilityRole="tab"
              accessibilityState={{ selected: mainTab === 'my_referrals' }}
              onPress={() => setMainTab('my_referrals')}
              style={[styles.mainTab, mainTab === 'my_referrals' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            >
              <Text style={[styles.mainTabText, { color: mainTab === 'my_referrals' ? colors.primary : colors.mutedForeground }]}>Your Referrals</Text>
            </Pressable>
          </View>

          {mainTab === 'refer' ? (
            <Reanimated.View entering={FadeIn.duration(250)}>
              {/* ═══════════════════════════════════════════════════════════════
                  HERO CARD
                 ═══════════════════════════════════════════════════════════════ */}
              <View style={[styles.heroCard, { backgroundColor: '#111827', borderColor: '#374151' }]}>
                <Text style={[styles.heroTitle, { color: '#FFF' }]}>Refer a friend. Earn together.</Text>

            <View style={styles.rewardsRow}>
              <View style={[styles.rewardPill, { backgroundColor: colors.emerald + '20' }]}>
                <Feather name="gift" size={14} color={colors.emerald} />
                <Text style={[styles.rewardText, { color: colors.emerald }]}>You earn {rewardAmountText}</Text>
              </View>
              <View style={[styles.rewardPill, { backgroundColor: 'rgba(157,176,255,0.16)' }]}>
                <Feather name="user-plus" size={14} color="#9DB0FF" />
                <Text style={[styles.rewardText, { color: '#9DB0FF' }]}>Friend gets {discountText}</Text>
              </View>
            </View>

            {/* How it works */}
            <View style={[styles.stepsContainer, { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }]}>
              <View style={[styles.stepRow, { flex: 1, flexDirection: 'column', gap: 6 }]}>
                <View style={styles.stepCircle}><Text style={styles.stepNumber}>1</Text></View>
                <Text style={[styles.stepText, { textAlign: 'center', fontSize: 11 }]}>Share code</Text>
              </View>
              <View style={[styles.stepRow, { flex: 1, flexDirection: 'column', gap: 6 }]}>
                <View style={styles.stepCircle}><Text style={styles.stepNumber}>2</Text></View>
                <Text style={[styles.stepText, { textAlign: 'center', fontSize: 11 }]}>Friend rides</Text>
              </View>
              <View style={[styles.stepRow, { flex: 1, flexDirection: 'column', gap: 6 }]}>
                <View style={styles.stepCircle}><Text style={styles.stepNumber}>3</Text></View>
                <Text style={[styles.stepText, { textAlign: 'center', fontSize: 11 }]}>You earn 10%</Text>
              </View>
            </View>

            {/* Referral code */}
            <View style={[styles.codeBox, { backgroundColor: '#1F2937', borderColor: '#4B5563' }]}>
              <Text style={styles.codeLabel}>YOUR REFERRAL CODE</Text>
              <Pressable style={styles.codeRow} onPress={handleCopy}>
                <Text style={styles.codeText}>{referralCode}</Text>
                <View style={styles.copyBtn}>
                  {copySuccess ? (
                    <Feather name="check" size={18} color={colors.emerald} />
                  ) : (
                    <Text style={styles.copyBtnText}>COPY</Text>
                  )}
                </View>
              </Pressable>
            </View>

            {/* Generate QR + Share — two buttons side by side */}
            <View style={styles.actionRow}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Generate QR code"
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowQrPopup(true); }}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: '#1F2937', borderColor: '#4B5563', borderWidth: 1, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Feather name="maximize" size={18} color="#D1D5DB" />
                <Text style={[styles.actionBtnText, { color: '#D1D5DB' }]}>Generate QR</Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Share referral link"
                onPress={handleShare}
                style={({ pressed }) => [
                  styles.actionBtn,
                  { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                ]}
              >
                <Feather name="share-2" size={18} color="#101B2E" />
                <Text style={[styles.actionBtnText, { color: '#101B2E' }]}>Share Link</Text>
              </Pressable>
            </View>
          </View>

          {/* ═══════════════════════════════════════════════════════════════
              ADD A FRIEND
             ═══════════════════════════════════════════════════════════════ */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary + '40', borderWidth: 1.5, shadowColor: colors.primary, shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 4 }]}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIconWrap, { backgroundColor: colors.primary + '15' }]}>
                <Feather name="user-plus" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.foreground }]}>Refer a friend</Text>
                <Text style={[styles.cardSubtitle, { color: colors.mutedForeground, fontSize: 12 }]}>
                  Add their number before they book to track commission
                </Text>
              </View>
            </View>

            <TextInput
              style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
              placeholder="Friend's name"
              placeholderTextColor={colors.mutedForeground}
              value={friendName}
              onChangeText={setFriendName}
              maxLength={60}
              autoCapitalize="words"
            />
            <View style={[styles.mobileRow, { backgroundColor: colors.background, borderColor: addError ? colors.destructive : colors.border }]}>
              <Text style={[styles.mobilePrefix, { color: colors.foreground }]}>+91</Text>
              <TextInput
                style={[styles.mobileInput, { color: colors.foreground }]}
                placeholder="10-digit mobile number"
                placeholderTextColor={colors.mutedForeground}
                value={friendMobile}
                onChangeText={(t) => { setFriendMobile(t.replace(/\D/g, '').slice(0, 10)); setAddError(''); setAddedMessage(''); }}
                keyboardType="number-pad"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={handleAddFriend}
              />
            </View>
            {!!addError && <Text style={[styles.addFeedback, { color: colors.destructive }]}>{addError}</Text>}
            {!!addedMessage && <Text style={[styles.addFeedback, { color: colors.success }]}>{addedMessage}</Text>}

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add friend"
              disabled={adding}
              onPress={handleAddFriend}
              style={({ pressed }) => [styles.addBtn, { backgroundColor: colors.primary, opacity: adding ? 0.6 : pressed ? 0.85 : 1 }]}
            >
              {adding ? <ActivityIndicator color="#101B2E" /> : <Feather name="user-plus" size={18} color="#101B2E" />}
              <Text style={styles.addBtnText}>{adding ? 'Adding...' : 'Add friend'}</Text>
            </Pressable>
              </View>
            </Reanimated.View>
          ) : (
            <Reanimated.View entering={FadeIn.duration(250)}>
              {/* ═══════════════════════════════════════════════════════════════
                  EARNINGS DASHBOARD
                 ═══════════════════════════════════════════════════════════════ */}
              <View style={[styles.dashboardCard, { backgroundColor: '#111827', borderColor: '#374151' }]}>
                <View style={styles.dashboardHeader}>
                  <Text style={[styles.dashboardTitle, { color: '#D1D5DB' }]}>Available to Withdraw</Text>
                </View>

                <Text style={[styles.dashboardAmount, { color: '#FFF' }]}>{formatCurrency(availableToWithdraw)}</Text>

                <View style={[styles.dashboardStatsRow, { borderTopColor: '#374151' }]}>
                  <View style={styles.dashboardStatBox}>
                    <Text style={[styles.dashboardStatValue, { color: '#FFF' }]}>{referrals.length}</Text>
                    <Text style={[styles.dashboardStatLabel, { color: '#9CA3AF' }]}>Friends Added</Text>
                  </View>
                  <View style={[styles.dashboardStatDivider, { backgroundColor: '#374151' }]} />
                  <View style={styles.dashboardStatBox}>
                    <Text style={[styles.dashboardStatValue, { color: '#FFF' }]}>{completedCount}</Text>
                    <Text style={[styles.dashboardStatLabel, { color: '#9CA3AF' }]}>Rides Done</Text>
                  </View>
                  <View style={[styles.dashboardStatDivider, { backgroundColor: '#374151' }]} />
                  <View style={styles.dashboardStatBox}>
                    <Text style={[styles.dashboardStatValue, { color: colors.emerald }]}>{formatCurrency(totalEarned)}</Text>
                    <Text style={[styles.dashboardStatLabel, { color: '#9CA3AF' }]}>Total Earned</Text>
                  </View>
                </View>

                <Text style={styles.dashboardInfoText}>
                  Earn {rewardAmountText} on every friend's first ride. Withdraw anytime directly to your UPI.
                </Text>

                {totalEarned > 0 && (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Withdraw earnings"
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setShowWithdraw(true); }}
                    style={({ pressed }) => [
                      styles.dashboardWithdrawBtn,
                      { backgroundColor: colors.emerald, opacity: pressed ? 0.85 : 1 },
                    ]}
                  >
                    <Feather name="download" size={18} color="#111827" />
                    <Text style={[styles.dashboardWithdrawBtnText, { color: '#111827' }]}>Withdraw Earnings</Text>
                  </Pressable>
                )}
              </View>

          {/* ═══════════════════════════════════════════════════════════════
              TABBED SECTION: REFERRALS / EARNINGS
             ═══════════════════════════════════════════════════════════════ */}
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, paddingBottom: 8 }]}>
            {/* Tabs */}
            <View style={[styles.tabBar, { borderBottomColor: colors.border }]}>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'referrals' }}
                onPress={() => setActiveTab('referrals')}
                style={[styles.tab, activeTab === 'referrals' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              >
                <Feather name="users" size={15} color={activeTab === 'referrals' ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.tabText, { color: activeTab === 'referrals' ? colors.primary : colors.mutedForeground }]}>
                  Referrals
                </Text>
              </Pressable>
              <Pressable
                accessibilityRole="tab"
                accessibilityState={{ selected: activeTab === 'earnings' }}
                onPress={() => setActiveTab('earnings')}
                style={[styles.tab, activeTab === 'earnings' && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
              >
                <Feather name="trending-up" size={15} color={activeTab === 'earnings' ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.tabText, { color: activeTab === 'earnings' ? colors.primary : colors.mutedForeground }]}>
                  Earnings
                </Text>
              </Pressable>
            </View>

            {/* Referrals tab */}
            {activeTab === 'referrals' && (
              <Reanimated.View entering={FadeIn.duration(250)}>
                {referrals.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Feather name="users" size={36} color={colors.muted} style={{ marginBottom: 12 }} />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      No referrals yet.{'\n'}Add a friend's number above to get started.
                    </Text>
                  </View>
                ) : (
                  referrals.map((ref: any) => (
                    <View key={ref.id || ref._id || ref.mobileNumber} style={[styles.referralItem, { borderTopColor: colors.border }]}>
                      <View style={[styles.refAvatar, { backgroundColor: ref.status === 'REWARDED' ? colors.emerald + '15' : colors.tintLight }]}>
                        <Feather
                          name={ref.status === 'REWARDED' ? 'check' : ref.status === 'JOINED' ? 'user' : 'phone'}
                          size={16}
                          color={ref.status === 'REWARDED' ? colors.emerald : colors.primaryText}
                        />
                      </View>
                      <View style={styles.refInfo}>
                        <Text style={[styles.refName, { color: colors.foreground }]}>{ref.referredName}</Text>
                        <Text style={[styles.refDate, { color: colors.mutedForeground }]}>
                          {ref.mobileNumber ? `+91 ${ref.mobileNumber} · ` : ''}Added {formatDate(ref.signupAt)}
                        </Text>
                      </View>
                      <View style={styles.refStatus}>
                        {ref.status === 'REWARDED' ? (
                          <View style={[styles.statusBadge, { backgroundColor: colors.emerald + '15' }]}>
                            <Text style={[styles.statusText, { color: colors.emerald }]}>
                              {ref.commissionAmount > 0 ? `+${formatCurrency(ref.commissionAmount)}` : 'Completed'}
                            </Text>
                          </View>
                        ) : ref.status === 'JOINED' ? (
                          <View style={[styles.statusBadge, { backgroundColor: colors.tintLight }]}>
                            <Text style={[styles.statusText, { color: colors.primaryText }]}>Trip pending</Text>
                          </View>
                        ) : (
                          <View style={[styles.statusBadge, { backgroundColor: colors.muted }]}>
                            <Text style={[styles.statusText, { color: colors.mutedForeground }]}>Invited</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  ))
                )}
              </Reanimated.View>
            )}

            {/* Earnings tab */}
            {activeTab === 'earnings' && (
              <Reanimated.View entering={FadeIn.duration(250)}>
                {earningsHistory.length === 0 ? (
                  <View style={styles.emptyState}>
                    <Feather name="trending-up" size={36} color={colors.muted} style={{ marginBottom: 12 }} />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      No earnings yet.{'\n'}Your referral rewards will appear here once friends complete trips.
                    </Text>
                  </View>
                ) : (
                  earningsHistory.map((item) => (
                    <View key={item.id} style={[styles.referralItem, { borderTopColor: colors.border }]}>
                      <View style={[styles.refAvatar, {
                        backgroundColor: item.type === 'referral' ? colors.emerald + '15' : (item.status === 'PENDING' ? '#FFA50020' : colors.tintLight),
                      }]}>
                        <Feather
                          name={item.type === 'referral' ? 'arrow-down-left' : 'arrow-up-right'}
                          size={16}
                          color={item.type === 'referral' ? colors.emerald : (item.status === 'PENDING' ? '#FFA500' : colors.primaryText)}
                        />
                      </View>
                      <View style={styles.refInfo}>
                        <Text style={[styles.refName, { color: colors.foreground }]}>{item.label}</Text>
                        <Text style={[styles.refDate, { color: colors.mutedForeground }]}>
                          {formatDate(item.date)}
                          {item.type === 'withdrawal' && ` · ${item.status}`}
                        </Text>
                      </View>
                      <Text style={[styles.earningsAmount, {
                        color: item.amount >= 0 ? colors.emerald : colors.destructive,
                      }]}>
                        {item.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(item.amount))}
                      </Text>
                    </View>
                  ))
                )}
              </Reanimated.View>
            )}
          </View>
        </Reanimated.View>
      )}

          <View style={{ height: insets.bottom + 80 }} />
        </KeyboardAwareScrollViewCompat>
      </Reanimated.View>

      {/* ═══════════════════════════════════════════════════════════════════
          QR POPUP MODAL
         ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showQrPopup}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQrPopup(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowQrPopup(false)}
        >
          <Reanimated.View entering={FadeInDown.springify().damping(20)} style={[styles.qrPopup, { backgroundColor: colors.card }]}>
            <Text style={[styles.qrPopupTitle, { color: colors.foreground }]}>Scan to Refer</Text>
            <Text style={[styles.qrPopupSubtitle, { color: colors.mutedForeground }]}>
              Ask your friend to scan this QR code
            </Text>
            <View style={styles.qrPopupCode}>
              <QRCode
                value={referralLink}
                size={SCREEN_WIDTH * 0.55}
                backgroundColor="#FFFFFF"
                color="#111827"
                quietZone={20}
              />
            </View>
            <Text style={[styles.qrPopupRef, { color: colors.mutedForeground }]}>
              Code: {referralCode}
            </Text>
            <Pressable
              onPress={() => setShowQrPopup(false)}
              style={[styles.qrPopupClose, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.qrPopupCloseText}>Done</Text>
            </Pressable>
          </Reanimated.View>
        </Pressable>
      </Modal>

      {/* ═══════════════════════════════════════════════════════════════════
          WITHDRAW MODAL
         ═══════════════════════════════════════════════════════════════════ */}
      <Modal
        visible={showWithdraw}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWithdraw(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => { if (!withdrawing) setShowWithdraw(false); }}
        >
          <Reanimated.View entering={FadeInDown.springify().damping(20)} style={[styles.withdrawPopup, { backgroundColor: colors.card }]}>
            <Pressable onPress={() => {}} /* prevent dismiss on inner press */>
              <View style={styles.withdrawHeader}>
                <Text style={[styles.withdrawTitle, { color: colors.foreground }]}>Withdraw Earnings</Text>
                <Pressable onPress={() => setShowWithdraw(false)} hitSlop={12}>
                  <Feather name="x" size={22} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <View style={[styles.withdrawBalanceCard, { backgroundColor: colors.emerald + '10', borderColor: colors.emerald + '30' }]}>
                <Text style={[styles.withdrawBalanceLabel, { color: colors.mutedForeground }]}>Available to Withdraw</Text>
                <Text style={[styles.withdrawBalanceValue, { color: colors.emerald }]}>{formatCurrency(availableToWithdraw)}</Text>
                {pendingWithdrawals > 0 && (
                  <Text style={[styles.withdrawPendingNote, { color: '#FFA500' }]}>
                    {formatCurrency(pendingWithdrawals)} pending
                  </Text>
                )}
              </View>

              <Text style={[styles.withdrawInputLabel, { color: colors.foreground }]}>Amount</Text>
              <View style={[styles.withdrawInputRow, { backgroundColor: colors.background, borderColor: withdrawError && !withdrawUpi ? colors.destructive : colors.border }]}>
                <Text style={[styles.withdrawCurrency, { color: colors.foreground }]}>₹</Text>
                <TextInput
                  style={[styles.withdrawInput, { color: colors.foreground }]}
                  placeholder="Enter amount"
                  placeholderTextColor={colors.mutedForeground}
                  value={withdrawAmount}
                  onChangeText={(t) => { setWithdrawAmount(t.replace(/\D/g, '')); setWithdrawError(''); }}
                  keyboardType="number-pad"
                  maxLength={7}
                />
                {availableToWithdraw > 0 && (
                  <Pressable
                    onPress={() => { setWithdrawAmount(String(availableToWithdraw)); setWithdrawError(''); }}
                    style={[styles.withdrawMaxBtn, { backgroundColor: colors.primary + '20' }]}
                  >
                    <Text style={[styles.withdrawMaxText, { color: colors.primary }]}>MAX</Text>
                  </Pressable>
                )}
              </View>

              <View style={styles.methodToggleRow}>
                <Pressable
                  onPress={() => { setWithdrawMethod('upi'); setWithdrawError(''); }}
                  style={[styles.methodToggleBtn, withdrawMethod === 'upi' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={[styles.methodToggleText, withdrawMethod === 'upi' && { color: '#111827' }]}>UPI</Text>
                </Pressable>
                <Pressable
                  onPress={() => { setWithdrawMethod('bank'); setWithdrawError(''); }}
                  style={[styles.methodToggleBtn, withdrawMethod === 'bank' && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                >
                  <Text style={[styles.methodToggleText, withdrawMethod === 'bank' && { color: '#111827' }]}>Bank Transfer</Text>
                </Pressable>
              </View>

              {withdrawMethod === 'upi' ? (
                <>
                  <Text style={[styles.withdrawInputLabel, { color: colors.foreground }]}>UPI ID</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: withdrawError && !withdrawUpi ? colors.destructive : colors.border }]}
                    placeholder="yourname@upi"
                    placeholderTextColor={colors.mutedForeground}
                    value={withdrawUpi}
                    onChangeText={(t) => { setWithdrawUpi(t); setWithdrawError(''); }}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                </>
              ) : (
                <>
                  <Text style={[styles.withdrawInputLabel, { color: colors.foreground }]}>Account Number</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border, marginBottom: 8 }]}
                    placeholder="e.g. 1234567890"
                    placeholderTextColor={colors.mutedForeground}
                    value={bankDetails.accountNumber}
                    onChangeText={(t) => { setBankDetails(p => ({ ...p, accountNumber: t })); setWithdrawError(''); }}
                    keyboardType="number-pad"
                  />
                  <Text style={[styles.withdrawInputLabel, { color: colors.foreground }]}>IFSC Code</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border, marginBottom: 8 }]}
                    placeholder="e.g. SBIN0001234"
                    placeholderTextColor={colors.mutedForeground}
                    value={bankDetails.ifsc}
                    onChangeText={(t) => { setBankDetails(p => ({ ...p, ifsc: t.toUpperCase() })); setWithdrawError(''); }}
                    autoCapitalize="characters"
                  />
                  <Text style={[styles.withdrawInputLabel, { color: colors.foreground }]}>Bank Name</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border, marginBottom: 8 }]}
                    placeholder="e.g. State Bank of India"
                    placeholderTextColor={colors.mutedForeground}
                    value={bankDetails.bankName}
                    onChangeText={(t) => { setBankDetails(p => ({ ...p, bankName: t })); setWithdrawError(''); }}
                  />
                  <Text style={[styles.withdrawInputLabel, { color: colors.foreground }]}>Account Holder Name</Text>
                  <TextInput
                    style={[styles.input, { color: colors.foreground, backgroundColor: colors.background, borderColor: colors.border }]}
                    placeholder="e.g. John Doe"
                    placeholderTextColor={colors.mutedForeground}
                    value={bankDetails.accountHolderName}
                    onChangeText={(t) => { setBankDetails(p => ({ ...p, accountHolderName: t })); setWithdrawError(''); }}
                  />
                </>
              )}

              {!!withdrawError && <Text style={[styles.addFeedback, { color: colors.destructive }]}>{withdrawError}</Text>}

              <Pressable
                accessibilityRole="button"
                disabled={withdrawing}
                onPress={handleWithdraw}
                style={({ pressed }) => [
                  styles.addBtn,
                  { backgroundColor: colors.emerald, opacity: withdrawing ? 0.6 : pressed ? 0.85 : 1, marginTop: 20 },
                ]}
              >
                {withdrawing ? <ActivityIndicator color="#FFF" /> : <Feather name="send" size={18} color="#FFF" />}
                <Text style={[styles.addBtnText, { color: '#FFF' }]}>{withdrawing ? 'Processing...' : 'Request Withdrawal'}</Text>
              </Pressable>
            </Pressable>
          </Reanimated.View>
        </Pressable>
      </Modal>
    </Page>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  heroCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 26,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  rewardText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  stepsContainer: {
    width: '100%',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumber: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
    color: '#D1D5DB',
  },
  stepText: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#D1D5DB',
    flex: 1,
  },
  stepConnector: {
    width: 2,
    height: 12,
    marginLeft: 11,
    borderRadius: 1,
  },
  codeBox: {
    width: '100%',
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  codeLabel: {
    color: '#9CA3AF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeText: {
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    letterSpacing: 2,
  },
  copyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
  },
  copyBtnText: {
    color: '#D1D5DB',
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
  },

  // Action row (Generate QR + Share side by side)
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 44,
    borderRadius: 12,
  },
  actionBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
  },

  // QR (kept for popup)
  qrWrapper: {
    padding: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },

  // Card
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 20,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
  },
  withdrawMaxBtn: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  withdrawMaxText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  methodToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    marginTop: 16,
  },
  methodToggleBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodToggleText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    color: '#9CA3AF',
  },
  cardIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  cardSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    marginTop: 2,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
    marginBottom: 12,
  },
  mobileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  mobilePrefix: { fontFamily: 'Inter_600SemiBold', fontSize: 15, marginRight: 10 },
  mobileInput: { flex: 1, height: '100%', fontFamily: 'Inter_500Medium', fontSize: 15 },
  addFeedback: { fontFamily: 'Inter_500Medium', fontSize: 12.5, marginTop: 10 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    marginTop: 16,
  },
  addBtnText: { fontFamily: 'Inter_700Bold', fontSize: 15, color: '#101B2E' },

  // Dashboard
  dashboardCard: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dashboardTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },
  dashboardPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dashboardPillText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 11,
  },
  dashboardAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    marginBottom: 20,
  },
  dashboardInfoText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  dashboardStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 20,
    borderTopWidth: 1,
    marginBottom: 24,
  },
  dashboardStatBox: {
    flex: 1,
    alignItems: 'center',
  },
  dashboardStatValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginBottom: 4,
  },
  dashboardStatLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  dashboardStatDivider: {
    width: 1,
    height: 24,
    alignSelf: 'center',
  },
  dashboardWithdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  dashboardWithdrawBtnText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
  },

  // Main Tabs
  mainTabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  mainTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  mainTabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },

  // Tabs
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    marginBottom: 4,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
  },
  tabText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
  },

  // Referral items
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  referralItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderTopWidth: 1,
    gap: 12,
  },
  refAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  refInfo: {
    flex: 1,
  },
  refName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginBottom: 3,
  },
  refDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  refStatus: {
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
  },
  earningsAmount: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    marginLeft: 8,
  },

  // QR Popup
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  qrPopup: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
  },
  qrPopupTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    marginBottom: 6,
  },
  qrPopupSubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  qrPopupCode: {
    padding: 4,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 16,
  },
  qrPopupRef: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
    letterSpacing: 1,
    marginBottom: 20,
  },
  qrPopupClose: {
    width: '100%',
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrPopupCloseText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 15,
    color: '#101B2E',
  },

  // Withdraw Popup
  withdrawPopup: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
  },
  withdrawHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  withdrawTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
  },
  withdrawBalanceCard: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
  },
  withdrawBalanceLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginBottom: 4,
  },
  withdrawBalanceValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
  },
  withdrawPendingNote: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    marginTop: 4,
  },
  withdrawInputLabel: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    marginBottom: 8,
  },
  withdrawInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  withdrawCurrency: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginRight: 8,
  },
  withdrawInput: {
    flex: 1,
    height: '100%',
    fontFamily: 'Inter_500Medium',
    fontSize: 16,
  },
});
