const authController = {
  /**
   * Déconnecte l'utilisateur
   */
  logout: (req, res) => {
    if (req.logout) {
      req.logout();
    }
    if (req.session) {
      req.session.destroy();
    }
    res.json({
      success: true,
      message: 'Déconnexion réussie'
    });
  }
};

module.exports = authController;