const mongoose = require('mongoose');

const reportAllSchema = new mongoose.Schema({
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
  }
});

reportAllSchema.index({ location: '2dsphere' });
module.exports = mongoose.model('ReportAll', reportAllSchema);