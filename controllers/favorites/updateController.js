const FavoriteRoute = require('../../models/FavoriteRoute');
const validator = require('validator');

const updateFavorite = async (req, res) => {
  try {
    const favoriteId = req.params.id;
    const { name, origin, destination, waypoints, travelMode, icon, color } = req.body;
    
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
        message: 'Trajet favori non trouvé ou non autorisé'
      });
    }
    
    if (name) favorite.name = name.trim();
    if (origin) favorite.origin = origin;
    if (destination) favorite.destination = destination;
    if (waypoints) favorite.waypoints = waypoints;
    if (travelMode) favorite.travelMode = travelMode;
    if (icon) favorite.icon = icon;
    if (color) favorite.color = color;
    
    favorite.useCount += 1;
    favorite.lastUsed = new Date();
    
    await favorite.save();
    
    res.json({
      success: true,
      message: 'Trajet favori mis à jour',
      favorite
    });
  } catch (error) {
    console.error('Update favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du trajet favori'
    });
  }
};

module.exports = {
  updateFavorite
};