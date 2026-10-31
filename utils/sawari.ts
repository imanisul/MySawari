import { ImageSourcePropType } from 'react-native';

export type Category = 'All' | 'SUV' | 'Sedan' | 'Hatchback' | 'MUV' | 'Luxury' | 'Off-road' | 'Bike';
export type DriverMode = 'Self Drive' | 'With Driver';

export interface LocationResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  source: 'database' | 'osm' | 'gps';
}

export type Car = {
  type: "Car" | "Bike";
  id: string;
  name: string;
  displayName?: string;
  vehicleName?: string;
  category: Exclude<Category, 'All'>;
  price: string;
  perDay: number;
  pricePerDay?: number;
  image: ImageSourcePropType;
  seats: string;
  transmission: string;
  fuel: string;
  mileage?: string;
  availabilityDate?: string;
  availableToDate?: string;
  availabilityRange?: {
    start: string;
    end?: string;
  };

  // DB fields
  manufacturer?: string;
  model?: string;
  variant?: string;
  color?: string;
  registrationYear?: string;
  vehicleNumber?: string;

  // Enriched specs (from knowledge base)
  engine?: string;
  bootSpace?: string;
  groundClearance?: string;
  kerbWeight?: string;
  airbags?: string;
  tankCapacity?: string;
  topSpeed?: string;
  acceleration?: string;
  tyreSize?: string;
  brakes?: string;
  highlights?: string[];

  // New UI features
  images?: ImageSourcePropType[];
  rating?: number;
  reviewCount?: number;
  description?: string;
  features?: string[];
  // DB Specifications & Safety
  ac?: boolean;
  carPlay?: boolean;
  bluetooth?: boolean;
  touchscreen?: boolean;
  usbCharging?: boolean;
  sunroof?: boolean;
  airbagsEquipped?: boolean;
  absEbd?: boolean;
  rearParkingSensors?: boolean;
  rearCamera?: boolean;
  gps?: boolean;
  digitalDisplay?: boolean;
  bikeAbs?: boolean;
  discBrakes?: boolean;
  cbs?: boolean;
  safetyFeatures?: string[];
  techFeatures?: string[];
  comfortFeatures?: string[];
  luggage?: string;
  doors?: string;
  modelYear?: string;
  ratingDistribution?: RatingDistribution;
  reviews?: Review[];
  isAvailable?: boolean;
  isPublic?: boolean;
  dbStatus?: string;
  /** Open bookings holding this vehicle (ISO dates, calendar day = UTC date). */
  bookedRanges?: { start: string; end: string; status?: string }[];
  /** When a vehicle in service is due back (ISO), if known. */
  maintenanceUntil?: string | null;
  /** Availability for the dates the user is currently looking at. */
  availability?: AvailabilityInfo;
};

export interface AvailabilityInfo {
  available: boolean;
  /** The date the availability check starts from (either selected date or today). */
  startDate?: string;
  /** Short uppercase text for the card badge, e.g. "AVAILABLE NOW · FREE TILL 22 SEP". */
  label: string;
  /** The one status line for the trip being viewed, e.g. "Available for 20 Sep – 21 Sep" or "Available now". */
  headline: string;
  /**
   * When available: the whole free window from the start date to the day before the next booking or
   * service block, e.g. "Available 20 Sep – 5 Nov", or "Available from 20 Sep" when nothing follows.
   */
  rangeHeadline?: string;
  /**
   * Optional secondary line that never contradicts the headline:
   * "Continuously available until 5 Nov" (when a booking follows) or
   * "Next available 25 Sep" (when unavailable). Empty when there is nothing to add.
   */
  detail: string;
  /** Why it is unavailable. */
  reason?: 'booked' | 'service' | 'rented';
  /** First day the vehicle is free for the requested length of stay (only when unavailable). */
  nextAvailableFrom?: string;
  /** Last free day before the next booking (only when available and a booking follows). */
  freeUntil?: string;
}

/**
 * Only reviews with at least this many stars are shown in the app (reviews,
 * rating summary and the guest photo gallery). Lower-rated feedback is still
 * sent to the team, it just isn't displayed publicly.
 */
export const MIN_PUBLIC_REVIEW_RATING = 4;

export interface RatingDistribution {
  5: number;
  4: number;
  3: number;
  2: number;
  1: number;
}

export interface Review {
  id: string;
  userName: string;
  rating: number;
  text: string;
  date: string;
  isVerified: boolean;
  /** Where the customer travelled on this trip. */
  placeVisited?: string;
  /** Trip photos (Cloudinary URLs). */
  images?: string[];
}

const today = new Date();
export const getDynamicDate = (offset: number) => {
  const d = new Date(today);
  d.setDate(today.getDate() + offset);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export const categories: Category[] = ['All', 'SUV', 'Sedan', 'Hatchback', 'MUV', 'Luxury', 'Bike'];

/**
 * "Good for" tags derived only from a vehicle's own real attributes
 * (category / transmission / seats / fuel) — never invented copy.
 */
export function getCarHighlights(car: Pick<Car, 'category' | 'transmission' | 'seats' | 'fuel'>): string[] {
  const tags: string[] = [];
  const add = (tag: string) => { if (!tags.includes(tag)) tags.push(tag); };

  switch (car.category) {
    case 'SUV':
      add('Family trips');
      add('Highway travel');
      break;
    case 'MUV':
      add('Family trips');
      add('Group travel');
      break;
    case 'Sedan':
      add('City driving');
      add('Comfortable long drives');
      break;
    case 'Hatchback':
      add('City driving');
      add('Easy parking');
      break;
    case 'Luxury':
      add('Special occasions');
      add('Comfortable long drives');
      break;
    case 'Off-road':
      add('Off-road adventures');
      add('Hilly terrain');
      break;
    case 'Bike':
      add('City commute');
      add('Quick errands');
      break;
  }

  const seatCount = parseInt(car.seats, 10);
  if (!isNaN(seatCount) && seatCount >= 6) add('Family trips');

  if (car.transmission === 'Automatic') add('Easy city driving');
  if (car.fuel === 'EV') add('Eco-friendly trips');

  return tags.slice(0, 4);
}

/** The one-word "Best for …" tag on the photo (design: "Best for Comfort"), from the vehicle's own details. */
export function bestFor(car: Pick<Car, 'category' | 'type' | 'transmission' | 'seats' | 'fuel'>): string | null {
  const fuel = String(car.fuel || '').toLowerCase();
  if (car.type === 'Bike' || car.category === 'Bike') {
    if (fuel === 'ev' || fuel.includes('electric')) return 'Eco Rides';
    return car.transmission === 'Automatic' ? 'City Rides' : 'Long Rides';
  }
  if (fuel === 'ev' || fuel.includes('electric')) return 'Eco Trips';
  const seats = parseInt(String(car.seats), 10);
  switch (car.category) {
    case 'Luxury': return 'Luxury';
    case 'Off-road': return 'Adventure';
    case 'MUV': return 'Family';
    case 'Hatchback': return 'City';
    case 'SUV':
    case 'Sedan': return !isNaN(seats) && seats >= 7 ? 'Family' : 'Comfort';
  }
  if (!isNaN(seats) && seats >= 7) return 'Family';
  return car.transmission === 'Automatic' ? 'City' : 'Comfort';
}

const baseCars: Car[] = [
  {
    id: 'creta',
    name: 'Hyundai Creta',
    type: "Car",
    category: 'SUV',
    price: '₹2,500',
    perDay: 2500,
    image: require('../assets/images/creta.jpg'),
    seats: '5 seats',
    transmission: 'Automatic',
    fuel: 'Petrol',
    mileage: '17 km/l',
    availabilityDate: 'Available Now',
    images: [
      require('../assets/images/creta.jpg'),
      require('../assets/images/creta.jpg'), // Mocking multiple images
      require('../assets/images/creta.jpg'),
      require('../assets/images/creta.jpg'),
      require('../assets/images/creta.jpg'),
    ],
    rating: 4.8,
    reviewCount: 126,
    description: "The Hyundai Creta is a premium 5-seater SUV suitable for highway journeys, family trips and long-distance travel. It offers an automatic transmission, spacious cabin and generous luggage capacity.",
    features: ['Air Conditioning', 'Power Steering', 'Bluetooth', 'Reverse Camera', 'GPS', 'USB Charging', 'Push Start'],
    luggage: '3 bags',
    doors: '5',
    modelYear: '2023',
    ratingDistribution: { 5: 82, 4: 12, 3: 4, 2: 1, 1: 1 },
    reviews: [
      { id: '1', userName: 'Ankit Kumar', rating: 5, text: "Car was clean and comfortable. Pickup process was quick and the vehicle was in very good condition.", date: '2 days ago', isVerified: true },
      { id: '2', userName: 'Rahul Sharma', rating: 4, text: "Smooth ride, but the AC took a while to cool.", date: '1 week ago', isVerified: true },
      { id: '3', userName: 'Priya S.', rating: 5, text: "Amazing experience! The GPS was super helpful for our long trip.", date: '2 weeks ago', isVerified: true }
    ]
  },
  {
    id: 'seltos',
    name: 'Kia Seltos',
    type: "Car",
    category: 'SUV',
    price: '₹2,500',
    perDay: 2500,
    image: require('../assets/images/seltos.jpg'),
    seats: '5 seats',
    transmission: 'Automatic',
    fuel: 'Diesel',
    mileage: '19 km/l',
    availabilityDate: 'Available Now',
    availableToDate: getDynamicDate(7),
  },
  {
    id: 'swift',
    name: 'Suzuki Swift',
    type: "Car",
    category: 'Hatchback',
    price: '₹1,800',
    perDay: 1800,
    image: require('../assets/images/swift.jpg'),
    seats: '5 seats',
    transmission: 'Manual',
    fuel: 'Petrol',
    mileage: '23 km/l',
    availabilityDate: getDynamicDate(2),
    availableToDate: getDynamicDate(5),
  },
  {
    id: 'scorpio-s',
    name: 'Mahindra Scorpio S',
    type: "Car",
    category: 'SUV',
    price: '₹3,500',
    perDay: 3500,
    image: require('../assets/images/scorpio.jpg'),
    seats: '7 seats',
    transmission: 'Manual',
    fuel: 'Diesel',
    mileage: '15 km/l',
    availabilityDate: getDynamicDate(5),
  },
  {
    id: 'nexon',
    name: 'Tata Nexon',
    type: "Car",
    category: 'SUV',
    price: '₹2,500',
    perDay: 2500,
    image: require('../assets/images/nexon.jpg'),
    seats: '5 seats',
    transmission: 'Automatic',
    fuel: 'Petrol',
    mileage: '17 km/l',
    availabilityDate: 'Available Now',
    availableToDate: getDynamicDate(15),
  },
  {
    id: 'jawa',
    name: 'Jawa 300',
    type: "Bike",
    category: 'Bike',
    price: '₹1,200',
    perDay: 1200,
    image: require('../assets/images/jawa.jpg'),
    seats: '2 seats',
    transmission: 'Manual',
    fuel: 'Petrol',
    mileage: '35 km/l',
    availabilityDate: getDynamicDate(1),
  },
  {
    id: 'xpulse',
    name: 'Hero Xpulse 200',
    type: "Bike",
    category: 'Off-road',
    price: '₹1,000',
    perDay: 1000,
    image: require('../assets/images/xpulse.jpg'),
    seats: '2 seats',
    transmission: 'Manual',
    fuel: 'Petrol',
    mileage: '38 km/l',
    availabilityDate: getDynamicDate(4),
  },
  {
    id: 'hunter',
    name: 'RE Hunter 350',
    type: "Bike",
    category: 'Bike',
    price: '₹1,500',
    perDay: 1500,
    image: require('../assets/images/hunter.jpg'),
    seats: '2 seats',
    transmission: 'Manual',
    fuel: 'Petrol',
    mileage: '36 km/l',
    availabilityDate: getDynamicDate(3),
  },
];

export const cars = [...baseCars];

export const premiumCollection: Car[] = [
  {
    id: 'scorpio-s',
    name: 'Mahindra Scorpio S',
    type: "Car",
    category: 'SUV',
    price: '₹3,500',
    perDay: 3500,
    image: require('../assets/images/scorpio.jpg'),
    seats: '7 seats',
    transmission: 'Manual',
    fuel: 'Diesel',
    mileage: '15 km/l',
    availabilityDate: 'Available Now',
  },
  {
    id: 'nexon',
    name: 'Tata Nexon',
    type: "Car",
    category: 'SUV',
    price: '₹2,500',
    perDay: 2500,
    image: require('../assets/images/nexon.jpg'),
    seats: '5 seats',
    transmission: 'Automatic',
    fuel: 'Petrol',
    mileage: '17 km/l',
    availabilityDate: getDynamicDate(2),
  },
  {
    id: 'curvv',
    name: 'Tata Curvv',
    type: "Car",
    category: 'SUV',
    price: '₹2,800',
    perDay: 2800,
    image: require('../assets/images/curvv.jpg'),
    seats: '5 seats',
    transmission: 'Automatic',
    fuel: 'EV',
    // EV — mileage is measured in range/kWh, not km/l, so intentionally left unset.
  },
  {
    id: 'jawa',
    name: 'Jawa 300',
    type: "Bike",
    category: 'Bike',
    price: '₹1,200',
    perDay: 1200,
    image: require('../assets/images/jawa.jpg'),
    seats: '2 seats',
    transmission: 'Manual',
    fuel: 'Petrol',
    mileage: '35 km/l',
  },
  {
    id: 'xpulse',
    name: 'Hero Xpulse 200',
    type: "Bike",
    category: 'Off-road',
    price: '₹1,000',
    perDay: 1000,
    image: require('../assets/images/xpulse.jpg'),
    seats: '2 seats',
    transmission: 'Manual',
    fuel: 'Petrol',
    mileage: '38 km/l',
  },
  {
    id: 'hunter',
    name: 'RE Hunter 350',
    type: "Bike",
    category: 'Bike',
    price: '₹1,500',
    perDay: 1500,
    image: require('../assets/images/hunter.jpg'),
    seats: '2 seats',
    transmission: 'Manual',
    fuel: 'Petrol',
    mileage: '36 km/l',
  },
];

// ─── Availability ────────────────────────────────────────────────────────────
// Everything here works on whole calendar days, expressed as a day number
// (days since 1970-01-01, UTC). MySawari stores booking dates at UTC midnight,
// so a booking's UTC date *is* its calendar day. Chosen dates like "15 Sep" map
// to the same day number, so both sides compare like for like.

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const toDayNum = (y: number, m: number, d: number) => Math.floor(Date.UTC(y, m, d) / DAY_MS);

export const todayDayNum = () => {
  const n = new Date();
  return toDayNum(n.getFullYear(), n.getMonth(), n.getDate());
};

const isoToDayNum = (iso?: string | null): number => {
  if (!iso) return NaN;
  const t = new Date(iso).getTime();
  return isNaN(t) ? NaN : Math.floor(t / DAY_MS);
};

export const dayNumToLabel = (n: number) => {
  const d = new Date(n * DAY_MS);
  const month = MONTH_NAMES[d.getUTCMonth()];
  return `${d.getUTCDate()} ${month[0].toUpperCase()}${month.slice(1)}`;
};

/** Weekday / day / month parts of a day number, for date pickers. */
export function describeDay(n: number) {
  const d = new Date(n * DAY_MS);
  const month = MONTH_NAMES[d.getUTCMonth()];
  return {
    weekday: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()],
    day: d.getUTCDate(),
    month: `${month[0].toUpperCase()}${month.slice(1)}`,
  };
}

/** "15 Sep", "15 Sept" or "15 Sep 2026" -> day number. Year is inferred when missing. */
export function parseDayLabel(label: string | undefined | null, notBefore?: number): number | null {
  if (!label) return null;
  const m = label.trim().match(/^(\d{1,2})\s+([A-Za-z]{3,})\.?(?:\s+(\d{4}))?$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = MONTH_NAMES.indexOf(m[2].slice(0, 3).toLowerCase());
  if (month === -1) return null;

  if (m[3]) return toDayNum(parseInt(m[3], 10), month, day);

  const floor = notBefore ?? todayDayNum();
  const year = new Date().getFullYear();
  let n = toDayNum(year, month, day);
  if (n < floor) n = toDayNum(year + 1, month, day);
  return n;
}

/** Splits "15 Sep – 18 Sep" (or a single "15 Sep") into its start / end labels. */
export function splitDateRange(range?: string | null): [string | undefined, string | undefined] {
  if (!range) return [undefined, undefined];
  const [start, end] = range.split(/\s*[–—]\s*/);
  return [start?.trim() || undefined, end?.trim() || undefined];
}

/** True when the string is an actual chosen date, not a placeholder like "Select Dates". */
export const isRealDate = (label?: string | null) => parseDayLabel(label ?? undefined) !== null;

/**
 * "High demand for these dates": at least two other live bookings on, or within `slackDays` of, the chosen trip.
 * Only meaningful once dates are chosen — without them there is nothing to be in demand for.
 */
export function isHighDemand(car: Car | undefined | null, tripStart: number | null, tripEnd: number | null, slackDays = 2): boolean {
  if (!car || tripStart === null || tripEnd === null) return false;
  const done = ['cancelled', 'canceled', 'failed', 'rejected', 'completed', 'complete', 'returned', 'closed'];
  const around = (car.bookedRanges || []).filter((r) => {
    if (r.status && done.includes(r.status.toLowerCase())) return false;
    const a = isoToDayNum(r.start);
    const b = isoToDayNum(r.end);
    return !isNaN(a) && !isNaN(b) && a <= tripEnd + slackDays && b >= tripStart - slackDays;
  });
  return around.length >= 2;
}

type Block = { start: number; end: number; kind: 'booked' | 'service' | 'rented' };

function buildBlocks(car: Car, today: number): Block[] {
  const blocks: Block[] = [];

  for (const r of car.bookedRanges || []) {
    const start = isoToDayNum(r.start);
    const end = isoToDayNum(r.end);
    if (isNaN(start) || isNaN(end) || end < today) continue; // past bookings don't matter
    
    // If the backend includes the status, ignore cancelled/completed bookings
    if (r.status) {
      const st = r.status.toLowerCase();
      if (['cancelled', 'canceled', 'failed', 'rejected', 'completed', 'complete', 'returned', 'closed'].includes(st)) {
        continue;
      }
    }
    
    blocks.push({ start, end, kind: 'booked' });
  }

  const dbStatus = (car.dbStatus || '').toLowerCase();
  
  if (dbStatus === 'service' || dbStatus === 'maintenance') {
    const until = isoToDayNum(car.maintenanceUntil);
    // If the maintenance date has passed but the status is STILL 'service', 
    // it means the maintenance is taking longer than expected. Treat as indefinite until status changes.
    const endService = isNaN(until) || until < today ? Infinity : until;
    blocks.push({ start: today, end: endService, kind: 'service' });
  } else if (
    (dbStatus === 'rent' || dbStatus === 'booked') &&
    !blocks.some(b => b.start <= today && b.end >= today)
  ) {
    // Marked as out on rent but with no booking on record: unavailable today only.
    blocks.push({ start: today, end: today, kind: 'rented' });
  }

  // --- Mock Database Compatibility ---
  // Some mock cars define their availability via availabilityDate and availableToDate
  // instead of explicit bookedRanges. We must respect these by creating virtual blocks.
  
  if (car.availabilityDate && car.availabilityDate !== 'Available Now') {
    const availStart = parseDayLabel(car.availabilityDate);
    if (availStart !== null && availStart > today) {
      // Car is NOT available from today until the day before availabilityDate
      blocks.push({ start: today, end: availStart - 1, kind: 'booked' });
    }
  }

  if (car.availableToDate) {
    const availEnd = parseDayLabel(car.availableToDate);
    if (availEnd !== null && availEnd >= today) {
      // Car is NOT available after availableToDate
      blocks.push({ start: availEnd + 1, end: Infinity, kind: 'booked' });
    }
  }

  return blocks.sort((a, b) => a.start - b.start);
}

const overlaps = (b: Block, start: number, end: number) => b.start <= end && b.end >= start;

/**
 * Real display title from the database record (e.g. "Alto 800 Red", "Ertiga White", "Hunter 350").
 */
export function carTitle(car: Pick<Car, 'displayName' | 'name' | 'manufacturer' | 'variant' | 'color'>): string {
  if (car.displayName?.trim()) return car.displayName.trim();
  if (car.name?.trim()) return car.name.trim();
  const make = car.manufacturer?.replace(/^Maruti Suzuki$/i, 'Maruti') || '';
  return [make, car.variant].filter(Boolean).join(' ') || 'Vehicle';
}

/**
 * Is this vehicle free for the chosen dates, and if so for how long / if not,
 * when is it next free? With no dates chosen it answers for today.
 */
export function getAvailability(car: Car | undefined | null, startLabel?: string, endLabel?: string): AvailabilityInfo {
  if (!car) return { available: false, label: 'ON A TRIP', headline: 'On a trip', detail: '' };
  if (car.isPublic === false) return { available: false, label: 'INTERNAL', headline: 'Not available', detail: 'Internal vehicle only' };

  const today = todayDayNum();
  const start = parseDayLabel(startLabel);
  const hasDates = start !== null;
  const rawStart = hasDates ? start! : today;
  const windowStart = Math.max(rawStart, today);
  const parsedEnd = hasDates ? parseDayLabel(endLabel, windowStart) : null;
  const windowEnd = parsedEnd !== null ? parsedEnd : windowStart;
  const stayDays = windowEnd - windowStart + 1;

  const blocks = buildBlocks(car, today);
  const conflicts = blocks.filter(b => overlaps(b, windowStart, windowEnd));

  if (conflicts.length === 0) {
    const next = blocks.find(b => b.start > windowEnd);
    const freeUntil = next ? next.start - 1 : undefined;
    const untilText = freeUntil !== undefined ? ` · FREE TILL ${dayNumToLabel(freeUntil)}` : '';
    const headline = hasDates
      ? `Available for ${dayNumToLabel(windowStart)}${windowEnd > windowStart ? ` – ${dayNumToLabel(windowEnd)}` : ''}`
      : 'Available now';
    const detail = freeUntil !== undefined ? `Continuously available until ${dayNumToLabel(freeUntil)}` : '';
    const fromText = hasDates ? dayNumToLabel(windowStart) : 'now';
    const rangeHeadline =
      freeUntil === undefined
        ? (hasDates ? `Available from ${fromText}` : 'Available now')
        : freeUntil <= windowStart
          ? (hasDates ? `Available ${fromText} only` : 'Available today only')
          : `Available ${fromText} – ${dayNumToLabel(freeUntil)}`;
    return {
      available: true,
      startDate: hasDates ? dayNumToLabel(windowStart) : 'Today',
      headline,
      rangeHeadline,
      detail,
      label: `${headline}${untilText}`.toUpperCase(),
      freeUntil: freeUntil !== undefined ? dayNumToLabel(freeUntil) : undefined,
    };
  }

  // Unavailable — find the earliest start where the whole stay fits.
  const candidates = [windowStart, ...blocks.map(b => b.end + 1)].filter(c => c >= windowStart && isFinite(c)).sort((a, b) => a - b);
  const nextStart = candidates.find(c => !blocks.some(b => overlaps(b, c, c + stayDays - 1)));

  const reason = conflicts[0].kind;
  const base = reason === 'service' ? 'IN SERVICE' : 'ON A TRIP';
  return {
    available: false,
    reason,
    headline: base === 'IN SERVICE' ? 'In service' : 'On a trip',
    detail: nextStart !== undefined ? `Next available ${dayNumToLabel(nextStart)}` : '',
    label: (nextStart !== undefined ? `${base} · NEXT ${dayNumToLabel(nextStart)}` : base).toUpperCase(),
    nextAvailableFrom: nextStart !== undefined ? dayNumToLabel(nextStart) : undefined,
  };
}

export const checkCarAvailability = (car: Car | undefined | null, selectedStartDate: string, selectedEndDate?: string): boolean =>
  getAvailability(car, selectedStartDate, selectedEndDate).available;

/** Attaches `availability` / `isAvailable` for the dates being viewed. */
export function withAvailability(cars: Car[], startLabel?: string, endLabel?: string): Car[] {
  return cars.map(car => {
    const availability = getAvailability(car, startLabel, endLabel);
    return { ...car, isAvailable: availability.available, availability };
  });
}

export const resultCars: Car[] = [
  { ...cars[0], image: require('../assets/images/creta.jpg') },
  {
    id: 'thar-result',
    name: 'Mahindra Thar',
    type: "Car",
    category: 'Off-road',
    price: '₹2,500',
    perDay: 2500,
    image: require('../assets/images/seltos.jpg'),
    seats: '4 seats',
    transmission: 'Automatic',
    fuel: 'Diesel',
    mileage: '15 km/l',
    availabilityDate: getDynamicDate(2),
    availableToDate: getDynamicDate(10),
  },
  {
    id: 'swift-result',
    name: 'Suzuki Swift',
    type: "Car",
    category: 'Hatchback',
    price: '₹1,800',
    perDay: 1800,
    image: require('../assets/images/swift.jpg'),
    seats: '5 seats',
    transmission: 'Manual',
    fuel: 'Petrol',
    mileage: '23 km/l',
    availabilityDate: 'Available Now',
    availableToDate: getDynamicDate(5),
  },
  {
    id: 'city-result',
    name: 'Honda City',
    type: "Car",
    category: 'Sedan',
    price: '₹2,200',
    perDay: 2200,
    image: require('../assets/images/creta.jpg'),
    seats: '5 seats',
    transmission: 'Automatic',
    fuel: 'Petrol',
    mileage: '18 km/l',
    availabilityDate: getDynamicDate(4),
    availableToDate: getDynamicDate(20),
  },
  {
    id: 'mercedes-result',
    name: 'Mercedes E-Class',
    type: "Car",
    category: 'Luxury',
    price: '₹8,500',
    perDay: 8500,
    image: require('../assets/images/seltos.jpg'),
    seats: '5 seats',
    transmission: 'Automatic',
    fuel: 'Petrol',
    mileage: '12 km/l',
  },
  {
    id: 'alto-result',
    name: 'Maruti Alto K10',
    type: "Car",
    category: 'Hatchback',
    price: '₹1,200',
    perDay: 1200,
    image: require('../assets/images/swift.jpg'),
    seats: '4 seats',
    transmission: 'Manual',
    fuel: 'Petrol',
    mileage: '24 km/l',
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchCars(): Promise<Car[]> {
  await delay(800);
  return cars;
}

export async function fetchResultCars(): Promise<Car[]> {
  await delay(1200);
  return resultCars;
}


/**
 * List order used everywhere vehicles are listed: free vehicles first, then busy ones by the day they are
 * free again (soonest first). Stable, so the existing order is kept within each group. Each item needs
 * `isAvailable` / `availability` from getAvailability.
 */
export function byAvailability<T extends { isAvailable?: boolean; availability?: { available?: boolean; nextAvailableFrom?: string } }>(list: T[]): T[] {
  const busy = (c: T) => (c.isAvailable === false || c.availability?.available === false ? 1 : 0);
  const freeFrom = (c: T) => {
    const label = c.availability?.nextAvailableFrom;
    return label ? parseDayLabel(label) ?? 9999 : 9999;
  };
  return list
    .map((c, i) => ({ c, i }))
    .sort((a, b) => busy(a.c) - busy(b.c) || (busy(a.c) ? freeFrom(a.c) - freeFrom(b.c) : 0) || a.i - b.i)
    .map((x) => x.c);
}