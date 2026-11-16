import React from 'react';
import { SheetModal } from '@/components/common/SheetModal';
import { Modal, Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ModalBlur } from '@/components/common/ModalBlur';

/** Figma "Set Location" popup after opening the app: six promise chips, "Your Ride, Your Way", Continue. */
type Chip = { label: string; icon: any; iconSize: number; w: number; h?: number; left: number; top: number; rot: number };

// Each row is a positioned box inside the 361 × 244 chip area (Figma Frames 2147226286 / 87 / 88); chips are placed
// relative to their row, exactly as the CSS gives them (left/top, right/bottom turned into left/top).
const ROWS: { left: number; top: number; w: number; h: number; chips: Chip[] }[] = [
  {
    left: -0.02, top: 18, w: 360.67, h: 58.62,
    chips: [
      { label: 'Security Deposit', icon: require('@/assets/images/hero_benefit_zero_deposit.png'), iconSize: 30, w: 165, left: 0, top: 0, rot: 4.43 },
      { label: 'Expertly Maintained', icon: require('@/assets/images/hero_benefit_maintained.png'), iconSize: 30, w: 186, left: 360.67 - 2.65 - 186, top: 0, rot: -3.81 },
    ],
  },
  {
    left: 6, top: 91, w: 343, h: 58,
    chips: [
      { label: 'Unlimited KM', icon: require('@/assets/images/hero_benefit_unlimited_km.png'), iconSize: 30, w: 145, left: 343 - 188 - 145, top: 58 - 9 - 46, rot: 3.79 },
      { label: 'DoorStep Delivery', icon: require('@/assets/images/hero_benefit_doorstep.png'), iconSize: 30, w: 175, left: 165, top: -2, rot: -4.06 },
    ],
  },
  {
    left: 6.14, top: 165, w: 351.64, h: 62.57,
    chips: [
      { label: 'Flexible Booking', icon: require('@/assets/images/mileage_calendar.png'), iconSize: 18, w: 164, left: 351.64 - 187.64 - 164, top: 8.63, rot: -2.8 },
      { label: 'Free Cancellation', icon: require('@/assets/images/benefit_zero_cancellation.png'), iconSize: 18, w: 170, left: 179.43, top: 2.59, rot: 2.2 },
    ],
  },
];

export function WelcomeSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  // The chips are placed for a 361-wide area (393 phone − 16 each side); narrower phones shrink them to fit.
  const { width } = useWindowDimensions();
  const chipScale = Math.min(1, (width - 32) / 361);
  return (
    <SheetModal visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />

        <View style={styles.wrap}>
          {/* Frame 2147225893: close button, right aligned */}
          <View style={styles.closeRow}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#737373" />
            </Pressable>
          </View>

          <View style={[styles.sheet, { paddingBottom: 12 + insets.bottom }]}>
            {/* Background: #6152D8 70% → white 70% at 70%, plus a soft pink glow top right (the CSS blurs an ellipse 82px) */}
            <LinearGradient colors={['rgba(97,82,216,0.7)', 'rgba(255,255,255,0.7)']} locations={[0, 0.7]} style={StyleSheet.absoluteFill} pointerEvents="none" />
            <Svg width={400} height={330} style={styles.glow} pointerEvents="none">
              <Defs>
                <RadialGradient id="welcomeGlow" cx="50%" cy="50%" rx="50%" ry="50%">
                  <Stop offset="0" stopColor="#FDB6DD" stopOpacity={0.8} />
                  <Stop offset="1" stopColor="#FDB6DD" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Ellipse cx={200} cy={165} rx={200} ry={165} fill="url(#welcomeGlow)" />
            </Svg>

            <View style={styles.content}>
              {/* Frame 2147226270: the tilted chips */}
              <View style={[styles.chipArea, { height: 244 * chipScale }]}>
                <View style={{ width: 361, height: 244, alignSelf: 'center', transform: [{ scale: chipScale }], marginTop: -(244 * (1 - chipScale)) / 2 }}>
                {ROWS.map((row, ri) => (
                  <View key={ri} style={{ position: 'absolute', left: row.left, top: row.top, width: row.w, height: row.h }}>
                    {row.chips.map((c) => (
                      <View
                        key={c.label}
                        style={[styles.chip, { width: c.w, left: c.left, top: c.top, transform: [{ rotate: `${c.rot}deg` }] }]}
                      >
                        <View style={styles.chipIcon}>
                          <Image source={c.icon} style={{ width: c.iconSize, height: c.iconSize }} contentFit="contain" />
                        </View>
                        {/* Whole label always shows (never "Security Depo…"): shrinks a little instead of cutting off. */}
                        <Text style={styles.chipText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>{c.label}</Text>
                      </View>
                    ))}
                  </View>
                ))}
                </View>
              </View>

              {/* Frame 2147226278 */}
              <View style={styles.textBlock}>
                <Text style={styles.title} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>Your Ride, Your Way</Text>
                <Text style={styles.subtitle}>Find vehicles that match your preferences and enjoy a hassle-free rental experience.</Text>
              </View>
            </View>

            <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.cta, pressed && { opacity: 0.9 }]}>
              <Text style={styles.ctaText}>Continue</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  wrap: { width: '100%', alignItems: 'flex-end', gap: 8 },
  closeRow: { alignSelf: 'stretch', height: 32, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', paddingHorizontal: 12 },
  closeBtn: { width: 32, height: 32, borderRadius: 30, backgroundColor: '#FAFAFA', alignItems: 'center', justifyContent: 'center' },
  sheet: {
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    paddingTop: 16,
    paddingHorizontal: 16,
    gap: 40,
  },
  glow: { position: 'absolute', left: 91, top: -138 },
  content: { gap: 12 },
  chipArea: { height: 244 },
  chip: {
    position: 'absolute',
    height: 46,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 8,
    paddingBottom: 8,
    paddingRight: 14,
    paddingLeft: 11,
    backgroundColor: '#FFFFFF',
    borderRadius: 52,
  },
  chipIcon: { width: 30, height: 30, alignItems: 'center', justifyContent: 'center' },
  chipText: { flexShrink: 1, fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, lineHeight: 16, color: '#2B386A', includeFontPadding: false },
  textBlock: { gap: 8 },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 30, lineHeight: 45, textAlign: 'center', color: '#2B386A' },
  subtitle: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, textAlign: 'center', color: '#737373' },
  cta: { height: 54, borderRadius: 12, backgroundColor: '#6B5AED', alignItems: 'center', justifyContent: 'center', padding: 12 },
  ctaText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 26, color: '#FFFFFF', textAlign: 'center' },
});
