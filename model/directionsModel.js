const axios = require('axios');

const getDirections = async (startAddress, endAddress, travelMode) => {
  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
      params: {
        origin: startAddress,
        destination: endAddress,
        travelMode,
        key: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error('Failed to fetch directions');
  }
};

module.exports = { getDirections };