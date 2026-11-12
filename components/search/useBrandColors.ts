import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

/**
 * MySawari navy for selected states. The light-theme navy vanishes against the
 * dark-theme background, so dark mode uses the brand blue instead.
 */
export function useBrandColors() {
  const colors = useColors();
  const { isDarkMode } = useSawari();
  return {
    colors,
    navy: isDarkMode ? colors.blue : colors.navy,
    onNavy: '#FFFFFF',
    /** Light tint used for "inside the selected range". */
    navyTint: isDarkMode ? colors.accent : colors.lightBlue,
  };
}
