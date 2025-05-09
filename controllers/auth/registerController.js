const validator = require('validator');
const authService = require('../../services/authService');

/**
 * Contrôleur pour l'inscription des utilisateurs
 */
const registerController = async (req, res) => {
  try {
    // Sanitization des entrées
    const name = req.body.name ? String(req.body.name).trim() : '';
    const email = req.body.email ? String(req.body.email).toLowerCase().trim() : '';
    const password = req.body.password ? String(req.body.password) : '';

    // Validation des entrées
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Tous les champs sont requis'
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Format d\'email invalide'
      });
    }

    // Appel au service d'authentification
    const result = await authService.registerUser({ name, email, password });

    // Réponse
    return res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      token: result.token,
      user: result.user
    });

  } catch (error) {
    console.error('Register error details:', error);
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'inscription',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = registerController;