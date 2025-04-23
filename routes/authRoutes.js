const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { validateAuth } = require('../middleware/validator');
const authMiddleware = require('../middleware/auth');

router.post('/register', validateAuth, authController.register);
router.post('/login', validateAuth, authController.login);

router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback, authController.authSuccess);
router.get('/google/failure', authController.authFailure);

router.post('/mobile/google', authController.mobileGoogleAuth);

router.get('/success', authController.authSuccess);
router.get('/logout', authController.logout);
router.get('/me', authMiddleware, authController.me);

module.exports = router;