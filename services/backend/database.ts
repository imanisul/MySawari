// Mock Database simulating backend tables/collections
import { cars } from '../../utils/sawari';

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

export type BookingExtension = {
  id: string;
  bookingId: string;
  previousEndDate: string;
  newEndDate: string;
  additionalDays: number;
  additionalAmount: number;
  paymentId?: string;
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  requestedAt: string;
  confirmedAt?: string;
};

export type BookingSnapshot = {
  id: string;
  status: 'PENDING' | 'CONFIRMED' | 'ONGOING' | 'FAILED' | 'CANCELLED' | 'COMPLETED';
  vehicleId: string;
  vehicleName: string;
  pickupDate: string;
  returnDate: string;
  
  // Base Booking Info
  rentalDays: number;
  dailyRate: number;
  rentalAmount: number; // Base rental amount for original days
  
  // Extension Info
  extensions?: BookingExtension[];
  totalRentalAmount?: number; // Base + Extensions
  
  // Cancellation Info
  cancellationReason?: string;
  cancellationFee?: number;
  refundAmount?: number;
  refundStatus?: 'PROCESSING' | 'COMPLETED' | 'FAILED';
  cancelledAt?: string;

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
  pickupDistanceKm?: number;
  pickupType?: 'OFFICE' | 'DELIVERY';

  dropCharge?: number;
  dropDistanceKm?: number;
  dropLocationName?: string;
  
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

export type ReviewStatus = 'pending' | 'approved' | 'rejected';

/** A customer-submitted review awaiting or past moderation. Only `status: 'approved'` reviews are ever shown publicly. */
export type StoredReview = {
  id: string;
  carId: string;
  userId: string;
  userName: string;
  bookingId?: string;
  rating: number;
  text: string;
  createdAt: string;
  status: ReviewStatus;
  /** True only when we found a real booking record for this customer + vehicle. */
  isVerified: boolean;
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
  
  bookings: [
    {
      id: 'MSW-MOCK-1',
      status: 'CONFIRMED',
      vehicleId: 'swift',
      pickupDate: (() => { const d = new Date(); return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()].toUpperCase()}`; })(),
      returnDate: (() => { const d = new Date(); d.setDate(d.getDate() + 2); return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()].toUpperCase()}`; })()
    },
    {
      id: 'MSW-MOCK-2',
      status: 'CONFIRMED',
      vehicleId: 'scorpio-s',
      pickupDate: (() => { const d = new Date(); d.setDate(d.getDate() + 3); return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()].toUpperCase()}`; })(),
      returnDate: (() => { const d = new Date(); d.setDate(d.getDate() + 6); return `${d.getDate()} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()].toUpperCase()}`; })()
    }
  ] as any[],
  
  // New tables for Availability
  vehicles: [...cars] as any[],
  blockedDates: [] as { vehicleId: string; startDate: string; endDate: string }[],
  
  users: [] as User[],
  referrals: [] as Referral[],
  appConfig: {
    referralRewardAmount: 10,
    referralRewardType: 'PERCENTAGE', // Referrer gets 10% commission
    referralDiscountAmount: 100, // Friend gets 100 SawariCash
    referralDiscountType: 'FLAT'
  } as AppConfig
};
