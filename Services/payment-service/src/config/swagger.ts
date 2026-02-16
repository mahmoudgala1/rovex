import swaggerJsdoc from "swagger-jsdoc";
import { version } from "../../package.json";
import { env } from "./environment";

const isDevelopment = env.NODE_ENV !== "production";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ROVEX Fleet Management - Payment Service API",
      version: version,
      description: `
## Base URL
- Production: \`https://rovex.click/payment/api/v1\`
      `,
      contact: {
        name: "ROVEX Development Team",
        email: "rovex.zu.eg@gmail.com",
      },
      license: {
        name: "MIT",
        url: "https://opensource.org/licenses/MIT",
      },
    },
    servers: [
      {
        url: "http://localhost:8003/api/v1",
        description: "Local development",
      },
      {
        url: "https://api.rovex.com/payment/api/v1",
        description: "Staging development",
      },
      {
        url: "https://rovex.click/payment/api/v1",
        description: "Production environment",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: 'Enter your JWT access token (without "Bearer" prefix)',
        },
      },
      schemas: {
        Error: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: false,
            },
            error: {
              type: "string",
              example: "Error message",
            },
          },
        },
        Success: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
            data: {
              type: "object",
            },
          },
        },
      },
    },
    tags: [
      {
        name: "Customers",
        description: "Customer management endpoints",
      },
      {
        name: "Payments",
        description: "Payment processing endpoints",
      },
      {
        name: "Subscriptions",
        description: "Subscription management endpoints",
      },
      {
        name: "Payment Methods",
        description: "Payment method management endpoints",
      },
      {
        name: "Products",
        description: "Product endpoints",
      },
      {
        name: "Prices",
        description: "Price endpoints",
      },
      {
        name: "Webhooks",
        description: "Stripe webhook endpoints",
      },
    ],
  },
  apis: isDevelopment
    ? ["./src/routes/*.ts", "./src/controllers/*.ts"]
    : ["./dist/routes/*.js", "./dist/controllers/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
