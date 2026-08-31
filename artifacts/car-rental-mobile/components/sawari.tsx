import React from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useRouter, usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Category, categories, Car, DriverMode } from '@/lib/sawari';
import { useColors } from '@/hooks/useColors';
import { useSawari } from '@/context/SawariContext';

export function Page({
  children,
  scroll = true,
  bottomNav = false,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  bottomNav?: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const content = (
    <View
      style={[
        styles.pageContent,
        {
          paddingTop: insets.top + 9,
          paddingBottom: insets.bottom + (bottomNav ? 80 : 24),
        },
      ]}
    >
      {children}
    </View>
  );

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {scroll ? (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {content}
        </ScrollView>
      ) : (
        content
      )}
      {bottomNav && <BottomNavigation />}
    </View>
  );
}

export function Header({
  title = 'MySawari',
  back = false,
}: {
  title?: string;
  back?: boolean;
}) {
  const colors = useColors();
  const router = useRouter();

  return (
    <View style={styles.header}>
      <Pressable
        accessibilityRole="button"
        testID={back ? 'back-button' : 'brand-home'}
        onPress={() => {
          Haptics.selectionAsync();
          if (back) router.back();
          else router.replace('/');
        }}
        style={({ pressed }) => [styles.headerTitleWrap, pressed && styles.pressed]}
      >
        {back && <Feather name="arrow-left" size={21} color={colors.foreground} />}
        <Text style={[styles.appName, { color: colors.foreground }]}>{title}</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Notifications"
        testID="notifications"
        onPress={() => Haptics.selectionAsync()}
        style={({ pressed }) => [
          styles.notificationButton,
          { backgroundColor: colors.card, borderColor: colors.border },
          pressed && styles.pressed,
        ]}
      >
        <Feather name="bell" size={17} color={colors.foreground} />
      </Pressable>
    </View>
  );
}

export function BottomNavigation() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const pathname = usePathname();
  const items: { label: string; route: '/' | '/explore' | '/bookings'; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
    { label: 'Home', route: '/', icon: 'home-outline' },
    { label: 'Explore', route: '/explore', icon: 'compass-outline' },
    { label: 'Bookings', route: '/bookings', icon: 'ticket-outline' },
  ];

  return (
    <View
      style={[
        styles.bottomNavigation,
        {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Math.max(insets.bottom, 7),
        },
      ]}
    >
      {items.map((item) => {
        const active = item.route === '/' ? pathname === '/' : pathname.startsWith(item.route);
        const activeIcon = active ? (item.icon.replace('-outline', '') as React.ComponentProps<typeof Ionicons>['name']) : item.icon;
        return (
          <Pressable
            key={item.label}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            testID={`tab-${item.label.toLowerCase()}`}
            onPress={() => {
              Haptics.selectionAsync();
              router.push(item.route);
            }}
            style={({ pressed }) => [styles.navItem, pressed && styles.pressed]}
          >
            <Ionicons name={activeIcon} size={21} color={active ? colors.foreground : colors.mutedForeground} />
            <Text style={[styles.navLabel, { color: active ? colors.foreground : colors.mutedForeground }]}>
              {item.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function SearchCard({
  mode,
  onModeChange,
  onSearch,
}: {
  mode: DriverMode;
  onModeChange: (mode: DriverMode) => void;
  onSearch: () => void;
}) {
  const colors = useColors();
  return (
    <View style={[styles.searchCard, { backgroundColor: colors.card }]}>
      <View style={styles.searchTopRow}>
        <View style={styles.locationCopy}>
          <View style={styles.labelRow}>
            <Feather name="map-pin" size={13} color={colors.mutedForeground} />
            <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Pickup</Text>
          </View>
          <Text style={[styles.locationName, { color: colors.foreground }]}>Bikaner</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          testID="driver-mode-toggle"
          onPress={() => {
            Haptics.selectionAsync();
            onModeChange(mode === 'Self Drive' ? 'With Driver' : 'Self Drive');
          }}
          style={({ pressed }) => [
            styles.modePill,
            { backgroundColor: colors.primary },
            pressed && styles.pressed,
          ]}
        >
          <Text style={[styles.modePillText, { color: colors.primaryForeground }]}>{mode}</Text>
        </Pressable>
      </View>
      <View style={[styles.tripMetaRow, { borderBottomColor: colors.border }]}>
        <View style={styles.tripMeta}>
          <Feather name="calendar" size={14} color={colors.mutedForeground} />
          <Text style={[styles.tripMetaText, { color: colors.foreground }]}>17 Aug – 20 Aug</Text>
        </View>
        <View style={styles.tripMeta}>
          <Feather name="clock" size={14} color={colors.mutedForeground} />
          <Text style={[styles.tripMetaText, { color: colors.foreground }]}>10:00 AM</Text>
        </View>
      </View>
      <Pressable
        accessibilityRole="button"
        testID="search-cars"
        onPress={onSearch}
        style={({ pressed }) => [styles.searchAction, pressed && styles.pressed]}
      >
        <Text style={[styles.searchActionText, { color: colors.foreground }]}>Search cars</Text>
        <View style={[styles.actionCircle, { backgroundColor: colors.primary }]}>
          <Feather name="arrow-right" size={17} color={colors.primaryForeground} />
        </View>
      </Pressable>
    </View>
  );
}

export function NextTrip({ car }: { car: Car }) {
  const colors = useColors();
  const router = useRouter();
  return (
    <Pressable
      accessibilityRole="button"
      testID="next-trip"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/car-details');
      }}
      style={({ pressed }) => [
        styles.nextTrip,
        { backgroundColor: colors.navy },
        pressed && styles.cardPressed,
      ]}
    >
      <Image source={car.image} resizeMode="cover" style={styles.tripImage} />
      <View style={styles.nextTripCopy}>
        <Text style={[styles.nextTripLabel, { color: colors.primary }]}>Your next trip</Text>
        <Text style={[styles.nextTripName, { color: colors.warmWhite }]}>{car.name}</Text>
        <Text style={[styles.nextTripDate, { color: colors.mutedForeground }]}>17 Aug → 20 Aug</Text>
      </View>
      <Feather name="arrow-right" size={20} color={colors.warmWhite} />
    </Pressable>
  );
}

export function CategoryTabs({
  selected,
  onSelect,
}: {
  selected: Category;
  onSelect: (category: Category) => void;
}) {
  const colors = useColors();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
      {categories.map((item) => {
        const active = item === selected;
        return (
          <Pressable
            key={item}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            testID={`category-${item.toLowerCase()}`}
            onPress={() => {
              Haptics.selectionAsync();
              onSelect(item);
            }}
            style={({ pressed }) => [styles.category, pressed && styles.pressed]}
          >
            <Text
              style={[
                styles.categoryText,
                { color: active ? colors.foreground : colors.mutedForeground },
                active && styles.categoryTextSelected,
              ]}
            >
              {item}
            </Text>
            {active && <View style={[styles.categoryUnderline, { backgroundColor: colors.foreground }]} />}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function CarTile({ car, onPress }: { car: Car; onPress?: () => void }) {
  const colors = useColors();
  const router = useRouter();
  const { selectCar } = useSawari();
  return (
    <Pressable
      accessibilityRole="button"
      testID={`car-${car.id}`}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        selectCar(car);
        onPress?.();
        router.push('/car-details');
      }}
      style={({ pressed }) => [styles.carTile, pressed && styles.cardPressed]}
    >
      <Image source={car.image} resizeMode="cover" style={styles.carImage} />
      <View style={[styles.carTileCopy, { backgroundColor: colors.card }]}>
        <Text numberOfLines={1} style={[styles.carName, { color: colors.foreground }]}>
          {car.name}
        </Text>
        <View style={styles.carPriceRow}>
          <Text style={[styles.carType, { color: colors.mutedForeground }]}>{car.category}</Text>
          <Text style={[styles.carPrice, { color: colors.foreground }]}>{car.price}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export function CarListCard({ car }: { car: Car }) {
  const colors = useColors();
  const router = useRouter();
  const { selectCar } = useSawari();
  return (
    <Pressable
      accessibilityRole="button"
      testID={`list-car-${car.id}`}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        selectCar(car);
        router.push('/car-details');
      }}
      style={({ pressed }) => [
        styles.listCard,
        { backgroundColor: colors.card },
        pressed && styles.cardPressed,
      ]}
    >
      <Image source={car.image} resizeMode="cover" style={styles.listImage} />
      <View style={styles.listCopy}>
        <View style={styles.listTitleRow}>
          <Text style={[styles.listName, { color: colors.foreground }]}>{car.name}</Text>
          <Text style={[styles.listPrice, { color: colors.foreground }]}>{car.price}</Text>
        </View>
        <Text style={[styles.listMeta, { color: colors.mutedForeground }]}>
          {car.category} · {car.transmission} · {car.seats}
        </Text>
        <View style={styles.listBottomRow}>
          <View style={styles.availableRow}>
            <View style={[styles.availableDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.availableText, { color: colors.mutedForeground }]}>Available now</Text>
          </View>
          <Feather name="arrow-up-right" size={16} color={colors.blue} />
        </View>
      </View>
    </Pressable>
  );
}

export function SectionHeading({
  title,
  kicker,
  action,
  onAction,
}: {
  title: string;
  kicker?: string;
  action?: string;
  onAction?: () => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeading}>
      <View>
        {kicker && <Text style={[styles.sectionKicker, { color: colors.mutedForeground }]}>{kicker}</Text>}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      </View>
      {action && (
        <Pressable
          accessibilityRole="button"
          testID={`action-${action.toLowerCase().replaceAll(' ', '-')}`}
          onPress={onAction}
          style={({ pressed }) => [styles.viewAll, pressed && styles.pressed]}
        >
          <Text style={[styles.viewAllText, { color: colors.blue }]}>{action}</Text>
        </Pressable>
      )}
    </View>
  );
}

export function DriverModeRow({
  mode,
  onChange,
}: {
  mode: DriverMode;
  onChange: (mode: DriverMode) => void;
}) {
  const colors = useColors();
  return (
    <View style={styles.driverModeRow}>
      {(['Self Drive', 'With Driver'] as DriverMode[]).map((item) => {
        const active = mode === item;
        return (
          <Pressable
            key={item}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            testID={`mode-${item.toLowerCase().replaceAll(' ', '-')}`}
            onPress={() => {
              Haptics.selectionAsync();
              onChange(item);
            }}
            style={({ pressed }) => [
              styles.driverModeChoice,
              {
                backgroundColor: active ? colors.primary : colors.card,
                borderColor: active ? colors.primary : colors.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.driverModeText, { color: active ? colors.primaryForeground : colors.foreground }]}>
              {item}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  pageContent: { paddingHorizontal: 24 },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerTitleWrap: { alignItems: 'center', flexDirection: 'row', gap: 12 },
  appName: { fontFamily: 'Inter_700Bold', fontSize: 20, letterSpacing: -0.5 },
  notificationButton: {
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  searchCard: { borderRadius: 23, marginTop: 24, paddingHorizontal: 20, paddingTop: 20 },
  searchTopRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  locationCopy: { flex: 1 },
  labelRow: { alignItems: 'center', flexDirection: 'row', gap: 6 },
  fieldLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  locationName: { fontFamily: 'Inter_600SemiBold', fontSize: 24, letterSpacing: -0.7, marginTop: 3 },
  modePill: { borderRadius: 99, marginTop: 1, paddingHorizontal: 12, paddingVertical: 6 },
  modePillText: { fontFamily: 'Inter_500Medium', fontSize: 11 },
  tripMetaRow: { borderBottomWidth: 1, flexDirection: 'row', gap: 22, marginTop: 17, paddingBottom: 20 },
  tripMeta: { alignItems: 'center', flexDirection: 'row', gap: 7 },
  tripMetaText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  searchAction: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', minHeight: 64 },
  searchActionText: { fontFamily: 'Inter_600SemiBold', fontSize: 16 },
  actionCircle: { alignItems: 'center', borderRadius: 99, height: 35, justifyContent: 'center', width: 35 },
  nextTrip: { alignItems: 'center', borderRadius: 16, flexDirection: 'row', marginTop: 24, minHeight: 80, padding: 10 },
  tripImage: { borderRadius: 11, height: 60, width: 78 },
  nextTripCopy: { flex: 1, marginLeft: 10 },
  nextTripLabel: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  nextTripName: { fontFamily: 'Inter_500Medium', fontSize: 14, marginTop: 3 },
  nextTripDate: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 4 },
  categoryRow: { gap: 20, paddingTop: 14 },
  category: { alignItems: 'center', paddingBottom: 7 },
  categoryText: { fontFamily: 'Inter_400Regular', fontSize: 13 },
  categoryTextSelected: { fontFamily: 'Inter_500Medium' },
  categoryUnderline: { bottom: 0, height: 1.5, position: 'absolute', width: 20 },
  carTile: { borderRadius: 16, overflow: 'hidden', width: 270 },
  carImage: { height: 160, width: '100%' },
  carTileCopy: { paddingHorizontal: 13, paddingVertical: 11 },
  carName: { fontFamily: 'Inter_600SemiBold', fontSize: 15 },
  carPriceRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 5 },
  carType: { fontFamily: 'Inter_400Regular', fontSize: 11 },
  carPrice: { fontFamily: 'Inter_600SemiBold', fontSize: 12 },
  listCard: { borderRadius: 17, flexDirection: 'row', marginTop: 12, overflow: 'hidden', padding: 10 },
  listImage: { borderRadius: 12, height: 110, width: 128 },
  listCopy: { flex: 1, justifyContent: 'space-between', marginLeft: 12, paddingVertical: 2 },
  listTitleRow: { alignItems: 'flex-start', flexDirection: 'row', justifyContent: 'space-between' },
  listName: { flex: 1, fontFamily: 'Inter_600SemiBold', fontSize: 15, paddingRight: 7 },
  listPrice: { fontFamily: 'Inter_600SemiBold', fontSize: 13 },
  listMeta: { fontFamily: 'Inter_400Regular', fontSize: 11, marginTop: 7 },
  listBottomRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 },
  availableRow: { alignItems: 'center', flexDirection: 'row' },
  availableDot: { borderRadius: 99, height: 6, marginRight: 6, width: 6 },
  availableText: { fontFamily: 'Inter_400Regular', fontSize: 10 },
  sectionHeading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 26 },
  sectionKicker: { fontFamily: 'Inter_600SemiBold', fontSize: 9, letterSpacing: 1.6 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 20, letterSpacing: -0.5, marginTop: 4 },
  viewAll: { padding: 4 },
  viewAllText: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  bottomNavigation: { borderTopWidth: 1, bottom: 0, flexDirection: 'row', justifyContent: 'space-around', left: 0, paddingTop: 10, position: 'absolute', right: 0 },
  navItem: { alignItems: 'center', gap: 4, minWidth: 72, paddingVertical: 2 },
  navLabel: { fontFamily: 'Inter_400Regular', fontSize: 12 },
  driverModeRow: { flexDirection: 'row', gap: 10, marginTop: 15 },
  driverModeChoice: { borderRadius: 12, borderWidth: 1, flex: 1, paddingVertical: 12, alignItems: 'center' },
  driverModeText: { fontFamily: 'Inter_500Medium', fontSize: 12 },
  pressed: { opacity: 0.65 },
  cardPressed: { opacity: 0.9, transform: [{ scale: 0.985 }] },
});