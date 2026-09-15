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
};

const today = new Date();
export const getDynamicDate = (offset: number) => {
  const d = new Date(today);
  d.setDate(today.getDate() + offset);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

export const categories: Category[] = ['All', 'SUV', 'Sedan', 'Hatchback', 'MUV', 'Luxury', 'Bike'];

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
  },
];

export const cars = baseCars.map((car, index) => ({
  ...car,
  availabilityDate: getDynamicDate(index % 7)
}));

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
  },
];

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