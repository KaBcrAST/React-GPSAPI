const Report = require('../../models/Report');

const maintenanceController = {
  cleanupOldReports: async () => {
    try {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
      const result = await Report.deleteMany({
        createdAt: { $lt: tenMinutesAgo }
      });
    } catch (error) {
      console.error('Cleanup error:', error);
    }
  },
  
  startCleanupTask: () => {
    const interval = setInterval(maintenanceController.cleanupOldReports, 60 * 1000);
    return interval;
  }
};

maintenanceController.startCleanupTask();

module.exports = maintenanceController;