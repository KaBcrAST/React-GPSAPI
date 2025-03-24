const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mobile-R API Documentation',
      version: '1.0.0',
      description: 'Documentation for the Mobile-R application API',
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' 
          ? 'react-gpsapi-mlwl81a6r-thoms-projects-7a50a63d.vercel.app' 
          : 'http://localhost:5000',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./routes/*.js'], // Path to the API routes
};

module.exports = swaggerJsdoc(options);