import React from 'react';
import { View } from 'react-native';
import { Skeleton, SkeletonGroup } from '@/components/common/Skeleton';

/** Placeholder rows for list screens while their first page of data loads. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <SkeletonGroup style={{ padding: 16, gap: 12 }}>
      {Array.from({ length: rows }, (_, i) => (
        <View key={i} style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
          <Skeleton width={56} height={56} borderRadius={14} delay={i * 60} />
          <View style={{ flex: 1, gap: 8 }}>
            <Skeleton width="60%" height={14} delay={i * 60} />
            <Skeleton width="85%" height={12} delay={i * 60} />
          </View>
        </View>
      ))}
    </SkeletonGroup>
  );
}
