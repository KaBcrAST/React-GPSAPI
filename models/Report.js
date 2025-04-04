const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['TRAFFIC', 'POLICE', 'ACCIDENT', 'DANGER']
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
    expires: 600 // 10 minutes en secondes
  },
  upvotes: {
    type: Number,
    default: 0
  }
}, {
  collection: 'reports' // Explicitly set collection name
});

// Add geospatial index
reportSchema.index({ location: '2dsphere' });

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;