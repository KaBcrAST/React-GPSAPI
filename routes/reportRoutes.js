const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report');
const { isAuthenticated } = require('../middlewares/middlewares');

// Routes existantes
router.post('/reports', reportController.createReport);
router.get('/reports', reportController.getNearbyReports);
router.get('/reports/clusters', reportController.getReportClusters);
router.get('/reports/all', reportController.getAllReports);
router.post('/reports/:reportId/upvote', reportController.upvoteReport);
router.get('/reports/stats', reportController.getReportStats);

// Nouvelles routes de prédiction
router.get('/reports/predict', reportController.predictIncidents);
router.get('/reports/peak-times', reportController.getPeakTimes);
router.get('/reports/heatmap', reportController.getHeatmap);

module.exports = router;