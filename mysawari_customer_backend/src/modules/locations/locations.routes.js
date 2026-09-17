const express = require('express');
const LocationsController = require('./locations.controller');

const router = express.Router();
const controller = new LocationsController();

router.get('/search', controller.search);
router.get('/details', controller.details);

module.exports = router;
