import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CITIES } from '@/constants/cities';
import { ModalBlur } from '@/components/common/ModalBlur';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';

/** "Select your city": the cities we rent in, the current one ticked. Same popup look as the rest of the app. */
export function CitySheet({ visible, value, onSelect, onClose }: {
  visible: boolean;
  value: string;
  onSelect: (city: string) => void;
  onClose: () => void;
}) {
  const p = useDetailsPalette();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View style={styles.overlay}>
        <ModalBlur />
        <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.card, { backgroundColor: p.page }]} accessibilityViewIsModal>
          <Text style={[styles.title, { color: p.fg }]} accessibilityRole="header">Select your city</Text>
          <View style={[styles.list, { borderColor: p.segBorder }]}>
            {CITIES.map((c, i) => {
              const on = c.name === value;
              return (
                <Pressable
                  key={c.name}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: on }}
                  onPress={() => { onSelect(c.name); onClose(); }}
                  style={[styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: p.segBorder }]}
                >
                  <Feather name="map-pin" size={16} color={p.muted} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.name, { color: p.fg }]}>{c.name}</Text>
                    <Text style={[styles.region, { color: p.muted }]}>{c.region}</Text>
                  </View>
                  {on && <Feather name="check" size={18} color={p.navy} />}
                </Pressable>
              );
            })}
          </View>
          {CITIES.length === 1 && <Text style={[styles.note, { color: p.muted }]}>More cities coming soon.</Text>}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={8} style={[styles.close, { backgroundColor: p.iconBg }]}>
          <Feather name="x" size={18} color={p.sub} />
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18, gap: 8 },
  card: { width: '100%', maxWidth: 357, borderRadius: 12, paddingHorizontal: 12, paddingTop: 20, paddingBottom: 14 },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28, textAlign: 'center' },
  list: { borderWidth: 1, borderRadius: 8, marginTop: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 12, minHeight: 56 },
  name: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, lineHeight: 20 },
  region: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 11, lineHeight: 16 },
  note: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 12 },
  close: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
});
