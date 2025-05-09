const User = require('../models/User');
const bcrypt = require('bcryptjs');
const tokenService = require('./tokenService');

/**
 * Service gérant l'authentification des utilisateurs
 */
class AuthService {
  /**
   * Inscrit un nouvel utilisateur
   * @param {Object} userData - Données de l'utilisateur
   * @returns {Object} Utilisateur créé et token
   */
  async registerUser(userData) {
    const { name, email, password } = userData;

    // Vérifier l'utilisateur existant
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('Cet email est déjà utilisé');
      error.statusCode = 400;
      throw error;
    }

    // Hacher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    // Générer le token
    const token = tokenService.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * Connecte un utilisateur
   * @param {string} email - Email de l'utilisateur
   * @param {string} password - Mot de passe
   * @returns {Object} Utilisateur et token
   */
  async loginUser(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('Identifiants incorrects');
      error.statusCode = 400;
      throw error;
    }

    // Vérification du mot de passe
    let passwordMatch;

    if (user.googleId && !user.password) {
      const error = new Error('Veuillez vous connecter avec Google');
      error.statusCode = 400;
      throw error;
    }

    if (user.password.length === 64) {
      // SHA-256 (ancien format)
      passwordMatch = password === user.password;
      
      // Migration vers bcrypt
      if (passwordMatch) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    } else {
      // Bcrypt
      passwordMatch = await bcrypt.compare(password, user.password);
    }

    if (!passwordMatch) {
      const error = new Error('Identifiants incorrects');
      error.statusCode = 400;
      throw error;
    }

    // Mettre à jour la date de dernière connexion
    user.lastLogin = Date.now();
    await user.save();

    // Générer le token
    const token = tokenService.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * Gère l'authentification Google
   * @param {Object} userData - Données de l'utilisateur Google
   * @returns {Object} Utilisateur et token
   */
  async handleGoogleAuth(userData) {
    const { email, name, picture, sub: googleId } = userData;

    // Trouver ou créer l'utilisateur
    let user = await User.findOne({ email });
    
    if (!user) {
      user = await User.create({
        email,
        name,
        googleId,
        picture,
        role: 'user'
      });
    } else {
      // Mettre à jour l'utilisateur existant
      user.picture = picture;
      user.lastLogin = new Date();
      await user.save();
    }

    // Générer le token
    const token = tokenService.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * Change le rôle d'un utilisateur
   * @param {string} userId - ID de l'utilisateur
   * @param {string} role - Nouveau rôle ('user' ou 'admin')
   * @returns {Object} Utilisateur mis à jour
   */
  async changeUserRole(userId, role) {
    if (!['user', 'admin'].includes(role)) {
      const error = new Error('Rôle invalide');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('Utilisateur non trouvé');
      error.statusCode = 404;
      throw error;
    }

    user.role = role;
    await user.save();

    return this.sanitizeUser(user);
  }

  /**
   * Récupère tous les utilisateurs
   * @returns {Array} Liste des utilisateurs
   */
  async getAllUsers() {
    return User.find({}, { password: 0, __v: 0 }).limit(100);
  }

  /**
   * Récupère un utilisateur par ID
   * @param {string} userId - ID de l'utilisateur
   * @returns {Object} Utilisateur
   */
  async getUserById(userId) {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('Utilisateur non trouvé');
      error.statusCode = 404;
      throw error;
    }
    return this.sanitizeUser(user);
  }

  /**
   * Nettoie les données utilisateur sensibles
   * @param {Object} user - Utilisateur
   * @returns {Object} Utilisateur sans données sensibles
   */
  sanitizeUser(user) {
    const sanitized = user.toObject ? user.toObject() : { ...user };
    delete sanitized.password;
    delete sanitized.__v;
    return {
      id: sanitized._id,
      name: sanitized.name,
      email: sanitized.email,
      role: sanitized.role,
      picture: sanitized.picture
    };
  }
}

module.exports = new AuthService();