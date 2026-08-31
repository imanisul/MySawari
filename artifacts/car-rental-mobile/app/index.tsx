import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { cars, Category } from '@/lib/sawari';
import { useSawari } from '@/context/SawariContext';
import {
  CategoryTabs,
  Header,
  NextTrip,
  Page,
  SearchCard,
  SectionHeading,
  CarTile,
} from '@/components/sawari';

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { mode, setMode } = useSawari();
  const [category, setCategory] = useState<Category>('All');
  const filteredCars = category === 'All' ? cars : cars.filter((car) => car.category === category);

  return (
    <Page bottomNav>
      <Header />
      <Text style={[styles.greeting, { color: colors.mutedForeground }]}>Good morning, Jatin</Text>
      <Text style={[styles.heading, { color: colors.foreground }]}>
        Where are you{'\n'}going next?
      </Text>
      <Text style={[styles.subheading, { color: colors.mutedForeground }]}>
        Find a car that fits your journey.
      </Text>
      <SearchCard
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.carRow}>
        {filteredCars.map((car) => (
          <CarTile key={car.id} car={car} />
        ))}
      </ScrollView>
    </Page>
  );
}

const styles = StyleSheet.create({
  greeting: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 22 },
  heading: { fontFamily: 'Inter_600SemiBold', fontSize: 32, letterSpacing: -1.25, lineHeight: 36, marginTop: 6 },
  subheading: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 7 },
  carRow: { gap: 18, paddingBottom: 12, paddingTop: 9 },
});