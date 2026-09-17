const AppError = require('../../common/errors/app-error');

class PlacesService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
  }

  async autocomplete(input, includedRegionCodes, locationRestriction, locationBias) {
    if (!this.apiKey || this.apiKey === 'your_google_maps_api_key_here') {
      return [
        {
          place_id: "mock_place_1",
          description: `[MOCK] ${input}`,
          structured_formatting: { main_text: `[MOCK] ${input}`, secondary_text: "Assam, India" }
        }
      ];
    }

    try {
      const body = { input, includedRegionCodes };
      if (locationRestriction) body.locationRestriction = locationRestriction;
      if (locationBias) body.locationBias = locationBias;

      const response = await fetch("https://places.googleapis.com/v1/places:autocomplete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": this.apiKey,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      return (data.suggestions || []).map(s => {
        const p = s.placePrediction;
        return {
          place_id: p.placeId,
          description: p.text.text,
          structured_formatting: {
            main_text: p.structuredFormat.mainText.text,
            secondary_text: p.structuredFormat.secondaryText ? p.structuredFormat.secondaryText.text : ''
          }
        };
      });
    } catch (err) {
      console.error(err);
      throw new AppError('Failed to fetch from Google Places', 500);
    }
  }

  async getDetails(placeId) {
    if (!this.apiKey || this.apiKey === 'your_google_maps_api_key_here') {
      return { latitude: 26.1445 + Math.random() * 0.1, longitude: 91.7362 + Math.random() * 0.1 };
    }

    try {
      const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}?fields=location`, {
        method: "GET",
        headers: { "X-Goog-Api-Key": this.apiKey }
      });
      const data = await response.json();
      return data.location;
    } catch (err) {
      console.error(err);
      throw new AppError('Failed to fetch place details', 500);
    }
  }
}

module.exports = PlacesService;
