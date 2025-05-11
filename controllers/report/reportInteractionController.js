const Report = require('../../models/Report');
const ReportAll = require('../../models/ReportAll');

const reportInteractionController = {
  upvoteReport: async (req, res) => {
    try {
      const { reportId } = req.params;
      
      const report = await Report.findById(reportId);
      
      if (!report) {
        return res.status(404).json({ error: 'Report not found' });
      }
      
      const updatedReport = await Report.findByIdAndUpdate(
        reportId,
        { $inc: { upvotes: 1 } },
        { new: true }
      );
      
      await ReportAll.findOneAndUpdate(
        {
          type: report.type,
          'location.coordinates': report.location.coordinates
        },
        { $inc: { upvotes: 1 } }
      );

      res.json(updatedReport);
    } catch (error) {
      console.error('Error upvoting report:', error);
      res.status(500).json({ error: 'Failed to upvote report' });
    }
  }
};

module.exports = reportInteractionController;