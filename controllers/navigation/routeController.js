const axios = require('axios');
require('dotenv').config();
const { decodePolyline } = require('./utils');

const routeController = {
  getRoute: async (req, res) => {
    const { origin, destination, avoidTolls } = req.query;

    try {
      
      const params = {
        origin,
        destination,
        alternatives: true,
        mode: 'driving',
        language: 'fr',
        region: 'fr',
        units: 'metric',
        departure_time: 'now',
        traffic_model: 'best_guess',
        key: process.env.GOOGLE_MAPS_API_KEY
      };

      if (avoidTolls === 'true') {
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

      const routes = response.data.routes.map(route => {
        let totalSlowdowns = 0;
        let slowdownDuration = { value: 0, text: '0 min' };
        let hasTrafficSlowdowns = false;

        const details = route.legs.flatMap(leg => {
          const normalDuration = leg.duration?.value || 0;
          const trafficDuration = leg.duration_in_traffic?.value || normalDuration;
          
          if (trafficDuration > normalDuration) {
            totalSlowdowns += 1;
            const extraTime = trafficDuration - normalDuration;
            slowdownDuration.value += extraTime;
            hasTrafficSlowdowns = true;
            
            const minutes = Math.round(extraTime / 60);
            slowdownDuration.text = `${minutes} min`;
          }
          
          return leg.steps.map(step => ({
            polyline: step.polyline.points,
            distance: step.distance,
            duration: step.duration,
            instructions: step.html_instructions,
            maneuver: step.maneuver || null,
            traffic_speed_category: step.traffic_speed_category || 'normal',
            has_traffic: !!step.duration_in_traffic
          }));
        });

        return {
          summary: route.summary,
          bounds: route.bounds,
          distance: route.legs[0].distance,
          duration: route.legs[0].duration,
          polyline: route.overview_polyline.points,
          details,
          hasTolls: route.warnings?.some(w => w.toLowerCase().includes('toll')) || false,
          traffic: {
            hasSlowdowns: hasTrafficSlowdowns,
            slowdownCount: totalSlowdowns,
            slowdownDuration: slowdownDuration,
            durationWithTraffic: route.legs[0].duration_in_traffic || route.legs[0].duration
          }
        };
      });

      
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
      const { origin, destination, avoidTolls } = req.query;

      if (!origin || !destination) {
        return res.status(400).json({
          error: 'Missing origin or destination coordinates'
        });
      }

      const params = {
        origin,
        destination,
        alternatives: true,
        mode: 'driving',
        language: 'fr',  
        region: 'fr',
        departure_time: 'now', 
        traffic_model: 'best_guess',
        key: process.env.GOOGLE_MAPS_API_KEY
      };

      if (avoidTolls === 'true') {
        params.avoid = 'tolls';
      }

      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', { params });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }

      const routes = response.data.routes.map((route, index) => {
        const leg = route.legs[0];
        
        let detailedCoordinates = [];
        leg.steps.forEach(step => {
          const stepCoords = decodePolyline(step.polyline.points);
          
          if (detailedCoordinates.length > 0 && stepCoords.length > 0 && 
              detailedCoordinates[detailedCoordinates.length - 1].latitude === stepCoords[0].latitude &&
              detailedCoordinates[detailedCoordinates.length - 1].longitude === stepCoords[0].longitude) {
            detailedCoordinates = [...detailedCoordinates, ...stepCoords.slice(1)];
          } else {
            detailedCoordinates = [...detailedCoordinates, ...stepCoords];
          }
        });
        
        const normalDuration = leg.duration?.value || 0;
        const trafficDuration = leg.duration_in_traffic?.value || normalDuration;
        const hasTrafficSlowdowns = trafficDuration > normalDuration;
        
        let slowdownInfo = {
          exists: hasTrafficSlowdowns,
          duration: { 
            value: 0, 
            text: '0 min' 
          }
        };
        
        if (hasTrafficSlowdowns) {
          const extraSeconds = trafficDuration - normalDuration;
          slowdownInfo.duration.value = extraSeconds;
          slowdownInfo.duration.text = `${Math.round(extraSeconds / 60)} min`;
        }
        
        const steps = leg.steps.map(step => ({
          distance: step.distance,
          duration: step.duration,
          duration_in_traffic: step.duration_in_traffic || step.duration,
          instructions: step.html_instructions,
          maneuver: step.maneuver || null,
          start_location: step.start_location,
          end_location: step.end_location
        }));

        return {
          index,
          coordinates: detailedCoordinates,
          distance: leg.distance,
          duration: leg.duration,
          durationWithTraffic: leg.duration_in_traffic || leg.duration,
          summary: route.summary || `Route ${index + 1}`,
          hasTolls: route.warnings?.some(w => w.toLowerCase().includes('toll')) || false,
          distanceValue: leg.distance.value,
          durationValue: leg.duration.value,
          steps: steps,
          traffic: {
            hasSlowdowns: slowdownInfo.exists,
            slowdownDuration: slowdownInfo.duration
          }
        };
      });

      res.json({ routes });

    } catch (error) {
      console.error('Route preview error:', error);
      res.status(500).json({ error: 'Failed to fetch routes' });
    }
  },

  getRouteWithoutTolls: async (req, res) => {
    const { origin, destination } = req.query;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'Origin and destination are required' });
    }

    try {
      
      const params = {
        origin,
        destination,
        alternatives: false, 
        mode: 'driving',
        avoid: 'tolls', 
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

      res.json({ status: 'OK', route: formattedRoute });

    } catch (error) {
      console.error('❌ Error calculating route:', error);
      res.status(500).json({ error: 'Failed to calculate route' });
    }
  }
};

module.exports = routeController;