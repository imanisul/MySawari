import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/components/common/Skeleton';

interface OfferCardSkeletonProps {
  delay?: number;
}

export function OfferCardSkeleton({ delay = 0 }: OfferCardSkeletonProps) {
  return (
    <View style={styles.card}>
      {/* Background Gradient Placeholder */}
      <View style={StyleSheet.absoluteFill}>
        <Skeleton width="100%" height="100%" borderRadius={0} delay={delay} />
      </View>
      
      {/* Inner Content overlaying the gradient */}
      <View style={styles.content}>
        {/* Top row */}
        <View style={styles.topRow}>
          <Skeleton width={36} height={36} borderRadius={18} delay={delay + 50} />
          <Skeleton width={60} height={24} borderRadius={20} delay={delay + 100} />
        </View>

        <View style={styles.textContainer}>
          {/* Title & subtitle */}
          <Skeleton width={180} height={20} borderRadius={6} delay={delay + 150} style={{ marginBottom: 14 }} />
          <Skeleton width={220} height={14} borderRadius={4} delay={delay + 200} style={{ marginBottom: 4 }} />
          <Skeleton width={140} height={14} borderRadius={4} delay={delay + 250} />
        </View>

        {/* Bottom row */}
        <View style={styles.bottomRow}>
          <Skeleton width={100} height={24} borderRadius={8} delay={delay + 300} />
          <Skeleton width={60} height={14} borderRadius={4} delay={delay + 350} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    width: 290,
    height: 175,
    overflow: 'hidden',
    backgroundColor: '#1F2937', // Base dark for gradient skeleton
  },
  content: {
    padding: 18,
    flex: 1,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  textContainer: {
    marginTop: 14,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 14,
  },
});
