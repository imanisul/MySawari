import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Animated, PanResponder } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { LocationResult } from '@/utils/sawari';
import type { SavedAddress } from '@/utils/savedAddresses';
import { useDetailsPalette } from './detailsPalette';

// Most-used delivery points (coordinates as in components/booking/LocationSheet.tsx — pricing measures
// the ₹/km charge from them).
export const TOP_LOCATIONS: (LocationResult & { label: string })[] = [
  {
    id: 'pk_gau_airport',
    label: 'Airport',
    name: 'Lokpriya Gopinath Bordoloi International Airport',
    address: 'Borjhar, Mirzapur, Guwahati, Assam 781015, India',
    latitude: 26.1061,
    longitude: 91.5859,
    source: 'osm',
  },
  {
    id: 'pk_gau_rly',
    label: 'Railway Station',
    name: 'Guwahati Railway Station',
    address: 'Mawhati, Paltan Bazaar, Guwahati, Assam 781008, India',
    latitude: 26.182,
    longitude: 91.7511,
    source: 'osm',
  },
];

/**
 * "Select pickup / drop-off location" sheet from the car details Delivery & Pickup card. Shows the
 * customer's saved addresses when they have any, otherwise the top locations. "Add Address", or sliding
 * the sheet up, opens the full-screen search page; sliding it down closes it.
 */
export function AddressPickerSheet({ visible, kind, saved, onClose, onPick, onAddAddress }: {
  visible: boolean;
  kind: 'pickup' | 'return';
  saved: SavedAddress[];
  onClose: () => void;
  onPick: (loc: LocationResult, label?: string) => void;
  onAddAddress: () => void;
}) {
  const p = useDetailsPalette();
  const insets = useSafeAreaInsets();
  const hasSaved = saved.length > 0;
  const items: (LocationResult & { label?: string })[] = hasSaved ? saved : TOP_LOCATIONS;

  // The sheet follows the finger; released far enough up it opens the search page, down it closes.
  const dragY = useRef(new Animated.Value(0)).current;
  const actions = useRef({ onClose, onAddAddress });
  actions.current = { onClose, onAddAddress };
  useEffect(() => { if (visible) dragY.setValue(0); }, [visible]);
  const pan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8 && Math.abs(g.dy) > Math.abs(g.dx),
    onPanResponderMove: (_, g) => dragY.setValue(g.dy < 0 ? g.dy * 0.35 : g.dy),
    onPanResponderRelease: (_, g) => {
      if (g.dy < -50 || g.vy < -0.5) {
        Haptics.selectionAsync();
        Animated.timing(dragY, { toValue: 0, duration: 120, useNativeDriver: true }).start();
        actions.current.onAddAddress();
      } else if (g.dy > 90 || g.vy > 0.8) {
        Animated.timing(dragY, { toValue: 600, duration: 180, useNativeDriver: true }).start(() => actions.current.onClose());
      } else {
        Animated.spring(dragY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
      }
    },
    onPanResponderTerminate: () => Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start(),
  })).current;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      <BlurView intensity={18} tint="default" style={StyleSheet.absoluteFill}>
        <Pressable accessibilityLabel="Close" style={[StyleSheet.absoluteFill, styles.dim]} onPress={onClose} />
      </BlurView>

      <Animated.View
        {...pan.panHandlers}
        style={[styles.sheet, { backgroundColor: p.page, borderColor: p.deliveryBorder, paddingBottom: Math.max(insets.bottom, 16) + 12, transform: [{ translateY: dragY }] }]}
      >
        <View style={[styles.grabber, { backgroundColor: p.segBorder }]} />
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={12} style={styles.close}>
          <Feather name="x" size={14} color={p.muted} />
        </Pressable>

        <Text style={[styles.title, { color: p.fg }]}>{kind === 'pickup' ? 'Select pickup location' : 'Select drop-off location'}</Text>
        <Text style={[styles.sub, { color: p.muted }]}>{hasSaved ? 'Saved Locations' : 'Top Most Locations'}</Text>

        <View style={{ gap: 8 }}>
          {items.map((loc) => (
            <Pressable
              key={loc.id}
              accessibilityRole="button"
              accessibilityLabel={`${loc.name}, ${loc.address}`}
              onPress={() => { Haptics.selectionAsync(); onPick(loc, loc.label); }}
              style={({ pressed }) => [styles.row, { backgroundColor: p.soft, borderColor: p.segBorder }, pressed && { opacity: 0.8 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowName, { color: p.fg }]} numberOfLines={1}>{loc.label ? `${loc.label} - ${loc.name}` : loc.name}</Text>
                <Text style={[styles.rowAddr, { color: p.muted }]} numberOfLines={1}>{loc.address}</Text>
              </View>
              <Feather name="chevron-right" size={20} color={p.muted} />
            </Pressable>
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => { Haptics.selectionAsync(); onAddAddress(); }}
          style={({ pressed }) => [styles.button, { backgroundColor: p.navy }, pressed && { opacity: 0.85 }]}
        >
          <Text style={[styles.buttonText, { color: p.onNavy }]}>Add Address</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  dim: { backgroundColor: 'rgba(0,0,0,0.27)' },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 28,
  },
  grabber: { position: 'absolute', top: 8, alignSelf: 'center', width: 36, height: 4, borderRadius: 2 },
  close: { position: 'absolute', top: 16, right: 16, padding: 2 },
  title: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 18 },
  sub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 10.5, marginTop: 20, marginBottom: 10 },
  row: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 8, paddingLeft: 11, paddingRight: 6, paddingVertical: 11 },
  rowName: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13 },
  rowAddr: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, marginTop: 4 },
  button: { height: 53, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginTop: 17 },
  buttonText: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 17 },
});
