/**
 * Vehicle Knowledge Base — enriched specs from real-world data.
 *
 * This file contains curated specifications for vehicles commonly found in
 * the MySawari fleet. The data is sourced from manufacturer specs and is used
 * to enrich the car/bike details page without storing anything extra in the DB.
 *
 * Lookup is done by fuzzy-matching the vehicle name from the database.
 */

export interface VehicleKnowledge {
  /** Short marketing-style description. */
  description: string;
  /** Engine displacement or motor info. */
  engine?: string;
  /** Real-world mileage. */
  mileage?: string;
  /** Boot space / storage. */
  bootSpace?: string;
  /** Ground clearance in mm. */
  groundClearance?: string;
  /** Kerb weight. */
  kerbWeight?: string;
  /** Number of doors. */
  doors?: string;
  /** Number of airbags. */
  airbags?: string;
  /** Tank capacity. */
  tankCapacity?: string;
  /** Top speed. */
  topSpeed?: string;
  /** 0-100 kmph time. */
  acceleration?: string;
  /** Tyre size. */
  tyreSize?: string;
  /** Braking system. */
  brakes?: string;
  /** Features list. */
  features?: string[];
  /** Good-for / highlights. */
  highlights?: string[];
  /** Luggage capacity description. */
  luggage?: string;
}

// Keyed by lowercase patterns that will be fuzzy-matched against the vehicle name from the DB.
const KNOWLEDGE_DB: Record<string, VehicleKnowledge> = {
  'creta': {
    description: 'The Hyundai Creta is a premium compact SUV known for its bold design, spacious cabin, and feature-rich interior. Ideal for highway journeys, family road trips, and comfortable city driving.',
    engine: '1.5L Petrol / 1.5L Diesel',
    mileage: '17–21 km/l',
    bootSpace: '433 litres',
    groundClearance: '190 mm',
    kerbWeight: '1,280 kg',
    doors: '5',
    airbags: '6',
    tankCapacity: '50 litres',
    topSpeed: '180 km/h',
    tyreSize: '215/60 R17',
    brakes: 'Disc (Front & Rear)',
    features: ['Panoramic Sunroof', 'Ventilated Seats', '10.25" Touchscreen', 'Wireless Charging', 'ADAS Level 2', 'Connected Car Tech', 'Bose Sound System', 'Cruise Control', 'Reverse Camera', 'Push Start', 'Auto AC', 'USB-C Charging'],
    highlights: ['Family road trips', 'Highway travel', 'Premium comfort', 'Feature loaded'],
    luggage: '3 large bags',
  },
  'seltos': {
    description: 'The Kia Seltos is a stylish and powerful compact SUV offering premium build quality, advanced tech, and strong performance. Perfect for long drives and everyday commuting.',
    engine: '1.5L Diesel Turbo / 1.5L Petrol',
    mileage: '17–20 km/l',
    bootSpace: '433 litres',
    groundClearance: '190 mm',
    kerbWeight: '1,320 kg',
    doors: '5',
    airbags: '6',
    tankCapacity: '50 litres',
    topSpeed: '175 km/h',
    tyreSize: '215/60 R17',
    brakes: 'Disc (Front & Rear)',
    features: ['Sunroof', '10.25" HD Display', 'Bose Premium Audio', 'Ventilated Seats', 'Connected Car Tech', 'Air Purifier', 'Drive Modes', 'Wireless CarPlay', 'Reverse Camera', 'Auto AC', 'Cruise Control'],
    highlights: ['Long distance comfort', 'Premium interiors', 'Highway cruiser', 'Great boot space'],
    luggage: '3 large bags',
  },
  'swift': {
    description: 'The Maruti Suzuki Swift is India\'s favourite hatchback — zippy, fuel-efficient, and easy to park. An excellent choice for city drives and short getaways.',
    engine: '1.2L Petrol DualJet',
    mileage: '22–25 km/l',
    bootSpace: '268 litres',
    groundClearance: '163 mm',
    kerbWeight: '880 kg',
    doors: '5',
    airbags: '2',
    tankCapacity: '37 litres',
    topSpeed: '170 km/h',
    tyreSize: '185/65 R15',
    brakes: 'Disc (Front) / Drum (Rear)',
    features: ['SmartPlay Infotainment', 'Auto AC', 'Steering Controls', 'Push Start', 'Reverse Camera', 'Auto Headlamps', 'USB Charging', 'Bluetooth'],
    highlights: ['City driving', 'Easy parking', 'Fuel efficient', 'Nimble handling'],
    luggage: '2 medium bags',
  },
  'scorpio': {
    description: 'The Mahindra Scorpio is a rugged, powerful SUV built for tough terrain and large families. With commanding road presence and a high driving position, it\'s perfect for adventurous trips.',
    engine: '2.2L mHawk Diesel Turbo',
    mileage: '14–16 km/l',
    bootSpace: '460 litres',
    groundClearance: '208 mm',
    kerbWeight: '1,865 kg',
    doors: '5',
    airbags: '6',
    tankCapacity: '57 litres',
    topSpeed: '180 km/h',
    tyreSize: '245/65 R17',
    brakes: 'Disc (Front & Rear)',
    features: ['8" Touchscreen', 'Sunroof', 'Connected Tech', 'Cruise Control', 'Drive Modes', 'Tyre Pressure Monitor', 'Hill Hold', 'Auto AC', 'Dual Zone AC', 'USB Charging'],
    highlights: ['Off-road capable', 'Family trips', 'Commanding presence', '7-seater'],
    luggage: '4 large bags',
  },
  'nexon': {
    description: 'The Tata Nexon is a 5-star safety rated compact SUV offering great value, strong build quality, and impressive tech. A versatile choice for city and highway driving.',
    engine: '1.2L Turbo Petrol / 1.5L Diesel',
    mileage: '17–24 km/l',
    bootSpace: '382 litres',
    groundClearance: '209 mm',
    kerbWeight: '1,260 kg',
    doors: '5',
    airbags: '6',
    tankCapacity: '44 litres',
    topSpeed: '180 km/h',
    tyreSize: '215/60 R16',
    brakes: 'Disc (Front & Rear)',
    features: ['10.25" Touchscreen', 'Sunroof', 'JBL Sound System', 'Connected Car Tech', 'Air Purifier', 'Wireless Charging', 'Ventilated Seats', 'Auto AC', 'Cruise Control', 'Push Start'],
    highlights: ['5-star safety', 'Great build quality', 'Value for money', 'City + highway'],
    luggage: '2–3 large bags',
  },
  'curvv': {
    description: 'The Tata Curvv is a futuristic coupe-SUV with sleek design and cutting-edge technology. Available in both EV and ICE variants, it redefines the compact SUV segment.',
    engine: 'Electric Motor / 1.2L Turbo Petrol',
    mileage: '500 km range (EV) / 18 km/l',
    bootSpace: '500 litres',
    groundClearance: '190 mm',
    kerbWeight: '1,630 kg (EV)',
    doors: '5',
    airbags: '6',
    tankCapacity: 'N/A (EV)',
    topSpeed: '190 km/h',
    tyreSize: '215/55 R18',
    brakes: 'Disc (Front & Rear)',
    features: ['12.3" Touchscreen', 'Digital Cockpit', 'ADAS', 'Panoramic Sunroof', 'JBL Sound', 'Wireless Charging', 'Connected Car Tech', 'Vehicle-to-Load', 'Ventilated Seats', '360° Camera'],
    highlights: ['Eco-friendly', 'Futuristic design', 'Long range', 'Tech loaded'],
    luggage: '3 large bags',
  },
  'jawa': {
    description: 'The Jawa 300 is a classic-styled motorcycle blending retro charm with modern engineering. Smooth on city roads and a joy on open highways, it\'s a rider\'s delight.',
    engine: '293cc Liquid-Cooled',
    mileage: '30–37 km/l',
    tankCapacity: '14 litres',
    topSpeed: '145 km/h',
    kerbWeight: '184 kg',
    tyreSize: '90/90-18 (F) / 120/80-17 (R)',
    brakes: 'Disc (Dual-Channel ABS)',
    features: ['Classic Chrome Styling', 'LED Tail Lamp', 'Dual-Channel ABS', 'Analogue Speedometer', 'Halogen Headlamp'],
    highlights: ['City commute', 'Weekend rides', 'Classic styling', 'Smooth engine'],
  },
  'xpulse': {
    description: 'The Hero Xpulse 200 is a true adventure motorcycle — capable on both tarmac and off-road trails. Lightweight, agile, and built for exploration.',
    engine: '199.6cc Air-Cooled',
    mileage: '35–42 km/l',
    tankCapacity: '13 litres',
    topSpeed: '118 km/h',
    kerbWeight: '154 kg',
    groundClearance: '220 mm',
    tyreSize: '90/90-21 (F) / 120/80-18 (R)',
    brakes: 'Disc (Dual-Channel ABS)',
    features: ['LED Headlamp', 'Digital Cluster', 'Turn-by-Turn Nav', 'USB Charging', 'Dual-Channel ABS', 'Long Travel Suspension'],
    highlights: ['Off-road adventures', 'Trail riding', 'Lightweight', 'Great mileage'],
  },
  'hunter': {
    description: 'The Royal Enfield Hunter 350 is a modern roadster with retro soul. Easy to handle, smooth to ride, and perfect for city commutes and weekend getaways.',
    engine: '349cc Air-Oil Cooled',
    mileage: '33–38 km/l',
    tankCapacity: '13 litres',
    topSpeed: '120 km/h',
    kerbWeight: '181 kg',
    tyreSize: '100/80-17 (F) / 120/80-17 (R)',
    brakes: 'Disc (Dual-Channel ABS)',
    features: ['Tripper Navigation', 'LED DRL', 'USB Charging', 'Dual-Channel ABS', 'Hazard Lamps', 'Analogue-Digital Cluster'],
    highlights: ['City commute', 'Easy handling', 'Smooth ride', 'Retro modern'],
  },
  'thar': {
    description: 'The Mahindra Thar is the ultimate off-road machine — convertible top, 4x4 drivetrain, and rugged build for serious adventure seekers.',
    engine: '2.0L Turbo Petrol / 2.2L Diesel',
    mileage: '11–15 km/l',
    bootSpace: 'Small (adventure oriented)',
    groundClearance: '226 mm',
    kerbWeight: '1,750 kg',
    doors: '4',
    airbags: '2',
    tankCapacity: '57 litres',
    topSpeed: '155 km/h',
    tyreSize: '255/65 R18',
    brakes: 'Disc (Front & Rear)',
    features: ['4x4 Low Range', 'Convertible Top', 'Touchscreen', 'Adventure Stats', 'Cruise Control', 'Roll Cage', 'Drizzle-proof Roof'],
    highlights: ['Off-road king', 'Convertible roof', '4x4 adventure', 'Hilly terrain'],
    luggage: '1–2 bags',
  },
  'city': {
    description: 'The Honda City is a premium sedan known for its refinement, spacious cabin, and excellent ride quality. A top choice for comfortable city and highway driving.',
    engine: '1.5L i-VTEC Petrol',
    mileage: '17–19 km/l',
    bootSpace: '506 litres',
    groundClearance: '165 mm',
    kerbWeight: '1,125 kg',
    doors: '4',
    airbags: '6',
    tankCapacity: '40 litres',
    topSpeed: '195 km/h',
    tyreSize: '185/55 R16',
    brakes: 'Disc (Front) / Drum (Rear)',
    features: ['8" Touchscreen', 'Honda Connect', 'Lane Watch Camera', 'Sunroof', 'LED Headlamps', 'Cruise Control', 'Auto AC', 'Wireless Charging'],
    highlights: ['Comfortable sedan', 'Huge boot space', 'Refined engine', 'City + highway'],
    luggage: '4 large bags',
  },
  'alto': {
    description: 'The Maruti Alto K10 is an extremely fuel-efficient, easy-to-drive hatchback. Perfect for quick errands and daily city commuting.',
    engine: '1.0L K-Series Petrol',
    mileage: '24–27 km/l',
    bootSpace: '214 litres',
    groundClearance: '160 mm',
    kerbWeight: '728 kg',
    doors: '5',
    airbags: '2',
    tankCapacity: '27 litres',
    topSpeed: '150 km/h',
    tyreSize: '145/80 R13',
    brakes: 'Disc (Front) / Drum (Rear)',
    features: ['7" Touchscreen', 'Android Auto', 'Dual Airbags', 'ABS with EBD', 'Power Windows', 'Central Locking'],
    highlights: ['Ultra fuel efficient', 'Easy parking', 'Budget friendly', 'City commute'],
    luggage: '1–2 bags',
  },
  'mercedes': {
    description: 'The Mercedes-Benz E-Class is the pinnacle of luxury sedans — effortless power, supreme comfort, and cutting-edge technology for those who demand the best.',
    engine: '2.0L Turbo Petrol / 2.0L Diesel',
    mileage: '10–14 km/l',
    bootSpace: '540 litres',
    groundClearance: '147 mm',
    kerbWeight: '1,790 kg',
    doors: '4',
    airbags: '9',
    tankCapacity: '66 litres',
    topSpeed: '250 km/h (limited)',
    acceleration: '6.2s (0-100)',
    tyreSize: '245/45 R18',
    brakes: 'Disc (Front & Rear)',
    features: ['MBUX Infotainment', 'Burmester Sound', 'Air Suspension', 'Massage Seats', 'Ambient Lighting', '360° Camera', 'Heads-Up Display', 'Wireless Charging', 'ADAS', 'Panoramic Sunroof'],
    highlights: ['Premium luxury', 'Special occasions', 'Airport transfers', 'Executive travel'],
    luggage: '4+ large bags',
  },
};

/**
 * Looks up enriched specs for a vehicle by matching its name against the knowledge base.
 * Falls back to sensible defaults derived from the vehicle's basic info.
 */
export function getVehicleKnowledge(vehicleName: string, vehicleType: 'Car' | 'Bike'): VehicleKnowledge {
  const name = vehicleName.toLowerCase();

  // Try to find a matching key in the knowledge DB
  for (const [key, knowledge] of Object.entries(KNOWLEDGE_DB)) {
    if (name.includes(key)) {
      return knowledge;
    }
  }

  // Fallback: generate sensible defaults based on vehicle type
  if (vehicleType === 'Bike') {
    return {
      description: `The ${vehicleName} is a reliable motorcycle ready for your next adventure. Well-maintained and regularly serviced for a smooth riding experience.`,
      features: ['Disc Brakes', 'LED Headlamp', 'USB Charging', 'Digital Cluster'],
      highlights: ['City commute', 'Quick errands', 'Easy handling'],
    };
  }

  return {
    description: `The ${vehicleName} is a well-maintained vehicle offering comfort and reliability for your trips. Regularly serviced and ready to go.`,
    doors: '4',
    features: ['Air Conditioning', 'Power Steering', 'Central Locking', 'Power Windows', 'Bluetooth', 'USB Charging'],
    highlights: ['Comfortable rides', 'Reliable vehicle', 'Well maintained'],
    luggage: '2–3 bags',
  };
}
