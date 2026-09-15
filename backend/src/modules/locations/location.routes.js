const express = require('express');
const LocationController = require('./location.controller');

const router = express.Router();
const controller = new LocationController();

router.post('/autocomplete', controller.autocomplete);
router.post('/details', controller.getDetails);

module.exports = router;
