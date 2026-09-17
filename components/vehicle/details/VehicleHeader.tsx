import React from 'react';
import { View, Text, Pressable, StyleSheet, Share } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export function VehicleHeader({ carName }: { carName: string }) {
  const colors = useColors();
  const router = useRouter();
  const { selectedCar, favorites, toggleFavorite } = useSawari();
  
  const isFavorite = favorites.includes(selectedCar.id);

  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `Check out the ${carName} on MySawari! Rent it now for an amazing trip.`,
        title: `Rent ${carName} on MySawari`
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(selectedCar.id);
  };

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: colors.background, zIndex: 10 }}>
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable 
          accessibilityLabel="Back" 
          onPress={() => router.back()} 
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed, { marginLeft: 0 }]}
        >
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          Car Details
        </Text>
        
        <View style={styles.rightActions}>
          <Pressable 
            accessibilityLabel="Favorite" 
            onPress={handleFavorite} 
            style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}
          >
            {isFavorite ? (
              <Ionicons name="heart" size={22} color="#EF4444" />
            ) : (
              <Feather name="heart" size={20} color={colors.foreground} />
            )}
          </Pressable>
          <Pressable 
            accessibilityLabel="Share" 
            onPress={handleShare} 
            style={({ pressed }) => [styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}
          >
            <Feather name="share-2" size={20} color={colors.foreground} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 2,
  },
  iconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
    borderWidth: 1,
    marginLeft: 8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontFamily: 'Inter_700Bold',
    fontSize: 17,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }]
  }
});
