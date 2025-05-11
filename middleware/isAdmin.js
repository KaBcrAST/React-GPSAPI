module.exports = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Non authentifié' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé: privilèges administrateur requis' });
    }
    
    next();
  } catch (error) {
    console.error('Admin authorization error:', error);
    res.status(500).json({ message: 'Erreur d\'autorisation' });
  }
};