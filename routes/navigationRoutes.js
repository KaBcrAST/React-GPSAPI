const express = require('express');
const router = express.Router();
const navigationController = require('../controllers/navigationController');
const speedLimitController = require('../controllers/speedLimitController');

router.get('/distance', navigationController.getRemainingDistance);
router.get('/info', navigationController.getRemainingInfo);
router.get('/route', navigationController.getRoute);
router.get('/speed-limit', speedLimitController.getSpeedLimit);

module.exports = router;