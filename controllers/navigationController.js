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
        // Request maximum detail level
        optimize: true,
        // Get all waypoints for better accuracy
        generate_alternative_routes: true,
        // Get detailed steps including roundabouts
        maneuvers: true,
        // Get highest resolution path
        interpolate: true,
        // Get traffic signals and road features
        traffic_model: 'best_guess',
        units: 'metric',
        key: process.env.GOOGLE_MAPS_API_KEY
      };

      if (avoid) {
        params.avoid = avoid;
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

      // Process routes with enhanced detail
      const routes = response.data.routes.map(route => {
        // Get all steps and sub-steps for maximum detail
        const details = route.legs.flatMap(leg => 
          leg.steps.flatMap(step => {
            // Get sub-steps if available (like roundabout exits)
            const subSteps = step.steps || [];
            
            // Combine main step and sub-steps
            return [
              {
                polyline: step.polyline.points,
                distance: step.distance,
                duration: step.duration,
                instructions: step.html_instructions,
                maneuver: step.maneuver || null,
                isRoundabout: step.maneuver?.includes('roundabout'),
              },
              ...subSteps.map(subStep => ({
                polyline: subStep.polyline.points,
                distance: subStep.distance,
                duration: subStep.duration,
                instructions: subStep.html_instructions,
                maneuver: subStep.maneuver || null,
                isRoundabout: subStep.maneuver?.includes('roundabout'),
              }))
            ];
          })
        );

        // Combine all polylines for a more detailed path
        const combinedPolyline = details.map(d => d.polyline).join('');

        return {
          summary: route.summary,
          bounds: route.bounds,
          distance: route.legs[0].distance,
          duration: route.legs[0].duration,
          overview_polyline: {
            points: combinedPolyline
          },
          details,
          hasTolls: route.warnings?.some(w => w.toLowerCase().includes('toll')) || false,
          warnings: route.warnings || []
        };
      });

      console.log(`✅ Found ${routes.length} routes with enhanced detail`);
      
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