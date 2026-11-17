import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton, SkeletonGroup } from '@/components/common/Skeleton';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

/**
 * My Trips card while trips load, built like the real TripCard so nothing moves when they arrive: 12-radius bordered
 * card, padding 8; a 120 × 116 car photo beside the status tag, car name, dates line, driver · days line and the
 * "Rate us" / "View Details" row; then the 30-high action bar (Book Again / extend).
 */
export function BookingSkeleton({ index = 0 }: { index?: number }) {
  const p = useDetailsPalette();
  const d = index * 90;
  return (
    <SkeletonGroup>
      <View style={[styles.card, { borderColor: p.segBorder, backgroundColor: p.page }]}>
        <View style={styles.top}>
          <Skeleton width={120} height={116} borderRadius={6} delay={d} />
          <View style={styles.info}>
            <Skeleton width={64} height={18} borderRadius={999} style={{ marginBottom: 2 }} delay={d + 50} />
            <Skeleton width="70%" height={14} borderRadius={5} style={{ marginVertical: 3 }} delay={d + 90} />
            <Skeleton width="92%" height={11} borderRadius={4} style={{ marginVertical: 3.5 }} delay={d + 120} />
            <Skeleton width="56%" height={11} borderRadius={4} style={{ marginVertical: 3.5 }} delay={d + 150} />
            <View style={styles.linksRow}>
              <Skeleton width={72} height={24} borderRadius={999} delay={d + 180} />
              <Skeleton width={52} height={10} borderRadius={4} delay={d + 200} />
            </View>
          </View>
        </View>
        <Skeleton width="100%" height={30} borderRadius={8} delay={d + 230} />
      </View>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  // Real card: border 1, radius 12, padding 8, gap 12 (done) / 6; list gap 12.
  card: { borderWidth: 1, borderRadius: 12, padding: 8, gap: 10, marginBottom: 12 },
  top: { flexDirection: 'row', gap: 12 },
  info: { flex: 1, minWidth: 0, gap: 3 },
  linksRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
});
