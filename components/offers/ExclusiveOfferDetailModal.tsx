import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  ScrollView,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Image,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '@/utils/haptics';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { LoginBottomSheet } from '@/components/auth/LoginBottomSheet';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { formatCurrency, MYSAWARI_HUB_NAME } from '@/services/backend/pricingEngine';
import { ExclusiveOffer, claimExclusiveOffer, recordOfferView } from '@/services/api/offers';
import { API } from '@/services/backend/api';
import { getAvailability, splitDateRange } from '@/utils/sawari';

interface ExclusiveOfferDetailModalProps {
  offer: ExclusiveOffer | null;
  visible: boolean;
  onClose: () => void;
  onClaimSuccess?: (claim: any) => void;
}

type VehicleOption = {
  vehicleId: string;
  vehicleName: string;
  image?: any;
  dealPrice?: number;
  originalPrice?: number;
  carObj?: any;
};

// Brand tokens (work on both light and dark palettes)
const ACCENT = '#323E71';
const ACCENT_TINT = 'rgba(97, 82, 216, 0.12)';
const SUCCESS = '#059669';
const SUCCESS_TINT = 'rgba(5, 150, 105, 0.12)';
const DANGER = '#DC2626';
const DANGER_TINT = 'rgba(220, 38, 38, 0.10)';

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const idOf = (v: any) => String(v?.id ?? v?._id ?? '');
const imageOf = (v: any) => v?.image || v?.images?.[0];
const basePriceOf = (v: any): number | undefined => v?.perDay ?? v?.pricePerDay;

/** Works out what the customer actually pays for one car under this offer. */
function computeDealPrice(offer: ExclusiveOffer, original?: number, explicit?: number) {
  if (explicit != null) return explicit;
  const type = offer.pricingType || 'promotional_price';
  if (type === 'promotional_price') return offer.promotionalPrice ?? 1;
  if (original == null) return undefined;
  if (type === 'fixed_discount') return Math.max(original - (offer.promotionalPrice ?? 500), 0);
  if (type === 'percentage_discount') {
    return Math.round(original * (1 - (offer.discountPercent ?? 50) / 100));
  }
  return undefined;
}

function describeTimeLeft(expiry: Date, now: number) {
  const ms = expiry.getTime() - now;
  if (ms <= 0) return { text: 'This offer has ended', urgent: true, ended: true };
  const mins = Math.floor(ms / 60000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days >= 2) return { text: `Ends in ${days} days`, urgent: false, ended: false };
  if (days === 1) return { text: `Ends in 1 day ${hours % 24}h`, urgent: false, ended: false };
  if (hours >= 1) return { text: `Ends in ${hours}h ${mins % 60}m`, urgent: true, ended: false };
  return { text: `Ends in ${Math.max(mins, 1)} min`, urgent: true, ended: false };
}

function formatOfferDateTime(isoString?: string | Date | null, explicitTime?: string) {
  if (!isoString) return '-';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return '-';
  const datePart = d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  const timePart = explicitTime && explicitTime !== 'Immediate' ? explicitTime : d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  return `${datePart} · ${timePart}`;
}

export function ExclusiveOfferDetailModal({
  offer,
  visible,
  onClose,
  onClaimSuccess,
}: ExclusiveOfferDetailModalProps) {
  const router = useRouter();
  const p = useDetailsPalette();
  const insets = useSafeAreaInsets();
  const {
    isAuthenticated,
    membership,
    applyCoupon,
    selectCar,
    setDates,
    setTimes,
    dateRange,
    setDropoff,
    setPickup,
    dropoff,
    pickup,
  } = useSawari();
  const { data: vehicles = [] } = useVehicles();

  const [claiming, setClaiming] = useState(false);
  const [claimData, setClaimData] = useState<any>(offer?.activeClaim || null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [claimError, setClaimError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [checking, setChecking] = useState(false);

  const offerId = offer ? String(offer._id || offer.id) : null;

  // ---------- Eligible vehicles ----------
  const vehiclesList: VehicleOption[] = useMemo(() => {
    if (!offer || !vehicles?.length) return [];

    const fromFleet = (list: any[]) =>
      list.map((v) => ({
        vehicleId: idOf(v),
        vehicleName: v.name || v.vehicleName || 'Fleet vehicle',
        image: imageOf(v),
        originalPrice: basePriceOf(v),
        dealPrice: computeDealPrice(offer, basePriceOf(v)),
        carObj: v,
      }));

    const findCar = (id: any) => vehicles.find((v: any) => idOf(v) === String(id));

    if (offer.allVehicles || offer.applicableType === 'all') return fromFleet(vehicles);

    if (offer.vehiclePrices?.length) {
      return offer.vehiclePrices.map((vp) => {
        const found = findCar(vp.vehicleId);
        const original = vp.originalPrice ?? basePriceOf(found);
        return {
          vehicleId: String(vp.vehicleId),
          vehicleName: vp.vehicleName || found?.name || found?.vehicleName || 'Vehicle',
          image: imageOf(found),
          originalPrice: original,
          dealPrice: computeDealPrice(offer, original, vp.dealPrice),
          carObj: found,
        };
      });
    }

    if (offer.applicableVehicleIds?.length) {
      return fromFleet(offer.applicableVehicleIds.map(findCar).filter(Boolean));
    }

    if (offer.vehicleId) {
      const vId = typeof offer.vehicleId === 'object' ? (offer.vehicleId as any)._id : offer.vehicleId;
      const found = findCar(vId);
      if (found) return fromFleet([found]);
    }

    // No restriction set: the whole fleet is eligible
    return fromFleet(vehicles);
  }, [offer, vehicles]);

  const selectedVehicle =
    vehiclesList.find((v) => v.vehicleId === selectedVehicleId) ?? vehiclesList[0];

  // Reset state whenever a different offer opens
  useEffect(() => {
    if (!offer) return;
    setClaimData(offer.activeClaim || null);
    setClaimError(null);
    setSelectedVehicleId(null);
    setShowTerms(false);
  }, [offerId]);

  useEffect(() => {
    if (visible && offerId) recordOfferView(offerId);
  }, [visible, offerId]);

  // Keep a valid car selected
  useEffect(() => {
    if (!vehiclesList.length) return;
    if (!selectedVehicleId || !vehiclesList.some((v) => v.vehicleId === selectedVehicleId)) {
      setSelectedVehicleId(vehiclesList[0].vehicleId);
    }
  }, [vehiclesList, selectedVehicleId]);

  // Tick the countdown once a minute while open
  useEffect(() => {
    if (!visible) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(t);
  }, [visible]);

  if (!offer) return null;

  // ---------- Eligibility ----------
  const userTier = (membership?.plan || '').toLowerCase().trim();
  const isMember = Boolean(userTier && userTier !== 'none');

  let isTierEligible = true;
  let eligibilityNote = '';
  if (offer.membershipEligibility === 'members_only') {
    isTierEligible = isMember;
    eligibilityNote = 'MySawari Club members exclusive';
  } else if (offer.membershipEligibility === 'tier_specific') {
    const required = (offer.eligibleTiers || []).map((t) => t.toLowerCase().trim());
    isTierEligible = isMember && required.includes(userTier);
    const names = required.map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join(' & ');
    eligibilityNote = `${names} members special`;
  } else if (offer.membershipEligibility === 'non_members_only') {
    isTierEligible = !isMember;
    eligibilityNote = 'First ride special';
  }

  // ---------- Pricing ----------
  const pricingType = offer.pricingType || 'promotional_price';
  const pricingUnit = offer.pricingUnit === 'per_trip' ? '/trip' : '/day';

  let offerHeadline = 'Exclusive offer';
  if (pricingType === 'promotional_price') {
    offerHeadline = `${formatCurrency(offer.promotionalPrice ?? 1)}${pricingUnit}`;
  } else if (pricingType === 'fixed_discount') {
    offerHeadline = `${formatCurrency(offer.promotionalPrice ?? 500)} OFF`;
  } else if (pricingType === 'percentage_discount') {
    offerHeadline = `${offer.discountPercent ?? 50}% OFF`;
  }

  const dealPrice = selectedVehicle?.dealPrice ?? offer.promotionalPrice ?? 1;
  const originalPrice = selectedVehicle?.originalPrice ?? offer.originalPrice;
  const savings =
    dealPrice != null && originalPrice != null && originalPrice > dealPrice
      ? originalPrice - dealPrice
      : null;

  // ---------- Expiry & Scheduling ----------
  const startDate = offer.startDate ? new Date(offer.startDate) : null;
  const isUpcoming = Boolean(startDate && !isNaN(startDate.getTime()) && startDate.getTime() > now);
  const expiry = offer.expiryDate ? new Date(offer.expiryDate) : null;
  const timeLeft = expiry ? describeTimeLeft(expiry, now) : null;
  const isEnded = Boolean(timeLeft?.ended);

  const isOvernight = Boolean(
    offer.isOvernight ||
    (offer.pickupTime && offer.returnTime && offer.pickupTime.includes('PM') && offer.returnTime.includes('AM'))
  );
  const pickupTime = offer.pickupTime || '08:00 PM';
  const returnTime = offer.returnTime || '08:00 AM';

  const appliedCode = claimData?.couponCode || claimData?.claimToken || offer.code || 'SPECIALDEAL';

  // A deal on specific cars shows the chosen car's own photo; a deal on all cars uses its banner, then any fleet photo.
  const forSpecificCars = !offer.allVehicles && offer.applicableType !== 'all';
  const imageUrl =
    (forSpecificCars ? imageOf(selectedVehicle?.carObj) : null) ||
    offer.image?.url ||
    offer.image?.uri ||
    imageOf(selectedVehicle?.carObj) ||
    imageOf(vehicles[0]);

  // ---------- Actions ----------
  const goToMembership = () => {
    onClose();
    router.push('/membership');
  };

  const handleClaim = async () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    if (!isTierEligible) {
      goToMembership();
      return;
    }

    setClaiming(true);
    setClaimError(null);
    try {
      const res = await claimExclusiveOffer(offerId!);
      if (res.success && res.claim) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setClaimData(res.claim);
        onClaimSuccess?.(res.claim);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setClaimError(res.message || 'This offer couldn’t be claimed right now.');
      }
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setClaimError(err?.message || 'Something went wrong. Please try again.');
    } finally {
      setClaiming(false);
    }
  };

  const handleProceedToBooking = async (justLoggedIn = false) => {
    if (checking) return;
    if (appliedCode) applyCoupon(appliedCode);

    const car = selectedVehicle?.carObj || vehicles[0];
    if (car) selectCar(car);

    const today = new Date();
    const tomorrow = new Date(today.getTime() + 24 * 3600 * 1000);
    const range = `${today.getDate()} ${MONTHS_SHORT[today.getMonth()]} – ${tomorrow.getDate()} ${MONTHS_SHORT[tomorrow.getMonth()]}`;
    let tripRange = dateRange;

    // Staff decided rental period prefill
    if (offer.rentalStartDate && offer.rentalEndDate) {
      const sDate = new Date(offer.rentalStartDate);
      const eDate = new Date(offer.rentalEndDate);
      const travelRange = `${sDate.getDate()} ${MONTHS_SHORT[sDate.getMonth()]} – ${eDate.getDate()} ${MONTHS_SHORT[eDate.getMonth()]}`;
      const daysCount = offer.rentalDays || Math.max(1, Math.round((eDate.getTime() - sDate.getTime()) / 86400000));
      setDates(travelRange, `${daysCount} ${daysCount === 1 ? 'Day' : 'Days'}`);
      setTimes(offer.rentalStartTime || pickupTime, offer.rentalEndTime || returnTime);
      tripRange = travelRange;
    } else if (offer.rentalDays && offer.rentalDays > 1) {
      const daysCount = offer.rentalDays;
      const endD = new Date(today.getTime() + daysCount * 24 * 3600 * 1000);
      const travelRange = `${today.getDate()} ${MONTHS_SHORT[today.getMonth()]} – ${endD.getDate()} ${MONTHS_SHORT[endD.getMonth()]}`;
      setDates(travelRange, `${daysCount} Days`);
      setTimes(offer.rentalStartTime || pickupTime, offer.rentalEndTime || returnTime);
      tripRange = travelRange;
    } else if (isOvernight || (offer.pickupTime && offer.returnTime)) {
      setDates(range, '1 Day');
      setTimes(pickupTime, returnTime);
      tripRange = range;
    } else if (!dateRange || dateRange.includes('Select')) {
      setDates(range, '1 Day');
      setTimes('08:00 AM', '08:00 AM');
      tripRange = range;
    }

    if (!dropoff?.name) {
      setDropoff({
        id: 'city_trip',
        name: 'Local City Trip',
        address: 'City limits / Self-drive destination',
        latitude: 26.1412,
        longitude: 91.7645,
        source: 'database',
      });
    }
    if (!pickup?.name) {
      setPickup({
        id: 'hub_pickup',
        name: MYSAWARI_HUB_NAME,
        address: 'MySawari Hub, Kahilipara',
        latitude: 26.1412,
        longitude: 91.7645,
        source: 'database',
      });
    }

    const carId = car ? String(car.id || car._id) : '';

    // A deal for specific car(s): if the car is free for the trip, skip the car page and go to checkout.
    if (!offer.allVehicles && offer.applicableType !== 'all' && car && carId) {
      // right after logging in, the screen has not re-rendered with the new session yet
      if (!isAuthenticated && !justLoggedIn) {
        setShowLogin(true);
        return;
      }
      setChecking(true);
      try {
        // The list can be a little old, so the car's bookings are read fresh from the server first.
        const live = await API.getVehicleAvailability(carId).catch(() => null);
        const liveCar = live ? { ...car, bookedRanges: live.bookedRanges, dbStatus: live.status || car.dbStatus, maintenanceUntil: live.maintenanceUntil } : car;
        const [startLabel, endLabel] = splitDateRange(tripRange);
        if (getAvailability(liveCar, startLabel, endLabel).available) {
          onClose();
          router.push({ pathname: '/booking', params: { couponCode: appliedCode || '', isOvernight: isOvernight ? 'true' : 'false' } });
          return;
        }
      } finally {
        setChecking(false);
      }
      // Not free for these dates: the car page shows when it is next available and lets them change dates.
    }

    onClose();
    router.push({
      pathname: '/car-details',
      params: {
        id: carId,
        vehicleId: carId,
        promoCode: appliedCode || '',
        offerId: offerId || '',
        isOvernight: isOvernight ? 'true' : 'false',
        pickupTime,
        returnTime,
      },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close offer" />

        <View style={[styles.sheet, { backgroundColor: p.page }]}>
          {/* Grabber indicator */}
          <View style={styles.grabber} />

          {/* Close button */}
          <TouchableOpacity
            onPress={onClose}
            style={styles.closeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityLabel="Close"
          >
            <Feather name="x" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} bounces={false}>
            {/* ---------- Clean Hero Image ---------- */}
            <View style={styles.hero}>
              {imageUrl ? (
                <Image
                  source={typeof imageUrl === 'string' ? { uri: imageUrl } : imageUrl}
                  style={StyleSheet.absoluteFill}
                  resizeMode="cover"
                />
              ) : (
                <View style={[StyleSheet.absoluteFill, styles.heroFallback]}>
                  <Ionicons name="car-sport" size={56} color={ACCENT} />
                </View>
              )}
              <View style={styles.heroScrim} />

              {/* Single floating tag */}
              <View style={styles.heroTags}>
                <View style={[styles.heroTag, { backgroundColor: isOvernight ? '#4B5A9E' : offer.allVehicles ? '#059669' : ACCENT }]}>
                  {isOvernight ? (
                    <Feather name="moon" size={12} color="#FFFFFF" />
                  ) : offer.allVehicles ? (
                    <Ionicons name="car-sport" size={12} color="#FFFFFF" />
                  ) : (
                    <Feather name="tag" size={12} color="#FFFFFF" />
                  )}
                  <Text style={styles.heroTagText}>
                    {isOvernight
                      ? '🌙 Overnight (8 PM – 8 AM)'
                      : offer.allVehicles
                      ? '🚗 All Fleet Cars Eligible'
                      : '⚡ Exclusive offer'}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.body}>
              {/* ---------- Title & Subtitle ---------- */}
              <Text style={[styles.title, { color: p.fg }]}>{offer.title}</Text>
              {offer.subtitle ? (
                <Text style={[styles.subtitle, { color: p.sub }]}>{offer.subtitle}</Text>
              ) : null}

              {eligibilityNote ? (
                <View style={[styles.eligibility, { backgroundColor: isTierEligible ? ACCENT_TINT : DANGER_TINT }]}>
                  <Ionicons name={isTierEligible ? 'star' : 'lock-closed'} size={13} color={isTierEligible ? ACCENT : DANGER} />
                  <Text style={[styles.eligibilityText, { color: isTierEligible ? ACCENT : DANGER }]}>
                    {eligibilityNote}
                  </Text>
                </View>
              ) : null}

              {/* ---------- Specific Deal Validity & Activation Schedule Card ---------- */}
              <View style={[styles.validityCard, { backgroundColor: p.soft, borderColor: p.border }]}>
                <View style={styles.validityCardHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Feather name="calendar" size={14} color="#323E71" />
                    <Text style={[styles.validityCardTitle, { color: p.fg }]}>Offer Validity Schedule</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: isEnded ? '#FEE2E2' : isUpcoming ? '#EDE9FE' : '#DCFCE7' }]}>
                    <Text style={[styles.statusPillText, { color: isEnded ? '#DC2626' : isUpcoming ? '#323E71' : '#059669' }]}>
                      {isEnded ? 'EXPIRED' : isUpcoming ? 'UPCOMING' : 'ACTIVE NOW'}
                    </Text>
                  </View>
                </View>

                <View style={styles.validityGrid}>
                  <View style={styles.validityCol}>
                    <Text style={[styles.validityColLabel, { color: p.sub }]}>ACTIVATES FROM</Text>
                    <Text style={[styles.validityColVal, { color: p.fg }]}>
                      {offer.startDate ? formatOfferDateTime(offer.startDate, offer.startTime) : 'Active Now'}
                    </Text>
                  </View>
                  <View style={[styles.validityColDivider, { backgroundColor: p.border }]} />
                  <View style={styles.validityCol}>
                    <Text style={[styles.validityColLabel, { color: p.sub }]}>VALID UP TO</Text>
                    <Text style={[styles.validityColVal, { color: p.fg }]}>
                      {offer.expiryDate ? formatOfferDateTime(offer.expiryDate, offer.endTime) : 'Ongoing'}
                    </Text>
                  </View>
                </View>

                {timeLeft && !isEnded ? (
                  <View style={[styles.timeLeftRow, { backgroundColor: timeLeft.urgent ? '#FEF2F2' : '#F8FAFC' }]}>
                    <Feather name="clock" size={12} color={timeLeft.urgent ? '#DC2626' : '#323E71'} />
                    <Text style={[styles.timeLeftRowText, { color: timeLeft.urgent ? '#DC2626' : '#323E71' }]}>
                      {isUpcoming ? 'Offer activates soon' : timeLeft.text}
                    </Text>
                  </View>
                ) : null}
              </View>

              {/* ---------- Unified Deal Summary Card (Clean & Proper) ---------- */}
              <View style={[styles.dealSummaryCard, { backgroundColor: p.soft, borderColor: p.border }]}>
                {/* Price Row */}
                <View style={styles.dealPriceHeader}>
                  <View>
                    <Text style={[styles.dealPriceLabel, { color: p.sub }]}>Deal Rate</Text>
                    <View style={styles.dealPriceRow}>
                      <Text style={styles.dealPriceValue}>
                        {formatCurrency(dealPrice)}
                      </Text>
                      <Text style={[styles.dealPriceUnit, { color: p.sub }]}>{pricingUnit}</Text>
                      {originalPrice != null && originalPrice > dealPrice ? (
                        <Text style={styles.dealPriceOriginal}>{formatCurrency(originalPrice)}</Text>
                      ) : null}
                    </View>
                  </View>
                  {savings ? (
                    <View style={styles.saveBadge}>
                      <Text style={styles.saveBadgeText}>SAVE {formatCurrency(savings)}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={[styles.dealDivider, { backgroundColor: p.border }]} />

                {/* 3 Clean Deal Specs Rows */}
                <View style={styles.dealSpecsList}>
                  {/* Rental Handover Timing */}
                  <View style={styles.dealSpecItem}>
                    <View style={[styles.specIconBox, { backgroundColor: '#E8EBF4' }]}>
                      <Feather name="clock" size={14} color="#323E71" />
                    </View>
                    <View style={styles.specContent}>
                      <Text style={[styles.specTitle, { color: p.fg }]}>
                        {(() => {
                          if (offer.rentalStartDate && offer.rentalEndDate) {
                            const rs = new Date(offer.rentalStartDate);
                            const re = new Date(offer.rentalEndDate);
                            const rsStr = rs.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                            const reStr = re.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
                            const tStart = offer.rentalStartTime || offer.pickupTime || '09:00 AM';
                            const tEnd = offer.rentalEndTime || offer.returnTime || '09:00 AM';
                            const dDays = offer.rentalDays || Math.max(1, Math.round((re.getTime() - rs.getTime()) / 86400000));
                            return `${rsStr}, ${tStart} → ${reStr}, ${tEnd} (${dDays} ${dDays === 1 ? 'Day' : 'Days'})`;
                          }
                          if (offer.rentalDays && offer.rentalDays > 1) {
                            return `${offer.rentalDays} Days Rental · Pickup ${offer.pickupTime || '09:00 AM'} / Return ${offer.returnTime || '09:00 AM'}`;
                          }
                          if (isOvernight) {
                            return `Tonight ${pickupTime} → Tomorrow ${returnTime} (12 Hours)`;
                          }
                          if (offer.pickupTime && offer.returnTime) {
                            return `Handover: ${offer.pickupTime} → Return: ${offer.returnTime}`;
                          }
                          return 'Flexible 24-Hour Rental Cycle';
                        })()}
                      </Text>
                      <Text style={[styles.specSub, { color: p.sub }]}>
                        {(() => {
                          if (offer.rentalPeriodLabel) return offer.rentalPeriodLabel.replace(/\s*(→|->|➔|➜)\s*/g, ' to ');
                          if (offer.rentalStartDate && offer.rentalEndDate) return 'Decided rental travel period for this offer';
                          if (offer.rentalDays && offer.rentalDays > 1) return `Fixed ${offer.rentalDays}-day self-drive rental duration`;
                          if (isOvernight) return 'Specific overnight car handover timing';
                          if (offer.timeSlotLabel) return offer.timeSlotLabel;
                          return 'Standard rental pickup and return window';
                        })()}
                      </Text>
                    </View>
                  </View>

                  {/* Vehicles */}
                  <View style={styles.dealSpecItem}>
                    <View style={[styles.specIconBox, { backgroundColor: '#DCFCE7' }]}>
                      <Ionicons name="car-sport" size={14} color="#059669" />
                    </View>
                    <View style={styles.specContent}>
                      <Text style={[styles.specTitle, { color: p.fg }]}>
                        {offer.allVehicles
                          ? 'Valid on all fleet cars'
                          : selectedVehicle?.vehicleName || 'Applicable car selected'}
                      </Text>
                      <Text style={[styles.specSub, { color: p.sub }]}>
                        {offer.allVehicles
                          ? 'Choose any car you like'
                          : `${vehiclesList.length} car option(s) available`}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* ---------- Vehicle Picker (If multiple cars) ---------- */}
              {vehiclesList.length > 1 ? (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={[styles.sectionTitle, { color: p.fg }]}>Select Car</Text>
                    <Text style={[styles.sectionCount, { color: p.sub }]}>{vehiclesList.length} cars</Text>
                  </View>

                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.vehicleRow}
                    style={styles.vehicleScroller}
                  >
                    {vehiclesList.map((item) => {
                      const isSelected = item.vehicleId === selectedVehicle?.vehicleId;
                      return (
                        <TouchableOpacity
                          key={item.vehicleId}
                          onPress={() => setSelectedVehicleId(item.vehicleId)}
                          activeOpacity={0.85}
                          style={[
                            styles.vehicleCard,
                            { backgroundColor: isSelected ? ACCENT_TINT : p.soft, borderColor: isSelected ? ACCENT : p.border },
                          ]}
                        >
                          {isSelected ? (
                            <View style={styles.vehicleCheck}>
                              <Feather name="check" size={11} color="#FFFFFF" />
                            </View>
                          ) : null}

                          {item.image ? (
                            <Image
                              source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                              style={styles.vehicleThumb}
                              resizeMode="contain"
                            />
                          ) : (
                            <View style={styles.vehicleThumb}>
                              <Ionicons name="car-sport-outline" size={28} color={p.sub} />
                            </View>
                          )}

                          <Text style={[styles.vehicleName, { color: p.fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                            {item.vehicleName}
                          </Text>
                          <Text style={styles.vehicleDeal}>
                            {formatCurrency(item.dealPrice ?? dealPrice)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              ) : null}

              {/* ---------- Terms Note (Clean & subtle) ---------- */}
              <TouchableOpacity
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setShowTerms((prev) => !prev);
                }}
                style={styles.termsToggle}
                activeOpacity={0.7}
              >
                <Feather name="info" size={13} color={p.sub} />
                <Text style={[styles.termsToggleText, { color: p.sub }]}>
                  {showTerms ? 'Hide terms & conditions' : 'View terms & conditions'}
                </Text>
                <Feather name={showTerms ? 'chevron-up' : 'chevron-down'} size={14} color={p.sub} />
              </TouchableOpacity>

              {showTerms ? (
                <View style={[styles.termsBox, { backgroundColor: p.soft, borderColor: p.border }]}>
                  <Text style={[styles.termsText, { color: p.sub }]}>
                    {offer.description ||
                      'Rate covers base vehicle rental. Security deposit, fuel, and optional doorstep delivery are added at checkout.'}
                  </Text>
                </View>
              ) : null}
            </View>
          </ScrollView>

          {/* ---------- Clean Sticky Footer ---------- */}
          <View
            style={[
              styles.footer,
              { borderTopColor: p.border, backgroundColor: p.page, paddingBottom: Math.max(insets.bottom, 16) },
            ]}
          >
            {claimError ? (
              <View style={[styles.footerNotice, { backgroundColor: DANGER_TINT }]}>
                <Feather name="alert-circle" size={14} color={DANGER} />
                <Text style={[styles.footerNoticeText, { color: DANGER }]}>{claimError}</Text>
              </View>
            ) : null}

            <View style={styles.footerRow}>
              <View style={styles.footerPrice}>
                <Text style={[styles.footerPriceValue, { color: p.fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {formatCurrency(dealPrice)}
                  <Text style={{ fontSize: 13, fontWeight: '500', color: p.sub }}>{pricingUnit}</Text>
                </Text>
                <Text style={[styles.footerPriceSub, { color: p.sub }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
                  {selectedVehicle?.vehicleName || 'Special rate'}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => handleProceedToBooking()}
                activeOpacity={0.88}
                style={[styles.cta, { backgroundColor: isEnded ? p.sub : ACCENT }]}
                disabled={isEnded}
              >
                {claiming || checking ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.ctaText}>{offer.allVehicles ? 'Book This Deal' : 'Book Now'}</Text>
                    <Feather name="arrow-right" size={17} color="#FFFFFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <LoginBottomSheet
        visible={showLogin}
        onClose={() => setShowLogin(false)}
        onLoginSuccess={() => { setShowLogin(false); handleProceedToBooking(true); }}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 6, 24, 0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '92%',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  grabber: {
    position: 'absolute',
    top: 8,
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.7)',
    zIndex: 2,
  },
  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(20, 16, 48, 0.6)',
    zIndex: 3,
  },

  // Hero
  hero: {
    height: 190,
    justifyContent: 'flex-end',
    backgroundColor: '#1F2747',
  },
  heroFallback: {
    backgroundColor: ACCENT_TINT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  heroTags: {
    flexDirection: 'row',
    padding: 14,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroTagText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },

  body: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13.5,
    lineHeight: 20,
    marginTop: 4,
  },
  eligibility: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 10,
  },
  eligibilityText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Deal Summary Card
  dealSummaryCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  dealPriceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  dealPriceLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  dealPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginTop: 2,
  },
  dealPriceValue: {
    fontSize: 28,
    fontWeight: '800',
    color: SUCCESS,
  },
  dealPriceUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  dealPriceOriginal: {
    fontSize: 14,
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  saveBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  saveBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  dealDivider: {
    height: 1,
    marginVertical: 14,
  },
  dealSpecsList: {
    gap: 12,
  },
  dealSpecItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  specIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  specContent: {
    flex: 1,
  },
  specTitle: {
    fontSize: 13.5,
    fontWeight: '700',
  },
  specSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  codePill: {
    backgroundColor: '#E8EBF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#D5D9EA',
  },
  codePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#323E71',
    letterSpacing: 0.5,
  },

  // Vehicle Picker
  section: {
    marginTop: 18,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  sectionCount: {
    fontSize: 12,
  },
  vehicleScroller: {
    marginHorizontal: -20,
  },
  vehicleRow: {
    gap: 10,
    paddingHorizontal: 20,
  },
  vehicleCard: {
    width: 130,
    borderRadius: 12,
    borderWidth: 1.5,
    padding: 10,
  },
  vehicleCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  vehicleThumb: {
    width: '100%',
    height: 52,
    marginBottom: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleName: {
    fontSize: 12.5,
    fontWeight: '600',
  },
  vehicleDeal: {
    fontSize: 13,
    fontWeight: '800',
    color: SUCCESS,
    marginTop: 2,
  },

  // Terms toggle
  termsToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 6,
  },
  termsToggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  termsBox: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginTop: 6,
  },
  termsText: {
    fontSize: 12,
    lineHeight: 18,
  },

  // Footer
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  footerNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginBottom: 8,
  },
  footerNoticeText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  footerPrice: {
    flexShrink: 1,
    maxWidth: '45%',
  },
  footerPriceValue: {
    fontSize: 20,
    fontWeight: '800',
  },
  footerPriceSub: {
    fontSize: 11.5,
    marginTop: 1,
  },
  cta: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  validityCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  validityCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  validityCardTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  validityGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  validityCol: {
    flex: 1,
  },
  validityColDivider: {
    width: 1,
    height: 32,
    marginHorizontal: 10,
  },
  validityColLabel: {
    fontSize: 9.5,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  validityColVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  timeLeftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 2,
  },
  timeLeftRowText: {
    fontSize: 11,
    fontWeight: '600',
  },
});