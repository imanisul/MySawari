import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  vehicleName?: string;
};

export type PartnerQR = {
  token: string;
  batchName?: string;
  assignedAt?: string;
  businessName?: string;
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
    vehicleName: typeof r?.vehicleName === 'string' && r.vehicleName.trim() ? r.vehicleName.trim() : undefined,
  };
}

/**
 * The customer's referrals (shared by My Referrals and Referral Reward, so the detail opens instantly).
 * The last list is kept on the phone: the screen draws it at once and the fresh one replaces it when it arrives,
 * so opening My Referrals never starts from a loading skeleton after the first time.
 */
export function useReferrals() {
  const { customer, isAuthenticated } = useSawari();
  const qc = useQueryClient();
  const key = ['referrals', customer?.id];
  const storeKey = `@referrals_${customer?.id}`;

  useEffect(() => {
    if (!customer?.id) return;
    AsyncStorage.getItem(storeKey).then((saved) => {
      if (saved && !qc.getQueryData(key)) qc.setQueryData(key, JSON.parse(saved), { updatedAt: 0 });
    }).catch(() => {});
  }, [customer?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const rawList = await API.getReferrals(customer.id);
      const list = ((rawList as any[]) || []).map(normalizeReferral) as Referral[];
      if (rawList && Array.isArray((rawList as any).assignedQRs)) {
        (list as any).assignedQRs = (rawList as any).assignedQRs;
      }
      AsyncStorage.setItem(storeKey, JSON.stringify(list)).catch(() => {});
      return list;
    },
    enabled: isAuthenticated === true && !!customer?.id,
    staleTime: 60 * 1000,
  });
}

/**
 * Hook to fetch physical QR stickers assigned to the partner by operations executives.
 */
export function usePartnerQRs() {
  const { customer, isAuthenticated } = useSawari();
  return useQuery({
    queryKey: ['partner-qrs', customer?.id],
    queryFn: async () => {
      const qrs = await API.getPartnerQRs();
      return (qrs || []) as PartnerQR[];
    },
    enabled: isAuthenticated === true && !!customer?.id,
    staleTime: 60 * 1000,
  });
}

/** Starts loading the referrals in the background (Profile calls it), so My Referrals opens already filled. */
export function usePrefetchReferrals() {
  useReferrals();
}

const ORDER: RefStage[] = ['registered', 'booked', 'ongoing', 'processing', 'credited'];

/** Design "Referral Status" timeline for one referral. */
export function referralSteps(ref: Referral): Step[] {
  const reached = ref.stage === 'not_joined' ? -1 : ref.stage === 'cancelled' ? 1 : ORDER.indexOf(ref.stage);
  const reward = ref.amount > 0 ? `₹${ref.amount.toLocaleString('en-IN')} has been credited to your Wallet (withdrawable to bank account).` : 'Your commission has been credited to your Wallet (withdrawable to bank account).';
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
    case 'credited': return { text: ref.amount > 0 ? `₹${ref.amount.toLocaleString('en-IN')} in Wallet (withdrawable)` : 'Credited to Wallet', tone: 'green' };
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