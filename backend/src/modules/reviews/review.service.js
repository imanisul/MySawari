const Review = require('../../models/review.model');
const User = require('../../models/user.model');
const mongoose = require('mongoose');

class ReviewService {
  /**
   * Create a new review
   */
  async createReview(userId, carId, rating, text) {
    try {
      // Check if user already reviewed this car (optional business logic)
      const existing = await Review.findOne({ user: userId, carId });
      if (existing) {
        throw new Error('You have already reviewed this vehicle.');
      }

      // Check if user has bookings for this car to mark as verified (simplified for now)
      const isVerified = true; // In a real app, check booking history

      const review = new Review({
        user: userId,
        carId,
        rating,
        text,
        isVerified
      });

      await review.save();
      
      // Populate user data for immediate return
      await review.populate('user', 'firstName lastName');
      
      return review;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all reviews for a specific car
   */
  async getReviewsForCar(carId) {
    try {
      const reviews = await Review.find({ carId })
        .populate('user', 'firstName lastName')
        .sort({ createdAt: -1 });
        
      return reviews.map(r => ({
        id: r._id,
        userName: r.user ? `${r.user.firstName} ${r.user.lastName}` : 'Anonymous',
        rating: r.rating,
        text: r.text,
        date: r.createdAt,
        isVerified: r.isVerified
      }));
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ReviewService();
