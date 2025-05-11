const FavoriteRoute = require('../../models/FavoriteRoute');

/**
 * Récupère tous les trajets favoris d'un utilisateur
 * GET /api/favorites/get
 */
const getAllFavorites = async (req, res) => {
  try {
    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Options de tri
    const sortField = req.query.sortField || 'useCount';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
    const sortOptions = {};
    sortOptions[sortField] = sortOrder;
    
    // Exécuter la requête
    const favorites = await FavoriteRoute.find({ user: req.user.id })
      .sort(sortOptions)
      .skip(skip)
      .limit(limit);
    
    // Compter le nombre total pour la pagination
    const total = await FavoriteRoute.countDocuments({ user: req.user.id });
    
    res.json({
      success: true,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      favorites
    });
  } catch (error) {
    console.error('Get all favorites error:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des trajets favoris'
    });
  }
};

module.exports = {
  getAllFavorites
};