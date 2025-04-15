const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  googleId: {
    type: String,
    sparse: true
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Requis seulement si pas de googleId
    }
  },
  picture: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);