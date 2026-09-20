import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/components/common/Skeleton';
import { useColors } from '@/hooks/useColors';
import { shadows } from '@/constants/shadows';

/** Loading placeholder shaped exactly like CarListCard (photo, name + price, specs). */
export function CarCardSkeleton({ index = 0 }: { index?: number }) {
  const colors = useColors();
  const delay = index * 100;

  return (
    <View style={styles.cardContainer}>
      <View style={[styles.card, shadows.level1, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.imageWrap}>
          <Skeleton width="100%" height="100%" borderRadius={0} delay={delay} />
          <View style={styles.badgeRow}>
            <Skeleton width={150} height={28} borderRadius={14} delay={delay + 50} />
            <Skeleton width={64} height={28} borderRadius={14} delay={delay + 100} />
          </View>
        </View>

        <View style={styles.body}>
          <View style={styles.titleRow}>
            <Skeleton width="55%" height={20} borderRadius={6} delay={delay + 150} />
            <Skeleton width={72} height={20} borderRadius={6} delay={delay + 200} />
          </View>
          <View style={styles.specRow}>
            <Skeleton width={64} height={14} borderRadius={4} delay={delay + 200} />
            <Skeleton width={72} height={14} borderRadius={4} delay={delay + 250} />
            <Skeleton width={56} height={14} borderRadius={4} delay={delay + 300} />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: { marginBottom: 16, marginHorizontal: 16 },
  card: { borderRadius: 20, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  imageWrap: { width: '100%', aspectRatio: 16 / 9 },
  badgeRow: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  body: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  specRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 12 },
});
