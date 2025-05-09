const validator = require('validator');
const authService = require('../../services/authService');

/**
 * Contrôleur pour les opérations d'administration
 */
const adminController = {
  /**
   * Promeut un utilisateur en administrateur
   */
  promoteToAdmin: async (req, res) => {
    try {
      const userId = req.params.userId ? String(req.params.userId) : '';
      
      // Validation de l'ID MongoDB
      if (!validator.isMongoId(userId)) {
        return res.status(400).json({
          success: false,
          message: 'ID utilisateur invalide'
        });
      }
      
      // Appel au service d'authentification
      const user = await authService.changeUserRole(userId, 'admin');
      
      res.json({
        success: true,
        message: 'Utilisateur promu administrateur avec succès',
        user
      });
    } catch (error) {
      console.error('Promote to admin error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur lors de la promotion de l\'utilisateur'
      });
    }
  },

  /**
   * Rétrograde un administrateur en utilisateur
   */
  demoteToUser: async (req, res) => {
    try {
      const userId = req.params.userId ? String(req.params.userId) : '';
      
      // Validation de l'ID MongoDB
      if (!validator.isMongoId(userId)) {
        return res.status(400).json({
          success: false,
          message: 'ID utilisateur invalide'
        });
      }
      
      // Appel au service d'authentification
      const user = await authService.changeUserRole(userId, 'user');
      
      res.json({
        success: true,
        message: 'Administrateur rétrogradé avec succès',
        user
      });
    } catch (error) {
      console.error('Demote to user error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur lors de la rétrogradation de l\'administrateur'
      });
    }
  },

  /**
   * Récupère tous les utilisateurs
   */
  getAllUsers: async (req, res) => {
    try {
      const users = await authService.getAllUsers();
      
      res.json({
        success: true,
        users
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des utilisateurs'
      });
    }
  }
};

module.exports = adminController;