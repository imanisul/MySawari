// Mock Database simulating backend tables/collections

export type FuelPrice = {
  fuelType: string;
  pricePerLitre: number;
  location: string;
  updatedAt: string;
};

export type PickupLocation = {
  id: string;
  name: string;
  address: string;
  pickupCharge: number;
  active: boolean;
};

export type Coupon = {
  code: string;
  discountType: 'FLAT' | 'PERCENTAGE';
  discountValue: number;
  minimumBooking: number;
  maximumDiscount?: number;
  expiryDate: string;
  active: boolean;
};

export type BookingSnapshot = {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED' | 'CANCELLED' | 'COMPLETED';
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

  driverMode?: string;
  driverCharge?: number;
  
  couponCode?: string;
  couponDiscount: number;
  sawariCashUsed: number;
  
  pickupCharge?: number;
  pickupType?: 'OFFICE' | 'DELIVERY';
  
  bookingAdvance: number;
  onlinePayableNow: number;
  remainingRentalAmount: number;
  
  fuelPriceUsed?: number;
  vehicleMileageUsed?: number;
  estimatedKm?: number;
  estimatedFuelCost?: number;
  
  customerName: string;
  customerMobile: string;
  customerEmail?: string;
  
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  paidAt?: string;
  createdAt: string;
};

export type User = {
  id: string;
  name: string;
  mobile: string;
  email?: string;
  license?: string;
  dob?: string;
  gender?: string;
  referralCode: string;
  referredBy?: string;
  createdAt: string;
};

export type ReferralStatus = 'PENDING' | 'SIGNED_UP' | 'FIRST_BOOKING_COMPLETED' | 'REWARD_ELIGIBLE' | 'REWARDED' | 'CANCELLED';

export type Referral = {
  id: string;
  referrerId: string;
  referredId: string;
  referralCode: string;
  status: ReferralStatus;
  rewardAmount: number;
  signupAt: string;
  firstBookingAt?: string;
};

export type AppConfig = {
  referralRewardAmount: number;
  referralRewardType?: 'FLAT' | 'PERCENTAGE';
  referralDiscountAmount: number;
  referralDiscountType: 'FLAT' | 'PERCENTAGE';
};

export const DB = {
  fuelPrices: {
    petrol: { fuelType: 'petrol', pricePerLitre: 105.45, location: 'Guwahati', updatedAt: new Date().toISOString() },
    diesel: { fuelType: 'diesel', pricePerLitre: 95.20, location: 'Guwahati', updatedAt: new Date().toISOString() }
  } as Record<string, FuelPrice>,
  
  pickupLocations: [
    { id: 'office', name: 'MySawari Office', address: 'Guwahati, Assam', pickupCharge: 0, active: true },
    { id: 'airport-t2', name: 'Guwahati Airport Terminal 2', address: 'Guwahati Airport', pickupCharge: 790, active: true },
    { id: 'railway', name: 'Guwahati Railway Station', address: 'Paltan Bazaar', pickupCharge: 500, active: true }
  ] as PickupLocation[],
  
  coupons: [
    { code: 'FIRST100', discountType: 'FLAT', discountValue: 100, minimumBooking: 999, expiryDate: '2027-12-31', active: true },
    { code: 'SAWARI200', discountType: 'FLAT', discountValue: 200, minimumBooking: 2500, expiryDate: '2027-12-31', active: true },
    { code: 'FESTIVAL10', discountType: 'PERCENTAGE', discountValue: 10, minimumBooking: 2000, maximumDiscount: 500, expiryDate: '2027-12-31', active: true }
  ] as Coupon[],
  
  bookings: [] as BookingSnapshot[],
  
  users: [] as User[],
  referrals: [] as Referral[],
  appConfig: {
    referralRewardAmount: 10,
    referralRewardType: 'PERCENTAGE', // Referrer gets 10% commission
    referralDiscountAmount: 100, // Friend gets 100 SawariCash
    referralDiscountType: 'FLAT'
  } as AppConfig
};
