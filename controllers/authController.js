const passport = require('passport');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const crypto = require('crypto');

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

  googleAuth: passport.authenticate('google', { scope: ['email', 'profile'] }),

  googleAuthCallback: passport.authenticate('google', {
    failureRedirect: '/auth/google/failure',
    session: false // Add this to prevent session issues
  }),

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
    res.send('Failed to authenticate..');
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