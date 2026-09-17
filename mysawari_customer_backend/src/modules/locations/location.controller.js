const PhotonService = require('../../integrations/photon/photon.service');
const ApiResponse = require('../../common/utils/api-response');
const asyncHandler = require('../../common/utils/async-handler');

class LocationController {
  constructor() {
    this.service = new PhotonService();
  }

  autocomplete = asyncHandler(async (req, res) => {
    // We now use GET /api/locations/search?q=...&lat=...&lon=...
    const { q, lat, lon } = req.query;
    const predictions = await this.service.autocomplete(q, lat, lon);
    return ApiResponse.success(res, { predictions });
  });

  reverse = asyncHandler(async (req, res) => {
    // GET /api/locations/reverse?lat=...&lon=...
    const { lat, lon } = req.query;
    const location = await this.service.reverseGeocode(lat, lon);
    return ApiResponse.success(res, { location });
  });
}

module.exports = LocationController;
