import React, { useMemo, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { Page, Header, CarListCard } from '@/components';
import { cars } from '@/utils/sawari';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export default function WishlistScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { favorites } = useSawari();

  const favoriteCars = useMemo(() => {
    return cars.filter(car => favorites.includes(car.id));
  }, [favorites]);

  // Animation for empty state
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (favoriteCars.length === 0) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.1, duration: 1000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [favoriteCars.length]);

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <LinearGradient
        colors={[colors.card, colors.background]}
        style={styles.emptyCard}
      >
        <Animated.View style={{ transform: [{ scale: pulseAnim }], marginBottom: 24 }}>
          <View style={[styles.iconCircle, { backgroundColor: colors.tintLight }]}>
            <Ionicons name="heart" size={42} color={colors.primary} />
          </View>
        </Animated.View>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Your Wishlist is Empty</Text>
        <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
          Keep track of your favorite rides. Tap the heart icon on any vehicle to save it for later.
        </Text>
        <Pressable 
          style={({ pressed }) => [
            styles.exploreBtn, 
            { backgroundColor: colors.primary },
            pressed && { opacity: 0.8 }
          ]}
          onPress={() => {
            Haptics.selectionAsync();
            router.push('/explore');
          }}
        >
          <Text style={[styles.exploreBtnText, { color: colors.primaryForeground }]}>Explore Vehicles</Text>
          <Feather name="arrow-right" size={18} color={colors.primaryForeground} />
        </Pressable>
      </LinearGradient>
    </View>
  );

  const renderHeader = () => {
    if (favoriteCars.length === 0) return null;
    return (
      <View style={styles.listHeader}>
        <Text style={[styles.listHeaderTitle, { color: colors.foreground }]}>Saved Rides</Text>
        <Text style={[styles.listHeaderCount, { color: colors.mutedForeground }]}>
          {favoriteCars.length} {favoriteCars.length === 1 ? 'vehicle' : 'vehicles'}
        </Text>
      </View>
    );
  };

  return (
    <Page bottomNav scroll={false}>
      <Header title="Wishlist" hideLogo={true} back={false} />
      
      <FlatList
        data={favoriteCars}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <CarListCard car={item} />}
        ListEmptyComponent={renderEmpty}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      />
    </Page>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 32,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 24,
    elevation: 2,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    marginBottom: 12,
  },
  emptyDesc: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  exploreBtn: {
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 100,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exploreBtnText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listHeaderTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 22,
    letterSpacing: -0.5,
  },
  listHeaderCount: {
    fontFamily: 'Inter_500Medium',
    fontSize: 14,
  }
});
