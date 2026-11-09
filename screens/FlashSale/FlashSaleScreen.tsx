import React from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from '@/utils/haptics';
import { safeBack } from '@/utils/navigation';
import { useSawari } from '@/context/SawariContext';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

const RED = '#E11D48';
const STEPS = [
  { icon: 'calendar', title: 'Pick your dates', sub: 'Choose pickup and return for the car or bike you want.' },
  { icon: 'truck', title: 'Choose a vehicle', sub: 'Vehicles free for those dates are listed for you.' },
  { icon: 'check-circle', title: 'Book at the flash price', sub: 'The sale price is applied at checkout.' },
] as const;
const TERMS = [
  'Limited time offer, valid while the sale is live.',
  'Available on selected vehicles and dates only.',
  'Cannot be combined with other offers.',
];

export default function FlashSaleScreen() {
  const p = useDetailsPalette();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setBookingSource } = useSawari();

  const book = () => {
    Haptics.selectionAsync();
    setBookingSource('home');
    router.push('/dates');
  };

  return (
    <View style={[styles.root, { backgroundColor: p.page }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 110 + insets.bottom }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={[RED, '#F97316']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => safeBack(router)} style={styles.back} accessibilityRole="button" accessibilityLabel="Back">
            <Feather name="arrow-left" size={20} color="#FFFFFF" />
          </Pressable>
          <View style={styles.tag}>
            <Feather name="zap" size={12} color={RED} />
            <Text style={styles.tagText}>FLASH SALE</Text>
          </View>
          <Text style={styles.at}>Rent at just</Text>
          <Text style={styles.price}>₹1</Text>
          <Text style={styles.sub}>Limited time only. Grab it before it's gone.</Text>
        </LinearGradient>

        <View style={styles.body}>
          <Text style={[styles.h, { color: p.fg }]}>How it works</Text>
          {STEPS.map((s, i) => (
            <View key={s.title} style={[styles.card, { backgroundColor: p.summary, borderColor: p.deliveryBorder }]}>
              <View style={styles.num}><Text style={styles.numText}>{i + 1}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: p.fg }]}>{s.title}</Text>
                <Text style={[styles.cardSub, { color: p.sub }]}>{s.sub}</Text>
              </View>
              <Feather name={s.icon} size={20} color={RED} />
            </View>
          ))}

          <Text style={[styles.h, { color: p.fg, marginTop: 8 }]}>Terms</Text>
          {TERMS.map((t) => (
            <View key={t} style={styles.termRow}>
              <View style={styles.dot} />
              <Text style={[styles.cardSub, { color: p.sub, flex: 1 }]}>{t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: p.page, paddingBottom: insets.bottom + 12, borderTopColor: p.deliveryBorder }]}>
        <Pressable onPress={book} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]} accessibilityRole="button">
          <Text style={styles.ctaText}>Book now</Text>
          <Feather name="arrow-right" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: { paddingHorizontal: 20, paddingBottom: 32, borderBottomLeftRadius: 28, borderBottomRightRadius: 28, gap: 4 },
  back: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.2)', marginBottom: 16 },
  tag: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 4, height: 24, paddingHorizontal: 12, borderRadius: 12, backgroundColor: '#FFE600' },
  tagText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, lineHeight: 16, letterSpacing: 0.8, color: RED },
  at: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 16, lineHeight: 24, color: '#FFFFFF', marginTop: 12 },
  price: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 84, lineHeight: 92, color: '#FFFFFF' },
  sub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, color: 'rgba(255,255,255,0.9)' },
  body: { padding: 16, gap: 10 },
  h: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, lineHeight: 26 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14, borderWidth: 1 },
  num: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: RED },
  numText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, lineHeight: 18, color: '#FFFFFF' },
  cardTitle: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, lineHeight: 21 },
  cardSub: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 18 },
  termRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: RED, marginTop: 7 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: 16, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 14, backgroundColor: RED },
  ctaText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, lineHeight: 22, color: '#FFFFFF' },
});
