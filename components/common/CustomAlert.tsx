import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  DeviceEventEmitter,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const colors = useColors();
  const [visible, setVisible] = useState(false);
  const [config, setConfig] = useState<AlertPayload | null>(null);
  const fadeAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const subscription = DeviceEventEmitter.addListener(ALERT_EVENT, (payload: AlertPayload) => {
      setConfig(payload);
      setVisible(true);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });

    return () => subscription.remove();
  }, []);

  const close = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setVisible(false);
      setConfig(null);
    });
  };

  const handlePress = (onPress?: () => void) => {
    close();
    if (onPress) {
      setTimeout(() => {
        onPress();
      }, 200);
    }
  };

  if (!visible || !config) return null;

  const buttons = config.buttons && config.buttons.length > 0
    ? config.buttons
    : [{ text: 'OK', style: 'default' as const }];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={close}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 165, 0, 0.1)' }]}>
              <Feather name="bell" size={26} color="#FFA500" />
            </View>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>{config.title}</Text>
          
          {config.message && (
            <Text style={[styles.message, { color: colors.mutedForeground }]}>
              {config.message}
            </Text>
          )}

          <View style={styles.buttonContainer}>
            {buttons.map((btn, index) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              
              return (
                <Pressable
                  key={index}
                  style={({ pressed }) => [
                    styles.button,
                    isCancel ? { backgroundColor: colors.muted } : 
                    isDestructive ? { backgroundColor: colors.destructive } :
                    { backgroundColor: colors.primary },
                    pressed && { opacity: 0.8 },
                    buttons.length > 1 && { flex: 1 },
                    index > 0 && { marginLeft: 12 }
                  ]}
                  onPress={() => handlePress(btn.onPress)}
                >
                  <Text style={[
                    styles.buttonText,
                    isCancel ? { color: colors.foreground } : { color: '#FFF' }
                  ]}>
                    {btn.text}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: Math.min(SCREEN_WIDTH - 48, 360),
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Inter_700Bold',
    fontSize: 20,
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    width: '100%',
  },
  button: {
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  buttonText: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 16,
  },
});
