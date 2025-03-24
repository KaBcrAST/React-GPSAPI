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

      const route = response.data.routes[0];
      if (!route?.legs?.[0]?.distance) {
        return res.status(404).json({ error: 'No route found' });
      }

      const { distance } = route.legs[0];
      res.json({
        distance: {
          value: distance.value,
          text: distance.text
        }
      });
    } catch (error) {
      console.error('Navigation error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to calculate distance' });
    }
  }
};

module.exports = navigationController;