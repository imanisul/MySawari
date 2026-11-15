import { useCallback, useMemo } from 'react';
import { useRouter } from 'expo-router';
import * as Haptics from '@/utils/haptics';
import { MYSAWARI_HUB_NAME } from '@/services/backend/pricingEngine';
import { useQuery } from '@tanstack/react-query';
import { useSawari } from '@/context/SawariContext';
import { useVehicles } from '@/hooks/useVehicles';
import { exclusiveOffersQueryOptions } from '@/services/api/offers';
import { todayDayNum, isInService, buildBlocks, toDayNum, dayNumAndTimeToMs, parseDayLabel, getIndiaDateParts, dayNumToLabel, formatTime12 } from '@/utils/sawari';

/** Helper to parse ISO date strings or day labels like '15 Nov' to Indian timestamp ms */
function parseCustomDateToMs(val: any, defaultTime = '08:00 AM'): number | null {
  if (!val) return null;
  if (val instanceof Date) return val.getTime();
  if (typeof val === 'number') return val;
  if (typeof val !== 'string') return null;
  const s = val.trim();
  if (!s || s.toLowerCase() === 'available now') return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const parts = s.split('-').map(Number);
    const dayNum = toDayNum(parts[0], parts[1] - 1, parts[2]);
    return dayNumAndTimeToMs(dayNum, defaultTime);
  }

  const parsed = Date.parse(s);
  if (!isNaN(parsed)) {
    return parsed;
  }

  const dayNum = parseDayLabel(s);
  if (dayNum !== null) {
    return dayNumAndTimeToMs(dayNum, defaultTime);
  }
  return null;
}

/**
 * A Top Deal charges the car's hourly rate for the hours left (never more than its day rate): the offer's hourly
 * rate, else day rate / 24 (at least ₹50). The server prices the booking with the same rule ("TOPDEAL-<hours>").
 */
export function dealPricing(car: any, hours: number) {
  const perDay = Number(car.perDay || car.pricePerDay || 0);
  const offerRate = Number(car.offer?.hourlyRate) || 0;
  const rate = offerRate > 0 ? offerRate : Math.max(50, Math.round(perDay / 24));
  return { perDay, rate, price: Math.min(perDay || Infinity, rate * hours) };
}

/** Cars and bikes free from now (or when their current booking ends) until 8 AM: the Today's Deals list. */
export function useDealCars(nowMs: number) {
  const { data: vehicles = [], isLoading } = useVehicles();
  const { data: offers = [] } = useQuery(exclusiveOffersQueryOptions);
  const { membership } = useSawari();
  const isMember = Boolean(
    membership?.plan &&
      membership.plan.toLowerCase() !== 'none' &&
      (!membership.expiresAt || new Date(membership.expiresAt) > new Date())
  );
  // Target end time: Today's gap slot runs until 8:00 AM tomorrow (or 8:00 AM today if past midnight) in Indian Standard Time
  const targetEndMs = useMemo(() => {
    const p = getIndiaDateParts(nowMs);
    const today = toDayNum(p.year, p.month, p.date);
    if (p.hours < 8) {
      return dayNumAndTimeToMs(today, '08:00 AM', 480);
    } else {
      return dayNumAndTimeToMs(today + 1, '08:00 AM', 480);
    }
  }, [Math.floor(nowMs / 60000)]);

  // Cars free for the whole deal window (now → 8 AM tomorrow)
  const dealCars = useMemo(() => {
    if (!vehicles || vehicles.length === 0) return [];

    // Map offers configured from Operation App
    // The lowest positive hourly rate a live top-deal offer sets for a car — the server picks the same one.
    const offerMap = new Map<string, any>();
    const setOffer = (vid: string, o: any) => {
      const cur = offerMap.get(vid);
      const rate = Number(o.hourlyRate) || 0;
      if (!cur || (rate > 0 && (!(Number(cur.hourlyRate) > 0) || rate < Number(cur.hourlyRate)))) offerMap.set(vid, o);
    };
    offers.forEach((o: any) => {
      if (o.isTopDeal || o.type === 'top_deal' || o.isExclusive || o.position === 'exclusive') {
        if (o.vehicleId) {
          setOffer(String(typeof o.vehicleId === 'object' ? o.vehicleId._id || o.vehicleId.id : o.vehicleId), o);
        }
        if (Array.isArray(o.applicableVehicleIds)) {
          o.applicableVehicleIds.forEach((vid: any) => setOffer(String(vid), o));
        }
      }
    });

    const gapOf = (v: any) => {
      // The car's free gap inside the deal window: from now until its next booking.
      // A booking saved without a pickup time starts at the default 8:00 AM (its bare date would read as 5:30 AM in IST).
      const withPickup = { ...v, bookedRanges: (v.bookedRanges || []).map((r: any) => (r.pickupTime ? r : { ...r, pickupTime: '8:00 AM' })) };
      const blocks = buildBlocks(withPickup, todayDayNum()).filter((b) => Number.isFinite(b.startMs)).sort((a, b) => a.startMs - b.startMs);

      // Busy now? The deal starts when the current booking(s) end, rounded up to the next whole hour.
      let start = Math.floor(nowMs / 60000) * 60000;
      for (const b of blocks) if (b.startMs <= start && b.endMs > start) start = b.endMs;
      if (start > nowMs) start = Math.ceil(start / 3600000) * 3600000;

      const vid = String(v.id || v._id);
      const offer = offerMap.get(vid);

      // Check membership 10-minute early access on offers from Operation App
      if (offer) {
        const earlyHours = Number(offer.notificationCampaign?.memberEarlyAccessHours || offer.memberEarlyAccessHours) || 0;
        if (earlyHours > 0) {
          const earlyMs = earlyHours * 3600 * 1000;
          const createdMs = offer.createdAt ? new Date(offer.createdAt).getTime() : 0;
          if (!isMember && createdMs > 0 && (nowMs - createdMs) < earlyMs) {
            // Non-members don't get access during 10-minute early access period
            return null;
          }
        }
      }

      // Next booking that starts after the free gap begins
      const next = blocks.find((b) => b.startMs >= start);
      let dealEndMs = next ? next.startMs : Infinity;

      // Also check vehicle's availableToDate limit
      const availToMs = parseCustomDateToMs(v.availableToDate, '08:00 AM');
      if (availToMs && availToMs > start && availToMs < dealEndMs) {
        dealEndMs = availToMs;
      }

      // Also check offer-specific return time/date if configured in Operation App
      if (offer) {
        if (offer.rentalEndDate && (offer.rentalEndTime || offer.returnTime)) {
          const oMs = parseCustomDateToMs(offer.rentalEndDate, offer.rentalEndTime || offer.returnTime);
          if (oMs && oMs > start && oMs < dealEndMs) {
            dealEndMs = oMs;
          }
        }
      }

      // Today's Deal slot ends at 8:00 AM tomorrow (or at the car's next booking if at/before 8:00 AM)
      if (!Number.isFinite(dealEndMs) || dealEndMs > targetEndMs) {
        dealEndMs = targetEndMs;
      }

      const end = Math.floor(dealEndMs / 60000) * 60000;
      // If the next booking starts at 8:00 AM tomorrow, this car is available today till 8:00 AM!
      const hasBookingAt8AM = Boolean(next && Math.abs(next.startMs - targetEndMs) <= 60 * 60 * 1000);
      const freeUntil = Math.min(next ? next.startMs : Infinity, availToMs && availToMs > start ? availToMs : Infinity);
      const canExtend = !hasBookingAt8AM && freeUntil >= targetEndMs + 24 * 3600 * 1000;

      // Cars must be available from now until 8:00 AM tomorrow (minimum 1 hour gap)
      const isAvailableTill8AM = end >= Math.floor((targetEndMs - 5 * 60 * 1000) / 60000) * 60000;
      if (!isAvailableTill8AM) return null;
      if (end - start < 3600 * 1000) return null;

      return { start, end, canExtend, hasBookingAt8AM };
    };

    const filtered = vehicles.map((v: any) => ({ v, gap: gapOf(v) })).filter(({ v, gap }: any) => {
      if (!gap) return false;
      if (isInService(v)) return false;
      const st = String(v.dbStatus || v.status || '').toLowerCase().trim();
      // Only workshop / maintenance blocks a vehicle entirely.
      // If a vehicle is booked starting tomorrow at 8:00 AM, it is available today till 8:00 AM and must be shown!
      if (
        st === 'service' ||
        st === 'maintenance' ||
        st === 'under_maintenance'
      ) {
        return false;
      }

      return true;
    });

    return filtered.sort((x: any, y: any) => x.gap.start - y.gap.start).map(({ v, gap }: any) => {
      const vid = String(v.id || v._id);
      const offer = offerMap.get(vid);
      return {
        ...v,
        hourlyRate: offer?.hourlyRate,
        dealPrice: offer?.dealPrice,
        dealStartMs: gap.start,
        dealEndMs: gap.end,
        canExtend: gap.canExtend,
        hasBookingAt8AM: gap.hasBookingAt8AM,
        offer,
      };
    });
  }, [vehicles, offers, targetEndMs, isMember, Math.floor(nowMs / 60000)]);

  return { dealCars, targetEndMs, isLoading, isMember };
}

/**
 * Opening a Today's Deal (from the deals page or the Home card): the trip is filled in for the customer — the car,
 * its hours from when it is free (or now) to the deal's end, dates, times, hub pickup / city trip if none chosen, and
 * the hourly price as a TOPDEAL-<hours> coupon the server prices itself — then the car's page with the dates locked.
 */
export function useOpenTopDeal() {
  const router = useRouter();
  const { selectCar, applyCoupon, setDates, setTimes, setIsDeliveryRequested, pickup, dropoff, setPickup, setDropoff } = useSawari();
  return useCallback((car: any, targetEndMs: number, nowMs = Date.now()) => {
    Haptics.selectionAsync();
    const startMs = (car.dealStartMs || 0) > nowMs ? car.dealStartMs : Math.floor(nowMs / 60000) * 60000; // whole minutes, as booked
    const endMs = car.dealEndMs || targetEndMs;
    const hours = Math.max(1, Math.ceil(Math.max(0, endMs - startMs) / (3600 * 1000)));
    const { rate, price } = dealPricing(car, hours);
    selectCar({ ...car, hourlyRate: rate });
    applyCoupon(`TOPDEAL-${hours}`);

    const dayLabel = (ms: number) => {
      const p = getIndiaDateParts(ms);
      return dayNumToLabel(toDayNum(p.year, p.month, p.date));
    };
    const pickupLabel = formatTime12(startMs);
    const returnLabel = formatTime12(endMs);
    setDates(`${dayLabel(startMs)} – ${dayLabel(endMs)}`, '1 Day');
    setTimes(pickupLabel, returnLabel);
    setIsDeliveryRequested(false);
    if (!pickup?.name) {
      setPickup({ id: 'hub_pickup', name: MYSAWARI_HUB_NAME, address: 'MySawari Hub, Kahilipara', latitude: 26.1412, longitude: 91.7645, source: 'database' });
    }
    if (!dropoff?.name) {
      setDropoff({ id: 'city_trip', name: 'Local City Trip', address: 'City limits / Self-drive destination', latitude: 26.1412, longitude: 91.7645, source: 'database' });
    }

    router.push({
      pathname: '/car-details',
      params: {
        id: String(car.id || car._id),
        vehicleId: String(car.id || car._id),
        lockDates: 'true',
        isFixedDates: 'true',
        isTopDeal: 'true',
        pickupTime: pickupLabel,
        returnTime: returnLabel,
        dealPrice: String(price), // the quote applies the member discount itself
        hourlyPrice: String(rate),
        rentalHours: String(hours),
      },
    });
  }, [router, selectCar, applyCoupon, setDates, setTimes, setIsDeliveryRequested, pickup, dropoff, setPickup, setDropoff]);
}
