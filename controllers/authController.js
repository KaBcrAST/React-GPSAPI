const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const validator = require('validator');

const authController = {
  register: async (req, res) => {
    try {
      const name = req.body.name ? String(req.body.name).trim() : '';
      const email = req.body.email ? String(req.body.email).toLowerCase().trim() : '';
      const password = req.body.password ? String(req.body.password) : '';

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis'
        });
      }

      if (!validator.isEmail(email)) {
        return res.status(400).json({
          success: false,
          message: 'Format d\'email invalide'
        });
      }


      const existingUser = await User.findOne({ email: email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        name: name,
        email: email,
        password: hashedPassword,
        role: 'user'
      });

      const token = jwt.sign(
        { 
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({
        success: true,
        message: 'Inscription réussie',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
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
      const email = req.body.email ? String(req.body.email).toLowerCase().trim() : '';
      const password = req.body.password ? String(req.body.password) : '';
      
      if (!email || !password) {
        return res.status(400).json({ 
          success: false,
          message: 'Email et mot de passe requis' 
        });
      }


      const user = await User.findOne({ email: email });
      if (!user) {
        return res.status(400).json({ 
          success: false,
          message: 'Identifiants incorrects' 
        });
      }
      
      if (user.googleId && !user.password) {
        return res.status(400).json({ 
          success: false,
          message: 'Veuillez vous connecter avec Google' 
        });
      }

      let passwordMatch;

      if (user.password.length === 64) {
        passwordMatch = password === user.password;
        
        if (passwordMatch) {
          user.password = await bcrypt.hash(password, 10);
          await user.save();
        }
      } else {
        passwordMatch = await bcrypt.compare(password, user.password);
      }

      if (!passwordMatch) {
        return res.status(400).json({ 
          success: false,
          message: 'Identifiants incorrects' 
        });
      }

      user.lastLogin = Date.now();
      await user.save();
      
      const token = jwt.sign(
        { 
          id: user._id, 
          name: user.name, 
          email: user.email, 
          role: user.role 
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
      );
      
      res.json({
        success: true,
        token,
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role,
          picture: user.picture
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        success: false,
        message: 'Erreur du serveur' 
      });
    }
  },

  promoteToAdmin: async (req, res) => {
    try {
      const userId = req.params.userId ? String(req.params.userId) : '';
      
      if (!validator.isMongoId(userId)) {
        return res.status(400).json({
          success: false,
          message: 'ID utilisateur invalide'
        });
      }
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      user.role = 'admin';
      await user.save();
      
      res.json({
        success: true,
        message: 'Utilisateur promu administrateur avec succès',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Promote to admin error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la promotion de l\'utilisateur'
      });
    }
  },

  demoteToUser: async (req, res) => {
    try {
      const userId = req.params.userId ? String(req.params.userId) : '';
      
      if (!validator.isMongoId(userId)) {
        return res.status(400).json({
          success: false,
          message: 'ID utilisateur invalide'
        });
      }
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Utilisateur non trouvé'
        });
      }
      
      user.role = 'user';
      await user.save();
      
      res.json({
        success: true,
        message: 'Administrateur rétrogradé avec succès',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Demote to user error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la rétrogradation de l\'administrateur'
      });
    }
  },

  getAllUsers: async (req, res) => {
    try {
      const users = await User.find({}, { password: 0, __v: 0 }).limit(100);
      
      res.json({
        success: true,
        users
      });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des utilisateurs'
      });
    }
  },

  googleAuth: (req, res) => {
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
      const redirectUri = `${process.env.API_URL}/api/auth/google/callback`;

      const tokenResponse = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      const userInfoResponse = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenResponse.data.access_token}` }
      });

      const userData = userInfoResponse.data;

      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create({
          email: userData.email,
          name: userData.name,
          googleId: userData.sub,
          picture: userData.picture,
          role: 'user'
        });
      } else {
        user.picture = userData.picture;
        user.lastLogin = new Date();
        await user.save();
      }

      const token = jwt.sign(
        { 
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.redirect(`gpsapp://auth?token=${token}&user=${encodeURIComponent(JSON.stringify({
        name: user.name,
        email: user.email,
        picture: user.picture,
        role: user.role
      }))}`);

    } catch (error) {
      console.error('Google auth callback error:', error);
      res.redirect('gpsapp://auth/error');
    }
  },

  mobileGoogleAuth: async (req, res) => {
    try {
      const { email, name, picture } = req.body;
      
      let user = await User.findOne({ email });
      
      if (!user) {
        user = await User.create({
          email,
          name,
          picture,
          googleId: email, 
          role: 'user'    
        });
      }

      const token = jwt.sign(
        { 
          id: user._id, 
          email: user.email,
          name: user.name,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: {
          id: user._id, 
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role
        }
      });
    } catch (error) {
      console.error('Mobile Google auth error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  authSuccess: (req, res) => {
    try {
      const token = jwt.sign(
        { 
          id: req.user._id,
          name: req.user.displayName, 
          email: req.user.email,
          role: req.user.role || 'user'
        }, 
        process.env.JWT_SECRET, 
        { expiresIn: '24h' }
      );

      res.json({ 
        success: true,
        token,
        user: {
          name: req.user.displayName,
          email: req.user.email,
          role: req.user.role || 'user'
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
  },

  me: async (req, res) => {
    try {
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
          id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role
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

  googleWebCallback: async (req, res) => {
    try {
      const { code } = req.query;
      if (!code) {
        throw new Error('No authorization code received');
      }

      const redirectUri = `${process.env.API_URL}/api/auth/google/web/callback`;

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

      const userInfoResponse = await axios.get(
        'https://www.googleapis.com/oauth2/v3/userinfo',
        { headers: { Authorization: `Bearer ${access_token}` } }
      );

      const userData = userInfoResponse.data;
      console.log('User data received:', {
        email: userData.email,
        name: userData.name
      });

      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create({
          email: userData.email,
          name: userData.name,
          googleId: userData.sub,
          picture: userData.picture,
          role: 'user'
        });
      } else {
        user.picture = userData.picture;
        user.lastLogin = new Date();
        await user.save();
      }

      const token = jwt.sign(
        { 
          id: user._id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          role: user.role
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      const redirectURL = `${frontendURL}/oauth-callback?` +
        `token=${encodeURIComponent(token)}&` +
        `user=${encodeURIComponent(JSON.stringify({
          id: user._id,
          name: user.name,
          email: user.email,
          picture: user.picture,
          role: user.role
        }))}`;

      res.redirect(redirectURL);

    } catch (error) {
      console.error('Google web callback error:', error);
      const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendURL}/login?error=${encodeURIComponent(error.message)}`);
    }
  }
};

module.exports = authController;