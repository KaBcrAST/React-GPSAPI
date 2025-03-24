const axios = require('axios');

const speedLimitController = {
  getSpeedLimit: async (req, res) => {
    const { latitude, longitude } = req.query;

    try {
      // OSRM API call
      const osrmResponse = await axios.get(
        `https://router.project-osrm.org/nearest/v1/driving/${longitude},${latitude}?number=1`
      );

      if (osrmResponse.data.waypoints?.[0]?.nodes?.[0]) {
        // Overpass API call
        const overpassResponse = await axios.get(
          `https://overpass-api.de/api/interpreter?data=[out:json];way(around:1,${latitude},${longitude})[maxspeed];out bodies;`
        );

        const speedLimit = overpassResponse.data.elements?.[0]?.tags?.maxspeed;
        
        if (speedLimit) {
          res.json({ speedLimit: parseInt(speedLimit) });
        } else {
          res.json({ speedLimit: null });
        }
      }
    } catch (error) {
      console.error('Speed limit error:', error);
      res.status(500).json({ error: 'Failed to fetch speed limit' });
    }
  }
};

module.exports = speedLimitController;