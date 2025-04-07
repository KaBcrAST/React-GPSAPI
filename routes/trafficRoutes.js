const express = require('express');
const trafficController = require('../controllers/trafficController');
const reportController = require('../controllers/reportController');

const router = express.Router();

// Route pour obtenir l'état du trafic général
router.get('/status', trafficController.getTrafficStatus);

// Route pour obtenir le trafic sur un itinéraire spécifique
router.get('/route', trafficController.getRouteWithTraffic);

module.exports = router;
