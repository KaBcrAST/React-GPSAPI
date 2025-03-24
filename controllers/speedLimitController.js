const axios = require('axios');

const speedLimitController = {
  getSpeedLimit: async (req, res) => {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res.status(400).json({ error: 'Latitude and longitude are required' });
    }

    try {
      // Get nearest road from OSRM
      const osrmResponse = await axios.get(
        `https://router.project-osrm.org/nearest/v1/driving/${longitude},${latitude}?number=1`
      );

      // Get speed limit from Overpass API
      const overpassQuery = `
        [out:json];
        way(around:20,${latitude},${longitude})[maxspeed];
        out body;
      `;

      const overpassResponse = await axios.get(
        'https://overpass-api.de/api/interpreter',
        { params: { data: overpassQuery } }
      );

      const speedLimit = overpassResponse.data.elements?.[0]?.tags?.maxspeed;

      res.json({
        speedLimit: speedLimit ? parseInt(speedLimit) : null,
        location: {
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude)
        }
      });

    } catch (error) {
      console.error('Speed limit error:', error);
      res.status(500).json({ error: 'Failed to fetch speed limit' });
    }
  }
};

module.exports = speedLimitController;