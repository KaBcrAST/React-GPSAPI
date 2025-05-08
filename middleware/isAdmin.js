module.exports = (req, res, next) => {
  try {
    // On suppose que req.user a déjà été défini par le middleware auth
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé: privilèges administrateur requis' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Erreur d\'authentification' });
  }
};