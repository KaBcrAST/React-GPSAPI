const express = require('express');
const { getTrafficStatus } = require('../controllers/trafficController');

const router = express.Router();

// Route pour obtenir l'état du trafic
router.get('/status', getTrafficStatus);

module.exports = router;
