const jwt = require('jsonwebtoken');

/**
 * Service gérant les tokens JWT
 */
class TokenService {
  /**
   * Génère un token JWT pour un utilisateur
   * @param {Object} user - Utilisateur
   * @returns {string} Token JWT
   */
  generateToken(user) {
    return jwt.sign(
      { 
        id: user._id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        picture: user.picture
      }, 
      process.env.JWT_SECRET, 
      { expiresIn: '24h' }
    );
  }

  /**
   * Vérifie un token JWT
   * @param {string} token - Token à vérifier
   * @returns {Object} Payload décodé
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw new Error('Token invalide ou expiré');
    }
  }
}

module.exports = new TokenService();