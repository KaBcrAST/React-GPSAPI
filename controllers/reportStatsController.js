const ReportStats = require('../models/ReportStats');
const Report = require('../models/Report');

const reportStatsController = {
  getAllReports: async (req, res) => {
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

      const stats = await ReportStats.find(query).sort({ createdAt: -1 });
      res.json(stats);
    } catch (error) {
      console.error('Error fetching report stats:', error);
      res.status(500).json({ error: 'Failed to fetch report stats' });
    }
  },

  duplicateToStats: async (report) => {
    try {
      const reportStat = new ReportStats({
        originalReportId: report._id,
        type: report.type,
        location: report.location,
        upvotes: report.upvotes || 0,
        createdAt: report.createdAt
      });
      await reportStat.save();
      return reportStat;
    } catch (error) {
      console.error('Error duplicating to stats:', error);
    }
  }
};

module.exports = reportStatsController;