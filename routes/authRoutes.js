const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, isAdmin } = require('../middlewares/middlewares');

// Routes d'authentification de base
router.post('/register', authController.register);
router.post('/login', authController.login);
// Protéger la déconnexion
router.post('/logout', isAuthenticated, authController.logout);
router.get('/me', isAuthenticated, authController.me);

// Routes d'authentification Google
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);
router.post('/google/mobile', authController.mobileGoogleAuth);
router.get('/google/web', authController.googleWebAuth);
router.get('/google/web/callback', authController.googleWebCallback);

// Routes d'administration
// Double protection pour les routes administratives
router.put('/promote/:userId', isAuthenticated, isAdmin, authController.promoteToAdmin);
router.put('/demote/:userId', isAuthenticated, isAdmin, authController.demoteToUser);
router.get('/users', isAuthenticated, isAdmin, authController.getAllUsers);

// Routes de succès/échec
router.get('/success', authController.authSuccess);
router.get('/failure', authController.authFailure);

module.exports = router;