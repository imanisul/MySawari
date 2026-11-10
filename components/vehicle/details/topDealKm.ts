import { useLocalSearchParams } from 'expo-router';

/** A Top Deal booking is not unlimited: 200 km included, then ₹5 for every extra km. */
export const TOP_DEAL_KM = 200;
export const TOP_DEAL_EXTRA_KM_RATE = 5;

export const useIsTopDeal = () => useLocalSearchParams<{ isTopDeal?: string }>().isTopDeal === 'true';
