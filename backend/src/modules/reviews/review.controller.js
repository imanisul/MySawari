const reviewService = require('./review.service');
const { sendResponse, sendError } = require('../../utils/response.util'); // I'll assume standard utils exist

class ReviewController {
  async createReview(req, res) {
    try {
      const { carId, rating, text } = req.body;
      const userId = req.user.id; // from requireAuth middleware
      
      if (!carId || !rating || !text) {
        return sendError(res, 400, 'Please provide carId, rating, and text');
      }
      
      const review = await reviewService.createReview(userId, carId, rating, text);
      return sendResponse(res, 201, 'Review submitted successfully', review);
    } catch (error) {
      if (error.message === 'You have already reviewed this vehicle.') {
        return sendError(res, 400, error.message);
      }
      return sendError(res, 500, error.message);
    }
  }

  async getReviewsForCar(req, res) {
    try {
      const { carId } = req.params;
      const reviews = await reviewService.getReviewsForCar(carId);
      return sendResponse(res, 200, 'Reviews fetched successfully', reviews);
    } catch (error) {
      return sendError(res, 500, error.message);
    }
  }
}

module.exports = new ReviewController();
