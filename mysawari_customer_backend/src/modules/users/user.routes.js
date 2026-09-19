const express = require('express');
const UserController = require('./user.controller');
const protect = require('../../middleware/protect.middleware');

const router = express.Router();
const userController = new UserController();

router.put('/profile', protect, userController.updateProfile.bind(userController));

module.exports = router;
