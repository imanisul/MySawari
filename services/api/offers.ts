import { Feather } from '@expo/vector-icons';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { BACKEND_URL, plateSafeImageUrl, timedFetch } from '@/services/backend/api';

/** Deal / offer photos usually show a fleet vehicle, so they go through plate processing too. */
function plateSafeOfferImage(image: any) {
  const raw = typeof image === 'string' ? image : image?.url;
  if (!raw) return undefined;
  const url = plateSafeImageUrl(raw);
  return { ...(typeof image === 'object' ? image : {}), url, uri: url };
}

export interface Offer {
  id: string;
  _id?: string;
  type: 'coupon' | 'special_deal';
  title: string;
  subtitle: string;
  discount: string;
  code: string;
  expiry: string;
  gradientColors: [string, string];
  icon: keyof typeof Feather.glyphMap;
  image?: any;
  // Special deal fields
  vehicleId?: string;
  originalPrice?: number;
  dealPrice?: number;
  discountPercent?: number;
  expiryDate?: string;
  active?: boolean;
}

function formatExpiry(dateStr: string): string {
  const date = new Date(dateStr);
  return `Valid till ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

/**
 * Fetches offers from the backend. Only live offers are shown: if the server can't be reached the
 * request fails (React Query retries it) and the offer sections stay hidden, instead of showing
 * built-in coupons that may not match what the server accepts.
 */

/**
 * Still usable right now: switched on and not past its expiry date. The server lists expired offers too,
 * but checkout only accepts an in-date coupon, so an expired one would be a card the customer can't use.
 */
export function isOfferLive(offer: { active?: boolean; expiryDate?: string | Date }, now = Date.now()): boolean {
  if (offer.active === false) return false;
  const expires = offer.expiryDate ? new Date(offer.expiryDate).getTime() : NaN;
  return Number.isFinite(expires) && expires >= now;
}

/** One shared query, so the home screen and the app-start prefetch use the same cached offers. */
export const offersQueryOptions = {
  queryKey: ['offers'] as const,
  queryFn: () => fetchOffers(),
  staleTime: 15 * 1000,
  refetchOnWindowFocus: true,
};

export async function fetchOffers(): Promise<Offer[]> {
  const res = await timedFetch(`${BACKEND_URL}/offers`);
  if (res.ok) {
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data.filter((offer: any) => offer && isOfferLive(offer)).map((offer: any) => {
        if (offer.type === 'coupon') {
          const isFlat = offer.discountType === 'FLAT';
          const discount = isFlat ? `${formatCurrency(offer.discountValue)} OFF` : `${offer.discountValue}% OFF`;
          const subtitle = offer.subtitle || (isFlat
            ? `Flat ${formatCurrency(offer.discountValue)} off on bookings above ${formatCurrency(offer.minimumBooking)}`
            : `${offer.discountValue}% off${offer.maximumDiscount ? ` (up to ${formatCurrency(offer.maximumDiscount)})` : ''} on bookings above ${formatCurrency(offer.minimumBooking)}`);

          return {
            id: `coupon-${offer.code}`,
            _id: offer._id,
            type: 'coupon',
            title: offer.title,
            subtitle,
            discount,
            code: offer.code,
            expiry: formatExpiry(offer.expiryDate),
            gradientColors: offer.gradientColors || ['#6178D8', '#8B5CF6'],
            icon: offer.icon || 'tag',
            image: plateSafeOfferImage(offer.image),
          };
        } else {
          // special_deal — pass through as-is with minimal transforms
          return {
            id: `deal-${offer._id}`,
            _id: offer._id,
            type: 'special_deal',
            title: offer.title,
            subtitle: offer.subtitle,
            discount: offer.discountPercent ? `${offer.discountPercent}% OFF` : '',
            code: '',
            expiry: formatExpiry(offer.expiryDate),
            expiryDate: offer.expiryDate,
            gradientColors: offer.gradientColors || ['#FF416C', '#FF4B2B'],
            icon: offer.icon || 'zap',
            image: plateSafeOfferImage(offer.image),
            vehicleId: offer.vehicleId,
            originalPrice: offer.originalPrice,
            dealPrice: offer.dealPrice,
            discountPercent: offer.discountPercent,
            active: offer.active,
          };
        }
      });
    }
  }
  throw new Error(`Could not load offers (${res.status})`);
}
