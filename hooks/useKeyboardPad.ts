import { useEffect, useRef, useState } from 'react';
import { Keyboard, Platform, View } from 'react-native';

/**
 * Bottom padding that lifts a bottom sheet inside a <Modal> above the keyboard, and returns to exactly 0
 * when the keyboard closes. KeyboardAvoidingView left the sheet floating (the page showed underneath) after
 * the keyboard went away on Android. Attach `ref` to the full-screen overlay and add `pad` as its paddingBottom.
 */
export function useKeyboardPad() {
  const ref = useRef<View>(null);
  const [pad, setPad] = useState(0);
  useEffect(() => {
    const ios = Platform.OS === 'ios';
    const show = Keyboard.addListener(ios ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      // How far the keyboard reaches into the overlay (0 when the window itself already resized for it).
      ref.current?.measureInWindow((_x, y, _w, h) => setPad(Math.max(0, y + h - e.endCoordinates.screenY)));
    });
    const hide = Keyboard.addListener(ios ? 'keyboardWillHide' : 'keyboardDidHide', () => setPad(0));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return { ref, pad };
}
