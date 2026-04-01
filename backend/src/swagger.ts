import swaggerJsdoc from 'swagger-jsdoc';

const PORT = process.env.PORT || 3000;

const options = {
  definition: {
    openapi: '3.0.3',
    info: {
      title: 'Warehouse Management API',
      version: '1.0.0',
      description: 'API documentation for Warehouse Management System',
    },
    servers: [{ url: `http://localhost:${PORT}`, description: 'Local' }],

    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },

    security: [
      {
        bearerAuth: [],
      },
    ],
  },

  apis: ['src/routes/*.ts', 'src/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
