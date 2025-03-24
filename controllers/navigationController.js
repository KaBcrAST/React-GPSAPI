const axios = require('axios');
require('dotenv').config();

const navigationController = {
  getNavigationInfo: async (req, res) => {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ 
        error: 'Origin and destination required' 
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
        remainingDistance: {
          value: leg.distance.value,
          text: `${(leg.distance.value / 1000).toFixed(1)} km`
        },
        remainingTime: {
          value: leg.duration.value,
          text: leg.duration.text
        }
      });

    } catch (error) {
      console.error('Navigation error:', error.response?.data || error.message);
      res.status(500).json({ error: 'Failed to get navigation info' });
    }
  }
};

module.exports = navigationController;