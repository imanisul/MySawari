import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

export type SortKey = 'recommended' | 'price_asc' | 'price_desc' | 'rating';

export const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'recommended', label: 'Recommended' },
  { key: 'price_asc', label: 'Price: Low to High' },
  { key: 'price_desc', label: 'Price: High to Low' },
  { key: 'rating', label: 'Rating: Highest' },
];

/** Figma sort sheet from the Explore sliders button: radio options, Clear, and Apply. */
export function SortSheet({
  visible,
  onClose,
  value,
  onApply,
}: {
  visible: boolean;
  onClose: () => void;
  value: SortKey;
  onApply: (key: SortKey) => void;
}) {
  const insets = useSafeAreaInsets();
  // Local choice: nothing changes on the Explore list until Apply.
  const [selected, setSelected] = useState<SortKey>(value);
  useEffect(() => {
    if (visible) setSelected(value);
  }, [visible, value]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close sort" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Filter</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Clear sort" hitSlop={8} onPress={() => setSelected('recommended')}>
            <Text style={styles.clear}>Clear</Text>
          </Pressable>
        </View>

        <View style={styles.card}>
          {SORT_OPTIONS.map((opt, i) => {
            const on = selected === opt.key;
            return (
              <React.Fragment key={opt.key}>
                {i > 0 && <View style={styles.dash} />}
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setSelected(opt.key);
                  }}
                  style={styles.row}
                >
                  <Text style={styles.rowLabel}>{opt.label}</Text>
                  <View style={[styles.radio, on ? styles.radioOn : styles.radioOff]}>
                    {on && <View style={styles.radioDot} />}
                  </View>
                </Pressable>
              </React.Fragment>
            );
          })}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Apply sort"
          onPress={() => {
            onApply(selected);
            onClose();
          }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>Apply</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(38,38,38,0.32)' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E7EAF4',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    gap: 16,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  title: { color: '#262626', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28 },
  clear: { color: '#EF4444', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, lineHeight: 20 },
  card: {
    backgroundColor: '#F9F9FB',
    borderColor: '#EAECF1',
    borderRadius: 10,
    borderWidth: 1,
    gap: 12,
    padding: 12,
  },
  row: { alignItems: 'center', flexDirection: 'row', height: 20, justifyContent: 'space-between' },
  rowLabel: { color: '#262626', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20 },
  dash: { borderColor: '#EAECF1', borderStyle: 'dashed', borderTopWidth: 1, height: 0 },
  radio: { alignItems: 'center', borderRadius: 8, borderWidth: 1, height: 16, justifyContent: 'center', width: 16 },
  radioOn: { backgroundColor: '#FFFFFF', borderColor: '#2F3E75' },
  radioOff: { backgroundColor: '#FFFFFF', borderColor: '#BFC3D4' },
  radioDot: { backgroundColor: '#2F3E75', borderRadius: 2, height: 4, width: 4 },
  cta: { alignItems: 'center', backgroundColor: '#2F3E75', borderRadius: 12, height: 54, justifyContent: 'center' },
  ctaText: { color: '#FFFFFF', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 17, lineHeight: 26 },
});
