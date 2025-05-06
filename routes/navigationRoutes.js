const express = require('express');
const router = express.Router();
const navigationController = require('../controllers/navigationController');
const speedLimitController = require('../controllers/speedLimitController');
const navigationStepsController = require('../controllers/navigationStepsController');
const directNavigationController = require('../controllers/directNavigationController');

router.get('/distance', navigationController.getRemainingDistance);
router.get('/info', navigationController.getRemainingInfo);
router.get('/route', navigationController.getRoute);
router.get('/speed-limit', speedLimitController.getSpeedLimit);
router.get('/preview', navigationController.getRoutePreview);
router.get('/route-without-tolls', navigationController.getRouteWithoutTolls);
router.get('/navigation-steps', navigationStepsController.getNavigationSteps);
router.get('direct', directNavigationController.startDirectNavigation);

module.exports = router;