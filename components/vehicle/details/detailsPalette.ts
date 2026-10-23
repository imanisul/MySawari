import { useSawari } from '@/context/SawariContext';

// Car details page colours, taken from the Figma "Car Detail Page" frame (light). Dark keeps the same roles.
// Type on this page is the design's 'Plus Jakarta Sans' (PlusJakartaSans_* weights, loaded in app/_layout.tsx),
// not the Inter used elsewhere in the app.
const light = {
  page: '#FFFFFF',
  fg: '#262626',
  body: '#404040',
  sub: '#525252',
  muted: '#737373',
  navy: '#2F3E75',
  onNavy: '#FFFFFF',
  green: '#008758',
  red: '#DC2626',
  amber: '#B58703',
  star: '#FBBC04',
  whatsapp: '#25D366',
  soft: '#FAFAFA',
  iconBg: '#F5F5F5',
  summary: '#F4F6FA',
  border: '#E5E5E5',
  strongBorder: '#D4D4D4',
  divider: '#EFEFEF',
  deliveryBorder: '#E7EAF4',
  // Gold/Bg = rgba(251,188,4,0.1); its border is the same wash at 0.21 alpha.
  demandBg: 'rgba(251, 188, 4, 0.1)',
  demandBorder: 'rgba(251, 188, 4, 0.21)',
  purple: '#6152D8',
  purpleCheck: '#6B5AED',
  purpleBg: '#F0EFFD',
  purpleBgEnd: '#E2DCFC',
  purpleGlow: '#B3AAF5',
  purpleBorder: '#E0DDFB',
  memberBorder: '#D1CCF9',
  proBorder: '#B0DACB',
  radioRing: '#BFC3D4',
  greenBg: '#E6F3EE',
  greenBorder: '#B0DACB', // Green/green-100, as on the inclusions and payment-schedule cards
  redBg: '#FEF2F2', // Red/100 wash on "What's not included"
  redBorder: '#FEE2E2', // Red/100 border
  chipBg: '#F0EFFD',
  dotIdle: '#E5E5E5',
  barFade: '#F1F3F6',
  segBorder: '#EAECF1',
  segOn: '#F9F9FB',
  checkOff: '#9FA6C0',
};

const dark: typeof light = {
  page: '#0A1220',
  fg: '#F3F6FB',
  body: '#D5DBE6',
  sub: '#BAC3D3',
  muted: '#A7B2C6',
  navy: '#3E509A',
  onNavy: '#FFFFFF',
  green: '#34D399',
  red: '#F87171',
  amber: '#FBBF24',
  star: '#FBBC04',
  whatsapp: '#25D366',
  soft: '#121D31',
  iconBg: '#17233B',
  summary: '#121D31',
  border: '#263551',
  strongBorder: '#33415E',
  divider: '#263551',
  deliveryBorder: '#263551',
  demandBg: 'rgba(251, 188, 4, 0.12)',
  demandBorder: 'rgba(251, 188, 4, 0.26)',
  purple: '#5446C9',
  purpleCheck: '#8B7CF6',
  purpleBg: '#1E1B3A',
  purpleBgEnd: '#2A2452',
  purpleGlow: '#3A3170',
  purpleBorder: '#332D5E',
  memberBorder: '#3D3670',
  proBorder: '#245A48',
  radioRing: '#4A5878',
  greenBg: '#0F2A22',
  greenBorder: '#1C4A3B',
  redBg: '#2A1414',
  redBorder: '#4A2020',
  chipBg: '#1E1B3A',
  dotIdle: '#3A4760',
  barFade: '#0A1220',
  segBorder: '#263551',
  segOn: '#17233B',
  checkOff: '#4A5878',
};

export type DetailsPalette = typeof light;

export function useDetailsPalette(): DetailsPalette {
  const { isDarkMode } = useSawari();
  return isDarkMode ? dark : light;
}
