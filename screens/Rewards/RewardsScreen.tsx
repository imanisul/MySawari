import React, { useCallback, useState } from 'react';
import { safeBack } from '@/utils/navigation';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Haptics from '@/utils/haptics';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { CustomAlert } from '@/components/common/CustomAlert';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

const F = { regular: 'PlusJakartaSans_400Regular', medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold' };

/**
 * Profile → Rewards: the trip milestones (complete N trips, get a reward), how far along the customer is, a Claim button
 * once a milestone is reached, and the rewards already received. A claimed reward is credited as SawariCash.
 */
export default function RewardsScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, earnSawariCash, fetchWallet } = useSawari();
  const [claiming, setClaiming] = useState<string | null>(null);

  const { data: journey, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['ride-journey'],
    queryFn: () => API.getRideJourney(),
    enabled: !!isAuthenticated,
    staleTime: 30_000,
  });

  const claim = useCallback(async (label: string, amount: number) => {
    if (claiming) return;
    Haptics.selectionAsync();
    setClaiming(label);
    try {
      const res = await API.claimMilestoneReward(label);
      earnSawariCash(res?.reward.amount ?? amount);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      CustomAlert.alert('Reward claimed 🎉', `${formatCurrency(res?.reward.amount ?? amount)} SawariCash has been added to your wallet.`, [{ text: 'Great!' }]);
    } catch (e: any) {
      CustomAlert.alert('Could not claim', e?.message || 'Please try again in a moment.', [{ text: 'OK' }]);
    } finally {
      setClaiming(null);
      queryClient.invalidateQueries({ queryKey: ['ride-journey'] });
      fetchWallet().catch(() => {});
    }
  }, [claiming, earnSawariCash, queryClient, fetchWallet]);

  const done = journey?.totalRides ?? 0;
  const milestones = journey?.milestones ?? [];
  const next = milestones.find((m) => !m.unlocked) ?? null;
  const target = next?.rides ?? milestones[milestones.length - 1]?.rides ?? 4;
  const pct = Math.min(1, target ? done / target : 0);
  const firstMilestone = milestones[0];

  return (
    <SafeAreaView edges={['top', 'bottom']} style={[styles.screen, { backgroundColor: p.page }]}>
      <View style={[styles.header, { borderBottomColor: p.border }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => safeBack(router)} hitSlop={8} style={[styles.back, { backgroundColor: p.iconBg }]}>
          <Feather name="chevron-left" size={18} color={p.muted} />
        </Pressable>
        <Text style={[styles.title, { color: p.fg }]}>Rewards</Text>
      </View>

      {!isAuthenticated ? (
        <View style={styles.center}><Text style={[styles.note, { color: p.muted }]}>Log in to see your trip rewards.</Text></View>
      ) : isLoading ? (
        <View style={styles.center}><ActivityIndicator color={p.navy} /></View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={p.navy} />}
        >
          {/* Progress to the next reward */}
          <View style={[styles.card, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
            <Text style={[styles.cardTitle, { color: p.fg }]}>
              {next ? `Complete ${next.rides} Trips, Get up to ${formatCurrency(next.rewardAmount)} Rewards` : 'You have unlocked every reward'}
            </Text>
            {!!next && (
              <>
                <View style={[styles.bar, { backgroundColor: p.segBorder }]}>
                  <View style={[styles.barFill, { backgroundColor: p.navy, width: `${Math.round(pct * 100)}%` }]} />
                </View>
                <Text style={[styles.sub, { color: p.muted }]}>
                  {done} of {next.rides} trips completed{next.rides - done > 0 ? ` · ${next.rides - done} to go` : ''}
                </Text>
              </>
            )}
          </View>

          <Text style={[styles.section, { color: p.muted }]}>Trip milestones</Text>
          <View style={[styles.list, { borderColor: p.segBorder }]}>
            {milestones.map((m, i) => {
              const ready = m.unlocked && !m.claimed;
              return (
                <View key={m.label} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: p.segBorder }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: p.fg }]}>{m.rides} trips · {formatCurrency(m.rewardAmount)}</Text>
                    <Text style={[styles.rowSub, { color: p.muted }]}>
                      {m.claimed ? 'Claimed' : ready ? 'Reached — claim your reward' : `${Math.max(0, m.rides - done)} more trip${m.rides - done === 1 ? '' : 's'} to go`}
                    </Text>
                  </View>
                  {m.claimed ? (
                    <View style={[styles.chip, { backgroundColor: p.greenBg }]}><Feather name="check" size={12} color={p.green} /><Text style={[styles.chipText, { color: p.green }]}>Claimed</Text></View>
                  ) : ready ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Claim ${formatCurrency(m.rewardAmount)}`}
                      disabled={!!claiming}
                      onPress={() => claim(m.label, m.rewardAmount)}
                      style={({ pressed }) => [styles.claimBtn, { backgroundColor: p.navy }, (pressed || !!claiming) && { opacity: 0.8 }]}
                    >
                      {claiming === m.label ? <ActivityIndicator size="small" color={p.onNavy} /> : <Text style={[styles.claimText, { color: p.onNavy }]}>Claim</Text>}
                    </Pressable>
                  ) : (
                    <Feather name="lock" size={15} color={p.muted} />
                  )}
                </View>
              );
            })}
          </View>

          <Text style={[styles.section, { color: p.muted }]}>Rewards received</Text>
          {(journey?.earnedRewards?.length ?? 0) === 0 ? (
            <Text style={[styles.note, { color: p.muted, textAlign: 'left' }]}>
              Nothing yet. {firstMilestone ? `Finish ${firstMilestone.rides} trips to earn your first reward.` : ''}
            </Text>
          ) : (
            <View style={[styles.list, { borderColor: p.segBorder }]}>
              {journey!.earnedRewards.map((r, i) => (
                <View key={r.label + i} style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: p.segBorder }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: p.fg }]}>{r.label}</Text>
                    <Text style={[styles.rowSub, { color: p.muted }]}>{r.earnedAt ? new Date(r.earnedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}</Text>
                  </View>
                  <Text style={[styles.amount, { color: p.green }]}>+{formatCurrency(r.amount)}</Text>
                </View>
              ))}
            </View>
          )}
          <Text style={[styles.foot, { color: p.muted }]}>Rewards are added to your wallet as SawariCash. Only completed trips count.</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  back: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: F.medium, fontSize: 17 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
  card: { borderWidth: 1, borderRadius: 12, padding: 16 },
  cardTitle: { fontFamily: F.semibold, fontSize: 17, lineHeight: 25 },
  bar: { height: 8, borderRadius: 4, marginTop: 14, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  sub: { fontFamily: F.medium, fontSize: 12, lineHeight: 18, marginTop: 8 },
  section: { fontFamily: F.regular, fontSize: 13, marginTop: 22, marginBottom: 10 },
  list: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, minHeight: 62, paddingVertical: 10 },
  rowTitle: { fontFamily: F.semibold, fontSize: 14, lineHeight: 20 },
  rowSub: { fontFamily: F.medium, fontSize: 11.5, lineHeight: 17, marginTop: 1 },
  amount: { fontFamily: F.semibold, fontSize: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 26, borderRadius: 13 },
  chipText: { fontFamily: F.semibold, fontSize: 11.5 },
  claimBtn: { minWidth: 74, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  claimText: { fontFamily: F.semibold, fontSize: 13 },
  note: { fontFamily: F.medium, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  foot: { fontFamily: F.regular, fontSize: 11.5, lineHeight: 17, marginTop: 18 },
});
