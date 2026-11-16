import { useLocalSearchParams } from 'expo-router';

/** Top Deals (under a day) include only 150 km, then ₹5 for every extra km. A normal 1-day booking gets ONE_DAY_KM; unlimited from 2 days. */
export const TOP_DEAL_KM = 150;
export const ONE_DAY_KM = 300;
export const TOP_DEAL_EXTRA_KM_RATE = 5;

export const useIsTopDeal = () => useLocalSearchParams<{ isTopDeal?: string }>().isTopDeal === 'true';
