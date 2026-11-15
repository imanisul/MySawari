import React from 'react';
import { View, Text, Pressable, StyleSheet, Share, Platform, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import * as Haptics from '@/utils/haptics';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { safeBack } from '@/utils/navigation';
import { useSawari } from '@/context/SawariContext';
import { BACKEND_URL, API } from '@/services/backend/api';
import { formatCurrency } from '@/services/backend/pricingEngine';
import { useDetailsPalette } from './detailsPalette';
import { HeartIcon } from '../HeartIcon';

/** Car name + trip dates (tap to edit) · favourite · share. */
export function VehicleHeader({
  title,
  tripLabel,
  onEditTrip,
  isDatesLocked,
}: {
  title: string;
  tripLabel: string;
  onEditTrip?: () => void;
  isDatesLocked?: boolean;
}) {
  const p = useDetailsPalette();
  const router = useRouter();
  const { selectedCar, favorites, toggleFavorite } = useSawari();

  const isFavorite = favorites.includes(selectedCar.id);

  const handleShare = async () => {
    Haptics.selectionAsync();
    try {
      // A public page (not the app itself) so chat apps can draw a card with the car's name, price and photo, and
      // so the link still works for someone without the app installed.
      const url = `${BACKEND_URL.replace(/\/api\/?$/, '')}/share/car/${selectedCar.id}`;
      const price = selectedCar.perDay ? ` from ${formatCurrency(selectedCar.perDay)}/day` : '';

      // Auto-fetch dynamic Play Store & App Store links (cached < 1ms)
      const config = await API.getAppConfig().catch(() => null);
      const playStore = config?.playStoreUrl || 'https://play.google.com/store/apps/details?id=com.mysawari.customer';
      const appStore = config?.appStoreUrl || 'https://apps.apple.com/app/id6829408836';

      const message = `Check out the ${title} on MySawari${price}!\n\n🚗 Car link: ${url}\n\n📲 Download the MySawari App:\nAndroid: ${playStore}\niOS: ${appStore}`;

      await Share.share({
        message,
        title: `Rent ${title} on MySawari`,
        ...(Platform.OS === 'ios' ? { url } : {}),
      });
    } catch (error: any) {
      if (__DEV__) console.warn('Vehicle sharing dismissed or failed');
    }
  };

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleFavorite(selectedCar.id);
  };

  return (
    <SafeAreaView edges={['top']} style={{ backgroundColor: p.page, zIndex: 10 }}>
      <View style={styles.header}>
        {/* Back button */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back"
          onPress={() => {
            Haptics.selectionAsync();
            safeBack(router);
          }}
          hitSlop={8}
          style={({ pressed }) => [styles.iconBtn, { backgroundColor: p.iconBg }, pressed && { opacity: 0.7 }]}
        >
          <Feather name="chevron-left" size={20} color={p.sub} />
        </Pressable>

        {/* The whole name + dates block opens the trip editor, not just the small "Edit" label. */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title}, ${tripLabel}.${isDatesLocked ? ' Fixed dates deal' : ' Edit trip'}`}
          onPress={() => {
            if (isDatesLocked) {
              Alert.alert('Fixed Schedule Deal', 'Rental dates and times are locked for this special deal and cannot be modified.');
              return;
            }
            onEditTrip?.();
          }}
          hitSlop={6}
          style={({ pressed }) => [styles.titleCol, pressed && { opacity: 0.7 }]}
        >
          {/* Semibold/s in a 20px-tall row, vertically centred (the design's box is `display:flex;
              align-items:center`), so the date line below always starts at the same y whatever the
              name is. Long names get an ellipsis instead of wrapping into the trip row. */}
          <View style={styles.titleBox}>
            <Text style={[styles.title, { color: p.fg }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{title}</Text>
          </View>
          {/* Frame 96: the date line and the 28×12 Edit chip sit 6 apart inside a 2px column. Each is
              centred in its own fixed-height box (Medium/xs → 16px, Edit → 12px), so the row stays exactly
              17px tall and an over-long label ellipses instead of wrapping or shifting Edit sideways. */}
          <View style={styles.tripRow}>
            <View style={styles.tripBox}>
              <Text style={[styles.trip, { color: p.sub }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{tripLabel}</Text>
            </View>
            {/* Frame 97: 28×12 -- a 10px pen / lock, 2px, then the label. Fixed width, never wraps. */}
            <View style={styles.editBtn}>
              <Feather name={isDatesLocked ? 'lock' : 'edit'} size={10} color={isDatesLocked ? p.sub : p.navy} style={styles.editIcon} />
              <View style={styles.editBox}>
                <Text
                  style={[styles.editText, { color: isDatesLocked ? p.sub : p.navy }]}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {isDatesLocked ? 'Fixed' : 'Edit'}
                </Text>
              </View>
            </View>
          </View>
        </Pressable>

        {/* Frame 24: the two 32px circles, right aligned, 8 apart. */}
        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
            onPress={handleFavorite}
            style={[styles.iconBtn, { backgroundColor: p.iconBg }]}
          >
            {/* Figma's 18x19 heart; saved = same outline filled red. */}
            <HeartIcon width={18} height={19} color={isFavorite ? p.red : p.muted} filled={isFavorite} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Share"
            onPress={handleShare}
            style={[styles.iconBtn, { backgroundColor: p.iconBg }]}
          >
            <Svg width={17} height={17} viewBox="0 0 17 17" fill="none" stroke={p.muted} strokeLinecap="round" strokeLinejoin="round">
              <Path d="M14.875 9.20833V13.4583C14.875 13.8341 14.7257 14.1944 14.4601 14.4601C14.1944 14.7257 13.8341 14.875 13.4583 14.875H3.54167C3.16594 14.875 2.80561 14.7257 2.53993 14.4601C2.27426 14.1944 2.125 13.8341 2.125 13.4583V3.54167C2.125 3.16594 2.27426 2.80561 2.53993 2.53993C2.80561 2.27426 3.16594 2.125 3.54167 2.125H7.79167" />
              <Path d="M14.875 2.125L8.5 8.5" />
              <Path d="M10.625 2.125H14.875V6.375" />
            </Svg>
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
  // Frame 94: column of 20px title + 17px date row, 2px apart.
  titleCol: { flex: 1, gap: 2, justifyContent: 'center' },
  // Figma's text box is exactly 20px high and centres its single 13/20 line.
  titleBox: { height: 20, justifyContent: 'center' },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },
  tripRow: { height: 17, flexDirection: 'row', alignItems: 'center', gap: 6 },
  // Medium/xs box: 11px on a 150% line = 16px, centred.
  tripBox: { height: 16, justifyContent: 'center', flexShrink: 1 },
  trip: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16, flexShrink: 1 },
  editBtn: { width: 28, height: 12, flexDirection: 'row', alignItems: 'center' },
  editIcon: { width: 10, height: 10, flexShrink: 0 },
  editBox: { width: 26, height: 12, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  editText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, lineHeight: 10, textDecorationLine: 'underline' },
  // Frame 24: two 32px circles, 8 apart, right aligned -- 32+8+32 = 72 wide, 32 tall.
  actions: { width: 72, height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
});
