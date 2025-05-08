const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth'); 
const isAdmin = require('../middleware/isAdmin');

// Toutes les routes admin nécessitent l'authentification et des droits admin
router.use(authMiddleware);
router.use(isAdmin);

// Routes de gestion des utilisateurs
router.get('/users', authController.getAllUsers);
router.post('/users/:userId/promote', authController.promoteToAdmin);
router.post('/users/:userId/demote', authController.demoteToUser);

module.exports = router;