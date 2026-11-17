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
  bookedRanges?: { start: string; end: string; status?: string; pickupTime?: string; dropTime?: string; returnTime?: string }[];
  /** When a vehicle in service is due back (ISO), if known. */
  maintenanceUntil?: string | null;
  /** Trips taken or under way in the last 90 days (from the server): ranks "Trending vehicles" on Home. */
  recentBookings?: number;
  /** Availability for the dates the user is currently looking at. */
  availability?: AvailabilityInfo;
};

export interface AvailabilityInfo {
  available: boolean;
  /** Whether the vehicle is available at some time today (now or later today) */
  availableToday?: boolean;
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
  /** Exact time/datetime the vehicle becomes available (e.g. "8:10 AM" or "12 Nov, 8:10 AM"). */
  availableFrom?: string;
  /** Last free day before the next booking (only when available and a booking follows). */
  freeUntil?: string;
  /** Today only: the car is free until a booking that starts later today, e.g. "8:10 AM". */
  freeTill?: string;
  /** Exact end timestamp of the current free window */
  freeUntilMs?: number;
  /** Formatted time the vehicle is free until, e.g. "8:00 AM" */
  freeUntilTime?: string;
  /** The formatted human-readable availability window label, e.g. "Available Today, 10:00 PM – 8:00 AM" or "Available till 8:00 AM" */
  availableWindowLabel?: string;
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

export const getDynamicDate = (offset: number) => istDayMonth(Date.now() + offset * 86400000);

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
export const MONTH_NAMES = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

export const INDIA_TZ = 'Asia/Kolkata';

/**
 * Extracts year, month (0-based), date, hours, minutes, seconds strictly in Indian Standard Time (UTC+05:30).
 * India does not observe daylight saving time, so IST is UTC + 330 minutes all year round.
 */
export function getIndiaDateParts(dateOrMsOrStr: Date | number | string = Date.now()): {
  year: number;
  month: number;
  date: number;
  hours: number;
  minutes: number;
  seconds: number;
} {
  const d =
    typeof dateOrMsOrStr === 'string'
      ? new Date(dateOrMsOrStr)
      : typeof dateOrMsOrStr === 'number'
      ? new Date(dateOrMsOrStr)
      : dateOrMsOrStr;
  const t = d.getTime();
  if (isNaN(t)) {
    return { year: 1970, month: 0, date: 1, hours: 0, minutes: 0, seconds: 0 };
  }
  const istMs = t + 330 * 60 * 1000;
  const istD = new Date(istMs);
  return {
    year: istD.getUTCFullYear(),
    month: istD.getUTCMonth(),
    date: istD.getUTCDate(),
    hours: istD.getUTCHours(),
    minutes: istD.getUTCMinutes(),
    seconds: istD.getUTCSeconds(),
  };
}

export const toDayNum = (y: number, m: number, d: number) => Math.floor(Date.UTC(y, m, d) / DAY_MS);

export const todayDayNum = () => {
  const p = getIndiaDateParts();
  return toDayNum(p.year, p.month, p.date);
};

const isoToDayNum = (iso?: string | null): number => {
  if (!iso) return NaN;
  const d = new Date(iso);
  const t = d.getTime();
  if (isNaN(t)) return NaN;
  const p = getIndiaDateParts(d);
  return toDayNum(p.year, p.month, p.date);
};

export const TURNOVER_BUFFER_MS = 0; // Turnaround buffer between trips (0 ms enables immediate booking at return time)

/** Parses "8:00 AM", "08:10 AM", "12:30 PM", "8 PM", "14:30" into minutes from midnight (0..1439). */
export function parseTimeToMinutes(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const s = timeStr.trim().toUpperCase();
  const m12 = s.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/);
  if (m12) {
    let hours = parseInt(m12[1], 10);
    const minutes = m12[2] ? parseInt(m12[2], 10) : 0;
    const ampm = m12[3];
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }
  const m24 = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m24) {
    const hours = parseInt(m24[1], 10);
    const minutes = parseInt(m24[2], 10);
    return hours * 60 + minutes;
  }
  return null;
}

/** Formats a Date object, timestamp, or date string into 12-hour format strictly in Indian Standard Time e.g. "8:10 AM" or "12:00 PM". */
/** "17 Nov 2026" in India time. */
export const istDayMonthYear = (x: Date | number | string) => `${istDayMonth(x)} ${getIndiaDateParts(x).year}`;

/** "17 Nov" in India time (never the phone's or UTC's date). */
export function istDayMonth(dateOrMsOrStr: Date | number | string): string {
  const p = getIndiaDateParts(dateOrMsOrStr);
  return `${p.date} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][p.month]}`;
}

export function formatTime12(dateOrMsOrStr: Date | number | string): string {
  const p = getIndiaDateParts(dateOrMsOrStr);
  let hours = p.hours;
  const minutes = p.minutes;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${mm} ${ampm}`;
}

/** Combines calendar day number and time string into exact UTC millisecond timestamp for Indian Standard Time. */
export function dayNumAndTimeToMs(dayNum: number, timeStr?: string | null, defaultMinutes = 480): number {
  const mins = parseTimeToMinutes(timeStr) ?? defaultMinutes;
  // In Indian Standard Time (UTC+05:30), 00:00 UTC = 05:30 AM IST.
  // Midnight IST is UTC - 330 minutes. So wall-clock time in India is (mins - 330) minutes from UTC midnight.
  return dayNum * DAY_MS + (mins - 330) * 60000;
}

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

/** Parses date/datetime strings (ISO, "14 Nov, 10:00 PM", "14 Nov", etc.) into millisecond timestamp. */
export function parseDateAndTimeToMs(str?: string | null, defaultTime = '08:00 AM'): number | null {
  if (!str) return null;
  const s = str.trim();
  if (s.toLowerCase() === 'available now') return null;

  const parsed = Date.parse(s);
  if (!isNaN(parsed)) {
    return parsed;
  }

  const m = s.match(/^(\d{1,2}\s+[A-Za-z]{3,}(?:\s+\d{4})?)(?:,\s*|\s+)(.*)$/);
  if (m) {
    const dayN = parseDayLabel(m[1]);
    if (dayN !== null) {
      return dayNumAndTimeToMs(dayN, m[2]);
    }
  }

  const dayN = parseDayLabel(s);
  if (dayN !== null) {
    return dayNumAndTimeToMs(dayN, defaultTime);
  }

  return null;
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
/** In the workshop right now (status service / maintenance): such vehicles are not offered on Home or Explore. */
export const isInService = (car: { dbStatus?: string } | undefined | null) => {
  const st = (car?.dbStatus || '').toLowerCase();
  return st === 'service' || st === 'maintenance';
};

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

export type Block = {
  start: number;
  end: number;
  kind: 'booked' | 'service' | 'rented';
  startMs: number;
  endMs: number;
};

export function buildBlocks(car: Car, today: number): Block[] {
  const blocks: Block[] = [];

  for (const r of car.bookedRanges || []) {
    const p1 = getIndiaDateParts(r.start);
    const p2 = getIndiaDateParts(r.end);
    const start = toDayNum(p1.year, p1.month, p1.date);
    const end = toDayNum(p2.year, p2.month, p2.date);
    if (isNaN(start) || isNaN(end) || end < today) continue; // past bookings don't matter

    // If the backend includes the status, ignore cancelled/completed bookings
    if (r.status) {
      const st = r.status.toLowerCase();
      if (['cancelled', 'canceled', 'failed', 'rejected', 'completed', 'complete', 'returned', 'closed'].includes(st)) {
        continue;
      }
    }

    const pickStr = (r as any).pickupTime;
    const pMins = parseTimeToMinutes(pickStr);
    // If pickupTime is specified, use it; otherwise default to business start time 08:00 AM (480 mins).
    // Never fall back to raw UTC midnight d1.getTime() which renders as 5:30 AM in Indian Standard Time (UTC+5:30).
    const startMs = pMins !== null
      ? dayNumAndTimeToMs(start, pickStr, pMins)
      : dayNumAndTimeToMs(start, '08:00 AM', 480);

    const dropStr = (r as any).dropTime || (r as any).returnTime;
    const dMins = parseTimeToMinutes(dropStr);
    // If dropTime is specified, use it; otherwise default to 08:00 PM (1200 mins).
    const endMs = dMins !== null
      ? dayNumAndTimeToMs(end, dropStr, dMins)
      : dayNumAndTimeToMs(end, '08:00 PM', 1200);

    blocks.push({
      start,
      end,
      kind: 'booked',
      startMs,
      endMs,
    });
  }

  const dbStatus = (car.dbStatus || '').toLowerCase();

  if (dbStatus === 'service' || dbStatus === 'maintenance') {
    // Unavailable only for the period it was marked in maintenance for. Once that date has passed the vehicle shows
    // as available again, even if the workshop status was never changed back. With no end date recorded at all
    // the duration is unknown, so it stays unavailable until someone sets one.
    const until = isoToDayNum(car.maintenanceUntil);
    const untilMs = car.maintenanceUntil ? new Date(car.maintenanceUntil).getTime() : Infinity;
    if (isNaN(until)) {
      blocks.push({ start: today, end: Infinity, kind: 'service', startMs: Date.now(), endMs: Infinity });
    } else if (until >= today) {
      blocks.push({
        start: today,
        end: until,
        kind: 'service',
        startMs: Date.now(),
        endMs: isNaN(untilMs) ? dayNumAndTimeToMs(until, '11:59 PM', 1439) : untilMs,
      });
    }
  } else if (
    (dbStatus === 'rent' || dbStatus === 'booked') &&
    !blocks.some(b => b.start <= today && b.end >= today)
  ) {
    // Marked as out on rent but with no booking on record: unavailable today only.
    blocks.push({
      start: today,
      end: today,
      kind: 'rented',
      startMs: dayNumAndTimeToMs(today, '00:00 AM', 0),
      endMs: dayNumAndTimeToMs(today, '11:59 PM', 1439),
    });
  }

  // --- Mock Database / String Availability Compatibility ---
  if (car.availabilityDate && car.availabilityDate.toLowerCase() !== 'available now') {
    const availStartMs = parseDateAndTimeToMs(car.availabilityDate, '08:00 AM');
    if (availStartMs !== null && availStartMs > Date.now()) {
      const d = getIndiaDateParts(availStartMs);
      const availStartDay = toDayNum(d.year, d.month, d.date);
      blocks.push({
        start: today,
        end: availStartDay,
        kind: 'booked',
        startMs: dayNumAndTimeToMs(today, '00:00 AM', 0),
        endMs: availStartMs,
      });
    }
  }

  if (car.availableToDate) {
    const availEndMs = parseDateAndTimeToMs(car.availableToDate, '08:00 PM');
    if (availEndMs !== null && isFinite(availEndMs)) {
      const d = getIndiaDateParts(availEndMs);
      const availEndDay = toDayNum(d.year, d.month, d.date);
      blocks.push({
        start: availEndDay,
        end: Infinity,
        kind: 'booked',
        startMs: availEndMs,
        endMs: Infinity,
      });
    }
  }

  return blocks.sort((a, b) => a.startMs - b.startMs);
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
 * Is this vehicle free for the chosen dates and times, and if so for how long / if not,
 * when is it next free?
 * - Accurate time-wise & day-wise availability.
 * - If a car is booked till 10:00 PM today, searching from 10:00 PM will show it as available.
 * - Supports overnight time boundary rollover (e.g. 10:00 PM to 8:00 AM next morning).
 * - Detailed availability windows: "Available Today, 10:00 PM – 8:00 AM", "Available till 8:00 AM".
 */
export function getAvailability(
  car: Car | undefined | null,
  startLabel?: string,
  endLabel?: string,
  pickupTime?: string,
  returnTime?: string
): AvailabilityInfo {
  if (!car) return { available: false, label: 'ON A TRIP', headline: 'On a trip', detail: '', availableWindowLabel: 'On a trip' };
  if (car.isPublic === false) return { available: false, label: 'INTERNAL', headline: 'Not available', detail: 'Internal vehicle only', availableWindowLabel: 'Not available' };

  const today = todayDayNum();
  const now = Date.now();
  const start = parseDayLabel(startLabel);
  const hasDates = start !== null;
  const rawStart = hasDates ? start! : today;
  const windowStart = Math.max(rawStart, today);
  const parsedEnd = hasDates ? parseDayLabel(endLabel, windowStart) : null;
  let windowEnd = parsedEnd !== null ? parsedEnd : windowStart;

  const defaultPickupMins = 8 * 60; // 08:00 AM
  const defaultReturnMins = 20 * 60; // 08:00 PM
  let requestStartMs: number;
  let requestEndMs: number;

  if (hasDates) {
    const pMins = parseTimeToMinutes(pickupTime) ?? defaultPickupMins;
    const rMins = parseTimeToMinutes(returnTime) ?? defaultReturnMins;
    // Overnight booking on single chosen date: e.g. 10:00 PM to 8:00 AM returns tomorrow
    if (windowEnd === windowStart && rMins <= pMins) {
      windowEnd = windowStart + 1;
    }
    requestStartMs = dayNumAndTimeToMs(windowStart, pickupTime, defaultPickupMins);
    requestEndMs = dayNumAndTimeToMs(windowEnd, returnTime, defaultReturnMins);
    if (requestEndMs <= requestStartMs) {
      requestEndMs = requestStartMs + 2 * 60 * 60 * 1000;
    }
  } else {
    // Browsing without specific dates (e.g. Explore initial view, cards on Home) -> check from current moment
    requestStartMs = now;
    requestEndMs = now + 60 * 60 * 1000; // 1-hour active check from now
  }

  const blocks = buildBlocks(car, today);

  // A booking conflicts if its active window intersects the requested window
  const conflicts = blocks.filter((b) => {
    return b.startMs < requestEndMs && b.endMs > requestStartMs;
  });

  // Conflicts exist: vehicle is currently busy or overlaps search
  if (conflicts.length > 0) {
    const reason = conflicts[0].kind;
    const base = reason === 'service' ? 'IN SERVICE' : 'ON A TRIP';
    const stayMs = Math.max(60 * 60 * 1000, requestEndMs - requestStartMs);

    // Candidates for next availability: start of search range, or exactly when each block ends
    const candidateTimes = [
      requestStartMs,
      ...blocks.map((b) => b.endMs),
    ]
      .filter((t) => t >= requestStartMs && isFinite(t))
      .sort((a, b) => a - b);

    const nextFreeMs = candidateTimes.find((cand) =>
      !blocks.some((b) => {
        return b.startMs < cand + stayMs && b.endMs > cand;
      })
    );

    if (nextFreeMs !== undefined) {
      const nextParts = getIndiaDateParts(nextFreeMs);
      const nextDayNum = toDayNum(nextParts.year, nextParts.month, nextParts.date);
      const isAvailToday = nextDayNum === today;
      const isAvailTomorrow = nextDayNum === today + 1;
      const nextAvailableFrom = dayNumToLabel(nextDayNum);
      const fromTimeStr = formatTime12(nextFreeMs);
      const availableFrom = isAvailToday ? fromTimeStr : `${nextAvailableFrom}, ${fromTimeStr}`;

      // Check when that next free window ends (next booking/service starting after nextFreeMs)
      const nextBlockAfterFree = blocks.find((b) => b.startMs > nextFreeMs && isFinite(b.startMs));
      let untilTimeStr: string | undefined;
      let untilDayNum: number | undefined;
      let freeUntilMs: number | undefined;

      if (nextBlockAfterFree) {
        freeUntilMs = nextBlockAfterFree.startMs;
        const untilParts = getIndiaDateParts(nextBlockAfterFree.startMs);
        untilDayNum = toDayNum(untilParts.year, untilParts.month, untilParts.date);
        untilTimeStr = formatTime12(nextBlockAfterFree.startMs);
      }

      let availableWindowLabel = '';
      if (reason === 'service' && (!nextBlockAfterFree || !isFinite(conflicts[0].endMs))) {
        availableWindowLabel = 'In maintenance';
      } else if (isAvailToday) {
        if (untilTimeStr) {
          availableWindowLabel = `Available Today, ${fromTimeStr} – ${untilTimeStr}`;
        } else {
          availableWindowLabel = `Available Today from ${fromTimeStr}`;
        }
      } else if (isAvailTomorrow) {
        if (untilTimeStr) {
          availableWindowLabel = `Available Tomorrow, ${fromTimeStr} – ${untilTimeStr}`;
        } else {
          availableWindowLabel = `Available Tomorrow from ${fromTimeStr}`;
        }
      } else {
        if (untilTimeStr) {
          availableWindowLabel = `Available ${nextAvailableFrom}, ${fromTimeStr} – ${untilTimeStr}`;
        } else {
          availableWindowLabel = `Available ${nextAvailableFrom} from ${fromTimeStr}`;
        }
      }

      return {
        available: false,
        availableToday: isAvailToday,
        reason,
        headline: base === 'IN SERVICE' ? 'In service' : 'On a trip',
        detail: `Next available from ${availableFrom}`,
        label: `${base} · FROM ${availableFrom}`.toUpperCase(),
        nextAvailableFrom,
        availableFrom,
        freeUntilMs,
        freeUntilTime: untilTimeStr,
        availableWindowLabel,
      };
    }

    return {
      available: false,
      availableToday: false,
      reason,
      headline: base === 'IN SERVICE' ? 'In service' : 'On a trip',
      detail: '',
      label: base,
      availableWindowLabel: base === 'IN SERVICE' ? 'In maintenance' : 'On a trip',
    };
  }

  // Vehicle is AVAILABLE for requested range!
  // Look for the next upcoming booking/service that starts after or during the requested range
  const nextUpcoming = blocks.find((b) => b.startMs >= requestStartMs && isFinite(b.startMs));
  let freeUntil: string | undefined;
  let freeUntilDayNum: number | undefined;
  let freeTill: string | undefined;
  let freeUntilTime: string | undefined;
  let freeUntilMs: number | undefined;

  if (nextUpcoming) {
    freeUntilMs = nextUpcoming.startMs;
    const nextParts = getIndiaDateParts(nextUpcoming.startMs);
    freeUntilDayNum = toDayNum(nextParts.year, nextParts.month, nextParts.date);
    freeUntil = dayNumToLabel(freeUntilDayNum);
    freeUntilTime = formatTime12(nextUpcoming.startMs);
    freeTill = freeUntilDayNum === windowStart ? freeUntilTime : `${freeUntil}, ${freeUntilTime}`;
  }

  const untilText = freeUntil !== undefined ? ` · FREE TILL ${freeUntil.toUpperCase()}` : '';
  const headline = hasDates
    ? `Available for ${dayNumToLabel(windowStart)}${windowEnd > windowStart ? ` – ${dayNumToLabel(windowEnd)}` : ''}`
    : 'Available now';
  const detail = freeUntil !== undefined ? `Continuously available until ${freeUntil}` : '';

  const fromText = hasDates ? dayNumToLabel(windowStart) : 'now';
  const rangeHeadline =
    freeUntil === undefined
      ? (hasDates ? `Available from ${fromText}` : 'Available now')
      : (freeUntilDayNum !== undefined && freeUntilDayNum <= windowStart)
        ? (hasDates ? `Available ${fromText} only` : 'Available today only')
        : `Available ${fromText} – ${freeUntil}`;

  let availableWindowLabel: string;
  if (hasDates) {
    availableWindowLabel = `Available for ${dayNumToLabel(windowStart)}${windowEnd > windowStart ? ` – ${dayNumToLabel(windowEnd)}` : ''}`;
  } else {
    if (freeUntilDayNum !== undefined && freeUntilTime) {
      if (freeUntilDayNum === today || freeUntilDayNum === today + 1) {
        availableWindowLabel = `Available till ${freeUntilTime}`;
      } else {
        availableWindowLabel = `Available till ${freeUntil}, ${freeUntilTime}`;
      }
    } else {
      availableWindowLabel = 'Available now';
    }
  }

  return {
    available: true,
    availableToday: true,
    startDate: hasDates ? dayNumToLabel(windowStart) : 'Today',
    headline,
    rangeHeadline,
    detail,
    label: `${headline}${untilText}`.toUpperCase(),
    freeUntil,
    freeTill,
    freeUntilMs,
    freeUntilTime,
    availableWindowLabel,
  };
}

export const checkCarAvailability = (
  car: Car | undefined | null,
  selectedStartDate: string,
  selectedEndDate?: string,
  pickupTime?: string,
  returnTime?: string
): boolean => getAvailability(car, selectedStartDate, selectedEndDate, pickupTime, returnTime).available;

export interface CarNextBookingWindow {
  availableUntilMs: number;
  availableHours: number;
  availableTillLabel: string;
  nextBookingStartMs: number | null;
  hasUpcomingBooking: boolean;
  freeUntilDateLabel: string;
  freeUntilTimeLabel: string;
}

/**
 * Calculates the exact availability window and remaining hours for a vehicle until its
 * next future booking, rental, or service block begins.
 * Used for hourly flash sale calculations and countdown timers.
 */
export function getCarNextBookingWindow(car: Car | undefined | null, nowMs: number = Date.now()): CarNextBookingWindow {
  const defaultUntil = nowMs + 24 * 3600 * 1000;
  if (!car) {
    const p = getIndiaDateParts(defaultUntil);
    const dayN = toDayNum(p.year, p.month, p.date);
    return {
      availableUntilMs: defaultUntil,
      availableHours: 24,
      availableTillLabel: 'Tomorrow',
      nextBookingStartMs: null,
      hasUpcomingBooking: false,
      freeUntilDateLabel: dayNumToLabel(dayN),
      freeUntilTimeLabel: formatTime12(defaultUntil),
    };
  }

  const today = todayDayNum();
  const blocks = buildBlocks(car, today);

  // Find future bookings or service events that start after nowMs
  const futureBlocks = blocks
    .filter((b) => b.startMs > nowMs && Number.isFinite(b.startMs))
    .sort((a, b) => a.startMs - b.startMs);

  const nextBooking = futureBlocks[0];
  let availableUntilMs: number;
  let hasUpcomingBooking = false;
  let nextBookingStartMs: number | null = null;

  if (nextBooking && Number.isFinite(nextBooking.startMs)) {
    availableUntilMs = nextBooking.startMs;
    hasUpcomingBooking = true;
    nextBookingStartMs = nextBooking.startMs;
  } else {
    // No upcoming booking on record: available for the full 24-hour cycle
    availableUntilMs = defaultUntil;
  }

  const diffMs = Math.max(0, availableUntilMs - nowMs);
  const availableHours = Math.max(1, Math.floor(diffMs / (3600 * 1000)));

  const untilParts = getIndiaDateParts(availableUntilMs);
  const untilDayNum = toDayNum(untilParts.year, untilParts.month, untilParts.date);
  const freeUntilTimeLabel = formatTime12(availableUntilMs);
  const freeUntilDateLabel = dayNumToLabel(untilDayNum);
  const availableTillLabel = untilDayNum === today ? freeUntilTimeLabel : `${freeUntilDateLabel}, ${freeUntilTimeLabel}`;

  return {
    availableUntilMs,
    availableHours,
    availableTillLabel,
    nextBookingStartMs,
    hasUpcomingBooking,
    freeUntilDateLabel,
    freeUntilTimeLabel,
  };
}

/** Attaches `availability` / `isAvailable` for the dates being viewed. */
export function withAvailability(
  cars: Car[],
  startLabel?: string,
  endLabel?: string,
  pickupTime?: string,
  returnTime?: string
): Car[] {
  return cars.map(car => {
    const availability = getAvailability(car, startLabel, endLabel, pickupTime, returnTime);
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