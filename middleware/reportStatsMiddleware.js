const reportStatsController = require('../controllers/reportStatsController');

const duplicateToStats = async (req, res, next) => {
  const originalJson = res.json;

  res.json = function(data) {
    if (req.method === 'POST' && req.path === '/reports' && data._id) {
      reportStatsController.duplicateToStats(data)
        .catch(err => console.error('Error in stats middleware:', err));
    }
    return originalJson.apply(res, arguments);
  };

  next();
};

module.exports = duplicateToStats;