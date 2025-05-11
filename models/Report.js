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
    expires: 600 
  },
  upvotes: {
    type: Number,
    default: 0
  }
}, {
  collection: 'reports'
});

reportSchema.index({ location: '2dsphere' });

reportSchema.pre('save', function(next) {
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