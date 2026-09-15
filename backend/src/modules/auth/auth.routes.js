const express = require('express');
const AuthController = require('./auth.controller');

const router = express.Router();
const controller = new AuthController();

router.post('/send-otp', controller.sendOtp);
router.post('/verify-otp', controller.verifyOtp);

module.exports = router;
