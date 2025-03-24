const express = require('express');
const { fetchDirections } = require('../controllers/directionsController');
const router = express.Router();

router.post('/directions', fetchDirections);

module.exports = router;