const { getDirections } = require('../model/directionsModel');

const fetchDirections = async (req, res) => {
  const { startAddress, endAddress, avoidTolls } = req.body;

  if (!startAddress || !endAddress) {
    return res.status(400).json({ error: 'Les adresses de départ et d\'arrivée sont requises.' });
  }

  try {
    const directions = await getDirections(startAddress, endAddress, avoidTolls);
    res.json(directions);
  } catch (error) {
    console.error('Error fetching directions:', error);
    res.status(500).json({ error: error.message });
  }
};

module.exports = { fetchDirections };
