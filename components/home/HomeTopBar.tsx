import React from 'react';
import { Image, ImageSourcePropType, Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

/** Figma "iPhone 16 - 77" – top block: header, Cars / Bikes tabs and the date search. */

export const HERO_TOP = '#332B72';
const HERO_BOTTOM = '#6B5AED';

const F = {
  medium: 'PlusJakartaSans_500Medium',
  semi: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
};

type Props = {
  topInset: number;
  city: string;
  address?: string;
  onCityPress: () => void;
  sawariCash: number;
  vehicleType: 'car' | 'bike' | string;
  onType: (t: 'car' | 'bike') => void;
  dateLabel?: string;
  onDates: () => void;
};

export function HomeTopBar({
  topInset, city, address = 'MySawari - Self Drive Car Rental Guwahati, Ganesh Turning, Bongshar, Kahilipara, Guwahati, Assam 781019',
  onCityPress, sawariCash, vehicleType, onType, dateLabel, onDates,
}: Props) {
  return (
    <LinearGradient colors={[HERO_TOP, HERO_BOTTOM]} locations={[0, 0.9385]} style={[s.hero, { paddingTop: topInset + 8 }]}>
      {/* Location + SawariCash */}
      <View style={s.header}>
        <Pressable style={s.locWrap} onPress={onCityPress} hitSlop={6}>
          <View style={s.cityRow}>
            <Text style={s.city}>{city}</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </View>
          <Text style={s.address} numberOfLines={1}>{address}</Text>
        </Pressable>
        <View style={s.cashPill}>
          <Text style={s.cashText}>{sawariCash}</Text>
          <MaterialCommunityIcons name="hand-coin" size={14} color="#F5A524" />
        </View>
      </View>

      <TypeTabs value={vehicleType === 'bike' ? 'bike' : 'car'} onChange={onType} />

      {/* Select dates & times */}
      <View style={s.searchWrap}>
        <Pressable style={s.search} onPress={onDates} accessibilityRole="button">
          <Ionicons name="calendar-outline" size={20} color="#737373" />
          <Text style={[s.searchText, dateLabel && { color: '#262626' }]} numberOfLines={1}>
            {dateLabel || 'Select dates & times'}
          </Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

/** Frame 2147226253: Cars / Bikes & Scooters tab switch (Figma iPhone 16 - 77) */
function TypeTabs({ value, onChange }: { value: 'car' | 'bike'; onChange: (t: 'car' | 'bike') => void }) {
  return (
    <View style={s.tabsFrame}>
      {/* Cars */}
      <Pressable
        onPress={() => onChange('car')}
        style={s.tabItem}
        accessibilityRole="tab"
        accessibilityState={{ selected: value === 'car' }}
      >
        <Text style={[s.tabText, value === 'car' ? s.tabActive : s.tabInactive]}>
          Cars
        </Text>
      </Pressable>

      {/* Bikes & Scooters */}
      <Pressable
        onPress={() => onChange('bike')}
        style={s.tabItem}
        accessibilityRole="tab"
        accessibilityState={{ selected: value === 'bike' }}
      >
        <Text style={[s.tabText, value === 'bike' ? s.tabActive : s.tabInactive]}>
          Bikes & Scooters
        </Text>
      </Pressable>
    </View>
  );
}

/* ───────────── Category tiles (SUV / Sedan / Hatchback / MUV) ───────────── */

export type CategoryTile = { label: string; value: string; image: ImageSourcePropType; imgW?: number };

// Export these four renders from Figma ("Silver SUV Three-Quarter Cutout Render" etc.) into assets/images.
export const CAR_CATEGORIES: CategoryTile[] = [
  { label: 'SUV', value: 'SUV', image: require('../../assets/images/cat_suv.png') },
  { label: 'Sedan', value: 'Sedan', image: require('../../assets/images/cat_sedan.png'), imgW: 84 },
  { label: 'Hatchback', value: 'Hatchback', image: require('../../assets/images/cat_hatchback.png'), imgW: 83 },
  { label: 'MUV / MPV', value: 'MUV', image: require('../../assets/images/cat_muv.png') },
];

export function CategoryTiles({ items, onPick, dark }: { items: CategoryTile[]; onPick: (t: CategoryTile) => void; dark?: boolean }) {
  return (
    <View style={s.tiles}>
      {items.map((t) => (
        <Pressable key={t.value} style={{ flex: 1 }} onPress={() => onPick(t)} accessibilityRole="button" accessibilityLabel={t.label}>
          <LinearGradient
            colors={dark ? ['#2A2550', '#1A1D29'] : ['#EAE8FC', '#FFFFFF']}
            style={[s.tile, dark && { borderColor: 'rgba(107,90,237,0.35)' }]}
          >
            <Image source={t.image} style={[s.tileImg, t.imgW ? { width: t.imgW } : null]} resizeMode="contain" />
            <View style={[s.tileLabelWrap, dark && { backgroundColor: '#1A1D29' }]}>
              <Text style={[s.tileLabel, dark && { color: '#E5E7EB' }]} numberOfLines={1}>{t.label}</Text>
            </View>
          </LinearGradient>
        </Pressable>
      ))}
    </View>
  );
}

/* ───────────── Bike & Scooter Category tiles (Frame 2147226276) ───────────── */

export function BikeCategoryTiles({ onPick, dark }: { onPick: (filter: { transmission?: string; category?: string }) => void; dark?: boolean }) {
  return (
    <View style={s.bikeTilesRow}>
      {/* Frame 2147226269: Bikes */}
      <Pressable
        style={s.bikeTileWrap}
        onPress={() => onPick({ transmission: 'Manual', category: 'Bike' })}
        accessibilityRole="button"
        accessibilityLabel="Bikes"
      >
        <LinearGradient
          colors={dark ? ['#332B72', '#1A1D29'] : ['#6B5AED', '#FFFFFF']}
          start={{ x: 0.02, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[s.bikeTile, dark && { borderColor: 'rgba(107, 90, 237, 0.4)' }]}
        >
          <Image
            source={require('../../assets/images/cat_bike.png')}
            style={s.bikeImg}
            resizeMode="contain"
          />
          <View style={[s.bikeBadge, dark && { backgroundColor: '#1A1D29' }]}>
            <Text style={[s.bikeBadgeText, dark && { color: '#E5E7EB' }]}>Bikes</Text>
          </View>
        </LinearGradient>
      </Pressable>

      {/* Frame 2147226270: Scooters */}
      <Pressable
        style={s.bikeTileWrap}
        onPress={() => onPick({ transmission: 'Automatic', category: 'Bike' })}
        accessibilityRole="button"
        accessibilityLabel="Scooters"
      >
        <LinearGradient
          colors={dark ? ['#332B72', '#1A1D29'] : ['#6B5AED', '#FFFFFF']}
          start={{ x: 0.02, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[s.bikeTile, dark && { borderColor: 'rgba(107, 90, 237, 0.4)' }]}
        >
          <Image
            source={require('../../assets/images/cat_scooter.png')}
            style={s.bikeImg}
            resizeMode="contain"
          />
          <View style={[s.bikeBadge, dark && { backgroundColor: '#1A1D29' }]}>
            <Text style={[s.bikeBadgeText, dark && { color: '#E5E7EB' }]}>Scooters</Text>
          </View>
        </LinearGradient>
      </Pressable>
    </View>
  );
}

/* ───────────── Refer strip (sits on top of the trip-milestone card) ───────────── */

export function ReferCard({ amount = '₹50+', onPress, dark }: { amount?: string; onPress: () => void; dark?: boolean }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={[s.refer, dark && { backgroundColor: '#1F2233' }]}>
      <View style={[s.referIcon, dark && { backgroundColor: '#2A2D3E' }]}>
        <Image source={require('../../assets/images/refer_hand_coin.png')} style={{ width: 24, height: 24 }} resizeMode="contain" />
      </View>
      <View style={{ flex: 1 }}>
        <View style={s.referTop}>
          <Text style={[s.referTitle, dark && { color: '#F3F4F6' }]}>Refer & Earn {amount}</Text>
          <View style={s.referBtn}>
            <Text style={s.referBtnText}>Refer</Text>
            <Ionicons name="arrow-forward" size={8} color="#FFFFFF" />
          </View>
        </View>
        <Text style={[s.referSub, dark && { color: '#9CA3AF' }]} numberOfLines={1}>Get 10% of your friend’s booking payment.</Text>
      </View>
    </Pressable>
  );
}

/** Light rounded container used around Recommended Cars and Top Destination. */
export function Panel({ children, dark }: { children: React.ReactNode; dark?: boolean }) {
  return <View style={[s.panel, dark && { backgroundColor: '#161925', borderColor: '#262A3A' }]}>{children}</View>;
}

const s = StyleSheet.create({
  hero: { borderBottomLeftRadius: 20, borderBottomRightRadius: 20, overflow: 'hidden' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 12, minHeight: 64 },
  locWrap: { flex: 1 },
  cityRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  city: { fontFamily: F.semi, fontSize: 15, lineHeight: 22, color: '#FFFFFF' },
  address: { fontFamily: F.medium, fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.8)' },
  cashPill: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    minWidth: 72, height: 42, paddingHorizontal: 12, borderRadius: 40,
    backgroundColor: '#F0EFFD', borderWidth: 1, borderColor: '#D1CCF9',
  },
  cashText: { fontFamily: F.semi, fontSize: 13, color: '#2F3E75' },
  // Frame 2147226253: Cars / Bikes & Scooters tab switch
  tabsFrame: {
    height: 49,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    alignSelf: 'stretch',
  },
  tabItem: {
    flex: 1,
    height: 49,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabText: {
    fontFamily: F.semi,
    fontWeight: '600',
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
  },
  tabActive: {
    color: '#FFFFFF',
  },
  tabInactive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  searchWrap: { paddingTop: 12, paddingHorizontal: 16, paddingBottom: 14 },
  search: {
    height: 51, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12,
    backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#D1CCF9', borderRadius: 12,
  },
  searchText: { flex: 1, fontFamily: F.medium, fontSize: 15, lineHeight: 22, color: '#737373' },
  tiles: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginTop: 16 },
  tile: {
    height: 53, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(107,90,237,0.16)',
    alignItems: 'center', paddingHorizontal: 8, paddingTop: 2, overflow: 'hidden',
  },
  tileImg: { width: 79, height: 48, flexShrink: 0 },
  tileLabelWrap: {
    position: 'absolute', bottom: 0, alignSelf: 'center', width: 60, height: 19,
    backgroundColor: '#FFFFFF', borderTopLeftRadius: 6, borderTopRightRadius: 6,
    alignItems: 'center', justifyContent: 'center', paddingTop: 2, paddingBottom: 1, paddingHorizontal: 4,
  },
  tileLabel: { fontFamily: F.bold, fontSize: 9, lineHeight: 14, color: '#262626' },

  // Frame 2147226276: Bikes & Scooters
  bikeTilesRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, gap: 8, marginTop: 16 },
  bikeTileWrap: { flex: 1, height: 53 },
  bikeTile: {
    flex: 1, height: 53, flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 2, borderWidth: 1, borderColor: 'rgba(107, 90, 237, 0.5)',
    borderRadius: 8, overflow: 'hidden',
  },
  bikeImg: { width: 98.5, height: 65.67, marginLeft: -4 },
  bikeBadge: {
    width: 76, height: 27, backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 6, borderBottomLeftRadius: 6,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  bikeBadgeText: { fontFamily: F.bold, fontSize: 11, lineHeight: 16, textAlign: 'center', color: '#262626' },
  // Frame 2147225720: 331 × 57, flat top-rounded strip sitting directly on the milestone card
  refer: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 31, padding: 8, backgroundColor: '#EFEDFD', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  referIcon: { width: 40, height: 40, borderRadius: 40, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center' },
  referTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  referTitle: { fontFamily: F.semi, fontSize: 13, lineHeight: 20, color: '#262626', includeFontPadding: false },
  referSub: { fontFamily: F.medium, fontSize: 11, lineHeight: 16.5, color: '#737373', includeFontPadding: false },
  referBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 2, height: 20, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: '#2F3E75', borderRadius: 31 },
  referBtnText: { fontFamily: F.bold, fontSize: 8, lineHeight: 12, color: '#FFFFFF', includeFontPadding: false },
  panel: {
    marginHorizontal: 16, paddingVertical: 12, borderRadius: 16,
    backgroundColor: '#FAFAFE', borderWidth: 1, borderColor: '#EEEDFB', overflow: 'hidden',
  },
});

