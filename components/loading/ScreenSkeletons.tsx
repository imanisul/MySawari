import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton } from '@/components/common/Skeleton';
import { useColors } from '@/hooks/useColors';

/** A card-shaped container matching the real cards' surface, for skeleton content to sit in. */
function SkeletonCard({ children, style }: { children: React.ReactNode; style?: any }) {
  const colors = useColors();
  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }, style]}>{children}</View>
  );
}

const Row = ({ delay = 0 }: { delay?: number }) => (
  <View style={styles.row}>
    <Skeleton width="42%" height={14} borderRadius={6} delay={delay} />
    <Skeleton width={64} height={14} borderRadius={6} delay={delay + 60} />
  </View>
);

/** Booking details while the trip loads. */
export function BookingDetailSkeleton() {
  return (
    <View>
      <SkeletonCard style={styles.rowCard}>
        <View style={{ flex: 1, gap: 8 }}>
          <Skeleton width={70} height={11} borderRadius={4} />
          <Skeleton width={150} height={18} borderRadius={6} delay={60} />
        </View>
        <Skeleton width={84} height={16} borderRadius={8} delay={120} />
      </SkeletonCard>

      <Skeleton width={70} height={11} borderRadius={4} style={styles.label} />
      <SkeletonCard style={{ padding: 0, overflow: 'hidden' }}>
        <Skeleton width="100%" height={150} borderRadius={0} delay={80} />
        <View style={{ padding: 16, gap: 10 }}>
          <Skeleton width="60%" height={20} borderRadius={6} delay={140} />
          <Skeleton width="38%" height={13} borderRadius={5} delay={200} />
        </View>
      </SkeletonCard>

      <Skeleton width={50} height={11} borderRadius={4} style={styles.label} />
      <SkeletonCard style={{ gap: 10 }}>
        <Skeleton width={90} height={11} borderRadius={4} delay={100} />
        <Skeleton width="45%" height={18} borderRadius={6} delay={160} />
        <Skeleton width="60%" height={12} borderRadius={5} delay={220} />
      </SkeletonCard>

      <Skeleton width={70} height={11} borderRadius={4} style={styles.label} />
      <SkeletonCard style={{ gap: 16 }}>
        {[0, 1, 2, 3].map((i) => <Row key={i} delay={i * 80} />)}
      </SkeletonCard>
    </View>
  );
}

/** Wallet history list while it loads. */
export function PaymentsSkeleton() {
  return (
    <SkeletonCard style={{ padding: 0, marginBottom: 24 }}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={[styles.txRow, i < 3 && styles.txDivider]}>
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="65%" height={15} borderRadius={6} delay={i * 90} />
            <Skeleton width="30%" height={11} borderRadius={5} delay={i * 90 + 60} />
          </View>
          <Skeleton width={54} height={16} borderRadius={6} delay={i * 90 + 100} />
        </View>
      ))}
    </SkeletonCard>
  );
}

/** Refer & Earn while it loads: hero card, share button and the referrals card. */
export function ReferralSkeleton() {
  return (
    <View style={{ padding: 16 }}>
      <Skeleton width="100%" height={430} borderRadius={24} />
      <Skeleton width="100%" height={56} borderRadius={16} delay={120} style={{ marginTop: 20 }} />
      <SkeletonCard style={{ marginTop: 24, gap: 16 }}>
        <Skeleton width={140} height={18} borderRadius={6} delay={160} />
        <View style={styles.row}>
          <Skeleton width={90} height={46} borderRadius={8} delay={200} />
          <Skeleton width={90} height={46} borderRadius={8} delay={240} />
        </View>
      </SkeletonCard>
    </View>
  );
}

/** Checkout price cards while the quote is being worked out (instead of showing ₹0). */
export function PriceSummarySkeleton() {
  return (
    <View>
      <Skeleton width={150} height={18} borderRadius={6} style={{ marginTop: 24, marginBottom: 12 }} />
      <SkeletonCard style={{ gap: 14 }}>
        <Skeleton width="55%" height={18} borderRadius={6} delay={40} />
        <Skeleton width="40%" height={12} borderRadius={5} delay={100} />
        <Row delay={140} />
      </SkeletonCard>

      <Skeleton width={130} height={18} borderRadius={6} style={{ marginTop: 8, marginBottom: 12 }} />
      <SkeletonCard style={{ gap: 16 }}>
        {[0, 1, 2, 3, 4].map((i) => <Row key={i} delay={i * 70} />)}
        <Skeleton width="100%" height={22} borderRadius={6} delay={380} />
      </SkeletonCard>
    </View>
  );
}

/** Ride-journey progress on the profile while it loads. */
export function LoyaltySkeleton() {
  return (
    <View>
      <Skeleton width="80%" height={13} borderRadius={5} style={{ marginBottom: 20 }} />
      <View style={styles.circleRow}>
        {[0, 1, 2, 3].map((i) => <Skeleton key={i} width={50} height={50} borderRadius={25} delay={i * 90} />)}
      </View>
    </View>
  );
}

/** Customer reviews while they load (so the "no reviews yet" message never flashes first). */
export function ReviewListSkeleton() {
  return (
    <View style={{ gap: 12, paddingVertical: 8 }}>
      {[0, 1].map((i) => (
        <SkeletonCard key={i} style={{ gap: 12 }}>
          <View style={styles.reviewHead}>
            <Skeleton width={40} height={40} borderRadius={20} delay={i * 120} />
            <View style={{ flex: 1, gap: 7 }}>
              <Skeleton width="45%" height={14} borderRadius={5} delay={i * 120 + 40} />
              <Skeleton width="28%" height={11} borderRadius={5} delay={i * 120 + 80} />
            </View>
          </View>
          <Skeleton width="100%" height={12} borderRadius={5} delay={i * 120 + 120} />
          <Skeleton width="78%" height={12} borderRadius={5} delay={i * 120 + 160} />
        </SkeletonCard>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  rowCard: { flexDirection: 'row', alignItems: 'center', marginTop: 32 },
  label: { marginTop: 32, marginBottom: 12 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  txRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 16 },
  txDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'rgba(128,140,160,0.25)' },
  circleRow: { flexDirection: 'row', justifyContent: 'space-between' },
  reviewHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});
