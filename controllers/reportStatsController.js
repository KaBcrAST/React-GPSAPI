const ReportStats = require('../models/ReportStats');
const Report = require('../models/Report');

const reportStatsController = {
  duplicateReport: async (reportData) => {
    try {
      const stats = new ReportStats({
        originalReportId: reportData._id,
        type: reportData.type,
        location: reportData.location,
        upvotes: reportData.upvotes || 0,
        createdAt: reportData.createdAt
      });
      await stats.save();
      return stats;
    } catch (error) {
      console.error('Error duplicating report to stats:', error);
    }
  },

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
  }
};

module.exports = reportStatsController;