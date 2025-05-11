const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'GPS API Documentation',
      version: '1.0.0',
      description: 'Documentation de l\'API pour l\'application GPS',
      contact: {
        name: 'Support',
        email: 'support@gpsapp.com'
      },
    },
    servers: [
      {
        url: 'http://localhost:5000/api',
        description: 'Serveur de développement'
      },
      {
        url: 'https://api.gpsapp.com/api',
        description: 'Serveur de production'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [{
      bearerAuth: []
    }]
  },
  apis: [
    './routes/*.js',
    './controllers/**/*.js',
    './models/*.js',
    './swagger/*.js'
  ],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;