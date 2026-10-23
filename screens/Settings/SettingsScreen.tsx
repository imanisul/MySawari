import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Pressable } from 'react-native';
import { CustomAlert } from '@/components';
import { useSawari } from '@/context/SawariContext';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useLocalSearchParams, useRouter } from 'expo-router';

// ─── Design tokens (from Figma) ────────────────────────────────────────────────
const T = {
  white: '#FFFFFF',
  neutral800: '#262626',
  neutral500: '#737373',
  neutral300: '#D4D4D4',
  neutral100: '#F5F5F5',
  surface: '#F9F9FB',
  border: '#EAECF1',
  primary500: '#2F3E75',
  toggleOff: '#D4D7E0',
  red600: '#DC2626',
  red50: '#FEF2F2',
  redSurface: '#FFFAFA',
};

const FONT = {
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
};

// ─── Building blocks ──────────────────────────────────────────────────────────
function SawariToggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 160, useNativeDriver: false }).start();
  }, [value]);

  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 20] });
  const trackColor = anim.interpolate({ inputRange: [0, 1], outputRange: [T.toggleOff, T.primary500] });

  return (
    <Pressable
      hitSlop={8}
      onPress={() => {
        Haptics.selectionAsync();
        onChange(!value);
      }}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <Animated.View style={[styles.toggleTrack, { backgroundColor: trackColor }]}>
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX }] }]} />
      </Animated.View>
    </Pressable>
  );
}

function DashedDivider() {
  // Single-side dashed borders are unreliable on iOS; this clips a dashed box to 1px.
  return (
    <View style={styles.dashedClip}>
      <View style={styles.dashedLine} />
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function SettingsScreen() {
  const { logout, isAuthenticated } = useSawari();
  const router = useRouter();
  const params = useLocalSearchParams<{ action?: string }>();

  const [smsEnabled, setSmsEnabled] = useState(true);
  const [whatsappEnabled, setWhatsappEnabled] = useState(true);

  // Profile's "Logout" option opens this screen with ?action=logout
  useEffect(() => {
    if (params.action === 'logout' && isAuthenticated === true) {
      router.setParams({ action: undefined } as any);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      CustomAlert.alert('Logout', 'Are you sure you want to log out?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/');
          },
        },
      ]);
    }
  }, [params.action, isAuthenticated]);

  const handleBack = () => {
    Haptics.selectionAsync();
    if (router.canGoBack()) router.back();
    else router.replace('/');
  };

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    CustomAlert.alert(
      'Delete My Sawari account',
      'This will permanently delete your account, booking history and SawariCash. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', style: 'destructive', onPress: () => router.push('/help') },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity activeOpacity={0.7} style={styles.backBtn} onPress={handleBack} accessibilityLabel="Go back">
            <Feather name="chevron-left" size={22} color={T.neutral800} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Settings</Text>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Recommendations & Reminder */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Recommendations & Reminder</Text>
            <View style={styles.noteCard}>
              <Text style={styles.noteText}>
                *Note: Keep this on to receive offers/coupons and timely reminders based on your interests
              </Text>
              <View style={styles.list}>
                <View style={styles.row}>
                  <Text style={styles.rowTitle} numberOfLines={1}>SMS</Text>
                  <SawariToggle value={smsEnabled} onChange={setSmsEnabled} />
                </View>
                <DashedDivider />
                <View style={styles.row}>
                  <Text style={styles.rowTitle} numberOfLines={1}>Whatsapp</Text>
                  <SawariToggle value={whatsappEnabled} onChange={setWhatsappEnabled} />
                </View>
              </View>
            </View>
          </View>

          {/* Account Deletion */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Account Deletion</Text>
            <TouchableOpacity activeOpacity={0.7} style={styles.deleteCard} onPress={handleDeleteAccount}>
              <Text style={styles.deleteText} numberOfLines={1}>
                Delete My Sawari account
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.white,
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: T.neutral300,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.neutral100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: FONT.semibold,
    fontSize: 17,
    lineHeight: 26,
    color: T.neutral800,
  },

  scrollContent: {
    paddingTop: 8,
    paddingBottom: 40,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  sectionLabel: {
    fontFamily: FONT.medium,
    fontSize: 13,
    lineHeight: 20,
    color: T.neutral500,
  },

  // Note card
  noteCard: {
    backgroundColor: T.surface,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  noteText: {
    fontFamily: FONT.medium,
    fontSize: 13,
    lineHeight: 20,
    color: T.neutral500,
  },

  // Toggle list
  list: {
    backgroundColor: T.white,
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  rowTitle: {
    flex: 1,
    fontFamily: FONT.semibold,
    fontSize: 13,
    lineHeight: 20,
    color: T.neutral800,
  },

  // Account deletion
  deleteCard: {
    backgroundColor: T.redSurface,
    borderWidth: 1,
    borderColor: T.red50,
    borderRadius: 8,
    padding: 12,
  },
  deleteText: {
    fontFamily: FONT.semibold,
    fontSize: 13,
    lineHeight: 20,
    color: T.red600,
  },

  // Dashed divider
  dashedClip: {
    height: 1,
    overflow: 'hidden',
  },
  dashedLine: {
    height: 2,
    borderWidth: 1,
    borderColor: T.border,
    borderStyle: 'dashed',
    borderRadius: 1,
  },

  // Toggle
  toggleTrack: {
    width: 38,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
  },
  toggleThumb: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: T.white,
  },
});