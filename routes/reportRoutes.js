const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const reportStatsController = require('../controllers/reportStatsController');
const duplicateToStats = require('../middleware/reportStatsMiddleware');

// Appliquer le middleware avant les routes
router.use(duplicateToStats);

router.post('/reports', reportController.createReport);

router.get('/reports', reportController.getNearbyReports);

router.get('/reports/clusters', reportController.getReportClusters);

// Nouvelle route pour les stats
router.get('/reports/stats', reportStatsController.getAllReports);

router.post('/reports/:reportId/upvote', reportController.upvoteReport);

module.exports = router;