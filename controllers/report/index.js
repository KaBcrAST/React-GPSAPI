const reportCreateController = require('./reportCreateController');
const reportQueryController = require('./reportQueryController');
const reportInteractionController = require('./reportInteractionController');
const reportStatisticsController = require('./reportStatisticsController');
const maintenanceController = require('./maintenanceController');

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
  
  // Maintenance methods (expose uniquement les méthodes publiques)
  cleanupOldReports: maintenanceController.cleanupOldReports
};