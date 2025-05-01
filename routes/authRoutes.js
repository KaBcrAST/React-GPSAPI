const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateAuth } = require('../middleware/validator');
const authMiddleware = require('../middleware/auth');

// Existing routes
router.post('/register', validateAuth, authController.register);
router.post('/login', validateAuth, authController.login);

// Keep existing OAuth routes for mobile app
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback);
router.get('/google/failure', authController.authFailure);

// Add new web-specific OAuth routes
router.get('/google/web', authController.googleWebAuth);
router.get('/google/web/callback', authController.googleWebCallback);

// Keep other existing routes
router.post('/mobile/google', authController.mobileGoogleAuth);
router.get('/success', authController.authSuccess);
router.get('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);

module.exports = router;