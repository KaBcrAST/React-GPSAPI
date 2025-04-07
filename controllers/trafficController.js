const axios = require('axios');
const Report = require('../models/Report');
const trafficService = require('../services/trafficService');

const trafficController = {
  getTrafficStatus: async (req, res) => {
    const { origin, destination } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!origin || !destination) {
        return res.status(400).json({ error: 'Missing required parameters: origin, destination' });
    }

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
            params: {
                key: apiKey,
                origin,
                destination,
                departure_time: 'now', // Requis pour les données en temps réel
                traffic_model: 'best_guess' // Options : best_guess, pessimistic, optimistic
            }
        });

        const route = response.data.routes[0];
        const leg = route.legs[0];

        // Extraire les données pertinentes
        const trafficStatus = {
            origin: leg.start_address,
            destination: leg.end_address,
            distance: leg.distance.text,
            duration: leg.duration.text, // Temps estimé sans trafic
            duration_in_traffic: leg.duration_in_traffic?.text || leg.duration.text, // Temps estimé avec trafic
            traffic_delay: leg.duration_in_traffic
                ? `${(leg.duration_in_traffic.value - leg.duration.value) / 60} minutes`
                : 'No delay'
        };

        res.json(trafficStatus);
    } catch (error) {
        console.error('Error fetching traffic status from Google:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch traffic status' });
    }
  },

  getRouteWithTraffic: async (req, res) => {
    try {
      const { origin, destination } = req.query;

      if (!origin || !destination) {
        return res.status(400).json({
          error: 'Missing origin or destination coordinates'
        });
      }

      // Parse coordinates
      const [originLat, originLon] = origin.split(',').map(Number);
      const [destLat, destLon] = destination.split(',').map(Number);

      // Get reports along the route
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
              createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
            }
          }
        }
      ]);

      // Get route with traffic info
      const routeWithTraffic = await trafficService.getRouteTraffic(
        { latitude: originLat, longitude: originLon },
        { latitude: destLat, longitude: destLon },
        reports
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
