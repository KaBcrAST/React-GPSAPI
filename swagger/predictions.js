/**
 * @swagger
 * tags:
 *   name: Predictions
 *   description: Analyses prédictives basées sur les reports
 */

/**
 * @swagger
 * /reports/predict:
 *   get:
 *     summary: Prédire la probabilité d'incidents à un endroit donné
 *     tags: [Predictions]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Latitude du point d'intérêt
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Longitude du point d'intérêt
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           default: 500
 *         description: Rayon de recherche en mètres
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Date pour la prédiction (par défaut, moment actuel)
 *     responses:
 *       200:
 *         description: Prédictions calculées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 location:
 *                   type: object
 *                   properties:
 *                     latitude:
 *                       type: number
 *                     longitude:
 *                       type: number
 *                     radius:
 *                       type: integer
 *                 time:
 *                   type: object
 *                   properties:
 *                     dayOfWeek:
 *                       type: integer
 *                     hourOfDay:
 *                       type: integer
 *                     date:
 *                       type: string
 *                       format: date-time
 *                 predictions:
 *                   type: object
 *                   additionalProperties:
 *                     type: object
 *                     properties:
 *                       probability:
 *                         type: number
 *                         description: Probabilité en pourcentage
 *                       confidence:
 *                         type: number
 *                         description: Niveau de confiance dans la prédiction
 *                       sampleSize:
 *                         type: integer
 *                         description: Nombre d'échantillons utilisés
 *       400:
 *         description: Paramètres manquants ou invalides
 *       500:
 *         description: Erreur serveur
 *
 * /reports/peak-times:
 *   get:
 *     summary: Obtenir les heures de pointe pour les incidents
 *     tags: [Predictions]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude du point d'intérêt
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude du point d'intérêt
 *       - in: query
 *         name: radius
 *         schema:
 *           type: integer
 *           default: 1000
 *         description: Rayon de recherche en mètres
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ACCIDENT, TRAFFIC_JAM, ROAD_CLOSED, POLICE, OBSTACLE]
 *         description: Type d'incident spécifique (optionnel)
 *     responses:
 *       200:
 *         description: Analyse des heures/jours de pointe
 *       400:
 *         description: Paramètres manquants ou invalides
 *       500:
 *         description: Erreur serveur
 *
 * /reports/heatmap:
 *   get:
 *     summary: Générer une carte thermique des incidents
 *     tags: [Predictions]
 *     parameters:
 *       - in: query
 *         name: bounds
 *         required: true
 *         schema:
 *           type: string
 *         description: JSON des limites de la carte (sw.lat, sw.lng, ne.lat, ne.lng)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [ACCIDENT, TRAFFIC_JAM, ROAD_CLOSED, POLICE, OBSTACLE]
 *         description: Type d'incident spécifique (optionnel)
 *     responses:
 *       200:
 *         description: Données pour la carte thermique
 *       400:
 *         description: Paramètres manquants ou invalides
 *       500:
 *         description: Erreur serveur
 */