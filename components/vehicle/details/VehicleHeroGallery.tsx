import React, { useState, useRef } from 'react';
import { View, Image, ScrollView, Pressable, StyleSheet, Dimensions, Modal, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { Car } from '@/utils/sawari';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export function VehicleHeroGallery({ car }: { car: Car }) {
  const colors = useColors();
  
  // Default to the main image if array is not provided
  const images = car.images && car.images.length > 0 ? car.images : [car.image, car.image, car.image];
  
  const [activeIndex, setActiveIndex] = useState(0);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  const modalScrollRef = useRef<ScrollView>(null);

  const handleThumbnailPress = (index: number) => {
    Haptics.selectionAsync();
    setActiveIndex(index);
  };

  const openFullScreen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsModalVisible(true);
  };

  // Determine how many thumbnails to show inline (max 4 + 1 for "+N")
  const MAX_THUMBNAILS = 5;
  const showMoreThumb = images.length > MAX_THUMBNAILS;
  const displayImages = showMoreThumb ? images.slice(0, MAX_THUMBNAILS - 1) : images;
  const remainingCount = images.length - (MAX_THUMBNAILS - 1);

  return (
    <View style={styles.container}>
      {/* Main Large Image */}
      <Pressable onPress={openFullScreen} style={[styles.heroWrap, { backgroundColor: colors.surfaceSoft }]}>
        <Image 
          source={images[activeIndex]} 
          style={styles.heroImage} 
          resizeMode="cover" 
        />
        <View style={styles.expandIcon}>
          <Feather name="maximize-2" size={16} color="#FFF" />
        </View>
      </Pressable>

      {/* Thumbnails */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        contentContainerStyle={styles.thumbnailScroll}
      >
        {displayImages.map((img, i) => {
          const isActive = activeIndex === i;
          return (
            <Pressable 
              key={i} 
              onPress={() => handleThumbnailPress(i)}
              style={[
                styles.thumbnailWrap, 
                { backgroundColor: colors.surfaceSoft, borderColor: isActive ? colors.primary : 'transparent' }
              ]}
            >
              <Image source={img} style={styles.thumbnailImage} resizeMode="cover" />
              {isActive && <View style={[styles.thumbnailOverlay, { backgroundColor: 'rgba(255,255,255,0.2)' }]} />}
            </Pressable>
          );
        })}
        
        {/* +N Button */}
        {showMoreThumb && (
          <Pressable 
            onPress={openFullScreen}
            style={[styles.thumbnailWrap, { backgroundColor: colors.surfaceSoft, borderColor: 'transparent' }]}
          >
            <Image source={images[MAX_THUMBNAILS - 1]} style={styles.thumbnailImage} resizeMode="cover" />
            <View style={[styles.thumbnailOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
              <Text style={styles.plusText}>+{remainingCount}</Text>
            </View>
          </Pressable>
        )}
      </ScrollView>

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
              <View key={i} style={{ width, justifyContent: 'center', alignItems: 'center' }}>
                <Image 
                  source={img} 
                  style={{ width: '100%', height: width * 0.75 }} 
                  resizeMode="contain" 
                />
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  heroWrap: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  expandIcon: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 6,
    borderRadius: 8,
  },
  thumbnailScroll: {
    paddingTop: 12,
    gap: 10,
  },
  thumbnailWrap: {
    width: 64,
    height: 48,
    borderRadius: 8,
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 14,
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
