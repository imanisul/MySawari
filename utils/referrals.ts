import { useQuery } from '@tanstack/react-query';
import { API } from '@/services/backend/api';
import { useSawari } from '@/context/SawariContext';
import type { Step } from '@/components/profile/ProfileParts';

/**
 * Referral records from GET /auth/my-referrals, turned into the stages the design shows. The server is known
 * to send INVITED / JOINED / REWARDED; the trip stages (booked, ongoing, completed, cancelled) are read when it
 * sends them, under the usual names, so the screens follow the backend as it adds them.
 */
export type RefStage = 'not_joined' | 'registered' | 'booked' | 'ongoing' | 'processing' | 'credited' | 'cancelled';

export type Referral = {
  id: string;
  name: string;
  mobile?: string;
  stage: RefStage;
  amount: number;
  joinedAt?: string;
  tripDate?: string;
  route?: string;
};

function stageOf(r: any): RefStage {
  const statusUpper = String(r?.status || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  const amount = Number(r?.commissionAmount ?? r?.rewardAmount) || 0;
  if (['REWARDED', 'CREDITED', 'PAID', 'REWARD_CREDITED', 'COMPLETED_REWARDED'].includes(statusUpper) || (amount > 0 && statusUpper !== 'PROCESSING' && statusUpper !== 'BOOKED' && statusUpper !== 'ONGOING')) {
    return 'credited';
  }

  const s = String(r?.tripStatus || r?.bookingStatus || r?.status || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (['REWARDED', 'CREDITED', 'PAID', 'REWARD_CREDITED', 'COMPLETED_REWARDED'].includes(s)) return 'credited';
  if (['CANCELLED', 'CANCELED', 'TRIP_CANCELLED', 'EXPIRED', 'REJECTED', 'NO_SHOW'].includes(s)) return 'cancelled';
  if (['COMPLETED', 'TRIP_COMPLETED', 'PROCESSING', 'REWARD_PROCESSING', 'ELIGIBLE', 'PENDING_REWARD'].includes(s)) return 'processing';
  if (['ONGOING', 'TRIP_ONGOING', 'IN_PROGRESS', 'ACTIVE', 'VEHICLE_HANDOVER', 'HANDED_OVER'].includes(s)) return 'ongoing';
  if (['BOOKED', 'TRIP_BOOKED', 'CONFIRMED', 'UPCOMING'].includes(s)) return 'booked';
  if (['JOINED', 'REGISTERED', 'SIGNED_UP', 'SIGNEDUP', 'ACTIVE_USER'].includes(s)) return 'registered';
  return 'not_joined';
}

function routeOf(r: any): string | undefined {
  if (typeof r?.route === 'string' && r.route.trim()) return r.route.trim();
  const from = r?.fromCity || r?.from || r?.pickupCity || r?.trip?.from;
  const to = r?.toCity || r?.to || r?.destination || r?.trip?.to;
  return from && to ? `${from} → ${to}` : to || undefined;
}

export function normalizeReferral(r: any, i: number): Referral {
  return {
    id: String(r?.id || r?._id || r?.mobileNumber || i),
    name: String(r?.referredName || r?.name || 'Your friend').trim() || 'Your friend',
    mobile: r?.mobileNumber,
    stage: stageOf(r),
    amount: Math.max(0, Number(r?.commissionAmount ?? r?.rewardAmount ?? r?.estimatedCommission) || 0),
    joinedAt: r?.joinedAt || r?.registeredAt || (r?.status && String(r.status).toUpperCase() !== 'INVITED' ? r?.signupAt : undefined),
    tripDate: r?.tripDate || r?.bookingDate || r?.completedAt || r?.tripCompletedAt,
    route: routeOf(r),
  };
}

/** The customer's referrals (shared by My Referrals and Referral Reward, so the detail opens instantly). */
export function useReferrals() {
  const { customer, isAuthenticated } = useSawari();
  return useQuery({
    queryKey: ['referrals', customer?.id],
    queryFn: async () => ((await API.getReferrals(customer.id)) || []).map(normalizeReferral) as Referral[],
    enabled: isAuthenticated === true && !!customer?.id,
    staleTime: 60 * 1000,
  });
}

const ORDER: RefStage[] = ['registered', 'booked', 'ongoing', 'processing', 'credited'];

/** Design "Referral Status" timeline for one referral. */
export function referralSteps(ref: Referral): Step[] {
  const reached = ref.stage === 'not_joined' ? -1 : ref.stage === 'cancelled' ? 1 : ORDER.indexOf(ref.stage);
  const reward = ref.amount > 0 ? `₹${ref.amount.toLocaleString('en-IN')} has been added to your MySawari Cash.` : 'Your reward has been added to your MySawari Cash.';
  const base: Step[] = [
    { title: 'Registered', sub: 'Your friend joined MySawari. Their reward unlocks after they complete their first eligible trip.', state: reached >= 0 ? 'done' : 'todo' },
    { title: 'Trip booked', sub: 'Your friend has booked a trip. Your reward is pending trip completion.', state: reached >= 1 ? 'done' : 'todo' },
  ];
  if (ref.stage === 'cancelled') {
    return [...base, { title: 'Trip Cancelled', sub: "Your friend's trip was cancelled, so no reward was earned for it.", state: 'error' }];
  }
  return [
    ...base,
    { title: 'Trip ongoing', sub: "Your friend's trip is underway. Your reward unlocks once the trip is completed.", state: reached >= 2 ? 'done' : 'todo' },
    { title: 'Reward processing', sub: 'Trip completed! Your reward will be credited within 1–2 working days.', state: reached >= 3 ? 'done' : 'todo' },
    { title: 'Reward credited', sub: reward, state: reached >= 4 ? 'success' : 'todo' },
  ];
}

/** One-line status under a referral (list) and above the timeline (detail). */
export function referralNote(ref: Referral): { text: string; tone: 'green' | 'muted' } | null {
  switch (ref.stage) {
    case 'processing': return { text: 'Reward arriving in 1–2 working days', tone: 'green' };
    case 'credited': return { text: ref.amount > 0 ? `₹${ref.amount.toLocaleString('en-IN')} added to your MySawari Cash` : 'Reward added to your MySawari Cash', tone: 'green' };
    case 'registered': return { text: "Hasn't booked a trip yet.", tone: 'muted' };
    case 'booked':
    case 'ongoing': return { text: 'Reward unlocks after trip completion.', tone: 'muted' };
    case 'cancelled': return { text: 'No reward earned · Trip cancelled', tone: 'muted' };
    default: return null;
  }
}

/** Trip line in the reward card: "Trip completed • 16 Oct". */
export function tripLine(ref: Referral): string {
  const label = {
    not_joined: 'Not joined yet', registered: 'Trip Pending', booked: 'Trip Booked', ongoing: 'Trip Ongoing',
    processing: 'Trip completed', credited: 'Trip completed', cancelled: 'Trip Cancelled',
  }[ref.stage];
  const d = ref.tripDate ? new Date(ref.tripDate) : null;
  return d && !isNaN(d.getTime()) && !['not_joined', 'registered'].includes(ref.stage)
    ? `${label}  •  ${d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}`
    : label;
}