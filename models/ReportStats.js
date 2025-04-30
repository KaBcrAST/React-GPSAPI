const mongoose = require('mongoose');

const reportStatsSchema = new mongoose.Schema({
  originalReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report'
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
    default: Date.now,
    expires: 86400 // Expire après 24h
  }
});

reportStatsSchema.index({ location: '2dsphere' });
reportStatsSchema.index({ createdAt: 1 }, { expireAfterSeconds: 86400 }); // TTL index

module.exports = mongoose.model('ReportStats', reportStatsSchema);