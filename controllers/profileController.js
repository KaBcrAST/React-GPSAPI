const User = require('../models/User');
const validator = require('validator');
const multer = require('multer');
const authService = require('../services/authService');

// Configuration de multer pour stocker temporairement les images en mémoire
// (au lieu de les écrire sur le disque)
const storage = multer.memoryStorage();

// Filtrer les types de fichiers acceptés
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Format de fichier non supporté. Utilisez JPG, JPEG ou PNG.'), false);
  }
};

// Configuration de l'upload
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter
});

/**
 * Contrôleur unifié pour les opérations liées au profil utilisateur
 */
const profileController = {
  /**
   * Récupère les informations de l'utilisateur connecté
   */
  getProfile: async (req, res) => {
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
   * Alternative: Récupérer le profil utilisateur directement depuis le modèle
   */
  me: async (req, res) => {
    try {
      // Trouver l'utilisateur avec son ID (depuis le token JWT)
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

  /**
   * Mettre à jour l'email
   */
  updateEmail: async (req, res) => {
    try {
      const { email } = req.body;
      
      // Validation de base
      if (!email || !validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Email invalide'
        });
      }

      // Vérifier si l'email est déjà utilisé par un autre utilisateur
      const existingUser = await User.findOne({ email, _id: { $ne: req.user.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé par un autre compte'
        });
      }

      // Mettre à jour l'email
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

  /**
   * Télécharger et mettre à jour la photo de profil (stockage en base de données)
   */
  uploadProfilePicture: (req, res) => {
    // Le middleware multer s'occupe de l'upload
    const uploadMiddleware = upload.single('profilePicture');
    
    uploadMiddleware(req, res, async (err) => {
      if (err) {
        console.error('Upload middleware error:', err);
        return res.status(400).json({
          success: false,
          message: err.message || 'Erreur lors du téléchargement de l\'image'
        });
      }

      try {
        // Si aucun fichier n'a été téléchargé
        if (!req.file) {
          return res.status(400).json({
            success: false,
            message: 'Aucun fichier n\'a été téléchargé'
          });
        }

        console.log('File uploaded to memory:', req.file.originalname, req.file.size, 'bytes');
        
        // Construire l'image au format base64 pour stockage en BDD
        const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        // Mettre à jour la photo de profil dans la base de données
        const user = await User.findByIdAndUpdate(
          req.user.id,
          { picture: base64Image },
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
          message: 'Photo de profil mise à jour avec succès',
          user: {
            id: user._id,
            email: user.email,
            name: user.name,
            picture: user.picture,
            role: user.role
          }
        });
      } catch (error) {
        console.error('Profile picture upload error:', error);
        res.status(500).json({
          success: false,
          message: 'Erreur lors de la mise à jour de la photo de profil',
          error: error.message
        });
      }
    });
  },

  /**
   * Mettre à jour le nom d'utilisateur
   */
  updateName: async (req, res) => {
    try {
      const { name } = req.body;
      
      // Validation du nom
      if (!name || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Nom invalide (minimum 2 caractères)'
        });
      }

      // Mettre à jour le nom
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

  /**
   * Supprimer la photo de profil
   */
  deleteProfilePicture: async (req, res) => {
    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }

      // Mettre à jour l'utilisateur avec une photo à null
      user.picture = null;
      await user.save();

      res.json({
        success: true,
        message: 'Photo de profil supprimée avec succès',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Delete profile picture error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la suppression de la photo de profil'
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