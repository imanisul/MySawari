const express = require('express');
const ApiResponse = require('../common/utils/api-response');
const router = express.Router();

router.get('/', (req, res) => {
  return ApiResponse.success(res, { timestamp: new Date() }, 'API is healthy');
});

module.exports = router;
