const axios = require('axios');
const authService = require('../../services/authService');

/**
 * Contrôleur pour l'authentification Google
 */
const googleAuthController = {
  /**
   * Initie l'authentification Google
   */
  googleAuth: (req, res) => {
    try {
      const redirectUri = `${process.env.API_URL}/api/auth/google/callback`;
      const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile`;

      res.redirect(url);
    } catch (error) {
      console.error('Google auth error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'authentification Google'
      });
    }
  },

  /**
   * Callback pour l'authentification Google
   */
  googleAuthCallback: async (req, res) => {
    try {
      const code = req.query.code;
      const redirectUri = `${process.env.API_URL}/api/auth/google/callback`;

      // Échange du code contre un token
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      // Récupération des infos utilisateur
      const userInfoResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` } }
      );

      const userData = userInfoResponse.data;
      
      // Traitement de l'authentification
      const result = await authService.handleGoogleAuth(userData);

      // Redirection vers l'app
      res.redirect(`gpsapp://auth?token=${result.token}&user=${encodeURIComponent(JSON.stringify(result.user))}`);

    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect('gpsapp://auth/error');
    }
  },
  
  /**
   * Authentification Google pour applications mobiles
   */
  mobileGoogleAuth: async (req, res) => {
    try {
      const { email, name, picture } = req.body;
      
      const userData = { email, name, picture, sub: email };
      
      // Traitement de l'authentification
      const result = await authService.handleGoogleAuth(userData);

      res.json({
        success: true,
        token: result.token,
        user: result.user
      });
    } catch (error) {
      console.error('Mobile Google auth error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Erreur lors de l\'authentification Google mobile' 
      });
    }
  },
  
  /**
   * Authentification Google pour applications web
   */
  googleWebAuth: (req, res) => {
    try {
      const redirectUri = `${process.env.API_URL}/api/auth/google/web/callback`;

      const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=openid%20email%20profile&` +
        `access_type=offline&` +
        `prompt=consent`;

      res.redirect(url);
    } catch (error) {
      console.error('Google web auth error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=Configuration error`);
    }
  },
  
  /**
   * Callback pour l'authentification Google web
   */
  googleWebCallback: async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        throw new Error('No authorization code received');
      }

      const redirectUri = `${process.env.API_URL}/api/auth/google/web/callback`;

      // Échange du code contre un token
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      const { access_token } = tokenResponse.data;
      if (!access_token) {
        throw new Error('No access token received');
      }

      // Récupération des infos utilisateur
      const userInfoResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      const userData = userInfoResponse.data;
      
      // Traitement de l'authentification
      const result = await authService.handleGoogleAuth(userData);

      // Redirection vers le frontend
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectURL = `${frontendURL}/oauth-callback?` +
        `token=${encodeURIComponent(result.token)}&` +
        `user=${encodeURIComponent(JSON.stringify(result.user))}`;

      res.redirect(redirectURL);

    } catch (error) {
      console.error('Google web callback error:', error);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendURL}/login?error=${encodeURIComponent(error.message)}`);
    }
  }
};

module.exports = googleAuthController;