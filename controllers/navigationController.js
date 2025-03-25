const axios = require('axios');
require('dotenv').config();

const navigationController = {
  getRemainingDistance: async (req, res) => {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ 
        error: 'Origin and destination coordinates are required' 
      });
    }

    try {
      console.log('Calculating distance:', { origin, destination });

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/directions/json',
        {
          params: {
            origin,
            destination,
            key: process.env.GOOGLE_MAPS_API_KEY
          }
        }
      );

      if (!response.data.routes?.[0]?.legs?.[0]?.distance) {
        console.error('No route found:', response.data);
        return res.status(404).json({ error: 'No route found' });
      }

      const distance = response.data.routes[0].legs[0].distance;
      console.log('Distance calculated:', distance);

      res.json({ distance });
    } catch (error) {
      console.error('Navigation error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to calculate distance' });
    }
  },

  getRemainingInfo: async (req, res) => {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ 
        error: 'Origin and destination coordinates are required' 
      });
    }

    try {
      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/directions/json',
        {
          params: {
            origin,
            destination,
            key: process.env.GOOGLE_MAPS_API_KEY
          }
        }
      );

      const leg = response.data.routes?.[0]?.legs?.[0];
      if (!leg) {
        return res.status(404).json({ error: 'No route found' });
      }

      res.json({
        distance: leg.distance,
        duration: leg.duration
      });
    } catch (error) {
      console.error('Navigation error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to calculate route info' });
    }
  },

  getRoute: async (req, res) => {
    const { origin, destination, avoid } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ 
        error: 'Origin and destination coordinates are required' 
      });
    }

    try {
      console.log('Calculating route:', { origin, destination, avoid });

      const params = {
        origin,
        destination,
        alternatives: true,
        key: process.env.GOOGLE_MAPS_API_KEY
      };

      if (avoid === 'tolls') {
        params.avoid = 'tolls';
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/directions/json',
        { params }
      );

      if (!response.data.routes || response.data.status !== 'OK') {
        console.error('No routes found:', response.data);
        return res.status(404).json({ error: 'No routes found' });
      }

      const routes = response.data.routes.map(route => ({
        bounds: route.bounds,
        distance: route.legs[0].distance,
        duration: route.legs[0].duration,
        steps: route.legs[0].steps,
        overview_polyline: route.overview_polyline,
        summary: route.summary,
        warnings: route.warnings,
        waypoint_order: route.waypoint_order,
        fare: route.fare,
        hasTolls: route.warnings?.some(warning => 
          warning.toLowerCase().includes('toll')
        )
      }));

      console.log(`Found ${routes.length} routes`);
      res.json({ status: 'OK', routes });

    } catch (error) {
      console.error('Navigation error:', error.response?.data || error.message);
      res.status(500).json({ 
        status: 'ERROR',
        error: 'Failed to calculate routes'
      });
    }
  }
};

module.exports = navigationController;