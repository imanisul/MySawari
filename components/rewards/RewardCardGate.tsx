import React, { useEffect, useState } from 'react';
import { usePathname } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSawari } from '@/context/SawariContext';
import { useRideJourney, PendingCard } from '@/hooks/useRideJourney';
import { RewardScratchModal } from './RewardScratchModal';

/**
 * Pops a scratch card up once when a new one is waiting: right after the first login (welcome gift) and when a ride
 * milestone (4th ride…) is reached. Each card pops up only once per phone; if it isn't scratched it stays in Rewards.
 */
export function RewardCardGate() {
  const { isAuthenticated, customer } = useSawari();
  const { cards } = useRideJourney();
  const pathname = usePathname();
  const cardKey = cards.map((c) => c.label).join('|');
  const [card, setCard] = useState<PendingCard | null>(null);
  const [seen, setSeen] = useState<string[] | null>(null);
  const seenKey = `@reward_cards_seen_${customer?.id || ''}`;

  useEffect(() => {
    if (!isAuthenticated || !customer?.id) { setSeen(null); return; }
    AsyncStorage.getItem(seenKey).then((v) => setSeen(v ? JSON.parse(v) : [])).catch(() => setSeen([]));
  }, [isAuthenticated, customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (card || !seen || cards.length === 0) return;
    // Not over checkout, and a beat after the login sheet has gone.
    if (pathname.startsWith('/payment')) return;
    const next = cards.find((c) => !seen.includes(c.label));
    if (!next) return;
    const t = setTimeout(() => {
      const nextSeen = [...seen, next.label];
      setSeen(nextSeen);
      AsyncStorage.setItem(seenKey, JSON.stringify(nextSeen)).catch(() => {});
      setCard(next);
    }, 1200);
    return () => clearTimeout(t);
  }, [cardKey, seen, card, pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  return <RewardScratchModal card={card} onClose={() => setCard(null)} />;
}
