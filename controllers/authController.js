const passport = require('passport');

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const axios = require('axios');

// Supprimez la configuration nodemailer si vous ne l'utilisez pas encore

const authController = {
  register: async (req, res) => {
    try {
      console.log('Register attempt received:', req.body);
      const { name, email, password } = req.body;

      // Validation des données
      if (!name || !email || !password) {
        console.log('Missing required fields');
        return res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis'
        });
      }

      // Le mot de passe arrive déjà hashé en SHA256 du frontend
      console.log('Registering new user:', email);

      // Vérifier l'utilisateur existant
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }

      // Créer l'utilisateur
      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: password // Le password est déjà en SHA256
      });

      // Générer le token JWT
      const token = jwt.sign(
        { 
          id: user._id,
          name: user.name,
          email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Retourner la réponse
      return res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email
        }
      });

    } catch (error) {
      console.error('Register error details:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'inscription',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      console.log('Login attempt - received hash:', password);

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(400).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      // Comparaison directe des hash SHA256
      const passwordMatch = password === user.password;
      console.log('Stored hash:', user.password);
      console.log('Hash comparison result:', passwordMatch);

      if (!passwordMatch) {
        return res.status(400).json({
          success: false,
          message: 'Email ou mot de passe incorrect'
        });
      }

      const token = jwt.sign(
        { id: user._id, name: user.name, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        success: true,
        token,
        user: {
          name: user.name,
          email: user.email
        }
      });

    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de la connexion'
      });
    }
  },

  googleAuth: (req, res) => {
    // Mettre à jour l'URL de redirection pour inclure /api
    const redirectUri = `${process.env.API_URL}/api/auth/google/callback`;
    const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `response_type=code&` +
      `scope=openid%20email%20profile`;

    res.redirect(url);
  },

  googleAuthCallback: async (req, res) => {
    try {
      const code = req.query.code;
      // Mettre à jour l'URL de redirection pour inclure /api
      const redirectUri = `${process.env.API_URL}/api/auth/google/callback`;

      // Échange le code contre un token
      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      // Récupérer les infos utilisateur avec l'access token
      const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
      });

      const userData = userInfoResponse.data;
      console.log('Google user data:', userData);

      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create({
          email: userData.email,
          name: userData.name,
          googleId: userData.sub,
          picture: userData.picture
        });
      } else {
        user.picture = userData.picture;
        user.lastLogin = new Date();
        await user.save();
      }

      // Générer le JWT avec la photo
      const token = jwt.sign(
        { 
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture // Inclure la photo dans le token
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      // Rediriger vers l'app avec toutes les données
      res.redirect(`gpsapp://auth?token=${token}&user=${encodeURIComponent(JSON.stringify({
        name: user.name,
        email: user.email,
        picture: user.picture
      }))}`);

    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect('gpsapp://auth/error');
    }
  },

  mobileGoogleAuth: async (req, res) => {
    try {
      const { email, name, picture } = req.body;
      
      // Find or create user
      let user = await User.findOne({ email });
      
      if (!user) {
        user = await User.create({
          email,
          name,
          picture,
          googleId: email // Using email as googleId since we don't get it from mobile
        });
      }

      const token = jwt.sign(
        { 
          id: user._id, // Include the MongoDB _id
          email: user.email,
          name: user.name
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: {
          _id: user._id, // Include the MongoDB _id
          email: user.email,
          name: user.name,
          picture: user.picture
        }
      });
    } catch (error) {
      console.error('Mobile Google auth error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  authSuccess: (req, res) => {
    try {
      // Generate JWT token with user info
      const token = jwt.sign(
        { 
          id: req.user._id,
          name: req.user.displayName, 
          email: req.user.email 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
      );

      // Return JSON response instead of redirect
      res.json({ 
        success: true,
        token,
        user: {
          name: req.user.displayName,
          email: req.user.email
        }
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: 'Authentication failed' 
      });
    }
  },

  authFailure: (req, res) => {
    res.status(401).json({ 
      success: false, 
      message: 'Google authentication failed' 
    });
  },

  logout: (req, res) => {
    req.logout();
    req.session.destroy();
    res.send('Goodbye!');
  },

  verifyEmail: async (req, res) => {
    try {
      const { token } = req.params;
      
      const user = await User.findOne({ verificationToken: token });
      if (!user) {
        return res.status(400).json({ message: 'Token invalide' });
      }

      user.isVerified = true;
      user.verificationToken = undefined;
      await user.save();

      res.json({ message: 'Email vérifié avec succès' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  me: async (req, res) => {
    try {
      // req.user should be set by your auth middleware
      const user = await User.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        user: {
          _id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture
        }
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error' 
      });
    }
  },

  // Add new web-specific Google OAuth methods
  googleWebAuth: (req, res) => {
    try {
        const redirectUri = `${process.env.API_URL}/api/auth/google/web/callback`;
        console.log('Using redirect URI:', redirectUri);

        const url = `https://accounts.google.com/o/oauth2/v2/auth?` +
            `client_id=${process.env.GOOGLE_CLIENT_ID}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `response_type=code&` +
            `scope=openid%20email%20profile&` +
            `access_type=offline&` +
            `prompt=consent`;

        console.log('Redirecting to:', url);
        res.redirect(url);
    } catch (error) {
        console.error('Google web auth error:', error);
        res.redirect(`${process.env.FRONTEND_URL}/login?error=Configuration error`);
    }
},

googleWebCallback: async (req, res) => {
    try {
        const { code } = req.query;
        if (!code) {
            throw new Error('No authorization code received');
        }

        const redirectUri = `${process.env.API_URL}/api/auth/google/web/callback`;
        console.log('Callback received with code:', !!code);

        // Échange le code contre un token
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

        // Récupérer les infos utilisateur
        const userInfoResponse = await axios.get(
            'https://www.googleapis.com/oauth2/v3/userinfo',
            { headers: { Authorization: `Bearer ${access_token}` } }
        );

        const userData = userInfoResponse.data;
        console.log('User data received:', {
            email: userData.email,
            name: userData.name
        });

        // Créer ou mettre à jour l'utilisateur
        let user = await User.findOne({ email: userData.email });
        if (!user) {
            user = await User.create({
                email: userData.email,
                name: userData.name,
                googleId: userData.sub,
                picture: userData.picture
            });
        }

        // Générer le JWT
        const token = jwt.sign(
            { 
                id: user._id,
                email: user.email,
                name: user.name,
                picture: user.picture
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Redirection vers le frontend
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
        const redirectURL = `${frontendURL}/oauth-callback?` +
            `token=${encodeURIComponent(token)}&` +
            `user=${encodeURIComponent(JSON.stringify({
                name: user.name,
                email: user.email,
                picture: user.picture
            }))}`;

        console.log('Redirecting to frontend:', redirectURL);
        res.redirect(redirectURL);

    } catch (error) {
        console.error('Google web callback error:', error);
        const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
        res.redirect(`${frontendURL}/login?error=${encodeURIComponent(error.message)}`);
    }
},
};

module.exports = authController;