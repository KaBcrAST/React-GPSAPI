const reportCreateController = require('./reportCreateController');
const reportQueryController = require('./reportQueryController');
const reportInteractionController = require('./reportInteractionController');
const reportStatisticsController = require('./reportStatisticsController');
const maintenanceController = require('./maintenanceController');

module.exports = {
  createReport: reportCreateController.createReport,
  
  getNearbyReports: reportQueryController.getNearbyReports,
  getReportClusters: reportQueryController.getReportClusters,
  getRouteWithTraffic: reportQueryController.getRouteWithTraffic,
  getAllReports: reportQueryController.getAllReports,
  
  upvoteReport: reportInteractionController.upvoteReport,
  
  getReportStats: reportStatisticsController.getReportStats,
  
  cleanupOldReports: maintenanceController.cleanupOldReports
};