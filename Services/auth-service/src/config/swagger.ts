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

- **Access Token**: 1 day
- **Refresh Token**: 7 days

## Base URL
- Production: \`https://rovex.click/auth/api/v1\`
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
        url: "https://rovex.click/auth/api/v1",
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
            has_next: {
              type: "boolean",
              example: true,
            },
            has_prev: {
              type: "boolean",
              example: false,
            },
          },
        },
        CompanyUserDetailed: {
          type: "object",
          properties: {
            user_id: {
              type: "string",
              example: "USR_1234567890",
              description: "Unique user identifier",
            },
            company_id: {
              type: "string",
              example: "CMP_0987654321",
              description: "Company identifier",
            },
            email: {
              type: "string",
              format: "email",
              example: "john.doe@company.com",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            phone: {
              type: "string",
              example: "+1234567890",
              nullable: true,
            },
            role: {
              type: "string",
              enum: [
                "company_admin",
                "dispatcher",
                "store_manager",
                "customer_support",
                "analyst",
              ],
              example: "dispatcher",
            },
            permissions: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["deliveries:read", "deliveries:write", "rovers:read"],
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "suspended"],
              example: "active",
            },
            password_must_change: {
              type: "boolean",
              example: false,
            },
            last_login: {
              type: "string",
              format: "date-time",
              nullable: true,
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
        CreateCompanyUserRequest: {
          type: "object",
          required: ["name", "email", "role"],
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john.doe@company.com",
            },
            phone: {
              type: "string",
              pattern: "^\\+?[1-9]\\d{1,14}$",
              example: "+1234567890",
            },
            role: {
              type: "string",
              enum: [
                "company_admin",
                "dispatcher",
                "store_manager",
                "customer_support",
                "analyst",
              ],
              example: "dispatcher",
            },
          },
        },
        UpdateCompanyUserRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              example: "John Doe",
            },
            phone: {
              type: "string",
              pattern: "^\\+?[1-9]\\d{1,14}$",
              example: "+1234567890",
            },
            role: {
              type: "string",
              enum: [
                "company_admin",
                "dispatcher",
                "store_manager",
                "customer_support",
                "analyst",
              ],
              example: "store_manager",
            },
            permissions: {
              type: "array",
              items: {
                type: "string",
              },
              example: ["deliveries:read", "analytics:read"],
            },
            status: {
              type: "string",
              enum: ["active", "inactive", "suspended"],
              example: "active",
            },
          },
        },
        UpdateProfileRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              example: "John Doe",
            },
            phone: {
              type: "string",
              pattern: "^\\+?[1-9]\\d{1,14}$",
              example: "+1234567890",
            },
          },
        },
        CompanyUserListResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "Users retrieved successfully",
            },
            data: {
              type: "object",
              properties: {
                users: {
                  type: "array",
                  items: {
                    $ref: "#/components/schemas/CompanyUserDetailed",
                  },
                },
                pagination: {
                  $ref: "#/components/schemas/PaginationMeta",
                },
              },
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
          },
        },
        CompanyUserResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "User retrieved successfully",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/CompanyUserDetailed",
                },
              },
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
          },
        },
        CreateCompanyUserResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            message: {
              type: "string",
              example: "User created successfully",
            },
            data: {
              type: "object",
              properties: {
                user: {
                  $ref: "#/components/schemas/CompanyUserDetailed",
                },
                temporary_password: {
                  type: "string",
                  description: "Temporary password sent via email",
                  example: "TempPass123!@#",
                },
              },
            },
            timestamp: {
              type: "string",
              format: "date-time",
            },
          },
        },
        CustomerProfile: {
          type: "object",
          properties: {
            customer_id: {
              type: "string",
              example: "CUST_ABC123XYZ",
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            phone: {
              type: "string",
              example: "+201234567890",
              nullable: true,
            },
            avatar_url: {
              type: "string",
              format: "uri",
              example: "https://example.com/avatar.jpg",
              nullable: true,
            },
            is_verified: {
              type: "boolean",
              example: true,
            },
            status: {
              type: "string",
              enum: ["active", "suspended", "banned"],
              example: "active",
            },
            preferences: {
              $ref: "#/components/schemas/CustomerPreferences",
            },
            addresses: {
              type: "array",
              items: {
                $ref: "#/components/schemas/CustomerAddress",
              },
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
        CustomerPreferences: {
          type: "object",
          properties: {
            language: {
              type: "string",
              enum: ["en", "ar"],
              example: "en",
            },
            notifications: {
              type: "object",
              properties: {
                sms: {
                  type: "boolean",
                  example: true,
                },
                email: {
                  type: "boolean",
                  example: true,
                },
                push: {
                  type: "boolean",
                  example: true,
                },
              },
            },
            marketing_opt_in: {
              type: "boolean",
              example: false,
            },
          },
        },
        CustomerAddress: {
          type: "object",
          properties: {
            address_id: {
              type: "string",
              example: "ADDR_123456",
            },
            label: {
              type: "string",
              example: "Home",
            },
            address_line1: {
              type: "string",
              example: "123 Main Street",
            },
            address_line2: {
              type: "string",
              example: "Apt 4B",
              nullable: true,
            },
            city: {
              type: "string",
              example: "Cairo",
            },
            state: {
              type: "string",
              example: "Cairo Governorate",
              nullable: true,
            },
            postal_code: {
              type: "string",
              example: "11511",
              nullable: true,
            },
            country: {
              type: "string",
              example: "EG",
            },
            location: {
              type: "object",
              properties: {
                type: {
                  type: "string",
                  example: "Point",
                },
                coordinates: {
                  type: "array",
                  items: {
                    type: "number",
                  },
                  example: [31.2357, 30.0444],
                  description: "[longitude, latitude]",
                },
              },
            },
            is_default: {
              type: "boolean",
              example: true,
            },
            notes: {
              type: "string",
              example: "Ring the doorbell twice",
              nullable: true,
            },
          },
        },
        UpdateCustomerProfileRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            name: {
              type: "string",
              minLength: 2,
              maxLength: 100,
              example: "John Doe",
            },
            phone: {
              type: "string",
              pattern: "^\\+?[1-9]\\d{1,14}$",
              example: "+201234567890",
            },
            avatar_url: {
              type: "string",
              format: "uri",
              example: "https://example.com/avatar.jpg",
            },
          },
        },
        UpdatePreferencesRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            language: {
              type: "string",
              enum: ["en", "ar"],
              example: "en",
            },
            notifications: {
              type: "object",
              properties: {
                sms: {
                  type: "boolean",
                },
                email: {
                  type: "boolean",
                },
                push: {
                  type: "boolean",
                },
              },
            },
            marketing_opt_in: {
              type: "boolean",
              example: false,
            },
          },
        },
        AddAddressRequest: {
          type: "object",
          required: ["label", "address_line1", "city", "latitude", "longitude"],
          properties: {
            label: {
              type: "string",
              example: "Home",
            },
            address_line1: {
              type: "string",
              example: "123 Main Street",
            },
            address_line2: {
              type: "string",
              example: "Apt 4B",
            },
            city: {
              type: "string",
              example: "Cairo",
            },
            state: {
              type: "string",
              example: "Cairo Governorate",
            },
            postal_code: {
              type: "string",
              example: "11511",
            },
            country: {
              type: "string",
              default: "EG",
              example: "EG",
            },
            latitude: {
              type: "number",
              minimum: -90,
              maximum: 90,
              example: 30.0444,
            },
            longitude: {
              type: "number",
              minimum: -180,
              maximum: 180,
              example: 31.2357,
            },
            is_default: {
              type: "boolean",
              default: false,
            },
            notes: {
              type: "string",
              example: "Ring the doorbell twice",
            },
          },
        },
        UpdateAddressRequest: {
          type: "object",
          minProperties: 1,
          properties: {
            label: {
              type: "string",
              example: "Work",
            },
            address_line1: {
              type: "string",
              example: "456 Office Building",
            },
            address_line2: {
              type: "string",
            },
            city: {
              type: "string",
            },
            state: {
              type: "string",
            },
            postal_code: {
              type: "string",
            },
            country: {
              type: "string",
            },
            latitude: {
              type: "number",
              minimum: -90,
              maximum: 90,
            },
            longitude: {
              type: "number",
              minimum: -180,
              maximum: 180,
            },
            is_default: {
              type: "boolean",
            },
            notes: {
              type: "string",
            },
          },
        },
        DeleteAccountRequest: {
          type: "object",
          required: ["password"],
          properties: {
            password: {
              type: "string",
              format: "password",
              description: "Current password for verification",
            },
          },
        },
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
        name: "Customer Profile",
        description:
          "Customer profile management, preferences, and address operations",
      },
      {
        name: "Token",
        description: "Token management and refresh endpoints",
      },
    ],
  },
  apis: isDevelopment
    ? ["./src/routes/*.ts", "./src/controllers/*.ts"]
    : ["./dist/*.js", "./dist/*.js"],
};

export const swaggerSpec = swaggerJsdoc(options);
