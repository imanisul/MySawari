import { DB, BookingSnapshot, StoredReview } from './database';
import { calculateBookingPrice, QuoteParams, PricingQuote } from './pricingEngine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

// Simulated delay for realistic backend latency
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// For Expo, localhost points to the phone. We need the local IP of the machine running the bundler.
const debuggerHost = Constants.expoConfig?.hostUri;
const localIp = debuggerHost?.split(':')[0];
const BACKEND_URL = localIp ? `http://${localIp}:5001/api` : 'http://localhost:5001/api';

const REVIEWS_STORAGE_KEY = '@mysawari_reviews';

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
  async getVehiclesWithAvailability() {
    await delay(500); // Simulate network latency

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const parseDate = (dStr: string) => {
      const parts = dStr.trim().split(' ');
      if (parts.length < 2) return 0;
      const day = parseInt(parts[0], 10);
      const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Sept'];
      let month = MONTHS.indexOf(parts[1]);
      if (month === 12) month = 8;
      if (month === -1) return 0;
      return new Date(now.getFullYear(), month, day).getTime();
    };

    const formatDate = (ts: number) => {
      const d = new Date(ts);
      return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()].toUpperCase()}`;
    };

    // Calculate availability for each vehicle
    const vehiclesWithAvailability = DB.vehicles.map(car => {
      // 1. Get relevant bookings (active and in the future/ongoing)
      const activeBookings = DB.bookings.filter(b => 
        b.vehicleId === car.id && 
        ['CONFIRMED', 'ONGOING'].includes(b.status)
      );

      // Extract intervals [start, end] from bookings and blocked dates
      const intervals = activeBookings.map(b => ({
        start: parseDate(b.pickupDate),
        end: parseDate(b.returnDate)
      }));

      // Add blocked dates (if any)
      const blocks = DB.blockedDates?.filter(b => b.vehicleId === car.id) || [];
      blocks.forEach(b => {
        intervals.push({
          start: parseDate(b.startDate),
          end: parseDate(b.endDate)
        });
      });

      // Sort intervals chronologically
      intervals.sort((a, b) => a.start - b.start);

      // 2. Find the first available window
      let currentCheckTime = now.getTime();
      let nextAvailableEnd: number | undefined = undefined;

      // Filter out past intervals
      const futureIntervals = intervals.filter(i => i.end >= currentCheckTime);

      for (const interval of futureIntervals) {
        if (currentCheckTime < interval.start) {
          // We found a gap between currentCheckTime and interval.start
          nextAvailableEnd = interval.start;
          break;
        } else {
          // currentCheckTime falls inside this interval (or exactly on it), push the check forward
          currentCheckTime = Math.max(currentCheckTime, interval.end);
        }
      }

      // If we made it through all intervals and didn't find a gap that ends before an interval,
      // it means the car is available from currentCheckTime indefinitely.
      
      return {
        ...car,
        availabilityRange: {
          start: formatDate(currentCheckTime),
          end: nextAvailableEnd ? formatDate(nextAvailableEnd) : undefined
        }
      };
    });

    return vehiclesWithAvailability;
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
    
    // 3. Save to mock DB
    DB.bookings.push(snapshot);
    
    // Save locally to AsyncStorage for the My Bookings page to see it
    let existing: BookingSnapshot[] = [];
    if (userId) {
      const storedBookings = await AsyncStorage.getItem(`@my_bookings_${userId}`);
      existing = storedBookings ? JSON.parse(storedBookings) as BookingSnapshot[] : [];
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
    await delay(100);
    let userId = null;
    try {
      const { getItemAsync } = require('expo-secure-store');
      userId = await getItemAsync('user_id');
    } catch(e) {}
    
    if (!userId) return [];

    const storedBookings = await AsyncStorage.getItem(`@my_bookings_${userId}`);
    if (!storedBookings) return [];
    
    const bookings = JSON.parse(storedBookings) as BookingSnapshot[];
    
    // Simulate refund processing funnel
    let updated = false;
    const now = new Date().getTime();
    bookings.forEach(b => {
      if (b.status === 'CANCELLED' && b.refundStatus === 'PROCESSING' && b.cancelledAt) {
        // If cancelled more than 15 seconds ago, mark as COMPLETED
        const cancelTime = new Date(b.cancelledAt).getTime();
        if (now - cancelTime > 15000) {
          b.refundStatus = 'COMPLETED';
          updated = true;
        }
      }
    });
    
    if (updated) {
      await AsyncStorage.setItem(`@my_bookings_${userId}`, JSON.stringify(bookings));
    }
    
    return bookings;
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
    const additionalAmount = additionalDays * booking.dailyRate;

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
    return { user, token };
  },

  /**
   * POST /api/auth/send-otp (Mock)
   */
  async sendOtp(mobile: string) {
    await delay(100);
    return { success: true, message: 'OTP sent successfully (MOCK)' };
  },

  /**
   * POST /api/auth/verify-otp (Mock)
   */
  async verifyOtp(mobile: string, otp: string, name?: string) {
    await delay(100);
    if (otp !== '1234') {
      throw new Error('Invalid OTP (Mock expects 1234)');
    }
    return await API.login(name || 'MySawari User', mobile);
  },

  /**
   * GET /api/users/profile
   */
  async getUserProfile(userId: string) {
    await delay(100);
    return DB.users.find(u => u.id === userId) || null;
  },

  /**
   * PUT /api/users/profile (Mock)
   */
  async updateProfile(profileData: { fullName?: string, email?: string, dob?: string, gender?: string, aadhaarNumber?: string, drivingLicenseNumber?: string }) {
    await delay(100);
    const { getItemAsync } = require('expo-secure-store');
    const userId = await getItemAsync('user_id');
    const user = DB.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found in mock DB');
    
    if (profileData.fullName) user.name = profileData.fullName;
    if (profileData.email) user.email = profileData.email;
    if (profileData.dob) user.dob = profileData.dob;
    if (profileData.gender) user.gender = profileData.gender;
    
    return user;
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
   * GET /api/locations/search (Photon Autocomplete)
   */
  async searchLocations(input: string, regionId: string = 'guwahati', isDestination: boolean = false, signal?: AbortSignal) {
    try {
      // Default bias for Guwahati (lat: 26.1445, lon: 91.7362)
      let url = `${BACKEND_URL}/locations/search?q=${encodeURIComponent(input)}`;
      url += `&lat=26.1445&lon=91.7362`;
      
      const response = await fetch(url, { signal });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to search locations');
      return data.data.predictions; // Returns mapped Photon array
    } catch (e: any) {
      console.error('searchLocations API error:', e.message);
      return [];
    }
  },

  /**
   * GET /api/locations/reverse (Photon Reverse Geocode)
   */
  async reverseGeocode(latitude: number, longitude: number) {
    try {
      const response = await fetch(`${BACKEND_URL}/locations/reverse?lat=${latitude}&lon=${longitude}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to get reverse geocode');
      return data.data.location; // Returns mapped Photon object { id, name, address, latitude, longitude }
    } catch (e: any) {
      console.error('reverseGeocode API error:', e.message);
      return null;
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
