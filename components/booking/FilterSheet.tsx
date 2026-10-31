import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';
import { Category } from '@/utils/sawari';
import { ModalBlur } from '@/components/common/ModalBlur';

export type FilterState = {
  category: Category | string;
  maxPrice: number;
  transmission: 'All' | 'Automatic' | 'Manual' | 'Gear' | 'Gearless';
  fuel: 'All' | 'Petrol' | 'Diesel' | 'EV';
};

export const defaultFilters: FilterState = {
  category: 'All',
  maxPrice: 10000,
  transmission: 'All',
  fuel: 'All',
};

export function FilterSheet({
  visible,
  onClose,
  filters,
  setFilters,
  vehicleType,
}: {
  visible: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  vehicleType?: 'All' | 'Cars' | 'Bikes';
}) {
  const colors = useColors();

  // The scrim fades in behind the sheet; the sheet slides up from the bottom and slides back down on close.
  const SHEET_OFFSET = 600;
  const slide = useRef(new Animated.Value(SHEET_OFFSET)).current;
  useEffect(() => {
    if (visible) {
      Animated.timing(slide, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    } else {
      slide.setValue(SHEET_OFFSET);
    }
  }, [visible, slide]);
  const close = () => {
    Animated.timing(slide, { toValue: SHEET_OFFSET, duration: 200, useNativeDriver: true }).start(() => onClose());
  };
  
  const isBike = vehicleType === 'Bikes';
  const categories = isBike 
    ? ['All', 'Scooter', 'Cruiser', 'Sports', 'Standard']
    : ['All', 'SUV', 'Sedan', 'Hatchback', 'MUV', 'Luxury', 'Off-road'];
    
  const transmissions = isBike
    ? ['All', 'Gear', 'Gearless']
    : ['All', 'Automatic', 'Manual'];
    
  const fuels = isBike
    ? ['All', 'Petrol', 'EV']
    : ['All', 'Petrol', 'Diesel', 'EV'];
  
  // Local state for the modal
  const [localFilters, setLocalFilters] = React.useState<FilterState>(filters);

  // Sync local filters when sheet opens
  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const handleApply = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setFilters(localFilters);
    close();
  };

  const handleReset = () => {
    Haptics.selectionAsync();
    setLocalFilters(defaultFilters);
  };

  return (
    // Figma Filter sheet: a bottom sheet with a round close button above it (not a full page).
    <Modal visible={visible} transparent animationType="fade" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
      <ModalBlur />
      <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Close filters" />
      <Animated.View style={[styles.stack, { transform: [{ translateY: slide }] }]} pointerEvents="box-none">
        <View style={styles.closeRow}>
          <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="Close filters" style={styles.closeCircle}>
            <Feather name="x" size={16} color="#737373" />
          </Pressable>
        </View>
        <SafeAreaView style={[styles.sheet, { backgroundColor: '#FFFFFF' }]}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={handleReset} style={styles.resetBtn}>
              <Text style={[styles.resetText, { color: colors.primaryText }]}>Reset</Text>
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Filters</Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

            {/* CATEGORY */}
            {!isBike && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Category</Text>
                <View style={styles.chipRow}>
                  {categories.map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => {
                        Haptics.selectionAsync();
                        setLocalFilters(prev => ({ ...prev, category: cat }));
                      }}
                      style={[
                        styles.chip,
                        { 
                          backgroundColor: localFilters.category === cat ? colors.foreground : colors.card, 
                          borderColor: localFilters.category === cat ? colors.foreground : colors.border 
                        }
                      ]}
                    >
                      <Text style={[styles.chipText, { color: localFilters.category === cat ? colors.background : colors.foreground }]}>{cat}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* PRICE */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Budget per day</Text>
              <View style={styles.chipRow}>
                {(isBike 
                  ? [{ label: 'Any Price', val: 10000 }, { label: 'Under ₹500', val: 500 }, { label: 'Under ₹1000', val: 1000 }, { label: 'Under ₹1500', val: 1500 }]
                  : [{ label: 'Any Price', val: 10000 }, { label: 'Under ₹1500', val: 1500 }, { label: 'Under ₹2000', val: 2000 }, { label: 'Under ₹3000', val: 3000 }, { label: 'Under ₹5000', val: 5000 }]
                ).map((price) => (
                  <Pressable
                    key={price.label}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setLocalFilters(prev => ({ ...prev, maxPrice: price.val }));
                    }}
                    style={[
                      styles.chip,
                      { backgroundColor: localFilters.maxPrice === price.val ? colors.foreground : colors.card, borderColor: localFilters.maxPrice === price.val ? colors.foreground : colors.border }
                    ]}
                  >
                    <Text style={[styles.chipText, { color: localFilters.maxPrice === price.val ? colors.background : colors.foreground }]}>{price.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* TRANSMISSION */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Transmission</Text>
              <View style={styles.chipRow}>
                {transmissions.map((trans) => (
                  <Pressable
                    key={trans}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setLocalFilters(prev => ({ ...prev, transmission: trans as any }));
                    }}
                    style={[
                      styles.chip,
                      { backgroundColor: localFilters.transmission === trans ? colors.foreground : colors.card, borderColor: localFilters.transmission === trans ? colors.foreground : colors.border }
                    ]}
                  >
                    <Text style={[styles.chipText, { color: localFilters.transmission === trans ? colors.background : colors.foreground }]}>{trans}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* FUEL TYPE */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Fuel Type</Text>
              <View style={styles.chipRow}>
                {fuels.map((f) => (
                  <Pressable
                    key={f}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setLocalFilters(prev => ({ ...prev, fuel: f as any }));
                    }}
                    style={[
                      styles.chip,
                      { backgroundColor: localFilters.fuel === f ? colors.foreground : colors.card, borderColor: localFilters.fuel === f ? colors.foreground : colors.border }
                    ]}
                  >
                    <Text style={[styles.chipText, { color: localFilters.fuel === f ? colors.background : colors.foreground }]}>{f}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
            
            <View style={{ height: 40 }} />
          </ScrollView>

          <View style={[styles.footer, { borderTopColor: colors.border, backgroundColor: colors.background }]}>
            {/* Figma CTA: 361 x 54, Primary/blue-500, 12px radius, white Semibold 17. */}
            <Pressable accessibilityRole="button" onPress={handleApply} style={styles.applyBtn}>
              <Text style={styles.applyText}>Apply Filters</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'transparent' },
  // The sheet sits 34px above the screen bottom (the home-indicator strip), as in the frame.
  stack: { gap: 8, justifyContent: 'flex-end', paddingBottom: 34 },
  closeRow: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 12 },
  closeCircle: { alignItems: 'center', backgroundColor: '#FAFAFA', borderRadius: 30, height: 32, justifyContent: 'center', width: 32 },
  // Figma sheet: 574 tall, white, 1px #E7EAF4 border on all sides, 24px top corners, 4px top padding.
  sheet: { borderColor: '#E7EAF4', borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, height: 574, maxHeight: '90%', overflow: 'hidden', paddingTop: 4 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    position: 'relative',
  },
  headerTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 18 },
  closeBtn: { position: 'absolute', right: 20, padding: 4 },
  resetBtn: { position: 'absolute', left: 20, padding: 4 },
  resetText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  content: { padding: 20, flex: 1 },
  section: { marginBottom: 32 },
  sectionTitle: { fontFamily: 'Inter_600SemiBold', fontSize: 16, marginBottom: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipText: { fontFamily: 'Inter_500Medium', fontSize: 14 },
  applyBtn: { alignItems: 'center', backgroundColor: '#2F3E75', borderRadius: 12, height: 54, justifyContent: 'center', width: '100%' },
  applyText: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 26 },
  footer: {
    padding: 16,
    borderTopWidth: 1,
  }
});
