import React from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { useColors } from '@/hooks/useColors';
import { fetchResultCars, resultCars } from '@/lib/sawari';
import { useSawari } from '@/context/SawariContext';
import { Header, Page } from '@/components';

export default function SearchResultsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { mode, setMode, selectCar } = useSawari();

  const { data: fetchedResultCars = resultCars, isLoading } = useQuery({
    queryKey: ['resultCars'],
    queryFn: fetchResultCars,
  });

  return (
    <Page bottomNav scroll={false}>
      <FlatList
        data={fetchedResultCars}
        keyExtractor={(car) => car.id}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.listHeader}>
            <View style={styles.searchHeaderTop}>
              <View style={styles.headerTextGroup}>
                <Text style={[styles.availableLabel, { color: colors.mutedForeground }]}>Available cars</Text>
                <Text style={[styles.location, { color: colors.foreground }]}>{pickup} · {dateRange} · {mode}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => router.push('/planner')}
                style={({ pressed }) => [styles.editButton, { borderColor: colors.border }, pressed && styles.pressed]}
              >
                <Text style={[styles.editText, { color: colors.foreground }]}>Edit</Text>
              </Pressable>
            </View>
            <View style={styles.toolbar}>
              <ToolButton icon="sliders" label="Filter" />
              <ToolButton icon="arrow-down" label="Sort" />
            </View>
            <Text style={[styles.title, { color: colors.foreground }]}>
              {isLoading ? 'Searching...' : `${fetchedResultCars.length} cars ready`}
            </Text>
          </View>
        }
        renderItem={({ item: car }) => (
          <Pressable
            accessibilityRole="button"
            testID={`result-${car.id}`}
            onPress={() => {
              Haptics.selectionAsync();
              selectCar(car);
              router.push('/car-details');
            }}
            style={({ pressed }) => [styles.resultCard, pressed && styles.cardPressed]}
          >
            <View style={styles.resultImageWrap}>
              <Image source={car.image} resizeMode="cover" style={styles.resultImage} />
              <View style={[styles.availablePill, { backgroundColor: colors.primary }]}>
                <Text style={[styles.availablePillText, { color: colors.primaryForeground }]}>Available</Text>
              </View>
            </View>
            <View style={styles.resultInfo}>
              <View>
                <Text style={[styles.carName, { color: colors.foreground }]}>{car.name}</Text>
                <Text style={[styles.carMeta, { color: colors.mutedForeground }]}>
                  {car.category} · {car.seats} · {car.transmission}
                </Text>
              </View>
              <View style={styles.priceCopy}>
                <Text style={[styles.price, { color: colors.foreground }]}>{car.price}</Text>
                <Text style={[styles.perDay, { color: colors.mutedForeground }]}>per day</Text>
              </View>
            </View>
            <View style={[styles.detailsButton, { borderColor: colors.mutedForeground }]}>
              <Text style={[styles.detailsText, { color: colors.foreground }]}>View Details</Text>
              <Feather name="arrow-right" size={18} color={colors.foreground} />
            </View>
          </Pressable>
        )}
      />
    </Page>
  );
}

function ToolButton({ icon, label }: { icon: React.ComponentProps<typeof Feather>['name']; label: string }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => Haptics.selectionAsync()}
      style={({ pressed }) => [styles.toolButton, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}
    >
      <Feather name={icon} size={15} color={colors.foreground} />
      <Text style={[styles.toolText, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  listHeader: { marginTop: 12 },
  searchHeaderTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTextGroup: { flex: 1, paddingRight: 12 },
  availableLabel: { fontFamily: 'Inter_600SemiBold', fontSize: 13, marginBottom: 4 },
  location: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  editButton: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 32, justifyContent: 'center', width: 56 },
  editText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  toolbar: { flexDirection: 'row', gap: 10, marginTop: 16 },
  toolButton: { alignItems: 'center', borderRadius: 99, borderWidth: 1, flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  toolText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  title: { fontFamily: 'Inter_600SemiBold', fontSize: 24, letterSpacing: -0.7, marginTop: 25 },
  resultCard: { marginTop: 18 },
  resultImageWrap: { borderRadius: 22, overflow: 'hidden', position: 'relative' },
  resultImage: { height: 200, width: '100%' },
  availablePill: { borderRadius: 99, left: 16, paddingHorizontal: 12, paddingVertical: 8, position: 'absolute', top: 16 },
  availablePillText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  resultInfo: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  carName: { fontFamily: 'Inter_600SemiBold', fontSize: 20 },
  carMeta: { fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 6 },
  priceCopy: { alignItems: 'flex-end' },
  price: { fontFamily: 'Inter_600SemiBold', fontSize: 21 },
  perDay: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 2 },
  detailsButton: { alignItems: 'center', borderRadius: 16, borderWidth: 1, flexDirection: 'row', height: 54, justifyContent: 'center', marginTop: 17 },
  detailsText: { fontFamily: 'Inter_500Medium', fontSize: 15, marginRight: 10 },
  pressed: { opacity: 0.7 },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
});