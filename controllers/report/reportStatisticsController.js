const ReportAll = require('../../models/ReportAll');

const reportStatisticsController = {
  getReportStats: async (req, res) => {
    try {
      const stats = await ReportAll.aggregate([
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
            avgUpvotes: { $avg: "$upvotes" },
            latest: { $max: "$createdAt" }
          }
        },
        {
          $project: {
            _id: 0,
            type: "$_id",
            count: 1,
            avgUpvotes: { $round: ["$avgUpvotes", 1] },
            latestReport: "$latest"
          }
        },
        {
          $sort: { count: -1 }
        }
      ]);
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error getting report stats:', error);
      res.status(500).json({ error: 'Failed to get report statistics' });
    }
  }
};

module.exports = reportStatisticsController;