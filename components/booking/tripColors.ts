import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

/**
 * Colours for Activity → Trip Details and its sheets (Figma "Booking"): the app palette with the design's
 * navy actions and plain white/grey surfaces in place of the lime brand accents. Same keys as useColors,
 * so every screen that used useColors keeps working unchanged.
 */
export function useTripColors() {
  const base = useColors();
  const { isDarkMode } = useSawari();
  if (isDarkMode) {
    return { ...base, primary: '#3E509A', primaryForeground: '#FFFFFF', primaryText: '#A5B6FF', navy: '#3E509A', lime: '#8B7CF6', blue: '#A5B6FF', segBorder: '#263551' };
  }
  return {
    ...base,
    background: '#FFFFFF',
    card: '#FAFAFA',
    foreground: '#262626',
    mutedForeground: '#737373',
    border: '#E5E5E5',
    muted: '#F5F5F5',
    primary: '#2F3E75',
    primaryForeground: '#FFFFFF',
    primaryText: '#262626',
    navy: '#2F3E75',
    lime: '#6152D8',
    blue: '#2F3E75',
    segBorder: '#EAECF1',
    lightBlue: '#F4F6FA',
    tintLight: '#F4F6FA',
    success: '#008758',
    destructive: '#DC2626',
    warning: '#B58703',
  };
}