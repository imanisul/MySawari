const express = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('../modules/auth/auth.routes');
const locationRoutes = require('../modules/locations/location.routes');
const bookingRoutes = require('../modules/bookings/booking.routes');
const userRoutes = require('../modules/users/user.routes');
const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/locations', locationRoutes);
router.use('/pricing', bookingRoutes); // Mounted at /pricing for backward compatibility with frontend
router.use('/users', userRoutes);

module.exports = router;
