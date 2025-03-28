const Report = require('../models/Report');

const reportController = {
  createReport: async (req, res) => {
    try {
      const { type, latitude, longitude } = req.body;

      if (!type || !latitude || !longitude) {
        return res.status(400).json({ 
          error: 'Missing required fields: type, latitude, longitude' 
        });
      }

      const report = new Report({
        type,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      });

      await report.save();

      res.status(201).json(report);
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  },

  getNearbyReports: async (req, res) => {
    try {
      const { latitude, longitude, maxDistance = 5000 } = req.query; // maxDistance in meters

      if (!latitude || !longitude) {
        return res.status(400).json({ 
          error: 'Missing required fields: latitude, longitude' 
        });
      }

      const reports = await Report.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: parseInt(maxDistance)
          }
        }
      });

      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  },

  upvoteReport: async (req, res) => {
    try {
      const { reportId } = req.params;
      
      const report = await Report.findByIdAndUpdate(
        reportId,
        { $inc: { upvotes: 1 } },
        { new: true }
      );

      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }

      res.json(report);
    } catch (error) {
      console.error('Error upvoting report:', error);
      res.status(500).json({ error: 'Failed to upvote report' });
    }
  }
};

module.exports = reportController;