import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SheetModal } from '@/components/common/SheetModal';
import * as Haptics from '@/utils/haptics';

export type ChoiceOption = {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  selected?: boolean;
  onPress: () => void;
};

/** App-styled pick-one bottom sheet (same look as the Explore sort sheet): tap an option to choose it and close. */
export function ChoiceSheet({ visible, onClose, title, subtitle, options }: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  options: ChoiceOption[];
}) {
  const insets = useSafeAreaInsets();
  return (
    <SheetModal visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel={`Close ${title}`} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.handle} />
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>{title}</Text>
            {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={onClose} style={styles.close}>
            <Feather name="x" size={16} color="#525252" />
          </Pressable>
        </View>

        {options.map((o) => (
          <Pressable
            key={o.key}
            accessibilityRole="radio"
            accessibilityState={{ checked: !!o.selected }}
            accessibilityLabel={o.subtitle ? `${o.title}. ${o.subtitle}` : o.title}
            onPress={() => { Haptics.selectionAsync(); onClose(); o.onPress(); }}
            style={({ pressed }) => [styles.option, o.selected && styles.optionOn, pressed && { opacity: 0.85 }]}
          >
            <View style={[styles.iconWrap, o.selected && styles.iconWrapOn]}>
              <Feather name={o.icon} size={18} color={o.selected ? '#FFFFFF' : '#6B5AED'} />
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.optTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>{o.title}</Text>
              {!!o.subtitle && <Text style={styles.optSub} numberOfLines={2}>{o.subtitle}</Text>}
            </View>
            <View style={[styles.radio, o.selected ? styles.radioOn : styles.radioOff]}>
              {o.selected && <View style={styles.radioDot} />}
            </View>
          </Pressable>
        ))}

        <Pressable accessibilityRole="button" accessibilityLabel="Cancel" onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && { opacity: 0.7 }]}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </SheetModal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'transparent' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E7EAF4',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: '#E5E5E5', marginBottom: 6 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: 4 },
  title: { color: '#262626', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28 },
  subtitle: { color: '#737373', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12.5, lineHeight: 18, marginTop: 2 },
  close: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F5F5F5', alignItems: 'center', justifyContent: 'center' },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F9F9FB',
    borderColor: '#EAECF1',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  optionOn: { backgroundColor: '#F4F2FE', borderColor: '#6B5AED' },
  iconWrap: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFEDFD', alignItems: 'center', justifyContent: 'center' },
  iconWrapOn: { backgroundColor: '#6B5AED' },
  optTitle: { color: '#262626', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, lineHeight: 20 },
  optSub: { color: '#737373', fontFamily: 'PlusJakartaSans_500Medium', fontSize: 12, lineHeight: 17, marginTop: 2 },
  radio: { alignItems: 'center', borderRadius: 9, borderWidth: 1.5, height: 18, justifyContent: 'center', width: 18 },
  radioOn: { backgroundColor: '#FFFFFF', borderColor: '#6B5AED' },
  radioOff: { backgroundColor: '#FFFFFF', borderColor: '#BFC3D4' },
  cancel: { height: 50, borderRadius: 12, borderWidth: 1, borderColor: '#D4D4D4', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  cancelText: { color: '#262626', fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22 },
  radioDot: { backgroundColor: '#6B5AED', borderRadius: 4, height: 8, width: 8 },
});
