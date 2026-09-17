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
  category: Exclude<Category, 'All'>;
  price: string;
  perDay: number;
  image: ImageSourcePropType;
  seats: string;
  transmission: string;
  fuel: string;
  mileage?: string;
  availabilityDate?: string;

  // New UI features
  images?: ImageSourcePropType[];
  rating?: number;
  reviewCount?: number;
  description?: string;
  features?: string[];
  luggage?: string;
  doors?: string;
  modelYear?: string;
  ratingDistribution?: RatingDistribution;
  reviews?: Review[];
};

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

export const checkCarAvailability = (carAvailabilityDate: string | undefined, selectedStartDate: string): boolean => {
  if (!carAvailabilityDate || carAvailabilityDate === 'Available Now') return true;
  if (!selectedStartDate || selectedStartDate.includes('Select') || selectedStartDate === 'Available Now') return true;
  
  const parseDate = (dStr: string) => {
    const parts = dStr.trim().split(' ');
    if (parts.length < 2) return 0;
    const day = parseInt(parts[0], 10);
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Sept'];
    let month = MONTHS.indexOf(parts[1]);
    if (month === 12) month = 8; // Handle 'Sept' as 'Sep'
    if (month === -1) return 0;
    return new Date(new Date().getFullYear(), month, day).getTime();
  };
  
  const selectedTime = parseDate(selectedStartDate);
  const carTime = parseDate(carAvailabilityDate);
  return carTime <= selectedTime;
};

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
