import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton, SkeletonGroup } from '@/components/common/Skeleton';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

/**
 * Home "Recommended Cars" / "Recently Viewed" tile while cars load, built like TopPickCard: 246 wide, 1px border,
 * radius 12, padding 2; a 144-high photo (radius 8) with the "Best for" pill; then name + specs beside the rating
 * pill (a 37-high row) and the price beside the availability line.
 */
export function HomeCarSkeleton({ delay = 0 }: { delay?: number }) {
  const p = useDetailsPalette();
  return (
    <SkeletonGroup>
      <View style={[styles.card, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
        <View style={styles.photo}>
          <Skeleton width="100%" height={144} borderRadius={8} delay={delay} />
          <View style={[styles.tag, { backgroundColor: p.page }]} />
        </View>
        <View style={styles.body}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1, gap: 5 }}>
              <Skeleton width="68%" height={13} borderRadius={5} delay={delay + 60} />
              <Skeleton width="82%" height={10} borderRadius={4} delay={delay + 100} />
            </View>
            <Skeleton width={44} height={22} borderRadius={20} delay={delay + 120} />
          </View>
          <View style={styles.priceRow}>
            <Skeleton width={78} height={16} borderRadius={5} delay={delay + 150} />
            <Skeleton width={70} height={10} borderRadius={4} delay={delay + 180} />
          </View>
        </View>
      </View>
    </SkeletonGroup>
  );
}

/** A row of tiles exactly as the real horizontal list sits (16 in from the edge, 8 between). */
export function HomeCarRowSkeleton() {
  return (
    <View style={styles.row} pointerEvents="none">
      <HomeCarSkeleton />
      <HomeCarSkeleton delay={90} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: 246, borderWidth: 1, borderRadius: 12, padding: 2, overflow: 'hidden' },
  photo: { height: 144, borderRadius: 8, overflow: 'hidden' },
  tag: { position: 'absolute', top: 4, left: 4, width: 96, height: 20, borderRadius: 20, opacity: 0.7 },
  body: { paddingHorizontal: 4, paddingTop: 4, paddingBottom: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', height: 37, gap: 8 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  row: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, overflow: 'hidden' },
});
