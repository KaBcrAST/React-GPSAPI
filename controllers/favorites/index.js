const { getAllFavorites } = require('./listController');
const { getFavoriteById } = require('./getController');
const { addFavorite } = require('./createController');
const { updateFavorite } = require('./updateController');
const { deleteFavorite } = require('./deleteController');
const { useFavorite } = require('./usageController');

module.exports = {
  getAllFavorites,
  getFavoriteById,
  addFavorite,
  updateFavorite,
  deleteFavorite,
  useFavorite
};