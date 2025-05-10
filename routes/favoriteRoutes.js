const express = require('express');
const router = express.Router();
const favoriteRoutesController = require('../controllers/favoriteRoutesController');
const { isAuthenticated } = require('../middlewares/middlewares');

// Toutes les routes sont protégées par le middleware d'authentification
router.use(isAuthenticated);

// Routes CRUD
router.get('/', favoriteRoutesController.getAllFavorites);
router.get('/:id', favoriteRoutesController.getFavoriteById);
router.post('/add', favoriteRoutesController.addFavorite);
router.put('/:id', favoriteRoutesController.updateFavorite);
router.delete('/:id', favoriteRoutesController.deleteFavorite);

// Route pour marquer un trajet comme utilisé
router.post('/:id/use', favoriteRoutesController.useFavorite);

module.exports = router;