import React from 'react';
import { View, StyleSheet, FlatList, Text } from 'react-native';
import { Header, OfferCard } from '@/components';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';

export default function RewardsScreen() {
  const colors = useColors();
  const { earnedRewards } = useSawari();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <Header title="My Rewards" back={true} />
        
        {earnedRewards.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Feather name="gift" size={48} color={colors.border} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Rewards Yet</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Refer friends or book rides to earn exclusive coupons and discounts.
            </Text>
          </View>
        ) : (
          <FlatList
            data={earnedRewards}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <View style={styles.cardWrapper}>
                <OfferCard offer={item} />
              </View>
            )}
          />
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: 'center', // Center the cards since they have fixed width
  },
  cardWrapper: {
    marginBottom: 20,
  },
});
