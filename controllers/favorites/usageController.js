const FavoriteRoute = require('../../models/FavoriteRoute');
const validator = require('validator');

const useFavorite = async (req, res) => {
  try {
    const favoriteId = req.params.id;
    
    if (!validator.isMongoId(favoriteId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de trajet invalide'
      });
    }
    
    const favorite = await FavoriteRoute.findOneAndUpdate(
      { _id: favoriteId, user: req.user.id },
      { 
        $inc: { useCount: 1 },
        $set: { lastUsed: new Date() }
      },
      { new: true }
    );
    
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: 'Trajet favori non trouvé ou non autorisé'
      });
    }
    
    res.json({
      success: true,
      message: 'Trajet favori utilisé',
      favorite
    });
  } catch (error) {
    console.error('Use favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'utilisation du trajet favori'
    });
  }
};

module.exports = {
  useFavorite
};