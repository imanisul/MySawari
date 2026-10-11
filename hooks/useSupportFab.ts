import { useCallback, useEffect, useRef, useSyncExternalStore } from 'react';

// A tiny shared switch so a scrolling list can tuck the floating support button
// out of the way without the button and the screen knowing about each other.
let hidden = false;
const listeners = new Set<() => void>();

export function setSupportFabHidden(next: boolean) {
  if (hidden === next) return;
  hidden = next;
  listeners.forEach((l) => l());
}

export function useSupportFabHidden() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
    () => hidden,
    () => false
  );
}

/** Scroll handlers that hide the support button while the user scrolls and bring it back shortly after. */
export function useHideSupportWhileScrolling() {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setSupportFabHidden(false), 450);
  }, []);

  const onScrollBeginDrag = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setSupportFabHidden(true);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
    setSupportFabHidden(false); // never leave it hidden behind us
  }, []);

  return { onScrollBeginDrag, onScrollEndDrag: show, onMomentumScrollEnd: show };
}
