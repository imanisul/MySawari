import { useEffect, useRef, useState } from 'react';
import { API } from '@/services/backend/api';
import type { LocationResult } from '@/utils/sawari';
import { hasGoogleMaps, googleAutocomplete, googlePlaceDetails, newSessionToken, inNortheastBox } from '@/services/maps/google';

/** A saved / top place or an OSM result has its position; a Google result gets it when picked (placeId). */
export type SearchPlace = LocationResult & { label?: string; placeId?: string };

const NE_STATES = /assam|meghalaya|arunachal|nagaland|manipur|mizoram|tripura|sikkim/i;
/** Inside India's northeast: by the state the geocoder returns, else by the address text. */
export function isInNortheast(f: { country?: string | null; state?: string | null; address?: string }) {
  if (f.country && !/india|भारत|ভাৰত|ভারত/i.test(f.country)) return false;
  return NE_STATES.test(f.state || '') || NE_STATES.test(f.address || '');
}

/**
 * Address search shared by the search page and the map page: Google Places autocomplete as you type
 * (debounced, a newer query cancels the older one), falling back to the app's search (Google Text Search,
 * then OpenStreetMap) — always limited to the northeast where MySawari delivers.
 * `resolve` gives a picked result its exact position (Place Details for a Google result).
 */
export function usePlaceSearch(query: string) {
  const [results, setResults] = useState<SearchPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const session = useRef(newSessionToken());

  useEffect(() => {
    const q = query.trim();
    setFailed(false);
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        if (hasGoogleMaps) {
          try {
            const g = await googleAutocomplete(q, ctrl.signal, session.current);
            if (ctrl.signal.aborted) return;
            if (g.length > 0) {
              setResults(g.map((r) => ({ id: `g_${r.placeId}`, placeId: r.placeId, name: r.name, address: r.address, latitude: NaN, longitude: NaN, source: 'osm' as const })));
              return;
            }
          } catch (e) {
            if (ctrl.signal.aborted) return;
            if (__DEV__) console.log('Google autocomplete failed, using backup search:', (e as any)?.message);
          }
        }
        const found = await API.searchLocations(q, 'guwahati', false, ctrl.signal, { restrictToServiceArea: true });
        if (ctrl.signal.aborted) return;
        setResults(found.filter(isInNortheast).map((f: any) => ({
          id: String(f.id), name: f.name, address: f.address, latitude: f.latitude, longitude: f.longitude, source: 'osm' as const,
        })));
      } catch {
        if (ctrl.signal.aborted) return;
        setFailed(true);
        setResults([]);
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }, 300);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query]);

  /** The picked place with its exact position. Throws 'outside' when it's outside the delivery area. */
  const resolve = async (place: SearchPlace): Promise<SearchPlace> => {
    let target = place;
    if (place.placeId) {
      const d = await googlePlaceDetails(place.placeId, session.current);
      session.current = newSessionToken(); // the session ends with the details call
      target = { ...place, id: d.id, name: d.name || place.name, address: d.address || place.address, latitude: d.latitude, longitude: d.longitude };
    }
    if (!Number.isFinite(target.latitude) || !Number.isFinite(target.longitude)) throw new Error('no-position');
    if (!inNortheastBox(target.latitude, target.longitude)) throw new Error('outside');
    return target;
  };

  return { results, loading, failed, resolve };
}