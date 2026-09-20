// MySawari hub coordinates (Ganesh Turning, Bongshar, Kahilipara, Guwahati).
// Approximate — update here if the hub location changes; every pickup/drop
// distance calculation is measured from this single point.
export const MYSAWARI_HUB_COORDINATES = { latitude: 26.129, longitude: 91.748 };

/** Shown wherever the customer collects/returns the vehicle themselves. */
export const MYSAWARI_HUB_NAME = 'MySawari, Kahilipara';

export const PICKUP_DROP_RATE_PER_KM = 20;
export const BOOKING_ADVANCE_AMOUNT = 500;

export type Coordinates = { latitude: number; longitude: number };

/** Single place for the ₹ + Indian-grouping formatting repeated across booking/payment screens. */
export function formatCurrency(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;
  return `₹${Math.round(safeAmount).toLocaleString('en-IN')}`;
}

export type QuoteParams = {
  dailyRate: number;
  pickupDateStr: string;
  returnDateStr: string;
  pickupTime?: string;
  returnTime?: string;
  /** Address the vehicle should be delivered to (when a pickup/delivery service is requested). */
  pickupLocation?: { latitude: number, longitude: number, name: string } | null;
  /** Trip destination — kept for backward compatibility, not used for pickup/drop pricing. */
  dropoffLocation?: { latitude: number, longitude: number, name: string } | null;
  /** Address the vehicle should be collected from (when a drop/return service is requested). */
  returnLocation?: { latitude: number, longitude: number, name: string } | null;
  couponCode?: string;
  sawariCashToApply: number;
  availableSawariCash: number;
  driverMode?: 'Self Drive' | 'With Driver';
  deliveryMode?: 'delivery' | 'pickup' | 'both' | 'return';
  isDeliveryRequested?: boolean;
};

export type PricingQuote = {
  rentalDays: number;
  dailyRate: number;
  rentalAmount: number;

  /** @deprecated kept for backward compatibility — equal to pickupDistanceKm */
  distanceKm: number;
  ratePerKm: number;

  pickupLocationName: string;
  /** @deprecated trip-destination name, not used for pricing */
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

  // Pickup service (deliver car to customer)
  pickupCharge: number;
  pickupDistanceKm: number;
  pickupType: 'OFFICE' | 'DELIVERY';

  // Drop service (collect car from customer)
  dropCharge: number;
  dropDistanceKm: number;
  dropLocationName: string;

  error?: string;
};

export type FuelEstimate = {
  fuelRequiredLitres: number;
  estimatedCost: number;
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

/** Haversine straight-line distance, padded 1.3x to approximate real road distance (same factor the backend's distance helper uses). */
export function calculateDistanceKm(a: Coordinates, b: Coordinates): number {
  if (
    typeof a?.latitude !== 'number' || typeof a?.longitude !== 'number' ||
    typeof b?.latitude !== 'number' || typeof b?.longitude !== 'number' ||
    isNaN(a.latitude) || isNaN(a.longitude) || isNaN(b.latitude) || isNaN(b.longitude)
  ) {
    return 0;
  }
  const R = 6371;
  const dLat = (b.latitude - a.latitude) * Math.PI / 180;
  const dLon = (b.longitude - a.longitude) * Math.PI / 180;
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat +
    Math.cos(a.latitude * Math.PI / 180) * Math.cos(b.latitude * Math.PI / 180) * sinLon * sinLon;
  const straightLineKm = 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return Math.max(1, Math.round(straightLineKm * 1.3));
}

export function calculateRentalAmount(dailyRate: number, rentalDays: number): number {
  const safeRate = Number.isFinite(dailyRate) && dailyRate > 0 ? dailyRate : 0;
  const safeDays = Number.isFinite(rentalDays) && rentalDays > 0 ? rentalDays : 0;
  return safeRate * safeDays;
}

export function calculateDriverCharge(driverMode: 'Self Drive' | 'With Driver' | undefined, rentalDays: number): number {
  if (driverMode !== 'With Driver') return 0;
  const safeDays = Number.isFinite(rentalDays) && rentalDays > 0 ? rentalDays : 0;
  return 1400 * safeDays;
}

/** Pickup service = MySawari delivers the car from its hub to the customer's chosen address. */
export function calculatePickupCharge(
  isDeliveryRequested: boolean | undefined,
  deliveryMode: QuoteParams['deliveryMode'],
  pickupLocation: Coordinates | null | undefined
): { charge: number; distanceKm: number } {
  const requested = !!isDeliveryRequested && (deliveryMode === 'delivery' || deliveryMode === 'both');
  if (!requested || !pickupLocation) return { charge: 0, distanceKm: 0 };
  const distanceKm = calculateDistanceKm(MYSAWARI_HUB_COORDINATES, pickupLocation);
  return { charge: distanceKm * PICKUP_DROP_RATE_PER_KM, distanceKm };
}

/** Drop service = MySawari collects the car from the customer's address back to its hub. */
export function calculateDropCharge(
  isDeliveryRequested: boolean | undefined,
  deliveryMode: QuoteParams['deliveryMode'],
  returnLocation: Coordinates | null | undefined
): { charge: number; distanceKm: number } {
  const requested = !!isDeliveryRequested && (deliveryMode === 'return' || deliveryMode === 'both');
  if (!requested || !returnLocation) return { charge: 0, distanceKm: 0 };
  const distanceKm = calculateDistanceKm(MYSAWARI_HUB_COORDINATES, returnLocation);
  return { charge: distanceKm * PICKUP_DROP_RATE_PER_KM, distanceKm };
}

export function calculateCouponDiscount(rentalAmount: number, driverCharge: number, couponCode?: string): number {
  if (!couponCode) return 0;
  return Math.min((rentalAmount + driverCharge) * 0.1, 500);
}

/** Trip total = rental (after driver charge + coupon) plus any pickup/drop service charges. */
export function calculateTripTotal(discountedRentalAmount: number, pickupCharge: number, dropCharge: number): number {
  return Math.max(0, discountedRentalAmount + pickupCharge + dropCharge);
}

export function calculateRemainingAmount(tripTotal: number, bookingAdvance: number): number {
  return Math.max(0, tripTotal - bookingAdvance);
}

/** Sum of the independent pickup and drop service charges. */
export function calculateServiceCharges(pickupCharge: number, dropCharge: number): number {
  return Math.max(0, pickupCharge) + Math.max(0, dropCharge);
}

/** ₹500 flat, capped to the trip total when the trip itself costs less. */
export function calculateAdvanceAmount(tripTotal: number): number {
  return Math.min(BOOKING_ADVANCE_AMOUNT, Math.max(0, tripTotal));
}

export function calculateFuelRequired(tripDistanceKm: number, mileageKmPerLitre: number | null | undefined): number | null {
  if (!Number.isFinite(tripDistanceKm) || tripDistanceKm <= 0 || !mileageKmPerLitre || !Number.isFinite(mileageKmPerLitre) || mileageKmPerLitre <= 0) {
    return null;
  }
  return tripDistanceKm / mileageKmPerLitre;
}

export function calculateFuelCost(fuelRequiredLitres: number | null, petrolPricePerLitre: number | null | undefined): number | null {
  if (fuelRequiredLitres === null || !petrolPricePerLitre || !Number.isFinite(petrolPricePerLitre) || petrolPricePerLitre <= 0) {
    return null;
  }
  return fuelRequiredLitres * petrolPricePerLitre;
}

/**
 * Estimated fuel required and cost for a trip. Returns null when mileage or
 * price data isn't available — callers must handle that missing state
 * explicitly rather than showing a fabricated number.
 */
export function calculateFuelEstimate(
  tripDistanceKm: number,
  mileageKmPerLitre: number | null | undefined,
  petrolPricePerLitre: number | null | undefined
): FuelEstimate | null {
  const fuelRequiredLitres = calculateFuelRequired(tripDistanceKm, mileageKmPerLitre);
  const estimatedCost = calculateFuelCost(fuelRequiredLitres, petrolPricePerLitre);
  if (fuelRequiredLitres === null || estimatedCost === null) return null;
  return { fuelRequiredLitres, estimatedCost };
}

export async function calculateBookingPrice(params: QuoteParams): Promise<PricingQuote> {
  const {
    dailyRate, pickupDateStr, returnDateStr, pickupTime, returnTime,
    pickupLocation, dropoffLocation, returnLocation, couponCode, sawariCashToApply, availableSawariCash,
    driverMode = 'Self Drive', deliveryMode, isDeliveryRequested,
  } = params;

  const rentalDays = calculateRentalDays(pickupDateStr, returnDateStr, pickupTime, returnTime);
  const rentalAmount = calculateRentalAmount(dailyRate, rentalDays);
  const driverCharge = calculateDriverCharge(driverMode, rentalDays);
  const couponDiscount = calculateCouponDiscount(rentalAmount, driverCharge, couponCode);
  const discountedRentalAmount = Math.max(0, rentalAmount + driverCharge - couponDiscount);

  const pickup = calculatePickupCharge(isDeliveryRequested, deliveryMode, pickupLocation);
  const drop = calculateDropCharge(isDeliveryRequested, deliveryMode, returnLocation);

  const totalAmount = calculateTripTotal(discountedRentalAmount, pickup.charge, drop.charge);

  // Only the fixed booking amount (₹500, or less if the whole trip costs less) is paid up front.
  // Everything else — rental, driver, pickup and drop services — is the remaining balance.
  const bookingAdvance = calculateAdvanceAmount(totalAmount);
  const remainingRentalAmount = calculateRemainingAmount(totalAmount, bookingAdvance);

  const verifiedCashToApply = Math.min(Math.max(0, sawariCashToApply || 0), Math.max(0, availableSawariCash || 0));
  const sawariCashUsed = Math.min(verifiedCashToApply, bookingAdvance);
  const onlinePayableNow = Math.max(0, bookingAdvance - sawariCashUsed);

  return {
    rentalDays,
    dailyRate,
    rentalAmount,
    distanceKm: pickup.distanceKm,
    ratePerKm: PICKUP_DROP_RATE_PER_KM,
    pickupLocationName: pickupLocation?.name || 'MySawari Office',
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
    pickupCharge: pickup.charge,
    pickupDistanceKm: pickup.distanceKm,
    pickupType: isDeliveryRequested ? 'DELIVERY' as const : 'OFFICE' as const,
    dropCharge: drop.charge,
    dropDistanceKm: drop.distanceKm,
    dropLocationName: returnLocation?.name || 'MySawari Office',
  };
}
