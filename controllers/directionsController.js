const axios = require('axios');

exports.getDirections = async (req, res) => {
    const { origin, destination } = req.query;
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!origin || !destination) {
        return res.status(400).json({ error: 'Missing required parameters: origin, destination' });
    }

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/directions/json', {
            params: {
                key: apiKey,
                origin,
                destination,
                mode: 'driving',
                departure_time: 'now', // Requis pour les données en temps réel
                traffic_model: 'best_guess' // Options : best_guess, pessimistic, optimistic
            }
        });

        const routes = response.data.routes;
        if (routes.length > 0) {
            const bounds = routes[0].bounds;
            if (!bounds || !bounds.northeast || !bounds.southwest) {
                console.error('Invalid bounds in response:', bounds);
            }
        }

        res.json(response.data);
    } catch (error) {
        console.error('Error fetching directions:', error.message);
        res.status(500).json({ error: 'Failed to fetch directions' });
    }
};