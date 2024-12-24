const express = require('express');
const router = express.Router();
const gpsController = require('../controllers/gpsController');

router.get('/coordinates', gpsController.getCoordinates);

module.exports = router;