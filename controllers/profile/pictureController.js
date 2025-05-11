const User = require('../../models/User');
const multer = require('multer');

// Configuration de multer pour stocker temporairement les images en mémoire
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

const pictureController = {
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
};

module.exports = pictureController;