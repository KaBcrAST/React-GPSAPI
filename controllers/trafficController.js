const axios = require('axios');

exports.getTrafficStatus = async (req, res) => {
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
                departure_time: 'now', // Requis pour les données en temps réel
                traffic_model: 'best_guess' // Options : best_guess, pessimistic, optimistic
            }
        });

        const route = response.data.routes[0];
        const leg = route.legs[0];

        // Extraire les données pertinentes
        const trafficStatus = {
            origin: leg.start_address,
            destination: leg.end_address,
            distance: leg.distance.text,
            duration: leg.duration.text, // Temps estimé sans trafic
            duration_in_traffic: leg.duration_in_traffic?.text || leg.duration.text, // Temps estimé avec trafic
            traffic_delay: leg.duration_in_traffic
                ? `${(leg.duration_in_traffic.value - leg.duration.value) / 60} minutes`
                : 'No delay'
        };

        res.json(trafficStatus);
    } catch (error) {
        console.error('Error fetching traffic status from Google:', error.response?.data || error.message);
        res.status(500).json({ error: 'Failed to fetch traffic status' });
    }
};
