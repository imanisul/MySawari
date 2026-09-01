import { ImageSourcePropType } from 'react-native';

export type Category = 'All' | 'SUV' | 'Sedan' | 'Hatchback' | 'MUV' | 'Luxury';
export type DriverMode = 'Self Drive' | 'With Driver';

export type Car = {
  id: string;
  name: string;
  category: Exclude<Category, 'All'>;
  price: string;
  perDay: number;
  image: ImageSourcePropType;
  seats: string;
  transmission: string;
  fuel: string;
};

export const categories: Category[] = ['All', 'SUV', 'Sedan', 'Hatchback', 'MUV', 'Luxury'];

export const cars: Car[] = [
  {
    id: 'creta',
    name: 'Hyundai Creta',
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
    category: 'Hatchback',
    price: '₹1,800',
    perDay: 1800,
    image: require('../assets/images/swift.jpg'),
    seats: '5 seats',
    transmission: 'Manual',
    fuel: 'Petrol',
  },
];

export const resultCars: Car[] = [
  { ...cars[0], image: require('../assets/images/creta.jpg') },
  {
    id: 'seltos-result',
    name: 'Kia Seltos',
    category: 'SUV',
    price: '₹2,500',
    perDay: 2500,
    image: require('../assets/images/seltos.jpg'),
    seats: '5 seats',
    transmission: 'Automatic',
    fuel: 'Diesel',
  },
  {
    id: 'swift-result',
    name: 'Suzuki Swift',
    category: 'Hatchback',
    price: '₹1,800',
    perDay: 1800,
    image: require('../assets/images/swift.jpg'),
    seats: '5 seats',
    transmission: 'Manual',
    fuel: 'Petrol',
  }
];

// Mock API functions for future backend integration
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchCars(): Promise<Car[]> {
  await delay(800); // Simulate network latency
  return cars;
}

export async function fetchResultCars(): Promise<Car[]> {
  await delay(1200);
  return resultCars;
}