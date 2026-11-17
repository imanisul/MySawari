import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Skeleton, SkeletonGroup } from '@/components/common/Skeleton';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

/**
 * Loading placeholder built block for block like the real car card (CarListCard / the Today's Deals card), so nothing
 * moves when the cars arrive: same 12-radius bordered card, 4/4/8 padding, 212-high photo with the "Best for" pill,
 * heart and dots, then name + specs beside the rating pill, then price beside "View Details".
 * `variant="deal"` is the Today's Deals card: no side margin (its list sets the width) and the Start → End strip.
 */
export function CarCardSkeleton({ index = 0, variant = 'list' }: { index?: number; variant?: 'list' | 'deal' }) {
  const p = useDetailsPalette();
  const d = index * 90;
  const deal = variant === 'deal';
  return (
    <SkeletonGroup>
      <View style={deal ? null : styles.wrap}>
        <View style={[styles.card, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
          {/* Photo (212) with its overlays */}
          <View style={styles.photo}>
            <Skeleton width="100%" height={212} borderRadius={8} delay={d} />
            <View style={styles.photoTop} pointerEvents="none">
              <View style={[styles.pill, { backgroundColor: p.page }]} />
              <View style={[styles.heart, { backgroundColor: p.page }]} />
            </View>
            <View style={styles.dots} pointerEvents="none">
              <View style={[styles.dotOn, { backgroundColor: p.page }]} />
              <View style={[styles.dot, { backgroundColor: p.page }]} />
              <View style={[styles.dot, { backgroundColor: p.page }]} />
            </View>
          </View>

          <View style={styles.body}>
            {/* Name (26) + specs (20) | rating pill (28) + reviews */}
            <View style={styles.titleRow}>
              <View style={{ flex: 1, gap: 4 }}>
                <Skeleton width="58%" height={20} borderRadius={6} style={{ marginVertical: 3 }} delay={d + 60} />
                <Skeleton width="72%" height={14} borderRadius={5} style={{ marginVertical: 3 }} delay={d + 100} />
              </View>
              <View style={styles.ratingCol}>
                <Skeleton width={56} height={28} borderRadius={20} delay={d + 120} />
                <Skeleton width={70} height={12} borderRadius={4} delay={d + 150} />
              </View>
            </View>

            {deal && <Skeleton width="100%" height={44} borderRadius={8} delay={d + 170} />}

            {/* Price | View Details (25 high) */}
            <View style={styles.priceBar}>
              <Skeleton width={96} height={20} borderRadius={6} delay={d + 190} />
              <Skeleton width={84} height={14} borderRadius={5} delay={d + 210} />
            </View>
          </View>
        </View>
      </View>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  // CarListCard: wrap 16 sides / 12 below; card 1px border, radius 12, padding 4/4/8; body 8 below the photo, gap 6.
  wrap: { marginBottom: 12, marginHorizontal: 16 },
  card: { borderWidth: 1, borderRadius: 12, paddingTop: 4, paddingHorizontal: 4, paddingBottom: 8 },
  photo: { height: 212, borderRadius: 8, overflow: 'hidden' },
  photoTop: { position: 'absolute', top: 6, left: 6, right: 6, flexDirection: 'row', justifyContent: 'space-between' },
  pill: { width: 128, height: 28, borderRadius: 20, opacity: 0.7 },
  heart: { width: 32, height: 32, borderRadius: 16, opacity: 0.7 },
  dots: { position: 'absolute', bottom: 6, alignSelf: 'center', flexDirection: 'row', gap: 5, alignItems: 'center' },
  dot: { width: 4, height: 4, borderRadius: 2, opacity: 0.7 },
  dotOn: { width: 16, height: 4, borderRadius: 2, opacity: 0.9 },
  body: { marginTop: 8, gap: 6 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  ratingCol: { alignItems: 'center', gap: 4 },
  priceBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', height: 25, paddingHorizontal: 4 },
});
