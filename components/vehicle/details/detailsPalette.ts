import { useIsDarkMode } from '@/context/SawariContext';

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
  demandBg: 'rgba(251, 188, 4, 0.1)', // Figma "Gold/Bg" (urgency message, benefit circles)
  demandBorder: 'rgba(251, 188, 4, 0.21)',
  purple: '#323E71',
  purpleCheck: '#323E71',
  purpleBg: '#EEF0F7',
  purpleBgEnd: '#E3E6F1',
  purpleGlow: '#4B5A9E', // Figma "Ellipse 4" on the Why card
  purpleBorder: '#D9DDEC',
  memberBorder: '#D5D9EA',
  proBorder: '#B0DACB',
  radioRing: '#BFC3D4',
  greenBg: '#E6F3EE',
  greenBorder: '#B0DACB', // Green/green-100, as on the inclusions and payment-schedule cards
  redBg: '#FEF2F2', // Red/100 wash on "What's not included"
  redBorder: '#FEE2E2', // Red/100 border
  chipBg: '#EEF0F7',
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
  purple: '#3E509A',
  purpleCheck: '#6C7BC0',
  purpleBg: '#171D3A',
  purpleBgEnd: '#232C55',
  purpleGlow: '#2C3868',
  purpleBorder: '#27325E',
  memberBorder: '#2F3A6B',
  proBorder: '#245A48',
  radioRing: '#4A5878',
  greenBg: '#0F2A22',
  greenBorder: '#1C4A3B',
  redBg: '#2A1414',
  redBorder: '#4A2020',
  chipBg: '#171D3A',
  dotIdle: '#3A4760',
  barFade: '#0A1220',
  segBorder: '#263551',
  segOn: '#17233B',
  checkOff: '#4A5878',
};

export type DetailsPalette = typeof light;

export function useDetailsPalette(): DetailsPalette {
  return useIsDarkMode() ? dark : light;
}
