const User = require('../models/User');
const bcrypt = require('bcryptjs');
const tokenService = require('./tokenService');

class AuthService {
  /**
   * 
   * @param {Object} userData - 
   * @returns {Object} 
   */
  async registerUser(userData) {
    const { name, email, password } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('Cet email est déjà utilisé');
      error.statusCode = 400;
      throw error;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    const token = tokenService.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * @param {string} email 
   * @param {string} password 
   * @returns {Object} 
   */
  async loginUser(email, password) {
    const user = await User.findOne({ email });
    if (!user) {
      const error = new Error('Identifiants incorrects');
      error.statusCode = 400;
      throw error;
    }


    let passwordMatch;

    if (user.googleId && !user.password) {
      const error = new Error('Veuillez vous connecter avec Google');
      error.statusCode = 400;
      throw error;
    }

    if (user.password.length === 64) {
      passwordMatch = password === user.password;
      
      if (passwordMatch) {
        user.password = await bcrypt.hash(password, 10);
        await user.save();
      }
    } else {
      passwordMatch = await bcrypt.compare(password, user.password);
    }

    if (!passwordMatch) {
      const error = new Error('Identifiants incorrects');
      error.statusCode = 400;
      throw error;
    }

    user.lastLogin = Date.now();
    await user.save();

    const token = tokenService.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * @param {Object} userData 
   * @returns {Object}
   */
  async handleGoogleAuth(userData) {
    const { email, name, picture, sub: googleId } = userData;

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
      user.picture = picture;
      user.lastLogin = new Date();
      await user.save();
    }

    const token = tokenService.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token
    };
  }

  /**
   * @param {string} userId 
   * @param {string} role 
   * @returns {Object}
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
   * @returns {Array} 
   */
  async getAllUsers() {
    return User.find({}, { password: 0, __v: 0 }).limit(100);
  }

  /**
   * @param {string} userId 
   * @returns {Object}
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
   * @param {Object} user 
   * @returns {Object} 
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