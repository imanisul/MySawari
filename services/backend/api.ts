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
};

import { calculateBookingPrice, QuoteParams, PricingQuote } from './pricingEngine';
import { Car, parseDayLabel, MIN_PUBLIC_REVIEW_RATING } from '../../utils/sawari';
import { Platform } from 'react-native';

// Local backend
// The backend is a separate project. Point the app at it with EXPO_PUBLIC_API_BASE_URL
// (e.g. https://api.example.com, or http://<your-computer's-LAN-IP>:5001 to test on a real phone).
// Without it we fall back to a backend running on the same computer: localhost on the
// iOS simulator, 10.0.2.2 on the Android emulator.
const LOCAL_DEV_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
const BASE_URL = (process.env.EXPO_PUBLIC_API_BASE_URL || LOCAL_DEV_URL).replace(/\/+$/, '');
if (!__DEV__ && !process.env.EXPO_PUBLIC_API_BASE_URL) {
  console.warn('EXPO_PUBLIC_API_BASE_URL is not set — this build is talking to a local development server.');
}
const BACKEND_URL = `${BASE_URL}/api`;

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

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const { getItemAsync, setItemAsync, deleteItemAsync } = require('expo-secure-store');
  let token = await getItemAsync('auth_token');

  const headers = new Headers(options.headers || {});
  if (token) headers.set('Authorization', `Bearer ${token}`);
  
  let response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    if (!token) {
      return response;
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshToken = await getItemAsync('refresh_token');
        if (!refreshToken) throw new Error('No refresh token');

        const refreshRes = await fetch(`${BACKEND_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });

        if (!refreshRes.ok) throw new Error('Session expired');

        const data = await refreshRes.json();
        const newToken = data.data.token;
        const newRefreshToken = data.data.refreshToken;

        await setItemAsync('auth_token', newToken);
        if (newRefreshToken) await setItemAsync('refresh_token', newRefreshToken);
        
        token = newToken;
        onRefreshed(newToken);
      } catch (e) {
        // Force logout
        await deleteItemAsync('auth_token');
        await deleteItemAsync('refresh_token');
        onRefreshed(''); // signal failure
        
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
      if (!token) throw new Error('Session expired');
    }

    // Retry original request
    headers.set('Authorization', `Bearer ${token}`);
    response = await fetch(url, { ...options, headers });
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
    return dbVehicles.map((v: any) => {
      // Robust check for bikes: Seating capacity <= 2 guarantees it's a two-wheeler,
      // even if someone mistakenly saved it as 'SUV' or 'Luxury' in the DB.
      const isBike = v.seatingCapacity <= 2 || /^(bike|scooter|cruiser|sports|standard)$/i.test(v.vehicleType);
      const { getVehicleImage } = require('../../utils/vehicleImages');
      const fallbackImage = getVehicleImage(v.vehicleName, isBike);
      const hasImages = v.images && v.images.length > 0 && v.images[0].url;
      const getFullUrl = (url: string) => {
        if (!url) return '';
        return url.startsWith('http') ? url : `${BASE_URL}${url}`;
      };
      return {
        id: v._id,
        type: isBike ? 'Bike' : 'Car',
        name: v.vehicleName,
        category: isBike ? 'Bike' : (/^car$/i.test(v.vehicleType) ? 'Sedan' : v.vehicleType),
        price: `₹${v.pricePerDay}`,
        perDay: v.pricePerDay,
        image: hasImages ? { uri: getFullUrl(v.images[0].url) } : fallbackImage,
        images: hasImages ? v.images.map((img: any) => ({ uri: getFullUrl(img.url) })) : [fallbackImage],
        seats: `${v.seatingCapacity || (isBike ? 2 : 4)} seats`,
        transmission: v.transmission || 'Manual',
        fuel: v.fuelType || 'Petrol',
        mileage: 'N/A',
        // Availability is derived from these facts (see getAvailability in utils/sawari).
        dbStatus: v.status || 'available',
        bookedRanges: v.bookedRanges || [],
        maintenanceUntil: v.maintenanceUntil || null,
      };
    });
  },

  /**
   * GET /api/coupons
   */
  async getCoupons() {
    return [
      { code: 'FIRST100', discountType: 'FLAT', discountValue: 100, minimumBooking: 999, expiryDate: '2027-12-31', active: true },
      { code: 'SAWARI200', discountType: 'FLAT', discountValue: 200, minimumBooking: 2500, expiryDate: '2027-12-31', active: true },
      { code: 'FESTIVAL10', discountType: 'PERCENTAGE', discountValue: 10, minimumBooking: 2000, maximumDiscount: 500, expiryDate: '2027-12-31', active: true }
    ];
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
    // Fetch the user's SawariCash balance securely
    let availableSawariCash = 0;
    try {
      const walletData = await this.getWallet();
      availableSawariCash = walletData?.walletBalance || 0;
    } catch(e) {}
    
    const quote = await calculateBookingPrice({
      ...params,
      availableSawariCash
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
    // Bookings store calendar days at UTC midnight. Sending the device's local
    // midnight would land on the previous day for the ops team and availability.
    const toUtcMidnight = (label: string) => {
      const day = parseDayLabel(label);
      if (day === null) throw new Error('Invalid booking date');
      return new Date(day * 24 * 60 * 60 * 1000);
    };

    const response = await fetchWithAuth(`${BACKEND_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        vehicleId: vehicleId,
        vehicleName: vehicleName,
        fromDate: toUtcMidnight(params.pickupDateStr).toISOString(),
        toDate: toUtcMidnight(params.returnDateStr).toISOString(),
        pickupTime: params.pickupTime || '10:00 AM',
        dropTime: params.returnTime || '10:00 AM',
        totalDays: quote.rentalDays,
        payment: {
          totalAmount: quote.rentalAmount,
          discountAmount: quote.couponDiscount,
          bookingAmountPaid: quote.onlinePayableNow,
          balanceAmount: quote.remainingRentalAmount,
        },
        sawariCashUsed: quote.sawariCashUsed,
        razorpayOrderId: paymentDetails.razorpayOrderId,
        razorpayPaymentId: paymentDetails.razorpayPaymentId,
      })
    });
    const saved = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(saved.message || 'Failed to save booking');
    }
    snapshot.id = saved.data?._id || snapshot.id;
    invalidateWalletCache(); // SawariCash may have been spent

    // Referral Processing Logic is now handled entirely by the backend upon booking creation.

    
    return snapshot;
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
      const { getItemAsync } = require('expo-secure-store');
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

  async getAllBookings(): Promise<BookingSnapshot[]> {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/bookings/my-bookings`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to fetch bookings');

      // Booking dates are calendar days stored at UTC midnight — format them in UTC so the day never shifts.
      const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
      
      // Map backend booking model to frontend BookingSnapshot
      return (data.data || []).map((b: any) => {
        return {
          id: b._id,
          // 'vehicle_handover' = the customer currently has the vehicle.
          status: b.status === 'vehicle_handover' ? 'ONGOING' : String(b.status).toUpperCase(),
          vehicleId: b.vehicleId?._id || b.vehicleId,
          vehicleName: b.vehicleId?.vehicleName || b.vehicleName || 'Vehicle',
          pickupDate: fmt(b.fromDate),
          returnDate: fmt(b.toDate),
          rentalDays: b.totalDays || 1,
          dailyRate: b.vehicleId?.pricePerDay || 0,
          rentalAmount: b.payment?.totalAmount || 0,
          distanceKm: 0,
          ratePerKm: 0,
          pickupLocationName: b.pickupLocationName || 'MySawari Office',
          dropoffLocationName: b.dropoffLocationName || 'MySawari Office',
          couponDiscount: b.payment?.discountAmount || 0,
          sawariCashUsed: 0,
          bookingAdvance: b.payment?.bookingAmountPaid || 0,
          onlinePayableNow: b.payment?.bookingAmountPaid || 0,
          remainingRentalAmount: b.payment?.balanceAmount || 0,
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
   * POST /api/auth/send-otp
   */
  async sendOtp(mobile: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch(`${BACKEND_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

      const response = await fetch(url.toString(), {
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

        const response = await fetch(url.toString(), {
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

      const response = await fetch(url.toString(), {
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
        
        const response = await fetch(url.toString(), {
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
        const response = await fetch(`${BACKEND_URL}/reviews/${encodeURIComponent(carId)}`);
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
          images: (r.images || []) as string[],
        }));
      } catch (e) {
        return [];
      }
    },

    /** Ids of trips / vehicles this customer has already reviewed. */
    async mine(): Promise<{ bookingIds: string[]; legacyCarIds: string[] }> {
      try {
        const response = await fetchWithAuth(`${BACKEND_URL}/reviews/mine`);
        const data = await response.json();
        if (!response.ok) return { bookingIds: [], legacyCarIds: [] };
        return data.data;
      } catch (e) {
        return { bookingIds: [], legacyCarIds: [] };
      }
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

      const upload = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: form,
      });
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
      const response = await fetchWithAuth(`${BACKEND_URL}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ carId, rating, text: text.trim(), ...extras }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to submit review');
    }
  }
};
