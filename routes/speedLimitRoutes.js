const express = require('express');
const router = express.Router();
const speedLimitController = require('../controllers/speedLimitController');

router.get('/speed-limit', speedLimitController.getSpeedLimit);

module.exports = router;