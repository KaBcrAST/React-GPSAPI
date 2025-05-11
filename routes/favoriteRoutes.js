const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favorites');
const { isAuthenticated } = require('../middlewares/middlewares');

router.use(isAuthenticated);

router.get('/', favoritesController.getAllFavorites);
router.get('/:id', favoritesController.getFavoriteById);
router.post('/add', favoritesController.addFavorite);
router.put('/:id', favoritesController.updateFavorite);
router.delete('/:id', favoritesController.deleteFavorite);

router.post('/:id/use', favoritesController.useFavorite);

module.exports = router;