/**
 * @swagger
 * tags:
 *   name: Reports
 *   description: Gestion des signalements sur la route
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     ReportType:
 *       type: string
 *       enum: [ACCIDENT, TRAFFIC_JAM, ROAD_CLOSED, POLICE, OBSTACLE]
 */

/**
 * @swagger
 * /reports:
 *   post:
 *     summary: Créer un nouveau signalement
 *     tags: [Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - latitude
 *               - longitude
 *             properties:
 *               type:
 *                 $ref: '#/components/schemas/ReportType'
 *               latitude:
 *                 type: number
 *                 format: float
 *               longitude:
 *                 type: number
 *                 format: float
 *     responses:
 *       201:
 *         description: Signalement créé
 *       400:
 *         description: Données invalides
 *       500:
 *         description: Erreur serveur
 *   
 *   get:
 *     summary: Obtenir les signalements à proximité
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxDistance
 *         schema:
 *           type: integer
 *           default: 5000
 *         description: Distance maximale en mètres
 *     responses:
 *       200:
 *         description: Liste des signalements à proximité
 *       400:
 *         description: Paramètres manquants
 *       500:
 *         description: Erreur serveur
 *         
 * /reports/clusters:
 *   get:
 *     summary: Obtenir des clusters de signalements
 *     tags: [Reports]
 *     parameters:
 *       - in: query
 *         name: bounds
 *         required: true
 *         schema:
 *           type: string
 *         description: JSON des limites de la carte (sw.lat, sw.lng, ne.lat, ne.lng)
 *       - in: query
 *         name: minReports
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Nombre minimum de signalements pour former un cluster
 *     responses:
 *       200:
 *         description: Liste des clusters
 *       500:
 *         description: Erreur serveur
 *
 * /reports/all:
 *   get:
 *     summary: Obtenir tous les signalements
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Liste de tous les signalements
 *       500:
 *         description: Erreur serveur
 *
 * /reports/{reportId}/upvote:
 *   post:
 *     summary: Voter pour un signalement
 *     tags: [Reports]
 *     parameters:
 *       - in: path
 *         name: reportId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du signalement
 *     responses:
 *       200:
 *         description: Vote enregistré
 *       404:
 *         description: Signalement non trouvé
 *       500:
 *         description: Erreur serveur
 *
 * /reports/stats:
 *   get:
 *     summary: Obtenir des statistiques sur les signalements
 *     tags: [Reports]
 *     responses:
 *       200:
 *         description: Statistiques des signalements
 *       500:
 *         description: Erreur serveur
 */