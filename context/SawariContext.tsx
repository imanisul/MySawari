import React, { createContext, useContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Car, cars, DriverMode, LocationResult } from '@/utils/sawari';
import { Offer } from '@/services/api/offers';
import { API, invalidateWalletCache } from '@/services/backend/api';
import { PricingQuote, QuoteParams } from '@/services/backend/pricingEngine';
import { BookingSnapshot } from '@/services/backend/api';

import * as SecureStore from 'expo-secure-store';
import * as Notifications from 'expo-notifications';
import { AppState } from 'react-native';
import { getDevicePosition } from '@/utils/location';
import { calculateDistanceKm } from '@/services/backend/pricingEngine';

export type PaymentMethod = string;
export type BookingStatus = 'upcoming' | 'active' | 'completed' | 'cancelled';

export type AppNotification = {
  id: string;
  title: string;
  body: string;
  date: string;
  image?: string;
  read: boolean;
};

export type AppCustomer = {
  id: string;
  name: string;
  mobile: string;
  email: string;
  license: string;
  dob: string;
  gender: string;
  joinedOn: string;
  referralCode: string;
};

type SawariContextValue = {
  vehicleType: 'car' | 'bike';
  setVehicleType: (type: 'car' | 'bike') => void;
  mode: DriverMode;
  selectedCar: Car;
  bookingConfirmed: boolean;
  bookingSource: 'home' | 'explore' | null;
  setBookingSource: (source: 'home' | 'explore' | null) => void;
  pickup: LocationResult | null;
  dropoff: LocationResult | null;
  dateRange: string;
  setDateRange: (range: string) => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  duration: string;
  durationDays: number;
  pickupTime: string;
  returnTime: string;
  paymentMethod: PaymentMethod;
  paymentAttempts: number;
  bookingStatus: BookingStatus;
  
  isDeliveryRequested: boolean;
  setIsDeliveryRequested: (val: boolean) => void;
  deliveryMode: 'delivery' | 'return' | 'both';
  setDeliveryMode: (mode: 'delivery' | 'return' | 'both') => void;
  returnAddress: LocationResult | null;
  setReturnAddress: (loc: LocationResult | null) => void;
  
  // NEW BOOKING STATE
  pricingQuote: PricingQuote | null;
  quoteParams: Omit<QuoteParams, 'availableSawariCash'>;
  isQuoteLoading: boolean;
  quoteError: string | null;
  appliedCouponCode: string | null;
  sawariCashToApply: number;
  fuelEstimate: { estimatedKm: number, estimatedFuelCost: number, fuelPriceUsed: number, vehicleMileageUsed: number } | null;
  refreshQuote: () => Promise<void>;
  
  applyCoupon: (code: string | null) => void;
  applySawariCash: (amount: number) => void;
  setFuelEstimate: (estimate: SawariContextValue['fuelEstimate']) => void;
  createBookingSnapshot: (paymentDetails: { razorpayOrderId?: string; razorpayPaymentId?: string }) => Promise<BookingSnapshot | null>;
  lastBooking: BookingSnapshot | null;

  customer: AppCustomer;
  notifications: AppNotification[];
  unreadCount: number;
  expoPushToken: string | null;
  earnedRewards: Offer[];
  sawariCash: number;
  totalBookings: number;
  incrementBookings: () => void;
  setMode: (mode: DriverMode) => void;
  selectCar: (car: Car) => void;
  setPickup: (pickup: LocationResult | null) => void;
  setDropoff: (dropoff: LocationResult | null) => void;
  swapLocations: () => void;
  setDates: (dateRange: string, duration: string) => void;
  setTimes: (pickupTime: string, returnTime: string) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  updateCustomer: (field: 'name' | 'mobile' | 'email' | 'license' | 'dob' | 'gender', value: string) => void;
  saveProfile: (data: Partial<AppCustomer>) => Promise<void>;
  earnReward: (reward: Offer) => void;
  earnSawariCash: (amount: number) => void;
  useSawariCash: (amount: number) => void;
  payBooking: () => void;
  confirmBooking: () => void;
  setBookingStatus: (status: BookingStatus) => void;
  completeBooking: () => void;
  cancelBooking: () => void;
  clearBooking: () => void;
  addNotification: (notification: Omit<AppNotification, 'read'>) => void;
  markAllAsRead: () => void;
  setPushToken: (token: string) => void;
  hasSeenPermissions: boolean | null;
  completeOnboarding: () => Promise<void>;
  isAuthenticated: boolean | null;
  isAuthLoading: boolean;
  login: (token: string, refreshToken: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  fetchWallet: () => Promise<void>;
  
  // Favorites
  favorites: string[];
  toggleFavorite: (carId: string) => void;
  
  // Theme
  isDarkMode: boolean;
  toggleDarkMode: (value: boolean) => void;
};

const SawariContext = createContext<SawariContextValue | null>(null);



export function SawariProvider({ children }: { children: React.ReactNode }) {
  const [vehicleType, setVehicleType] = useState<'car' | 'bike'>('car');
  const [mode, setMode] = useState<DriverMode>('Self Drive');
  const [selectedCar, setSelectedCar] = useState<Car>(cars[0]);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingSource, setBookingSource] = useState<'home' | 'explore' | null>(null);
  const [pickup, setPickup] = useState<LocationResult | null>(null);
  // Always the latest pickup, for background tasks (GPS refresh) that must not read stale state.
  const pickupRef = useRef<LocationResult | null>(null);
  pickupRef.current = pickup;
  const [dropoff, setDropoff] = useState<LocationResult | null>(null);
  const [isDeliveryRequested, setIsDeliveryRequested] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'return' | 'both'>('both');
  const [returnAddress, setReturnAddress] = useState<LocationResult | null>(null);
  
  const defaultToday = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const [dateRange, setDateRangeState] = useState('Select Dates');
  const [selectedDate, setSelectedDateState] = useState(defaultToday);
  
  const [duration, setDuration] = useState('5 days');
  const [pickupTime, setPickupTime] = useState('08:00 AM');
  const [returnTime, setReturnTime] = useState('08:00 AM');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [paymentAttempts, setPaymentAttempts] = useState(0);
  const [bookingStatus, setBookingStatus] = useState<BookingStatus>('upcoming');
  const [customer, setCustomer] = useState<AppCustomer>({
    id: '',
    name: '',
    mobile: '',
    email: '',
    license: '',
    dob: '',
    gender: '',
    joinedOn: '',
    referralCode: '',
  });
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [earnedRewards, setEarnedRewards] = useState<Offer[]>([]);
  const [sawariCash, setSawariCash] = useState(0);
  const [totalBookings, setTotalBookings] = useState(0);
  const [expoPushToken, setPushToken] = useState<string | null>(null);
  const [hasSeenPermissions, setHasSeenPermissions] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // --- Start Push Notification Listener ---
  useEffect(() => {
    const sub = Notifications.addNotificationReceivedListener((notification) => {
      const { title, body } = notification.request.content;
      const id = notification.request.identifier;
      
      setNotifications((prev) => {
        // Prevent duplicates
        if (prev.some((n) => n.id === id)) return prev;
        return [
          {
            id,
            title: title || 'Update from MySawari',
            body: body || '',
            date: new Date().toISOString(),
            read: false,
          },
          ...prev,
        ];
      });
    });
    return () => sub.remove();
  }, []);
  // --- End Push Notification Listener ---

  // NEW BOOKING STATE
  const [pricingQuote, setPricingQuote] = useState<PricingQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [sawariCashToApply, setSawariCashToApply] = useState(0);
  const [fuelEstimate, setFuelEstimate] = useState<SawariContextValue['fuelEstimate']>(null);
  const [lastBooking, setLastBooking] = useState<BookingSnapshot | null>(null);

  useEffect(() => {
    let isMounted = true;

    const { DeviceEventEmitter } = require('react-native');
    const sessionExpiryListener = DeviceEventEmitter.addListener('onSessionExpired', async () => {
      invalidateWalletCache(); // never show one account's balance to the next
      if (isMounted) {
        setIsAuthenticated(false);
        setCustomer({ id: '', name: '', mobile: '', email: '', license: '', dob: '', gender: '', joinedOn: '', referralCode: '' });
      }
    });

    // Auto-detected default location. Only ever replaces a location that was itself auto-detected
    // (never one the customer chose), and only when they have actually moved (> 300 m).
    let lastGpsCheck = 0;
    const detectGps = async (preferFresh: boolean) => {
      if (Date.now() - lastGpsCheck < 60 * 1000 && preferFresh) return; // don't hammer the GPS
      lastGpsCheck = Date.now();
      try {
        const result = await getDevicePosition({ preferFresh, askPermission: !preferFresh });
        if (!result.ok || !isMounted) return;
        const { latitude, longitude } = result.position.coords;

        const isAuto = (loc: LocationResult | null) => !loc || (loc.source === 'gps' && String(loc.id).startsWith('auto_'));
        const current = pickupRef.current;
        if (!isAuto(current)) return; // the customer chose their own location — leave it alone
        if (current && calculateDistanceKm(current, { latitude, longitude }) <= 0.3) return; // hasn't moved

        let addressStr = 'Current Location';
        let placeName = 'My Current Location';
        try {
          const reverseData = await API.reverseGeocode(latitude, longitude, { areaOnly: true });
          if (reverseData) {
            addressStr = reverseData.address || addressStr;
            placeName = reverseData.name || placeName;
          }
        } catch (e) {
          console.warn('Reverse geocode failed', e);
        }

        const detected: LocationResult = {
          id: `auto_${Date.now()}`,
          address: addressStr,
          latitude,
          longitude,
          name: placeName,
          source: 'gps',
        };
        if (isMounted) {
          setPickup((prev) => (isAuto(prev) ? detected : prev));
          setReturnAddress((prev) => (isAuto(prev) ? detected : prev));
        }
      } catch (e) {
        console.warn('Failed to auto-detect location', e);
      }
    };

    // Coming back to the app after moving around → refresh the auto-detected location.
    const appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') detectGps(true);
    });

    (async () => {
      try {
        // Fetch independent initial data concurrently
        const [permissionsVal, token, userId, themeVal, storedSelectedDate, storedDateRange] = await Promise.all([
          AsyncStorage.getItem('@has_seen_permissions'),
          SecureStore.getItemAsync('auth_token'),
          SecureStore.getItemAsync('user_id'),
          AsyncStorage.getItem('@app_theme_dark'),
          AsyncStorage.getItem('@sawari_selected_date'),
          AsyncStorage.getItem('@sawari_date_range')
        ]);
        
        if (isMounted) {
          setHasSeenPermissions(permissionsVal === 'true');
          setIsDarkMode(themeVal === 'true');
          
          if (storedDateRange) {
             setDateRangeState(storedDateRange);
          }
          
          if (storedSelectedDate) {
             // 'All Dates' is deprecated; default to today's date
             if (storedSelectedDate === 'All Dates') {
               setSelectedDateState(defaultToday);
             } else {
               // Validate date is not in the past
               const parts = storedSelectedDate.trim().split(' ');
               if (parts.length >= 2) {
                 const day = parseInt(parts[0], 10);
                 const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Sept'];
                 let month = MONTHS.indexOf(parts[1]);
                 if (month === 12) month = 8;
                 if (month !== -1 && !isNaN(day)) {
                   const currentYear = new Date().getFullYear();
                   const parsedDate = new Date(currentYear, month, day);
                   const today = new Date(new Date().setHours(0,0,0,0));
                   if (parsedDate >= today) {
                     setSelectedDateState(storedSelectedDate);
                   }
                 }
               }
             }
          }
        }
        
        if (token && userId) {
          // For a fully decoupled frontend, read the locally saved customer info
          const storedProfile = await AsyncStorage.getItem(`@customer_info_${userId}`);
          
          if (storedProfile && isMounted) {
            const userProfile = JSON.parse(storedProfile);
            setCustomer({
              id: userProfile.id || userId,
              name: userProfile.name || 'Demo User',
              mobile: userProfile.mobile || '+91 9999999999',
              email: userProfile.email || '',
              license: userProfile.license || '',
              dob: userProfile.dob || '',
              gender: userProfile.gender || '',
              joinedOn: userProfile.joinedOn || new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
              referralCode: userProfile.referralCode || 'DEMO123',
            });
            
            // Only consider them authenticated if the profile successfully fetched
            setIsAuthenticated(true);
            
            // Load other data concurrently
            const [storedRewards, storedBookings] = await Promise.all([
              AsyncStorage.getItem(`@earned_rewards_${userId}`),
              AsyncStorage.getItem(`@total_bookings_${userId}`),
            ]);
            
            if (isMounted) {
              if (storedRewards) setEarnedRewards(JSON.parse(storedRewards));
              if (storedBookings) setTotalBookings(Number(storedBookings));
            }

            // The wallet loads in the background — the app opens without waiting for the network.
            API.getWallet().then((walletData) => {
              if (isMounted && walletData) setSawariCash(walletData.walletBalance || 0);
            });
          } else if (isMounted) {
            setIsAuthenticated(false);
          }
        } else if (isMounted) {
          setIsAuthenticated(false);
        }
      } catch (e) {
        if (isMounted) {
          setHasSeenPermissions(false);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsAuthLoading(false);
        }
      }

      // Default pickup / return = where the customer is right now (runs after the app is already usable).
      detectGps(false);
    })();
    return () => { 
      isMounted = false; 
      sessionExpiryListener.remove();
      appStateSub.remove();
    };
  }, []);

  const quoteParams = useMemo(() => {
    // Split by either en-dash '–' or standard hyphen '-'
    const dates = dateRange.split(/[-–]/).map(d => d.trim());
    const pickupDateStr = dates[0] || '15 Sep';
    const returnDateStr = dates[1] || '20 Sep';

    return {
      dailyRate: selectedCar.perDay,
      pickupDateStr,
      returnDateStr,
      pickupTime,
      returnTime,
      pickupLocation: pickup,
      dropoffLocation: dropoff,
      returnLocation: returnAddress,
      couponCode: appliedCouponCode || undefined,
      sawariCashToApply,
      driverMode: mode,
      isDeliveryRequested,
      deliveryMode
    };
  }, [selectedCar.id, selectedCar.perDay, dateRange, pickupTime, returnTime, pickup?.id, returnAddress?.id, appliedCouponCode, sawariCashToApply, mode, isDeliveryRequested, deliveryMode]);

  const refreshQuote = useCallback(async () => {
    setIsQuoteLoading(true);
    setQuoteError(null);
    try {
      const quote = await API.quoteBooking(quoteParams);
      setPricingQuote(quote);
    } catch (e: any) {
      setQuoteError(e.message || 'Failed to calculate pricing');
      setPricingQuote(null);
    } finally {
      setIsQuoteLoading(false);
    }
  }, [quoteParams]);

  // Refresh quote whenever dependencies change
  useEffect(() => {
    refreshQuote();
  }, [refreshQuote]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications]);

  const contextValue = useMemo<SawariContextValue>(() => ({
    vehicleType,
    setVehicleType,
    mode,
      selectedCar,
      bookingConfirmed,
      pickup,
      dropoff,
      dateRange,
      setDateRange: (range: string) => {
        setDateRangeState(range);
        AsyncStorage.setItem('@sawari_date_range', range).catch(() => {});
      },
      selectedDate,
      setSelectedDate: (date: string) => {
        setSelectedDateState(date);
        AsyncStorage.setItem('@sawari_selected_date', date).catch(() => {});
      },
      bookingSource,
      setBookingSource,
      duration,
      durationDays: pricingQuote?.rentalDays || 1, // Fallback to 1 if quote not loaded
      pickupTime,
      returnTime,
      paymentMethod,
      paymentAttempts,
      bookingStatus,
      isDeliveryRequested,
      setIsDeliveryRequested,
      deliveryMode,
      setDeliveryMode,
      returnAddress,
      setReturnAddress,
      customer,
      sawariCash,
      totalBookings,
      pricingQuote,
      quoteParams,
      isQuoteLoading,
      quoteError,
      appliedCouponCode,
      sawariCashToApply,
      fuelEstimate,
      refreshQuote,
      applyCoupon: setAppliedCouponCode,
      applySawariCash: setSawariCashToApply,
      setFuelEstimate,
      lastBooking,
      createBookingSnapshot: async (paymentDetails: { razorpayOrderId?: string; razorpayPaymentId?: string }) => {
        if (!pricingQuote) return null;
        // Errors propagate so the payment screen can tell the user exactly what failed.
        const snapshot = await API.createBooking(
          quoteParams,
          selectedCar.id,
          selectedCar.name,
          customer,
          paymentDetails,
          fuelEstimate || undefined
        );
        setLastBooking(snapshot);
        // Refresh cash from DB
        const wallet = await API.getWallet(true);
        if (wallet) setSawariCash(wallet.walletBalance || 0);
        return snapshot;
      },
      setMode,
      selectCar: setSelectedCar,
      setPickup,
      setDropoff,
      swapLocations: () => {
        setPickup(dropoff);
        setDropoff(pickup);
      },
      setDates: (nextDateRange: string, nextDuration: string) => {
        setDateRangeState(nextDateRange);
        AsyncStorage.setItem('@sawari_date_range', nextDateRange).catch(() => {});
        setDuration(nextDuration);
      },
      setTimes: (nextPickupTime: string, nextReturnTime: string) => {
        setPickupTime(nextPickupTime);
        setReturnTime(nextReturnTime);
      },
      setPaymentMethod,
      updateCustomer: async (field: string, val: string) => {
        setCustomer((prev) => {
          const next = { ...prev, [field]: val };
          AsyncStorage.setItem(`@customer_info_${prev.id || 'guest'}`, JSON.stringify(next)).catch(() => {});
          return next;
        });
      },
      saveProfile: async (data: Partial<AppCustomer>) => {
        try {
          // 1. Call Backend API
          await API.updateProfile({
            customerName: data.name,
            email: data.email,
            dob: data.dob,
            gender: data.gender
          } as any);
          
          // 2. Update local state seamlessly
          setCustomer((prev) => {
            const next = { ...prev, ...data };
            AsyncStorage.setItem(`@customer_info_${prev.id || 'guest'}`, JSON.stringify(next)).catch(() => {});
            return next;
          });
        } catch (e) {
          console.error("Failed to save profile", e);
          throw e; // Let the UI handle the error
        }
      },
      earnReward: async (reward: Offer) => {
        setEarnedRewards((prev) => {
          const next = [reward, ...prev];
          AsyncStorage.setItem(`@earned_rewards_${customer.id || 'guest'}`, JSON.stringify(next)).catch(() => {});
          return next;
        });
      },
      earnSawariCash: async (amount: number) => {
        // Just refresh the backend wallet state
        const wallet = await API.getWallet(true);
        if (wallet) setSawariCash(wallet.walletBalance || 0);
      },
      useSawariCash: async (amount: number) => {
        // Real deduction happens in API on booking creation, but we can refresh here
        const wallet = await API.getWallet(true);
        if (wallet) setSawariCash(wallet.walletBalance || 0);
      },
      incrementBookings: async () => {
        setTotalBookings((prev) => {
          const next = prev + 1;
          AsyncStorage.setItem(`@total_bookings_${customer.id || 'guest'}`, next.toString()).catch(() => {});
          return next;
        });
      },
      payBooking: () => {
        setPaymentAttempts((attempts) => attempts + 1);
      },
      confirmBooking: () => setBookingConfirmed(true),
      setBookingStatus,
      completeBooking: async () => {
        setBookingStatus('completed');
        if (pricingQuote) {
          // Trigger a wallet refresh because backend may have awarded a bonus
          const wallet = await API.getWallet(true);
          if (wallet) setSawariCash(wallet.walletBalance || 0);
        }
      },
      cancelBooking: () => {
        setBookingStatus('cancelled');
      },
      clearBooking: () => {
        setBookingConfirmed(false);
        setBookingStatus('upcoming');
        setPaymentAttempts(0);
        setAppliedCouponCode(null);
        setSawariCashToApply(0);
        setFuelEstimate(null);
      },
      notifications,
      earnedRewards,
      unreadCount,
      expoPushToken,
      addNotification: (n: Omit<AppNotification, 'read'>) => {
        setNotifications((prev) => [{ ...n, read: false }, ...prev]);
      },
      markAllAsRead: () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      },
      setPushToken,
      hasSeenPermissions,
      completeOnboarding: async () => {
        try {
          await AsyncStorage.setItem('@has_seen_permissions', 'true');
          setHasSeenPermissions(true);
        } catch (e) {
          if (__DEV__) console.warn('Failed to save permissions state', e);
        }
      },
      isAuthenticated,
      isAuthLoading,
      login: async (token: string, refreshToken: string, user: any) => {
        try {
          setIsAuthLoading(true);
          await SecureStore.setItemAsync('auth_token', String(token));
          if (refreshToken) await SecureStore.setItemAsync('refresh_token', String(refreshToken));
          await SecureStore.setItemAsync('user_id', String(user.id));
          
          const newCustomer = {
            id: user._id || user.id,
            name: user.fullName || user.name,
            mobile: user.mobileNumber || user.mobile,
            email: user.email || '',
            license: user.drivingLicenseNumber || user.license || '',
            dob: user.dob || '',
            gender: user.gender || '',
            joinedOn: new Date().toLocaleDateString('en-GB', { month: 'short', year: 'numeric' }),
            referralCode: user.referralCode,
          };
          
          setCustomer(newCustomer);
          await AsyncStorage.setItem(`@customer_info_${user.id}`, JSON.stringify(newCustomer));
          
          // SET CASH AND REWARDS DIRECTLY FROM BACKEND
          const walletData = await API.getWallet(true);
          setSawariCash(walletData.walletBalance || 0);

          const rewards = user.rewards || [];
          setEarnedRewards(rewards);
          await AsyncStorage.setItem(`@earned_rewards_${user.id}`, JSON.stringify(rewards));
          
          setIsAuthenticated(true);
        } catch (e) {
          console.error(e);
        } finally {
          setIsAuthLoading(false);
        }
      },
      logout: async () => {
        try {
          invalidateWalletCache();
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('refresh_token');
          await SecureStore.deleteItemAsync('user_id');
          setCustomer({
            id: '', name: '', mobile: '', email: '', license: '', dob: '', gender: '', joinedOn: '', referralCode: ''
          });
          setSawariCash(0);
          setEarnedRewards([]);
          setTotalBookings(0);
          setNotifications([]);
          setFavorites([]);
          setIsAuthenticated(false);
        } catch (e) {
          if (__DEV__) console.warn('Logout failed', e);
        }
      },
      favorites,
      toggleFavorite: (carId: string) => {
        setFavorites(prev => 
          prev.includes(carId) ? prev.filter(id => id !== carId) : [...prev, carId]
        );
      },
      isDarkMode,
      toggleDarkMode: (value: boolean) => {
        setIsDarkMode(value);
        AsyncStorage.setItem('@app_theme_dark', value ? 'true' : 'false').catch(() => {});
      },
      fetchWallet: async () => {
        const wallet = await API.getWallet(true);
        if (wallet) setSawariCash(wallet.walletBalance || 0);
      },
    }),
    [
      mode,
      selectedCar,
      bookingConfirmed,
      pickup,
      dropoff,
      dateRange,
      duration,
      pickupTime,
      returnTime,
      paymentMethod,
      paymentAttempts,
      bookingStatus,
      isDeliveryRequested,
      deliveryMode,
      returnAddress,
      customer,
      notifications,
      unreadCount,
      expoPushToken,
      earnedRewards,
      sawariCash,
      totalBookings,
      hasSeenPermissions,
      isAuthenticated,
      isAuthLoading,
      pricingQuote,
      isQuoteLoading,
      quoteError,
      appliedCouponCode,
      sawariCashToApply,
      fuelEstimate,
      lastBooking,
      refreshQuote,
      vehicleType,
      quoteParams,
      favorites,
      isDarkMode
    ]
  );

  return <SawariContext.Provider value={contextValue}>{children}</SawariContext.Provider>;
}

export function useSawari() {
  const context = useContext(SawariContext);
  if (!context) {
    throw new Error('useSawari must be used within a SawariProvider');
  }
  return context;
}