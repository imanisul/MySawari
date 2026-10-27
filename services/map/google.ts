/**
 * Google Maps Platform for the address screens: place search (Places API New — Autocomplete + Place
 * Details) and the address under the map pin (Geocoding API). Every call throws on any problem (no key,
 * API not enabled, quota, offline) so the screens can fall back to the OpenStreetMap search they used before.
 *
 * Key: EXPO_PUBLIC_GOOGLE_MAPS_API_KEY in .env. In the Google Cloud console enable "Maps JavaScript API",
 * "Places API (New)" and "Geocoding API" for it.
 */

export const GOOGLE_MAPS_KEY = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
export const hasGoogleMaps = GOOGLE_MAPS_KEY.length > 0;

// India's northeast — the area MySawari delivers in. [[south, west], [north, east]]
export const NORTHEAST_BOUNDS: [[number, number], [number, number]] = [[21.9, 88.0], [29.5, 97.5]];

export type GooglePrediction = { placeId: string; name: string; address: string };
export type GooglePlace = { id: string; name: string; address: string; latitude: number; longitude: number };

// Indian states inside the delivery box that MySawari does not serve.
const OUTSIDE_NORTHEAST = /west bengal|bihar|jharkhand|odisha|bangladesh|bhutan|nepal/i;

export const inNortheastBox = (lat: number, lng: number) =>
  lat >= NORTHEAST_BOUNDS[0][0] && lat <= NORTHEAST_BOUNDS[1][0] && lng >= NORTHEAST_BOUNDS[0][1] && lng <= NORTHEAST_BOUNDS[1][1];

/** One token per search → pick, so Google bills the autocomplete requests and the details call as one session. */
export const newSessionToken = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

async function getJson(url: string, init: RequestInit = {}, timeoutMs = 8000) {
  if (!hasGoogleMaps) throw new Error('Google Maps key missing');
  const ctrl = new AbortController();
  const outer = init.signal;
  const onAbort = () => ctrl.abort();
  outer?.addEventListener?.('abort', onAbort);
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...init, signal: ctrl.signal });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.error?.message || `Google responded ${res.status}`);
    return data;
  } finally {
    clearTimeout(timer);
    outer?.removeEventListener?.('abort', onAbort);
  }
}

/** Places typed so far, limited to India's northeast. */
export async function googleAutocomplete(input: string, signal?: AbortSignal, sessionToken?: string): Promise<GooglePrediction[]> {
  const [[s, w], [n, e]] = NORTHEAST_BOUNDS;
  const data = await getJson('https://places.googleapis.com/v1/places:autocomplete', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_MAPS_KEY,
      'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
    },
    body: JSON.stringify({
      input,
      includedRegionCodes: ['in'],
      languageCode: 'en',
      locationRestriction: { rectangle: { low: { latitude: s, longitude: w }, high: { latitude: n, longitude: e } } },
      // Results near Guwahati first.
      origin: { latitude: 26.1445, longitude: 91.7362 },
      ...(sessionToken ? { sessionToken } : {}),
    }),
  });
  return (data.suggestions || [])
    .map((sug: any) => sug.placePrediction)
    .filter(Boolean)
    .map((pp: any) => ({
      placeId: pp.placeId,
      name: pp.structuredFormat?.mainText?.text || pp.text?.text || 'Place',
      address: pp.structuredFormat?.secondaryText?.text || pp.text?.text || '',
    }))
    .filter((pp: GooglePrediction) => !OUTSIDE_NORTHEAST.test(pp.address));
}

/** Name, full address and position of a picked search result. */
export async function googlePlaceDetails(placeId: string, sessionToken?: string): Promise<GooglePlace> {
  const q = sessionToken ? `?sessionToken=${encodeURIComponent(sessionToken)}` : '';
  const data = await getJson(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}${q}`, {
    headers: {
      'X-Goog-Api-Key': GOOGLE_MAPS_KEY,
      'X-Goog-FieldMask': 'id,displayName,formattedAddress,location',
    },
  });
  const lat = data.location?.latitude;
  const lng = data.location?.longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number') throw new Error('Place has no location');
  return {
    id: `g_${data.id || placeId}`,
    name: data.displayName?.text || 'Selected location',
    address: data.formattedAddress || '',
    latitude: lat,
    longitude: lng,
  };
}

/** The address at a map point: a short name (building / street / area) and the full address. */
export async function googleReverseGeocode(lat: number, lng: number): Promise<{ name: string; address: string } | null> {
  const data = await getJson(
    `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=en&key=${GOOGLE_MAPS_KEY}`,
  );
  if (data.status && data.status !== 'OK') {
    if (data.status === 'ZERO_RESULTS') return null;
    throw new Error(data.error_message || data.status);
  }
  const best = (data.results || []).find((r: any) => !(r.types || []).includes('plus_code')) || data.results?.[0];
  if (!best) return null;
  const comp = (type: string) => best.address_components?.find((c: any) => c.types?.includes(type))?.long_name;
  const name = comp('premise') || comp('point_of_interest') || comp('establishment')
    || [comp('street_number'), comp('route')].filter(Boolean).join(' ')
    || comp('sublocality_level_1') || comp('sublocality') || comp('locality') || 'Selected location';
  // Drop the Plus Code some addresses start with ("XXXX+XX, …").
  const address = String(best.formatted_address || '').replace(/^[23456789CFGHJMPQRVWX]{4,8}\+[23456789CFGHJMPQRVWX]{2,3},?\s*/i, '');
  return { name, address };
}