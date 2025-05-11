const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report');

router.post('/reports', reportController.createReport);

router.get('/reports', reportController.getNearbyReports);

router.get('/reports/clusters', reportController.getReportClusters);

router.get('/reports/all', reportController.getAllReports);

router.post('/reports/:reportId/upvote', reportController.upvoteReport);

router.get('/reports/stats', reportController.getReportStats); // Nouvelle route pour les statistiques

module.exports = router;