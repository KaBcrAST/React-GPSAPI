const express = require('express');
const router = express.Router();
const History = require('../models/History');

// Ajouter une destination à l'historique
router.post('/add', async (req, res) => {
  try {
    const { userId, destination } = req.body;

    let history = await History.findOne({ userId });
    if (!history) {
      history = new History({ userId, destinations: [] });
    }

    history.destinations.unshift(destination);
    if (history.destinations.length > 5) {
      history.destinations = history.destinations.slice(0, 5);
    }

    await history.save();

    res.json({
      success: true,
      history: history.destinations
    });
  } catch (error) {
    console.error('Add to history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Obtenir l'historique d'un utilisateur
router.get('/:userId', async (req, res) => {
  try {
    const history = await History.findOne({ userId: req.params.userId });
    res.json({
      success: true,
      history: history ? history.destinations : []
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Add this new route
router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    // Find user by email first
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const history = await History.findOne({ userId: user._id });
    res.json({
      success: true,
      history: history ? history.destinations : []
    });
  } catch (error) {
    console.error('Get history by email error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;