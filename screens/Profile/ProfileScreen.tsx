import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Pressable, Animated, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Page, Header, PrimaryButton, CustomAlert } from '@/components';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { Feather } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginBottomSheet } from '@/components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { Reveal } from '@/components/common/Reveal';
import { useBottomNavHeight } from '@/hooks/useBottomNavHeight';
import { LoyaltySkeleton } from '@/components/loading/ScreenSkeletons';

// ─── Design tokens (from Figma) ────────────────────────────────────────────────
const T = {
  gradientTop: '#6152D8',
  gradientBottom: '#9C90F3',
  white: '#FFFFFF',
  neutral800: '#262626',
  neutral500: '#737373',
  neutral50: '#FAFAFA',
  surface: '#F9F9FB',
  border: '#EAECF1',
  sheetBorder: '#E7EAF4',
  primary500: '#2F3E75',
  chipBg: '#F4F6FA',
  green500: '#008758',
  violet: '#6B5AED',
};

const FONT = {
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
};

type MenuItem = {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Feather.glyphMap;
  type?: 'link' | 'toggle';
};

// ─── Small building blocks ────────────────────────────────────────────────────
function DashedDivider() {
  // Single-side dashed borders are unreliable on iOS; this clips a dashed box to 1px.
  return (
    <View style={styles.dashedClip}>
      <View style={styles.dashedLine} />
    </View>
  );
}

function SawariToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [value]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  const trackColor = anim.interpolate({ inputRange: [0, 1], outputRange: ['#D4D7E0', T.primary500] });

  return (
    <Pressable
      hitSlop={8}
      onPress={() => {
        Haptics.selectionAsync();
        onChange(!value);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Animated.View style={[styles.toggleTrack, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

function MenuGroup({
  items,
  onPress,
  renderRight,
  renderSubtitle,
}: {
  items: MenuItem[];
  onPress: (item: MenuItem) => void;
  renderRight?: (item: MenuItem) => React.ReactNode;
  renderSubtitle?: (item: MenuItem) => React.ReactNode;
}) {
  return (
    <View style={styles.menuCard}>
      {items.map((item, index) => {
        const custom = renderSubtitle?.(item);
        return (
          <View key={item.id}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.menuRow}
              onPress={() => onPress(item)}
              disabled={item.type === 'toggle'}
            >
              <View style={styles.menuIconBox}>
                <Feather name={item.icon} size={16} color={T.neutral800} />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuTitle} numberOfLines={1}>
                  {item.title}
                </Text>
                {custom ?? (item.subtitle ? <Text style={styles.menuSubtitle}>{item.subtitle}</Text> : null)}
              </View>
              {renderRight?.(item) ?? <Feather name="chevron-right" size={16} color={T.neutral500} />}
            </TouchableOpacity>
            {index !== items.length - 1 && <DashedDivider />}
          </View>
        );
      })}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const colors = useColors();
  const { customer, sawariCash, isAuthenticated, earnSawariCash } = useSawari();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [useSawariCash, setUseSawariCash] = useState(true);
  const insets = useSafeAreaInsets();
  const bottomNavHeight = useBottomNavHeight();
  const queryClient = useQueryClient();

  useFocusEffect(
    React.useCallback(() => {
      import('@/services/api/activity').then(({ ActivityAPI }) => {
        ActivityAPI.logActivity('view_profile', 'ProfileScreen');
      });
      return () => setShowOptions(false);
    }, [])
  );

  const formattedCash = `₹${Number(sawariCash || 0).toLocaleString('en-IN')}`;
  const formattedWallet = `₹ ${Number(sawariCash || 0).toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const accountItems: MenuItem[] = [
    { id: 'wishlist', title: 'Favourite Cars', subtitle: 'Saved vehicles', icon: 'heart' },
    { id: 'addresses', title: 'Saved Addresses', subtitle: 'Home, work and other locations', icon: 'map-pin' },
    { id: 'refer', title: 'Refer & Earn', subtitle: 'Invite friends and earn 10%', icon: 'credit-card' },
    { id: 'sawari-cash', title: 'My Sawari Cash', icon: 'dollar-sign', type: 'toggle' },
    { id: 'referral-tracking', title: 'Referral Tracking', subtitle: 'Tracking your referral', icon: 'users' },
    { id: 'refunds', title: 'My Refunds', subtitle: 'Refunds on cancellations', icon: 'rotate-ccw' },
    { id: 'rewards', title: 'Offers & coupons', subtitle: 'Choose a coupon to save on your trip', icon: 'tag' },
  ];

  const infoItems: MenuItem[] = [
    { id: 'safety', title: 'Safety', icon: 'shield' },
    { id: 'terms', title: 'Terms & Condition', icon: 'file-text' },
    { id: 'cancellation', title: 'Cancellation Policy', icon: 'x-circle' },
  ];

  // Logout lives in Settings
  const handleMenuPress = async (item: { id: string; title: string }) => {
    Haptics.selectionAsync();
    setShowOptions(false);
    if (item.id === 'wishlist') {
      router.push('/wishlist');
    } else if (item.id === 'membership') {
      router.push('/membership');
    } else if (item.id === 'rewards') {
      router.push('/rewards');
    } else if (item.id === 'refer' || item.id === 'referral-tracking') {
      router.push('/refer');
    } else if (item.id === 'settings' || item.id === 'logout') {
      router.push('/settings');
    } else if (item.id === 'edit-profile') {
      router.push('/edit-profile');
    } else if (item.id === 'safety') {
      router.push('/safety');
    } else if (item.id === 'help') {
      router.push('/help');
    } else {
      CustomAlert.alert('Coming Soon', `${item.title} section is under development.`);
    }
  };

  if (!isAuthenticated) {
    return (
      <Page bottomNav scroll={false}>
        <Header title="Profile" hideLogo={true} back={false} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Feather name="user" size={64} color={colors.mutedForeground} style={{ marginBottom: 24 }} />
          <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 24, textAlign: 'center', marginBottom: 12, color: colors.foreground }}>
            Sign In to MySawari
          </Text>
          <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 15, textAlign: 'center', color: colors.mutedForeground, marginBottom: 32 }}>
            You need to be logged in to view your profile, SawariCash, and settings.
          </Text>
          <View style={{ width: '100%' }}>
            <PrimaryButton label="Log In" onPress={() => setShowLogin(true)} />
          </View>
        </View>
        <LoginBottomSheet visible={showLogin} required onClose={() => setShowLogin(false)} />
      </Page>
    );
  }

  return (
    <Page bottomNav scroll={false}>
      <View style={styles.root}>
        {/* Purple gradient backdrop behind the header */}
        <LinearGradient
          colors={[T.gradientTop, T.gradientBottom]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.gradient, { height: insets.top + 240 }]}
        />

        <ScrollView
          contentContainerStyle={{ paddingTop: insets.top + 4 }}
          showsVerticalScrollIndicator={false}
          bounces={false}
          onScrollBeginDrag={() => setShowOptions(false)}
        >
          {/* Header: kebab + user details */}
          <Reveal delay={0}>
            <View style={styles.header}>
              <TouchableOpacity
                activeOpacity={0.7}
                hitSlop={10}
                style={styles.kebab}
                onPress={() => {
                  Haptics.selectionAsync();
                  setShowOptions(v => !v);
                }}
                accessibilityLabel="Profile options"
              >
                <Feather name="more-vertical" size={24} color={T.white} />
              </TouchableOpacity>

              <View style={styles.userInfo}>
                <Text style={styles.name} numberOfLines={1}>
                  {customer.name || 'User'}
                </Text>
                <Text style={styles.contact}>{customer.mobile || 'Add Mobile Number'}</Text>
                {!!customer.email && <Text style={styles.contact}>{customer.email}</Text>}
              </View>
            </View>
          </Reveal>

          {/* White sheet */}
          <View style={[styles.sheet, { paddingBottom: bottomNavHeight + insets.bottom + 24 }]}>
            {/* Membership */}
            <Reveal delay={60}>
              <View style={styles.section}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.membershipCard}
                  onPress={() => handleMenuPress({ id: 'membership', title: 'Membership' })}
                >
                  <View style={styles.membershipTop}>
                    <View style={{ flex: 1 }}>
                      <View style={styles.membershipTitleRow}>
                        <View style={styles.tierRow}>
                          <Feather name="award" size={16} color="#F5B400" />
                          <Text style={styles.tierText}>Starter</Text>
                        </View>
                        <View style={styles.savingsPill}>
                          <Text style={styles.savingsPillText}>Max ₹499 savings per trip</Text>
                        </View>
                      </View>
                      <Text style={styles.tierText}>Save up to ₹10,000/year</Text>
                    </View>
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={styles.upgradeBtn}
                      onPress={() => handleMenuPress({ id: 'membership', title: 'Membership' })}
                    >
                      <Text style={styles.upgradeText}>Upgrade</Text>
                      <Feather name="arrow-right" size={10} color={T.white} />
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.membershipSub}>Enjoy member-only deals on your rentals.</Text>
                </TouchableOpacity>
              </View>
            </Reveal>

            {/* Wallet balance */}
            <Reveal delay={120}>
              <View style={styles.section}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  style={styles.walletCard}
                  onPress={() => handleMenuPress({ id: 'rewards', title: 'Wallet' })}
                >
                  <Text style={styles.walletLabel}>Wallet Balance</Text>
                  <Text style={styles.walletValue} numberOfLines={1}>
                    {formattedWallet}
                  </Text>
                </TouchableOpacity>
              </View>
            </Reveal>

            {/* Account menu */}
            <Reveal delay={180}>
              <View style={styles.section}>
                <MenuGroup
                  items={accountItems}
                  onPress={handleMenuPress}
                  renderSubtitle={item =>
                    item.id === 'sawari-cash' ? (
                      <View style={styles.cashChip}>
                        <Text style={styles.cashChipText}>{formattedCash} available</Text>
                      </View>
                    ) : undefined
                  }
                  renderRight={item =>
                    item.type === 'toggle' ? (
                      <SawariToggle value={useSawariCash} onChange={setUseSawariCash} />
                    ) : undefined
                  }
                />
              </View>
            </Reveal>

            {/* Info menu */}
            <Reveal delay={240}>
              <View style={styles.section}>
                <MenuGroup items={infoItems} onPress={handleMenuPress} />
              </View>
            </Reveal>
          </View>
        </ScrollView>

        {/* Options dropdown */}
        {showOptions && (
          <>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setShowOptions(false)} />
            <View style={[styles.dropdown, { top: insets.top + 4 }]}>
              {[
                { id: 'edit-profile', title: 'Edit Profile' },
                { id: 'settings', title: 'Settings' },
                { id: 'logout', title: 'Logout' },
              ].map(opt => (
                <TouchableOpacity
                  key={opt.id}
                  activeOpacity={0.6}
                  style={styles.dropdownItem}
                  onPress={() => handleMenuPress(opt)}
                >
                  <Text style={styles.dropdownText}>{opt.title}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}
      </View>
    </Page>
  );
}

const shadow = Platform.select({
  ios: { shadowColor: '#2F3E75', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.12, shadowRadius: 14 },
  android: { elevation: 8 },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: T.white,
  },
  gradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  // Header
  header: {
    paddingHorizontal: 16,
    paddingBottom: 36,
    gap: 32,
  },
  kebab: {
    alignSelf: 'flex-end',
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    gap: 2,
  },
  name: {
    fontFamily: FONT.bold,
    fontSize: 19,
    lineHeight: 28,
    color: T.white,
  },
  contact: {
    fontFamily: FONT.medium,
    fontSize: 13,
    lineHeight: 20,
    color: T.white,
  },

  // Dropdown
  dropdown: {
    position: 'absolute',
    right: 44,
    width: 92,
    backgroundColor: T.white,
    borderRadius: 8,
    padding: 4,
    gap: 2,
    ...shadow,
  },
  dropdownItem: {
    padding: 8,
    borderRadius: 4,
  },
  dropdownText: {
    fontFamily: FONT.medium,
    fontSize: 11,
    lineHeight: 16,
    color: T.neutral800,
  },

  // Sheet
  sheet: {
    marginTop: -20,
    backgroundColor: T.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: T.sheetBorder,
    paddingTop: 4,
    minHeight: 600,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },

  // Membership
  membershipCard: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    padding: 12,
    gap: 2,
  },
  membershipTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 2,
  },
  membershipTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  tierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tierText: {
    fontFamily: FONT.semibold,
    fontSize: 15,
    lineHeight: 22,
    color: T.neutral800,
  },
  savingsPill: {
    backgroundColor: T.green500,
    borderRadius: 24,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  savingsPillText: {
    fontFamily: FONT.bold,
    fontSize: 8,
    lineHeight: 12,
    color: T.white,
  },
  upgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: T.violet,
    borderRadius: 31,
    paddingHorizontal: 12,
    paddingTop: 4,
    paddingBottom: 5,
  },
  upgradeText: {
    fontFamily: FONT.bold,
    fontSize: 11,
    lineHeight: 16,
    color: T.white,
  },
  membershipSub: {
    fontFamily: FONT.medium,
    fontSize: 13,
    lineHeight: 20,
    color: T.neutral500,
  },

  // Wallet
  walletCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  walletLabel: {
    flex: 1,
    fontFamily: FONT.semibold,
    fontSize: 17,
    lineHeight: 26,
    color: T.neutral800,
  },
  walletValue: {
    fontFamily: FONT.bold,
    fontSize: 17,
    lineHeight: 26,
    color: T.primary500,
    textAlign: 'right',
  },

  // Menu
  menuCard: {
    backgroundColor: T.white,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
  },
  menuIconBox: {
    backgroundColor: T.surface,
    borderRadius: 8,
    padding: 10,
  },
  menuTextCol: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  menuTitle: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    lineHeight: 20,
    color: T.neutral800,
  },
  menuSubtitle: {
    fontFamily: FONT.medium,
    fontSize: 11,
    lineHeight: 16,
    color: T.neutral500,
  },
  cashChip: {
    backgroundColor: T.chipBg,
    borderRadius: 2,
    paddingHorizontal: 4,
  },
  cashChipText: {
    fontFamily: FONT.medium,
    fontSize: 11,
    lineHeight: 16,
    color: T.primary500,
  },

  // Dashed divider
  dashedClip: {
    height: 1,
    overflow: 'hidden',
  },
  dashedLine: {
    height: 2,
    borderWidth: 1,
    borderColor: T.border,
    borderStyle: 'dashed',
    borderRadius: 1,
  },

  // Toggle
  toggleTrack: {
    width: 38,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: T.white,
  },
});