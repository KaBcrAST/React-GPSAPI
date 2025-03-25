const express = require('express');
const router = express.Router();
const navigationController = require('../controllers/navigationController');

router.get('/distance', navigationController.getRemainingDistance);
router.get('/info', navigationController.getRemainingInfo);
router.get('/route', navigationController.getRoute);

module.exports = router;