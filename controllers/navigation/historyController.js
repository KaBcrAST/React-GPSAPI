const History = require('../../models/History');

const historyController = {
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

      res.json({
        success: true,
        message: 'Navigation started'
      });
    } catch (error) {
      console.error('Navigation error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

module.exports = historyController;