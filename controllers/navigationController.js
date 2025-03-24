const axios = require('axios');

const navigationController = {
  getRemainingDistance: async (req, res) => {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/directions/json`,
        {
          params: {
            origin: origin,
            destination: destination,
            key: process.env.GOOGLE_MAPS_API_KEY
          }
        }
      );

      if (response.data.routes[0]?.legs[0]?.distance) {
        const distance = response.data.routes[0].legs[0].distance;
        res.json({
          distance: {
            value: distance.value,
            text: distance.text
          }
        });
      } else {
        res.status(404).json({ error: 'No route found' });
      }
    } catch (error) {
      console.error('Navigation error:', error);
      res.status(500).json({ error: 'Failed to fetch route information' });
    }
  }
};

module.exports = navigationController;