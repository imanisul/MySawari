import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useColors } from '@/hooks/useColors';
import { cars, Category } from '@/lib/sawari';
import { CategoryTabs, CarListCard, Header, Page, SectionHeading } from '@/components/sawari';

export default function ExploreScreen() {
  const colors = useColors();
  const router = useRouter();
  const [category, setCategory] = useState<Category>('All');
  const filteredCars = category === 'All' ? cars : cars.filter((car) => car.category === category);

  return (
    <Page bottomNav>
      <Header title="Explore" />
      <Text style={[styles.title, { color: colors.foreground }]}>Find your next ride</Text>
      <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
        Browse cars that fit every kind of plan.
      </Text>
      <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.searchText, { color: colors.mutedForeground }]}>Search by car or city</Text>
        <Text style={[styles.searchIcon, { color: colors.foreground }]}>⌕</Text>
      </View>
      <CategoryTabs selected={category} onSelect={setCategory} />
      <SectionHeading
        title={`${filteredCars.length} cars near Bikaner`}
        action="Map view"
        onAction={() => router.push('/search')}
      />
      {filteredCars.length > 0 ? (
        filteredCars.map((car) => <CarListCard key={car.id} car={car} />)
      ) : (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No cars in this category yet</Text>
          <Text style={[styles.emptyCopy, { color: colors.mutedForeground }]}>Try another category to keep exploring.</Text>
        </View>
      )}
    </Page>
  );
}

const styles = StyleSheet.create({
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 30, letterSpacing: -1, marginTop: 30 },
  subtitle: { fontFamily: 'Inter_400Regular', fontSize: 14, marginTop: 7 },
  searchBar: { alignItems: 'center', borderRadius: 15, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: 22, paddingHorizontal: 16, paddingVertical: 16 },
  searchText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  searchIcon: { fontSize: 25, lineHeight: 22 },
  emptyState: { borderRadius: 18, marginTop: 18, padding: 20 },
  emptyTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  emptyCopy: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 7 },
});