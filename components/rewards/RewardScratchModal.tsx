import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, ActivityIndicator, useWindowDimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import ConfettiCannon from 'react-native-confetti-cannon';
import { useQueryClient } from '@tanstack/react-query';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { ModalBlur } from '@/components/common/ModalBlur';
import type { PendingCard } from '@/hooks/useRideJourney';
import { ScratchCard } from './ScratchCard';

const F = { medium: 'PlusJakartaSans_500Medium', semibold: 'PlusJakartaSans_600SemiBold', bold: 'PlusJakartaSans_700Bold' };
const CONFETTI = ['#2F3E75', '#6152D8', '#FBBC04', '#C9C2F7', '#FFFFFF'];

/**
 * The scratch-card popup (welcome gift, ride milestones). The prize is credited as SawariCash only once the card is
 * scratched; closing it without scratching leaves the card waiting in Profile → Rewards.
 */
export function RewardScratchModal({ card, onClose }: { card: PendingCard | null; onClose: () => void }) {
  const { width } = useWindowDimensions();
  const queryClient = useQueryClient();
  const { earnSawariCash } = useSawari();
  const [state, setState] = useState<'idle' | 'saving' | 'done' | 'error'>('idle');
  const [revealAll, setRevealAll] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (card) { setState('idle'); setRevealAll(false); setError(''); } }, [card?.label]); // eslint-disable-line react-hooks/exhaustive-deps

  const open = async () => {
    if (!card || state === 'saving' || state === 'done') return;
    setState('saving');
    try {
      if (card.kind === 'signup') await API.scratchSignupBonus();
      else await API.claimMilestoneReward(card.label);
      setState('done');
      Promise.resolve(earnSawariCash(card.amount)).catch(() => {});
    } catch (e: any) {
      // "already claimed" means the money is in the wallet already: show it as opened.
      if (/already/i.test(String(e?.message))) setState('done');
      else { setError(e?.message || 'Please try again in a moment.'); setState('error'); }
    } finally {
      queryClient.invalidateQueries({ queryKey: ['ride-journey'] });
    }
  };

  return (
    <Modal visible={!!card} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <ModalBlur />
      <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={styles.center} pointerEvents="box-none">
        {!!card && (
          <View style={styles.sheet} accessibilityViewIsModal>
            <Text style={styles.kicker}>{card.title}</Text>
            <Text style={styles.title}>{state === 'done' ? 'Added to your SawariCash' : 'You won a scratch card!'}</Text>

            <View style={styles.cardWrap}>
              <ScratchCard onReveal={open} revealed={revealAll}>
                <Text style={styles.prizeLabel}>You won</Text>
                <Text style={styles.prize}>{formatCurrency(card.amount)}</Text>
                <Text style={styles.prizeSub}>SawariCash</Text>
              </ScratchCard>
            </View>

            {state === 'idle' && (
              <Pressable accessibilityRole="button" accessibilityLabel="Reveal the reward" onPress={() => setRevealAll(true)} hitSlop={8}>
                <Text style={styles.link}>Can’t scratch? Tap to reveal</Text>
              </Pressable>
            )}
            {state === 'saving' && <ActivityIndicator color="#2F3E75" />}
            {state === 'done' && <Text style={styles.ok}>{formatCurrency(card.amount)} has been added to your wallet.</Text>}
            {state === 'error' && (
              <>
                <Text style={styles.err}>{error}</Text>
                <Pressable accessibilityRole="button" onPress={open} style={styles.btn}><Text style={styles.btnText}>Try again</Text></Pressable>
              </>
            )}

            <Pressable accessibilityRole="button" onPress={onClose} style={[styles.btn, state === 'done' ? null : styles.btnGhost]}>
              <Text style={[styles.btnText, state === 'done' ? null : styles.btnGhostText]}>{state === 'done' ? 'Done' : 'Scratch later'}</Text>
            </Pressable>
            {state !== 'done' && <Text style={styles.foot}>Your card stays safe in Profile → Rewards.</Text>}
          </View>
        )}
      </View>
      {state === 'done' && (
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <ConfettiCannon count={70} origin={{ x: -10, y: 0 }} explosionSpeed={380} fallSpeed={2600} fadeOut colors={CONFETTI} />
          <ConfettiCannon count={70} origin={{ x: width + 10, y: 0 }} explosionSpeed={380} fallSpeed={2600} fadeOut colors={CONFETTI} />
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  sheet: { width: 288, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E7EAF4', padding: 16, alignItems: 'center', gap: 10 },
  kicker: { fontFamily: F.medium, fontSize: 12, color: '#747EA3' },
  title: { fontFamily: F.semibold, fontSize: 19, color: '#2F3E75', textAlign: 'center' },
  cardWrap: { marginVertical: 6 },
  prizeLabel: { fontFamily: F.medium, fontSize: 12, color: '#747EA3' },
  prize: { fontFamily: F.bold, fontSize: 34, color: '#2F3E75', lineHeight: 42 },
  prizeSub: { fontFamily: F.semibold, fontSize: 13, color: '#008758' },
  link: { fontFamily: F.medium, fontSize: 12, color: '#6152D8', textDecorationLine: 'underline' },
  ok: { fontFamily: F.medium, fontSize: 13, color: '#008758', textAlign: 'center' },
  err: { fontFamily: F.medium, fontSize: 12, color: '#C62828', textAlign: 'center' },
  btn: { alignSelf: 'stretch', height: 46, borderRadius: 12, backgroundColor: '#2F3E75', alignItems: 'center', justifyContent: 'center' },
  btnText: { fontFamily: F.semibold, fontSize: 15, color: '#FFFFFF' },
  btnGhost: { backgroundColor: '#F4F6FA' },
  btnGhostText: { color: '#2F3E75' },
  foot: { fontFamily: F.medium, fontSize: 11, color: '#747EA3' },
});
