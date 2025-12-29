import swaggerJsdoc from "swagger-jsdoc";
import { version } from "../../package.json";

const isDevelopment = process.env.NODE_ENV !== "production";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "ROVEX Fleet Management - Authentication Service API",
      version: version,
      description: `
# ROVEX Authentication & Authorization Service

Complete authentication and user management API for ROVEX fleet management platform.

## Features

- 🔐 **Multi-tenant Authentication**: Fleet Operators, Company Users, Customers
- 👥 **User Management**: CRUD operations for all user types
- 🔄 **Token Management**: JWT access/refresh tokens
- 🚪 **Session Control**: Single and multi-device logout
- 🛡️ **Security**: Token blacklisting, version-based revocation
- ⏰ **Auto-expiry**: Configurable token expiration

## Authentication Flow

1. **Login** → Get access_token + refresh_token
2. **API Requests** → Use \`Authorization: Bearer <access_token>\`
3. **Token Expired** → Use refresh_token to get new access_token
4. **Logout** → Blacklist tokens (single/all devices)

## Token Expiry

- **Access Token**: 1 hour
- **Refresh Token**: 7 days

## Base URL
- Production: \`https://rovex.duckdns.org/auth/api/v1\`
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
        url: "http://localhost:8000/api/v1",
        description: "Local development",
      },
      {
        url: "https://api.rovex.com/auth/api/v1",
        description: "Staging development",
      },
      {
        url: "https://rovex.duckdns.org/auth/api/v1",
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
            message: {
              type: "string",
              example: "Error message",
            },
            error: {
              type: "object",
              properties: {
                code: {
                  type: "string",
                  example: "VALIDATION_ERROR",
                },
                statusCode: {
                  type: "integer",
                  example: 400,
                },
                details: {
                  type: "array",
                  items: {
                    type: "object",
                  },
                },
              },
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
          },
        },
        SuccessResponse: {
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
            timestamp: {
              type: "string",
              format: "date-time",
            },
          },
        },
        TokenResponse: {
          type: "object",
          properties: {
            access_token: {
              type: "string",
              description: "JWT access token for API requests",
            },
            refresh_token: {
              type: "string",
              description: "JWT refresh token to obtain new access tokens",
            },
            expires_in: {
              type: "integer",
              description: "Access token expiry time in seconds",
              example: 3600,
            },
          },
        },
        FleetOperator: {
          type: "object",
          properties: {
            operator_id: {
              type: "string",
              example: "FO_001",
            },
            email: {
              type: "string",
              format: "email",
              example: "admin@rovex.com",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            phone: {
              type: "string",
              example: "+1234567890",
            },
            role: {
              type: "string",
              enum: ["super_admin", "fleet_manager", "operations_manager"],
              example: "super_admin",
            },
            permissions: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["*"],
            },
            status: {
              type: "string",
              enum: ["active", "suspended", "deactivated"],
              example: "active",
            },
            password_must_change: {
              type: "boolean",
              example: false,
            },
            last_login: {
              type: "string",
              format: "date-time",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        CompanyUser: {
          type: "object",
          properties: {
            user_id: {
              type: "string",
              example: "CU_001",
            },
            company_id: {
              type: "string",
              example: "COMP_001",
            },
            email: {
              type: "string",
              format: "email",
              example: "manager@company.com",
            },
            name: {
              type: "string",
              example: "Jane Smith",
            },
            phone: {
              type: "string",
              example: "+1234567890",
            },
            role: {
              type: "string",
              enum: ["admin", "manager", "dispatcher", "analyst"],
              example: "manager",
            },
            permissions: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["view_vehicles", "manage_bookings"],
            },
            location_access: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["LOC_001", "LOC_002"],
            },
            status: {
              type: "string",
              enum: ["active", "suspended", "deactivated"],
              example: "active",
            },
            last_login: {
              type: "string",
              format: "date-time",
            },
            created_at: {
              type: "string",
              format: "date-time",
            },
            updated_at: {
              type: "string",
              format: "date-time",
            },
          },
        },
        PaginationMeta: {
          type: "object",
          properties: {
            total: {
              type: "integer",
              example: 100,
            },
            page: {
              type: "integer",
              example: 1,
            },
            limit: {
              type: "integer",
              example: 10,
            },
            total_pages: {
              type: "integer",
              example: 10,
            },
          },
        }
      },
    },
    tags: [
      {
        name: "Fleet Auth",
        description: "Fleet operator authentication endpoints",
      },
      {
        name: "Fleet Management",
        description: "Fleet operator CRUD operations (Super Admin only)",
      },
      {
        name: "Company Auth",
        description: "Company user authentication endpoints",
      },
      {
        name: "Company Management",
        description: "Company user CRUD operations",
      },
      {
        name: "Company Users",
        description: "Company user management and CRUD operations",
      },
      {
        name: "User Profile",
        description: "User profile management",
      },
      {
        name: "Customer Auth",
        description: "Customer authentication endpoints (OTP-based)",
      },
      {
        name: "Token",
        description: "Token management and refresh endpoints",
      },
    ],
  },
  apis: isDevelopment
    ? ["./src/routes/*.ts", "./src/controllers/*.ts"]
    : ["./dist/routes/*.js", "./dist/controllers/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
