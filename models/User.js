const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    minlength: [2, 'Nom trop court'],
    maxlength: [50, 'Nom trop long'],
    validate: {
      validator: function(v) {
        return /^[a-zA-ZÀ-ÿ\s-]+$/.test(v);
      },
      message: 'Le nom contient des caractères invalides'
    }
  },
  email: {
    type: String,
    required: [true, 'Email requis'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Format d\'email invalide'
    }
  },
  password: {
    type: String,
    required: [true, 'Mot de passe requis'],
    minlength: [8, 'Le mot de passe doit contenir au moins 8 caractères'],
    // Retirons temporairement la validation du hash
    // validate: {
    //   validator: function(v) {
    //     return /^[a-f0-9]{64}$/.test(v);
    //   },
    //   message: 'Format de hash SHA256 invalide'
    // }
  },
  lastLogin: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index pour optimiser les recherches
UserSchema.index({ email: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);