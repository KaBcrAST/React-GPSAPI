const express = require('express');
const trafficController = require('../controllers/trafficController');
const router = express.Router();

router.get('/status', trafficController.getTrafficStatus);

router.get('/route', trafficController.getRouteWithTraffic);

module.exports = router;
