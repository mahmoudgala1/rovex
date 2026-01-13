import { Options } from 'swagger-jsdoc';
import path from 'path';

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-commerce API',
      version: '1.0.0',
      description: 'E-commerce API documentation',
    },
    servers: [
      {
        url: 'http://localhost:3200',
        
      },
    ],
  },
  apis: ["./src/swagger/swagger.schemas.ts",  path.join(__dirname, '../routes/*.ts')],
};