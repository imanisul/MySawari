import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Pressable, ScrollView, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Page, Header, PrimaryButton } from '@/components';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LoginBottomSheet } from '@/components';

export default function ProfileScreen() {
  const colors = useColors();
  const { customer, logout, earnReward, sawariCash, isAuthenticated } = useSawari();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

  const menuItems = [
    { id: 'rewards', title: 'My Rewards', icon: 'gift' },
    { id: 'payments', title: 'Payments', icon: 'credit-card' },
    { id: 'refer', title: 'Refer and Earn', icon: 'users' },
    { id: 'safety', title: 'Safety', icon: 'shield' },
    { id: 'settings', title: 'Settings', icon: 'settings' },
    { id: 'help', title: 'Help', icon: 'help-circle' },
  ];

  // Logout moved to Settings

  const handleMenuPress = async (item: any) => {
    Haptics.selectionAsync();
    if (item.id === 'rewards') {
      router.push('/rewards');
    } else if (item.id === 'payments') {
      router.push('/payments');
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
        {/* Profile Card */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.avatarText, { color: colors.primary }]}>
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

        {/* Loyalty Punch Card */}
        <View style={[styles.loyaltyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.loyaltyTitle, { color: colors.foreground }]}>Your Ride Journey</Text>
          <Text style={[styles.loyaltySubtitle, { color: colors.mutedForeground }]}>
            Complete 4 rides to unlock a special discount!
          </Text>
          <View style={styles.punchBoxContainer}>
            {/* Box 1: Car (Completed) */}
            <View style={[styles.punchBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
              <Feather name="check" size={24} color={colors.primary} />
            </View>
            <View style={[styles.punchConnector, { backgroundColor: colors.primary }]} />
            
            {/* Box 2: Bike (Completed) */}
            <View style={[styles.punchBox, { backgroundColor: colors.primary + '15', borderColor: colors.primary }]}>
              <Feather name="check" size={24} color={colors.primary} />
            </View>
            <View style={[styles.punchConnector, { backgroundColor: colors.border }]} />
            
            {/* Box 3: Empty */}
            <View style={[styles.punchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={{ color: colors.mutedForeground, fontFamily: 'Inter_600SemiBold' }}>3</Text>
            </View>
            <View style={[styles.punchConnector, { backgroundColor: colors.border }]} />
            
            {/* Box 4: Reward */}
            <LinearGradient 
              colors={['#FBBF24', '#F59E0B']}
              style={[styles.punchBox, { borderColor: '#B45309', borderWidth: 0, shadowColor: '#F59E0B', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 8 }]}
            >
              <Feather name="gift" size={22} color="#FFF" />
            </LinearGradient>
          </View>
        </View>

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
        
        <View style={styles.bottomPadding} />
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
  bottomPadding: {
    height: 40,
  },
});
