const axios = require('axios');
require('dotenv').config();
const History = require('../models/History');

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
    const { origin, destination, avoidTolls } = req.query;

    try {
      console.log('🚗 Route request:', { origin, destination, avoidTolls });
      
      const params = {
        origin,
        destination,
        alternatives: true,
        mode: 'driving',
        language: 'fr',
        region: 'fr',
        units: 'metric',
        key: process.env.GOOGLE_MAPS_API_KEY
      };

      // Convert string 'true'/'false' to boolean
      if (avoidTolls === 'true') {
        console.log('🚫 Avoiding tolls for this route');
        params.avoid = 'tolls';
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
        // Extract detailed steps from each leg
        const details = route.legs.flatMap(leg => 
          leg.steps.map(step => ({
            polyline: step.polyline.points,
            distance: step.distance,
            duration: step.duration,
            instructions: step.html_instructions,
            maneuver: step.maneuver || null
          }))
        );

        return {
          summary: route.summary,
          bounds: route.bounds,
          distance: route.legs[0].distance,
          duration: route.legs[0].duration,
          polyline: route.overview_polyline.points,
          details,
          hasTolls: route.warnings?.some(w => w.toLowerCase().includes('toll')) || false
        };
      });

      console.log(`✅ Found ${routes.length} routes`);
      
      res.json({ 
        status: 'OK',
        routes
      });

    } catch (error) {
      console.error('❌ Navigation error:', {
        message: error.message,
        response: error.response?.data
      });
      res.status(500).json({ 
        error: 'Failed to calculate route',
        details: error.response?.data?.error_message || error.message
      });
    }
  },

  getRoutePreview: async (req, res) => {
    try {
      const { origin, destination } = req.query;

      if (!origin || !destination) {
        return res.status(400).json({
          error: 'Missing origin or destination coordinates'
        });
      }

      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
        params: {
          origin,
          destination,
          alternatives: true,
          mode: 'driving',
          key: process.env.GOOGLE_MAPS_API_KEY
        }
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }

      const routes = response.data.routes.map((route, index) => {
        const leg = route.legs[0];
        return {
          index,
          coordinates: decodePolyline(route.overview_polyline.points),
          distance: leg.distance.text,
          duration: leg.duration.text,
          summary: route.summary || `Route ${index + 1}`
        };
      });

      res.json({ routes });
    } catch (error) {
      console.error('Route preview error:', error);
      res.status(500).json({ error: 'Failed to fetch routes' });
    }
  },

  startNavigation: async (req, res) => {
    try {
      const { userId, destination } = req.body;

      // Sauvegarder dans l'historique
      if (userId) {
        let history = await History.findOne({ userId });
        if (!history) {
          history = new History({ userId, destinations: [] });
        }

        history.destinations.unshift({
          name: destination.name || 'Destination',
          address: destination.address || '',
          coordinates: {
            latitude: destination.latitude,
            longitude: destination.longitude
          }
        });

        if (history.destinations.length > 5) {
          history.destinations = history.destinations.slice(0, 5);
        }

        await history.save();
      }

      // Reste de votre logique de navigation existante
      // ...existing code...

      res.json({
        success: true,
        message: 'Navigation started'
      });
    } catch (error) {
      console.error('Navigation error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  getRouteWithoutTolls: async (req, res) => {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    try {
      console.log('🚫 Calculating route without tolls');
      
      const params = {
        origin,
        destination,
        alternatives: false, // Une seule route sans péage
        mode: 'driving',
        avoid: 'tolls', // Toujours éviter les péages
        language: 'fr',
        region: 'fr',
        units: 'metric',
        key: process.env.GOOGLE_MAPS_API_KEY
      };

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/directions/json',
        { params }
      );

      if (!response.data.routes || response.data.status !== 'OK') {
        throw new Error('No route found');
      }

      const route = response.data.routes[0];
      const formattedRoute = {
        distance: route.legs[0].distance,
        duration: route.legs[0].duration,
        coordinates: decodePolyline(route.overview_polyline.points),
        summary: 'Route sans péages'
      };

      console.log('✅ Found route without tolls');
      res.json({ status: 'OK', route: formattedRoute });

    } catch (error) {
      console.error('❌ Error calculating route:', error);
      res.status(500).json({ error: 'Failed to calculate route' });
    }
  }
};

// Fonction utilitaire pour décoder les polylines
function decodePolyline(encoded) {
  const points = [];
  let index = 0, len = encoded.length;
  let lat = 0, lng = 0;

  while (index < len) {
    let shift = 0, result = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    points.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5
    });
  }
  return points;
}

module.exports = navigationController;