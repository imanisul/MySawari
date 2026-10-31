import { useSawari } from '@/context/SawariContext';
import { BOOKING_ADVANCE_AMOUNT } from '@/services/backend/pricingEngine';

const PLAN_NAMES: Record<string, string> = { starter: 'Starter', plus: 'Plus', pro: 'Pro' };

/** Mirror of the pricingEngine's MEMBERSHIP_PLANS — used when the quote didn't include the discount. */
const PLAN_RATES: Record<string, { rate: number; tripCap: number; annualCap: number }> = {
  starter: { rate: 0.05,  tripCap: 499, annualCap: 10000 },
  plus:    { rate: 0.10,  tripCap: 799, annualCap: 15000 },
  pro:     { rate: 0.125, tripCap: 999, annualCap: 20000 },
};

export type TripPrice =
  | { state: 'no-dates'; perDay: number }
  | { state: 'loading' }
  | { state: 'error'; message: string; retry: () => void }
  | {
      state: 'ready';
      days: number;
      perDay: number;
      /** Rent + driver + pickup/drop, before coupon and membership. */
      original: number;
      /** What the trip costs after coupon and membership — the same figure the server checks at booking. */
      final: number;
      /** `final` less the SawariCash used: the total the customer actually owes (what is shown big and bold). */
      total: number;
      rentalAmount: number;
      driverCharge: number;
      pickupCharge: number;
      pickupDistanceKm: number;
      dropCharge: number;
      dropDistanceKm: number;
      ratePerKm: number;
      couponCode?: string;
      couponDiscount: number;
      membershipDiscount: number;
      /** Only set for an active membership. */
      planName: string | null;
      /** A plan being bought with this booking (its discount is in membershipDiscount, its price in payableNow). */
      buyingPlan: string | null;
      membershipFee: number;
      payableNow: number;
      /** SawariCash taken off what's paid (quote's sawariCashUsed). */
      sawariCashUsed: number;
      balance: number;
      kmText: string;
    };

/**
 * The trip price for the car details page, from the app's pricing quote. The quote uses the vehicle's
 * price from the backend and the customer's membership from the server wallet, and follows the same
 * rules the server re-checks when the booking is saved. Nothing is guessed: while the quote for this
 * car and these dates isn't in yet, the state says so.
 */
export function useTripPrice(hasTrip: boolean): TripPrice {
  const { selectedCar, pricingQuote: q, isQuoteLoading, quoteError, refreshQuote, membership } = useSawari();
  const perDay = selectedCar?.perDay || 0;

  if (!hasTrip) return { state: 'no-dates', perDay };
  if (quoteError && !isQuoteLoading) return { state: 'error', message: quoteError, retry: () => { refreshQuote(); } };
  // The quote is shared app-wide; one priced for a different car must not show here.
  if (!q || isQuoteLoading || q.dailyRate !== perDay) return { state: 'loading' };

  const original = q.rentalAmount + q.driverCharge + q.pickupCharge + q.dropCharge;

  // If the quote already includes a subscription discount, use it. Otherwise, if the context
  // knows the user has an active membership (e.g. wallet was fetched earlier but the current
  // quote call's wallet request failed silently), compute the discount locally using the same
  // formula so the shown price is consistent with the membership chip.
  const planKey = (membership?.plan || '').toLowerCase().trim();
  const isMembershipActive = !!planKey && (!membership?.expiresAt || new Date(membership.expiresAt) > new Date());
  let membershipDiscount = q.subscriptionDiscount || 0;
  if (membershipDiscount === 0 && isMembershipActive && planKey && PLAN_RATES[planKey]) {
    const { rate, tripCap, annualCap } = PLAN_RATES[planKey];
    const remaining = Math.max(0, annualCap - (membership?.totalSaved || 0));
    membershipDiscount = Math.min(
      Math.round(original * rate),
      tripCap,
      remaining,
    );
  }

  const final = Math.max(0, q.discountedRentalAmount + q.pickupCharge + q.dropCharge - membershipDiscount);
  const activePlan = isMembershipActive
    ? (PLAN_NAMES[planKey] ?? (membership!.plan ? membership!.plan.charAt(0).toUpperCase() + membership!.plan.slice(1).toLowerCase() : null))
    : null;
  const planName = activePlan || q.membershipPlanName || (q.subscriptionDiscount > 0 && planKey ? (PLAN_NAMES[planKey] ?? 'Plus') : null);

  return {
    state: 'ready',
    days: q.rentalDays,
    perDay: q.dailyRate,
    original,
    final,
    // SawariCash is a discount on the trip: it comes off the total (it covers the booking amount first, so the
    // booking amount shrinks and "pay at pickup" stays total − booking amount).
    total: Math.max(0, final - (q.sawariCashUsed || 0)),
    rentalAmount: q.rentalAmount,
    driverCharge: q.driverCharge,
    pickupCharge: q.pickupCharge,
    pickupDistanceKm: q.pickupDistanceKm,
    dropCharge: q.dropCharge,
    dropDistanceKm: q.dropDistanceKm,
    ratePerKm: q.ratePerKm,
    couponCode: q.couponCode,
    couponDiscount: q.couponDiscount,
    membershipDiscount,
    planName,
    buyingPlan: q.membershipPlanToBuy ? (PLAN_NAMES[q.membershipPlanToBuy.toLowerCase()] ?? q.membershipPlanToBuy) : null,
    membershipFee: q.membershipFee || 0,
    payableNow: q.onlinePayableNow ?? Math.min(BOOKING_ADVANCE_AMOUNT, final),
    sawariCashUsed: q.sawariCashUsed || 0,
    balance: q.remainingRentalAmount,
    kmText: q.rentalDays >= 2 ? 'Unlimited km' : 'Incl. 300 km',
  };
}