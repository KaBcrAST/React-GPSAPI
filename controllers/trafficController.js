const axios = require('axios');
const Report = require('../models/Report');
const trafficService = require('../services/trafficService');

const trafficController = {
  getTrafficStatus: async (req, res) => {
    try {
      // Implémentation basique du statut
      res.json({ status: 'ok' });
    } catch (error) {
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

      const routeWithTraffic = await trafficService.getRouteTraffic(
        { latitude: originLat, longitude: originLon },
        { latitude: destLat, longitude: destLon }
      );

      res.json(routeWithTraffic);
    } catch (error) {
      console.error('Route traffic error:', error);
      res.status(500).json({
        error: 'Failed to get route traffic information',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = trafficController;
