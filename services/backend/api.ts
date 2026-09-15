import { DB, BookingSnapshot } from './database';
import { calculateBookingPrice, QuoteParams, PricingQuote } from './pricingEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Simulated delay for realistic backend latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// For Expo, localhost points to the phone. We need the local IP of the machine running the bundler.
const debuggerHost = Constants.expoConfig?.hostUri;
const localIp = debuggerHost?.split(':')[0];
const BACKEND_URL = localIp ? `http://${localIp}:5001/api` : 'http://localhost:5001/api';

export const API = {
  /**
   * GET /api/pickup-locations
   */
  async getPickupLocations() {
    await delay(300);
    return DB.pickupLocations.filter(loc => loc.active);
  },

  /**
   * GET /api/coupons
   */
  async getCoupons() {
    await delay(300);
    return DB.coupons.filter(c => c.active);
  },

  /**
   * GET /api/config/fuel-price
   */
  async getFuelPrice(type: 'petrol' | 'diesel' = 'petrol') {
    await delay(200);
    return DB.fuelPrices[type];
  },

  /**
   * POST /api/bookings/quote
   */
  async quoteBooking(params: Omit<QuoteParams, 'availableSawariCash'>): Promise<PricingQuote> {
    await delay(500);
    
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
    await delay(800);
    
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
    await delay(600);
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
    await delay(500);
    
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
      pickupDate: 'mock-date', // In real app, pass ISO date from quote request
      returnDate: 'mock-date',
      rentalDays: quote.rentalDays,
      dailyRate: quote.dailyRate,
      rentalAmount: quote.rentalAmount,
      
      distanceKm: quote.distanceKm,
      ratePerKm: quote.ratePerKm,
      pickupLocationName: quote.pickupLocationName,
      dropoffLocationName: quote.dropoffLocationName,
      
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
    
    // 3. Save to mock DB
    DB.bookings.push(snapshot);
    
    // Save locally to AsyncStorage for the My Bookings page to see it
    if (userId) {
      const storedBookings = await AsyncStorage.getItem(`@my_bookings_${userId}`);
      const existing = storedBookings ? JSON.parse(storedBookings) as BookingSnapshot[] : [];
      await AsyncStorage.setItem(`@my_bookings_${userId}`, JSON.stringify([snapshot, ...existing]));
    }
    
    // Referral Processing Logic
    const user = DB.users.find(u => u.mobile === customerDetails.mobile);
    if (user && user.referredBy) {
      // Check if this is their first booking
      const hasPreviousBookings = existing.some(b => b.customerMobile === customerDetails.mobile) || DB.bookings.some(b => b.customerMobile === customerDetails.mobile && b.id !== snapshot.id);
      
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
    await delay(300);
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

  /**
   * GET /api/config
   */
  async getAppConfig() {
    await delay(200);
    return DB.appConfig;
  },

  /**
   * POST /api/auth/login
   * Mock login that generates a unique referral code for new users.
   */
  async login(name: string, mobile: string, referralCode?: string) {
    await delay(500);
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
    return { user, token };
  },

  /**
   * POST /api/auth/send-otp (Real Backend via WATI)
   */
  async sendOtp(mobile: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to send OTP');
      return data;
    } catch (e: any) {
      console.error('sendOtp API error:', e.message);
      throw e;
    }
  },

  /**
   * POST /api/auth/verify-otp (Real Backend via WATI)
   */
  async verifyOtp(mobile: string, otp: string, name?: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile, otp, name })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Invalid OTP');
      return data.data; // returns { token, user }
    } catch (e: any) {
      console.error('verifyOtp API error:', e.message);
      throw e;
    }
  },

  /**
   * GET /api/users/profile
   */
  async getUserProfile(userId: string) {
    await delay(300);
    return DB.users.find(u => u.id === userId) || null;
  },

  /**
   * GET /api/users/:id/referrals
   */
  async getReferrals(userId: string) {
    await delay(300);
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
   * POST /api/locations/autocomplete (Real Backend via Google Places API)
   */
  async searchLocations(input: string, regionId: string = 'guwahati', isDestination: boolean = false) {
    try {
      const response = await fetch(`${BACKEND_URL}/locations/autocomplete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, regionId, isDestination })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to search locations');
      return data.data.predictions;
    } catch (e: any) {
      console.error('searchLocations API error:', e.message);
      return [];
    }
  },

  /**
   * POST /api/locations/details (Real Backend via Google Places API)
   */
  async getLocationDetails(placeId: string) {
    try {
      const response = await fetch(`${BACKEND_URL}/locations/details`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placeId })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to get location details');
      return data.data.location; // { latitude, longitude }
    } catch (e: any) {
      console.error('getLocationDetails API error:', e.message);
      return null;
    }
  }
};
