const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Token d\'authentification manquant' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Ajouter toutes les infos du token au req.user
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ message: 'Échec de l\'authentification' });
  }
};