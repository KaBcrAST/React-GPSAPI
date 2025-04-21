const express = require('express');
const router = express.Router();
const History = require('../models/History');

router.post('/add', async (req, res) => {
  try {
    const { userId, destination } = req.body;

    // Récupérer l'historique existant
    let history = await History.findOne({ userId });

    if (!history) {
      // Créer un nouvel historique si n'existe pas
      history = new History({ userId, destinations: [] });
    }

    // Ajouter la nouvelle destination au début
    history.destinations.unshift({
      ...destination,
      timestamp: new Date()
    });

    // Garder seulement les 5 dernières destinations
    history.destinations = history.destinations.slice(0, 5);

    await history.save();

    res.json({ success: true, history: history.destinations });
  } catch (error) {
    console.error('History add error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

router.get('/:userId', async (req, res) => {
  try {
    const history = await History.findOne({ userId: req.params.userId });
    res.json({ success: true, history: history ? history.destinations : [] });
  } catch (error) {
    console.error('History get error:', error);
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
});

module.exports = router;