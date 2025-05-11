const User = require('../../models/User');
const validator = require('validator');
const authService = require('../../services/authService');

const infoController = {
  getProfile: async (req, res) => {
    try {
      const userId = req.user.id;
      
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
  
  me: async (req, res) => {
    try {
      const user = await User.findById(req.user.id, { password: 0, __v: 0 });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role,
          lastLogin: user.lastLogin
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération du profil'
      });
    }
  },

  updateEmail: async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || !validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email invalide'
        });
      }

      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé par un autre compte'
        });
      }

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { email: email.toLowerCase().trim() },
        { new: true, select: '-password -__v' }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Email mis à jour avec succès',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Update email error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour de l\'email'
      });
    }
  },

  updateName: async (req, res) => {
    try {
      const { name } = req.body;
      
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Nom invalide (minimum 2 caractères)'
        });
      }

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { name: name.trim() },
        { new: true, select: '-password -__v' }
      );

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      res.json({
        success: true,
        message: 'Nom mis à jour avec succès',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Update name error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la mise à jour du nom'
      });
    }
  },
};

module.exports = infoController;