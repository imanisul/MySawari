import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Car, cars, DriverMode, LocationResult } from '@/utils/sawari';
import { Offer } from '@/services/api/offers';
import { API } from '@/services/backend/api';
import { PricingQuote, QuoteParams } from '@/services/backend/pricingEngine';
import { BookingSnapshot } from '@/services/backend/database';

import * as SecureStore from 'expo-secure-store';

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
  pickup: LocationResult | null;
  dropoff: LocationResult | null;
  dateRange: string;
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
  login: (token: string, user: any) => Promise<void>;
  logout: () => Promise<void>;
  
  // Favorites
  favorites: string[];
  toggleFavorite: (carId: string) => void;
};

const SawariContext = createContext<SawariContextValue | null>(null);

const getMockDateRange = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date();
  nextWeek.setDate(nextWeek.getDate() + 5);
  const format = (d: Date) => {
    const parts = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }).split(' ');
    return `${parts[0]} ${parts[1]}`;
  };
  return `${format(tomorrow)} – ${format(nextWeek)}`;
};

export function SawariProvider({ children }: { children: React.ReactNode }) {
  const [vehicleType, setVehicleType] = useState<'car' | 'bike'>('car');
  const [mode, setMode] = useState<DriverMode>('Self Drive');
  const [selectedCar, setSelectedCar] = useState<Car>(cars[0]);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [pickup, setPickup] = useState<LocationResult | null>(null);
  const [dropoff, setDropoff] = useState<LocationResult | null>(null);
  const [isDeliveryRequested, setIsDeliveryRequested] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'return' | 'both'>('both');
  const [returnAddress, setReturnAddress] = useState<LocationResult | null>(null);
  const [dateRange, setDateRange] = useState(getMockDateRange());
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

  // NEW BOOKING STATE
  const [pricingQuote, setPricingQuote] = useState<PricingQuote | null>(null);
  const [isQuoteLoading, setIsQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [sawariCashToApply, setSawariCashToApply] = useState(0);
  const [fuelEstimate, setFuelEstimate] = useState<SawariContextValue['fuelEstimate']>(null);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const val = await AsyncStorage.getItem('@has_seen_permissions');
        if (isMounted) setHasSeenPermissions(val === 'true');
        
        // Authenticate with SecureStore
        const token = await SecureStore.getItemAsync('auth_token');
        if (token) {
          const userId = await SecureStore.getItemAsync('user_id');
          if (userId) {
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
              
              // Load other data like rewards/cash using user ID to prevent leaks
              const storedRewards = await AsyncStorage.getItem(`@earned_rewards_${userId}`);
              if (storedRewards) setEarnedRewards(JSON.parse(storedRewards));
              const storedCash = await AsyncStorage.getItem(`@sawari_cash_${userId}`);
              if (storedCash) setSawariCash(Number(storedCash));
              const storedBookings = await AsyncStorage.getItem(`@total_bookings_${userId}`);
              if (storedBookings) setTotalBookings(Number(storedBookings));
            } else if (isMounted) {
              setIsAuthenticated(false);
            }
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
    })();
    return () => { isMounted = false; };
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
      createBookingSnapshot: async (paymentDetails: { razorpayOrderId?: string; razorpayPaymentId?: string }) => {
        if (!pricingQuote) return null;
        try {
          const snapshot = await API.createBooking(
            quoteParams,
            selectedCar.id,
            selectedCar.name,
            customer,
            paymentDetails,
            fuelEstimate || undefined
          );
          // Refresh cash from DB
          const cash = await AsyncStorage.getItem(`@sawari_cash_${customer.id}`);
          if (cash) setSawariCash(Number(cash));
          return snapshot;
        } catch (e) {
          console.error("Failed to create snapshot", e);
          return null;
        }
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
        setDateRange(nextDateRange);
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
            fullName: data.name,
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
        setSawariCash((prev) => {
          const next = prev + amount;
          AsyncStorage.setItem(`@sawari_cash_${customer.id || 'guest'}`, next.toString()).catch(() => {});
          return next;
        });
      },
      useSawariCash: async (amount: number) => {
        setSawariCash((prev) => {
          const next = Math.max(0, prev - amount);
          AsyncStorage.setItem(`@sawari_cash_${customer.id || 'guest'}`, next.toString()).catch(() => {});
          return next;
        });
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
          const bonus = Math.floor(pricingQuote.rentalAmount * 0.10);
          setSawariCash((prev) => {
            const next = prev + bonus;
            AsyncStorage.setItem(`@sawari_cash_${customer.id || 'guest'}`, next.toString()).catch(() => {});
            return next;
          });
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
      login: async (token: string, user: any) => {
        try {
          setIsAuthLoading(true);
          await SecureStore.setItemAsync('auth_token', String(token));
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
          const cash = user.walletBalance || 0;
          setSawariCash(cash);
          await AsyncStorage.setItem(`@sawari_cash_${user.id}`, cash.toString());

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
          await SecureStore.deleteItemAsync('auth_token');
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
      refreshQuote,
      vehicleType,
      quoteParams,
      favorites
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