const reportCreateController = require('./reportCreateController');
const reportQueryController = require('./reportQueryController');
const reportInteractionController = require('./reportInteractionController');
const reportStatisticsController = require('./reportStatisticsController');
const maintenanceController = require('./maintenanceController');
const predictionController = require('./predictionController');

module.exports = {
  // Create methods
  createReport: reportCreateController.createReport,
  
  // Query methods
  getNearbyReports: reportQueryController.getNearbyReports,
  getReportClusters: reportQueryController.getReportClusters,
  getRouteWithTraffic: reportQueryController.getRouteWithTraffic,
  getAllReports: reportQueryController.getAllReports,
  
  // Interaction methods
  upvoteReport: reportInteractionController.upvoteReport,
  
  // Statistics methods
  getReportStats: reportStatisticsController.getReportStats,
  
  // Maintenance methods
  cleanupOldReports: maintenanceController.cleanupOldReports,
  
  // Prediction methods
  predictIncidents: predictionController.predictIncidents,
  getPeakTimes: predictionController.getPeakTimes,
  getHeatmap: predictionController.getHeatmap
};