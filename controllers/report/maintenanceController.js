const Report = require('../../models/Report');

const maintenanceController = {
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
  
  // Démarre la tâche de nettoyage planifiée
  startCleanupTask: () => {
    // Nettoyer les anciens rapports toutes les minutes
    const interval = setInterval(maintenanceController.cleanupOldReports, 60 * 1000);
    console.log('Report cleanup task started');
    return interval;
  }
};

// Démarrer la tâche de maintenance automatiquement
maintenanceController.startCleanupTask();

module.exports = maintenanceController;