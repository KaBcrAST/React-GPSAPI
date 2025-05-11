const FavoriteRoute = require('../../models/FavoriteRoute');
const validator = require('validator');

/**
 * Supprime un trajet favori
 * DELETE /api/favorites/:id
 */
const deleteFavorite = async (req, res) => {
  try {
    const favoriteId = req.params.id;
    
    if (!validator.isMongoId(favoriteId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de trajet invalide'
      });
    }
    
    const result = await FavoriteRoute.deleteOne({
      _id: favoriteId,
      user: req.user.id
    });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Trajet favori non trouvé ou non autorisé'
      });
    }
    
    res.json({
      success: true,
      message: 'Trajet favori supprimé avec succès'
    });
  } catch (error) {
    console.error('Delete favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression du trajet favori'
    });
  }
};

module.exports = {
  deleteFavorite
};