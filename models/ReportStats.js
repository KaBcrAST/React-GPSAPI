const mongoose = require('mongoose');

const reportStatsSchema = new mongoose.Schema({
  originalReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['accident', 'police', 'danger', 'traffic', 'other']
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
  expiresAt: {
    type: Date,
    required: true
  }
});

reportStatsSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('ReportStats', reportStatsSchema);