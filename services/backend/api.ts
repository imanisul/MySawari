export type PendingReview = {
  bookingId: string;
  carId: string;
  vehicleName: string;
  vehicleImage: string | null;
  fromDate: string;
  toDate: string;
};

export type BookingSnapshot = {
  id: string;
  status: string;
  vehicleId: string;
  vehicleName: string;
  pickupDate: string;
  returnDate: string;
  rentalDays: number;
  dailyRate: number;
  rentalAmount: number;
  distanceKm: number;
  ratePerKm: number;
  pickupLocationName: string;
  dropoffLocationName: string;
  couponDiscount: number;
  sawariCashUsed: number;
  bookingAdvance: number;
  onlinePayableNow: number;
  remainingRentalAmount: number;
  customerName?: string;
  customerMobile?: string;
  customerEmail?: string;
  createdAt: string;
  // Cancellation fields
  cancellationReason?: string;
  cancellationFee?: number;
  refundAmount?: number;
  refundStatus?: string;
  cancelledAt?: string;
  // Extension fields
  driverMode?: string;
  extensions?: any[];
  totalRentalAmount?: number;
  driverCharge?: number;
  // Missing properties from UI
  pickupCharge?: number;
  dropCharge?: number;
  dropDistanceKm?: number;
  dropLocationName?: string;
  pickupType?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  couponCode?: string;
  pickupDistanceKm?: number;
  estimatedFuelCost?: number;
  estimatedKm?: number;
  vehicleMileageUsed?: number;
  fuelPriceUsed?: number;
  // Filled in for bookings created in the operations app
  pickupTime?: string;
  dropTime?: string;
  fastagAmount?: number;
  securityDeposit?: number;
  totalCollected?: number;
};

/**
 * The operations app and the customer app share one bookings collection but use more statuses than the
 * customer app creates. Every status must land in one of the app's tabs, otherwise the booking vanishes.
 */
function normalizeBookingStatus(raw: any): string {
  const key = String(raw ?? '').trim().toLowerCase().replace(/[\s-]+/g, '_');
  // Only a real handover status means the customer has the vehicle.
  if (['vehicle_handover', 'handover', 'handed_over', 'ongoing'].includes(key)) return 'ONGOING';
  if (['completed', 'complete', 'vehicle_returned', 'returned', 'vehicle_return', 'closed', 'settled'].includes(key)) return 'COMPLETED';
  if (['cancelled', 'canceled', 'no_show', 'rejected'].includes(key)) return 'CANCELLED';
  if (key === 'failed') return 'FAILED';
  if (key === 'pending') return 'PENDING';
  if (key === 'confirmed' || key === 'booked' || key === 'reserved' || key === 'upcoming') return 'CONFIRMED';

  // A status we don't know is shown under Upcoming rather than hidden. It is never treated as Active: only a
  // real handover moves a booking there, not the calendar.
  return 'CONFIRMED';
}

const asAmount = (v: any): number => {
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** A readable place name from the operations app's `pickup` / `drop` object (or a plain string). */
function placeLabel(place: any): string | undefined {
  if (!place) return undefined;
  if (typeof place === 'string') return place.trim() || undefined;
  if (typeof place !== 'object') return undefined;
  for (const key of ['name', 'locationName', 'address', 'formattedAddress', 'location', 'place', 'area', 'landmark']) {
    const v = place[key];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

import { calculateBookingPrice, QuoteParams, PricingQuote, COUPONS, Coupon, setCouponCatalog } from './pricingEngine';
import { Car, parseDayLabel, MIN_PUBLIC_REVIEW_RATING } from '../../utils/sawari';
import AsyncStorage from '@react-native-async-storage/async-storage';

// The backend is a separate project, deployed on Render. EXPO_PUBLIC_API_BASE_URL overrides it
// (e.g. http://<your-computer's-LAN-IP>:5001 to test against a local backend on a real phone).
const DEFAULT_API_BASE_URL = 'http://192.168.29.131:5001';
const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || DEFAULT_API_BASE_URL).replace(/\/+$/, '');
export const BACKEND_URL = `${BASE_URL}/api`;


/**
 * A random id for this app install (not personal data, not a secret). Sent as X-Install-Id so the server
 * can tell when two accounts are used from the same phone — used only for referral-fraud checks.
 */
let installIdPromise: Promise<string> | null = null;
export function getInstallId(): Promise<string> {
  if (!installIdPromise) {
    installIdPromise = (async () => {
      const { getItemAsync, setItemAsync } = require('../../utils/secureStore');
      try {
        const existing = await getItemAsync('install_id');
        if (existing && /^[A-Za-z0-9-]{16,64}$/.test(existing)) return existing;
      } catch {}
      const rand = () => Math.floor(Math.random() * 0x100000000).toString(16).padStart(8, '0');
      const id = `${Date.now().toString(16)}-${rand()}${rand()}${rand()}`;
      try { await setItemAsync('install_id', id); } catch {}
      return id;
    })();
  }
  return installIdPromise;
}

async function withInstallId(headers: Record<string, string> = {}): Promise<Record<string, string>> {
  try {
    return { ...headers, 'X-Install-Id': await getInstallId() };
  } catch {
    return headers;
  }
}

/**
 * fetch() with a time limit. Without one, a stalled server or a dead mobile connection left requests
 * (and their loading spinners) hanging forever. A caller's own AbortSignal still works as before.
 */
export async function timedFetch(url: string, options: RequestInit = {}, timeoutMs: number = 20000): Promise<Response> {
  const controller = new AbortController();
  const outer = options.signal;
  const onOuterAbort = () => controller.abort();
  if (outer) {
    if (outer.aborted) controller.abort();
    else outer.addEventListener('abort', onOuterAbort);
  }
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; controller.abort(); }, timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error: any) {
    if (timedOut) {
      throw new Error('The server is taking too long to respond. Please check your connection and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
    if (outer) outer.removeEventListener('abort', onOuterAbort);
  }
}

const PLATE_PROXY_PATH = '/images/blur?target=';
// Bumped when plate processing changes: a new URL means the phone never reuses an image it cached
// under the old one (including an unprocessed original from before the backend stopped falling back to it).
const PLATE_PROXY_VERSION = 'pv=5';

/**
 * Every vehicle photo shown in the app must come through the backend's number-plate processing.
 * Wraps a raw photo URL in that endpoint (or tags an already-wrapped one with the current version),
 * so no card, gallery or full-screen viewer can ever load the original with a readable plate.
 */
export function plateSafeImageUrl(url: string): string {
  if (!url) return '';
  const absolute = url.startsWith('http') ? url : `${BASE_URL}${url}`;
  if (absolute.includes(PLATE_PROXY_PATH)) {
    return absolute.includes(PLATE_PROXY_VERSION) ? absolute : `${absolute}&${PLATE_PROXY_VERSION}`;
  }
  return `${BACKEND_URL}${PLATE_PROXY_PATH}${encodeURIComponent(absolute)}&${PLATE_PROXY_VERSION}`;
}

// The render backend does not currently expose /locations routes, so
// location search/reverse-geocode call Photon's public API directly.
const PHOTON_BASE_URL = 'https://photon.komoot.io';
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';

function formatPhotonAddress(properties: any): string {
  const parts: string[] = [];
  if (properties.name) parts.push(properties.name);
  if (properties.street) parts.push(properties.street);
  if (properties.district && properties.district !== properties.name) parts.push(properties.district);
  if (properties.city) parts.push(properties.city);
  if (properties.state) parts.push(properties.state);

  if (parts.length === 0) {
    if (properties.country) parts.push(properties.country);
    else return 'Unknown Location';
  }

  return parts.join(', ');
}

/**
 * Area-level description of a spot (locality / district / city) that never
 * names a business. The nearest feature to a GPS fix is often a shop or petrol
 * pump, which is meaningless as "your location".
 */
function photonAreaLocation(properties: any) {
  const area = properties.district || properties.locality || properties.suburb || properties.city || properties.county || properties.state;
  const parts = [properties.street, properties.district, properties.city, properties.state].filter(Boolean);
  return {
    name: area || 'My Current Location',
    address: parts.length > 0 ? Array.from(new Set(parts)).join(', ') : (area || 'Current Location'),
  };
}

function mapPhotonResponse(data: any) {
  if (!data || !data.features) return [];
  return data.features.map((feature: any) => ({
    id: feature.properties.osm_id?.toString() || `osm_${Math.random()}`,
    name: feature.properties.name || feature.properties.street || feature.properties.city || 'Unknown Place',
    address: formatPhotonAddress(feature.properties),
    longitude: feature.geometry.coordinates[0],
    latitude: feature.geometry.coordinates[1],
    postcode: feature.properties.postcode || null,
    country: feature.properties.country || null,
  }));
}

// Where MySawari operates (delivery / collection addresses are searched inside this box): [minLon, minLat, maxLon, maxLat].
const SERVICE_AREA_BBOX = [88.0, 21.5, 97.5, 29.5];
const SERVICE_CENTER = { latitude: 26.1445, longitude: 91.7362 };

const searchCache = new Map<string, { at: number; results: any[] }>();
const SEARCH_TTL_MS = 5 * 60 * 1000;
const reverseCache = new Map<string, { at: number; result: any }>();
const REVERSE_TTL_MS = 10 * 60 * 1000;

/** Drops places without usable coordinates (they can't be priced or delivered to) and exact duplicates. */
function dedupeLocations(list: any[]) {
  const seen = new Set<string>();
  return list.filter((p) => {
    if (!Number.isFinite(p.latitude) || !Number.isFinite(p.longitude)) return false;
    const key = `${p.name}|${p.address}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// Server coupon list (what bookings are validated against), refreshed every few minutes.
let couponCache: { at: number; list: Coupon[] } | null = null;
const COUPON_TTL_MS = 5 * 60 * 1000;

// Wallet balance cache (cleared whenever the balance can change: booking, cancel, reward).
let walletCache: { at: number; data: any } | null = null;
const WALLET_TTL_MS = 20 * 1000;
export function invalidateWalletCache() {
  walletCache = null;
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

const subscribeTokenRefresh = (cb: (token: string) => void) => {
  refreshSubscribers.push(cb);
};

const onRefreshed = (token: string) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

/**
 * The backend answers a missing or invalid login with a 500 "Authentication required" instead of a 401.
 * Turn that into a real 401 so guests get the logged-out view and expired sessions go through the
 * refresh below, instead of every screen showing a server error.
 */
async function normalizeAuthError(response: Response): Promise<Response> {
  if (response.status !== 500) return response;
  try {
    const body = await response.clone().json();
    if (body?.message === 'Authentication required' || body?.message === 'Invalid or expired token') {
      return new Response(JSON.stringify({ success: false, message: body.message }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  } catch {}
  return response;
}

export async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { getItemAsync, setItemAsync, deleteItemAsync } = require('../../utils/secureStore');
  let token = await getItemAsync('auth_token');

  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  try { headers.set('X-Install-Id', await getInstallId()); } catch {}
  
  let response;
  try {
    response = await timedFetch(url, { ...options, headers });
  } catch (error: any) {
    if (error.name === 'TypeError' && error.message === 'Network request failed') {
      throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }
    throw error;
  }
  response = await normalizeAuthError(response);

  if (response.status === 401) {
    if (!token) {
      return response;
    }

    if (!isRefreshing) {
      isRefreshing = true;
      // Only a definite "no" from the server ends the session. A network drop, timeout, rate limit or
      // server error used to wipe the tokens and log the customer out; now it just fails this request.
      let sessionRejected = false;
      try {
        const refreshToken = await getItemAsync('refresh_token');
        if (!refreshToken) {
          sessionRejected = true;
          throw new Error('No refresh token');
        }

        const refreshRes = await timedFetch(`${BACKEND_URL}/auth/refresh`, {
          method: 'POST',
          headers: await withInstallId({ 'Content-Type': 'application/json' }),
          body: JSON.stringify({ refreshToken })
        });

        if (refreshRes.status === 401 || refreshRes.status === 403) {
          sessionRejected = true;
          throw new Error('Session expired');
        }
        if (!refreshRes.ok) throw new Error('Refresh temporarily unavailable');

        const data = await refreshRes.json();
        const newToken = data?.data?.token;
        const newRefreshToken = data?.data?.refreshToken;
        if (!newToken) throw new Error('Refresh temporarily unavailable');

        await setItemAsync('auth_token', newToken);
        if (newRefreshToken) await setItemAsync('refresh_token', newRefreshToken);
        
        token = newToken;
        onRefreshed(newToken);
      } catch (e) {
        onRefreshed(''); // release anyone waiting on this refresh
        if (!sessionRejected) {
          throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
        }
        // Force logout
        await deleteItemAsync('auth_token');
        await deleteItemAsync('refresh_token');
        
        // Emit global event for Context to log the user out of the UI
        const { DeviceEventEmitter } = require('react-native');
        DeviceEventEmitter.emit('onSessionExpired');
        
        throw new Error('Session expired. Please log in again.');
      } finally {
        isRefreshing = false;
      }
    } else {
      // Wait for the active refresh to complete
      token = await new Promise((resolve) => {
        subscribeTokenRefresh(resolve);
      });
      if (!token) throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
    }

    // Retry original request
    headers.set('Authorization', `Bearer ${token}`);
    try {
      response = await timedFetch(url, { ...options, headers });
    } catch (error: any) {
      if (error.name === 'TypeError' && error.message === 'Network request failed') {
        throw new Error('Unable to connect to the server. Please check your internet connection and try again.');
      }
      throw error;
    }
    response = await normalizeAuthError(response);
  }

  return response;
}

export const API = {
  /**
   * GET /api/pickup-locations
   */
  async getPickupLocations() {
    return [
      { id: 'office', name: 'MySawari Office', address: 'Guwahati, Assam', pickupCharge: 0, active: true },
      { id: 'airport-t2', name: 'Guwahati Airport Terminal 2', address: 'Guwahati Airport', pickupCharge: 790, active: true },
      { id: 'railway', name: 'Guwahati Railway Station', address: 'Paltan Bazaar', pickupCharge: 500, active: true }
    ];
  },

  /**
   * GET /api/vehicles
   * Returns vehicles with their dynamically calculated availability range
   */
  async getVehiclesWithAvailability(type?: string): Promise<Car[]> {
    return this.mapVehicles(await this.getVehiclesRaw());
  },

  /** The vehicles exactly as the backend sends them (this is what is saved on the device). */
  async getVehiclesRaw(): Promise<any[]> {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/vehicles`);
      
      if (response.status === 401) {
        return [];
      }
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to fetch vehicles');
      
      // Extra safeguard: explicitly filter out any vehicles marked as deleted
      return (data.data || []).filter((v: any) => v.isDeleted !== true);
    } catch (e: any) {
      console.error('getVehiclesWithAvailability error:', e);
      throw e;
    }
  },

  /** Backend vehicles -> the app's Car shape. */
  mapVehicles(dbVehicles: any[]): Car[] {
    const { getVehicleKnowledge } = require('../../utils/vehicleKnowledge');

    // One malformed record (missing name, id or price) must not blank the whole list: it is skipped.
    const valid = (Array.isArray(dbVehicles) ? dbVehicles : []).filter(
      (v: any) => v && v._id && typeof v.vehicleName === 'string' && v.vehicleName.trim() && Number.isFinite(Number(v.pricePerDay))
    );
    return valid.map((v: any) => {
      // Robust check for bikes: Seating capacity <= 2 guarantees it's a two-wheeler,
      // even if someone mistakenly saved it as 'SUV' or 'Luxury' in the DB.
      const isBike = v.seatingCapacity <= 2 || /^(bike|scooter|cruiser|sports|standard)$/i.test(v.vehicleType);
      const { getVehicleImage } = require('../../utils/vehicleImages');
      const fallbackImage = getVehicleImage(v.vehicleName, isBike);
      const hasImages = Array.isArray(v.images) && v.images.length > 0 && typeof v.images[0]?.url === 'string' && v.images[0].url;
      const getFullUrl = plateSafeImageUrl;

      // Enrich with curated real-world specs from the knowledge base
      const vehicleType: 'Car' | 'Bike' = isBike ? 'Bike' : 'Car';
      const knowledge = getVehicleKnowledge(v.vehicleName, vehicleType);

      // Registration year from DB date
      const regYear = v.registrationDate ? new Date(v.registrationDate).getFullYear().toString() : undefined;

      // Try to infer color from name if it's missing in DB
      let inferredColor = v.color;
      if (!inferredColor || inferredColor.trim() === '') {
        const lowerName = String(v.vehicleName || '').toLowerCase();
        const commonColors = ['white', 'black', 'silver', 'grey', 'gray', 'red', 'blue', 'brown', 'green', 'yellow'];
        for (const c of commonColors) {
          if (lowerName.includes(c)) {
            inferredColor = c.charAt(0).toUpperCase() + c.slice(1);
            break;
          }
        }
      }

      // Try to infer manufacturer if missing
      let inferredMfg = v.manufacturer;
      if (!inferredMfg || inferredMfg.trim() === '') {
        const lowerName = String(v.vehicleName || '').toLowerCase();
        if (lowerName.includes('alto') || lowerName.includes('ertiga') || lowerName.includes('fronx') || lowerName.includes('swift') || lowerName.includes('baleno') || lowerName.includes('wagon') || lowerName.includes('brezza')) inferredMfg = 'Maruti Suzuki';
        else if (lowerName.includes('venue') || lowerName.includes('creta') || lowerName.includes('i20') || lowerName.includes('verna')) inferredMfg = 'Hyundai';
        else if (lowerName.includes('punch') || lowerName.includes('nexon') || lowerName.includes('tiago') || lowerName.includes('safari')) inferredMfg = 'Tata';
        else if (lowerName.includes('xpulse') || lowerName.includes('splendor')) inferredMfg = 'Hero';
        else if (lowerName.includes('ntorq') || lowerName.includes('apache')) inferredMfg = 'TVS';
        else if (lowerName.includes('avenis') || lowerName.includes('access')) inferredMfg = 'Suzuki';
        else if (lowerName.includes('jawa')) inferredMfg = 'Jawa';
      }

      return {
        id: v._id,
        type: vehicleType,
        name: v.vehicleName,
        category: isBike ? 'Bike' : (/^car$/i.test(v.vehicleType) ? 'Sedan' : v.vehicleType),
        price: `₹${Number(v.pricePerDay)}`,
        perDay: Number(v.pricePerDay),
        image: hasImages ? { uri: getFullUrl(v.images[0].url) } : fallbackImage,
        images: hasImages
          ? v.images.filter((img: any) => typeof img?.url === 'string' && img.url).map((img: any) => ({ uri: getFullUrl(img.url) }))
          : [fallbackImage],
        seats: `${v.seatingCapacity || (isBike ? 2 : 4)} seats`,
        transmission: v.transmission || 'Manual',
        fuel: v.fuelType || 'Petrol',

        // DB fields with smart fallbacks
        manufacturer: inferredMfg || undefined,
        model: v.model || undefined,
        variant: v.variant || undefined,
        color: inferredColor || undefined,
        registrationYear: regYear,
        vehicleNumber: v.vehicleNumber || undefined,

        // Knowledge base enrichment
        description: knowledge.description,
        mileage: knowledge.mileage || 'N/A',
        engine: knowledge.engine,
        bootSpace: knowledge.bootSpace,
        groundClearance: knowledge.groundClearance,
        kerbWeight: knowledge.kerbWeight,
        doors: knowledge.doors,
        airbags: knowledge.airbags,
        tankCapacity: knowledge.tankCapacity,
        topSpeed: knowledge.topSpeed,
        acceleration: knowledge.acceleration,
        tyreSize: knowledge.tyreSize,
        brakes: knowledge.brakes,
        features: knowledge.features,
        highlights: knowledge.highlights,
        luggage: knowledge.luggage,

        // Availability is derived from these facts (see getAvailability in utils/sawari).
        dbStatus: v.status || 'available',
        bookedRanges: v.bookedRanges || [],
        maintenanceUntil: v.maintenanceUntil || null,
      };
    });
  },

  /**
   * GET /api/offers?type=coupon
   * Fetches active coupon offers from the backend, falling back to the local
   * COUPONS list if the API is unreachable.
   */
  async getCoupons(force: boolean = false): Promise<Coupon[]> {
    if (!force && couponCache && Date.now() - couponCache.at < COUPON_TTL_MS) return couponCache.list;
    try {
      const res = await timedFetch(`${BACKEND_URL}/offers?type=coupon`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          // The server's list is what a booking is checked against, so it is used even when it is empty —
          // falling back to the built-in list here would offer codes the server then rejects.
          const list: Coupon[] = json.data
            .filter((o: any) => typeof o?.code === 'string' && o.code.trim())
            .map((o: any) => ({
              code: o.code.trim().toUpperCase(),
              discountType: o.discountType,
              discountValue: Number(o.discountValue) || 0,
              minimumBooking: Number(o.minimumBooking) || 0,
              maximumDiscount: o.maximumDiscount ?? null,
              expiryDate: o.expiryDate,
              active: o.active !== false,
            }));
          couponCache = { at: Date.now(), list };
          setCouponCatalog(list);
          return list;
        }
      }
    } catch {
      // API unavailable — fall through
    }
    // Server unreachable: the built-in list keeps the checkout usable offline.
    return COUPONS.filter(c => c.active && new Date(c.expiryDate) >= new Date());
  },

  /**
   * GET /api/config/fuel-price
   */
  async getFuelPrice(type: 'petrol' | 'diesel' = 'petrol') {
    const fuelPrices: Record<string, any> = {
      petrol: { fuelType: 'petrol', pricePerLitre: 105.45, location: 'Guwahati', updatedAt: new Date().toISOString() },
      diesel: { fuelType: 'diesel', pricePerLitre: 95.20, location: 'Guwahati', updatedAt: new Date().toISOString() }
    };
    return fuelPrices[type];
  },

  /**
   * POST /api/bookings/quote
   */
  async quoteBooking(params: Omit<QuoteParams, 'availableSawariCash'>): Promise<PricingQuote> {
    // Fetch the user's SawariCash balance and membership securely
    let availableSawariCash = 0;
    let membership: QuoteParams['membership'] = null;
    try {
      const walletData = await this.getWallet();
      availableSawariCash = walletData?.walletBalance || 0;
      if (walletData?.membership) {
        membership = {
          plan: walletData.membership.plan,
          totalSaved: walletData.membership.totalSaved || 0,
          expiresAt: walletData.membership.expiresAt,
        };
      }
    } catch(e) {}

    // Price a coupon with the server's own list, so the discount shown is the one the booking gets.
    if (params.couponCode) {
      await this.getCoupons().catch(() => {});
    }
    
    const quote = await calculateBookingPrice({
      ...params,
      availableSawariCash,
      membership,
    });
    
    if (quote.error) {
      throw new Error(quote.error);
    }
    
    return quote;
  },

  /**
   * POST /api/payments/create-order
   */
  async createRazorpayOrder(params: any): Promise<{ orderId: string, amountPaise: number, keyId: string }> {
    try {
      const amountToPay = params.onlinePayableNow || params.rentalAmount || 0;
      if (amountToPay <= 0) {
        throw new Error('No Razorpay order required for zero amount');
      }

      const response = await fetchWithAuth(`${BACKEND_URL}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: amountToPay })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create Razorpay order');
      
      return { orderId: data.data.id, amountPaise: data.data.amount, keyId: data.data.keyId };
    } catch (e: any) {
      throw new Error(e.message);
    }
  },

  /**
   * POST /api/payments/verify-signature
   */
  async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean> {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/payments/verify-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          razorpay_order_id: orderId,
          razorpay_payment_id: paymentId,
          razorpay_signature: signature
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Payment verification failed');
      return true;
    } catch (e: any) {
      throw new Error(e.message);
    }
  },

  /**
   * POST /api/bookings
   */
  async getActiveHandover() {
    const response = await fetchWithAuth(`${BACKEND_URL}/bookings/active-handover`);
    return response.json();
  },

  async createBooking(
    params: Omit<QuoteParams, 'availableSawariCash'>, 
    vehicleId: string,
    vehicleName: string,
    customerDetails: { name: string; mobile: string; email?: string },
    paymentDetails: { razorpayOrderId?: string; razorpayPaymentId?: string },
    fuelEstimateDetails?: { estimatedKm: number, estimatedFuelCost: number, fuelPriceUsed: number, vehicleMileageUsed: number }
  ): Promise<BookingSnapshot> {
    // BACKEND VALIDATION: Recalculate quote to prevent frontend manipulation
    const serverQuote = await this.quoteBooking(params);
    const quote = serverQuote;
    
    // 1. (Sawari Cash is now managed securely by the backend)
    // 2. Create snapshot
    const snapshot: BookingSnapshot = {
      id: '', // replaced with the server's booking id once saved
      status: 'CONFIRMED',
      vehicleId,
      vehicleName,
      pickupDate: params.pickupDateStr,
      returnDate: params.returnDateStr,
      rentalDays: quote.rentalDays,
      dailyRate: quote.dailyRate,
      rentalAmount: quote.rentalAmount,
      
      distanceKm: quote.distanceKm,
      ratePerKm: quote.ratePerKm,
      pickupLocationName: quote.pickupLocationName,
      dropoffLocationName: quote.dropoffLocationName,
      pickupCharge: quote.pickupCharge,
      pickupDistanceKm: quote.pickupDistanceKm,
      pickupType: quote.pickupType,
      dropCharge: quote.dropCharge,
      dropDistanceKm: quote.dropDistanceKm,
      dropLocationName: quote.dropLocationName,

      driverMode: quote.driverMode,
      driverCharge: quote.driverCharge,
      
      couponCode: quote.couponCode,
      couponDiscount: quote.couponDiscount,
      sawariCashUsed: quote.sawariCashUsed,
      
      bookingAdvance: quote.bookingAdvance,
      onlinePayableNow: quote.onlinePayableNow,
      remainingRentalAmount: quote.remainingRentalAmount,
      
      ...fuelEstimateDetails,
      
      customerName: customerDetails.name,
      customerMobile: customerDetails.mobile,
      customerEmail: customerDetails.email,
      
      razorpayOrderId: paymentDetails.razorpayOrderId,
      razorpayPaymentId: paymentDetails.razorpayPaymentId,
      paidAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    
    // 3. Save to backend DB. The server re-validates price, availability and the
    // Razorpay payment, so a failure here must surface — the user has already paid.
    const toExactLocalTime = (label: string, timeStr: string) => {
      const day = parseDayLabel(label);
      if (day === null) throw new Error('Invalid booking date');
      
      const match = (timeStr || '10:00 AM').match(/(\d+):(\d+)\s*(AM|PM)?/i);
      if (!match) return new Date(day * 86400000).toISOString();
      
      let hours = parseInt(match[1], 10);
      const minutes = parseInt(match[2], 10);
      const ampm = match[3]?.toUpperCase();
      
      if (ampm === 'PM' && hours < 12) hours += 12;
      if (ampm === 'AM' && hours === 12) hours = 0;
      
      const utcMidnight = new Date(day * 86400000);
      return new Date(
        utcMidnight.getUTCFullYear(),
        utcMidnight.getUTCMonth(),
        utcMidnight.getUTCDate(),
        hours, minutes, 0
      ).toISOString();
    };

    const response = await fetchWithAuth(`${BACKEND_URL}/bookings/hold`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: vehicleId,
        vehicleName: vehicleName,
        fromDate: toExactLocalTime(params.pickupDateStr, params.pickupTime || '10:00 AM'),
        toDate: toExactLocalTime(params.returnDateStr, params.returnTime || '10:00 AM'),
        pickupTime: params.pickupTime || '10:00 AM',
        dropTime: params.returnTime || '10:00 AM',
        totalDays: quote.rentalDays,
        destination: params.dropoffLocation?.name || '',
        pickup: {
          location: params.pickupLocation?.name || '',
          landmark: '',
          mapLink: '',
          charge: quote.pickupCharge || 0
        },
        drop: {
          location: params.returnLocation?.name || '',
          landmark: '',
          mapLink: '',
          charge: quote.dropCharge || 0
        },
        payment: {
          vehicleRent: quote.discountedRentalAmount || quote.rentalAmount,
          pickupCharge: quote.pickupCharge || 0,
          dropCharge: quote.dropCharge || 0,
          fastagAmount: 0,
          securityDeposit: 0,
          totalAmount: quote.rentalAmount,
          discountAmount: quote.couponDiscount,
          bookingAmountPaid: quote.onlinePayableNow,
          paymentMethod: quote.onlinePayableNow > 0 ? 'online' : 'wallet',
          balanceAmount: quote.remainingRentalAmount,
          paymentStatus: quote.onlinePayableNow > 0 ? 'paid' : 'pending'
        },
        paymentBreakdown: {
          cash: 0,
          phonePe: 0,
          razorpay: quote.onlinePayableNow > 0 ? quote.onlinePayableNow : 0,
          balanceAmount: quote.remainingRentalAmount,
          totalCollected: quote.onlinePayableNow,
          paymentStatus: 'partial'
        },
        sawariCashUsed: quote.sawariCashUsed,
        subscriptionDiscount: quote.subscriptionDiscount,
        // The server re-validates the code and recomputes the discount; without it the booking was
        // priced at ₹0 off on the server and rejected as a mismatch.
        couponCode: quote.couponDiscount > 0 ? quote.couponCode : undefined,
      })
    });
    const saved = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(saved.message || 'Failed to secure vehicle reservation');
    }
    snapshot.id = saved.data?._id || snapshot.id;
    invalidateWalletCache(); // SawariCash intent

    return snapshot;
  },

  /** Keeps the checkout soft-lock alive while the payment sheet is open (best effort). */
  async keepHoldAlive(bookingId: string): Promise<void> {
    try {
      await fetchWithAuth(`${BACKEND_URL}/bookings/${encodeURIComponent(bookingId)}/hold/keep-alive`, { method: 'POST' });
    } catch {
      // A missed renewal only shortens the lock; the payment itself is still honoured if the car is free.
    }
  },

  /** Frees the car for other customers as soon as this checkout is abandoned (best effort). */
  async releaseHold(bookingId: string): Promise<void> {
    try {
      await fetchWithAuth(`${BACKEND_URL}/bookings/${encodeURIComponent(bookingId)}/hold/release`, { method: 'POST' });
    } catch {
      // The lock also frees itself after 2 minutes.
    }
  },

  async confirmBookingPayment(bookingId: string, razorpayOrderId?: string, razorpayPaymentId?: string): Promise<void> {
    const response = await fetchWithAuth(`${BACKEND_URL}/bookings/${bookingId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ razorpayOrderId, razorpayPaymentId })
    });
    const saved = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(saved.message || 'Failed to confirm booking payment');
    }
  },
  
  async trackLead(data: {
    mobileNumber?: string;
    customerName?: string;
    vehicleId?: string;
    vehicleName?: string;
    fromDate?: string;
    toDate?: string;
    totalAmount?: number;
    lastPageVisited: string;
  }) {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/leads/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      return await response.json();
    } catch (e) {
      console.warn('Failed to track lead:', e);
      return null; // Fire and forget, don't break the UI
    }
  },
  
  async getBooking(id: string): Promise<BookingSnapshot | null> {
    const bookings = await this.getAllBookings();
    return bookings.find(b => b.id === id) || null;
  },

  // ─── Ride Journey Tracking ───

  async getRideJourney(): Promise<{
    totalRides: number;
    completedRides: number;
    confirmedRides: number;
    cancelledRides: number;
    totalSpent: number;
    tier: string;
    milestones: Array<{ rides: number; label: string; rewardAmount: number; type: string; unlocked: boolean; claimed: boolean }>;
    nextMilestone: { label: string; ridesNeeded: number; rewardAmount: number } | null;
    earnedRewards: Array<{ type: string; label: string; amount: number; earnedAt: string }>;
    recentRides: Array<{ id: string; vehicleName: string; status: string; fromDate: string; toDate: string; totalDays: number; amount: number; createdAt: string }>;
  } | null> {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/bookings/ride-journey`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch ride journey');
      return data.data;
    } catch (e: any) {
      console.error('getRideJourney error:', e.message);
      return null;
    }
  },

  async claimMilestoneReward(milestoneLabel: string): Promise<{ message: string; reward: { type: string; label: string; amount: number } } | null> {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/bookings/claim-milestone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ milestoneLabel }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to claim milestone');
      invalidateWalletCache();
      return data.data;
    } catch (e: any) {
      console.error('claimMilestoneReward error:', e.message);
      throw e;
    }
  },

  /**
   * GET /api/customers/wallet
   */
  async getWallet(force: boolean = false) {
    const empty = { walletBalance: 0, transactions: [] };
    // Price quotes read the wallet on every change; a short cache keeps them instant.
    if (!force && walletCache && Date.now() - walletCache.at < WALLET_TTL_MS) return walletCache.data;
    try {
      // Guests have no wallet — don't hit a protected endpoint without a session.
      const { getItemAsync } = require('../../utils/secureStore');
      if (!(await getItemAsync('auth_token'))) return empty;

      const response = await fetchWithAuth(`${BACKEND_URL}/customers/wallet`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch wallet');
      walletCache = { at: Date.now(), data: data.data };
      return data.data;
    } catch (e: any) {
      // An expired session is already handled (logout) by fetchWithAuth — not an error here.
      if (!/session expired|not authorized/i.test(e.message)) {
        console.error('getWallet error:', e.message);
      }
      return empty;
    }
  },

  async requestWithdrawal(amount: number, method: 'upi' | 'bank', details: any) {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/customers/wallet/withdraw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, method, details }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to request withdrawal');
      invalidateWalletCache();
      return data.data;
    } catch (e: any) {
      console.error('requestWithdrawal error:', e.message);
      throw e;
    }
  },

  async activateMembership(plan: 'starter' | 'plus' | 'pro', paymentDetails: { razorpayOrderId: string; razorpayPaymentId: string }) {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/customers/wallet/membership`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan, ...paymentDetails }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to activate membership');
      invalidateWalletCache();
      return data.data;
    } catch (e: any) {
      console.error('activateMembership error:', e.message);
      throw e;
    }
  },

  async getAllBookings(): Promise<BookingSnapshot[]> {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/bookings/my-bookings`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to fetch bookings');

      // Booking dates are calendar days stored at UTC midnight — format them in UTC so the day never shifts.
      const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
      
      // Map backend booking model to frontend BookingSnapshot
      return (data.data || []).map((b: any) => {
        const p = b.payment || {};
        const days = b.totalDays || 1;
        const totalAmount = asAmount(p.totalAmount);
        // Operations-app bookings itemise the price; the total there also includes fastag and any pickup/drop
        // charge, so "rental" must be the vehicle rent alone. Customer-app bookings only carry the total.
        const vehicleRent = asAmount(p.vehicleRent);
        const rentalAmount = vehicleRent || totalAmount;
        const bookingPaid = asAmount(p.bookingAmountPaid);
        const collected = asAmount(p.totalCollected);
        const pickupName = placeLabel(b.pickup) || b.pickupLocationName;
        const dropName = placeLabel(b.drop) || b.dropoffLocationName;
        const hasBalance = p.balanceAmount !== undefined && p.balanceAmount !== null;
        return {
          id: b._id,
          status: normalizeBookingStatus(b.status),
          vehicleId: b.vehicleId?._id || b.vehicleId,
          vehicleName: b.vehicleId?.vehicleName || b.vehicleName || 'Vehicle',
          pickupDate: fmt(b.fromDate),
          returnDate: fmt(b.toDate),
          pickupTime: b.pickupTime || undefined,
          dropTime: b.dropTime || undefined,
          rentalDays: days,
          dailyRate: b.vehicleId?.pricePerDay || Math.round(rentalAmount / days) || 0,
          rentalAmount,
          distanceKm: 0,
          ratePerKm: 0,
          pickupLocationName: pickupName || 'MySawari Office',
          dropoffLocationName: dropName || 'MySawari Office',
          dropLocationName: dropName,
          pickupCharge: asAmount(p.pickupCharge) || undefined,
          dropCharge: asAmount(p.dropCharge) || undefined,
          fastagAmount: asAmount(p.fastagAmount) || undefined,
          securityDeposit: asAmount(p.securityDeposit) || undefined,
          couponDiscount: asAmount(p.discountAmount),
          sawariCashUsed: 0,
          bookingAdvance: bookingPaid,
          onlinePayableNow: bookingPaid,
          totalCollected: collected || undefined,
          // Balance as recorded; if it is missing, work it out from what has been collected.
          remainingRentalAmount: hasBalance
            ? asAmount(p.balanceAmount)
            : Math.max(0, totalAmount - Math.max(collected, bookingPaid)),
          customerName: b.customerName,
          customerMobile: b.mobileNumber,
          createdAt: b.createdAt,
          cancellationReason: b.cancellationReason,
          cancellationFee: b.cancellationFee,
          refundAmount: b.refundAmount,
          refundStatus: b.refundStatus,
          cancelledAt: b.cancelledAt,
        } as BookingSnapshot;
      });
    } catch (e: any) {
      console.error('getAllBookings error:', e);
      return [];
    }
  },

  async cancelBooking(id: string, reason?: string): Promise<{ success: boolean; snapshot: BookingSnapshot }> {
    const response = await fetchWithAuth(`${BACKEND_URL}/bookings/${id}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cancellationReason: reason || 'Customer cancelled' }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to cancel booking');
    invalidateWalletCache(); // cancelled bookings can refund SawariCash

    const existing = await this.getBooking(id);
    const snapshot: BookingSnapshot = {
      ...(existing as BookingSnapshot),
      status: 'CANCELLED',
      cancellationReason: data.data.cancellationReason,
      cancellationFee: data.data.cancellationFee,
      refundAmount: data.data.refundAmount,
      refundStatus: data.data.refundStatus,
      cancelledAt: data.data.cancelledAt,
    };
    return { success: true, snapshot };
  },

  async checkExtensionAvailability(bookingId: string, additionalDays: number, withDriver?: boolean): Promise<{ available: boolean; message?: string; additionalDays: number; additionalAmount: number }> {
    const qs = `days=${additionalDays}${withDriver ? '&withDriver=true' : ''}`;
    const response = await fetchWithAuth(`${BACKEND_URL}/bookings/${bookingId}/extension-check?${qs}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not check availability');
    return data.data;
  },

  async extendBooking(
    bookingId: string,
    additionalDays: number,
    withDriver: boolean | undefined,
    paymentDetails: { razorpayOrderId: string; razorpayPaymentId: string }
  ): Promise<{ success: boolean; snapshot: BookingSnapshot }> {
    const response = await fetchWithAuth(`${BACKEND_URL}/bookings/${bookingId}/extend`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ additionalDays, withDriver: !!withDriver, ...paymentDetails }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Failed to extend booking');

    const snapshot = await this.getBooking(bookingId);
    if (!snapshot) throw new Error('Booking not found');
    return { success: true, snapshot };
  },

  /**
   * GET /api/config
   */
  async getAppConfig() {
    return {
      referralRewardAmount: 10,
      referralRewardType: 'PERCENTAGE',
      referralDiscountAmount: 100,
      referralDiscountType: 'FLAT'
    };
  },



  /**
   * POST /api/auth/logout — ends the session on the server as well (best effort, never blocks sign-out).
   */
  async logoutServer(refreshToken: string | null) {
    if (!refreshToken) return;
    try {
      await timedFetch(`${BACKEND_URL}/auth/logout`, {
        method: 'POST',
        headers: await withInstallId({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ refreshToken }),
      }, 8000);
    } catch {
      // Offline: the token still expires on its own; signing out locally must not fail because of this.
    }
  },

  /**
   * POST /api/auth/send-otp
   */
  async sendOtp(mobile: string) {
    try {
      const res = await timedFetch(`${BACKEND_URL}/auth/send-otp`, {
        method: 'POST',
        headers: await withInstallId({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ mobileNumber: mobile })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
      return { success: true, message: data.message, isExistingUser: data.data?.isExistingUser };
    } catch (e: any) {
      throw new Error(e.message);
    }
  },

  /**
   * POST /api/auth/verify-otp
   */
  async verifyOtp(mobile: string, otp: string, name?: string, referredByCode?: string) {
    try {
      const res = await timedFetch(`${BACKEND_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: await withInstallId({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ mobileNumber: mobile, otp, customerName: name, referredByCode })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to verify OTP');
      
      const { token, refreshToken, customer } = data.data;
      
      const user = {
        id: customer._id,
        name: customer.customerName,
        mobile: customer.mobileNumber,
        email: customer.email,
        dob: customer.dob,
        gender: customer.gender,
        license: customer.documents?.dlNumber || '',
        referralCode: customer.referralCode,
        createdAt: customer.createdAt
      };
      
      return { user, token, refreshToken };
    } catch (e: any) {
      throw new Error(e.message);
    }
  },

  /**
   * GET /api/users/profile
   */
  async getUserProfile(userId: string) {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/customers/profile`);
      if (res.ok) {
        const data = await res.json();
        const customer = data.data?.customer;
        return customer ? { ...customer, name: customer.customerName } : null;
      }
    } catch(e) {
      console.log('Error fetching profile from backend:', e);
    }
    return null;
  },

  /**
   * PUT /api/customers/profile
   */
  async updateProfile(profileData: { customerName?: string, email?: string, dob?: string, gender?: string, aadhaarNumber?: string, drivingLicenseNumber?: string }) {
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/customers/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update profile');
      
      const customer = data.data.customer;
      return {
        id: customer._id,
        name: customer.customerName,
        mobile: customer.mobileNumber,
        email: customer.email,
        dob: customer.dob,
        gender: customer.gender,
        license: customer.documents?.dlNumber || '',
        referralCode: customer.referralCode,
        createdAt: customer.createdAt
      };
    } catch (e: any) {
      throw new Error(e.message);
    }
  },

  /**
   * GET /api/auth/my-referrals
   */
  async getReferrals(userId: string) {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/auth/my-referrals`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to fetch referrals');
      return data.data || [];
    } catch (e: any) {
      console.error('getReferrals error:', e);
      return [];
    }
  },

  /**
   * POST /api/auth/refer — the customer adds the phone number of someone they want to refer.
   * Throws with the server's message (already referred, already a customer, invalid number...).
   */
  async addReferral(mobileNumber: string, name?: string) {
    const response = await fetchWithAuth(`${BACKEND_URL}/auth/refer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobileNumber, name: name?.trim() || '' }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Could not add this referral');
    return data.data;
  },

  /**
   * Photon Autocomplete (called directly; render backend has no /locations route)
   */
  async searchLocations(
    input: string,
    regionId: string = 'guwahati',
    isDestination: boolean = false,
    signal?: AbortSignal,
    options: { restrictToServiceArea?: boolean } = {}
  ) {
    const query = input?.trim();
    if (!query || query.length < 2) return [];

    // Same search twice (typing, deleting, retyping) shouldn't hit the network again.
    const cacheKey = `${options.restrictToServiceArea ? 'svc' : 'any'}|${query.toLowerCase()}`;
    const hit = searchCache.get(cacheKey);
    if (hit && Date.now() - hit.at < SEARCH_TTL_MS) return hit.results;
    const remember = (results: any[]) => {
      searchCache.set(cacheKey, { at: Date.now(), results });
      if (searchCache.size > 60) searchCache.delete(searchCache.keys().next().value as string);
      return results;
    };

    try {
      // Primary: Photon, biased to Guwahati — and, for delivery/collection addresses, limited to where we operate.
      const url = new URL(`${PHOTON_BASE_URL}/api/`);
      url.searchParams.set('q', query);
      url.searchParams.set('limit', '10');
      url.searchParams.set('lat', String(SERVICE_CENTER.latitude));
      url.searchParams.set('lon', String(SERVICE_CENTER.longitude));
      if (options.restrictToServiceArea) url.searchParams.set('bbox', SERVICE_AREA_BBOX.join(','));

      const response = await timedFetch(url.toString(), {
        headers: { 'Accept-Language': 'en' },
        signal,
      });
      if (!response.ok) throw new Error(`Photon API responded with status ${response.status}`);
      const data = await response.json();
      return remember(dedupeLocations(mapPhotonResponse(data)));
    } catch (e: any) {
      if (e.name === 'AbortError' || e.message === 'Aborted' || (signal && signal.aborted)) {
        throw e;
      }
      
      console.warn(`Photon search failed: ${e.message}. Falling back to Nominatim...`);
      
      try {
        // Fallback: Nominatim API
        const url = new URL(`${NOMINATIM_BASE_URL}/search`);
        url.searchParams.set('q', query);
        url.searchParams.set('format', 'json');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('limit', '10');
        url.searchParams.set('countrycodes', 'in');
        if (options.restrictToServiceArea) {
          // viewbox is left,top,right,bottom
          url.searchParams.set('viewbox', [SERVICE_AREA_BBOX[0], SERVICE_AREA_BBOX[3], SERVICE_AREA_BBOX[2], SERVICE_AREA_BBOX[1]].join(','));
          url.searchParams.set('bounded', '1');
        }

        const response = await timedFetch(url.toString(), {
          headers: { 'User-Agent': 'MySawariApp/1.0' },
          signal,
        });
        
        if (!response.ok) throw new Error(`Nominatim API responded with status ${response.status}`);
        const data = await response.json();
        
        const mapped = data.map((item: any) => {
          let name = item.name;
          if (!name && item.address) {
            name = item.address.road || item.address.suburb || item.address.city;
          }
          
          return {
            id: item.osm_id?.toString() || `osm_${Math.random()}`,
            name: name || 'Unknown Place',
            address: item.display_name,
            longitude: parseFloat(item.lon),
            latitude: parseFloat(item.lat),
            postcode: item.address?.postcode || null,
            country: item.address?.country || null,
          };
        });
        return remember(dedupeLocations(mapped));
      } catch (fallbackError: any) {
        if (fallbackError.name === 'AbortError' || (signal && signal.aborted)) throw fallbackError;
        console.error('All location search APIs failed:', fallbackError.message);
        return [];
      }
    }
  },

  /**
   * Photon Reverse Geocode (called directly; render backend has no /locations route)
   */
  async reverseGeocode(latitude: number, longitude: number, options: { areaOnly?: boolean } = {}) {
    const cacheKey = `${latitude.toFixed(3)},${longitude.toFixed(3)},${options.areaOnly ? 'a' : 'p'}`;
    const cached = reverseCache.get(cacheKey);
    if (cached && Date.now() - cached.at < REVERSE_TTL_MS) return cached.result;
    const result = await this.reverseGeocodeUncached(latitude, longitude, options);
    if (result) reverseCache.set(cacheKey, { at: Date.now(), result });
    return result;
  },

  async reverseGeocodeUncached(latitude: number, longitude: number, options: { areaOnly?: boolean } = {}) {
    try {
      // Primary: Try Photon API
      const url = new URL(`${PHOTON_BASE_URL}/reverse`);
      url.searchParams.set('lat', latitude.toString());
      url.searchParams.set('lon', longitude.toString());

      const response = await timedFetch(url.toString(), {
        headers: { 'Accept-Language': 'en' },
      });
      if (!response.ok) throw new Error(`Photon API responded with status ${response.status}`);
      const data = await response.json();
 const mapped = mapPhotonResponse(data);
      if (mapped.length === 0) return null;
      // For an auto-detected position, describe the area — not the nearest business.
      if (options.areaOnly) return { ...mapped[0], ...photonAreaLocation(data.features[0].properties) };
      return mapped[0];
    } catch (e: any) {
      console.warn(`Photon reverse geocode failed: ${e.message}. Falling back to Nominatim...`);
      
      try {
        // Fallback: Nominatim API
        const url = new URL(`${NOMINATIM_BASE_URL}/reverse`);
        url.searchParams.set('lat', latitude.toString());
        url.searchParams.set('lon', longitude.toString());
        url.searchParams.set('format', 'json');
        
        const response = await timedFetch(url.toString(), {
          headers: { 'User-Agent': 'MySawariApp/1.0' },
        });
        
        if (!response.ok) throw new Error(`Nominatim API responded with status ${response.status}`);
        const data = await response.json();
        
        if (data.error) return null;
        
        let name = data.name;
        let address = data.display_name;
        if (options.areaOnly && data.address) {
          const a = data.address;
          name = a.suburb || a.neighbourhood || a.city_district || a.village || a.town || a.city || a.state_district || a.state;
          address = [a.road, a.suburb || a.neighbourhood, a.city || a.town || a.village, a.state].filter(Boolean).join(', ') || data.display_name;
        } else if (!name && data.address) {
          name = data.address.road || data.address.suburb || data.address.city;
        }
        
        return {
          id: data.osm_id?.toString() || `osm_${Math.random()}`,
          name: name || 'Unknown Place',
          address,
          latitude: parseFloat(data.lat),
          longitude: parseFloat(data.lon),
          postcode: data.address?.postcode || null,
          country: data.address?.country || null,
        };
      } catch (fallbackError: any) {
        console.error('All reverse geocoding APIs failed:', fallbackError.message);
        return null;
      }
    }
  },

  /**
   * Reviews endpoints (GET /reviews/:carId, POST /reviews)
   *
   * Reviews are shared server-side. The backend marks a review "verified"
   * only when the customer has a real booking of that vehicle.
   */
  reviews: {
    async fetchByCarId(carId: string) {
      try {
        const response = await timedFetch(`${BACKEND_URL}/reviews/${encodeURIComponent(carId)}`);
        const data = await response.json();
        if (!response.ok) return [];
        // Only well-rated reviews (and their photos) are shown publicly.
        return (data.data || []).filter((r: any) => Number(r.rating) >= MIN_PUBLIC_REVIEW_RATING).map((r: any) => ({
          id: r.id,
          userName: r.userName,
          rating: r.rating,
          text: r.text,
          date: new Date(r.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          isVerified: r.isVerified,
          placeVisited: r.placeVisited || undefined,
          // Guest trip photos often show the car too — they go through plate processing like fleet photos.
          images: ((r.images || []) as string[]).map(plateSafeImageUrl),
        }));
      } catch (e) {
        return [];
      }
    },

    /** Ids of trips / vehicles this customer has already reviewed. */
    async mine(): Promise<{ bookingIds: string[]; legacyCarIds: string[] }> {
      let base: { bookingIds: string[]; legacyCarIds: string[] } = { bookingIds: [], legacyCarIds: [] };
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/reviews/mine`);
        const data = await response.json();
        if (response.ok) base = data.data;
      } catch (e) {}

      // Add local mock reviews to avoid hitting the backend database for testing
      try {
        const str = await AsyncStorage.getItem('@mock_reviews');
        if (str) {
          const arr = JSON.parse(str);
          base.bookingIds = [...base.bookingIds, ...arr];
        }
      } catch(e) {}
      
      return base;
    },

    /** Completed trips the customer hasn't reviewed yet. */
    async pending(): Promise<PendingReview[]> {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/reviews/pending`);
        const data = await response.json();
        if (!response.ok) return [];
        return data.data || [];
      } catch (e) {
        return [];
      }
    },

    /** Whether photo uploads are available right now (signed in and uploads configured). */
    async canAddPhotos(): Promise<{ allowed: boolean; message?: string }> {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/reviews/upload-signature`);
        if (response.ok) return { allowed: true };
        const data = await response.json().catch(() => ({}));
        return { allowed: false, message: data.message || 'Photos are not available right now' };
      } catch (e: any) {
        return { allowed: false, message: 'Could not check photo access. Please try again.' };
      }
    },

    /**
     * Uploads one photo straight to Cloudinary using a signature from our
     * backend (the Cloudinary secret never leaves the server).
     */
    async uploadImage(uri: string, mimeType?: string): Promise<{ url: string; publicId: string }> {
      const sigRes = await fetchWithAuth(`${BACKEND_URL}/reviews/upload-signature`);
      const sigData = await sigRes.json();
      if (!sigRes.ok) throw new Error(sigData.message || 'Could not start the upload');
      const { cloudName, apiKey, timestamp, folder, signature } = sigData.data;

      const type = mimeType || 'image/jpeg';
      const ext = type.split('/')[1] || 'jpg';
      const form = new FormData();
      form.append('file', { uri, type, name: `trip-${timestamp}.${ext}` } as any);
      form.append('api_key', String(apiKey));
      form.append('timestamp', String(timestamp));
      form.append('folder', folder);
      form.append('signature', signature);

      const upload = await timedFetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: form,
      }, 60000);
      const result = await upload.json();
      if (!upload.ok || !result.secure_url) {
        throw new Error(result?.error?.message || 'Photo upload failed');
      }
      return { url: result.secure_url, publicId: result.public_id };
    },

    async submit(
      carId: string,
      rating: number,
      text: string,
      extras: { bookingId?: string; placeVisited?: string; images?: { url: string; publicId: string }[] } = {}
    ): Promise<void> {
      // Mock submit locally to prevent backend database changes
      try {
        if (extras.bookingId) {
          const str = await AsyncStorage.getItem('@mock_reviews');
          const arr = str ? JSON.parse(str) : [];
          if (!arr.includes(extras.bookingId)) {
            arr.push(extras.bookingId);
            await AsyncStorage.setItem('@mock_reviews', JSON.stringify(arr));
          }
        }
      } catch(e) {}

      // Fire and forget to backend (ignore errors)
      try {
        await fetchWithAuth(`${BACKEND_URL}/reviews`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ carId, rating, text: text.trim(), ...extras }),
        });
      } catch(e) {}
    }
  }
};
