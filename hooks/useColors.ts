import colors from '@/constants/colors';
import { useSawari } from '@/context/SawariContext';

export function useColors() {
  const { isDarkMode } = useSawari();
  const palette = isDarkMode ? colors.dark : colors.light;
  return { ...palette, radius: colors.radius };
}
