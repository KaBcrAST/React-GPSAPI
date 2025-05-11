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
  originalReportId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: false
  }
}, {
  collection: 'reportsAll'
});

reportAllSchema.index({ location: '2dsphere' });

reportAllSchema.pre('save', function(next) {
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