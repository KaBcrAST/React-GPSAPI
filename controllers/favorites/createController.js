const FavoriteRoute = require('../../models/FavoriteRoute');

const addFavorite = async (req, res) => {
  try {
    const { name, origin, destination, waypoints, travelMode, icon, color } = req.body;
    
    if (!name || !origin || !destination) {
      return res.status(400).json({
        success: false,
        message: 'Informations manquantes: nom, origine et destination sont requis'
      });
    }
    
    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      return res.status(400).json({
        success: false,
        message: 'Les coordonnées d\'origine et de destination sont requises'
      });
    }
    
    const existingSimilar = await FavoriteRoute.findOne({
      user: req.user.id,
      'origin.lat': origin.lat,
      'origin.lng': origin.lng,
      'destination.lat': destination.lat,
      'destination.lng': destination.lng
    });
    
    if (existingSimilar) {
      existingSimilar.useCount += 1;
      existingSimilar.lastUsed = new Date();
      await existingSimilar.save();
      
      return res.json({
        success: true,
        message: 'Trajet similaire trouvé et mis à jour',
        favorite: existingSimilar
      });
    }
    
    const favoriteRoute = new FavoriteRoute({
      user: req.user.id,
      name: name.trim(),
      origin,
      destination,
      waypoints: waypoints || [],
      travelMode: travelMode || 'DRIVING',
      icon: icon || 'route',
      color: color || '#4285F4',
      lastUsed: new Date()
    });
    
    await favoriteRoute.save();
    
    res.status(201).json({
      success: true,
      message: 'Trajet ajouté aux favoris',
      favorite: favoriteRoute
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'ajout du trajet favori',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  addFavorite
};