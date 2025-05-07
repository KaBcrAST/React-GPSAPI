const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['ACCIDENT', 'TRAFFIC_JAM', 'ROAD_CLOSED', 'POLICE', 'OBSTACLE']
  },
  location: {
    type: {
      type: String,
      default: 'Point',
      required: true
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 600 // Les rapports expirent après 10 minutes (600 secondes)
  },
  upvotes: {
    type: Number,
    default: 0
  }
}, {
  collection: 'reports'
});

// Index géospatial pour les recherches de proximité
reportSchema.index({ location: '2dsphere' });

// Middleware pre-save pour assurer la compatibilité avec le frontend
reportSchema.pre('save', function(next) {
  // Si les coordonnées sont envoyées séparément
  if (!this.location || !this.location.coordinates) {
    if (this._latitude && this._longitude) {
      this.location = {
        type: 'Point',
        coordinates: [this._longitude, this._latitude]
      };
    }
  }
  next();
});

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;