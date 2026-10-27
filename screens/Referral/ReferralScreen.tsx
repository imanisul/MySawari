import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, ActivityIndicator, TextInput, Share, ScrollView, Modal, Alert,
  Image, ImageSourcePropType, Linking, BackHandler, LayoutAnimation, Platform, UIManager,
  KeyboardAvoidingView, useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Line, Path } from 'react-native-svg';

import { Page, Header, PrimaryButton, KeyboardAwareScrollViewCompat } from '@/components';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { API, invalidateWalletCache } from '@/services/backend/api';
import { ReferralSkeleton } from '@/components/loading/ScreenSkeletons';
import { ModalBlur } from '@/components/common/ModalBlur';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── Constants ────────────────────────────────────────────────────────────────
const REFERRAL_BASE_URL = 'https://mysawari.com/refer';
const DEVICE_REFERRALS_KEY = '@sawari_device_referrals';

/** Hero portraits exported from Figma (Refer & Earn, node 257:24470), PNG @3x. */
const AVATARS: { left: ImageSourcePropType; center: ImageSourcePropType; right: ImageSourcePropType } = {
  left: require('@/assets/images/refer/avatar-left.png'),
  center: require('@/assets/images/refer/avatar-center.png'),
  right: require('@/assets/images/refer/avatar-right.png'),
};

/* ── Figma palette ─────────────────────────────────────────────────────── */
const C = {
  purple: '#6152D8',
  purpleLight: '#9C90F3',
  lavenderBorder: '#D1CCF9',
  navy: '#2F3E75', // Primary/blue-500
  title: '#262626', // Neutral/800
  copy: '#737373', // Neutral/500
  border: '#D4D4D4', // Neutral/300
  soft: '#F9F9FB',
  softBorder: '#EAECF1', // Primary/blue-50
  panelBorder: '#E7EAF4',
  green: '#008758',
  greenTint: '#E6F3EE',
  red: '#D04646',
  amber: '#B7791F',
  whatsapp: '#25D366',
};
const F = { med: 'PlusJakartaSans_500Medium', semi: 'PlusJakartaSans_600SemiBold', bold: 'PlusJakartaSans_700Bold' };

// ── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return iso; }
};

/** ₹1,23,456 — Indian grouping without relying on Intl in the JS engine. */
function formatCurrency(amount: number) {
  const s = String(Math.round(Math.abs(amount || 0)));
  const last3 = s.slice(-3);
  const rest = s.slice(0, -3);
  return `₹${rest ? `${rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')},${last3}` : last3}`;
}

type View_ = 'main' | 'history';

export default function ReferScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { customer, isAuthenticated, isAuthLoading, updateCustomer, isDarkMode } = useSawari();

  // ── State ────────────────────────────────────────────────────────────────
  const [view, setView] = useState<View_>('main');
  const [config, setConfig] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // Referrals or earnings couldn't be loaded: shown as a retry bar, not as "no referrals" / ₹0.
  const [dataFailed, setDataFailed] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [openFaq, setOpenFaq] = useState(-1);

  // Add a friend
  const [friendName, setFriendName] = useState('');
  const [friendMobile, setFriendMobile] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [addedMessage, setAddedMessage] = useState('');

  // History tabs
  const [activeTab, setActiveTab] = useState<'referrals' | 'earnings'>('referrals');

  // Withdraw
  const [showWithdraw, setShowWithdraw] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'upi' | 'bank'>('upi');
  const [withdrawUpi, setWithdrawUpi] = useState('');
  const [bankDetails, setBankDetails] = useState({ accountNumber: '', ifsc: '', bankName: '', accountHolderName: '' });
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawError, setWithdrawError] = useState('');

  // Wallet
  const [withdrawableBalance, setWithdrawableBalance] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  // ── Derived ──────────────────────────────────────────────────────────────
  // The code always comes from the account on the server; nothing is shared until it has loaded.
  const referralCode = customer.referralCode || '';
  const hasCode = referralCode.length > 0;
  const referralLink = `${REFERRAL_BASE_URL}?code=${referralCode}`;
  const displayLink = referralLink.replace(/^https?:\/\//, '');

  const totalEarned = useMemo(() => referrals.reduce((sum: number, r: any) => sum + (r.commissionAmount || 0), 0), [referrals]);
  const completedCount = useMemo(() => referrals.filter((r: any) => r.status === 'REWARDED').length, [referrals]);
  const pendingWithdrawals = useMemo(
    () => transactions.filter((t) => t.type === 'withdrawal' && t.status === 'PENDING').reduce((s, t) => s + Math.abs(t.amount), 0),
    [transactions],
  );
  const availableToWithdraw = withdrawableBalance;

  const earningsHistory = useMemo(
    () => transactions
      .map((t) => ({
        id: t.id || t._id,
        type: t.type as 'referral' | 'withdrawal',
        label: t.label || t.description,
        amount: t.amount,
        date: t.date,
        status: t.status,
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [transactions],
  );

  // Reward copy comes from the app config. If the config couldn't load, fall back to the
  // published offer (10% back for you, ₹100 off for your friend) rather than odd defaults.
  const rewardShort = !config
    ? '10%'
    : config.referralRewardType === 'PERCENTAGE'
      ? `${config.referralRewardAmount ?? 10}%`
      : `₹${config.referralRewardAmount ?? 10}`;
  const discountText = !config
    ? '₹100 off'
    : config.referralDiscountType === 'FLAT'
      ? `₹${config.referralDiscountAmount ?? 100} off`
      : `${config.referralDiscountAmount ?? 10}% off`;

  // ── Data loading (unchanged API calls) ───────────────────────────────────
  const loadWallet = useCallback(async () => {
    if (!isAuthenticated || !customer.id) return;
    try {
      const w: any = await API.getWallet(true);
      // A failed request keeps the earnings already on screen and offers a retry (never shows ₹0).
      if (w?.failed) { setDataFailed(true); return; }
      setWithdrawableBalance(w.withdrawableBalance || 0);
      setTransactions(w.transactions || []);
    } catch {
      setDataFailed(true);
    }
  }, [isAuthenticated, customer.id]);

  const refreshReferrals = useCallback(async () => {
    if (!isAuthenticated || !customer.id) return;
    setDataFailed(false);
    try {
      setReferrals(await API.getReferrals(customer.id));
    } catch {
      setDataFailed(true); // the list on screen stays as it was
    }
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
        } else if (userReferrals.status === 'rejected') {
          setDataFailed(true);
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
      // The saved profile can be from an older app version without a code: take the code from the server.
      API.getUserProfile(customer.id).then((profile) => {
        const code = typeof profile?.referralCode === 'string' ? profile.referralCode : '';
        if (code && code !== customer.referralCode) updateCustomer('referralCode', code);
      }).catch(() => {});
    }
  }, [isAuthenticated, customer.id, loadWallet]);

  // Light status bar over the purple hero; dark on the history view.
  useFocusEffect(useCallback(() => {
    setStatusBarStyle(view === 'main' ? 'light' : (isDarkMode ? 'light' : 'dark'));
    return () => setStatusBarStyle(isDarkMode ? 'light' : 'dark');
  }, [view, isDarkMode]));

  // Android back closes the history view before leaving the screen.
  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (view === 'history') { setView('main'); return true; }
      return false;
    });
    return () => sub.remove();
  }, [view]));

  // ── Handlers ─────────────────────────────────────────────────────────────
  const shareMessage = `🚗 Hey! Use my MySawari referral code *${referralCode}* when you sign up and get ${discountText} on your first ride!\n\nDownload now: ${referralLink}`;

  const handleCopyLink = async () => {
    if (!hasCode) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    await Clipboard.setStringAsync(referralLink);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleShare = async () => {
    if (!hasCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await Share.share({ message: shareMessage, title: 'Share MySawari Referral' });
    } catch {}
  };

  const handleWhatsApp = async () => {
    if (!hasCode) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    try {
      await Linking.openURL(`whatsapp://send?text=${encodeURIComponent(shareMessage)}`);
    } catch {
      // WhatsApp isn't installed: fall back to the system share sheet.
      handleShare();
    }
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
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
        return;
      }
    } catch {}

    setAdding(true);
    setAddError('');
    try {
      await API.addReferral(mobile, friendName);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      try {
        const stored = await AsyncStorage.getItem(DEVICE_REFERRALS_KEY);
        const deviceReferrals: string[] = stored ? JSON.parse(stored) : [];
        deviceReferrals.push(mobile);
        await AsyncStorage.setItem(DEVICE_REFERRALS_KEY, JSON.stringify(deviceReferrals));
      } catch {}
      setFriendName('');
      setFriendMobile('');
      setAddedMessage(`Added! You earn ${rewardShort} once their first trip is completed.`);
      await refreshReferrals();
    } catch (e: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
      setAddError(e?.message || 'Could not add this number. Please try again.');
    } finally {
      setAdding(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseInt(withdrawAmount, 10);
    if (!amount || amount <= 0) { setWithdrawError('Enter a valid amount'); return; }
    if (amount > availableToWithdraw) { setWithdrawError(`Maximum available: ${formatCurrency(availableToWithdraw)}`); return; }

    let details: any = {};
    if (withdrawMethod === 'upi') {
      if (!withdrawUpi.trim() || !withdrawUpi.includes('@')) { setWithdrawError('Enter a valid UPI ID (e.g. name@upi)'); return; }
      details = { upiId: withdrawUpi.trim() };
    } else {
      const b = bankDetails;
      if (!b.accountNumber.trim() || !b.ifsc.trim() || !b.bankName.trim() || !b.accountHolderName.trim()) {
        setWithdrawError('Please fill all bank details');
        return;
      }
      details = { ...b };
    }

    setWithdrawing(true);
    setWithdrawError('');
    try {
      await API.requestWithdrawal(amount, withdrawMethod, details);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
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
      setWithdrawError(e?.message || 'Failed to request withdrawal');
    } finally {
      setWithdrawing(false);
    }
  };

  // ── Auth loading / unauthenticated ───────────────────────────────────────
  if (isAuthLoading || (isAuthenticated && loading)) {
    return (
      <Page scroll={false}>
        <Header title="Refer & Earn" back />
        <ReferralSkeleton />
      </Page>
    );
  }

  if (!isAuthenticated) {
    return (
      <Page scroll={false}>
        <Header title="Refer & Earn" back />
        <View style={styles.centerState}>
          <Feather name="lock" size={48} color={colors.mutedForeground} style={{ marginBottom: 20 }} />
          <Text style={[styles.stateTitle, { color: colors.foreground }]}>Login to Refer & Earn</Text>
          <Text style={[styles.stateCopy, { color: colors.mutedForeground }]}>
            Sign in to get your referral code and earn {rewardShort} of every friend's first booking.
          </Text>
          <View style={{ width: '100%', marginTop: 28 }}>
            <PrimaryButton label="Go to Login" onPress={() => router.push('/profile')} />
          </View>
        </View>
      </Page>
    );
  }

  const text = isDarkMode ? colors.foreground : C.title;
  const muted = isDarkMode ? colors.mutedForeground : C.copy;
  const surface = isDarkMode ? colors.background : '#FFFFFF';
  const line = isDarkMode ? colors.border : C.softBorder;

  /* ═══ History view ════════════════════════════════════════════════════ */
  if (view === 'history') {
    return (
      <View style={[styles.root, { backgroundColor: surface, paddingTop: insets.top }]}>
        <View style={styles.historyHeader}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back to Refer & Earn"
            hitSlop={8}
            onPress={() => setView('main')}
            style={({ pressed }) => [styles.backLight, pressed && { opacity: 0.7 }]}
          >
            <Feather name="chevron-left" size={22} color={C.copy} />
          </Pressable>
          <Text style={[styles.historyTitle, { color: text }]}>Referral history</Text>
          <View style={{ width: 32 }} />
        </View>

        <KeyboardAwareScrollViewCompat
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 32, gap: 16 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {dataFailed && (
            <Pressable
              accessibilityRole="button"
              onPress={() => { Haptics.selectionAsync().catch(() => {}); refreshReferrals(); }}
              style={({ pressed }) => [styles.retryBar, pressed && { opacity: 0.8 }]}
            >
              <Feather name="wifi-off" size={16} color={C.red} />
              <Text style={[styles.retryText, { flex: 1 }]}>Couldn't load your latest referrals and earnings.</Text>
              <Text style={[styles.retryText, { fontFamily: F.bold }]}>Retry</Text>
            </Pressable>
          )}

          {/* Earnings */}
          <LinearGradient colors={[C.purple, C.purpleLight]} style={styles.earnCard}>
            <Text style={styles.earnLabel}>Available to withdraw</Text>
            <Text style={styles.earnAmount}>{formatCurrency(availableToWithdraw)}</Text>
            {pendingWithdrawals > 0 && (
              <Text style={styles.earnPending}>{formatCurrency(pendingWithdrawals)} withdrawal pending</Text>
            )}
            <View style={styles.earnStats}>
              <Stat value={String(referrals.length)} label="Friends added" />
              <View style={styles.earnDivider} />
              <Stat value={String(completedCount)} label="Trips done" />
              <View style={styles.earnDivider} />
              <Stat value={formatCurrency(totalEarned)} label="Total earned" />
            </View>
            {availableToWithdraw > 0 && (
              <Pressable
                accessibilityRole="button"
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}); setShowWithdraw(true); }}
                style={({ pressed }) => [styles.withdrawBtn, pressed && { opacity: 0.9 }]}
              >
                <Feather name="download" size={16} color={C.purple} />
                <Text style={styles.withdrawBtnText}>Withdraw earnings</Text>
              </Pressable>
            )}
          </LinearGradient>

          {/* Add a friend (keeps commission tracking for friends who book without the link) */}
          <View style={[styles.box, { borderColor: line, backgroundColor: isDarkMode ? colors.card : C.soft }]}>
            <Text style={[styles.sectionTitle, { color: text }]}>Add a friend's number</Text>
            <Text style={[styles.small, { color: muted, marginTop: -6 }]}>Add them before they book so their first trip is tracked to you.</Text>
            <TextInput
              style={[styles.field, { color: text, borderColor: line, backgroundColor: surface }]}
              placeholder="Friend's name"
              placeholderTextColor={muted}
              value={friendName}
              onChangeText={setFriendName}
              maxLength={60}
              autoCapitalize="words"
            />
            <View style={[styles.field, styles.mobileRow, { borderColor: addError ? C.red : line, backgroundColor: surface }]}>
              <Text style={[styles.prefix, { color: muted }]}>+91</Text>
              <TextInput
                style={[styles.mobileInput, { color: text }]}
                placeholder="10-digit mobile number"
                placeholderTextColor={muted}
                value={friendMobile}
                onChangeText={(t) => { setFriendMobile(t.replace(/\D/g, '').slice(0, 10)); setAddError(''); setAddedMessage(''); }}
                keyboardType="number-pad"
                maxLength={10}
                returnKeyType="done"
                onSubmitEditing={handleAddFriend}
              />
            </View>
            {!!addError && <Text style={[styles.small, { color: C.red }]}>{addError}</Text>}
            {!!addedMessage && <Text style={[styles.small, { color: C.green }]}>{addedMessage}</Text>}
            <Pressable
              accessibilityRole="button"
              disabled={adding}
              onPress={handleAddFriend}
              style={({ pressed }) => [styles.navyBtn, { opacity: adding ? 0.6 : pressed ? 0.9 : 1 }]}
            >
              {adding ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.navyBtnText}>Add friend</Text>}
            </Pressable>
          </View>

          {/* Referrals / Earnings */}
          <View>
            <View style={[styles.tabs, { borderColor: line }]}>
              {(['referrals', 'earnings'] as const).map((t) => (
                <Pressable
                  key={t}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: activeTab === t }}
                  onPress={() => setActiveTab(t)}
                  style={[styles.tab, activeTab === t && { backgroundColor: C.navy }]}
                >
                  <Text style={[styles.tabText, { color: activeTab === t ? '#FFFFFF' : muted }]}>
                    {t === 'referrals' ? 'Referrals' : 'Earnings'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {activeTab === 'referrals' ? (
              referrals.length === 0 ? (
                <Empty icon="users" text={'No referrals yet.\nShare your link or add a friend\'s number to get started.'} muted={muted} />
              ) : (
                referrals.map((ref: any) => {
                  const done = ref.status === 'REWARDED';
                  const joined = ref.status === 'JOINED';
                  return (
                    <View key={ref.id || ref._id || ref.mobileNumber} style={[styles.row, { borderBottomColor: line }]}>
                      <View style={[styles.rowIcon, { backgroundColor: done ? C.greenTint : C.soft }]}>
                        <Feather name={done ? 'check' : joined ? 'user' : 'phone'} size={16} color={done ? C.green : C.navy} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowTitle, { color: text }]} numberOfLines={1}>{ref.referredName || 'Friend'}</Text>
                        <Text style={[styles.small, { color: muted }]} numberOfLines={1}>
                          {ref.mobileNumber ? `+91 ${ref.mobileNumber} · ` : ''}Added {formatDate(ref.signupAt)}
                        </Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: done ? C.greenTint : joined ? '#F0EFFD' : C.soft }]}>
                        <Text style={[styles.badgeText, { color: done ? C.green : joined ? C.purple : muted }]}>
                          {done ? (ref.commissionAmount > 0 ? `+${formatCurrency(ref.commissionAmount)}` : 'Completed') : joined ? 'Trip pending' : 'Invited'}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )
            ) : earningsHistory.length === 0 ? (
              <Empty icon="trending-up" text={'No earnings yet.\nRewards appear here once friends complete trips.'} muted={muted} />
            ) : (
              earningsHistory.map((item) => {
                const isIn = item.type === 'referral';
                const pending = item.status === 'PENDING';
                return (
                  <View key={item.id} style={[styles.row, { borderBottomColor: line }]}>
                    <View style={[styles.rowIcon, { backgroundColor: isIn ? C.greenTint : pending ? '#FFF7E6' : C.soft }]}>
                      <Feather name={isIn ? 'arrow-down-left' : 'arrow-up-right'} size={16} color={isIn ? C.green : pending ? C.amber : C.navy} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: text }]} numberOfLines={1}>{item.label}</Text>
                      <Text style={[styles.small, { color: muted }]}>
                        {formatDate(item.date)}{item.type === 'withdrawal' ? ` · ${item.status}` : ''}
                      </Text>
                    </View>
                    <Text style={[styles.rowAmount, { color: item.amount >= 0 ? C.green : C.red }]}>
                      {item.amount >= 0 ? '+' : '−'}{formatCurrency(item.amount)}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </KeyboardAwareScrollViewCompat>

        <WithdrawModal
          visible={showWithdraw}
          onClose={() => { if (!withdrawing) setShowWithdraw(false); }}
          colors={colors}
          available={availableToWithdraw}
          pending={pendingWithdrawals}
          amount={withdrawAmount}
          setAmount={(v) => { setWithdrawAmount(v); setWithdrawError(''); }}
          method={withdrawMethod}
          setMethod={(m) => { setWithdrawMethod(m); setWithdrawError(''); }}
          upi={withdrawUpi}
          setUpi={(v) => { setWithdrawUpi(v); setWithdrawError(''); }}
          bank={bankDetails}
          setBank={(b) => { setBankDetails(b); setWithdrawError(''); }}
          error={withdrawError}
          busy={withdrawing}
          onSubmit={handleWithdraw}
        />
      </View>
    );
  }

  /* ═══ Main view (Figma 257:24470) ═════════════════════════════════════ */
  const cardW = Math.min(327, width - 66);
  const heroH = insets.top + 171; // Figma: 230 including the 59px status bar
  const bottomBarH = 8 + 30 + 8 + 54 + 4 + insets.bottom;

  const faqs = [
    {
      q: 'How does the Refer & Earn program work?',
      a: `Share your code or invite link. When your friend signs up with it and completes their first trip, you get ${rewardShort} of their booking amount as wallet cash.`,
    },
    {
      q: 'Who is eligible for the referral offer?',
      a: `Friends who are new to MySawari and sign up using your code. They get ${discountText} on their first ride.`,
    },
    {
      q: 'What if my friend books without using my referral link?',
      a: 'Add their mobile number under "See your referral history" before they book, and their first trip will still be tracked to you.',
    },
    {
      q: 'Where can I check my referral status?',
      a: 'Tap "See your referral history" to see every friend you referred, their status, your earnings and withdrawals.',
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: surface }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: bottomBarH + 16 }}>
        {/* Hero */}
        <View style={{ height: heroH }}>
          <LinearGradient colors={[C.purple, C.purpleLight]} style={styles.hero}>
            <Rays width={width} height={heroH} />
          </LinearGradient>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            hitSlop={8}
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backOnPurple, { top: insets.top + 4 }, pressed && { opacity: 0.7 }]}
          >
            <Feather name="chevron-left" size={22} color="#FFFFFF" />
          </Pressable>
        </View>

        {/* Invite card, overlapping the hero's bottom edge */}
        <View style={[styles.inviteCard, { width: cardW, marginTop: -(heroH - insets.top - 80) }]}>
          <Avatar source={AVATARS.left} size={56} style={{ left: cardW / 2 - 75.5, top: -35 }} />
          <Avatar source={AVATARS.right} size={56} style={{ left: cardW / 2 + 20.5, top: -35 }} />
          <Avatar source={AVATARS.center} size={64} style={{ left: cardW / 2 - 32, top: -46 }} center />
          <Text style={styles.inviteTitle}>Invite Friends. Earn {rewardShort} Back.</Text>
          <Text style={styles.inviteCopy}>
            Get {rewardShort} of your friend’s booking amount as wallet cash when they complete their first trip.
          </Text>
        </View>

        {/* How it works */}
        <View style={styles.section}>
          <View style={[styles.box, { borderColor: line, backgroundColor: isDarkMode ? colors.card : C.soft }]}>
            <Text style={[styles.sectionTitle, { color: text }]}>How It Works</Text>
            <View style={{ gap: 12 }}>
              <View style={styles.stepRail} pointerEvents="none">
                <Svg width={2} height="100%">
                  <Line x1="1" y1="0" x2="1" y2="100%" stroke={C.border} strokeWidth={1} strokeDasharray="3,3" />
                </Svg>
              </View>
              <Step title="Share Your Code or Link" copy="Send your personal link or code to your friends." text={text} muted={muted} />
              <Step title="They book a Car or Bike" copy={`Your friend signs up with your code and gets ${discountText} at checkout on their first booking.`} text={text} muted={muted} />
              <Step title={`You get ${rewardShort} back`} copy={`Once your friend completes their first ride, ${rewardShort} of their trip total is added to your wallet.`} text={text} muted={muted} />
            </View>
          </View>
        </View>

        {/* Referral history */}
        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            onPress={() => { Haptics.selectionAsync().catch(() => {}); setView('history'); refreshReferrals(); }}
            style={({ pressed }) => [styles.historyRow, { borderColor: line, backgroundColor: surface }, pressed && { opacity: 0.85 }]}
          >
            <View style={styles.historyIcon}>
              <MaterialCommunityIcons name="history" size={18} color={C.title} />
            </View>
            <Text style={[styles.historyText, { color: text }]} numberOfLines={1}>See your referral history</Text>
            {referrals.length > 0 && (
              <View style={styles.countPill}><Text style={styles.countPillText}>{referrals.length}</Text></View>
            )}
            <Feather name="chevron-right" size={16} color={muted} />
          </Pressable>
        </View>

        {/* FAQs */}
        <View style={[styles.section, { gap: 12 }]}>
          <Text style={[styles.sectionTitle, { color: text }]}>FAQs</Text>
          <View style={{ gap: 10 }}>
            {faqs.map((f, i) => {
              const open = openFaq === i;
              return (
                <Pressable
                  key={f.q}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: open }}
                  onPress={() => {
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                    setOpenFaq(open ? -1 : i);
                  }}
                  style={[styles.faq, { borderColor: isDarkMode ? colors.border : C.border }]}
                >
                  <View style={styles.faqHead}>
                    <Text style={[styles.faqQ, { color: text }]}>{f.q}</Text>
                    <Feather name={open ? 'chevron-up' : 'chevron-down'} size={20} color={text} />
                  </View>
                  {open && <Text style={[styles.faqA, { color: muted }]}>{f.a}</Text>}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Sticky share bar */}
      <View style={[styles.bottomBar, { backgroundColor: surface, borderTopColor: isDarkMode ? colors.border : C.panelBorder, paddingBottom: insets.bottom + 4 }]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Copy invite link"
          disabled={!hasCode}
          onPress={handleCopyLink}
          style={styles.linkRow}
        >
          <Text style={styles.linkText} numberOfLines={1}>
            <Text style={{ fontFamily: F.med, color: muted }}>Invite Link : </Text>
            <Text style={styles.linkValue}>{hasCode ? displayLink : 'Loading…'}</Text>
          </Text>
          <Feather name={copySuccess ? 'check' : 'copy'} size={14} color={copySuccess ? C.green : muted} />
        </Pressable>
        <View style={styles.ctaRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share via WhatsApp"
            disabled={!hasCode}
            onPress={handleWhatsApp}
            style={({ pressed }) => [styles.cta, { opacity: !hasCode ? 0.6 : pressed ? 0.9 : 1 }]}
          >
            <FontAwesome name="whatsapp" size={24} color={C.whatsapp} />
            <Text style={styles.ctaText}>Share via WhatsApp</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="More ways to share"
            disabled={!hasCode}
            onPress={handleShare}
            style={({ pressed }) => [styles.shareSquare, pressed && { opacity: 0.8 }]}
          >
            <Feather name="share" size={22} color={C.title} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

/* ═══ Pieces ══════════════════════════════════════════════════════════════ */
function Rays({ width, height }: { width: number; height: number }) {
  const cx = width / 2;
  const cy = height * 0.62;
  const r = Math.hypot(width, height) + 40;
  const count = 36;
  const step = (2 * Math.PI) / count;
  const d: string[] = [];
  for (let i = 0; i < count; i += 2) {
    const a1 = i * step;
    const a2 = a1 + step;
    d.push(`M${cx},${cy} L${cx + r * Math.cos(a1)},${cy + r * Math.sin(a1)} L${cx + r * Math.cos(a2)},${cy + r * Math.sin(a2)} Z`);
  }
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      <Path d={d.join(' ')} fill="rgba(255,255,255,0.07)" />
    </Svg>
  );
}

function Avatar({ source, size, style, center }: { source: ImageSourcePropType; size: number; style: any; center?: boolean }) {
  return (
    <View
      style={[
        { position: 'absolute', width: size, height: size, borderRadius: size / 2, overflow: 'hidden', backgroundColor: '#F0EFFD' },
        center ? { borderWidth: 1.5, borderColor: '#FFFFFF' } : { borderWidth: 1, borderColor: C.lavenderBorder },
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Image source={source} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
    </View>
  );
}

function Step({ title, copy, text, muted }: { title: string; copy: string; text: string; muted: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepDot} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.stepTitle, { color: text }]}>{title}</Text>
        <Text style={[styles.small, { color: muted }]}>{copy}</Text>
      </View>
    </View>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={styles.statValue} numberOfLines={1}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Empty({ icon, text, muted }: { icon: 'users' | 'trending-up'; text: string; muted: string }) {
  return (
    <View style={styles.empty}>
      <Feather name={icon} size={28} color={C.border} style={{ marginBottom: 10 }} />
      <Text style={[styles.small, { color: muted, textAlign: 'center', fontSize: 13, lineHeight: 19.5 }]}>{text}</Text>
    </View>
  );
}

function WithdrawModal(p: {
  visible: boolean; onClose: () => void; colors: ReturnType<typeof useColors>;
  available: number; pending: number;
  amount: string; setAmount: (v: string) => void;
  method: 'upi' | 'bank'; setMethod: (m: 'upi' | 'bank') => void;
  upi: string; setUpi: (v: string) => void;
  bank: { accountNumber: string; ifsc: string; bankName: string; accountHolderName: string };
  setBank: (b: { accountNumber: string; ifsc: string; bankName: string; accountHolderName: string }) => void;
  error: string; busy: boolean; onSubmit: () => void;
}) {
  const { colors } = p;
  const fieldStyle = [styles.field, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }];
  const bankField = (key: keyof typeof p.bank, label: string, placeholder: string, extra: any = {}) => (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>{label}</Text>
      <TextInput
        style={fieldStyle}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={p.bank[key]}
        onChangeText={(t) => p.setBank({ ...p.bank, [key]: key === 'ifsc' ? t.toUpperCase() : t })}
        {...extra}
      />
    </View>
  );

  return (
    <Modal visible={p.visible} transparent animationType="fade" onRequestClose={p.onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Pressable style={styles.scrim} onPress={p.onClose}>
          <ModalBlur />
          <Pressable onPress={() => {}} style={[styles.sheet, { backgroundColor: colors.card }]}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14 }}>
              <View style={styles.sheetHead}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Withdraw earnings</Text>
                <Pressable onPress={p.onClose} hitSlop={12} accessibilityLabel="Close">
                  <Feather name="x" size={22} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <View style={styles.balanceBox}>
                <Text style={[styles.small, { color: C.copy }]}>Available to withdraw</Text>
                <Text style={styles.balanceValue}>{formatCurrency(p.available)}</Text>
                {p.pending > 0 && <Text style={[styles.small, { color: C.amber }]}>{formatCurrency(p.pending)} pending</Text>}
              </View>

              <View style={{ gap: 6 }}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Amount</Text>
                <View style={[styles.field, styles.mobileRow, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={[styles.prefix, { color: colors.foreground }]}>₹</Text>
                  <TextInput
                    style={[styles.mobileInput, { color: colors.foreground }]}
                    placeholder="Enter amount"
                    placeholderTextColor={colors.mutedForeground}
                    value={p.amount}
                    onChangeText={(t) => p.setAmount(t.replace(/\D/g, ''))}
                    keyboardType="number-pad"
                    maxLength={7}
                  />
                  {p.available > 0 && (
                    <Pressable onPress={() => p.setAmount(String(p.available))} style={styles.maxBtn}>
                      <Text style={styles.maxText}>MAX</Text>
                    </Pressable>
                  )}
                </View>
              </View>

              <View style={styles.methodRow}>
                {(['upi', 'bank'] as const).map((m) => (
                  <Pressable
                    key={m}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: p.method === m }}
                    onPress={() => p.setMethod(m)}
                    style={[styles.methodBtn, { borderColor: p.method === m ? C.navy : colors.border }, p.method === m && { backgroundColor: C.navy }]}
                  >
                    <Text style={[styles.methodText, { color: p.method === m ? '#FFFFFF' : colors.mutedForeground }]}>
                      {m === 'upi' ? 'UPI' : 'Bank transfer'}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {p.method === 'upi' ? (
                <View style={{ gap: 6 }}>
                  <Text style={[styles.fieldLabel, { color: colors.foreground }]}>UPI ID</Text>
                  <TextInput
                    style={fieldStyle}
                    placeholder="yourname@upi"
                    placeholderTextColor={colors.mutedForeground}
                    value={p.upi}
                    onChangeText={p.setUpi}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                  />
                </View>
              ) : (
                <>
                  {bankField('accountNumber', 'Account number', 'e.g. 1234567890', { keyboardType: 'number-pad' })}
                  {bankField('ifsc', 'IFSC code', 'e.g. SBIN0001234', { autoCapitalize: 'characters', autoCorrect: false })}
                  {bankField('bankName', 'Bank name', 'e.g. State Bank of India')}
                  {bankField('accountHolderName', 'Account holder name', 'As on your bank account', { autoCapitalize: 'words' })}
                </>
              )}

              {!!p.error && <Text style={[styles.small, { color: C.red, fontSize: 12.5 }]}>{p.error}</Text>}

              <Pressable
                accessibilityRole="button"
                disabled={p.busy}
                onPress={p.onSubmit}
                style={({ pressed }) => [styles.navyBtn, { opacity: p.busy ? 0.6 : pressed ? 0.9 : 1 }]}
              >
                {p.busy ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.navyBtnText}>Request withdrawal</Text>}
              </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

/* ═══ Styles ══════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  root: { flex: 1 },

  // Hero: purple gradient, 24px bottom corners, rays behind.
  hero: {
    ...StyleSheet.absoluteFill,
    borderBottomLeftRadius: 24, borderBottomRightRadius: 24, overflow: 'hidden',
    borderWidth: 1, borderTopWidth: 0, borderColor: C.panelBorder,
  },
  backOnPurple: {
    position: 'absolute', left: 16, width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center',
  },
  backLight: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: '#FAFAFA',
    borderWidth: 1, borderColor: C.softBorder, alignItems: 'center', justifyContent: 'center',
  },

  // Invite card: white, 1px lavender border, radius 10, pt 32 / pb 16 / px 12, gap 12.
  inviteCard: {
    alignSelf: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: C.lavenderBorder, borderRadius: 10,
    paddingTop: 32, paddingBottom: 16, paddingHorizontal: 12, gap: 12, alignItems: 'center', marginBottom: 8,
  },
  inviteTitle: { fontFamily: F.bold, fontSize: 19, lineHeight: 28.5, color: C.purple, textAlign: 'center' },
  inviteCopy: { fontFamily: F.med, fontSize: 11, lineHeight: 16.5, color: C.copy, textAlign: 'center' },

  section: { paddingHorizontal: 16, paddingVertical: 8 },
  sectionTitle: { fontFamily: F.semi, fontSize: 15, lineHeight: 22.5 },
  box: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 12 },

  // Steps: 11px dots on a dashed rail.
  stepRail: { position: 'absolute', left: 4.5, top: 8, bottom: 24, width: 2 },
  step: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepDot: { width: 11, height: 11, borderRadius: 5.5, backgroundColor: C.border },
  stepTitle: { fontFamily: F.semi, fontSize: 11, lineHeight: 16.5 },
  small: { fontFamily: F.med, fontSize: 11, lineHeight: 16.5, color: C.copy },

  // Referral history row: radius 8, px 12 / py 10, icon tile on #F9F9FB.
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 },
  historyIcon: { padding: 9, borderRadius: 8, backgroundColor: C.soft },
  historyText: { flex: 1, fontFamily: F.semi, fontSize: 15, lineHeight: 22.5 },
  countPill: { minWidth: 22, height: 22, borderRadius: 11, paddingHorizontal: 6, backgroundColor: '#F0EFFD', alignItems: 'center', justifyContent: 'center' },
  countPillText: { fontFamily: F.semi, fontSize: 11, color: C.purple },

  faq: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, gap: 8 },
  faqHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  faqQ: { flex: 1, fontFamily: F.semi, fontSize: 13, lineHeight: 19.5 },
  faqA: { fontFamily: F.med, fontSize: 13, lineHeight: 19.5 },

  // Bottom bar: 1px top border, soft upward shadow, pt 8 / pb 4.
  bottomBar: {
    position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1, paddingTop: 8, paddingHorizontal: 16, gap: 8,
    shadowColor: C.navy, shadowOffset: { width: 0, height: -20 }, shadowOpacity: 0.05, shadowRadius: 17, elevation: 12,
  },
  linkRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 4, paddingHorizontal: 16 },
  linkText: { fontSize: 11, lineHeight: 16.5, flexShrink: 1 },
  linkValue: { fontFamily: F.semi, color: C.navy, textDecorationLine: 'underline' },
  ctaRow: { flexDirection: 'row', gap: 12 },
  cta: { flex: 1, height: 54, borderRadius: 12, backgroundColor: C.navy, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 12 },
  ctaText: { fontFamily: F.semi, fontSize: 17, lineHeight: 25.5, color: '#FFFFFF' },
  shareSquare: { width: 54, height: 54, borderRadius: 12, backgroundColor: C.soft, borderWidth: 1, borderColor: C.softBorder, alignItems: 'center', justifyContent: 'center' },

  // History view
  historyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  historyTitle: { fontFamily: F.semi, fontSize: 17, lineHeight: 25.5 },
  retryBar: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 12, backgroundColor: '#FDECEC' },
  retryText: { fontFamily: F.med, fontSize: 13, color: C.red },

  earnCard: { borderRadius: 16, padding: 16, gap: 4 },
  earnLabel: { fontFamily: F.med, fontSize: 13, lineHeight: 19.5, color: 'rgba(255,255,255,0.85)' },
  earnAmount: { fontFamily: F.bold, fontSize: 28, lineHeight: 38, color: '#FFFFFF' },
  earnPending: { fontFamily: F.med, fontSize: 11, color: '#FFE7A3' },
  earnStats: { flexDirection: 'row', alignItems: 'center', marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.2)' },
  earnDivider: { width: 1, height: 24, backgroundColor: 'rgba(255,255,255,0.2)' },
  statValue: { fontFamily: F.bold, fontSize: 17, lineHeight: 25.5, color: '#FFFFFF' },
  statLabel: { fontFamily: F.med, fontSize: 11, color: 'rgba(255,255,255,0.8)' },
  withdrawBtn: { marginTop: 14, height: 44, borderRadius: 10, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  withdrawBtnText: { fontFamily: F.semi, fontSize: 15, color: C.purple },

  field: { height: 48, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, fontFamily: F.med, fontSize: 15 },
  fieldLabel: { fontFamily: F.semi, fontSize: 13 },
  mobileRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  prefix: { fontFamily: F.semi, fontSize: 15 },
  mobileInput: { flex: 1, height: '100%', fontFamily: F.med, fontSize: 15, paddingVertical: 0 },
  navyBtn: { height: 48, borderRadius: 12, backgroundColor: C.navy, alignItems: 'center', justifyContent: 'center' },
  navyBtnText: { fontFamily: F.semi, fontSize: 15, color: '#FFFFFF' },

  tabs: { flexDirection: 'row', borderWidth: 1, borderRadius: 10, padding: 3, marginBottom: 4 },
  tab: { flex: 1, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontFamily: F.semi, fontSize: 13 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1 },
  rowIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: F.semi, fontSize: 13, lineHeight: 19.5 },
  rowAmount: { fontFamily: F.semi, fontSize: 13 },
  badge: { borderRadius: 24, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontFamily: F.semi, fontSize: 11 },
  empty: { alignItems: 'center', paddingVertical: 28 },

  centerState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  stateTitle: { fontFamily: F.semi, fontSize: 19, lineHeight: 28.5, textAlign: 'center' },
  stateCopy: { fontFamily: F.med, fontSize: 13, lineHeight: 19.5, textAlign: 'center', marginTop: 6 },

  // Withdraw sheet
  scrim: { flex: 1, backgroundColor: 'rgba(38,38,38,0.32)', justifyContent: 'center', padding: 20 },
  sheet: { borderRadius: 20, padding: 20, maxHeight: '90%' },
  sheetHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sheetTitle: { fontFamily: F.semi, fontSize: 19, lineHeight: 28.5 },
  balanceBox: { alignItems: 'center', padding: 14, borderRadius: 12, backgroundColor: C.greenTint, gap: 2 },
  balanceValue: { fontFamily: F.bold, fontSize: 26, lineHeight: 36, color: C.green },
  maxBtn: { paddingHorizontal: 10, height: 30, borderRadius: 8, backgroundColor: '#F0EFFD', alignItems: 'center', justifyContent: 'center' },
  maxText: { fontFamily: F.bold, fontSize: 11, color: C.purple },
  methodRow: { flexDirection: 'row', gap: 8 },
  methodBtn: { flex: 1, height: 40, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  methodText: { fontFamily: F.semi, fontSize: 13 },
});