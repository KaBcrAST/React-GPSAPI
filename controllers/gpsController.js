const axios = require('axios');

exports.getCoordinates = async (req, res) => {
    const { latitude, longitude, address } = req.query;
    if (address) {
        try {
            const response = await axios.get(`https://nominatim.openstreetmap.org/search`, {
                params: {
                    q: address,
                    format: 'json'
                }
            });

            if (response.data.length === 0) {
                return res.status(404).json({ error: 'Address not found' });
            }

            const { lat, lon } = response.data[0];
            res.json({ latitude: lat, longitude: lon });
        } catch (error) {
            res.status(500).json({ error: 'An error occurred while fetching coordinates' });
        }
    } else if (latitude && longitude) {
        res.json({ lat: latitude, lon: longitude });
    } else {
        res.status(400).json({ error: 'Latitude and longitude or address is required' });
    }
};