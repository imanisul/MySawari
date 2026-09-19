import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Share, Linking, ActivityIndicator } from 'react-native';
import { Page, Header, PrimaryButton } from '@/components';
import { useColors } from '@/hooks/useColors';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ReferScreen() {
  const colors = useColors();
  const router = useRouter();
  const { customer, isAuthenticated, isAuthLoading } = useSawari();
  const insets = useSafeAreaInsets();
  
  const [config, setConfig] = useState<any>(null);
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  
  const viewShotRef = useRef<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const appConfig = await API.getAppConfig();
        setConfig(appConfig);
        
        if (isAuthenticated && customer.id) {
          const userReferrals = await API.getReferrals(customer.id);
          setReferrals(userReferrals);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [isAuthenticated, customer.id]);

  if (isAuthLoading) {
    return (
      <Page>
        <Header title="Refer & Earn" back />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
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

  const referralCode = customer.referralCode || 'SIGNUP-TO-REFER';
  const referralLink = `https://mysawari.in/ref/${referralCode}`;
  
  const shareMessage = `Hey! Join MySawari using my referral code ${referralCode} and get 100 SawariCash instantly on your first ride.\n\nDownload/Join:\n${referralLink}`;

  const handleCopy = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await Clipboard.setStringAsync(referralCode);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleNativeShare = async () => {
    try {
      Haptics.selectionAsync();
      await Share.share({
        message: shareMessage,
        url: referralLink, // iOS specific
        title: 'Join MySawari',
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleWhatsAppShare = async () => {
    Haptics.selectionAsync();
    const url = `whatsapp://send?text=${encodeURIComponent(shareMessage)}`;
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        alert('WhatsApp is not installed on this device.');
      }
    } catch (e) {
      handleNativeShare(); // Fallback
    }
  };

  const handleFacebookShare = async () => {
    Haptics.selectionAsync();
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}&quote=${encodeURIComponent(shareMessage)}`;
    try {
      await Linking.openURL(url);
    } catch (e) {
      handleNativeShare();
    }
  };
  
  const handleInstagramShare = async () => {
    Haptics.selectionAsync();
    // Instagram doesn't easily allow deep linking text without images, so we trigger Native share which includes Instagram.
    // However, if the user specifically requested Instagram, we can just share the image.
    handleShareCard();
  };
  
  const handleShareCard = async () => {
    Haptics.selectionAsync();
    try {
      if (viewShotRef.current) {
        const uri = await viewShotRef.current.capture();
        await Share.share({
          url: uri,
          message: shareMessage
        });
      }
    } catch (e) {
      handleNativeShare();
    }
  };

  if (loading) {
    return (
      <Page>
        <Header title="Refer & Earn" back />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </Page>
    );
  }

  const rewardAmountText = config?.referralRewardType === 'PERCENTAGE' ? `${config.referralRewardAmount}% commission` : `₹${config.referralRewardAmount}`;
  const discountText = config?.referralDiscountType === 'FLAT' ? `${config.referralDiscountAmount} SawariCash` : `${config.referralDiscountAmount}% off`;

  return (
    <Page scroll={false}>
      <Header title="Refer & Earn" back />
      
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        
        <ViewShot ref={viewShotRef} options={{ format: "jpg", quality: 0.9 }}>
          <View style={[styles.heroCard, { backgroundColor: '#111827', borderColor: '#374151' }]}>
            <Text style={[styles.heroTitle, { color: '#FFF' }]}>Share MySawari.{'\n'}Earn together.</Text>
            
            <View style={styles.rewardsRow}>
              <View style={[styles.rewardPill, { backgroundColor: colors.emerald + '20' }]}>
                <Feather name="gift" size={14} color={colors.emerald} />
                <Text style={[styles.rewardText, { color: colors.emerald }]}>You earn {rewardAmountText}</Text>
              </View>
              <View style={[styles.rewardPill, { backgroundColor: colors.blue + '20' }]}>
                <Feather name="user-plus" size={14} color={colors.blue} />
                <Text style={[styles.rewardText, { color: colors.blue }]}>Friend gets {discountText}</Text>
              </View>
            </View>

            <View style={styles.qrContainer}>
              <View style={styles.qrWrapper}>
                <QRCode
                  value={referralLink}
                  size={140}
                  color="#000"
                  backgroundColor="#FFF"
                  logo={require('../../assets/images/MySawari.png')}
                  logoSize={30}
                  logoBackgroundColor="transparent"
                />
              </View>
              <Text style={styles.qrHelpText}>Scan to join MySawari</Text>
            </View>

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
          </View>
        </ViewShot>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Pressable style={[styles.mainShareBtn, { backgroundColor: colors.primary }]} onPress={handleNativeShare}>
            <Feather name="share-2" size={18} color="#000" />
            <Text style={styles.mainShareBtnText}>Share Invite</Text>
          </Pressable>

          <View style={styles.socialRow}>
            <Pressable style={[styles.socialBtn, { backgroundColor: 'transparent' }]} onPress={handleWhatsAppShare}>
              <FontAwesome5 name="whatsapp" size={36} color="#25D366" />
            </Pressable>
            <Pressable style={[styles.socialBtn, { backgroundColor: 'transparent' }]} onPress={handleInstagramShare}>
              <FontAwesome5 name="instagram" size={36} color="#E1306C" />
            </Pressable>
            <Pressable style={[styles.socialBtn, { backgroundColor: 'transparent' }]} onPress={handleFacebookShare}>
              <FontAwesome5 name="facebook-f" size={34} color="#1877F2" />
            </Pressable>
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Your Referrals</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{referrals.length}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Friends Joined</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
            <View style={styles.statBox}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>
                {referrals.filter(r => r.status === 'REWARDED').length}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Completed Ride</Text>
            </View>
          </View>

          {/* List */}
          {referrals.length === 0 ? (
            <Text style={[styles.emptyListText, { color: colors.mutedForeground }]}>You haven't referred anyone yet.</Text>
          ) : (
            referrals.map(ref => (
              <View key={ref.id} style={[styles.referralItem, { borderTopColor: colors.border }]}>
                <View style={styles.refInfo}>
                  <Text style={[styles.refName, { color: colors.foreground }]}>{ref.referredName}</Text>
                  <Text style={[styles.refDate, { color: colors.mutedForeground }]}>
                    Joined {new Date(ref.signupAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </Text>
                </View>
                <View style={styles.refStatus}>
                  {ref.status === 'REWARDED' ? (
                    <View style={[styles.statusBadge, { backgroundColor: colors.gold + '20' }]}>
                      <Text style={[styles.statusText, { color: colors.goldDark }]}>Rewarded</Text>
                    </View>
                  ) : (
                    <View style={[styles.statusBadge, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.statusText, { color: colors.mutedForeground }]}>Pending First Ride</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>

        <View style={{ height: insets.bottom + 80 }} />
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
  },
  heroCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 20,
    overflow: 'hidden',
  },
  heroTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 28,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 34,
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  rewardPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  rewardText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 13,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: '#FFF',
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  qrHelpText: {
    color: '#9CA3AF',
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
  },
  codeBox: {
    width: '100%',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  codeLabel: {
    color: '#9CA3AF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 8,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  codeText: {
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: 2,
  },
  copyBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#374151',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 60,
  },
  copyBtnText: {
    color: '#D1D5DB',
    fontFamily: 'Inter_700Bold',
    fontSize: 12,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  mainShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 16,
    gap: 10,
    marginBottom: 16,
  },
  mainShareBtnText: {
    color: '#000',
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  socialBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
  },
  sectionTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: 'Inter_700Bold',
    fontSize: 24,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: '80%',
    alignSelf: 'center',
  },
  emptyListText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
    fontStyle: 'italic',
  },
  referralItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  refInfo: {
    flex: 1,
  },
  refName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 15,
    marginBottom: 4,
  },
  refDate: {
    fontFamily: 'Inter_400Regular',
    fontSize: 12,
  },
  refStatus: {
    marginLeft: 16,
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
});
