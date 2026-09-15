import React, { useState, useRef, useEffect } from 'react';
import { Image, Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { Car } from '@/utils/sawari';
import { useSawari } from '@/context/SawariContext';
import { LinearGradient } from 'expo-linear-gradient';

export function LuxuryCarTile({ car }: { car: Car }) {
  const colors = useColors();
  const router = useRouter();
  const { selectCar, dateRange } = useSawari();
  
  const scrollRef = useRef<ScrollView>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  
  const cardWidth = 240;
  
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
    }, 3500 + Math.random() * 1000);
    return () => clearInterval(interval);
  }, [images.length]);
  
  const isDateSelected = dateRange && !dateRange.includes('Select');
  const availableText = isDateSelected ? `Avail: ${dateRange}` : 'Available Now';

  return (
    <Pressable
      testID={`luxury-car-${car.id}`}
      accessibilityRole="button"
      accessibilityLabel={`View details for ${car.name}, ${car.seats} seats, ${car.transmission}, ${car.fuel}, priced at ${car.price} per day`}
      onPress={() => {
        Haptics.selectionAsync();
        selectCar(car);
        router.push('/car-details');
      }}
      style={styles.card}
    >
      {/* Image with overlay gradient */}
      <View style={styles.imageContainer}>
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          scrollEventThrottle={16}
        >
          {images.map((img: any, i: number) => (
            <View key={i} style={{ width: cardWidth, height: '100%' }}>
              <Image source={img} resizeMode="cover" style={styles.image} />
            </View>
          ))}
        </ScrollView>
        <LinearGradient
          colors={['transparent', 'rgba(17,26,43,0.9)']}
          style={styles.imageOverlay}
        />
        {/* Premium badge -> Availability Badge */}
        <View style={[styles.premiumBadge, { backgroundColor: 'rgba(255,255,255,0.95)', maxWidth: '90%' }]}>
          <Feather name="calendar" size={10} color={colors.primary} />
          <Text numberOfLines={1} adjustsFontSizeToFit style={[styles.premiumText, { color: '#000', flexShrink: 1 }]}>
            {availableText}
          </Text>
        </View>
        {/* Price on image */}
        <View style={styles.priceOverlay}>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.8)', fontFamily: 'Inter_500Medium', marginBottom: 2 }}>Starting from</Text>
          <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
            <Text style={styles.priceText}>{car.price}</Text>
            <Text style={styles.priceSuffix}>/day</Text>
          </View>
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
      </View>

      {/* Details */}
      <View style={styles.details}>
        <Text numberOfLines={1} style={[styles.carName, { color: colors.foreground }]}>
          {car.name}
        </Text>
        <View style={styles.specsRow}>
          <View style={styles.specItem}>
            <Feather name="users" size={11} color={colors.mutedForeground} />
            <Text style={[styles.specText, { color: colors.mutedForeground }]}>{car.seats}</Text>
          </View>
          <View style={[styles.specDot, { backgroundColor: colors.border }]} />
          <View style={styles.specItem}>
            <Feather name="settings" size={11} color={colors.mutedForeground} />
            <Text style={[styles.specText, { color: colors.mutedForeground }]}>{car.transmission}</Text>
          </View>
          <View style={[styles.specDot, { backgroundColor: colors.border }]} />
          <View style={styles.specItem}>
            <Feather name="droplet" size={11} color={colors.mutedForeground} />
            <Text style={[styles.specText, { color: colors.mutedForeground }]}>{car.fuel}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: 'hidden',
    width: 240,
    backgroundColor: '#FFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  imageContainer: {
    position: 'relative',
    height: 150,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 80,
  },
  premiumBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  premiumText: {
    color: '#142033',
    fontFamily: 'Inter_700Bold',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  priceText: {
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 18,
  },
  priceSuffix: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    marginLeft: 2,
  },
  details: {
    padding: 14,
  },
  carName: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 7,
    gap: 6,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  specText: {
    fontFamily: 'Inter_400Regular',
    fontSize: 11,
  },
  specDot: {
    width: 3,
    height: 3,
    borderRadius: 2,
  },
  paginationDots: {
    position: 'absolute',
    bottom: 50, // Just above the price text
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  activeDot: {
    width: 10,
    height: 4,
    backgroundColor: '#FFF',
  },
});
