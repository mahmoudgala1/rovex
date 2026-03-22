import { Options } from "swagger-jsdoc";

const isDevelopment = process.env.NODE_ENV !== "production";

export const swaggerSpec: Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "E-commerce API",
      version: "1.0.0",
      description: "E-commerce API documentation",
    },
    servers: [
      {
        url: "http://localhost:8001/api/v1",
        description: "Local development",
      },
      {
        url: "https://api.rovex.com/ecommerce/api/v1",
        description: "Staging development",
      },
      {
        url: "https://rovex.click/ecommerce/api/v1",
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
        SuccessResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Success",
            },
            data: {
              type: "object",
            },
          },
        },
        ErrorResponse: {
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
        Location: {
          type: "object",
          properties: {
            lat: {
              type: "number",
              example: 30.0444,
            },
            lng: {
              type: "number",
              example: 31.2357,
            },
            address: {
              type: "string",
              example: "123 Street, Cairo",
            },
          },
        },
        ServiceReview: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            userName: { type: "string" },
            userId: { type: "string", format: "uuid" },
            orderId: { type: "string", format: "uuid" },
            rating: { type: "integer", enum: [4, 5] },
            comment: { type: "string" },
            isVisible: { type: "boolean" },
            createdAt: { type: "string", format: "date-time" },
          },
        },
        OrderIssue: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            orderId: { type: "string", format: "uuid" },
            userId: { type: "string", format: "uuid" },
            userName: { type: "string" },
            roverId: { type: "string", format: "uuid" },
            roverName: { type: "string" },
            rating: { type: "integer", enum: [1, 2, 3] },
            issueType: {
              type: "string",
              enum: [
                "rover_slow",
                "package_damaged",
                "wrong_delivery",
                "rover_malfunction",
                "other",
              ],
            },
            comment: { type: "string" },
            images: {
              type: "array",
              items: { type: "string", format: "uri" },
              maxItems: 5,
            },
            status: {
              type: "string",
              enum: ["open", "in_progress", "resolved"],
            },
            adminNote: { type: "string", nullable: true },
            resolvedAt: { type: "string", format: "date-time", nullable: true },
            createdAt: { type: "string", format: "date-time" },
          },
        },
      },
    },
  },
  apis: isDevelopment
    ? [
        "./src/swagger/swagger.schemas.ts",
        "./src/routes/*.ts",
        "./src/controllers/*.ts",
      ]
    : ["./dist/*.js", "./dist/*.js", "./dist/*.js"],
};
