import React from 'react';
import { View, Text, Pressable, StyleSheet, Share } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSawari } from '@/context/SawariContext';
import { useDetailsPalette } from './detailsPalette';

/** Back · car name + trip dates (with Edit) · favourite · share. */
export function VehicleHeader({ title, tripLabel, onEditTrip }: { title: string; tripLabel: string; onEditTrip: () => void }) {
  const p = useDetailsPalette();
  const router = useRouter();
  const { selectedCar, favorites, toggleFavorite } = useSawari();

  const isFavorite = favorites.includes(selectedCar.id);

  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      await Share.share({
        message: `Check out the ${title} on MySawari! Rent it now for an amazing trip.`,
        title: `Rent ${title} on MySawari`,
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
    <SafeAreaView edges={['top']} style={{ backgroundColor: p.page, zIndex: 10 }}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
          style={[styles.iconBtn, { backgroundColor: p.iconBg }]}
        >
          <Feather name="chevron-left" size={24} color={p.muted} />
        </Pressable>

        <View style={styles.titleCol}>
          {/* Semibold/s in a 20px-tall row, vertically centred (the design's box is `display:flex;
              align-items:center`), so the date line below always starts at the same y whatever the
              name is. Long names get an ellipsis instead of wrapping into the trip row. */}
          <View style={styles.titleBox}>
            <Text style={[styles.title, { color: p.fg }]} numberOfLines={1}>{title}</Text>
          </View>
          {/* Frame 96: the date line and the 28×12 Edit chip sit 6 apart inside a 2px column. Each is
              centred in its own fixed-height box (Medium/xs → 16px, Edit → 12px), so the row stays exactly
              17px tall and an over-long label ellipses instead of wrapping or shifting Edit sideways. */}
          <View style={styles.tripRow}>
            <View style={styles.tripBox}>
              <Text style={[styles.trip, { color: p.sub }]} numberOfLines={1}>{tripLabel}</Text>
            </View>
            {/* Frame 97: 28×12 -- a 10px pen, 2px, then the underlined label. Fixed width, never wraps. */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit trip dates"
              onPress={onEditTrip}
              hitSlop={8}
              style={styles.editBtn}
            >
              <Feather name="edit" size={10} color={p.navy} style={styles.editIcon} />
              <View style={styles.editBox}>
                <Text style={[styles.editText, { color: p.navy }]} numberOfLines={1}>Edit</Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Frame 24: the two 32px circles, right aligned, 8 apart. */}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
            onPress={handleFavorite}
            style={[styles.iconBtn, { backgroundColor: p.iconBg }]}
          >
            {/* Same 18pt box in both states -- only the fill and colour change. */}
            {isFavorite
              ? <Ionicons name="heart" size={18} style={styles.favIcon} color={p.red} />
              : <Feather name="heart" size={18} style={styles.favIcon} color={p.muted} />}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share"
            onPress={handleShare}
            style={[styles.iconBtn, { backgroundColor: p.iconBg }]}
          >
            <Feather name="external-link" size={17} color={p.muted} />
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // Figma "Header": 393×64, padding 12px 16px, gap 16 between back / title / actions.
  header: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 12, minHeight: 64 },
  iconBtn: { width: 32, height: 32, borderRadius: 16, flexShrink: 0, alignItems: 'center', justifyContent: 'center' },
  favIcon: { width: 18, height: 19, flexShrink: 0 },
  // Frame 94: column of 20px title + 17px date row, 2px apart.
  titleCol: { flex: 1, gap: 2, justifyContent: 'center' },
  // Figma's text box is exactly 20px high and centres its single 13/20 line.
  titleBox: { height: 20, justifyContent: 'center' },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },
  tripRow: { height: 17, flexDirection: 'row', alignItems: 'center', gap: 6 },
  // Medium/xs box: 11px on a 150% line = 16px, centred.
  tripBox: { height: 16, justifyContent: 'center', flexShrink: 1 },
  trip: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16, flexShrink: 1 },
  editBtn: { width: 28, height: 12, flexDirection: 'row', alignItems: 'center', gap: 2 },
  editIcon: { width: 10, height: 10, flexShrink: 0 },
  editBox: { width: 16, height: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  editText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 8, lineHeight: 12, textDecorationLine: 'underline' },
  // Frame 24: two 32px circles, 8 apart, right aligned -- 32+8+32 = 72 wide, 32 tall.
  actions: { width: 72, height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
});
