const express = require('express');
const BookingController = require('./booking.controller');

const router = express.Router();
const controller = new BookingController();

router.post('/calculate', controller.quote);

module.exports = router;
