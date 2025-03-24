const express = require('express');
const router = express.Router();
const navigationController = require('../controllers/navigationController');

router.get('/remaining-distance', navigationController.getRemainingDistance);

module.exports = router;