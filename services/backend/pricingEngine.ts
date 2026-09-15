import { DB } from './database';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type QuoteParams = {
  dailyRate: number;
  pickupDateStr: string;
  returnDateStr: string;
  pickupTime?: string;
  returnTime?: string;
  pickupLocation?: { latitude: number, longitude: number, name: string } | null;
  dropoffLocation?: { latitude: number, longitude: number, name: string } | null;
  couponCode?: string;
  sawariCashToApply: number;
  availableSawariCash: number;
  driverMode?: 'Self Drive' | 'With Driver';
  deliveryMode?: 'delivery' | 'pickup' | 'both' | 'return';
};

export type PricingQuote = {
  rentalDays: number;
  dailyRate: number;
  rentalAmount: number; // For distance model, this might be base cost
  
  distanceKm: number;
  ratePerKm: number;
  
  pickupLocationName: string;
  dropoffLocationName: string;
  
  driverMode: 'Self Drive' | 'With Driver';
  driverCharge: number;
  
  couponCode?: string;
  couponDiscount: number;
  discountedRentalAmount: number;
  
  bookingAdvance: number;
  sawariCashUsed: number;
  
  onlinePayableNow: number;
  remainingRentalAmount: number;
  
  pickupCharge: number;
  pickupType: 'OFFICE' | 'DELIVERY';
  
  error?: string;
};

export function calculateRentalDays(start: string, end: string, startTime?: string, endTime?: string): number {
  try {
    const currentYear = new Date().getFullYear();
    const normStart = start.replace(/Sept/gi, 'Sep');
    const normEnd = end.replace(/Sept/gi, 'Sep');
    const startDate = new Date(`${normStart} ${currentYear}`);
    const endDate = new Date(`${normEnd} ${currentYear}`);
    
    const applyTime = (timeStr: string | undefined, dateObj: Date) => {
      if (!timeStr) return;
      const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (match) {
        let [_, h, m, period] = match;
        let hours = parseInt(h);
        const minutes = parseInt(m);
        if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
        if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
        dateObj.setHours(hours, minutes, 0, 0);
      }
    };
    
    applyTime(startTime, startDate);
    applyTime(endTime, endDate);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      const startDay = parseInt(start.replace(/\D/g, ''));
      const endDay = parseInt(end.replace(/\D/g, ''));
      if (!isNaN(startDay) && !isNaN(endDay)) {
        const diff = (endDay - startDay);
        return diff > 0 ? diff : 1;
      }
      return 1;
    }
    
    const diffTime = endDate.getTime() - startDate.getTime();
    if (diffTime <= 0) return 1;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 1;
  } catch (e) {
    return 1;
  }
}

export async function calculateBookingPrice(params: QuoteParams): Promise<PricingQuote> {
  const { 
    dailyRate, pickupDateStr, returnDateStr, pickupTime, returnTime, 
    pickupLocation, dropoffLocation, couponCode, sawariCashToApply, availableSawariCash, driverMode = 'Self Drive'
  } = params;

  const rentalDays = calculateRentalDays(pickupDateStr, returnDateStr, pickupTime, returnTime);
  
  // Calculate mock distance and cost instead of fetching from backend
  let distanceKm = 10;
  let ratePerKm = 20;
  
  // Use coordinates to generate a pseudo-random but deterministic distance if possible
  if (pickupLocation && dropoffLocation) {
    const latDiff = Math.abs(pickupLocation.latitude - dropoffLocation.latitude);
    const lngDiff = Math.abs(pickupLocation.longitude - dropoffLocation.longitude);
    distanceKm = Math.max(5, Math.round((latDiff + lngDiff) * 100)); // Mock rough distance
  }
  
  let baseCost = distanceKm * ratePerKm * rentalDays;
  let couponDiscount = 0;
  
  if (couponCode) {
    couponDiscount = Math.min(baseCost * 0.1, 500); // Mock 10% discount up to 500
  }

  // The rentalAmount is basically our distance-based base cost now
  const rentalAmount = baseCost;
  const driverCharge = driverMode === 'With Driver' ? 800 * rentalDays : 0;
  const totalAmount = rentalAmount + driverCharge;

  const discountedRentalAmount = Math.max(0, totalAmount - couponDiscount);
  
  // Advance is min(500, total)
  const bookingAdvance = Math.min(500, discountedRentalAmount);
  const remainingRentalAmount = discountedRentalAmount - bookingAdvance;
  
  const verifiedCashToApply = Math.min(sawariCashToApply, availableSawariCash);
  const sawariCashUsed = Math.min(verifiedCashToApply, bookingAdvance);
  const onlinePayableNow = Math.max(0, bookingAdvance - sawariCashUsed);

  return {
    rentalDays,
    dailyRate,
    rentalAmount,
    distanceKm,
    ratePerKm,
    pickupLocationName: pickupLocation?.name || 'Pickup',
    dropoffLocationName: dropoffLocation?.name || 'Dropoff',
    driverMode,
    driverCharge,
    couponCode: couponDiscount > 0 ? couponCode : undefined,
    couponDiscount,
    discountedRentalAmount,
    bookingAdvance,
    sawariCashUsed,
    onlinePayableNow,
    remainingRentalAmount,
    pickupCharge: 0,
    pickupType: 'OFFICE' as const,
  };
}
