const register = require('./registerController');
const login = require('./loginController');
const google = require('./googleAuthController');
const admin = require('./adminController');
const profile = require('./profileController');

module.exports = {
  register,
  login,
  googleAuth: google.googleAuth,
  googleAuthCallback: google.googleAuthCallback,
  mobileGoogleAuth: google.mobileGoogleAuth,
  googleWebAuth: google.googleWebAuth,
  googleWebCallback: google.googleWebCallback,
  promoteToAdmin: admin.promoteToAdmin,
  demoteToUser: admin.demoteToUser,
  getAllUsers: admin.getAllUsers,
  me: profile.me,
  logout: profile.logout,
  authSuccess: (req, res) => {
    res.json({
      success: true,
      message: 'Authentification réussie'
    });
  },
  authFailure: (req, res) => {
    res.status(401).json({
      success: false,
      message: 'Échec de l\'authentification'
    });
  }
};