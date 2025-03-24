const express = require('express');
const router = express.Router();
const mapController = require('../controllers/mapController');

router.get('/config', mapController.getMapConfig);
router.post('/location', mapController.updateLocation);

module.exports = router;