const express = require('express');
const router = express.Router();
const searchController = require('../controllers/searchController');

router.get('/places', searchController.searchPlaces);
router.get('/places/:placeId', searchController.getPlaceDetails);

module.exports = router;