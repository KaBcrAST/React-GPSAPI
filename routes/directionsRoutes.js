const express = require('express');
const router = express.Router();
const directionsController = require('../controllers/directionsController');

router.get('/get-directions', directionsController.getDirections);

module.exports = router;