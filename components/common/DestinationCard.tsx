import React from 'react';
import { StyleSheet, Text, View, ImageBackground, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { shadows } from '@/constants/shadows';

export function DestinationCard({
  image,
  title,
  subtitle,
  places,
}: {
  image: any;
  title: string;
  subtitle: string;
  places: string[];
}) {
  return (
    <Pressable
      onPress={() => Haptics.selectionAsync()}
      accessibilityRole="button"
      accessibilityLabel={`Explore ${title}, ${subtitle}`}
      style={({ pressed }) => [
        styles.cardContainer,
        shadows.level2,
        pressed && styles.pressed,
      ]}
    >
      <ImageBackground source={image} style={styles.imageBg} imageStyle={{ borderRadius: 20 }} fadeDuration={0}>
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.gradient}
        >
          <View style={styles.stateBadge}>
            <Feather name="map-pin" size={10} color="#FFF" />
            <Text style={styles.stateBadgeText}>{subtitle}</Text>
          </View>
          <Text style={styles.title}>{title}</Text>
          <View style={styles.placesWrap}>
            {places.slice(0, 4).map((place, i) => (
              <View key={i} style={styles.placeTag}>
                <Text style={styles.placeTagText}>{place}</Text>
              </View>
            ))}
            {places.length > 4 && (
              <View style={[styles.placeTag, styles.moreTag]}>
                <Text style={styles.placeTagText}>+{places.length - 4}</Text>
              </View>
            )}
          </View>
        </LinearGradient>
      </ImageBackground>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    width: 280,
    height: 380,
    marginRight: 16,
    borderRadius: 20,
    backgroundColor: '#000',
  },
  imageBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  gradient: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    height: '55%',
    justifyContent: 'flex-end',
  },
  stateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  stateBadgeText: {
    color: '#E5E7EB',
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  title: {
    color: '#FFF',
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    marginBottom: 10,
  },
  placesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  placeTag: {
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  moreTag: {
    backgroundColor: 'rgba(183, 245, 46, 0.3)',
  },
  placeTagText: {
    color: '#FFF',
    fontFamily: 'Inter_500Medium',
    fontSize: 11,
  },
  pressed: {
    opacity: 0.85,
  },
});
