const Report = require('../models/Report');
const ReportStats = require('../models/ReportStats');
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

      // Créer une copie dans report-stats
      const reportStats = new ReportStats({
        originalReportId: report._id,
        type: report.type,
        location: report.location,
        upvotes: report.upvotes,
        createdAt: report.createdAt,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // expire après 24h
      });
      await reportStats.save();

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

      const parsedLat = parseFloat(latitude);
      const parsedLng = parseFloat(longitude);

      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

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
                lat: { 
                  $round: [{ $arrayElemAt: ["$location.coordinates", 1] }, 4]
                },
                lng: { 
                  $round: [{ $arrayElemAt: ["$location.coordinates", 0] }, 4]
                }
              }
            },
            count: { $sum: 1 },
            coordinates: { 
              $first: "$location.coordinates"
            },
            distance: { $first: "$distance" },
            reports: { $push: "$$ROOT" }
          }
        },
        {
          $match: {
            count: { $gte: 5 }
          }
        },
        {
          $project: {
            _id: 0,
            type: "$_id.type",
            location: {
              type: "Point",
              coordinates: "$coordinates"
            },
            count: 1,
            distance: 1
          }
        }
      ]);

      console.log('Clusters found:', reports.length);
      res.json(reports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'Failed to fetch reports' });
    }
  },

  // Ajout d'une méthode pour récupérer les statistiques
  getReportStats: async (req, res) => {
    try {
      const { startDate, endDate, type } = req.query;
      const query = {};

      if (startDate && endDate) {
        query.createdAt = {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        };
      }

      if (type) {
        query.type = type;
      }

      const stats = await ReportStats.find(query)
        .sort({ createdAt: -1 });

      res.json(stats);
    } catch (error) {
      console.error('Error fetching report stats:', error);
      res.status(500).json({ error: 'Failed to fetch report stats' });
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

      // Mettre à jour aussi dans report-stats
      await ReportStats.findOneAndUpdate(
        { originalReportId: req.params.reportId },
        { $inc: { upvotes: 1 } }
      );

      res.json(report);
    } catch (error) {
      console.error('Error upvoting report:', error);
      res.status(500).json({ error: 'Failed to upvote report' });
    }
  },

  getReportClusters: async (req, res) => {
    try {
      const { bounds, minReports = 5 } = req.query;
      
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

      const [originLat, originLon] = origin.split(',').map(Number);
      const [destLat, destLon] = destination.split(',').map(Number);

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
  },

  getAllReports: async (req, res) => {
    try {
      // Récupérer les rapports des 10 dernières minutes uniquement
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      const reports = await Report.find({
        createdAt: { $gte: tenMinutesAgo }
      }).sort({ createdAt: -1 });

      // Formater les rapports pour la réponse
      const formattedReports = reports.map(report => ({
        id: report._id,
        type: report.type,
        location: {
          latitude: report.location.coordinates[1],
          longitude: report.location.coordinates[0]
        },
        createdAt: report.createdAt,
        upvotes: report.upvotes || 0
      }));

      res.json(formattedReports);
    } catch (error) {
      console.error('Error fetching all reports:', error);
      res.status(500).json({ error: 'Failed to fetch all reports' });
    }
  }
};

setInterval(reportController.cleanupOldReports, 60 * 1000);

module.exports = reportController;