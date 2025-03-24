const express = require('express');
const router = express.Router();
const navigationController = require('../controllers/navigationController');

router.get('/remaining-distance', navigationController.getRemainingDistance);
router.get('/route-info', navigationController.getRemainingInfo);

module.exports = router;