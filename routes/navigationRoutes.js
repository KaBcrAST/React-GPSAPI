const express = require('express');
const router = express.Router();
const navigationController = require('../controllers/navigationController');
const speedLimitController = require('../controllers/speedLimitController');
const axios = require('axios');

router.get('/distance', navigationController.getRemainingDistance);
router.get('/info', navigationController.getRemainingInfo);
router.get('/route', navigationController.getRoute);
router.get('/speed-limit', speedLimitController.getSpeedLimit);
router.get('/preview', navigationController.getRoutePreview); // Ajout de la route preview
router.get('/route-without-tolls', navigationController.getRouteWithoutTolls);

router.get('/navigation-steps', async (req, res) => {
  try {
    const { currentLat, currentLng, destinationLat, destinationLng } = req.query;
    
    // Utiliser l'API Google Directions pour obtenir les étapes détaillées
    const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
      params: {
        origin: `${currentLat},${currentLng}`,
        destination: `${destinationLat},${destinationLng}`,
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    // Formatage simplifié des étapes de navigation
    const steps = response.data.routes[0].legs[0].steps.map(step => ({
      instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
      distance: step.distance.value,
      maneuver: step.maneuver || 'straight',
      startLocation: step.start_location,
      endLocation: step.end_location
    }));

    res.json({ steps });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get navigation steps' });
  }
});

module.exports = router;