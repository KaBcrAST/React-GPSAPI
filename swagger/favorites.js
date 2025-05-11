/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: Gestion des lieux favoris
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Favorite:
 *       type: object
 *       required:
 *         - name
 *         - address
 *         - latitude
 *         - longitude
 *       properties:
 *         name:
 *           type: string
 *           description: Nom du lieu favori
 *         address:
 *           type: string
 *           description: Adresse du lieu
 *         latitude:
 *           type: number
 *           format: float
 *           description: Latitude
 *         longitude:
 *           type: number
 *           format: float
 *           description: Longitude
 *         category:
 *           type: string
 *           description: Catégorie du lieu (maison, travail, autre)
 */

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Obtenir tous les lieux favoris de l'utilisateur
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Liste des lieux favoris
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 *   post:
 *     summary: Ajouter un lieu favori
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Favorite'
 *     responses:
 *       201:
 *         description: Favori ajouté
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 *
 * /favorites/{id}:
 *   put:
 *     summary: Mettre à jour un lieu favori
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Favorite'
 *     responses:
 *       200:
 *         description: Favori mis à jour
 *       400:
 *         description: Données invalides
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Favori non trouvé
 *       500:
 *         description: Erreur serveur
 *   delete:
 *     summary: Supprimer un lieu favori
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Favori supprimé
 *       401:
 *         description: Non authentifié
 *       404:
 *         description: Favori non trouvé
 *       500:
 *         description: Erreur serveur
 */