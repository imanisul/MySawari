const axios = require('axios');

class GoogleMapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY || '';
  }

  /**
   * Search for places using Google Places Autocomplete API.
   * Biased towards India (in, specifically Assam/Northeast if possible by lat/lng).
   * @param {string} query 
   */
  async searchPlaces(query) {
    if (!this.apiKey) {
      console.warn('GOOGLE_MAPS_API_KEY is missing. Returning empty results.');
      return [];
    }

    try {
      // Guwahati roughly centers around 26.1445° N, 91.7362° E
      // We pass components=country:in to restrict to India.
      // We can also bias towards Guwahati using location and radius.
      const location = '26.1445,91.7362';
      const radius = '50000'; // 50km radius around Guwahati as a bias

      const endpoint = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&components=country:in&location=${location}&radius=${radius}&key=${this.apiKey}`;
      
      const response = await axios.get(endpoint);
      return response.data.predictions || [];
    } catch (error) {
      console.error('Google Maps Search API Error:', error.response?.data || error.message);
      return [];
    }
  }

  /**
   * Get exact latitude and longitude for a specific Place ID.
   * @param {string} placeId 
   */
  async getPlaceDetails(placeId) {
    if (!this.apiKey) return null;

    try {
      const endpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,name,formatted_address&key=${this.apiKey}`;
      const response = await axios.get(endpoint);
      
      if (response.data.result) {
        return {
          lat: response.data.result.geometry.location.lat,
          lng: response.data.result.geometry.location.lng,
          name: response.data.result.name,
          address: response.data.result.formatted_address,
        };
      }
      return null;
    } catch (error) {
      console.error('Google Maps Details API Error:', error.response?.data || error.message);
      return null;
    }
  }
}

module.exports = new GoogleMapsService();
