import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Modal, Image, RefreshControl, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Page, LoginBottomSheet } from '@/components';
import { useSawari } from '@/context/SawariContext';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { getAutoApplyCash, setAutoApplyCash } from '@/utils/cashPreference';
import { DesignToggle } from '@/components/profile/ProfileParts';
import { ModalBlur } from '@/components/common/ModalBlur';

// Figma "Profile": purple header (name, mobile, email), membership card, Wallet Balance, then one bordered
// list of account rows with dashed dividers.

const FONT = { regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold', bold: 'PlusJakartaSans_700Bold' };
// Page background: linear-gradient(180deg, #6152D8 0%, #9C90F3 20%) of the 852px frame, i.e. flat #9C90F3 from y=170 down.
const HEADER = ['#6152D8', '#9C90F3', '#9C90F3'] as const;
const PURPLE = '#6152D8';

type PlanKey = 'starter' | 'plus' | 'pro';
const PLANS: Record<PlanKey, { name: string; pct: string; yearly: string; icon: any; next?: PlanKey }> = {
  starter: { name: 'Starter', pct: '5%', yearly: '₹10,000', icon: require('@/assets/images/plan_starter.png'), next: 'plus' },
  plus: { name: 'Plus', pct: '10%', yearly: '₹15,000', icon: require('@/assets/images/plan_plus.png'), next: 'pro' },
  pro: { name: 'Pro', pct: '12.5%', yearly: '₹20,000', icon: require('@/assets/images/plan_pro.png') },
};

/** "9876543210" → "+91 98765 43XXX" (the design keeps the last digits private on screen). */
function maskMobile(m?: string) {
  const d = String(m || '').replace(/\D/g, '').slice(-10);
  if (d.length !== 10) return m || '';
  return `+91 ${d.slice(0, 5)} ${d.slice(5, 7)}XXX`;
}

const inr2 = (n: number) => `₹${(Number(n) || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const inr0 = (n: number) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

export default function ProfileScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomNavHeight = useBottomNavHeight();
  const { customer, sawariCash, walletBalance, isAuthenticated, membership, fetchWallet, logout } = useSawari();
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  // Figma: the card's top lines up with the ⋮ icon's top and its right edge sits 4px left of the icon.
  const moreRef = useRef<View>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const { width: screenW } = useWindowDimensions();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const doLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
      router.replace('/');
    }
  };
  const [refreshing, setRefreshing] = useState(false);
  const [autoCash, setAutoCash] = useState(false);

  useFocusEffect(
    useCallback(() => {
      import('@/services/api/activity').then(({ ActivityAPI }) => ActivityAPI.logActivity('view_profile', 'ProfileScreen'));
      // Balance and membership fresh every time the tab opens.
      if (isAuthenticated) fetchWallet().catch(() => {});
    }, [isAuthenticated]), // eslint-disable-line react-hooks/exhaustive-deps
  );

  useEffect(() => {
    if (isAuthenticated) getAutoApplyCash(customer?.id).then(setAutoCash);
  }, [isAuthenticated, customer?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchWallet().catch(() => {});
    setRefreshing(false);
  }, [fetchWallet]);

  const go = (path: any) => {
    Haptics.selectionAsync();
    router.push(path);
  };

  const toggleCash = (on: boolean) => {
    Haptics.selectionAsync();
    setAutoCash(on);
    setAutoApplyCash(customer?.id, on);
  };

  const planKey = String(membership?.plan || '').toLowerCase() as PlanKey;
  const active = !!PLANS[planKey] && (!membership?.expiresAt || new Date(membership.expiresAt) > new Date());
  const plan = active ? PLANS[planKey] : null;
  // 170px of the design's 59 + 147 header (status bar + content) is the gradient; the rest is flat.
  const headerStops = [0, Math.min(0.9, 170 / (insets.top + 147)), 1] as const;

  // ── Logged out ──
  if (!isAuthenticated) {
    return (
      <Page bottomNav scroll={false}>
        <StatusBar style="light" />
        <LinearGradient colors={HEADER} locations={headerStops} style={[styles.header, { paddingTop: insets.top + 64 }]}>
          <Text style={styles.name}>Hello, Guest</Text>
          <Text style={styles.contact}>Log in to see your profile, wallet and trips.</Text>
        </LinearGradient>
        <View style={[styles.sheet, { backgroundColor: p.page }]}>
          <View style={[styles.guestCard, { borderColor: p.border, backgroundColor: p.summary }]}>
            <View style={[styles.guestIcon, { backgroundColor: p.purpleBg }]}>
              <Feather name="user" size={26} color={PURPLE} />
            </View>
            <Text style={[styles.guestTitle, { color: p.fg }]}>Sign in to MySawari</Text>
            <Text style={[styles.guestSub, { color: p.muted }]}>Your Sawari Cash, membership, saved places and refunds live here.</Text>
            <Pressable accessibilityRole="button" onPress={() => setShowLogin(true)} style={({ pressed }) => [styles.guestBtn, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}>
              <Text style={styles.guestBtnText}>Log In</Text>
            </Pressable>
          </View>
        </View>
        <LoginBottomSheet visible={showLogin} onClose={() => setShowLogin(false)} />
      </Page>
    );
  }

  type RowDef = { key: string; icon: any; title: string; sub?: string; onPress?: () => void; cash?: boolean };
  const rows: RowDef[] = [
    { key: 'fav', icon: 'heart', title: 'Favourite Cars', sub: 'Saved vehicles', onPress: () => go('/wishlist') },
    { key: 'addr', icon: 'map-pin', title: 'Saved Addresses', sub: 'Home, work and other locations', onPress: () => go('/saved-addresses') },
    { key: 'refer', icon: 'credit-card', title: 'Refer & Earn', sub: 'Invite friends and earn 10%', onPress: () => go('/refer') },
    { key: 'cash', icon: 'dollar-sign', title: 'My Sawari Cash', cash: true },
    { key: 'track', icon: 'users', title: 'Referral Tracking', sub: 'Track your referrals', onPress: () => go('/referrals') },
    { key: 'refunds', icon: 'rotate-ccw', title: 'My Refunds', sub: 'Refunds on cancellations', onPress: () => go('/refunds') },
    { key: 'offers', icon: 'tag', title: 'Offers & coupons', sub: 'Choose a coupon to save on your trip', onPress: () => go('/offers') },
  ];
  // Second card (design): plain rows without a subtitle.
  const infoRows: RowDef[] = [
    { key: 'safety', icon: 'shield', title: 'Safety', onPress: () => go('/safety') },
    { key: 'terms', icon: 'file-text', title: 'Terms & Condition', onPress: () => go('/terms') },
    { key: 'cancel', icon: 'x-square', title: 'Cancellation Policy', onPress: () => go('/cancellation-policy') },
    { key: 'privacy', icon: 'file-text', title: 'Privacy Policy', onPress: () => go('/privacy') },
  ];

  return (
    <Page bottomNav scroll={false}>
      <StatusBar style="light" />
      <ScrollView
        style={{ flex: 1, backgroundColor: p.page }}
        contentContainerStyle={{ paddingBottom: bottomNavHeight + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" progressViewOffset={insets.top} />}
      >
        {/* ── Header ── */}
        <LinearGradient colors={HEADER} locations={headerStops} style={[styles.header, { paddingTop: insets.top + 4 }]}>
          <View style={styles.headerTop}>
            <Pressable ref={moreRef} collapsable={false} accessibilityRole="button" accessibilityLabel="More options" hitSlop={10} onPress={() => {
              Haptics.selectionAsync();
              moreRef.current?.measureInWindow((x, y) => { setMenuPos({ top: y, right: screenW - x + 4 }); setMenuOpen(true); });
            }} style={styles.more}>
              <Feather name="more-vertical" size={24} color="#FFFFFF" />
            </Pressable>
          </View>
          <Text style={styles.name} numberOfLines={1}>{customer.name?.trim() || 'Add your name'}</Text>
          {!!customer.mobile && <Text style={styles.contact}>{maskMobile(customer.mobile)}</Text>}
          {!!customer.email && <Text style={styles.contact} numberOfLines={1}>{customer.email}</Text>}
        </LinearGradient>

        <View style={[styles.sheet, { backgroundColor: p.page }]}>
          {/* ── Membership ── */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={plan ? `${plan.name} membership, ${plan.pct} off every trip` : 'Membership, up to 12.5% off every trip'}
            onPress={() => go(plan?.next ? { pathname: '/membership', params: { plan: plan.next } } : '/membership')}
            style={({ pressed }) => [styles.memberCard, { backgroundColor: p.segOn, borderColor: p.segBorder }, pressed && { opacity: 0.92 }]}
          >
            <View style={styles.memberTop}>
              <View style={{ flex: 1, gap: 2 }}>
                <View style={styles.planRow}>
                  {plan ? (
                    <>
                      <View style={styles.planNameRow}>
                        <Image source={plan.icon} style={styles.planIcon} resizeMode="contain" />
                        <Text style={[styles.planName, { color: p.fg }]}>{plan.name}</Text>
                      </View>
                      <View style={[styles.offChip, { backgroundColor: p.green }]}>
                        <Text style={styles.offChipText}>{plan.pct} off every trip</Text>
                      </View>
                    </>
                  ) : (
                    <Stars />
                  )}
                </View>
                <Text style={[styles.memberTitle, { color: p.fg }]}>{plan ? `Save up to ${plan.yearly}/year` : 'Explore our membership'}</Text>
              </View>
              {(!plan || plan.next) && (
                <View style={styles.upgrade}>
                  <Text style={styles.upgradeText}>{plan ? 'Upgrade' : 'Get membership'}</Text>
                  <Feather name="arrow-up-right" size={10} color="#FFFFFF" />
                </View>
              )}
            </View>
            <Text style={[styles.memberSub, { color: p.muted }]}>Enjoy member-only deals on your rentals.</Text>
          </Pressable>

          {/* ── Wallet ── */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Wallet balance ${inr2(walletBalance)}`}
            onPress={() => go('/wallet')}
            style={({ pressed }) => [styles.wallet, { borderColor: p.segBorder, backgroundColor: p.page }, pressed && { opacity: 0.92 }]}
          >
            <Text style={[styles.walletLabel, { color: p.fg }]}>Wallet Balance</Text>
            <Text style={[styles.walletValue, { color: p.navy }]}>{inr2(walletBalance)}</Text>
          </Pressable>

          {/* ── Rows ── */}
          <View style={[styles.list, { borderColor: p.segBorder, backgroundColor: p.page }]}>
            {rows.map((r, i) => (
              <React.Fragment key={r.key}>
                {i > 0 && <Dashes color={p.segBorder} />}
                <Pressable
                  accessibilityRole={r.cash ? undefined : 'button'}
                  disabled={!!r.cash}
                  onPress={r.onPress}
                  style={({ pressed }) => [styles.row, pressed && !r.cash && { backgroundColor: p.soft }]}
                >
                  <View style={[styles.rowIcon, { backgroundColor: p.segOn }]}>
                    <Feather name={r.icon} size={16} color={p.fg} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.rowTitle, { color: p.fg }]}>{r.title}</Text>
                    {r.cash ? (
                      <View style={[styles.cashChip, { backgroundColor: p.summary }]}>
                        <Text style={[styles.cashChipText, { color: p.navy }]}>{inr0(sawariCash)} available</Text>
                      </View>
                    ) : (
                      !!r.sub && <Text style={[styles.rowSub, { color: p.muted }]} numberOfLines={1}>{r.sub}</Text>
                    )}
                  </View>
                  {r.cash ? (
                    <DesignToggle value={autoCash} onValueChange={toggleCash} accessibilityLabel="Use Sawari Cash on my bookings automatically" />
                  ) : (
                    <Feather name="chevron-right" size={16} color={p.muted} />
                  )}
                </Pressable>
              </React.Fragment>
            ))}
          </View>
          {/* {autoCash && sawariCash > 0 && (
            <Text style={[styles.cashNote, { color: p.muted }]}>Sawari Cash is applied automatically at checkout (up to ₹50 or 10% of the rent per trip).</Text>
          )} */}
          {/* ── Safety / Terms / Cancellation ── */}
          <View style={[styles.list, { borderColor: p.segBorder, backgroundColor: p.page }]}>
            {infoRows.map((r, i) => (
              <React.Fragment key={r.key}>
                {i > 0 && <Dashes color={p.segBorder} />}
                <Pressable accessibilityRole="button" onPress={r.onPress} style={({ pressed }) => [styles.row, styles.rowPlain, pressed && { backgroundColor: p.soft }]}>
                  <View style={[styles.rowIcon, { backgroundColor: p.segOn }]}>
                    <Feather name={r.icon} size={16} color={p.fg} />
                  </View>
                  <Text style={[styles.rowTitle, { color: p.fg, flex: 1 }]}>{r.title}</Text>
                  <Feather name="chevron-right" size={16} color={p.muted} />
                </Pressable>
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── ⋮ menu (design: Edit Profile / Settings / Logout) ── */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { top: menuPos?.top ?? insets.top + 4, right: menuPos?.right ?? 44, backgroundColor: p.page }]}>
            {[
              { label: 'Edit Profile', onPress: () => go('/edit-profile') },
              { label: 'Settings', onPress: () => go('/settings') },
              { label: 'Logout', onPress: () => { Haptics.selectionAsync(); setConfirmLogout(true); } },
            ].map((m) => (
              <Pressable
                key={m.label}
                accessibilityRole="menuitem"
                onPress={() => { setMenuOpen(false); m.onPress(); }}
                style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: p.soft }]}
              >
                <Text style={[styles.menuText, { color: p.fg }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── Logout confirmation ── */}
      <Modal visible={confirmLogout} transparent animationType="fade" onRequestClose={() => !loggingOut && setConfirmLogout(false)}>
        <View style={[styles.dialogOverlay]}>
          <ModalBlur />
           <View  style={[StyleSheet.absoluteFill, styles.dim]}/>
          <View style={[styles.dialog, { backgroundColor: p.page }]} accessibilityViewIsModal>
            <Text style={[styles.dialogTitle, { color: p.fg }]}>Are You Sure ?</Text>
            <Text style={[styles.dialogBody, { color: p.muted }]}>You will not be able to reuse previous old number for the next 6 months. Do you want to continue?</Text>
            <View style={styles.dialogBtns}>
              <Pressable
                accessibilityRole="button"
                onPress={doLogout}
                disabled={loggingOut}
                style={({ pressed }) => [styles.dialogBtn, { backgroundColor: p.redBg }, (pressed || loggingOut) && { opacity: 0.8 }]}
              >
                <Text style={[styles.dialogBtnText, { color: p.red }]}>{loggingOut ? 'Logging out…' : 'Logout'}</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={() => setConfirmLogout(false)}
                disabled={loggingOut}
                style={({ pressed }) => [styles.dialogBtn, { backgroundColor: p.soft }, pressed && { opacity: 0.8 }]}
              >
                <Text style={[styles.dialogBtnText, { color: p.navy }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </Page>
  );
}

/** Five gold stars, small–big–biggest–big–small (design: "Explore our membership"). */
function Stars() {
  const sizes = [11, 14, 17, 14, 11];
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 1 }} accessible={false}>
      {sizes.map((s, i) => <Ionicons key={i} name="star" size={s} color="#FBBC04" />)}
    </View>
  );
}

/** Dashed divider (a one-sided dashed border isn't reliable on iOS). */
function Dashes({ color }: { color: string }) {
  return (
    <View style={styles.dashes}>
      {Array.from({ length: 70 }, (_, i) => <View key={i} style={[styles.dash, { backgroundColor: color }]} />)}
    </View>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(0, 0, 0, 0.32)' },
  header: { paddingLeft: 16, paddingRight: 16, paddingBottom: 16 + 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'flex-end', height: 24, alignItems: 'center', marginBottom: 32 },
  more: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: FONT.bold, fontSize: 19, lineHeight: 28, color: '#FFFFFF', marginBottom: 2 },
  contact: { fontFamily: FONT.medium, fontSize: 13, lineHeight: 20, color: '#FFFFFF' },

  // Figma: white sheet, 1px #E7EAF4 border (not at the bottom), 24px top corners; the cards have 8px of their own above and below.
  sheet: { flexGrow: 1, marginTop: -24, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, borderColor: '#E7EAF4', paddingHorizontal: 15, paddingTop: 12 },

  memberCard: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 2 },
  memberTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 2 },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 23 },
  planNameRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  planIcon: { width: 16, height: 16 },
  planName: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 23 },
  offChip: { height: 20, paddingHorizontal: 8, borderRadius: 24, justifyContent: 'center' },
  offChipText: { fontFamily: FONT.bold, fontSize: 8, lineHeight: 12, color: '#FFFFFF' },
  upgrade: { height: 26, paddingTop: 4, paddingBottom: 5, paddingHorizontal: 12, borderRadius: 31, backgroundColor: '#6B5AED', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2 },
  upgradeText: { fontFamily: FONT.bold, fontSize: 11, lineHeight: 17, color: '#FFFFFF' },
  memberTitle: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 23 },
  memberSub: { fontFamily: FONT.medium, fontSize: 13, lineHeight: 20 },

  wallet: { borderWidth: 1, borderRadius: 12, height: 60, paddingVertical: 16, paddingHorizontal: 12, gap: 12, marginTop: 16, flexDirection: 'row', alignItems: 'center' },
  walletLabel: { flex: 1, fontFamily: FONT.semibold, fontSize: 17, lineHeight: 26 },
  walletValue: { fontFamily: FONT.bold, fontSize: 17, lineHeight: 26, textAlign: 'right' },

  list: { borderWidth: 1, borderRadius: 12, marginTop: 16, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 12, paddingVertical: 12, minHeight: 61 },
  rowPlain: { minHeight: 60 },
  rowIcon: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontFamily: FONT.semibold, fontSize: 13, lineHeight: 20 },
  rowSub: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 17 },
  cashChip: { alignSelf: 'flex-start', height: 17, paddingHorizontal: 4, borderRadius: 2, justifyContent: 'center' },
  cashChipText: { fontFamily: FONT.medium, fontSize: 11, lineHeight: 17 },
  cashNote: { fontFamily: FONT.regular, fontSize: 11, lineHeight: 16, marginTop: 8, paddingHorizontal: 4 },
  dashes: { flexDirection: 'row', overflow: 'hidden', gap: 3, marginHorizontal: 0 },
  dash: { width: 4, height: 1 },

  guestCard: { borderWidth: 1, borderRadius: 12, padding: 20, alignItems: 'center', marginTop: 4 },
  guestIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  guestTitle: { fontFamily: FONT.semibold, fontSize: 17, marginTop: 14 },
  guestSub: { fontFamily: FONT.regular, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 },
  guestBtn: { alignSelf: 'stretch', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  guestBtnText: { fontFamily: FONT.semibold, fontSize: 16, color: '#FFFFFF' },

  menuOverlay: { flex: 1 },
  // Figma: 92×111 white card, radius 8, three 35px rows, 12px side padding.
  menu: { position: 'absolute', width: 92, borderRadius: 8, paddingVertical: 3, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 6 },
  menuItem: { paddingHorizontal: 12, height: 35, justifyContent: 'center' },
  menuText: { fontFamily: FONT.medium, fontSize: 12, lineHeight: 18 },
  dialogOverlay: { flex: 1, justifyContent: 'center', paddingHorizontal: 18 },
  dialog: { borderRadius: 12, paddingHorizontal: 8, paddingTop: 20, paddingBottom: 12 },
  dialogTitle: { fontFamily: FONT.semibold, fontSize: 19, lineHeight: 25, textAlign: 'center' },
  dialogBody: { fontFamily: FONT.medium, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 10, paddingHorizontal: 12 },
  dialogBtns: { flexDirection: 'row', gap: 12, marginTop: 20 },
  dialogBtn: { flex: 1, height: 47, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dialogBtnText: { fontFamily: FONT.semibold, fontSize: 15},
});