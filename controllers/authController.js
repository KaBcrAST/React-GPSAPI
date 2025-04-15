const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const axios = require('axios');

const transporter = nodemailer.createTransport({
  host: 'smtp-mail.outlook.com', // or 'smtp.gmail.com'
  port: 587,
  secure: false,
  auth: {
    user: process.env.GENERIC_EMAIL, // e.g., 'noreply.gpsapp@outlook.com'
    pass: process.env.GENERIC_PASSWORD
  }
});

const sendVerificationEmail = async (email, verificationToken) => {
  const verificationLink = `${process.env.FRONTEND_URL}/verify/${verificationToken}`;
  
  const mailOptions = {
    from: '"GPS App" <noreply.gpsapp@outlook.com>',
    to: email,
    subject: 'Vérifiez votre compte GPS',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Bienvenue sur GPS App!</h1>
        <p>Merci de vous être inscrit. Pour activer votre compte, veuillez cliquer sur le lien ci-dessous :</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationLink}" 
             style="background-color: #4CAF50; color: white; padding: 15px 25px; 
                    text-decoration: none; border-radius: 5px;">
            Vérifier mon compte
          </a>
        </div>
        <p>Si le bouton ne fonctionne pas, copiez et collez ce lien dans votre navigateur :</p>
        <p>${verificationLink}</p>
        <p>Ce lien expirera dans 24 heures.</p>
      </div>
    `
  };

  await transporter.sendMail(mailOptions);
};

const authController = {
  register: async (req, res) => {
    try {
      const { email, username, password } = req.body;
      
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      // Create verification token
      const verificationToken = crypto.randomBytes(32).toString('hex');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const user = new User({
        email,
        username,
        password: hashedPassword,
        verificationToken,
        isVerified: false
      });

      await user.save();

      // Send verification email
      await sendVerificationEmail(email, verificationToken);

      res.status(201).json({ 
        message: 'Un email de vérification a été envoyé à votre adresse email',
        token: jwt.sign({ id: user._id }, process.env.JWT_SECRET)
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
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

      // Créer ou mettre à jour l'utilisateur avec la photo
      let user = await User.findOne({ email: userData.email });
      if (!user) {
        user = await User.create({
          email: userData.email,
          name: userData.name,
          picture: userData.picture, // Ajouter l'URL de la photo
          googleId: userData.sub
        });
      } else {
        user.picture = userData.picture; // Mettre à jour la photo
        await user.save();
      }

      // Inclure la photo dans la réponse
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

      // Rediriger vers l'app mobile avec le token
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