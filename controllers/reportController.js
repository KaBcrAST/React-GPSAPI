const Report = require('../models/Report');
const trafficService = require('../services/trafficService');

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
      const { latitude, longitude, maxDistance = 5000 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({ 
          error: 'Missing required fields: latitude, longitude' 
        });
      }

      // Validate coordinates
      const parsedLat = parseFloat(latitude);
      const parsedLng = parseFloat(longitude);

      if (isNaN(parsedLat) || isNaN(parsedLng)) {
        return res.status(400).json({
          error: 'Invalid coordinates format'
        });
      }

      // Clean old reports
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      await Report.deleteMany({
        createdAt: { $lt: tenMinutesAgo }
      }).catch(err => console.error('Cleanup error:', err));

      // Get nearby reports with better error handling
      const reports = await Report.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parsedLng, parsedLat]
            },
            distanceField: "distance",
            maxDistance: parseInt(maxDistance),
            spherical: true,
            query: {
              createdAt: { $gte: tenMinutesAgo }
            }
          }
        },
        {
          $group: {
            _id: {
              type: "$type",
              location: {
                $concat: [
                  { $substr: [{ $arrayElemAt: ["$location.coordinates", 1] }, 0, 6] },
                  ",",
                  { $substr: [{ $arrayElemAt: ["$location.coordinates", 0] }, 0, 6] }
                ]
              }
            },
            count: { $sum: 1 },
            reports: { $push: "$$ROOT" },
            lastReport: { $last: "$$ROOT" },
            coordinates: { $first: "$location.coordinates" }
          }
        }
      ]).exec();

      console.log('Reports found:', reports.length);

      res.json(reports);
    } catch (error) {
      console.error('Detailed error:', {
        message: error.message,
        stack: error.stack,
        code: error.code
      });
      
      res.status(500).json({ 
        error: 'Failed to fetch reports',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
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
  },

  getReportClusters: async (req, res) => {
    try {
      const { bounds, minReports = 5 } = req.query;
      
      // Parse map bounds
      const boundingBox = JSON.parse(bounds);
      
      const clusters = await Report.aggregate([
        {
          $match: {
            location: {
              $geoWithin: {
                $box: [
                  [boundingBox.sw.lng, boundingBox.sw.lat],
                  [boundingBox.ne.lng, boundingBox.ne.lat]
                ]
              }
            }
          }
        },
        {
          $group: {
            _id: {
              type: "$type",
              location: {
                $geometryToJSON: "$location"
              }
            },
            count: { $sum: 1 },
            reports: { $push: "$$ROOT" }
          }
        },
        {
          $match: {
            count: { $gte: minReports }
          }
        }
      ]);

      res.json(clusters);
    } catch (error) {
      console.error('Error fetching clusters:', error);
      res.status(500).json({ error: 'Failed to fetch report clusters' });
    }
  },

  // Optionnel: Ajouter une tâche planifiée pour nettoyer régulièrement
  cleanupOldReports: async () => {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const result = await Report.deleteMany({
        createdAt: { $lt: tenMinutesAgo }
      });
      console.log(`Cleaned up ${result.deletedCount} old reports`);
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  },

  getRouteWithTraffic: async (req, res) => {
    try {
      const { origin, destination } = req.query;

      if (!origin || !destination) {
        return res.status(400).json({
          error: 'Missing origin or destination coordinates'
        });
      }

      // Parse coordinates
      const [originLat, originLon] = origin.split(',').map(Number);
      const [destLat, destLon] = destination.split(',').map(Number);

      // Get reports along the route
      const reports = await Report.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [originLon, originLat]
            },
            distanceField: "distance",
            maxDistance: 5000,
            spherical: true,
            query: {
              createdAt: { $gte: new Date(Date.now() - 10 * 60 * 1000) }
            }
          }
        }
      ]);

      // Get route with traffic info
      const routeWithTraffic = await trafficService.getRouteTraffic(
        { latitude: originLat, longitude: originLon },
        { latitude: destLat, longitude: destLon },
        reports
      );

      res.json(routeWithTraffic);
    } catch (error) {
      console.error('Route traffic error:', error);
      res.status(500).json({
        error: 'Failed to get route traffic information',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// Nettoyer les vieux reports toutes les minutes
setInterval(reportController.cleanupOldReports, 60 * 1000);

module.exports = reportController;