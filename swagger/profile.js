/**
 * @swagger
 * tags:
 *   name: Profile
 *   description: Gestion du profil utilisateur
 */

/**
 * @swagger
 * /profile:
 *   get:
 *     summary: Obtenir le profil de l'utilisateur connecté
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profil utilisateur
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 *
 * /profile/email:
 *   put:
 *     summary: Mettre à jour l'email de l'utilisateur
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Email mis à jour
 *       400:
 *         description: Email invalide
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 *
 * /profile/name:
 *   put:
 *     summary: Mettre à jour le nom de l'utilisateur
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Nom mis à jour
 *       400:
 *         description: Nom invalide
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 *
 * /profile/picture:
 *   post:
 *     summary: Télécharger une photo de profil
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profilePicture:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Photo mise à jour
 *       400:
 *         description: Fichier invalide
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 *   delete:
 *     summary: Supprimer la photo de profil
 *     tags: [Profile]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Photo supprimée
 *       401:
 *         description: Non authentifié
 *       500:
 *         description: Erreur serveur
 */