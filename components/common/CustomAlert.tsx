import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, DeviceEventEmitter } from 'react-native';
import { useDetailsPalette } from '@/components/vehicle/details/detailsPalette';
import { ModalBlur } from '@/components/common/ModalBlur';

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertPayload = {
  title: string;
  message?: string;
  buttons?: AlertButton[];
};

const ALERT_EVENT = 'SHOW_CUSTOM_ALERT';

export const CustomAlert = {
  alert: (title: string, message?: string, buttons?: AlertButton[]) => {
    DeviceEventEmitter.emit(ALERT_EVENT, { title, message, buttons });
  },
};

export function CustomAlertProvider() {
  const p = useDetailsPalette();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertPayload | null>(null);

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(ALERT_EVENT, (payload: AlertPayload) => {
      setConfig(payload);
      setVisible(true);
    });
    return () => subscription.remove();
  }, []);

  const close = () => {
    setVisible(false);
    setConfig(null);
  };

  const handlePress = (onPress?: () => void) => {
    close();
    // After the popup has faded, so a screen or system dialog the action opens does not appear over it.
    if (onPress) setTimeout(onPress, 200);
  };

  if (!visible || !config) return null;

  const buttons = config.buttons && config.buttons.length > 0
    ? config.buttons
    : [{ text: 'OK', style: 'default' as const }];
  const hasCancel = buttons.some((b) => b.style === 'cancel');
  const stacked = buttons.length > 2;

  // The app's popup look (same as Early Pickup and "deactivate"): white card, radius 12, navy primary button,
  // light secondary one. The Modal's own fade carries the backdrop (ModalBlur) and the card together.
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={close}
      navigationBarTranslucent
    >
      <View style={styles.overlay}>
        <ModalBlur />
        {hasCancel && <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={close} />}
        <View style={[styles.card, { backgroundColor: p.page }]} accessibilityViewIsModal>
          <Text style={[styles.title, { color: p.fg }]} accessibilityRole="header">{config.title}</Text>

          {!!config.message && <Text style={[styles.message, { color: p.muted }]}>{config.message}</Text>}

          <View style={[styles.buttons, stacked && { flexDirection: 'column' }]}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              return (
                <Pressable
                  key={index}
                  accessibilityRole="button"
                  style={({ pressed }) => [
                    styles.button,
                    { backgroundColor: isCancel ? p.soft : isDestructive ? p.red : p.navy },
                    isCancel && { borderWidth: 1, borderColor: p.segBorder },
                    !stacked && buttons.length > 1 && { flex: 1 },
                    pressed && { opacity: 0.8 },
                  ]}
                  onPress={() => handlePress(btn.onPress)}
                >
                  <Text style={[styles.buttonText, { color: isCancel ? p.fg : '#FFFFFF' }]}>{btn.text}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'transparent', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 18 },
  card: { width: '100%', maxWidth: 357, borderRadius: 12, paddingHorizontal: 12, paddingTop: 20, paddingBottom: 12 },
  title: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 19, lineHeight: 28, textAlign: 'center' },
  message: { fontFamily: 'PlusJakartaSans_500Medium', fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 8, paddingHorizontal: 8 },
  buttons: { flexDirection: 'row', gap: 12, alignSelf: 'stretch', marginTop: 20 },
  button: { height: 47, borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
  buttonText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, lineHeight: 22 },
});
