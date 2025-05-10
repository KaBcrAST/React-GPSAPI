const mongoose = require('mongoose');

const favoriteRouteSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  origin: {
    name: String,
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    address: String
  },
  destination: {
    name: String,
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    address: String
  },
  waypoints: [{
    name: String,
    lat: Number,
    lng: Number,
    address: String
  }],
  travelMode: {
    type: String,
    enum: ['DRIVING', 'WALKING', 'BICYCLING', 'TRANSIT'],
    default: 'DRIVING'
  },
  icon: {
    type: String,
    default: 'route'
  },
  color: {
    type: String,
    default: '#4285F4'
  },
  useCount: {
    type: Number,
    default: 0
  },
  lastUsed: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ajouter des index pour améliorer les performances des requêtes
favoriteRouteSchema.index({ user: 1, createdAt: -1 });
favoriteRouteSchema.index({ user: 1, useCount: -1 });

module.exports = mongoose.model('FavoriteRoute', favoriteRouteSchema);