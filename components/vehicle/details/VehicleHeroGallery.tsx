import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Dimensions } from 'react-native';
import { LoadingImage } from '@/components/common/LoadingImage';
import * as Haptics from 'expo-haptics';
import { Car } from '@/utils/sawari';
import { useDetailsPalette } from './detailsPalette';
import { PhotoViewer } from '@/components/common/PhotoViewer';

const { width } = Dimensions.get('window');
const SLIDE_W = width - 32;
const HEIGHT = Math.round(SLIDE_W * 0.587); // 361 × 212 in the design
const THUMBS = 5;
const THUMB_GAP = 6;
const THUMB_W = (SLIDE_W - THUMB_GAP * (THUMBS - 1)) / THUMBS;

export function VehicleHeroGallery({ car }: { car: Car }) {
  const p = useDetailsPalette();

  const rawImages = car.images && car.images.length > 0 ? car.images : [car.image];
  // Filter out any undefined/null images
  const images = rawImages.filter(Boolean);
  if (images.length === 0 && car.image) images.push(car.image);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const pausedUntil = useRef(0); // a thumbnail tap or swipe pauses the auto-slide for a while

  // Auto-slide logic
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      if (Date.now() < pausedUntil.current) return;
      setActiveIndex((current) => {
        const nextIndex = (current + 1) % images.length;
        scrollRef.current?.scrollTo({ x: nextIndex * SLIDE_W, animated: true });
        return nextIndex;
      });
    }, 3500); // Auto slide every 3.5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  const onScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / SLIDE_W);
    if (index !== activeIndex && index >= 0 && index < images.length) {
      pausedUntil.current = Date.now() + 6000;
      setActiveIndex(index);
    }
  };

  const goTo = (index: number) => {
    Haptics.selectionAsync();
    pausedUntil.current = Date.now() + 6000;
    setActiveIndex(index);
    scrollRef.current?.scrollTo({ x: index * SLIDE_W, animated: true });
  };

  const openFullScreen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.heroWrap, { backgroundColor: p.soft }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={16}
          nestedScrollEnabled={true}
          directionalLockEnabled={true}
          decelerationRate="fast"
        >
          {images.map((img, i) => (
            <Pressable key={i} accessibilityLabel={`Photo ${i + 1} of ${images.length}`} onPress={openFullScreen} style={{ width: SLIDE_W, height: HEIGHT }}>
              <LoadingImage source={img} style={styles.heroImage} contentFit="cover" transition={300} />
            </Pressable>
          ))}
        </ScrollView>

        {/* Pagination: a pill for the current photo, dots for the rest */}
        {images.length > 1 && (
          <View style={styles.paginationContainer} pointerEvents="none">
            {images.map((_, i) => (
              <View key={i} style={[styles.dot, activeIndex === i ? styles.activeDot : styles.inactiveDot]} />
            ))}
          </View>
        )}
      </View>

      {images.length > 1 && (
        <View style={styles.thumbRow}>
          {images.slice(0, THUMBS).map((img, i) => (
            <Pressable
              key={i}
              accessibilityRole="button"
              accessibilityLabel={`Show photo ${i + 1}`}
              onPress={() => goTo(i)}
              style={[styles.thumb, { backgroundColor: p.soft }]}
            >
              <LoadingImage source={img} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
            </Pressable>
          ))}
        </View>
      )}

      {isModalVisible && <PhotoViewer images={images} initialIndex={activeIndex} onClose={() => setIsModalVisible(false)} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 16,
  },
  heroWrap: {
    width: '100%',
    height: HEIGHT,
    position: 'relative',
    borderRadius: 10,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 4,
    borderRadius: 2,
  },
  activeDot: {
    width: 16,
    backgroundColor: '#FFF',
  },
  inactiveDot: {
    width: 4,
    backgroundColor: '#D4D4D4',
  },
  thumbRow: {
    flexDirection: 'row',
    gap: THUMB_GAP,
    marginTop: 6,
  },
  thumb: {
    width: THUMB_W,
    height: Math.round(THUMB_W * (45 / 67.5)),
    borderRadius: 3,
    overflow: 'hidden',
  },
});
