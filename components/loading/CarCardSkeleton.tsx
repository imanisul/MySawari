import React from 'react';
import { View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Skeleton } from '@/components/common/Skeleton';
import { useColors } from '@/hooks/useColors';

export function CarCardSkeleton() {
  const colors = useColors();

  return (
    <View style={styles.cardContainer}>
      <View style={styles.imageContainer}>
        {/* Background placeholder for the image */}
        <View style={{ flex: 1, backgroundColor: '#1F2937' }}>
          <Skeleton width="100%" height="100%" borderRadius={0} />
        </View>

        {/* Top Badges Skeleton */}
        <View style={styles.topRow}>
          <Skeleton width={100} height={28} borderRadius={16} />
          <Skeleton width={60} height={28} borderRadius={16} />
        </View>

        {/* Info Glass Container Skeleton */}
        <BlurView intensity={20} tint="dark" style={styles.infoGlassContainer}>
          <View style={styles.titleRow}>
            <View style={{ flex: 1 }}>
              <Skeleton width="70%" height={24} borderRadius={4} />
            </View>
            <View style={styles.priceContainer}>
              <Skeleton width={30} height={10} borderRadius={2} style={{ marginBottom: 4 }} />
              <Skeleton width={60} height={20} borderRadius={4} />
            </View>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.metaRow}>
            <Skeleton width={40} height={14} borderRadius={4} />
            <Skeleton width={60} height={14} borderRadius={4} />
            <Skeleton width={50} height={14} borderRadius={4} />
          </View>
        </BlurView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    marginBottom: 24,
    marginHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  imageContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#1F2937',
  },
  topRow: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoGlassContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    borderRadius: 20,
    padding: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  priceContainer: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
