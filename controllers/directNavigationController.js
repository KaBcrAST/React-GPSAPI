const axios = require('axios');
const config = require('../config');

/**
 * Lance directement la navigation vers une destination sans passer par la prévisualisation
 * @param {Object} req - Requête Express contenant les coordonnées de départ et d'arrivée
 * @param {Object} res - Réponse Express
 */
const startDirectNavigation = async (req, res) => {
  try {
    const { origin, destination, mode = 'driving', avoidTolls = false } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ 
        error: 'Les coordonnées d\'origine et de destination sont requises' 
      });
    }

    // Vérifier le format des coordonnées
    const originCoords = typeof origin === 'string' ? origin : `${origin.latitude},${origin.longitude}`;
    const destCoords = typeof destination === 'string' ? destination : `${destination.latitude},${destination.longitude}`;

    // Récupérer un itinéraire minimal directement depuis l'API de directions
    const response = await axios.get(`https://maps.googleapis.com/maps/api/directions/json`, {
      params: {
        origin: originCoords,
        destination: destCoords,
        mode: mode,
        avoid: avoidTolls ? 'tolls' : '',
        key: config.GOOGLE_MAPS_API_KEY
      }
    });

    if (response.data.status !== 'OK') {
      console.error('Erreur Google Directions API:', response.data.status);
      return res.status(500).json({ 
        error: 'Impossible de calculer l\'itinéraire', 
        details: response.data.status 
      });
    }

    // Traiter la réponse pour créer un itinéraire prêt pour la navigation
    const route = response.data.routes[0];
    
    // Extraire les points du polyline pour créer les coordonnées
    const polyline = route.overview_polyline.points;
    const coordinates = decodePolyline(polyline);

    // Créer un objet d'itinéraire minimal pour la navigation directe
    const navigationRoute = {
      origin: originCoords,
      destination: destCoords,
      distance: route.legs[0].distance,
      duration: route.legs[0].duration,
      coordinates: coordinates,
      legs: route.legs,
      steps: route.legs[0].steps,
      startAddress: route.legs[0].start_address,
      endAddress: route.legs[0].end_address,
      summary: route.summary,
      polyline: polyline,
      direct: true // Indicateur pour le frontend que c'est un démarrage direct
    };

    return res.status(200).json({
      success: true,
      route: navigationRoute
    });
  } catch (error) {
    console.error('Erreur lors du lancement de la navigation directe:', error);
    return res.status(500).json({ 
      error: 'Erreur serveur lors du lancement de la navigation',
      details: error.message 
    });
  }
};

/**
 * Décode un polyline Google Maps en tableau de coordonnées
 * @param {string} encoded - Polyline encodé
 * @returns {Array} Tableau de coordonnées {latitude, longitude}
 */
function decodePolyline(encoded) {
  const poly = [];
  let index = 0, lat = 0, lng = 0;

  while (index < encoded.length) {
    let b, shift = 0, result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlat = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lat += dlat;

    shift = 0;
    result = 0;
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    const dlng = ((result & 1) ? ~(result >> 1) : (result >> 1));
    lng += dlng;

    poly.push({
      latitude: lat * 1e-5,
      longitude: lng * 1e-5
    });
  }

  return poly;
}

module.exports = {
  startDirectNavigation
};