import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSawari } from '@/context/SawariContext';
import { CarListCard, LoginBottomSheet } from '@/components';
import { CarCardSkeleton } from '@/components/loading/CarCardSkeleton';
import { useVehicles } from '@/hooks/useVehicles';
import { byAvailability, getAvailability } from '@/utils/sawari';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { ScreenHeader, PF } from '@/components/profile/ProfileParts';

/**
 * Figma "Favourite Cars" (Profile → Favourite Cars): the saved cars as the same list cards as Explore, free
 * ones first. Logged out: with hearts tapped as a guest, those cars with a "Log in to keep your favourites"
 * banner (they move into the account on login); with none, "Log in to see your favourite cars".
 * Logged in with none → a prompt to explore.
 */
export default function WishlistScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { favorites, isAuthenticated } = useSawari();
  const { data: vehicles, isLoading: vehiclesLoading } = useVehicles();
  const [showLogin, setShowLogin] = useState(false);

  // Saved cars matched against the live fleet: until it has loaded, placeholders rather than "empty".
  const waitingForFleet = favorites.length > 0 && vehiclesLoading;
  const favoriteCars = useMemo(() => byAvailability((vehicles || []).filter((car) => favorites.includes(car.id)).map((car) => {
    const availability = getAvailability(car);
    return { ...car, availability, isAvailable: availability.available };
  })), [vehicles, favorites]);

  const explore = () => { Haptics.selectionAsync(); router.push('/explore'); };

  const State = ({ icon, title, body, primary, onPrimary, secondary, onSecondary }: {
    icon: React.ReactNode; title: string; body: string; primary: string; onPrimary: () => void; secondary?: string; onSecondary?: () => void;
  }) => (
    <View style={styles.state}>
      <View style={[styles.stateIcon, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>{icon}</View>
      <Text style={[styles.stateTitle, { color: p.fg }]}>{title}</Text>
      <Text style={[styles.stateBody, { color: p.sub }]}>{body}</Text>
      <Pressable accessibilityRole="button" onPress={onPrimary} style={({ pressed }) => [styles.primary, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}>
        <Text style={styles.primaryText}>{primary}</Text>
      </Pressable>
      {!!secondary && (
        <Pressable accessibilityRole="button" onPress={onSecondary} style={({ pressed }) => [styles.secondary, { borderColor: p.navy }, pressed && { opacity: 0.7 }]}>
          <Text style={[styles.secondaryText, { color: p.navy }]}>{secondary}</Text>
        </Pressable>
      )}
    </View>
  );

  // ── Logged out, nothing saved: ask to log in ──
  if (isAuthenticated === false && favorites.length === 0) {
    return (
      <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
        <ScreenHeader title="Favourite Cars" />
        <State
          icon={<Ionicons name="heart-outline" size={24} color={p.fg} />}
          title="Log in to see your favourite cars"
          body="Tap the heart on any car to save it. Log in to keep your favourites on your account and find them here anytime."
          primary="Log In"
          onPrimary={() => { Haptics.selectionAsync(); setShowLogin(true); }}
          secondary="Explore cars"
          onSecondary={explore}
        />
        <LoginBottomSheet visible={showLogin} showSkip={false} onClose={() => setShowLogin(false)} onLoginSuccess={() => setShowLogin(false)} />
      </SafeAreaView>
    );
  }

  // Logged out with hearts tapped as a guest: show those cars, with a banner to log in and keep them.
  const guestBanner = isAuthenticated === false ? (
    <View style={[styles.banner, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
      <View style={[styles.bannerIcon, { backgroundColor: p.page, borderColor: p.deliveryBorder }]}>
        <Ionicons name="heart" size={16} color={p.red} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={[styles.bannerTitle, { color: p.fg }]}>Log in to keep your favourites</Text>
        <Text style={[styles.bannerSub, { color: p.sub }]}>They're saved on this phone only. Log in to keep them on your account.</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={() => { Haptics.selectionAsync(); setShowLogin(true); }} style={({ pressed }) => [styles.bannerBtn, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}>
        <Text style={styles.bannerBtnText}>Log In</Text>
      </Pressable>
    </View>
  ) : null;

  return (
    <SafeAreaView edges={['top']} style={[styles.screen, { backgroundColor: p.page }]}>
      <ScreenHeader title="Favourite Cars" />
      <FlatList
        data={favoriteCars}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <CarListCard car={item} />}
        ListHeaderComponent={guestBanner}
        contentContainerStyle={{ paddingTop: 4, paddingBottom: insets.bottom + 24, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          isAuthenticated === null || waitingForFleet ? (
            <View style={{ paddingHorizontal: 16 }}>{[0, 1].map((i) => <CarCardSkeleton key={i} index={i} />)}</View>
          ) : (
            <State
              icon={<Ionicons name="heart-outline" size={24} color={p.fg} />}
              title="No favourite cars yet"
              body="Tap the heart on any car to save it here, so you can find and book it quickly later."
              primary="Explore cars"
              onPrimary={explore}
            />
          )
        }
      />
      <LoginBottomSheet visible={showLogin} showSkip={false} onClose={() => setShowLogin(false)} onLoginSuccess={() => setShowLogin(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  state: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingBottom: 60 },
  stateIcon: { width: 60, height: 60, borderRadius: 30, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  stateTitle: { fontFamily: PF.semibold, fontSize: 17, lineHeight: 24, textAlign: 'center', marginTop: 16 },
  stateBody: { fontFamily: PF.regular, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 6 },
  primary: { alignSelf: 'stretch', height: 50, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 22 },
  primaryText: { fontFamily: PF.semibold, fontSize: 16, color: '#FFFFFF' },
  secondary: { alignSelf: 'stretch', height: 50, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 10 },
  secondaryText: { fontFamily: PF.semibold, fontSize: 15 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 12, padding: 12, marginHorizontal: 16, marginBottom: 12 },
  bannerIcon: { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  bannerTitle: { fontFamily: PF.semibold, fontSize: 13.5 },
  bannerSub: { fontFamily: PF.regular, fontSize: 11.5, lineHeight: 16, marginTop: 2 },
  bannerBtn: { height: 32, paddingHorizontal: 14, borderRadius: 8, justifyContent: 'center' },
  bannerBtnText: { fontFamily: PF.semibold, fontSize: 12.5, color: '#FFFFFF' },
});