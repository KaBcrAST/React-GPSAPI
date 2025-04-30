const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.post('/reports', reportController.createReport);

router.get('/reports', reportController.getNearbyReports);

router.get('/all-reports', reportController.getAllReports);

router.get('/reports/clusters', reportController.getReportClusters);

router.get('/reports/stats', reportController.getReportStats);

router.post('/reports/:reportId/upvote', reportController.upvoteReport);

module.exports = router;