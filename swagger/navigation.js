/**
 * @swagger
 * tags:
 *   name: Navigation
 *   description: Fonctionnalités de navigation et itinéraires
 */

/**
 * @swagger
 * /distance:
 *   get:
 *     summary: Obtenir la distance entre deux points
 *     tags: [Navigation]
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *         description: Coordonnées d'origine (lat,lng)
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *         description: Coordonnées de destination (lat,lng)
 *     responses:
 *       200:
 *         description: Distance calculée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 distance:
 *                   type: object
 *                   properties:
 *                     text:
 *                       type: string
 *                       example: "10.2 km"
 *                     value:
 *                       type: integer
 *                       example: 10200
 *       400:
 *         description: Paramètres manquants
 *       500:
 *         description: Erreur serveur
 *
 * /info:
 *   get:
 *     summary: Obtenir les informations de trajet
 *     tags: [Navigation]
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Informations de trajet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 distance:
 *                   type: object
 *                 duration:
 *                   type: object
 *       400:
 *         description: Paramètres manquants
 *       500:
 *         description: Erreur serveur
 *
 * /route:
 *   get:
 *     summary: Obtenir un itinéraire complet
 *     tags: [Navigation]
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: avoidTolls
 *         schema:
 *           type: boolean
 *         description: Éviter les péages
 *     responses:
 *       200:
 *         description: Itinéraire calculé
 *       400:
 *         description: Paramètres manquants
 *       500:
 *         description: Erreur serveur
 *
 * /preview:
 *   get:
 *     summary: Obtenir un aperçu de l'itinéraire
 *     tags: [Navigation]
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: avoidTolls
 *         schema:
 *           type: boolean
 *     responses:
 *       200:
 *         description: Aperçu de l'itinéraire
 *       400:
 *         description: Paramètres manquants
 *       500:
 *         description: Erreur serveur
 *
 * /route-without-tolls:
 *   get:
 *     summary: Obtenir un itinéraire sans péages
 *     tags: [Navigation]
 *     parameters:
 *       - in: query
 *         name: origin
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: destination
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Itinéraire sans péages
 *       400:
 *         description: Paramètres manquants
 *       500:
 *         description: Erreur serveur
 */