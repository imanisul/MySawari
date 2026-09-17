const express = require('express');
const reviewController = require('./review.controller');
const protect = require('../../middleware/protect.middleware');

const router = express.Router();

router.post('/', protect, reviewController.createReview);
router.get('/:carId', reviewController.getReviewsForCar);

module.exports = router;
