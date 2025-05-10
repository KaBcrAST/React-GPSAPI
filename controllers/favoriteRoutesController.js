const FavoriteRoute = require('../models/FavoriteRoute');
const validator = require('validator');

/**
 * Contrôleur pour gérer les opérations sur les trajets favoris
 */
const favoriteRoutesController = {
  /**
   * Récupère tous les trajets favoris d'un utilisateur
   * GET /api/favorites
   */
  getAllFavorites: async (req, res) => {
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
  },

  /**
   * Récupère un trajet favori par son ID
   * GET /api/favorites/:id
   */
  getFavoriteById: async (req, res) => {
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
  },

  /**
   * Ajoute un nouveau trajet favori
   * POST /api/favorites
   */
  addFavorite: async (req, res) => {
    try {
      const { name, origin, destination, waypoints, travelMode, icon, color } = req.body;
      
      // Validation des données requises
      if (!name || !origin || !destination) {
        return res.status(400).json({
          success: false,
          message: 'Informations manquantes: nom, origine et destination sont requis'
        });
      }
      
      // Vérification des coordonnées
      if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
        return res.status(400).json({
          success: false,
          message: 'Les coordonnées d\'origine et de destination sont requises'
        });
      }
      
      // Vérifier si un trajet similaire existe déjà (même origine et destination)
      const existingSimilar = await FavoriteRoute.findOne({
        user: req.user.id,
        'origin.lat': origin.lat,
        'origin.lng': origin.lng,
        'destination.lat': destination.lat,
        'destination.lng': destination.lng
      });
      
      if (existingSimilar) {
        // Mettre à jour le compteur et la date d'utilisation
        existingSimilar.useCount += 1;
        existingSimilar.lastUsed = new Date();
        await existingSimilar.save();
        
        return res.json({
          success: true,
          message: 'Trajet similaire trouvé et mis à jour',
          favorite: existingSimilar
        });
      }
      
      // Créer un nouveau trajet favori
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
  },

  /**
   * Met à jour un trajet favori existant
   * PUT /api/favorites/:id
   */
  updateFavorite: async (req, res) => {
    try {
      const favoriteId = req.params.id;
      const { name, origin, destination, waypoints, travelMode, icon, color } = req.body;
      
      if (!validator.isMongoId(favoriteId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de trajet invalide'
        });
      }
      
      // Vérifier si le trajet existe et appartient à l'utilisateur
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
      
      // Mettre à jour les champs modifiables
      if (name) favorite.name = name.trim();
      if (origin) favorite.origin = origin;
      if (destination) favorite.destination = destination;
      if (waypoints) favorite.waypoints = waypoints;
      if (travelMode) favorite.travelMode = travelMode;
      if (icon) favorite.icon = icon;
      if (color) favorite.color = color;
      
      // Incrémenter le compteur d'utilisation
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
  },

  /**
   * Supprime un trajet favori
   * DELETE /api/favorites/:id
   */
  deleteFavorite: async (req, res) => {
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
  },

  /**
   * Marque un trajet favori comme utilisé (incrémente le compteur)
   * POST /api/favorites/:id/use
   */
  useFavorite: async (req, res) => {
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
  }
};

module.exports = favoriteRoutesController;