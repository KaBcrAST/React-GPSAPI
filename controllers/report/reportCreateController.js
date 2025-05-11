const Report = require('../../models/Report');
const ReportAll = require('../../models/ReportAll');

const reportCreateController = {
  createReport: async (req, res) => {
    try {
      const { type, latitude, longitude } = req.body;

      if (!type || !latitude || !longitude) {
        return res.status(400).json({ 
          error: 'Missing required fields: type, latitude, longitude' 
        });
      }

      // Vérifier que le type est valide selon l'énumération
      const validTypes = ['ACCIDENT', 'TRAFFIC_JAM', 'ROAD_CLOSED', 'POLICE', 'OBSTACLE'];
      if (!validTypes.includes(type)) {
        return res.status(400).json({
          error: `Invalid report type. Must be one of: ${validTypes.join(', ')}`
        });
      }

      // Créer le rapport temporaire
      const report = new Report({
        type,
        location: {
          type: 'Point',
          coordinates: [longitude, latitude]
        }
      });

      await report.save();

      // Créer ou mettre à jour le rapport dans ReportAll
      await ReportAll.findOneAndUpdate(
        {
          type,
          'location.coordinates': [longitude, latitude]
        },
        {
          type,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude]
          },
          $inc: { count: 1 }, // Incrémenter le compteur si le rapport existe déjà
          $setOnInsert: { createdAt: new Date() } // Définir la date de création uniquement si nouveau
        },
        { upsert: true, new: true }
      );

      res.status(201).json({
        success: true,
        message: 'Report created successfully',
        data: report
      });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ error: 'Failed to create report' });
    }
  }
};

module.exports = reportCreateController;