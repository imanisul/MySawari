const LRU_CACHE_MAX_SIZE = 1000;
const LRU_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

class PhotonService {
  constructor() {
    this.baseUrl = process.env.PHOTON_BASE_URL || 'https://photon.komoot.io';
    this.cache = new Map();
  }

  // Basic LRU caching mechanism
  _getCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;
    if (Date.now() > cached.expiry) {
      this.cache.delete(key);
      return null;
    }
    // Refresh position in LRU
    this.cache.delete(key);
    this.cache.set(key, cached);
    return cached.data;
  }

  _setCache(key, data) {
    if (this.cache.size >= LRU_CACHE_MAX_SIZE) {
      // Remove oldest entry (first item)
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, expiry: Date.now() + LRU_CACHE_TTL_MS });
  }

  _formatAddress(properties) {
    const parts = [];
    if (properties.name) parts.push(properties.name);
    if (properties.street) parts.push(properties.street);
    if (properties.district && properties.district !== properties.name) parts.push(properties.district);
    if (properties.city) parts.push(properties.city);
    if (properties.state) parts.push(properties.state);
    
    // Fallbacks
    if (parts.length === 0) {
      if (properties.country) parts.push(properties.country);
      else return 'Unknown Location';
    }
    
    return parts.join(', ');
  }

  _mapPhotonResponse(data) {
    if (!data || !data.features) return [];
    return data.features.map(feature => ({
      id: feature.properties.osm_id?.toString() || `osm_${Math.random()}`,
      name: feature.properties.name || feature.properties.street || feature.properties.city || 'Unknown Place',
      address: this._formatAddress(feature.properties),
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
      postcode: feature.properties.postcode || null,
      country: feature.properties.country || null
    }));
  }

  async autocomplete(query, lat, lon) {
    if (!query || query.trim().length < 2) return [];

    const normalizedQuery = query.trim().toLowerCase();
    const cacheKey = `search:${normalizedQuery}:${lat || 'none'}:${lon || 'none'}`;
    
    const cachedResult = this._getCache(cacheKey);
    if (cachedResult) return cachedResult;

    try {
      const url = new URL(`${this.baseUrl}/api/`);
      url.searchParams.append('q', normalizedQuery);
      url.searchParams.append('limit', '8');
      
      // Location bias if provided
      if (lat && lon) {
        url.searchParams.append('lat', lat.toString());
        url.searchParams.append('lon', lon.toString());
      }

      const response = await fetch(url.toString(), {
        headers: { 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(5000) // 5s timeout
      });

      if (!response.ok) {
        throw new Error(`Photon API responded with status ${response.status}`);
      }

      const data = await response.json();
      const mappedData = this._mapPhotonResponse(data);
      
      this._setCache(cacheKey, mappedData);
      return mappedData;
    } catch (error) {
      console.error('Photon autocomplete error:', error.message);
      return []; // Return empty array on failure instead of crashing
    }
  }

  async reverseGeocode(lat, lon) {
    if (!lat || !lon) return null;

    const cacheKey = `reverse:${lat},${lon}`;
    const cachedResult = this._getCache(cacheKey);
    if (cachedResult) return cachedResult;

    try {
      const url = new URL(`${this.baseUrl}/reverse`);
      url.searchParams.append('lat', lat.toString());
      url.searchParams.append('lon', lon.toString());

      const response = await fetch(url.toString(), {
        headers: { 'Accept-Language': 'en' },
        signal: AbortSignal.timeout(5000)
      });

      if (!response.ok) {
        throw new Error(`Photon API responded with status ${response.status}`);
      }

      const data = await response.json();
      const mappedData = this._mapPhotonResponse(data);
      
      if (mappedData.length > 0) {
        this._setCache(cacheKey, mappedData[0]);
        return mappedData[0];
      }
      return null;
    } catch (error) {
      console.error('Photon reverse geocode error:', error.message);
      return null;
    }
  }
}

module.exports = PhotonService;
