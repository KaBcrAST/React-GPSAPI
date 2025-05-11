const Report = require('../../models/Report');
const ReportAll = require('../../models/ReportAll');
const trafficService = require('../../services/trafficService');

const reportQueryController = {
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
      // Récupérer tous les reports de ReportAll, triés par date (les plus récents d'abord)
      const allReports = await ReportAll.find().sort({ createdAt: -1 });
      
      res.json({
        success: true,
        count: allReports.length,
        data: allReports
      });
    } catch (error) {
      console.error('Error getting all reports:', error);
      res.status(500).json({ error: 'Failed to get all reports' });
    }
  }
};

module.exports = reportQueryController;