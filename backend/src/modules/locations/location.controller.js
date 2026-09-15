const LocationService = require('./location.service');
const ApiResponse = require('../../common/utils/api-response');
const asyncHandler = require('../../common/utils/async-handler');

class LocationController {
  constructor() {
    this.service = new LocationService();
  }

  autocomplete = asyncHandler(async (req, res) => {
    const { input, regionId, isDestination } = req.body;
    const predictions = await this.service.autocomplete(input, regionId, isDestination);
    return ApiResponse.success(res, { predictions });
  });

  getDetails = asyncHandler(async (req, res) => {
    const { placeId } = req.body;
    const location = await this.service.getDetails(placeId);
    return ApiResponse.success(res, { location });
  });
}

module.exports = LocationController;
