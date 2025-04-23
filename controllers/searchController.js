const axios = require('axios');

const searchController = {
  searchPlaces: async (req, res) => {
    try {
      const { query } = req.query;
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json`,
        {
          params: {
            input: query,
            key: process.env.GOOGLE_MAPS_API_KEY,
            language: 'fr',
            components: 'country:fr',
          }
        }
      );

      res.json(response.data.predictions);
    } catch (error) {
      console.error('Search error:', error);
      res.status(500).json({ error: error.message });
    }
  },

  getPlaceDetails: async (req, res) => {
    try {
      const { placeId } = req.params;
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/place/details/json`,
        {
          params: {
            place_id: placeId,
            key: process.env.GOOGLE_MAPS_API_KEY,
            language: 'fr',
            fields: 'geometry,formatted_address,name'
          }
        }
      );

      res.json(response.data.result);
    } catch (error) {
      console.error('Place details error:', error);
      res.status(500).json({ error: error.message });
    }
  }
};

module.exports = searchController;