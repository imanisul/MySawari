const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  carId: {
    type: String,
    required: true,
    index: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

// Prevent multiple reviews for same car by same user (optional, but good practice)
// reviewSchema.index({ user: 1, carId: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
