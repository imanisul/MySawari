import { Feather } from '@expo/vector-icons';
import { COUPONS, formatCurrency } from '@/services/backend/pricingEngine';
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

/**
 * Display copy for each real coupon in pricingEngine.ts — the source of truth for what a code
 * actually does at checkout. A coupon with no entry here just doesn't render a card, rather than
 * showing with blank title/icon. Keep this in sync when COUPONS gains or loses a code.
 */
const COUPON_DISPLAY: Record<string, { title: string; gradientColors: [string, string]; icon: keyof typeof Feather.glyphMap }> = {
  FIRST100: { title: 'First Ride Discount', gradientColors: ['#6178D8', '#8B5CF6'], icon: 'gift' },
  SAWARI200: { title: 'Sawari Special', gradientColors: ['#0EA5E9', '#6178D8'], icon: 'tag' },
  FESTIVAL10: { title: 'Festival Offer', gradientColors: ['#FF416C', '#FF4B2B'], icon: 'percent' },
};

function formatExpiry(dateStr: string): string {
  const date = new Date(dateStr);
  return `Valid till ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`;
}

/**
 * Try fetching offers from the backend API. Falls back to the local hardcoded
 * COUPONS list if the API is unreachable (e.g. first deploy before backend is updated).
 */

export async function fetchOffers(): Promise<Offer[]> {
  try {
    const res = await timedFetch(`${BACKEND_URL}/offers`);
    if (res.ok) {
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        return json.data.map((offer: any) => {
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
  } catch {
    // API unavailable — fall through to local fallback
  }

  // Fallback to the hardcoded COUPONS list
  return fetchOffersLocal();
}

/** Original local-only implementation, kept as fallback. */
function fetchOffersLocal(): Offer[] {
  const now = new Date();
  return COUPONS
    .filter((coupon) => coupon.active && new Date(coupon.expiryDate) >= now && COUPON_DISPLAY[coupon.code])
    .map((coupon) => {
      const meta = COUPON_DISPLAY[coupon.code];
      const isFlat = coupon.discountType === 'FLAT';
      const discount = isFlat ? `${formatCurrency(coupon.discountValue)} OFF` : `${coupon.discountValue}% OFF`;
      const subtitle = isFlat
        ? `Flat ${formatCurrency(coupon.discountValue)} off on bookings above ${formatCurrency(coupon.minimumBooking)}`
        : `${coupon.discountValue}% off${coupon.maximumDiscount ? ` (up to ${formatCurrency(coupon.maximumDiscount)})` : ''} on bookings above ${formatCurrency(coupon.minimumBooking)}`;

      return {
        id: `coupon-${coupon.code}`,
        type: 'coupon' as const,
        title: meta.title,
        subtitle,
        discount,
        code: coupon.code,
        expiry: formatExpiry(coupon.expiryDate),
        gradientColors: meta.gradientColors,
        icon: meta.icon,
      };
    });
}
