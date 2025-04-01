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
    expires: 7200 // Reports expire after 2 hours
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

module.exports = mongoose.model('Report', reportSchema);