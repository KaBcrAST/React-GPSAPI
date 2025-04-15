const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const axios = require('axios');
const CryptoJS = require('crypto-js');

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'votre-clé-très-complexe-ici';

const decryptData = (encryptedData) => {
  try {
    const bytes = CryptoJS.AES.decrypt(encryptedData, ENCRYPTION_KEY);
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
  } catch (error) {
    console.error('Decryption error:', error);
    throw error;
  }
};

const authController = {
  register: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = await User.create({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword
      });

      const token = jwt.sign(
        { id: user._id, name: user.name, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.status(201).json({
        success: true,
        token,
        user: {
          name: user.name,
          email: user.email
        }
      });

    } catch (error) {
      console.error('Register error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'inscription'
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      
      if (!user) {
        return res.status(400).json({ message: 'User not found' });
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: 'Invalid password' });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
      res.json({ token });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },

  googleAuth: (req, res) => {
    const redirectUri = `${process.env.API_URL}/auth/google/callback`;
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
      const redirectUri = `${process.env.API_URL}/auth/google/callback`;

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
      console.log('Google user data:', userData); // Pour déboguer

      // Trouver ou créer l'utilisateur avec la photo
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create({
          email: userData.email,
          name: userData.name,
          googleId: userData.sub,
          picture: userData.picture // Ajouter l'URL de la photo
        });
      } else {
        // Mettre à jour les informations, y compris la photo
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
      const { accessToken } = req.body;
      
      // Vérifier le token avec l'API Google
      const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const googleUserData = await response.json();
      
      if (!googleUserData.email) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid Google token' 
        });
      }

      // Trouver ou créer l'utilisateur
      let user = await User.findOne({ email: googleUserData.email });
      
      if (!user) {
        user = await User.create({
          email: googleUserData.email,
          name: googleUserData.name,
          googleId: googleUserData.sub
        });
      }

      // Mettre à jour la date de dernière connexion
      user.lastLogin = new Date();
      await user.save();

      // Générer le JWT
      const token = jwt.sign(
        { 
          id: user._id,
          name: user.name,
          email: user.email
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        token,
        user: {
          name: user.name,
          email: user.email
        }
      });
    } catch (error) {
      console.error('Mobile Google auth error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Authentication failed' 
      });
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
  }
};

module.exports = authController;