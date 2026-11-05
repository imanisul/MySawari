import React, { useState } from 'react';
import { safeBack } from '@/utils/navigation';
import { View, Text, StyleSheet, ScrollView, Pressable, ActivityIndicator, RefreshControl } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';
import { useSawari } from '@/context/SawariContext';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { useRideJourney, PendingCard } from '@/hooks/useRideJourney';
import { RewardScratchModal } from '@/components/rewards/RewardScratchModal';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { Skeleton, SkeletonGroup } from '@/components/common/Skeleton';

const F = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

const MILESTONE_TIERS = [
  { rides: 4, reward: 'up to ₹5,000', rewardAmount: 5000, label: '4_rides', maxCash: 200 },
  { rides: 8, reward: 'up to ₹10,000', rewardAmount: 10000, label: '8_rides', maxCash: 350 },
  { rides: 12, reward: 'up to ₹20,000', rewardAmount: 20000, label: '12_rides', maxCash: 350 },
  { rides: 20, reward: 'up to ₹30,000', rewardAmount: 30000, label: '20_rides', maxCash: 350 },
  { rides: 30, reward: 'up to ₹40,000', rewardAmount: 40000, label: '30_rides', maxCash: 350 },
];

/**
 * Profile → Rewards: scratch cards waiting to be opened (the welcome gift, and one for each trip milestone reached),
 * progress to the next milestone, and the rewards already received. Scratching credits the prize as SawariCash.
 */
export default function RewardsScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const { isAuthenticated } = useSawari();
  const [open, setOpen] = useState<PendingCard | null>(null);

  const { data: journey, isLoading, refetch, isRefetching, cards } = useRideJourney();

  const openCard = (c: PendingCard) => { Haptics.selectionAsync(); setOpen(c); };

  const done = journey?.totalRides ?? 0;
  const milestones = journey?.milestones ?? [];
  const next = milestones.find((m) => !m.unlocked) ?? null;
  const target = next?.rides ?? MILESTONE_TIERS[MILESTONE_TIERS.length - 1].rides;
  const pct = Math.min(1, target ? done / target : 0);
  const welcome = journey?.signupBonus?.scratched ? [{ type: 'SAWARI_CASH', label: 'Welcome Bonus', amount: journey.signupBonus.amount, earnedAt: journey.signupBonus.earnedAt }] : [];
  const received = [...(journey?.earnedRewards ?? []), ...welcome];

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
        <SkeletonGroup>
          <View style={{ padding: 16, gap: 14 }}>
            <Skeleton width="100%" height={140} borderRadius={16} />
            {[0, 1, 2].map((i) => <Skeleton key={i} width="100%" height={72} borderRadius={14} delay={80 + i * 70} />)}
          </View>
        </SkeletonGroup>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} tintColor={p.navy} />}
        >
          {/* Scratch cards waiting to be opened */}
          {cards.length > 0 && (
            <>
              <Text style={[styles.section, { color: p.muted, marginTop: 0 }]}>Scratch cards</Text>
              <View style={styles.cardsRow}>
                {cards.map((c) => (
                  <Pressable key={c.label} accessibilityRole="button" accessibilityLabel={`Scratch card: ${c.title}`} onPress={() => openCard(c)}
                    style={({ pressed }) => [styles.scratchTile, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}>
                    <Feather name="gift" size={22} color={p.onNavy} />
                    <Text style={[styles.tileTitle, { color: p.onNavy }]} numberOfLines={2}>{c.kind === 'signup' ? 'Welcome gift' : c.label}</Text>
                    <Text style={[styles.tileSub, { color: p.onNavy }]}>Tap to scratch</Text>
                  </Pressable>
                ))}
              </View>
            </>
          )}

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

          {/* Milestone Rewards Table */}
          <Text style={[styles.section, { color: p.muted }]}>Trip milestone rewards</Text>
          <View style={[styles.tableCard, { borderColor: p.segBorder, backgroundColor: p.page }]}>
            <View style={[styles.tableHead, { backgroundColor: p.summary, borderBottomColor: p.segBorder }]}>
              <Text style={[styles.colHead1, { color: p.muted }]}>TRIPS</Text>
              <Text style={[styles.colHead2, { color: p.muted }]}>REWARD</Text>
              <Text style={[styles.colHead3, { color: p.muted }]}>STATUS</Text>
            </View>
            {MILESTONE_TIERS.map((tier, i) => {
              const m = milestones.find((x) => x.rides === tier.rides) || {
                rides: tier.rides,
                rewardAmount: tier.rewardAmount,
                label: tier.label,
                unlocked: done >= tier.rides,
                claimed: false,
                scratchAmount: undefined as number | undefined,
                maxCash: tier.maxCash,
              };
              const ready = m.unlocked && !m.claimed;
              return (
                <View
                  key={tier.label}
                  style={[
                    styles.tableRow,
                    i > 0 && { borderTopWidth: 1, borderTopColor: p.segBorder },
                    ready && { backgroundColor: p.greenBg },
                  ]}
                >
                  <View style={styles.col1}>
                    <Text style={[styles.tierRides, { color: p.fg }]}>{tier.rides} Trips</Text>
                  </View>
                  <View style={styles.col2}>
                    <Text style={[styles.tierReward, { color: p.navy }]}>{tier.reward}</Text>
                  </View>
                  <View style={styles.col3}>
                    {m.claimed ? (
                      <View style={[styles.chip, { backgroundColor: p.greenBg }]}>
                        <Feather name="check" size={12} color={p.green} />
                        <Text style={[styles.chipText, { color: p.green }]}>Scratched</Text>
                      </View>
                    ) : ready ? (
                      <Pressable
                        accessibilityRole="button"
                        accessibilityLabel={`Scratch card, ${tier.reward}`}
                        onPress={() =>
                          openCard({
                            kind: 'milestone',
                            label: m.label,
                            title: `${m.rides} rides completed`,
                            amount: m.scratchAmount || (m.rides === 4 ? 200 : 350),
                          })
                        }
                        style={({ pressed }) => [
                          styles.claimBtn,
                          { backgroundColor: p.navy },
                          pressed && { opacity: 0.8 },
                        ]}
                      >
                        <Text style={[styles.claimText, { color: p.onNavy }]}>Scratch</Text>
                      </Pressable>
                    ) : (
                      <View style={styles.lockedWrap}>
                        <Feather name="lock" size={13} color={p.muted} />
                        <Text style={[styles.lockedText, { color: p.muted }]}>
                          {Math.max(0, tier.rides - done)} left
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>

          <Text style={[styles.section, { color: p.muted }]}>Rewards earned</Text>
          {received.length === 0 ? (
            <Text style={[styles.note, { color: p.muted, textAlign: 'left' }]}>
              Nothing yet. Finish 4 trips to earn your first reward.
            </Text>
          ) : (
            <View style={[styles.list, { borderColor: p.segBorder }]}>
              {received.map((r, i) => (
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
          <Text style={[styles.foot, { color: p.muted }]}>Scratch a card and the reward is added to your wallet as SawariCash. Only completed trips count.</Text>
        </ScrollView>
      )}
      <RewardScratchModal card={open} onClose={() => setOpen(null)} />
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
  tableCard: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  tableHead: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, height: 38, borderBottomWidth: 1 },
  colHead1: { width: 80, fontFamily: F.semibold, fontSize: 11, letterSpacing: 0.5 },
  colHead2: { flex: 1, fontFamily: F.semibold, fontSize: 11, letterSpacing: 0.5 },
  colHead3: { width: 85, textAlign: 'right', fontFamily: F.semibold, fontSize: 11, letterSpacing: 0.5 },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, minHeight: 52, paddingVertical: 8 },
  col1: { width: 80 },
  col2: { flex: 1, paddingRight: 6 },
  col3: { width: 85, alignItems: 'flex-end', justifyContent: 'center' },
  tierRides: { fontFamily: F.semibold, fontSize: 14 },
  tierReward: { fontFamily: F.bold, fontSize: 14 },
  lockedWrap: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lockedText: { fontFamily: F.medium, fontSize: 12 },
  list: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, minHeight: 62, paddingVertical: 10 },
  rowTitle: { fontFamily: F.semibold, fontSize: 14, lineHeight: 20 },
  rowSub: { fontFamily: F.medium, fontSize: 11.5, lineHeight: 17, marginTop: 1 },
  amount: { fontFamily: F.semibold, fontSize: 14 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, height: 26, borderRadius: 13 },
  chipText: { fontFamily: F.semibold, fontSize: 11.5 },
  claimBtn: { minWidth: 74, height: 34, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  cardsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  scratchTile: { width: 132, borderRadius: 12, padding: 12, gap: 6 },
  tileTitle: { fontFamily: F.semibold, fontSize: 13, lineHeight: 18 },
  tileSub: { fontFamily: F.medium, fontSize: 11, opacity: 0.8 },
  claimText: { fontFamily: F.semibold, fontSize: 13 },
  note: { fontFamily: F.medium, fontSize: 13, lineHeight: 20, textAlign: 'center' },
  foot: { fontFamily: F.regular, fontSize: 11.5, lineHeight: 17, marginTop: 18 },
});
