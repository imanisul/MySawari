import { DB, BookingSnapshot, StoredReview } from './database';
import { calculateBookingPrice, QuoteParams, PricingQuote } from './pricingEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Car } from '../../utils/sawari';
import { Platform } from 'react-native';

// Simulated delay for realistic backend latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Local backend
const BASE_URL = Platform.OS === 'android' ? 'http://10.0.2.2:5001' : 'http://localhost:5001';
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

const REVIEWS_STORAGE_KEY = '@mysawari_reviews';

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
    await delay(100);
    return DB.pickupLocations.filter(loc => loc.active);
  },

  /**
   * GET /api/vehicles
   * Returns vehicles with their dynamically calculated availability range
   */
  async getVehiclesWithAvailability(type?: string): Promise<Car[]> {
    try {
      let url = `${BACKEND_URL}/vehicles`;
      
      const response = await fetchWithAuth(url);
      
      if (response.status === 401) {
        return [];
      }
      
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to fetch vehicles');
      
      // Extra safeguard: explicitly filter out any vehicles marked as deleted
      const dbVehicles = (data.data || []).filter((v: any) => v.isDeleted !== true);
      
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
        
        let availabilityDate = 'Available Now';
        let availableToDate: string | undefined;

        if (v.status === 'service' || v.status === 'maintenance') {
          availabilityDate = 'In Service';
        } else if (v.status === 'rent' || v.status === 'booked') {
          availabilityDate = 'Currently Booked';
        } else {
          availabilityDate = 'Available Now';
        }

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
          availabilityDate,
          availableToDate,
          availabilityRange: {
            start: availabilityDate,
            end: '31 Dec'
          },
          dbStatus: v.status || 'available',
          bookedRanges: v.bookedRanges || []
        };
      });
    } catch (e: any) {
      console.error('getVehiclesWithAvailability error:', e);
      return [];
    }
  },

  /**
   * GET /api/coupons
   */
  async getCoupons() {
    await delay(100);
    return DB.coupons.filter(c => c.active);
  },

  /**
   * GET /api/config/fuel-price
   */
  async getFuelPrice(type: 'petrol' | 'diesel' = 'petrol') {
    await delay(100);
    return DB.fuelPrices[type];
  },

  /**
   * POST /api/bookings/quote
   */
  async quoteBooking(params: Omit<QuoteParams, 'availableSawariCash'>): Promise<PricingQuote> {
    await delay(100);
    
    // Fetch the user's SawariCash balance securely
    let availableSawariCash = 0;
    try {
      const { getItemAsync } = require('expo-secure-store');
      const userId = await getItemAsync('user_id');
      if (userId) {
        const storedCash = await AsyncStorage.getItem(`@sawari_cash_${userId}`);
        availableSawariCash = storedCash ? Number(storedCash) : 0;
      }
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
   * POST /api/payments/razorpay/order
   */
  async createRazorpayOrder(params: Omit<QuoteParams, 'availableSawariCash'>): Promise<{ orderId: string, amountPaise: number }> {
    await delay(100);
    
    // BACKEND VALIDATION: Independently recalculate the quote to prevent frontend manipulation
    const serverQuote = await this.quoteBooking(params);
    
    if (serverQuote.onlinePayableNow <= 0) {
      throw new Error("Online payable amount is 0. No Razorpay order required.");
    }
    
    // Razorpay uses paise
    const amountPaise = serverQuote.onlinePayableNow * 100;
    
    // Mock Razorpay Order ID
    const orderId = `order_${Math.random().toString(36).substring(2, 10)}`;
    
    return { orderId, amountPaise };
  },

  /**
   * POST /api/payments/razorpay/verify
   * In a real app, this verifies the HMAC SHA256 signature using the Razorpay Secret
   */
  async verifyPayment(orderId: string, paymentId: string, signature: string): Promise<boolean> {
    await delay(100);
    // Mock successful verification
    if (!orderId || !paymentId || !signature) {
      throw new Error("Missing payment verification details");
    }
    return true;
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
    await delay(100);
    
    // BACKEND VALIDATION: Recalculate quote to prevent frontend manipulation
    const serverQuote = await this.quoteBooking(params);
    const quote = serverQuote;
    
    // 1. Deduct Sawari Cash safely
    let userId = null;
    try {
      const { getItemAsync } = require('expo-secure-store');
      userId = await getItemAsync('user_id');
    } catch(e) {}

    if (quote.sawariCashUsed > 0 && userId) {
      const storedCash = await AsyncStorage.getItem(`@sawari_cash_${userId}`);
      let currentCash = storedCash ? Number(storedCash) : 0;
      if (currentCash >= quote.sawariCashUsed) {
        currentCash -= quote.sawariCashUsed;
        await AsyncStorage.setItem(`@sawari_cash_${userId}`, currentCash.toString());
      }
    }
    
    // 2. Create snapshot
    const snapshot: BookingSnapshot = {
      id: `MSW-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
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
    
    // 3. Save to backend DB
    const dateParser = (dateStr: string) => {
      const parts = dateStr.split(' ');
      if (parts.length >= 3) {
        // Assume format '15 Sep 2024'
        return new Date(`${parts[1]} ${parts[0]} ${parts[2]}`);
      }
      return new Date(dateStr);
    };

    try {
      await fetchWithAuth(`${BACKEND_URL}/bookings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vehicleId: vehicleId,
          vehicleName: vehicleName,
          customerName: customerDetails.name,
          mobileNumber: customerDetails.mobile,
          tripType: 'local',
          fromDate: dateParser(params.pickupDateStr).toISOString(),
          toDate: dateParser(params.returnDateStr).toISOString(),
          pickupTime: params.pickupTime || '10:00 AM',
          dropTime: params.returnTime || '10:00 AM',
          totalDays: quote.rentalDays,
          payment: {
            totalAmount: quote.rentalAmount,
            discountAmount: quote.couponDiscount,
            bookingAmountPaid: quote.onlinePayableNow,
            balanceAmount: quote.remainingRentalAmount,
            paymentMethod: 'online',
            paymentStatus: 'paid'
          }
        })
      });
    } catch (e) {
      console.error('Error saving booking to backend:', e);
    }
    
    // Referral Processing Logic
    const user = DB.users.find(u => u.mobile === customerDetails.mobile);
    if (user && user.referredBy) {
      // Check if this is their first booking
      const hasPreviousBookings = DB.bookings.some(b => b.customerMobile === customerDetails.mobile && b.id !== snapshot.id);
      
      if (!hasPreviousBookings) {
        const referral = DB.referrals.find(r => r.referredId === user.id && r.status === 'SIGNED_UP');
        if (referral) {
          referral.status = 'REWARDED';
          referral.firstBookingAt = snapshot.createdAt;
          
          // In a real app, this would be a wallet transaction added to DB.walletTransactions
          // Since we use AsyncStorage for current user in the frontend, the frontend will refetch profile,
          // but we simulate it by finding the referrer and noting they got a reward.
          // Because our mock is limited to the current user's local storage, we just update the DB status here.
        }
      }
    }
    
    return snapshot;
  },
  
  async getBooking(id: string): Promise<BookingSnapshot | null> {
    await delay(100);
    let userId = null;
    try {
      const { getItemAsync } = require('expo-secure-store');
      userId = await getItemAsync('user_id');
    } catch(e) {}
    
    if (!userId) return null;

    const storedBookings = await AsyncStorage.getItem(`@my_bookings_${userId}`);
    if (!storedBookings) return null;
    const bookings = JSON.parse(storedBookings) as BookingSnapshot[];
    return bookings.find(b => b.id === id) || null;
  },

  async getAllBookings(): Promise<BookingSnapshot[]> {
    try {
      const response = await fetchWithAuth(`${BACKEND_URL}/bookings/my-bookings`);
      const data = await response.json();
      
      if (!response.ok) throw new Error(data.message || 'Failed to fetch bookings');
      
      // Map backend booking model to frontend BookingSnapshot
      return (data.data || []).map((b: any) => {
        // Simple mapping
        return {
          id: b._id,
          status: b.status.toUpperCase(),
          vehicleId: b.vehicleId,
          vehicleName: b.vehicleName || 'Vehicle',
          pickupDate: new Date(b.fromDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          returnDate: new Date(b.toDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          rentalDays: b.totalDays || 1,
          dailyRate: 0,
          rentalAmount: b.payment?.totalAmount || 0,
          distanceKm: 0,
          ratePerKm: 0,
          pickupLocationName: '',
          dropoffLocationName: '',
          couponDiscount: b.payment?.discountAmount || 0,
          sawariCashUsed: 0,
          bookingAdvance: b.payment?.bookingAmountPaid || 0,
          onlinePayableNow: b.payment?.bookingAmountPaid || 0,
          remainingRentalAmount: b.payment?.balanceAmount || 0,
          customerName: b.customerName,
          customerMobile: b.mobileNumber,
          createdAt: b.createdAt
        } as BookingSnapshot;
      });
    } catch (e: any) {
      console.error('getAllBookings error:', e);
      return [];
    }
  },

  async cancelBooking(id: string, reason?: string): Promise<{ success: boolean; snapshot: BookingSnapshot }> {
    await delay(100);
    const bookings = await this.getAllBookings();
    const index = bookings.findIndex(b => b.id === id);
    if (index === -1) throw new Error('Booking not found');
    
    const booking = bookings[index];
    if (booking.status !== 'CONFIRMED' && booking.status !== 'PENDING') {
      throw new Error('Only upcoming bookings can be cancelled');
    }

    // Cancellation Policy Logic
    const parseDate = (dateStr: string) => {
      if (dateStr === 'mock-date') dateStr = '15 Sep';
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const parts = dateStr.split(' ');
      const monthPrefix = parts.length >= 2 ? parts[1].substring(0, 3) : '';
      if (parts.length >= 2 && months.includes(monthPrefix)) {
        const day = parseInt(parts[0], 10);
        const month = months.indexOf(monthPrefix);
        const year = new Date().getFullYear();
        return new Date(year, month, day);
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return new Date(`${dateStr} ${new Date().getFullYear()}`);
      return d;
    };
    
    const pickupDate = parseDate(booking.pickupDate);
    const now = new Date();
    const hoursDifference = (pickupDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    let cancellationFee = 0;
    let refundAmount = 0;

    if (hoursDifference >= 24) {
      // Full refund of what they paid online
      cancellationFee = 0;
      refundAmount = booking.onlinePayableNow;
    } else {
      // No refund if cancelled less than 24 hours before pickup
      cancellationFee = booking.onlinePayableNow;
      refundAmount = 0;
    }

    booking.status = 'CANCELLED';
    booking.cancellationReason = reason || 'Customer cancelled';
    booking.cancellationFee = cancellationFee;
    booking.refundAmount = refundAmount;
    if (refundAmount > 0) {
      booking.refundStatus = 'PROCESSING';
    }
    booking.cancelledAt = new Date().toISOString();

    // Update Async Storage
    let userId = null;
    try {
      const { getItemAsync } = require('expo-secure-store');
      userId = await getItemAsync('user_id');
    } catch(e) {}
    
    if (userId) {
      await AsyncStorage.setItem(`@my_bookings_${userId}`, JSON.stringify(bookings));
    }

    return { success: true, snapshot: booking };
  },

  async checkExtensionAvailability(bookingId: string, newReturnDateStr: string): Promise<{ available: boolean; message?: string; additionalDays: number; additionalAmount: number }> {
    await delay(100);
    const booking = await this.getBooking(bookingId);
    if (!booking) throw new Error('Booking not found');

    const parseDate = (dateStr: string) => {
      if (dateStr === 'mock-date') dateStr = '20 Sep';
      const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const parts = dateStr.split(' ');
      const monthPrefix = parts.length >= 2 ? parts[1].substring(0, 3) : '';
      if (parts.length >= 2 && months.includes(monthPrefix)) {
        const day = parseInt(parts[0], 10);
        const month = months.indexOf(monthPrefix);
        const year = new Date().getFullYear();
        return new Date(year, month, day);
      }
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return new Date(`${dateStr} ${new Date().getFullYear()}`);
      return d;
    };
    
    const currentReturn = parseDate(booking.returnDate);
    const newReturn = parseDate(newReturnDateStr);
    
    if (newReturn <= currentReturn) {
      return { available: false, message: 'New return date must be after current return date', additionalDays: 0, additionalAmount: 0 };
    }

    // Mock overlap check (simulate availability based on dummy logic)
    // In a real system, we query DB for any booking for this vehicle overlapping the new period.
    const isAvailable = true; 
    
    if (!isAvailable) {
      return { 
        available: false, 
        message: 'This vehicle is already reserved after your current booking and cannot be extended.',
        additionalDays: 0, 
        additionalAmount: 0 
      };
    }

    const additionalDays = Math.ceil((newReturn.getTime() - currentReturn.getTime()) / (1000 * 60 * 60 * 24));
    let additionalAmount = additionalDays * booking.dailyRate;
    
    // Add driver charge if the original booking included a driver
    if (booking.driverMode === 'With Driver') {
      additionalAmount += (1400 * additionalDays);
    }

    return {
      available: true,
      additionalDays,
      additionalAmount
    };
  },

  async extendBooking(bookingId: string, newReturnDateStr: string, additionalAmount: number, additionalDays: number): Promise<{ success: boolean; snapshot: BookingSnapshot }> {
    await delay(100); // Simulate payment & verification
    
    const bookings = await this.getAllBookings();
    const index = bookings.findIndex(b => b.id === bookingId);
    if (index === -1) throw new Error('Booking not found');
    
    const booking = bookings[index];

    // Create Extension Record
    if (!booking.extensions) booking.extensions = [];
    const extension = {
      id: `ext_${Date.now()}`,
      bookingId,
      previousEndDate: booking.returnDate,
      newEndDate: newReturnDateStr,
      additionalDays,
      additionalAmount,
      status: 'CONFIRMED' as const,
      requestedAt: new Date().toISOString(),
      confirmedAt: new Date().toISOString(),
      paymentId: `pay_${Date.now()}`
    };
    
    booking.extensions.push(extension);
    
    // Update booking state
    booking.returnDate = newReturnDateStr;
    booking.rentalDays += additionalDays;
    booking.totalRentalAmount = (booking.totalRentalAmount || booking.rentalAmount) + additionalAmount;
    
    if (booking.driverMode === 'With Driver') {
      booking.driverCharge = (booking.driverCharge || 0) + (1400 * additionalDays);
    }
    
    // Add extension amount to the remaining balance to be paid at drop-off
    booking.remainingRentalAmount = (booking.remainingRentalAmount || 0) + additionalAmount;
    
    // Update Async Storage
    let userId = null;
    try {
      const { getItemAsync } = require('expo-secure-store');
      userId = await getItemAsync('user_id');
    } catch(e) {}
    
    if (userId) {
      await AsyncStorage.setItem(`@my_bookings_${userId}`, JSON.stringify(bookings));
    }

    return { success: true, snapshot: booking };
  },

  /**
   * GET /api/config
   */
  async getAppConfig() {
    await delay(100);
    return DB.appConfig;
  },

  /**
   * POST /api/auth/login
   * Mock login that generates a unique referral code for new users.
   */
  async login(name: string, mobile: string, referralCode?: string) {
    await delay(100);
    let user = DB.users.find(u => u.mobile === mobile);
    
    if (!user) {
      // Create new user
      const uniqueCode = `${name.substring(0, 4).toUpperCase().replace(/[^A-Z]/g, '')}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      
      let referredBy = undefined;
      if (referralCode) {
        const referrer = DB.users.find(u => u.referralCode === referralCode);
        if (referrer) {
          referredBy = referrer.id;
        }
      }

      user = {
        id: `usr_${Math.random().toString(36).substring(2, 10)}`,
        name,
        mobile,
        referralCode: uniqueCode,
        referredBy,
        createdAt: new Date().toISOString()
      };
      DB.users.push(user);

      // Create pending referral relation if referred
      if (referredBy) {
        DB.referrals.push({
          id: `ref_${Math.random().toString(36).substring(2, 10)}`,
          referrerId: referredBy,
          referredId: user.id,
          referralCode: referralCode || '',
          status: 'SIGNED_UP',
          rewardAmount: DB.appConfig.referralRewardAmount,
          signupAt: new Date().toISOString(),
        });
      }
    } else {
      // Update name if changed
      user.name = name;
    }

    // Mock token
    const token = `tok_${user.id}_${Date.now()}`;
    const refreshToken = `ref_tok_${user.id}_${Date.now()}`;
    return { user, token, refreshToken };
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
      return { success: true, message: data.message };
    } catch (e: any) {
      throw new Error(e.message);
    }
  },

  /**
   * POST /api/auth/verify-otp
   */
  async verifyOtp(mobile: string, otp: string, name?: string) {
    try {
      const res = await fetch(`${BACKEND_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobileNumber: mobile, otp, customerName: name })
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
        license: customer.drivingLicenseNumber,
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
    await delay(100);
    return DB.users.find(u => u.id === userId) || null;
  },

  /**
   * PUT /api/customers/profile
   */
  async updateProfile(profileData: { fullName?: string, email?: string, dob?: string, gender?: string, aadhaarNumber?: string, drivingLicenseNumber?: string }) {
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
        license: customer.drivingLicenseNumber,
        referralCode: customer.referralCode,
        createdAt: customer.createdAt
      };
    } catch (e: any) {
      throw new Error(e.message);
    }
  },

  /**
   * GET /api/users/:id/referrals
   */
  async getReferrals(userId: string) {
    await delay(100);
    const referrals = DB.referrals.filter(r => r.referrerId === userId);
    
    // Join with referred user details for display
    return referrals.map(ref => {
      const referredUser = DB.users.find(u => u.id === ref.referredId);
      return {
        ...ref,
        referredName: referredUser?.name || 'Unknown',
      };
    });
  },

  /**
   * Photon Autocomplete (called directly; render backend has no /locations route)
   */
  async searchLocations(input: string, regionId: string = 'guwahati', isDestination: boolean = false, signal?: AbortSignal) {
    if (!input || input.trim().length < 2) return [];
    
    try {
      // Primary: Try Photon API
      const url = new URL(`${PHOTON_BASE_URL}/api/`);
      url.searchParams.set('q', input.trim());
      url.searchParams.set('limit', '8');
      url.searchParams.set('lat', '26.1445');
      url.searchParams.set('lon', '91.7362');

      const response = await fetch(url.toString(), {
        headers: { 'Accept-Language': 'en' },
        signal,
      });
      if (!response.ok) throw new Error(`Photon API responded with status ${response.status}`);
      const data = await response.json();
      return mapPhotonResponse(data);
    } catch (e: any) {
      if (e.name === 'AbortError' || e.message === 'Aborted' || (signal && signal.aborted)) {
        throw e;
      }
      
      console.warn(`Photon search failed: ${e.message}. Falling back to Nominatim...`);
      
      try {
        // Fallback: Nominatim API
        const url = new URL(`${NOMINATIM_BASE_URL}/search`);
        url.searchParams.set('q', input.trim());
        url.searchParams.set('format', 'json');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('limit', '8');
        url.searchParams.set('countrycodes', 'in');

        const response = await fetch(url.toString(), {
          headers: { 'User-Agent': 'MySawariApp/1.0' },
          signal,
        });
        
        if (!response.ok) throw new Error(`Nominatim API responded with status ${response.status}`);
        const data = await response.json();
        
        return data.map((item: any) => {
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
      } catch (fallbackError: any) {
        console.error('All location search APIs failed:', fallbackError.message);
        return [];
      }
    }
  },

  /**
   * Photon Reverse Geocode (called directly; render backend has no /locations route)
   */
  async reverseGeocode(latitude: number, longitude: number) {
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
      return mapped.length > 0 ? mapped[0] : null; 
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
        if (!name && data.address) {
          name = data.address.road || data.address.suburb || data.address.city;
        }
        
        return {
          id: data.osm_id?.toString() || `osm_${Math.random()}`,
          name: name || 'Unknown Place',
          address: data.display_name,
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
   * Reviews endpoints
   *
   * Reviews go through moderation: every new review is stored as `pending`
   * and only ever appears on the public Car Details page once its status is
   * flipped to `approved` (there is no admin surface in this app yet, so
   * that flip currently has to happen by editing the stored record directly —
   * see REVIEWS_STORAGE_KEY below).
   */
  reviews: {
    async fetchByCarId(carId: string) {
      await delay(100);
      try {
        const stored = await AsyncStorage.getItem(REVIEWS_STORAGE_KEY);
        const allReviews: StoredReview[] = stored ? JSON.parse(stored) : [];
        return allReviews
          .filter(r => r.carId === carId && r.status === 'approved')
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
          .map(r => ({
            id: r.id,
            userName: r.userName,
            rating: r.rating,
            text: r.text,
            date: new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
            isVerified: r.isVerified,
          }));
      } catch (e) {
        return [];
      }
    },

    async submit(carId: string, rating: number, text: string): Promise<{ status: 'pending' }> {
      await delay(100);

      let userId: string | null = null;
      try {
        const { getItemAsync } = require('expo-secure-store');
        userId = await getItemAsync('user_id');
      } catch (e) {}

      if (!userId) {
        throw new Error('Please log in to submit a review.');
      }

      const stored = await AsyncStorage.getItem(REVIEWS_STORAGE_KEY);
      const allReviews: StoredReview[] = stored ? JSON.parse(stored) : [];

      const alreadyReviewed = allReviews.some(r => r.carId === carId && r.userId === userId && r.status !== 'rejected');
      if (alreadyReviewed) {
        throw new Error('You have already reviewed this vehicle.');
      }

      // Verified only when we can find a real booking of this exact vehicle by this customer.
      let bookingId: string | undefined;
      try {
        const storedBookings = await AsyncStorage.getItem(`@my_bookings_${userId}`);
        const bookings: BookingSnapshot[] = storedBookings ? JSON.parse(storedBookings) : [];
        const matchingBooking = bookings.find(b => b.vehicleId === carId && b.status !== 'CANCELLED' && b.status !== 'FAILED');
        bookingId = matchingBooking?.id;
      } catch (e) {}

      const user = DB.users.find(u => u.id === userId);

      const newReview: StoredReview = {
        id: `rev_${Date.now()}`,
        carId,
        userId,
        userName: user?.name || 'MySawari Customer',
        bookingId,
        rating,
        text: text.trim(),
        createdAt: new Date().toISOString(),
        status: 'pending',
        isVerified: !!bookingId,
      };

      allReviews.push(newReview);
      await AsyncStorage.setItem(REVIEWS_STORAGE_KEY, JSON.stringify(allReviews));

      return { status: 'pending' };
    }
  }
};
