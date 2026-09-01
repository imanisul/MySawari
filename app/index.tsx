import React, { useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { cars, Category, fetchCars } from '@/lib/sawari';
import { useSawari } from '@/context/SawariContext';
import {
  CategoryTabs,
  Header,
  NextTrip,
  Page,
  SearchCard,
  SectionHeading,
  CarTile,
} from '@/components';

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { mode, setMode, pickup, customer } = useSawari();
  const [category, setCategory] = useState<Category>('All');
  
  const { data: fetchedCars = cars, isLoading } = useQuery({
    queryKey: ['cars'],
    queryFn: fetchCars,
  });

  const filteredCars = category === 'All' ? fetchedCars : fetchedCars.filter((car) => car.category === category);

  return (
    <Page bottomNav>
      <Header />
      <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good morning, {customer.name.split(' ')[0]}</Text>
      <Text style={[styles.heading, { color: colors.foreground }]}>
        Where are you{'\n'}going next?
      </Text>
      <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
        Find a car that fits your journey.
      </Text>
      <SearchCard
        pickup={pickup}
        mode={mode}
        onModeChange={setMode}
        onSearch={() => {
          Haptics.selectionAsync();
          router.push('/planner');
        }}
      />
      <NextTrip car={cars[0]} />
      <SectionHeading title="Popular near you" action="View all" onAction={() => router.push('/explore')} />
      <CategoryTabs selected={category} onSelect={setCategory} />
      {isLoading ? (
        <View style={[styles.carRow, { justifyContent: 'center', minHeight: 180 }]}>
          <Text style={{ color: colors.mutedForeground }}>Loading cars...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCars}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <CarTile car={item} />}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carRow}
        />
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  greeting: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 22 },
  heading: { fontFamily: 'Inter_700Bold', fontSize: 34, letterSpacing: -1.5, lineHeight: 38, marginTop: 6 },
  subheading: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 7 },
  carRow: { gap: 18, paddingBottom: 12, paddingTop: 9 },
});