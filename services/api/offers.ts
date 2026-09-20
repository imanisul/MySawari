import { Feather } from '@expo/vector-icons';

export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  discount: string;
  code: string;
  expiry: string;
  gradientColors: [string, string];
  icon: keyof typeof Feather.glyphMap;
  image?: any;
}

// In the future, this data will come from the backend.
// We are structuring it this way so that swapping it out for a real `fetch` call is instantaneous.
const mockOffers: Offer[] = [
  {
    id: 'offer-1',
    title: 'First Ride Free',
    subtitle: 'Get ₹500 off on your first luxury car booking',
    discount: '₹500 OFF',
    code: 'SAWARI500',
    expiry: 'Valid till 30 Sep',
    gradientColors: ['#6178D8', '#8B5CF6'],
    icon: 'gift',
    image: require('../../assets/images/offer_car.jpg'),
  },
  {
    id: 'offer-2',
    title: 'Adventure Special',
    subtitle: 'Flat 20% off on all rugged motorcycles',
    discount: '20% OFF',
    code: 'BIKE20',
    expiry: 'Every Fri–Sun',
    gradientColors: ['#FF416C', '#FF4B2B'], // Ultra-premium vibrant red/orange
    icon: 'zap',
    image: require('../../assets/images/offer_bike.jpg'),
  },
  {
    id: 'offer-3',
    title: 'MySawari Cash',
    subtitle: 'Invite friends & earn ₹300 credits each',
    discount: '₹300 EACH',
    code: 'REFER300',
    expiry: 'No expiry',
    gradientColors: ['#38A169', '#34D399'],
    icon: 'users',
    image: require('../../assets/images/offer_wallet.jpg'),
  },
  {
    id: 'offer-4',
    title: 'Long Trip Deal',
    subtitle: 'Book 3+ days and get 15% off on total fare',
    discount: '15% OFF',
    code: 'LONGTRIP15',
    expiry: 'Valid till 15 Oct',
    gradientColors: ['#0EA5E9', '#6178D8'],
    icon: 'map-pin',
  },
];

export async function fetchOffers(): Promise<Offer[]> {
  // Since there is no backend API for offers yet, return an empty array
  // to avoid showing fake data.
  return new Promise((resolve) => resolve([]));
}
