const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.post('/reports', reportController.createReport);

router.get('/reports', reportController.getNearbyReports);

router.get('/reports/clusters', reportController.getReportClusters);

router.post('/reports/:reportId/upvote', reportController.upvoteReport);

module.exports = router;