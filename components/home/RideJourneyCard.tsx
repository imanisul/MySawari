import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';
import { useColors } from '@/hooks/useColors';
import { LoyaltySkeleton } from '@/components/loading/ScreenSkeletons';
import { CustomAlert } from '@/components/common/CustomAlert';

export function RideJourneyCard() {
  const colors = useColors();
  const { isAuthenticated, earnSawariCash } = useSawari();
  const queryClient = useQueryClient();
  const [showRewardModal, setShowRewardModal] = useState(false);
  const [rewardAmount, setRewardAmount] = useState<number | null>(null);

  // Gift box pop animation
  const giftScaleAnim = useRef(new Animated.Value(1)).current;
  const giftGlowAnim = useRef(new Animated.Value(0)).current;

  // Fetch ride journey data from backend
  const { data: journey, isLoading: isJourneyLoading, isError: journeyFailed, refetch: refetchJourney } = useQuery({
    queryKey: ['ride-journey'],
    queryFn: () => API.getRideJourney(),
    enabled: !!isAuthenticated,
    staleTime: 30_000,
  });

  const completedCount = journey ? Math.min(journey.totalRides, 4) : 0;
  const giftUnlocked = completedCount >= 4;

  // Animate the gift box when unlocked
  useEffect(() => {
    if (!giftUnlocked) return;
    // Pulsing scale
    const scaleLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(giftScaleAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
        Animated.timing(giftScaleAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    // Glow opacity
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(giftGlowAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(giftGlowAnim, { toValue: 0.3, duration: 1000, useNativeDriver: true }),
      ])
    );
    scaleLoop.start();
    glowLoop.start();
    return () => {
      scaleLoop.stop();
      glowLoop.stop();
    };
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
        CustomAlert.alert("Congratulations! 🎊", `You have claimed ₹${claimed?.reward.amount ?? milestone.rewardAmount} Sawari Cash!`, [{ text: "Awesome!" }]);
      } catch (e) {
        CustomAlert.alert("Congratulations! 🎊", "You have already claimed this milestone reward.", [{ text: "Awesome!" }]);
      }
    } else {
      CustomAlert.alert("Congratulations! 🎊", "You have already claimed this milestone reward.", [{ text: "Awesome!" }]);
    }
  };

  // Only show if the user has completed at least one ride
  if (!isAuthenticated || completedCount === 0) {
    return null;
  }

  return (
    <>
      <View style={[styles.loyaltyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.loyaltyTitle, { color: colors.foreground }]}>Your Ride Journey</Text>
        {isJourneyLoading ? (
          <LoyaltySkeleton />
        ) : journeyFailed && !journey ? (
          <Pressable onPress={() => refetchJourney()} style={{ paddingVertical: 16 }}>
            <Text style={[styles.loyaltySubtitle, { color: colors.mutedForeground }]}>
              Couldn't load your ride journey. <Text style={{ color: colors.primaryText, fontFamily: 'Inter_600SemiBold' }}>Tap to retry</Text>
            </Text>
          </Pressable>
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
                    <Feather name="gift" size={24} color="#FFF" />
                  </LinearGradient>
                  {giftUnlocked && (
                    <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: '#FBBF24', borderRadius: 12, zIndex: -1, opacity: giftGlowAnim, transform: [{ scale: 1.3 }] }]} />
                  )}
                </Animated.View>
              </Pressable>
            </View>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  loyaltyCard: {
    padding: 20,
    borderRadius: 24,
    borderWidth: StyleSheet.hairlineWidth,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  loyaltyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  loyaltySubtitle: {
    fontFamily: 'Inter_500Medium',
    fontSize: 13,
    marginBottom: 20,
    lineHeight: 18,
  },
  punchBoxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  punchBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  punchConnector: {
    flex: 1,
    height: 3,
    marginHorizontal: 4,
    borderRadius: 2,
  },
});
