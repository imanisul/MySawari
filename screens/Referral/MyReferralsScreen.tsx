import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { ScreenHeader, PF, rupees, shortDay } from '@/components/profile/ProfileParts';
import { useReferrals, referralNote, Referral } from '@/utils/referrals';

/**
 * Figma "My Referrals" (Profile → Referral Tracking): totals (friends referred, trips completed, rewards
 * earned), then one card per referral with its status line. Tapping one opens Referral Reward.
 */
export default function MyReferralsScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const { data: refs = [], isLoading, isError, refetch, isRefetching } = useReferrals();

  const completed = refs.filter((r) => r.stage === 'processing' || r.stage === 'credited').length;
  const earned = refs.reduce((s, r) => s + (r.stage === 'credited' ? r.amount : 0), 0);

  const meta = (r: Referral) => {
    if (r.stage === 'not_joined') return 'Not joined yet';
    const joined = r.joinedAt ? `Joined MySawari on ${shortDay(r.joinedAt)}` : 'Joined MySawari';
    return r.route ? `${joined}  •  ${r.route}` : joined;
  };

  const Stats = (
    <View>
      <View style={[styles.stats, { backgroundColor: p.soft, borderColor: p.border }]}>
        <Text style={[styles.statLabel, { color: p.sub }]}>Total friends referred</Text>
        <Text style={[styles.statBig, { color: p.fg }]}>{refs.length} {refs.length === 1 ? 'friend' : 'friends'}</Text>
        <View style={styles.statRow}>
          <View style={[styles.statBox, { backgroundColor: p.page, borderColor: p.border }]}>
            <Text style={[styles.statLabel, { color: p.sub }]}>Trips completed</Text>
            <Text style={[styles.statValue, { color: p.fg }]}>{completed}</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: p.page, borderColor: p.border }]}>
            <Text style={[styles.statLabel, { color: p.sub }]}>Rewards earned</Text>
            <Text style={[styles.statValue, { color: earned > 0 ? p.green : p.fg }]}>{rupees(earned)}</Text>
          </View>
        </View>
      </View>
      <Text style={[styles.section, { color: p.fg }]}>Your referrals</Text>
    </View>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
      <ScreenHeader title="My Referrals" />
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 60 }} color={p.muted} />
      ) : (
        <FlatList
          data={refs}
          keyExtractor={(r) => r.id}
          contentContainerStyle={[styles.content, refs.length === 0 && { flexGrow: 1 }]}
          ListHeaderComponent={Stats}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
          renderItem={({ item }) => {
            const note = referralNote(item);
            return (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${item.name}. ${meta(item)}. ${note?.text || ''}`}
                onPress={() => { Haptics.selectionAsync(); router.push({ pathname: '/referral-reward', params: { id: item.id } } as any); }}
                style={({ pressed }) => [styles.card, { borderColor: p.border }, pressed && { backgroundColor: p.soft }]}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: p.iconBg }]}>
                    <Feather name="user" size={16} color={p.fg} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.name, { color: p.fg }]} numberOfLines={1}>{item.name}</Text>
                    <Text style={[styles.meta, { color: p.muted }]} numberOfLines={1}>{meta(item)}</Text>
                  </View>
                </View>
                {!!note && <Text style={[styles.note, { color: note.tone === 'green' ? p.green : p.sub }]}>{note.text}</Text>}
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name={isError ? 'wifi-off' : 'users'} size={23} color={p.fg} />
              <Text style={[styles.emptyTitle, { color: p.fg }]}>{isError ? "Couldn't load your referrals" : 'No referrals yet'}</Text>
              <Text style={[styles.emptySub, { color: p.muted }]}>
                {isError ? 'Pull down to try again.' : 'Invite your friends to MySawari and earn rewards when they complete their first eligible trip.'}
              </Text>
              {!isError && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => router.push('/refer' as any)}
                  style={{ marginTop: 16 }}
                >
                  <Text style={[styles.emptyLink, { color: p.navy }]}>Invite Friends →</Text>
                </Pressable>
              )}
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },
  stats: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingTop: 14, paddingBottom: 13 },
  statLabel: { fontFamily: PF.regular, fontSize: 12.5 },
  statBig: { fontFamily: PF.medium, fontSize: 23, lineHeight: 32, marginTop: 4 },
  statRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  statBox: { flex: 1, borderWidth: 1, borderRadius: 8, paddingHorizontal: 9, paddingTop: 10, paddingBottom: 9 },
  statValue: { fontFamily: PF.medium, fontSize: 18, lineHeight: 26, marginTop: 6 },
  section: { fontFamily: PF.medium, fontSize: 15.5, marginTop: 20, marginBottom: 12 },
  card: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 13, paddingTop: 11, paddingBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 36, height: 36, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  name: { fontFamily: PF.medium, fontSize: 14.5 },
  meta: { fontFamily: PF.regular, fontSize: 12, marginTop: 3 },
  note: { fontFamily: PF.regular, fontSize: 12.5, marginTop: 9 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 60 },
  emptyTitle: { fontFamily: PF.medium, fontSize: 18.5, marginTop: 12 },
  emptySub: { fontFamily: PF.regular, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 10, paddingHorizontal: 12 },
  emptyLink: { fontFamily: PF.medium, fontSize: 12.5, marginTop: 12 },
});