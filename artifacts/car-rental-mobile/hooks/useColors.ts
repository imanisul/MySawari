import colors from '@/constants/colors';

export function useColors() {
  const palette = colors.light;
  return { ...palette, radius: colors.radius };
}
