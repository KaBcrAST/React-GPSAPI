const Map = require('../models/Map');

const mapController = {
  getMapConfig: async (req, res) => {
    const defaultConfig = {
      region: {
        latitude: 48.8566,
        longitude: 2.3522,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421
      },
      mapSettings: {
        showsBuildings: true,
        showsUserLocation: true,
        showsCompass: false,
        rotateEnabled: true,
        pitchEnabled: true,
        minZoomLevel: 14,
        maxZoomLevel: 20,
        camera: {
          pitch: 45,
          altitude: 500,
          zoom: 16
        }
      }
    };
    
    res.json(defaultConfig);
  },

  updateLocation: async (req, res) => {
    try {
      // Store or process the location update if needed
      res.json(req.body);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = mapController;