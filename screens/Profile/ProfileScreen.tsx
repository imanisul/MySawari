import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Animated, Pressable, Modal, Image, Platform, RefreshControl, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Feather, Ionicons } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { HeartIcon } from '@/components/vehicle/HeartIcon';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Page, LoginBottomSheet } from '@/components';
import { useSawari } from '@/context/SawariContext';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { getAutoApplyCash, setAutoApplyCash } from '@/utils/cashPreference';
import { usePrefetchReferrals } from '@/utils/referrals';
import { DesignToggle } from '@/components/profile/ProfileParts';
import { openStorePage } from '@/services/rateApp';
import { ModalBlur } from '@/components/common/ModalBlur';

// Figma "Profile": purple header (name, mobile, email), membership card, Wallet Balance, then one bordered
// list of account rows with dashed dividers.

const FONT = { regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold', bold: 'PlusJakartaSans_700Bold' };
// Page background: the Home header's purple (#332B72 → #6B5AED by y=170), flat from there down.
const HEADER = ['#332B72', '#6B5AED', '#6B5AED'] as const; // same purple as the Home header
const PURPLE = '#323E71';

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
  usePrefetchReferrals(); // My Referrals then opens already filled
  const [showLogin, setShowLogin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  // Figma: the card's top lines up with the ⋮ icon's top and its right edge sits 4px left of the icon.
  const moreRef = useRef<View>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; right: number } | null>(null);
  const { width: screenW } = useWindowDimensions();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const doLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // One motion at a time: the confirm popup closes and the page flips home first; only then does the session end,
    // so the sign-in sheet slides up over a settled Home instead of over a popup and a transition at once.
    setConfirmLogout(false);
    router.replace('/');
    await new Promise((r) => setTimeout(r, 300)); // just long enough for Home to settle
    await logout();
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

  type RowDef = { key: string; icon: any; title: string; sub?: string; onPress?: () => void; cash?: boolean; isPublic?: boolean };
  const rows: RowDef[] = [
    { key: 'fav', icon: 'heart', title: 'Favourite Cars', sub: 'Saved vehicles', onPress: () => go('/wishlist') },
    { key: 'addr', icon: 'map-pin', title: 'Saved Addresses', sub: 'Home, work and other locations', onPress: () => go('/saved-addresses') },
    { key: 'refer', icon: 'credit-card', title: 'Refer & Earn', sub: 'Invite friends and earn 10%', onPress: () => go('/refer') },
    { key: 'track', icon: 'users', title: 'Referral Tracking', sub: 'Track your referrals', onPress: () => go('/referrals') },
    { key: 'rewards', icon: 'award', title: 'Rewards', sub: 'Trip milestones and rewards earned', onPress: () => go('/rewards') },
    { key: 'cash', icon: 'dollar-sign', title: 'SawariCash', cash: true },
    { key: 'refunds', icon: 'rotate-ccw', title: 'My Refunds', sub: 'Refunds on cancellations', onPress: () => go('/refunds') },
    { key: 'offers', icon: 'tag', title: 'Offers & coupons', sub: 'Choose a coupon to save on your trip', onPress: () => go('/offers') },
  ];
  // Information and support rows
  const infoRows: RowDef[] = [
    // { key: 'help', icon: 'help-circle', title: 'Help & Support', onPress: () => go('/help') },
    // { key: 'safety', icon: 'shield', title: 'Safety', onPress: () => go('/safety') },
    { key: 'rate', icon: 'star', title: Platform.OS === 'ios' ? 'Rate us on the App Store' : 'Rate us on Play Store', onPress: () => { Haptics.selectionAsync(); openStorePage(); } },
    { key: 'terms', icon: 'file-text', title: 'Terms & Condition', onPress: () => go('/terms') },
    { key: 'cancel', icon: 'x-square', title: 'Cancellation Policy', onPress: () => go('/cancellation-policy') },
    { key: 'privacy', icon: 'file-text', title: 'Privacy Policy', onPress: () => go('/privacy') },
  ];

  // Guest: same page, only what works without an account. Anything personal opens the login sheet.
  const askLogin = () => { Haptics.selectionAsync(); setShowLogin(true); };
  const guestRows: RowDef[] = [
    { key: 'offers', icon: 'tag', title: 'Offers & coupons', sub: 'Choose a coupon to save on your trip', onPress: () => go('/offers') },
    { key: 'refer', icon: 'credit-card', title: 'Refer & Earn', sub: 'Invite friends and earn 10%', onPress: askLogin },
    { key: 'fav', icon: 'heart', title: 'Favourite Cars', sub: 'Saved vehicles', onPress: askLogin },
    { key: 'addr', icon: 'map-pin', title: 'Saved Addresses', sub: 'Home, work and other locations', onPress: askLogin },
  ];
  const listRows = isAuthenticated ? rows : guestRows;

  return (
    <Page bottomNav scroll={false}>
      <StatusBar style="light" />
      <Animated.ScrollView
        style={{ flex: 1, backgroundColor: p.page }}
        contentContainerStyle={{ paddingBottom: bottomNavHeight + 24 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true })}
        refreshControl={isAuthenticated ? <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFFFFF" progressViewOffset={insets.top} /> : undefined}
      >
        {/* Pulling the page down (iOS bounce) shows more of the header's purple instead of white above it. */}
        <View pointerEvents="none" style={{ position: 'absolute', top: -1200, left: 0, right: 0, height: 1200, backgroundColor: HEADER[0] }} />
        {/* ── Header ── */}
        <LinearGradient colors={HEADER} locations={headerStops} style={[styles.header, { paddingTop: insets.top + 4 }]}>
          {isAuthenticated ? (
            <>
              {/* Space for the ⋮, which is pinned over the page (below) so it never scrolls away. */}
              <View style={styles.headerTop} />
              <Text style={styles.name} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{customer.name?.trim() || 'Add your name'}</Text>
              {!!customer.mobile && <Text style={styles.contact}>{maskMobile(customer.mobile)}</Text>}
              {!!customer.email && <Text style={styles.contact} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{customer.email}</Text>}
            </>
          ) : (
            <>
              <View style={styles.headerTop} />
              <Text style={styles.name}>Guest</Text>
              <Text style={styles.contact}>Log in to see your trips, wallet and rewards.</Text>
              <Pressable accessibilityRole="button" onPress={askLogin} style={({ pressed }) => [styles.guestLogin, pressed && { opacity: 0.85 }]}>
                <Text style={styles.guestLoginText}>Log In / Sign Up</Text>
              </Pressable>
            </>
          )}
        </LinearGradient>

        <View style={[styles.sheet, { backgroundColor: p.page }]}>
          {/* ── Membership ── */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={plan ? `${plan.name} membership, ${plan.pct} off every trip` : 'Membership, up to 12.5% off every trip'}
            onPress={() => (isAuthenticated ? go(plan?.next ? { pathname: '/membership', params: { plan: plan.next } } : '/membership') : askLogin())}
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
                <Text style={[styles.memberTitle, { color: p.fg, fontSize: Math.min(15, screenW / 26) }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{plan ? `Save up to ${plan.yearly}/year` : 'Explore our membership'}</Text>
              </View>
              {(!plan || plan.next) && (
                <View style={styles.upgrade}>
                  <Text style={styles.upgradeText}>{plan ? 'Upgrade' : 'Get membership'}</Text>
                  {/* Horizontal right arrow (→) matching the 20×20 icon spec */}
                  <Svg width={11} height={11} viewBox="0 0 10 10" fill="none" stroke="#FFFFFF" strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
                    <Path d="M1.75 5H8.25M5 1.75L8.25 5L5 8.25" />
                  </Svg>
                </View>
              )}
            </View>
            <Text style={[styles.memberSub, { color: p.muted }]}>Enjoy member-only deals on your rentals.</Text>
          </Pressable>

          {/* ── Wallet ── */}
          {isAuthenticated && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Wallet balance ${inr2(walletBalance)}`}
            onPress={() => go('/wallet')}
            style={({ pressed }) => [styles.wallet, { borderColor: p.segBorder, backgroundColor: p.page }, pressed && { opacity: 0.92 }]}
          >
            <Text style={[styles.walletLabel, { color: p.fg }]}>Wallet Balance</Text>
            <Text style={[styles.walletValue, { color: p.navy }]}>{inr2(walletBalance)}</Text>
          </Pressable>)}

          {/* ── Rows ── */}
          <View style={[styles.list, { borderColor: p.segBorder, backgroundColor: p.page }]}>
            {listRows.map((r, i) => (
              <React.Fragment key={r.key}>
                {i > 0 && <Dashes color={p.segBorder} />}
                <Pressable
                  accessibilityRole={r.cash ? undefined : 'button'}
                  disabled={!!r.cash}
                  onPress={r.onPress}
                  style={({ pressed }) => [styles.row, pressed && !r.cash && { backgroundColor: p.soft }]}
                >
                  <View style={[styles.rowIcon, { backgroundColor: p.segOn }]}>
                    {r.icon === 'heart'
                      ? <HeartIcon width={16} height={16} color={p.fg} strokeWidth={1.5} />
                      : <Feather name={r.icon} size={16} color={p.fg} />}
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.rowTitle, { color: p.fg }]}>{r.title}</Text>
                    {r.cash ? (
                      <View style={[styles.cashChip, { backgroundColor: p.summary }]}>
                        <Text style={[styles.cashChipText, { color: p.navy }]}>{inr0(sawariCash)} available</Text>
                      </View>
                    ) : (
                      !!r.sub && <Text style={[styles.rowSub, { color: p.muted }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{r.sub}</Text>
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
                    {r.icon === 'heart'
                      ? <HeartIcon width={16} height={16} color={p.fg} strokeWidth={1.5} />
                      : <Feather name={r.icon} size={16} color={p.fg} />}
                  </View>
                  <Text style={[styles.rowTitle, { color: p.fg, flex: 1 }]}>{r.title}</Text>
                  <Feather name="chevron-right" size={16} color={p.muted} />
                </Pressable>
              </React.Fragment>
            ))}
          </View>
        </View>
      </Animated.ScrollView>

      {/* Scrolled past the name: a solid purple bar with "My Profile" holds the status bar area, so the clock,
          battery and notification icons (white) never sit on top of the white page content. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.stickyBar, { height: insets.top + 52, opacity: scrollY.interpolate({ inputRange: [70, 120], outputRange: [0, 1], extrapolate: 'clamp' }) }]}
      >
        {/* Solid #6B5AED while scrolling (the app's button purple). */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#6B5AED', paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={styles.stickyTitle}>My Profile</Text>
        </View>
      </Animated.View>
      {/* ⋮ pinned top-right, on top of the purple "My Profile" bar, so it is always there however far you scroll. */}
      {isAuthenticated && (
        <View style={[styles.morePinned, { top: insets.top + 4 }]}>
          <Pressable ref={moreRef} collapsable={false} accessibilityRole="button" accessibilityLabel="More options" hitSlop={10} onPress={() => {
                  Haptics.selectionAsync();
                  // The menu always drops down just under the ⋮, right edges lined up, wherever the page is scrolled.
                  // (It used to sit 40 below the dots' top and to their left, so it looked like it opened somewhere random.)
                  moreRef.current?.measureInWindow((x, y, w, h) => {
                    const ok = [x, y, w, h].every(Number.isFinite) && w > 0;
                    setMenuPos(ok ? { top: y + h + 6, right: Math.max(8, screenW - (x + w)) } : null);
                    setMenuOpen(true);
                  });
                }} style={({ pressed }) => [styles.more, pressed && { opacity: 0.6 }]}>
                  <Feather name="more-vertical" size={24} color="#FFFFFF" />
                </Pressable>
        </View>
      )}
      <LoginBottomSheet visible={showLogin} onClose={() => setShowLogin(false)} />

      {/* ── ⋮ menu (design: Edit Profile / Settings / Logout) ── */}
      <Modal visible={menuOpen} transparent animationType="fade" onRequestClose={() => setMenuOpen(false)} statusBarTranslucent navigationBarTranslucent>
        <Pressable style={styles.menuOverlay} onPress={() => setMenuOpen(false)}>
          <View style={[styles.menu, { top: menuPos?.top ?? insets.top + 34, right: menuPos?.right ?? 16, backgroundColor: p.page, borderColor: p.segBorder }]}>
            {[
              { label: 'Edit Profile', onPress: () => go('/edit-profile') },
              { label: 'Settings', onPress: () => go('/settings') },
              { label: 'Logout', onPress: () => { Haptics.selectionAsync(); setConfirmLogout(true); } },
            ].map((m) => (
              <Pressable
                key={m.label}
                accessibilityRole="menuitem"
                onPress={() => {
                  setMenuOpen(false);
                  // Let the menu fade out first: opening the Logout popup (or a new page) while it is still closing
                  // made iOS drop the popup and the screens jump on top of each other.
                  setTimeout(m.onPress, 250);
                }}
                style={({ pressed }) => [styles.menuItem, pressed && { backgroundColor: p.soft }]}
              >
                <Text style={[styles.menuText, { color: p.fg }]}>{m.label}</Text>
              </Pressable>
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── Logout confirmation ── */}
      <Modal visible={confirmLogout} transparent animationType="fade" onRequestClose={() => !loggingOut && setConfirmLogout(false)} statusBarTranslucent navigationBarTranslucent>
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
  dim: { backgroundColor: 'transparent' },
  header: { paddingLeft: 16, paddingRight: 16, paddingBottom: 16 + 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'flex-end', height: 24, alignItems: 'center', marginBottom: 32 },
  more: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  // Same spot as the header row it used to sit in (16 from the right, 4 under the status bar, 24 high).
  morePinned: { position: 'absolute', right: 16, zIndex: 10, elevation: 10 },
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
  upgrade: { height: 26, paddingTop: 4, paddingBottom: 5, paddingHorizontal: 12, borderRadius: 31, backgroundColor: '#6B5AED', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  upgradeText: { fontFamily: FONT.bold, fontSize: 11, lineHeight: 17, color: '#FFFFFF' },
  memberTitle: { fontFamily: FONT.semibold, fontSize: 15, lineHeight: 20 },
  memberSub: { fontFamily: FONT.medium, fontSize: 13, lineHeight: 16.5 },

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

  stickyBar: { position: 'absolute', top: 0, left: 0, right: 0 },
  stickyTitle: { fontFamily: FONT.semibold, fontSize: 17, lineHeight: 24, color: '#FFFFFF' },
  guestLogin: { alignSelf: 'flex-start', marginTop: 14, paddingHorizontal: 18, height: 38, borderRadius: 19, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  guestLoginText: { fontFamily: FONT.semibold, fontSize: 13, color: PURPLE },



  menuOverlay: { flex: 1 },
  // Figma: 92×111 white card, radius 8, three 35px rows, 12px side padding.
  menu: { position: 'absolute', width: 92, borderRadius: 8, paddingVertical: 3, borderWidth: 1 },
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