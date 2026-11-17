import { useEffect, useState } from 'react';
import { useNavigation } from 'expo-router';

/**
 * False while this page is sliding in, true once the slide has finished. Heavy pages render their light skeleton
 * until then, so the slide itself has nothing to wait for and runs smoothly, then the real content appears.
 * (InteractionManager.runAfterInteractions is a no-op stub in React Native 0.86 — it fires at once, mid-slide.)
 * `maxWaitMs` covers a page with no slide (opened first) or a missed event.
 */
export function useAfterSlideIn(maxWaitMs = 450): boolean {
  const navigation = useNavigation();
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (done) return;
    const unsubscribe = navigation.addListener('transitionEnd' as any, (e: any) => {
      if (!e?.data?.closing) setDone(true);
    });
    const timer = setTimeout(() => setDone(true), maxWaitMs);
    return () => { unsubscribe(); clearTimeout(timer); };
  }, [navigation, done, maxWaitMs]);
  return done;
}
