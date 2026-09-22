import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, Pressable, Animated, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Page, Header, PrimaryButton } from '@/components';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LoginBottomSheet } from '@/components';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { Reveal } from '@/components/common/Reveal';
import { LoyaltySkeleton } from '@/components/loading/ScreenSkeletons';

export default function ProfileScreen() {
  const colors = useColors();
  const { customer, sawariCash, isAuthenticated, earnSawariCash } = useSawari();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<number | null>(null);

  // Gift box pop animation
  const giftScaleAnim = useRef(new Animated.Value(1)).current;
  const giftGlowAnim = useRef(new Animated.Value(0)).current;

  // Fetch ride journey data from backend
  const { data: journey, isLoading: isJourneyLoading } = useQuery({
    queryKey: ['ride-journey'],
    queryFn: () => API.getRideJourney(),
    enabled: !!isAuthenticated,
    staleTime: 30_000,
  });

  const completedCount = journey ? Math.min(journey.totalRides, 4) : 0;
  const giftUnlocked = completedCount >= 4;

  // Animate the gift box when unlocked
  useEffect(() => {
    if (giftUnlocked) {
      // Pulsing scale
      Animated.loop(
        Animated.sequence([
          Animated.timing(giftScaleAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(giftScaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      ).start();
      // Glow opacity
      Animated.loop(
        Animated.sequence([
          Animated.timing(giftGlowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          Animated.timing(giftGlowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [giftUnlocked]);

  const handleGiftPress = async () => {
    if (!giftUnlocked) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Try to claim the 4th ride milestone
    const milestone = journey?.milestones?.find(m => m.rides === 4);
    if (milestone && !milestone.claimed) {
      try {
        const claimed = await API.claimMilestoneReward(milestone.label);
        setRewardAmount(claimed?.reward.amount ?? null);
        earnSawariCash(milestone.rewardAmount);
        queryClient.invalidateQueries({ queryKey: ['ride-journey'] });
      } catch (e) {
        // Already claimed or error — still show modal
      }
    }
    setShowRewardModal(true);
  };

  const menuItems = [
    { id: 'membership', title: 'Membership', icon: 'award' },
    { id: 'rewards', title: 'My Rewards', icon: 'gift' },
    { id: 'refer', title: 'Refer and Earn', icon: 'users' },
    { id: 'safety', title: 'Safety', icon: 'shield' },
    { id: 'settings', title: 'Settings', icon: 'settings' },
    { id: 'help', title: 'Help', icon: 'help-circle' },
  ];

  // Logout moved to Settings

  const handleMenuPress = async (item: any) => {
    Haptics.selectionAsync();
    if (item.id === 'membership') {
      router.push('/membership');
    } else if (item.id === 'rewards') {
      router.push('/rewards');
    } else if (item.id === 'refer') {
      router.push('/refer');
    } else if (item.id === 'settings') {
      router.push('/settings');
    } else if (item.id === 'safety') {
      router.push('/safety');
    } else if (item.id === 'help') {
      router.push('/help');
    } else {
      Alert.alert('Coming Soon', `${item.title} section is under development.`);
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
            <PrimaryButton 
              label="Log In" 
              onPress={() => setShowLogin(true)} 
            />
          </View>
        </View>
        <LoginBottomSheet visible={showLogin} onClose={() => setShowLogin(false)} />
      </Page>
    );
  }

  return (
    <Page bottomNav scroll={false}>
      <Header title="Profile" hideLogo={true} back={false} />
      
      <ScrollView contentContainerStyle={styles.scrollContent} bounces={false}>
        <Reveal delay={0}>
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: colors.primaryText }]}>
                  {customer.name ? customer.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            </View>
            <View style={styles.profileInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Text style={[styles.name, { color: colors.foreground, marginBottom: 0, marginRight: 8 }]}>
                  {customer.name || 'User'}
                </Text>
              </View>
              <Text style={[styles.mobile, { color: colors.mutedForeground }]}>
                {customer.mobile || 'Add Mobile Number'}
              </Text>
            </View>
            <TouchableOpacity 
              activeOpacity={1}
              style={[styles.editButton, { backgroundColor: colors.background, borderColor: colors.border }]}
              onPress={() => {
                Haptics.selectionAsync();
                router.push('/edit-profile');
              }}
            >
              <Feather name="edit-2" size={16} color={colors.foreground} />
            </TouchableOpacity>
          </View>
        </View>

        </Reveal>

        <Reveal delay={90}>
        {/* SawariCash Wallet */}
        <LinearGradient 
          colors={['#1F2937', '#111827']} 
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.walletCard, { borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }]}
        >
          {/* Header */}
          <View style={styles.walletHeader}>
            <View style={[styles.walletIconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <Text style={{ color: '#10B981', fontSize: 18, fontFamily: 'Inter_700Bold' }}>₹</Text>
            </View>
            <Text style={[styles.walletTitle, { color: '#F9FAFB' }]}>SawariCash Balance</Text>
          </View>

          {/* Balance and Conversion */}
          <View style={[styles.walletBalanceRow, { backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }]}>
            <View style={styles.balanceColumn}>
              <View style={styles.balanceUnit}>
                <Text style={[styles.walletBalance, { color: '#FBBF24' }]}>{sawariCash}</Text>
                <Text style={[styles.walletCurrency, { color: '#D1D5DB' }]}> Coins</Text>
              </View>
            </View>
            
            <View style={styles.walletEquals}>
              <Feather name="arrow-right" size={20} color="#6B7280" />
            </View>

            <View style={styles.balanceColumn}>
              <View style={styles.balanceUnit}>
                <Text style={[styles.walletCurrency, { color: '#F9FAFB' }]}>₹ </Text>
                <Text style={[styles.walletBalance, { color: '#F9FAFB' }]}>{sawariCash.toLocaleString('en-IN')}</Text>
              </View>
            </View>
          </View>

          {/* Footer Info */}
          <View style={styles.walletFooter}>
            <Feather name="check-circle" size={15} color="#10B981" style={{ marginRight: 6 }} />
            <Text style={[styles.walletSubtitle, { color: '#D1D5DB' }]}>
              Available to apply on your next booking
            </Text>
          </View>
        </LinearGradient>

        </Reveal>

        <Reveal delay={180}>
        {/* Loyalty Punch Card — Original Design, Data-Driven */}
        <View style={[styles.loyaltyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.loyaltyTitle, { color: colors.foreground }]}>Your Ride Journey</Text>
          {isJourneyLoading ? (
            <LoyaltySkeleton />
          ) : (
          <>
          <Text style={[styles.loyaltySubtitle, { color: colors.mutedForeground }]}>
            {giftUnlocked 
              ? '🎉 You unlocked a special reward! Tap the gift to claim!'
              : `Complete ${4 - completedCount} more ride${4 - completedCount !== 1 ? 's' : ''} to unlock a special discount!`
            }
          </Text>
          <View style={styles.punchBoxContainer}>
            {/* Box 1 */}
            {completedCount >= 1 ? (
              <View style={[styles.punchBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                <Feather name="check" size={24} color={colors.primaryText} />
              </View>
            ) : (
              <View style={[styles.punchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }}>1</Text>
              </View>
            )}
            <View style={[styles.punchConnector, { backgroundColor: completedCount >= 2 ? colors.primary : colors.border }]} />
            
            {/* Box 2 */}
            {completedCount >= 2 ? (
              <View style={[styles.punchBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                <Feather name="check" size={24} color={colors.primaryText} />
              </View>
            ) : (
              <View style={[styles.punchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }}>2</Text>
              </View>
            )}
            <View style={[styles.punchConnector, { backgroundColor: completedCount >= 3 ? colors.primary : colors.border }]} />
            
            {/* Box 3 */}
            {completedCount >= 3 ? (
              <View style={[styles.punchBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
                <Feather name="check" size={24} color={colors.primaryText} />
              </View>
            ) : (
              <View style={[styles.punchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }}>3</Text>
              </View>
            )}
            <View style={[styles.punchConnector, { backgroundColor: giftUnlocked ? colors.primary : colors.border }]} />
            
            {/* Box 4: Gift */}
            <Pressable onPress={handleGiftPress} disabled={!giftUnlocked}>
              <Animated.View style={{ transform: [{ scale: giftScaleAnim }] }}>
                <LinearGradient 
                  colors={giftUnlocked ? ['#FBBF24', '#F59E0B'] : ['#9CA3AF', '#6B7280']}
                  style={[styles.punchBox, { borderColor: giftUnlocked ? '#B45309' : colors.border, borderWidth: 0, shadowColor: giftUnlocked ? '#F59E0B' : 'transparent', shadowOffset: { width: 0, height: 4 }, shadowOpacity: giftUnlocked ? 0.4 : 0, shadowRadius: 8, elevation: giftUnlocked ? 8 : 0 }]}
                >
                  <Feather name="gift" size={22} color="#FFF" />
                </LinearGradient>
              </Animated.View>
            </Pressable>
          </View>
          </>
          )}
        </View>

        </Reveal>

        {/* Reward Pop-up Modal */}
        <Modal visible={showRewardModal} transparent animationType="fade">
          <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' }} onPress={() => setShowRewardModal(false)}>
            <View style={{ backgroundColor: colors.card, borderRadius: 24, padding: 28, width: '85%', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 24, elevation: 12 }}>
              <View style={{ width: 70, height: 70, borderRadius: 35, backgroundColor: '#FBBF2420', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Feather name="gift" size={36} color="#F59E0B" />
              </View>
              <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 22, color: colors.foreground, textAlign: 'center', marginBottom: 8 }}>🎉 Reward Unlocked!</Text>
              <Text style={{ fontFamily: 'Inter_500Medium', fontSize: 15, color: colors.mutedForeground, textAlign: 'center', marginBottom: 20, lineHeight: 22 }}>
                {rewardAmount !== null ? (
                  <>Congratulations! You completed 4 rides and earned <Text style={{ color: colors.primaryText, fontFamily: 'Inter_700Bold' }}>+{rewardAmount} SawariCash</Text> as a special bonus!</>
                ) : (
                  <>Congratulations on completing 4 rides! Your reward has already been added to your SawariCash.</>
                )}
              </Text>
              <Pressable 
                onPress={() => setShowRewardModal(false)}
                style={{ backgroundColor: colors.primary, paddingVertical: 14, paddingHorizontal: 40, borderRadius: 16 }}
              >
                <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 15, color: colors.primaryForeground }}>Awesome!</Text>
              </Pressable>
            </View>
          </Pressable>
        </Modal>

        <Reveal delay={270}>
        {/* Menu Items */}
        <View style={styles.menuContainer}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={1}
              style={[
                styles.menuItem,
                { backgroundColor: colors.card, borderBottomColor: colors.border },
                index === 0 && styles.menuItemFirst,
                index === menuItems.length - 1 && styles.menuItemLast,
                index !== menuItems.length - 1 && { borderBottomWidth: 1 }
              ]}
              onPress={() => handleMenuPress(item)}
            >
              <View style={[styles.menuIconContainer, { backgroundColor: colors.background }]}>
                <Feather name={item.icon as any} size={20} color={colors.foreground} />
              </View>
              <Text style={[styles.menuTitle, { color: colors.foreground }]}>{item.title}</Text>
              <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>
        </Reveal>
        <View style={{ height: insets.bottom + 80 }} />
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  profileCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      }
    }),
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
  },
  profileInfo: {
    flex: 1,
  },
  name: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginBottom: 4,
  },
  mobile: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10 },
      android: { elevation: 6 },
    }),
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  walletIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  walletTitle: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 17,
    letterSpacing: -0.3,
  },
  walletBalanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  balanceColumn: {
    flex: 1,
    alignItems: 'center',
  },
  balanceUnit: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  walletEquals: {
    paddingHorizontal: 16,
  },
  walletBalance: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    letterSpacing: -1,
  },
  walletCurrency: {
    fontFamily: 'Inter_500Medium',
    fontSize: 15,
  },
  walletFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  walletSubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  loyaltyCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      }
    }),
  },
  loyaltyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginBottom: 4,
  },
  loyaltySubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginBottom: 20,
  },
  punchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  punchBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchConnector: {
    flex: 1,
    height: 2,
    marginHorizontal: 4,
  },
  menuContainer: {
    marginBottom: 24,
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
      },
      android: {
        elevation: 3,
      }
    }),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemFirst: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  menuItemLast: {
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuTitle: {
    flex: 1,
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
  },
});
