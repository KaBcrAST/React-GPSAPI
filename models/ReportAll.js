const mongoose = require('mongoose');

const reportAllSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['ACCIDENT', 'TRAFFIC_JAM', 'ROAD_CLOSED', 'POLICE', 'OBSTACLE']
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      required: true
    }
  },
  upvotes: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  // Champ optionnel pour traçabilité
  originalReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: false
  }
}, {
  collection: 'reportsAll'
});

// Index géospatial pour les recherches de proximité
reportAllSchema.index({ location: '2dsphere' });

// Middleware pre-save pour assurer la compatibilité avec le frontend
reportAllSchema.pre('save', function(next) {
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

const ReportAll = mongoose.model('ReportAll', reportAllSchema);
module.exports = ReportAll;