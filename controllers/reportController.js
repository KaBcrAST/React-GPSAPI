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
      const { latitude, longitude, maxDistance = 5000 } = req.query;

      if (!latitude || !longitude) {
        return res.status(400).json({ 
          error: 'Missing required fields: latitude, longitude' 
        });
      }

      // Supprimer les reports plus vieux que 10 minutes
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      await Report.deleteMany({
        createdAt: { $lt: tenMinutesAgo }
      });

      // Agrégation pour grouper les reports proches
      const reports = await Report.aggregate([
        {
          $match: {
            createdAt: { $gte: tenMinutesAgo }
          }
        },
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            distanceField: "distance",
            maxDistance: parseInt(maxDistance),
            spherical: true
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
        },
        {
          $project: {
            _id: 0,
            type: "$_id.type",
            count: 1,
            isCluster: { $gte: ["$count", 10] },
            location: {
              type: "Point",
              coordinates: "$coordinates"
            },
            reports: {
              $cond: {
                if: { $gte: ["$count", 10] },
                then: "$reports",
                else: "$$REMOVE"
              }
            },
            lastReportTime: "$lastReport.createdAt"
          }
        }
      ]);

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
  }
};

// Nettoyer les vieux reports toutes les minutes
setInterval(reportController.cleanupOldReports, 60 * 1000);

module.exports = reportController;