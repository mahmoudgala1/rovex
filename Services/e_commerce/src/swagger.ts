import { Options } from 'swagger-jsdoc';
import path from 'path';

export const swaggerOptions: Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'My Express API',
      version: '1.0.0',
      description: 'A simple Express TypeScript API documentation',
    },
    servers: [
      {
        url: 'http://localhost:3200',
      },
    ],
  },
  // Path to the API docs (where you will write your JSDoc comments)
  apis: [path.join(__dirname, './routes/*.{ts,js}')],
};