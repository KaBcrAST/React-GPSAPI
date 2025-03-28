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
      console.log('Getting route info:', { origin, destination });
      
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

      if (!response.data.routes?.[0]?.legs?.[0]) {
        console.error('No route found in Google response');
        return res.status(404).json({ error: 'No route found' });
      }

      const routeInfo = {
        distance: response.data.routes[0].legs[0].distance,
        duration: response.data.routes[0].legs[0].duration
      };

      console.log('Route info found:', routeInfo);
      res.json(routeInfo);
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
      console.log('🚗 Calculating route:', { origin, destination, avoid });

      const params = {
        origin,
        destination,
        alternatives: true,
        mode: 'driving',
        // Demander une meilleure résolution du trajet
        optimize: true,
        // Augmenter le nombre de points pour un meilleur tracé
        waypoints_per_route: true,
        units: 'metric',
        key: process.env.GOOGLE_MAPS_API_KEY
      };

      // Ajouter les préférences d'évitement
      if (avoid) {
        params.avoid = avoid; // 'tolls', 'highways', 'ferries'
      }

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/directions/json',
        { params }
      );

      if (!response.data.routes || response.data.status !== 'OK') {
        console.error('❌ No routes found:', response.data);
        return res.status(404).json({ 
          error: 'No routes found',
          googleStatus: response.data.status
        });
      }

      // Traiter les routes pour avoir plus de détails
      const routes = response.data.routes.map(route => {
        // Extraire tous les points du trajet, pas seulement overview
        const details = route.legs.flatMap(leg => 
          leg.steps.map(step => ({
            polyline: step.polyline.points,
            distance: step.distance,
            duration: step.duration,
            instructions: step.html_instructions
          }))
        );

        return {
          summary: route.summary,
          bounds: route.bounds,
          distance: route.legs[0].distance,
          duration: route.legs[0].duration,
          // Garder le polyline d'aperçu pour l'affichage initial
          overview_polyline: route.overview_polyline,
          // Ajouter les détails pour un meilleur rendu
          details,
          hasTolls: route.warnings?.some(w => 
            w.toLowerCase().includes('toll')
          ) || false
        };
      });

      console.log(`✅ Found ${routes.length} routes`);
      
      res.json({ 
        status: 'OK',
        routes
      });

    } catch (error) {
      console.error('❌ Navigation error:', error);
      res.status(500).json({ error: 'Failed to calculate route' });
    }
  }
};

module.exports = navigationController;