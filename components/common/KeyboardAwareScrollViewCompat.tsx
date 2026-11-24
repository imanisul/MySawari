import { useEffect, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, NativeScrollEvent, NativeSyntheticEvent, Platform, ScrollView, ScrollViewProps, TextInput } from 'react-native';

export function KeyboardAwareScrollViewCompat({
  children,
  keyboardShouldPersistTaps = 'handled',
  ...props
}: ScrollViewProps) {
  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        {...props}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * Keeps the focused text box above the keyboard inside a ScrollView, on iPhone and Android.
 * Pair it with <KeyboardAvoidingView behavior="padding"> on BOTH platforms: Android is edge-to-edge (Expo 57),
 * so the window no longer shrinks for the keyboard and `behavior={undefined}` left fields hidden.
 * Spread `scrollProps` on the ScrollView and pass `onFocus` to each TextInput. `keyboardUp` lets a screen
 * hide a tall bottom bar while typing.
 */
export function useKeyboardScroll() {
  const ref = useRef<ScrollView>(null);
  const offset = useRef(0);
  const kbTop = useRef<number | null>(null);
  const [keyboardUp, setKeyboardUp] = useState(false);

  const reveal = () => {
    // Wait for KeyboardAvoidingView (and any hidden bottom bar) to re-lay out first.
    setTimeout(() => {
      const input: any = TextInput.State.currentlyFocusedInput?.();
      const scroll: any = ref.current;
      if (!input?.measureInWindow || !scroll?.measureInWindow || kbTop.current == null) return;
      scroll.measureInWindow((_sx: number, sy: number, _sw: number, sh: number) => {
        input.measureInWindow((_x: number, y: number, _w: number, h: number) => {
          const visibleBottom = Math.min(sy + sh, kbTop.current ?? sy + sh);
          const below = y + h + 24 - visibleBottom;
          const above = sy + 12 - y;
          if (below > 0) ref.current?.scrollTo({ y: offset.current + below, animated: true });
          else if (above > 0) ref.current?.scrollTo({ y: Math.max(0, offset.current - above), animated: true });
        });
      });
    }, Platform.OS === 'ios' ? 60 : 180);
  };

  useEffect(() => {
    const show = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) => {
      kbTop.current = e.endCoordinates.screenY;
      setKeyboardUp(true);
      reveal();
    });
    const hide = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () => {
      kbTop.current = null;
      setKeyboardUp(false);
    });
    return () => { show.remove(); hide.remove(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    keyboardUp,
    // Moving between boxes while the keyboard is already open fires no keyboard event, so focus reveals too.
    onFocus: () => { if (kbTop.current != null) reveal(); },
    scrollProps: {
      ref,
      scrollEventThrottle: 16,
      keyboardShouldPersistTaps: 'handled' as const,
      onScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => { offset.current = e.nativeEvent.contentOffset.y; },
    },
  };
}
