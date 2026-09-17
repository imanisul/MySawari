const PlacesService = require('../../integrations/google-maps/places.service');

const SERVICE_REGIONS = {
  guwahati: { name: "Guwahati", center: { latitude: 26.1445, longitude: 91.7362 }, radius: 50000 },
  shillong: { name: "Shillong", center: { latitude: 25.5788, longitude: 91.8933 }, radius: 30000 },
  jorhat: { name: "Jorhat", center: { latitude: 26.7509, longitude: 94.2037 }, radius: 30000 },
};

class LocationService {
  constructor() {
    this.placesService = new PlacesService();
  }

  async autocomplete(input, regionId, isDestination) {
    if (!input) return [];

    let locationRestriction;
    let locationBias;

    if (!isDestination) {
      const selectedRegion = SERVICE_REGIONS[regionId] || SERVICE_REGIONS["guwahati"];
      locationRestriction = { circle: { center: selectedRegion.center, radius: selectedRegion.radius } };
    } else {
      locationBias = { circle: { center: SERVICE_REGIONS["guwahati"].center, radius: 500000 } };
    }

    return await this.placesService.autocomplete(input, ["in"], locationRestriction, locationBias);
  }

  async getDetails(placeId) {
    return await this.placesService.getDetails(placeId);
  }
}

module.exports = LocationService;
