import React, { useState, useRef, useEffect } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View, ScrollView, Dimensions } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { usePressAnimation } from '@/hooks/usePressAnimation';
import { Car } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';

export const CarListCard = React.memo(function CarListCard({ car }: { car: Car }) {
  const router = useRouter();
  const { selectCar, dateRange } = useSawari();
  const { scaleAnim, opacityAnim, onPressIn, onPressOut } = usePressAnimation();
  const [isNavigating, setIsNavigating] = useState(false);
  
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const screenWidth = Dimensions.get('window').width;
  const cardWidth = screenWidth - 32; // marginHorizontal: 16 on both sides
  
  // Use car.images if available, else duplicate the single image 3 times to simulate a gallery
  const images = (car as any).images || [car.image, car.image, car.image];

  useEffect(() => {
    if (images.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex(current => {
        const next = (current + 1) % images.length;
        scrollRef.current?.scrollTo({ x: next * cardWidth, animated: true });
        return next;
      });
    }, 3500 + Math.random() * 1000); // Stagger slightly so they don't all slide at exactly the same time
    return () => clearInterval(interval);
  }, [images.length, cardWidth]);

  const isDateSelected = dateRange && !dateRange.includes('Select');
  const availableText = isDateSelected ? `Avail: ${dateRange}` : 'Available Now';

  // Determine badge colors based on category
  const isBike = car.category === 'Bike' || car.category === 'Off-road';
  const categoryColor = isBike ? '#D97706' : '#2563EB';

  const handlePress = async () => {
    if (isNavigating) return;
    setIsNavigating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectCar(car);
    router.push({ pathname: '/car-details', params: { explore: 'true' } });
    setTimeout(() => setIsNavigating(false), 500);
  };
  
  return (
    <Animated.View style={[styles.cardContainer, { transform: [{ scale: scaleAnim }], opacity: opacityAnim }]}>
      <Pressable
        accessibilityRole="button"
        testID={`list-car-${car.id}`}
        disabled={isNavigating}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={styles.pressableArea}
      >
        <View style={styles.imageContainer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEnabled={false} // Disable manual scroll to not interfere with card press
            scrollEventThrottle={16}
          >
            {images.map((img: any, i: number) => (
              <View key={i} style={{ width: cardWidth, height: '100%' }}>
                <Image source={img} resizeMode="cover" style={styles.carImage} />
              </View>
            ))}
          </ScrollView>
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.85)']}
            style={styles.gradientOverlay}
          />
          
          <View style={styles.topRow}>
            <BlurView intensity={90} tint="light" style={styles.availableBadge}>
              <Feather name="calendar" size={12} color="#000" />
              <Text numberOfLines={1} adjustsFontSizeToFit style={styles.badgeText}>
                {availableText}
              </Text>
            </BlurView>
            <BlurView intensity={90} tint="light" style={styles.categoryBadge}>
              <Text style={[styles.categoryText, { color: categoryColor }]}>{car.category}</Text>
            </BlurView>
          </View>

          {/* Pagination Dots */}
          {images.length > 1 && (
            <View style={styles.paginationDots}>
              {images.map((_: any, i: number) => (
                <View 
                  key={i} 
                  style={[
                    styles.dot, 
                    activeIndex === i ? styles.activeDot : {}
                  ]} 
                />
              ))}
            </View>
          )}

          <BlurView intensity={50} tint="dark" style={styles.infoGlassContainer}>
            <View style={styles.titleRow}>
              <Text numberOfLines={1} style={styles.carName}>{car.name}</Text>
              <View style={styles.priceContainer}>
                <Text style={styles.startingFrom}>Starting from</Text>
                <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                  <Text numberOfLines={1} style={styles.carPrice}>{car.price}</Text>
                  <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginLeft: 2, fontFamily: 'Inter_400Regular' }}>/day</Text>
                </View>
              </View>
            </View>
            
            <View style={styles.divider} />
            
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Feather name="users" size={14} color="#D1D5DB" />
                <Text style={styles.carMeta}>{car.seats}</Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="settings" size={14} color="#D1D5DB" />
                <Text style={styles.carMeta}>{car.transmission}</Text>
              </View>
              <View style={styles.metaItem}>
                <Feather name="droplet" size={14} color="#D1D5DB" />
                <Text style={styles.carMeta}>{car.fuel}</Text>
              </View>
            </View>
          </BlurView>
        </View>
      </Pressable>
    </Animated.View>
  );
});

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
  pressableArea: {
    width: '100%',
  },
  imageContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#1F2937',
  },
  carImage: {
    height: '100%',
    width: '100%',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
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
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
    overflow: 'hidden',
    maxWidth: '70%',
  },
  badgeText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: '#000',
    flexShrink: 1,
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    overflow: 'hidden',
  },
  categoryText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
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
    borderColor: 'rgba(255,255,255,0.2)',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  carName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 20,
    color: '#FFF',
    flexShrink: 1,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
    flexShrink: 0,
  },
  startingFrom: {
    fontSize: 10,
    color: '#D1D5DB',
    fontFamily: 'Inter_500Medium',
    marginBottom: 2,
  },
  carPrice: {
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
    color: '#FFF',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 14,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  carMeta: {
    fontFamily: 'Inter_500Medium',
    fontSize: 12,
    color: '#F3F4F6',
  },
  carPriceSuffix: {
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
    color: '#9CA3AF',
  },
  paginationDots: {
    position: 'absolute',
    bottom: 125, // Just above the glass info container
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    width: 16,
    height: 6,
    backgroundColor: '#FFF',
  },
});

