/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Recherche de lieux et d'adresses
 */

/**
 * @swagger
 * /search:
 *   get:
 *     summary: Rechercher des lieux
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         required: true
 *         schema:
 *           type: string
 *         description: Texte de recherche
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         description: Latitude pour contextualiser la recherche
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         description: Longitude pour contextualiser la recherche
 *     responses:
 *       200:
 *         description: Résultats de recherche
 *       400:
 *         description: Paramètres manquants
 *       500:
 *         description: Erreur serveur
 *
 * /search/address:
 *   get:
 *     summary: Géocoder une adresse
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Résultats du géocodage
 *       400:
 *         description: Adresse manquante
 *       500:
 *         description: Erreur serveur
 *
 * /search/reverse:
 *   get:
 *     summary: Géocodage inverse (coordonnées vers adresse)
 *     tags: [Search]
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
 *     responses:
 *       200:
 *         description: Adresse correspondant aux coordonnées
 *       400:
 *         description: Coordonnées manquantes
 *       500:
 *         description: Erreur serveur
 */