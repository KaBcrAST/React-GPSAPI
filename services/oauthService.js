const axios = require('axios');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

class OAuthService {
  static async getGoogleTokens(code, redirectUri) {
    try {
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });
      return response.data;
    } catch (error) {
      console.error('Google token error:', error.response?.data || error.message);
      throw new Error('Failed to get Google tokens');
    }
  }

  static async getGoogleUserInfo(access_token) {
    try {
      const response = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${access_token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Google user info error:', error.response?.data || error.message);
      throw new Error('Failed to get user info');
    }
  }

  static async findOrCreateUser(userData) {
    try {
      let user = await User.findOne({ email: userData.email });
      
      if (!user) {
        user = await User.create({
          email: userData.email,
          name: userData.name,
          googleId: userData.sub,
          picture: userData.picture
        });
      } else {
        user.lastLogin = new Date();
        user.picture = userData.picture;
        await user.save();
      }
      
      return user;
    } catch (error) {
      console.error('User management error:', error);
      throw new Error('Failed to manage user');
    }
  }

  static generateToken(user) {
    return jwt.sign(
      { 
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
  }
}

module.exports = OAuthService;