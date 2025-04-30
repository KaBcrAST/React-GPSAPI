const reportStatsController = require('../controllers/reportStatsController');

const duplicateToStats = async (req, res, next) => {
  const oldJson = res.json;

  res.json = function(data) {
    // Si c'est un nouveau report, le dupliquer dans les stats
    if (req.method === 'POST' && data._id) {
      reportStatsController.duplicateReport(data);
    }
    
    return oldJson.apply(res, arguments);
  };

  next();
};

module.exports = duplicateToStats;