const authService = require('../../services/authService');

/**
 * Contrôleur pour la connexion des utilisateurs
 */
const loginController = async (req, res) => {
  try {
    // Sanitization des entrées
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : '';
    const password = req.body.password ? String(req.body.password) : '';
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false,
        message: 'Email et mot de passe requis' 
      });
    }

    // Appel au service d'authentification
    const result = await authService.loginUser(email, password);

    // Réponse
    return res.json({
      success: true,
      token: result.token,
      user: result.user
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de la connexion'
    });
  }
};

module.exports = loginController;