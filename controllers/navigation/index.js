const distanceController = require('./distanceController');
const routeController = require('./routeController');
const historyController = require('./historyController');

module.exports = {
  // Distance related methods
  getRemainingDistance: distanceController.getRemainingDistance,
  getRemainingInfo: distanceController.getRemainingInfo,
  
  // Route related methods
  getRoute: routeController.getRoute,
  getRoutePreview: routeController.getRoutePreview,
  getRouteWithoutTolls: routeController.getRouteWithoutTolls,
  
  // History related methods
  startNavigation: historyController.startNavigation
};