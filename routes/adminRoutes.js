const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const isAdminMiddleware = require('../middleware/isAdmin');

// Protéger toutes les routes admin avec auth ET isAdmin
router.use(authMiddleware);
router.use(isAdminMiddleware);

// Routes pour la gestion des utilisateurs
router.post('/users/:userId/promote', authController.promoteToAdmin);
router.post('/users/:userId/demote', authController.demoteToUser);
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erreur du serveur' });
  }
});

module.exports = router;