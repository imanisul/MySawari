import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/hooks/useColors';
import { resultCars } from '@/lib/sawari';
import { useSawari } from '@/context/SawariContext';
import { Header, Page } from '@/components/sawari';

export default function SearchResultsScreen() {
  const colors = useColors();
  const router = useRouter();
  const { mode, setMode, selectCar } = useSawari();

  return (
    <Page bottomNav>
      <Header title="Available cars" />
      <Text style={[styles.location, { color: colors.foreground }]}>Bikaner · 17–20 Aug · {mode}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/planner')}
        style={({ pressed }) => [styles.editButton, { borderColor: colors.border }, pressed && styles.pressed]}
      >
        <Text style={[styles.editText, { color: colors.foreground }]}>Edit</Text>
      </Pressable>
      <View style={styles.toolbar}>
        <ToolButton icon="sliders" label="Filter" />
        <ToolButton icon="bar-chart-2" label="Sort" />
      </View>
      <Text style={[styles.title, { color: colors.foreground }]}>2 cars ready</Text>
      {resultCars.map((car) => (
        <Pressable
          key={car.id}
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
      ))}
    </Page>
  );
}

function ToolButton({ icon, label }: { icon: React.ComponentProps<typeof Feather>['name']; label: string }) {
  const colors = useColors();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => Haptics.selectionAsync()}
      style={({ pressed }) => [styles.toolButton, { backgroundColor: colors.card }, pressed && styles.pressed]}
    >
      <Feather name={icon} size={15} color={colors.foreground} />
      <Text style={[styles.toolText, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  location: { fontFamily: 'Inter_500Medium', fontSize: 15, marginTop: 18 },
  editButton: { alignItems: 'center', borderRadius: 99, borderWidth: 1, height: 40, justifyContent: 'center', position: 'absolute', right: 24, top: 77, width: 56 },
  editText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  toolbar: { flexDirection: 'row', gap: 10, marginTop: 16 },
  toolButton: { alignItems: 'center', borderRadius: 99, flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingVertical: 10 },
  toolText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
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