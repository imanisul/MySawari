import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/components/common/Skeleton';
import { useColors } from '@/hooks/useColors';

export function BookingSkeleton() {
  const colors = useColors();

  return (
    <View style={[styles.upcomingCard, { backgroundColor: colors.card, borderColor: colors.border, borderWidth: 1 }]}>
      <View style={styles.upcomingCopy}>
        {/* Title Row */}
        <View style={styles.upcomingTitleRow}>
          <Skeleton width="60%" height={20} borderRadius={4} />
          <Skeleton width={80} height={20} borderRadius={10} />
        </View>
        
        {/* Meta Row 1 (Dates) */}
        <View style={styles.upcomingMetaRow}>
          <Skeleton width={14} height={14} borderRadius={2} />
          <Skeleton width="75%" height={16} borderRadius={4} />
        </View>
        
        {/* Meta Row 2 (Location) */}
        <View style={styles.upcomingMetaRow}>
          <Skeleton width={14} height={14} borderRadius={2} />
          <Skeleton width="50%" height={16} borderRadius={4} />
        </View>
        
        {/* Divider */}
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }} />
        
        {/* Bottom Row (Price) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width="40%" height={20} borderRadius={4} />
          <Skeleton width="25%" height={16} borderRadius={4} />
        </View>

        {/* Action Buttons Placeholder */}
        <View style={{ marginTop: 12, flexDirection: 'row', justifyContent: 'flex-end', gap: 12 }}>
           <Skeleton width={100} height={36} borderRadius={8} />
           <Skeleton width={100} height={36} borderRadius={8} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  upcomingCard: {
    borderRadius: 16,
    flexDirection: 'row',
    marginBottom: 16,
    overflow: 'hidden',
  },
  upcomingCopy: {
    flex: 1,
    padding: 16,
  },
  upcomingTitleRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  upcomingMetaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
});
