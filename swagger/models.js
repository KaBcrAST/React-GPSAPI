/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - email
 *         - name
 *       properties:
 *         _id:
 *           type: string
 *           description: ID MongoDB de l'utilisateur
 *         email:
 *           type: string
 *           format: email
 *           description: Email de l'utilisateur
 *         name:
 *           type: string
 *           description: Nom de l'utilisateur
 *         password:
 *           type: string
 *           format: password
 *           description: Mot de passe hashé de l'utilisateur
 *         picture:
 *           type: string
 *           description: URL ou base64 de la photo de profil
 *         googleId:
 *           type: string
 *           description: ID Google si authentifié via Google
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           description: Rôle de l'utilisateur
 *         lastLogin:
 *           type: string
 *           format: date-time
 *           description: Date de la dernière connexion
 *     
 *     Report:
 *       type: object
 *       required:
 *         - type
 *         - location
 *       properties:
 *         _id:
 *           type: string
 *           description: ID MongoDB du signalement
 *         type:
 *           type: string
 *           enum: [ACCIDENT, TRAFFIC_JAM, ROAD_CLOSED, POLICE, OBSTACLE]
 *           description: Type de signalement
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               default: Point
 *             coordinates:
 *               type: array
 *               items:
 *                 type: number
 *               description: [longitude, latitude]
 *         upvotes:
 *           type: number
 *           default: 0
 *           description: Nombre de votes pour ce signalement
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date de création du signalement
 */