const authService = require('../../services/authService');

/**
 * Contrôleur pour les opérations liées au profil utilisateur
 */
const profileController = {
  /**
   * Récupère les informations de l'utilisateur connecté
   */
  me: async (req, res) => {
    try {
      const userId = req.user.id;
      
      // Appel au service d'authentification
      const user = await authService.getUserById(userId);
      
      res.json({
        success: true,
        user
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Erreur lors de la récupération des informations utilisateur'
      });
    }
  },

  /**
   * Déconnecte l'utilisateur
   */
  logout: (req, res) => {
    if (req.logout) {
      req.logout();
    }
    if (req.session) {
      req.session.destroy();
    }
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  }
};

module.exports = profileController;