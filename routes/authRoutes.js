const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/google', authController.googleAuth);
router.get('/google/callback', authController.googleAuthCallback, authController.authSuccess);
router.get('/google/failure', authController.authFailure);
router.get('/logout', authController.logout);

module.exports = router;