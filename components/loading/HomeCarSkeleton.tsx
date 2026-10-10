import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton, SkeletonGroup } from '@/components/common/Skeleton';
import { useColors } from '@/hooks/useColors';

interface HomeCarSkeletonProps {
  delay?: number;
}

export function HomeCarSkeleton({ delay = 0 }: HomeCarSkeletonProps) {
  const colors = useColors();

  return (
    <SkeletonGroup>
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {/* Image Area */}
        <View style={[styles.imageContainer, { backgroundColor: colors.muted }]}>
          {/* Full Image placeholder */}
          <View style={StyleSheet.absoluteFill}>
            <Skeleton width="100%" height="100%" borderRadius={0} delay={delay} />
          </View>

          {/* Badge */}
          <View style={styles.premiumBadge}>
            <Skeleton width="100%" height="100%" borderRadius={8} delay={delay + 50} />
          </View>
        
          {/* Price */}
          <View style={styles.priceOverlay}>
            <Skeleton width={60} height={10} borderRadius={4} delay={delay + 100} style={{ marginBottom: 4 }} />
            <Skeleton width={100} height={20} borderRadius={4} delay={delay + 150} />
          </View>
        </View>

        {/* Details Area */}
        <View style={styles.details}>
          {/* Title */}
          <Skeleton width={140} height={20} borderRadius={6} delay={delay + 200} />
        
          {/* Specs Row */}
          <View style={styles.specsRow}>
            <Skeleton width={40} height={14} borderRadius={4} delay={delay + 250} />
            <View style={styles.specDot} />
            <Skeleton width={40} height={14} borderRadius={4} delay={delay + 300} />
            <View style={styles.specDot} />
            <Skeleton width={40} height={14} borderRadius={4} delay={delay + 350} />
          </View>
        </View>
      </View>
    </SkeletonGroup>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    width: 240,
    elevation: 0,
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
  },
  imageContainer: {
    height: 150,
    width: '100%',
    position: 'relative',
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    width: 90,
    height: 24,
  },
  priceOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
  },
  details: {
    padding: 14,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  specDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'transparent',
  },
});
