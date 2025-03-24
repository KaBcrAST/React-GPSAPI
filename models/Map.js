const mongoose = require('mongoose');

const mapSchema = new mongoose.Schema({
  region: {
    latitude: {
      type: Number,
      required: true,
      default: 48.8566
    },
    longitude: {
      type: Number,
      required: true,
      default: 2.3522
    },
    latitudeDelta: {
      type: Number,
      required: true,
      default: 0.0922
    },
    longitudeDelta: {
      type: Number,
      required: true,
      default: 0.0421
    }
  },
  lastUpdate: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Map', mapSchema);