const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favorites');
const { isAuthenticated } = require('../middlewares/middlewares');

// Toutes les routes sont protégées par le middleware d'authentification
router.use(isAuthenticated);

// Routes CRUD
router.get('/get', favoritesController.getAllFavorites);
router.get('/:id', favoritesController.getFavoriteById);
router.post('/add', favoritesController.addFavorite);
router.put('/:id', favoritesController.updateFavorite);
router.delete('/:id', favoritesController.deleteFavorite);

// Route pour marquer un trajet comme utilisé
router.post('/:id/use', favoritesController.useFavorite);

module.exports = router;