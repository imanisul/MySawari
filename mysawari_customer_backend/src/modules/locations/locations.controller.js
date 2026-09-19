const googleMapsService = require('../../integrations/google-maps.service');
const ApiResponse = require('../../common/utils/api-response');
const asyncHandler = require('../../common/utils/async-handler');

class LocationsController {
  
  search = asyncHandler(async (req, res) => {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return ApiResponse.success(res, [], 'Search query too short');
    }
    
    const results = await googleMapsService.searchPlaces(q);
    return ApiResponse.success(res, results, 'Places retrieved successfully');
  });

  details = asyncHandler(async (req, res) => {
    const { placeId } = req.query;
    if (!placeId) {
      return ApiResponse.error(res, 'placeId is required', 400);
    }
    
    const details = await googleMapsService.getPlaceDetails(placeId);
    if (!details) {
      return ApiResponse.error(res, 'Could not fetch place details', 404);
    }
    
    return ApiResponse.success(res, details, 'Place details retrieved');
  });
}

module.exports = LocationsController;
