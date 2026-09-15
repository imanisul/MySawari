import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import * as Haptics from 'expo-haptics';
import { PrimaryButton } from '../common/PrimaryButton';
import { Category } from '@/utils/sawari';

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
    onClose();
  };

  const handleReset = () => {
    Haptics.selectionAsync();
    setLocalFilters(defaultFilters);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={{ flex: 1 }}>
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Filters</Text>
            <Pressable onPress={handleReset} style={styles.resetBtn}>
              <Text style={[styles.resetText, { color: colors.primary }]}>Reset</Text>
            </Pressable>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={24} color={colors.foreground} />
            </Pressable>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* CATEGORY */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Category</Text>
              <View style={styles.chipRow}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat}
                    onPress={() => {
                      Haptics.selectionAsync();
                      setLocalFilters(prev => ({ ...prev, category: cat as Category }));
                    }}
                    style={[
                      styles.chip,
                      { backgroundColor: localFilters.category === cat ? colors.foreground : colors.card, borderColor: localFilters.category === cat ? colors.foreground : colors.border }
                    ]}
                  >
                    <Text style={[styles.chipText, { color: localFilters.category === cat ? colors.background : colors.foreground }]}>{cat}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* PRICE */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Max Price per day</Text>
              <View style={styles.chipRow}>
                {[{ label: 'Any Price', val: 10000 }, { label: 'Under ₹1500', val: 1500 }, { label: 'Under ₹2500', val: 2500 }, { label: 'Under ₹4000', val: 4000 }].map((price) => (
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
            <PrimaryButton label="Apply Filters" onPress={handleApply} />
          </View>
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  footer: {
    padding: 20,
    borderTopWidth: 1,
  }
});
