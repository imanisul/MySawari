import { useQuery } from '@tanstack/react-query';
import { useSawari } from '@/context/SawariContext';
import { API } from '@/services/backend/api';

/** A scratch card waiting to be opened: the welcome bonus, or a ride milestone reached. */
export type PendingCard = { kind: 'signup' | 'milestone'; label: string; title: string; amount: number };

/** Trip milestones and the welcome card, per customer (the key carries the id so one account never sees another's). */
export function useRideJourney() {
  const { isAuthenticated, customer } = useSawari();
  const query = useQuery({
    queryKey: ['ride-journey', customer?.id],
    queryFn: () => API.getRideJourney(),
    enabled: !!isAuthenticated,
    staleTime: 30_000,
  });
  const j = query.data;
  const cards: PendingCard[] = [];
  if (j?.signupBonus && !j.signupBonus.scratched) cards.push({ kind: 'signup', label: 'Welcome Bonus', title: 'Welcome gift', amount: j.signupBonus.amount });
  for (const m of j?.milestones ?? []) {
    if (m.unlocked && !m.claimed) cards.push({ kind: 'milestone', label: m.label, title: `${m.rides} rides completed`, amount: m.scratchAmount || (m.rides === 4 ? 200 : 350) });
  }
  return { ...query, cards };
}
