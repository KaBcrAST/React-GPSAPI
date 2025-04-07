const axios = require('axios');
const Report = require('../models/Report');
const trafficService = require('../services/trafficService');

const trafficController = {
  getTrafficStatus: async (req, res) => {
    try {
      // Get recent traffic reports
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const trafficReports = await Report.find({
        type: 'TRAFFIC',
        createdAt: { $gte: tenMinutesAgo }
      });

      res.json({ 
        status: 'ok',
        trafficReports: trafficReports.length,
        lastUpdate: new Date()
      });
    } catch (error) {
      console.error('Traffic status error:', error);
      res.status(500).json({ error: 'Failed to get traffic status' });
    }
  },

  getRouteWithTraffic: async (req, res) => {
    try {
      const { origin, destination } = req.query;

      if (!origin || !destination) {
        return res.status(400).json({
          error: 'Missing origin or destination parameters'
        });
      }

      const [originLat, originLon] = origin.split(',').map(Number);
      const [destLat, destLon] = destination.split(',').map(Number);

      if (isNaN(originLat) || isNaN(originLon) || isNaN(destLat) || isNaN(destLon)) {
        return res.status(400).json({
          error: 'Invalid coordinates format'
        });
      }

      // Get recent traffic reports near the route
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const reports = await Report.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [originLon, originLat]
            },
            distanceField: "distance",
            maxDistance: 5000,
            spherical: true,
            query: {
              type: "TRAFFIC",
              createdAt: { $gte: tenMinutesAgo }
            }
          }
        }
      ]);

      console.log(`Found ${reports.length} traffic reports near route`);

      const routeWithTraffic = await trafficService.getRouteTraffic(
        { latitude: originLat, longitude: originLon },
        { latitude: destLat, longitude: destLon },
        reports
      );

      if (!routeWithTraffic) {
        return res.status(404).json({
          error: 'Could not calculate route'
        });
      }

      res.json({
        route: routeWithTraffic,
        trafficReports: reports.length,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Route traffic error:', {
        message: error.message,
        stack: error.stack
      });
      res.status(500).json({
        error: 'Failed to get route traffic information',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = trafficController;
