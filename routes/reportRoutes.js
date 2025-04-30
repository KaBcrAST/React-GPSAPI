const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');
const reportStatsController = require('../controllers/reportStatsController');
const duplicateToStats = require('../middleware/reportStatsMiddleware');

// Appliquer le middleware de duplication
router.use(duplicateToStats);

router.post('/reports', reportController.createReport);

router.get('/reports', reportController.getNearbyReports);

router.get('/all-reports', reportController.getAllReports);

router.get('/reports/clusters', reportController.getReportClusters);

router.get('/reports/stats', reportStatsController.getReportStats);

router.post('/reports/:reportId/upvote', reportController.upvoteReport);

module.exports = router;