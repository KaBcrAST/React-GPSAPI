const FavoriteRoute = require('../../models/FavoriteRoute');
const validator = require('validator');

/**
 * Récupère un trajet favori par son ID
 * GET /api/favorites/:id
 */
const getFavoriteById = async (req, res) => {
  try {
    const favoriteId = req.params.id;
    
    if (!validator.isMongoId(favoriteId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de trajet invalide'
      });
    }
    
    const favorite = await FavoriteRoute.findOne({
      _id: favoriteId,
      user: req.user.id
    });
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Trajet favori non trouvé'
      });
    }
    
    res.json({
      success: true,
      favorite
    });
  } catch (error) {
    console.error('Get favorite by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du trajet favori'
    });
  }
};

module.exports = {
  getFavoriteById
};