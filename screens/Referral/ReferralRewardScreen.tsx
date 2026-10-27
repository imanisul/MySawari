import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { ScreenHeader, StatusTimeline, PF, rupees } from '@/components/profile/ProfileParts';
import { useReferrals, referralSteps, tripLine } from '@/utils/referrals';

/**
 * Figma "Referral Reward": the friend, their trip and the reward (₹0 until credited), a status line, and the
 * "Referral Status" timeline — Registered → Trip booked → Trip ongoing → Reward processing → Reward credited,
 * or ending in "Trip Cancelled".
 */
export default function ReferralRewardScreen() {
  const p = useDetailsPalette();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: refs, isLoading } = useReferrals();
  const ref = refs?.find((r) => r.id === id);

  const note = !ref ? null
    : ref.stage === 'processing' ? { text: 'Your reward is being processed and will be credited within 1–2 working days.', green: true }
      : ref.stage === 'credited' ? { text: `${ref.amount > 0 ? rupees(ref.amount) : 'Your reward'} has been added to your MySawari Cash.`, green: true }
        : ref.stage === 'registered' ? { text: "Hasn't booked a trip yet.", green: false }
          : ref.stage === 'booked' || ref.stage === 'ongoing' ? { text: 'Reward unlocks after trip completion.', green: false }
            : ref.stage === 'cancelled' ? { text: 'No reward earned  •  Trip cancelled', green: false }
              : null;

  // Shown before the reward is credited: what it will be once the trip completes (₹0 until then, as in the design).
  const shown = ref && (ref.stage === 'processing' || ref.stage === 'credited') ? ref.amount : 0;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
      <ScreenHeader title="Referral Reward" />
      {!ref ? (
        isLoading ? <ActivityIndicator style={{ marginTop: 60 }} color={p.muted} /> : (
          <Text style={[styles.missing, { color: p.muted }]}>This referral could not be found. Go back and pull down to refresh.</Text>
        )
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={[styles.card, { borderColor: p.segBorder, backgroundColor: p.page }]}>
            <View style={styles.info}>
              <Text style={[styles.friend, { color: p.fg }]} numberOfLines={1} accessibilityRole="header">Friend: {ref.name}</Text>
              {!!ref.route && (
                <View style={styles.line}>
                  <Feather name="map-pin" size={16} color={p.muted} />
                  <Text style={[styles.lineText, { color: p.muted }]} numberOfLines={1}>{ref.route}</Text>
                </View>
              )}
              <View style={styles.line}>
                <Feather name="calendar" size={16} color={p.muted} />
                <Text style={[styles.lineText, { color: p.muted }]}>{tripLine(ref)}</Text>
              </View>
            </View>
            <Text style={[styles.amount, { color: p.fg }]}>{rupees(shown)}</Text>
          </View>
          {!!note && <Text style={[styles.note, { color: note.green ? p.green : p.muted }]}>{note.text}</Text>}

          <Text style={[styles.section, { color: p.fg }]}>Referral Status</Text>
          <StatusTimeline steps={referralSteps(ref)} doneColor="#2F3E75" errorColor="#DC2626" />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40 },
  missing: { fontFamily: PF.regular, fontSize: 13, textAlign: 'center', marginTop: 60, paddingHorizontal: 32 },
  card: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
  info: { flex: 1, minWidth: 0, gap: 8 },
  friend: { fontFamily: PF.medium, fontSize: 13, lineHeight: 20 },
  line: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lineText: { fontFamily: PF.medium, fontSize: 11, lineHeight: 17 },
  amount: { fontFamily: PF.semibold, fontSize: 24, lineHeight: 36, textAlign: 'right' },
  note: { fontFamily: PF.semibold, fontSize: 11, lineHeight: 17, marginTop: 10 },
  section: { fontFamily: PF.semibold, fontSize: 15, lineHeight: 23, marginTop: 16, marginBottom: 12 },
});
