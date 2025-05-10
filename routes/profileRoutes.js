const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const { isAuthenticated } = require('../middlewares/middlewares');

// Toutes les routes de profil nécessitent une authentification
router.use(isAuthenticated);

// Routes de profil
router.get('/', profileController.getProfile);
router.put('/email', profileController.updateEmail);
router.put('/name', profileController.updateName);
router.post('/picture', profileController.uploadProfilePicture);
router.delete('/picture', profileController.deleteProfilePicture);

module.exports = router;