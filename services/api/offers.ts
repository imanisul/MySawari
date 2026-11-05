import AsyncStorage from '@react-native-async-storage/async-storage';
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
  type: 'coupon' | 'special_deal' | 'banner';
  title: string;
  subtitle: string;
  description?: string;
  discount?: string;
  code?: string;
  expiry?: string;
  gradientColors?: [string, string];
  icon?: keyof typeof Feather.glyphMap;
  image?: any;
  displayFormat?: 'image' | 'text' | 'combination';
  lines?: [string, string] | string[];
  applicableType?: 'all' | 'specific_vehicles' | 'category' | 'campaign';
  applicableVehicleIds?: string[];
  applicableCategories?: string[];
  startDate?: string;
  minimumBooking?: number;
  discountType?: 'FLAT' | 'PERCENTAGE';
  discountValue?: number;
  maximumDiscount?: number | null;
  // Special deal fields
  vehicleId?: string;
  originalPrice?: number;
  dealPrice?: number;
  discountPercent?: number;
  expiryDate?: string;
  active?: boolean;
  approvalStatus?: 'approved' | 'pending_approval' | 'rejected' | string;
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
 * Still usable right now: switched on, approved by admin, and not past its expiry date.
 */
export function isOfferLive(offer: { active?: boolean; expiryDate?: string | Date; approvalStatus?: string }, now = Date.now()): boolean {
  if (offer.active === false) return false;
  if (offer.approvalStatus && offer.approvalStatus !== 'approved') return false;
  const expires = offer.expiryDate ? new Date(offer.expiryDate).getTime() : NaN;
  return Number.isFinite(expires) && expires >= now;
}

/** One shared query, so the home screen and the app-start prefetch use the same cached offers. */
const OFFERS_CACHE_KEY = '@offers_cache_v1';

export const offersQueryOptions = {
  queryKey: ['offers'] as const,
  queryFn: async () => {
    const offers = await fetchOffers();
    AsyncStorage.setItem(OFFERS_CACHE_KEY, JSON.stringify(offers)).catch(() => {});
    return offers;
  },
  staleTime: 5 * 60 * 1000,
  refetchInterval: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
};

export async function fetchOffers(): Promise<Offer[]> {
  const res = await timedFetch(`${BACKEND_URL}/offers`);
  if (res.ok) {
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      return json.data.filter((offer: any) => offer && isOfferLive(offer)).map((offer: any) => {
        if (offer.type === 'banner') {
          const displayFormat = offer.displayFormat || (offer.image?.url && !offer.title ? 'image' : offer.image?.url && offer.title ? 'combination' : 'text');
          return {
            id: `banner-${offer._id}`,
            _id: offer._id,
            type: 'banner',
            title: offer.title || '',
            subtitle: offer.subtitle || '',
            code: offer.code || '',
            discount: offer.discount || '',
            displayFormat,
            lines: Array.isArray(offer.lines) && offer.lines.length >= 2 ? [offer.lines[0], offer.lines[1]] : undefined,
            gradientColors: offer.gradientColors || ['#6152D8', '#8B5CF6'],
            icon: offer.icon || 'tag',
            image: plateSafeOfferImage(offer.image),
            expiry: offer.expiryDate ? formatExpiry(offer.expiryDate) : '',
            expiryDate: offer.expiryDate,
            startDate: offer.startDate,
            description: offer.description || '',
            applicableType: offer.applicableType || 'all',
            applicableVehicleIds: Array.isArray(offer.applicableVehicleIds) ? offer.applicableVehicleIds.map(String) : [],
            applicableCategories: Array.isArray(offer.applicableCategories) ? offer.applicableCategories : [],
            vehicleId: offer.vehicleId ? String(offer.vehicleId) : undefined,
            active: offer.active,
            approvalStatus: offer.approvalStatus,
          };
        } else if (offer.type === 'coupon') {
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
            displayFormat: offer.displayFormat || (offer.image?.url && !offer.title ? 'image' : offer.image?.url ? 'combination' : 'text'),
            lines: Array.isArray(offer.lines) && offer.lines.length >= 2 ? [offer.lines[0], offer.lines[1]] : undefined,
            expiry: formatExpiry(offer.expiryDate),
            expiryDate: offer.expiryDate,
            startDate: offer.startDate,
            description: offer.description || '',
            minimumBooking: offer.minimumBooking,
            discountType: offer.discountType,
            discountValue: offer.discountValue,
            maximumDiscount: offer.maximumDiscount,
            applicableType: offer.applicableType || 'all',
            applicableVehicleIds: Array.isArray(offer.applicableVehicleIds) ? offer.applicableVehicleIds.map(String) : [],
            applicableCategories: Array.isArray(offer.applicableCategories) ? offer.applicableCategories : [],
            vehicleId: offer.vehicleId ? String(offer.vehicleId) : undefined,
            gradientColors: offer.gradientColors || ['#6178D8', '#8B5CF6'],
            icon: offer.icon || 'tag',
            image: plateSafeOfferImage(offer.image),
            active: offer.active,
            approvalStatus: offer.approvalStatus,
          };
        } else {
          // special_deal — pass through as-is with minimal transforms
          return {
            id: `deal-${offer._id}`,
            _id: offer._id,
            type: 'special_deal',
            title: offer.title,
            subtitle: offer.subtitle,
            description: offer.description || '',
            discount: offer.discountPercent ? `${offer.discountPercent}% OFF` : '',
            code: offer.code || '',
            displayFormat: offer.displayFormat || (offer.image?.url && !offer.title ? 'image' : offer.image?.url ? 'combination' : 'text'),
            lines: Array.isArray(offer.lines) && offer.lines.length >= 2 ? [offer.lines[0], offer.lines[1]] : undefined,
            expiry: formatExpiry(offer.expiryDate),
            expiryDate: offer.expiryDate,
            startDate: offer.startDate,
            applicableType: 'specific_vehicles',
            applicableVehicleIds: [String(offer.vehicleId)],
            vehicleId: String(offer.vehicleId),
            gradientColors: offer.gradientColors || ['#FF416C', '#FF4B2B'],
            icon: offer.icon || 'zap',
            image: plateSafeOfferImage(offer.image),
            originalPrice: offer.originalPrice,
            dealPrice: offer.dealPrice,
            discountPercent: offer.discountPercent,
            active: offer.active,
            approvalStatus: offer.approvalStatus,
          };
        }
      });
    }
  }
  throw new Error(`Could not load offers (${res.status})`);
}

/**
 * Puts the offers from the last launch into the cache (marked stale, so they refresh straight away): Home shows its
 * offer sections at once instead of after the network. Ones past their expiry date are dropped.
 */
export async function hydrateOffers(queryClient: { getQueryData: (k: readonly unknown[]) => unknown; setQueryData: (k: readonly unknown[], d: unknown, o?: { updatedAt: number }) => unknown }) {
  try {
    const saved = await AsyncStorage.getItem(OFFERS_CACHE_KEY);
    if (!saved || queryClient.getQueryData(offersQueryOptions.queryKey)) return;
    const list = (JSON.parse(saved) as any[]).filter((o) => o && (!o.expiryDate || isOfferLive(o)));
    queryClient.setQueryData(offersQueryOptions.queryKey, list, { updatedAt: 0 });
  } catch {}
}
