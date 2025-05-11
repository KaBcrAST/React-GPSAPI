const infoController = require('./infoController');
const pictureController = require('./pictureController');
const authController = require('./authController');

module.exports = {
  // Info Controller
  getProfile: infoController.getProfile,
  me: infoController.me,
  updateEmail: infoController.updateEmail,
  updateName: infoController.updateName,

  // Picture Controller
  uploadProfilePicture: pictureController.uploadProfilePicture,
  deleteProfilePicture: pictureController.deleteProfilePicture,

  // Auth Controller
  logout: authController.logout
};