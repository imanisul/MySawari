import * as Location from 'expo-location';

export type PositionFailure = 'denied' | 'services_off' | 'timeout' | 'unavailable';

export type PositionResult =
  | { ok: true; position: Location.LocationObject; fresh: boolean }
  | { ok: false; reason: PositionFailure };

/** Human wording for each failure, so every screen explains it the same way. */
export const POSITION_FAILURE_MESSAGE: Record<PositionFailure, string> = {
  denied: 'Location permission is off. Allow it in Settings to use your current location.',
  services_off: 'Please turn on your phone\'s Location / GPS and try again.',
  timeout: 'Could not get a GPS fix. Move to an open area or search for the address instead.',
  unavailable: 'Could not fetch your location. Please try again or search for the address.',
};

const withTimeout = <T,>(promise: Promise<T>, ms: number): Promise<T> =>
  new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), ms);
    promise.then(
      (v) => { clearTimeout(t); resolve(v); },
      (e) => { clearTimeout(t); reject(e); }
    );
  });

/**
 * Current device position.
 *  - `preferFresh: true`  (default) asks the GPS for a real current fix, falling back to a recent
 *    (< 5 min) last-known one only if the fix takes too long. Use for "my current location".
 *  - `preferFresh: false` returns a recent last-known position immediately (for fast app start).
 */
export async function getDevicePosition(
  { preferFresh = true, timeoutMs = 8000, askPermission = true }: { preferFresh?: boolean; timeoutMs?: number; askPermission?: boolean } = {}
): Promise<PositionResult> {
  try {
    let { status } = await Location.getForegroundPermissionsAsync();
    if (status !== 'granted' && askPermission) {
      status = (await Location.requestForegroundPermissionsAsync()).status;
    }
    if (status !== 'granted') return { ok: false, reason: 'denied' };

    if (!(await Location.hasServicesEnabledAsync())) return { ok: false, reason: 'services_off' };

    if (!preferFresh) {
      const recent = await Location.getLastKnownPositionAsync({ maxAge: 10 * 60 * 1000 });
      if (recent) return { ok: true, position: recent, fresh: false };
    }

    try {
      const position = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        timeoutMs
      );
      return { ok: true, position, fresh: true };
    } catch (e: any) {
      const recent = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 }).catch(() => null);
      if (recent) return { ok: true, position: recent, fresh: false };
      return { ok: false, reason: e?.message === 'timeout' ? 'timeout' : 'unavailable' };
    }
  } catch (e) {
    return { ok: false, reason: 'unavailable' };
  }
}
