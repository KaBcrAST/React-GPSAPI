const ReportAll = require('../../models/ReportAll');
const mongoose = require('mongoose');

const predictionController = {
  /**
   * Prédit la probabilité d'incidents sur une zone géographique
   * en fonction des données historiques
   */
  predictIncidents: async (req, res) => {
    try {
      const { latitude, longitude, radius = 500, date = new Date() } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          success: false,
          message: 'Les coordonnées géographiques sont requises'
        });
      }

      // Convertir les paramètres en nombres
      const parsedLat = parseFloat(latitude);
      const parsedLng = parseFloat(longitude);
      const parsedRadius = parseInt(radius);
      
      // Préparer l'heure pour faire correspondre l'heure du jour
      const requestTime = new Date(date);
      const dayOfWeek = requestTime.getDay(); // 0 (dimanche) à 6 (samedi)
      const hourOfDay = requestTime.getHours();
      
      // Récupérer l'historique des incidents dans cette zone
      // Filtrer par une période de temps (par exemple les 90 derniers jours)
      const ninetyDaysAgo = new Date();
      ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
      
      // Recherche géospatiale pour trouver tous les incidents dans le rayon spécifié
      const historicalReports = await ReportAll.find({
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [parsedLng, parsedLat]
            },
            $maxDistance: parsedRadius
          }
        },
        createdAt: { $gte: ninetyDaysAgo }
      }).lean();
      
      // Analyser les données par type d'incident
      const reportTypeCounts = {};
      const reportTypeByHour = {};
      const reportTypeByDay = {};
      const totalReports = historicalReports.length;
      
      // Initialiser les compteurs pour tous les types
      const reportTypes = ['ACCIDENT', 'TRAFFIC_JAM', 'ROAD_CLOSED', 'POLICE', 'OBSTACLE'];
      reportTypes.forEach(type => {
        reportTypeCounts[type] = 0;
        
        // Initialiser les compteurs par heure (0-23)
        reportTypeByHour[type] = Array(24).fill(0);
        
        // Initialiser les compteurs par jour de la semaine (0-6)
        reportTypeByDay[type] = Array(7).fill(0);
      });
      
      // Compter les occurrences
      historicalReports.forEach(report => {
        const type = report.type;
        reportTypeCounts[type] = (reportTypeCounts[type] || 0) + 1;
        
        // Compter par heure et jour
        const reportDate = new Date(report.createdAt);
        const reportHour = reportDate.getHours();
        const reportDay = reportDate.getDay();
        
        reportTypeByHour[type][reportHour] = (reportTypeByHour[type][reportHour] || 0) + 1;
        reportTypeByDay[type][reportDay] = (reportTypeByDay[type][reportDay] || 0) + 1;
      });
      
      // Calculer les probabilités générales
      const overallProbabilities = {};
      reportTypes.forEach(type => {
        overallProbabilities[type] = totalReports > 0 ? 
          (reportTypeCounts[type] / totalReports) * 100 : 0;
      });
      
      // Calculer les probabilités par heure spécifique
      const hourlyProbabilities = {};
      reportTypes.forEach(type => {
        const totalTypeReports = reportTypeCounts[type] || 0;
        hourlyProbabilities[type] = totalTypeReports > 0 ? 
          (reportTypeByHour[type][hourOfDay] / totalTypeReports) * 100 : 0;
      });
      
      // Calculer les probabilités par jour spécifique
      const dailyProbabilities = {};
      reportTypes.forEach(type => {
        const totalTypeReports = reportTypeCounts[type] || 0;
        dailyProbabilities[type] = totalTypeReports > 0 ? 
          (reportTypeByDay[type][dayOfWeek] / totalTypeReports) * 100 : 0;
      });
      
      // Calculer la probabilité combinée (jour + heure)
      // Formule simplifiée: la moyenne entre probabilité horaire et journalière
      // multiplié par la probabilité globale pour ce type
      const combinedProbabilities = {};
      reportTypes.forEach(type => {
        const hourProb = hourlyProbabilities[type];
        const dayProb = dailyProbabilities[type];
        const overallProb = overallProbabilities[type];
        
        // Facteur de pondération: plus important si plus de données
        const weightFactor = Math.min(1, reportTypeCounts[type] / 20); // Max à partir de 20 reports
        
        // Formule qui combine toutes ces probabilités
        // Plus le weightFactor est élevé, plus nous avons confiance dans la prédiction
        combinedProbabilities[type] = {
          probability: weightFactor * ((hourProb + dayProb) / 2) * (overallProb / 100),
          confidence: weightFactor * 100, // pourcentage de confiance
          sampleSize: reportTypeCounts[type]
        };
      });
      
      // Ajouter des métadonnées utiles à la réponse
      const response = {
        success: true,
        location: {
          latitude: parsedLat,
          longitude: parsedLng,
          radius: parsedRadius
        },
        time: {
          dayOfWeek,
          hourOfDay,
          date: requestTime
        },
        predictions: combinedProbabilities,
        metadata: {
          totalHistoricalReports: totalReports,
          dataPeriodDays: 90,
          reportsByType: reportTypeCounts,
        }
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Prediction error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors du calcul des prédictions',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  /**
   * Récupère les heures de pointe pour un type d'incident particulier
   * dans une zone géographique
   */
  getPeakTimes: async (req, res) => {
    try {
      const { latitude, longitude, radius = 1000, type } = req.query;
      
      if (!latitude || !longitude) {
        return res.status(400).json({ 
          success: false,
          message: 'Les coordonnées géographiques sont requises'
        });
      }
      
      // Valider le type d'incident
      const validTypes = ['ACCIDENT', 'TRAFFIC_JAM', 'ROAD_CLOSED', 'POLICE', 'OBSTACLE'];
      const reportType = type ? type.toUpperCase() : null;
      
      if (type && !validTypes.includes(reportType)) {
        return res.status(400).json({
          success: false,
          message: `Type d'incident invalide. Utilisez: ${validTypes.join(', ')}`
        });
      }
      
      // Convertir les paramètres en nombres
      const parsedLat = parseFloat(latitude);
      const parsedLng = parseFloat(longitude);
      const parsedRadius = parseInt(radius);
      
      // Définir la période d'analyse (6 derniers mois)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      // Préparer la requête MongoDB - Filtrer par type si spécifié
      const query = {
        location: {
          $nearSphere: {
            $geometry: {
              type: "Point",
              coordinates: [parsedLng, parsedLat]
            },
            $maxDistance: parsedRadius
          }
        },
        createdAt: { $gte: sixMonthsAgo }
      };
      
      if (reportType) {
        query.type = reportType;
      }
      
      // Agréger les données par heure de la journée
      const hourlyData = await ReportAll.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              hour: { $hour: "$createdAt" },
              type: "$type"
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.type": 1, count: -1 } }
      ]);
      
      // Agréger les données par jour de la semaine
      const dailyData = await ReportAll.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              dayOfWeek: { $dayOfWeek: "$createdAt" }, // 1 (dimanche) à 7 (samedi)
              type: "$type"
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { "_id.type": 1, count: -1 } }
      ]);
      
      // Formater les données pour les heures
      const hourlyResults = {};
      validTypes.forEach(type => {
        hourlyResults[type] = Array(24).fill(0);
      });
      
      hourlyData.forEach(item => {
        const hour = item._id.hour;
        const type = item._id.type;
        hourlyResults[type][hour] = item.count;
      });
      
      // Formater les données pour les jours
      const dailyResults = {};
      validTypes.forEach(type => {
        dailyResults[type] = Array(7).fill(0);
      });
      
      dailyData.forEach(item => {
        // Conversion de l'index MongoDB (1-7) à l'index JS (0-6)
        const day = item._id.dayOfWeek - 1;
        const type = item._id.type;
        dailyResults[type][day] = item.count;
      });
      
      // Identifier les heures de pointe pour chaque type
      const peakHours = {};
      validTypes.forEach(type => {
        const typeData = hourlyResults[type];
        const maxCount = Math.max(...typeData);
        peakHours[type] = typeData.map((count, hour) => ({
          hour,
          count,
          percentage: maxCount > 0 ? (count / maxCount) * 100 : 0
        })).sort((a, b) => b.count - a.count);
      });
      
      // Identifier les jours les plus problématiques
      const peakDays = {};
      const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      
      validTypes.forEach(type => {
        const typeData = dailyResults[type];
        const maxCount = Math.max(...typeData);
        peakDays[type] = typeData.map((count, dayIndex) => ({
          day: dayIndex,
          dayName: dayNames[dayIndex],
          count,
          percentage: maxCount > 0 ? (count / maxCount) * 100 : 0
        })).sort((a, b) => b.count - a.count);
      });
      
      res.json({
        success: true,
        location: {
          latitude: parsedLat,
          longitude: parsedLng,
          radius: parsedRadius
        },
        peakHours: reportType ? { [reportType]: peakHours[reportType] } : peakHours,
        peakDays: reportType ? { [reportType]: peakDays[reportType] } : peakDays,
        metadata: {
          dataPeriod: "6 mois",
          startDate: sixMonthsAgo,
          reportType: reportType || "Tous les types"
        }
      });
      
    } catch (error) {
      console.error('Peak times analysis error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse des heures de pointe',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Génère une carte thermique des incidents pour une zone donnée
   */
  getHeatmap: async (req, res) => {
    try {
      const { bounds, type } = req.query;
      
      if (!bounds) {
        return res.status(400).json({
          success: false,
          message: 'Les limites géographiques (bounds) sont requises'
        });
      }
      
      const boundingBox = JSON.parse(bounds);
      
      // Valider le type d'incident
      const validTypes = ['ACCIDENT', 'TRAFFIC_JAM', 'ROAD_CLOSED', 'POLICE', 'OBSTACLE'];
      const reportType = type ? type.toUpperCase() : null;
      
      if (type && !validTypes.includes(reportType)) {
        return res.status(400).json({
          success: false,
          message: `Type d'incident invalide. Utilisez: ${validTypes.join(', ')}`
        });
      }
      
      // Préparer la requête MongoDB
      const query = {
        location: {
          $geoWithin: {
            $box: [
              [boundingBox.sw.lng, boundingBox.sw.lat],
              [boundingBox.ne.lng, boundingBox.ne.lat]
            ]
          }
        }
      };
      
      // Ajouter un filtre par type si spécifié
      if (reportType) {
        query.type = reportType;
      }
      
      // Récupérer tous les incidents dans la zone
      const reports = await ReportAll.find(query)
        .select('type location.coordinates count upvotes createdAt')
        .lean();
      
      // Formater les données pour la carte thermique
      const heatmapData = reports.map(report => ({
        lat: report.location.coordinates[1],
        lng: report.location.coordinates[0],
        weight: report.count, // Utiliser le nombre d'incidents comme poids
        type: report.type,
        date: report.createdAt
      }));
      
      res.json({
        success: true,
        bounds: boundingBox,
        heatmap: heatmapData,
        metadata: {
          totalPoints: heatmapData.length,
          reportType: reportType || "Tous les types"
        }
      });
      
    } catch (error) {
      console.error('Heatmap generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la génération de la carte thermique',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = predictionController;