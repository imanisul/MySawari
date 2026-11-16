import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, useWindowDimensions } from 'react-native';
import { ModalBlur } from './ModalBlur';

/**
 * A bottom sheet popup: the blurred, dimmed page fades in where it is (it never slides), and only the sheet rises
 * from the bottom. With Modal's own "slide", the blur and dim travelled up with the sheet, so the whole page looked
 * like it was moving. Children are the sheet's own layout (backdrop press area, sheet); don't add ModalBlur inside.
 */
export function SheetModal({ visible, onRequestClose, children }: {
  visible: boolean;
  onRequestClose?: () => void;
  children: React.ReactNode;
}) {
  const { height } = useWindowDimensions();
  const rise = useRef(new Animated.Value(height)).current;
  useEffect(() => {
    if (!visible) return;
    rise.setValue(height);
    Animated.timing(rise, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [visible, height, rise]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onRequestClose} statusBarTranslucent navigationBarTranslucent>
      <ModalBlur />
      <Animated.View style={{ flex: 1, transform: [{ translateY: rise }] }}>{children}</Animated.View>
    </Modal>
  );
}
