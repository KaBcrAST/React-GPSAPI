const axios = require('axios');

const navigationStepsController = {
  getNavigationSteps: async (req, res) => {
    try {
      const { currentLat, currentLng, destinationLat, destinationLng } = req.query;
      
      const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
        params: {
          origin: `${currentLat},${currentLng}`,
          destination: `${destinationLat},${destinationLng}`,
          key: process.env.GOOGLE_MAPS_API_KEY,
          language: 'fr'
        }
      });

      const steps = response.data.routes[0].legs[0].steps.map(step => ({
        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
        distance: step.distance.value,
        maneuver: step.maneuver || 'straight',
        startLocation: step.start_location,
        endLocation: step.end_location
      }));

      res.json({ steps });
    } catch (error) {
      console.error('Navigation steps error:', error);
      res.status(500).json({ error: 'Failed to get navigation steps' });
    }
  }
};

module.exports = navigationStepsController;