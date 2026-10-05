import React, { useState, useRef, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet, Dimensions, Modal, Text, Animated } from 'react-native';
import { LoadingImage } from '@/components/common/LoadingImage';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Car } from '@/utils/sawari';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const HEIGHT = 280; // Larger, more premium height

export function VehicleHeroGallery({ car }: { car: Car }) {
  const colors = useColors();
  
  const rawImages = car.images && car.images.length > 0 ? car.images : [car.image];
  // Filter out any undefined/null images
  const images = rawImages.filter(Boolean);
  if (images.length === 0 && car.image) images.push(car.image);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const scrollRef = useRef<ScrollView>(null);
  const modalScrollRef = useRef<ScrollView>(null);

  // Auto-slide logic
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setActiveIndex((current) => {
        const nextIndex = (current + 1) % images.length;
        scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
        return nextIndex;
      });
    }, 3500); // Auto slide every 3.5 seconds

    return () => clearInterval(interval);
  }, [images.length]);

  const onScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    if (index !== activeIndex && index >= 0 && index < images.length) {
      setActiveIndex(index);
    }
  };

  const openFullScreen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.heroWrap, { backgroundColor: colors.surfaceSoft }]}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          scrollEventThrottle={16}
        >
          {images.map((img, i) => (
            <Pressable key={i} onPress={openFullScreen} style={{ width, height: HEIGHT }}>
              <LoadingImage 
                source={img} 
                style={styles.heroImage} 
                contentFit="cover" 
                transition={300}
              />
            </Pressable>
          ))}
        </ScrollView>

        {/* Premium Gradient Overlay at bottom for dots */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.6)']}
          style={styles.gradientOverlay}
        />

        {/* Expand Icon */}
        <Pressable onPress={openFullScreen} style={styles.expandIcon}>
          <Feather name="maximize-2" size={16} color="#FFF" />
        </Pressable>

        {/* Pagination Dots */}
        {images.length > 1 && (
          <View style={styles.paginationContainer}>
            {images.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  activeIndex === i ? styles.activeDot : styles.inactiveDot
                ]}
              />
            ))}
          </View>
        )}
      </View>

      {/* Full Screen Gallery Modal */}
      <Modal visible={isModalVisible} transparent={false} animationType="fade">
        <View style={[styles.modalContainer, { backgroundColor: '#000' }]}>
          <SafeAreaView style={styles.modalHeader}>
            <Text style={styles.modalCounter}>
              {activeIndex + 1} / {images.length}
            </Text>
            <Pressable 
              onPress={() => setIsModalVisible(false)} 
              style={styles.closeBtn}
            >
              <Feather name="x" size={24} color="#FFF" />
            </Pressable>
          </SafeAreaView>

          <ScrollView
            ref={modalScrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentOffset={{ x: activeIndex * width, y: 0 }}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / width);
              setActiveIndex(idx);
            }}
          >
            {images.map((img, i) => (
              <View key={i} style={{ width, flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <View style={{ width: '100%', height: width * 0.75 }}>
                  <LoadingImage
                    source={img}
                    style={StyleSheet.absoluteFill}
                    contentFit="contain"
                    transition={200}
                  />
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Edge-to-edge design
    width: '100%',
    paddingBottom: 16,
  },
  heroWrap: {
    width: '100%',
    height: HEIGHT,
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  expandIcon: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
    padding: 8,
    borderRadius: 20,
    backdropFilter: 'blur(10px)', // web only, but safe
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#FFF',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  modalCounter: {
    color: '#FFF',
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  closeBtn: {
    width: 44,
    height: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  }
});
