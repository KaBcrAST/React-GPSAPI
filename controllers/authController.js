const passport = require('passport');
const jwt = require('jsonwebtoken');

exports.googleAuth = passport.authenticate('google', { scope: ['email', 'profile'] });

exports.googleAuthCallback = passport.authenticate('google', {
  failureRedirect: '/auth/google/failure'
});

exports.authSuccess = (req, res) => {
  // Générer un token JWT
  const token = jwt.sign({ name: req.user.displayName, email: req.user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  // Rediriger vers la page d'accueil avec le token dans les query params
  res.redirect(`http://localhost:3000/oauth-redirect?token=${token}`);
};

exports.authFailure = (req, res) => {
  res.send('Failed to authenticate..');
};

exports.logout = (req, res) => {
  req.logout();
  req.session.destroy();
  res.send('Goodbye!');
};