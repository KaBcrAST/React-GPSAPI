const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

// Create a new report
router.post('/reports', reportController.createReport);

// Get nearby reports
router.get('/reports', reportController.getNearbyReports);

// Get report clusters
router.get('/reports/clusters', reportController.getReportClusters);

// Upvote a report
router.post('/reports/:reportId/upvote', reportController.upvoteReport);

module.exports = router;