const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateAuth } = require('../middleware/validator');

// Routes d'authentification
router.post('/register', validateAuth, authController.register);
router.post('/login', validateAuth, authController.login);

// Routes d'authentification web
router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback, authController.authSuccess);
router.get('/google/failure', authController.authFailure);

// Route d'authentification mobile
router.post('/mobile/google', authController.mobileGoogleAuth);

router.get('/success', authController.authSuccess);
router.get('/logout', authController.logout);

module.exports = router;