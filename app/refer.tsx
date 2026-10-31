import React from 'react';
import ReferEarnScreen from '@/screens/Referral/ReferEarnScreen';

// Figma "Refer & Earn". (The older screen, screens/Referral/ReferralScreen.tsx, is no longer routed:
// its referral list moved to /referrals and withdrawals to /wallet.)
export default function Route() {
  return <ReferEarnScreen />;
}