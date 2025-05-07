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
        departure_time: 'now', // Important pour obtenir les infos de trafic en temps réel
        traffic_model: 'best_guess',
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
        // Variables pour calculer les ralentissements
        let totalSlowdowns = 0;
        let slowdownDuration = { value: 0, text: '0 min' };
        let hasTrafficSlowdowns = false;

        // Extract detailed steps from each leg
        const details = route.legs.flatMap(leg => {
          // Calculer la différence entre la durée avec trafic et sans trafic
          const normalDuration = leg.duration?.value || 0;
          const trafficDuration = leg.duration_in_traffic?.value || normalDuration;
          
          if (trafficDuration > normalDuration) {
            totalSlowdowns += 1;
            const extraTime = trafficDuration - normalDuration;
            slowdownDuration.value += extraTime;
            hasTrafficSlowdowns = true;
            
            // Formater le texte du ralentissement
            const minutes = Math.round(extraTime / 60);
            slowdownDuration.text = `${minutes} min`;
          }
          
          return leg.steps.map(step => ({
            polyline: step.polyline.points,
            distance: step.distance,
            duration: step.duration,
            instructions: step.html_instructions,
            maneuver: step.maneuver || null,
            // Ajouter les infos de trafic si disponibles
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
          // Nouvelles informations de trafic
          traffic: {
            hasSlowdowns: hasTrafficSlowdowns,
            slowdownCount: totalSlowdowns,
            slowdownDuration: slowdownDuration,
            // Si disponible, ajoutez aussi la durée avec trafic
            durationWithTraffic: route.legs[0].duration_in_traffic || route.legs[0].duration
          }
        };
      });

      console.log(`✅ Found ${routes.length} routes with traffic information`);
      
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
        departure_time: 'now', // Pour obtenir les infos de trafic
        traffic_model: 'best_guess',
        key: process.env.GOOGLE_MAPS_API_KEY
      };

      // Ajouter l'option d'évitement des péages si demandé
      if (avoidTolls === 'true') {
        console.log('🚫 Preview without tolls');
        params.avoid = 'tolls';
      }

      const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', { params });

      if (response.data.status !== 'OK') {
        throw new Error(`Google Maps API error: ${response.data.status}`);
      }

      const routes = response.data.routes.map((route, index) => {
        const leg = route.legs[0];
        
        // Extraire les coordonnées détaillées de chaque étape pour une meilleure précision
        let detailedCoordinates = [];
        
        // Collecter les incidents de trafic
        const incidents = [];
        
        leg.steps.forEach(step => {
          const stepCoords = decodePolyline(step.polyline.points);
          
          // Éviter les points dupliqués entre les étapes
          if (detailedCoordinates.length > 0 && stepCoords.length > 0 && 
              detailedCoordinates[detailedCoordinates.length - 1].latitude === stepCoords[0].latitude &&
              detailedCoordinates[detailedCoordinates.length - 1].longitude === stepCoords[0].longitude) {
            detailedCoordinates = [...detailedCoordinates, ...stepCoords.slice(1)];
          } else {
            detailedCoordinates = [...detailedCoordinates, ...stepCoords];
          }
          
          // Détecter les ralentissements sur ce segment
          if (step.duration_in_traffic && step.duration_in_traffic.value > step.duration.value * 1.2) {
            const severity = calculateTrafficSeverity(step.duration.value, step.duration_in_traffic.value);
            const extraTimeMinutes = Math.round((step.duration_in_traffic.value - step.duration.value) / 60);
            
            // Prendre un point au milieu du segment pour placer l'icône
            const middlePoint = stepCoords[Math.floor(stepCoords.length / 2)] || stepCoords[0];
            
            incidents.push({
              type: 'traffic_jam',
              severity: severity,
              location: middlePoint,
              description: `+${extraTimeMinutes} min`,
              // Ajouter le segment complet pour pouvoir le mettre en évidence
              segment: stepCoords
            });
          }
        });
        
        // Calculer les infos de ralentissement
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
        
        // Extraire également les instructions de navigation pour chaque étape
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
          },
          // Ajouter les incidents détectés
          incidents: incidents
        };
      });

      console.log(`✅ Found ${routes.length} preview routes with traffic information`);
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
  },

  // Ajoutez cette nouvelle méthode au contrôleur
  getTrafficIncidents: async (req, res) => {
    try {
      const { origin, destination } = req.query;

      if (!origin || !destination) {
        return res.status(400).json({ error: 'Origin and destination are required' });
      }

      console.log('🚦 Fetching traffic incidents:', { origin, destination });
      
      const params = {
        origin,
        destination,
        mode: 'driving',
        language: 'fr',
        region: 'fr',
        departure_time: 'now',
        traffic_model: 'best_guess',
        key: process.env.GOOGLE_MAPS_API_KEY
      };

      const response = await axios.get(
        'https://maps.googleapis.com/maps/api/directions/json',
        { params }
      );

      if (!response.data.routes || response.data.status !== 'OK') {
        return res.status(404).json({ error: 'No routes found', googleStatus: response.data.status });
      }

      // Collecter les incidents de trafic
      const incidents = [];
      
      // Parcourir chaque segment de la route principale
      response.data.routes[0].legs.forEach(leg => {
        leg.steps.forEach(step => {
          // Vérifier si ce segment a des ralentissements significatifs
          const hasTrafficInfo = step.duration_in_traffic && step.duration.value;
          
          if (hasTrafficInfo && step.duration_in_traffic.value > step.duration.value * 1.2) { // >20% de ralentissement
            const severity = calculateTrafficSeverity(step.duration.value, step.duration_in_traffic.value);
            const coords = decodePolyline(step.polyline.points);
            
            // Placer un marqueur au milieu du segment ralenti
            const middlePoint = coords[Math.floor(coords.length / 2)] || coords[0];
            
            incidents.push({
              type: 'traffic_jam',
              severity: severity,
              location: middlePoint,
              polyline: step.polyline.points,
              description: `+${Math.round((step.duration_in_traffic.value - step.duration.value) / 60)} min`
            });
          }
        });
      });

      console.log(`✅ Found ${incidents.length} traffic incidents`);
      res.json({ incidents });
    } catch (error) {
      console.error('❌ Error fetching traffic incidents:', error);
      res.status(500).json({ error: 'Failed to fetch traffic incidents' });
    }
  }
};

// Ajoutez cette fonction d'aide pour déterminer la sévérité du trafic
function calculateTrafficSeverity(normalDuration, trafficDuration) {
  const ratio = trafficDuration / normalDuration;
  
  if (ratio >= 2.0) return 'severe';    // Double du temps normal ou plus
  if (ratio >= 1.5) return 'high';      // 50% de temps en plus
  if (ratio >= 1.2) return 'moderate';  // 20% de temps en plus
  return 'low';                         // Ralentissement mineur
}

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