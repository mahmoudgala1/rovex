import * as grpc from "@grpc/grpc-js";
import { logger } from "../../utils/logger";

export class AuthGrpcService {
  //   verifyToken(
  //     call: grpc.ServerUnaryCall<any, any>,
  //     callback: grpc.sendUnaryData<any>,
  //   ): void {
  //     try {
  //       const { token } = call.request;

  //       if (!token) {
  //         callback(null, {
  //           valid: false,
  //           error: "Token is required",
  //         });
  //         return;
  //       }

  //       const decoded = verifyToken(token);

  //       if (!decoded) {
  //         callback(null, {
  //           valid: false,
  //           error: "Invalid or expired token",
  //         });
  //         return;
  //       }

  //       // Get user from database
  //       const user = mockUsers.get(decoded.userId);

  //       if (!user) {
  //         callback(null, {
  //           valid: false,
  //           error: "User not found",
  //         });
  //         return;
  //       }

  //       logger.info(`Token verified for user: ${user.email}`);

  //       callback(null, {
  //         valid: true,
  //         user: {
  //           id: user.id,
  //           email: user.email,
  //           name: user.name,
  //           role: user.role,
  //           permissions: user.permissions,
  //           metadata: user.metadata,
  //         },
  //       });
  //     } catch (error) {
  //       logger.error("Error verifying token:", error);
  //       callback(null, {
  //         valid: false,
  //         error: (error as Error).message,
  //       });
  //     }
  //   }


  // Get user by ID
  
  getUser(
    call: grpc.ServerUnaryCall<any, any>,
    callback: grpc.sendUnaryData<any>,
  ): void {
    try {
      const { user_id } = call.request;

      const user = {
        id: "admin_456",
        email: "admin@example.com",
        name: "Admin User",
        role: "admin",
        permissions: ["*"],
        metadata: {},
      };

      if (!user) {
        callback(null, {
          success: false,
          error: "User not found",
        });
        return;
      }

      callback(null, {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          permissions: user.permissions,
          metadata: user.metadata,
        },
      });
    } catch (error) {
      logger.error("Error getting user:", error);
      callback(null, {
        success: false,
        error: (error as Error).message,
      });
    }
  }

  //   checkPermission(
  //     call: grpc.ServerUnaryCall<any, any>,
  //     callback: grpc.sendUnaryData<any>,
  //   ): void {
  //     try {
  //       const { user_id, permission } = call.request;

  //       const user = mockUsers.get(user_id);

  //       if (!user) {
  //         callback(null, {
  //           allowed: false,
  //           error: "User not found",
  //         });
  //         return;
  //       }

  //       // Check if user has permission
  //       const hasPermission =
  //         user.permissions.includes("*") || // Admin
  //         user.permissions.includes(permission);

  //       callback(null, {
  //         allowed: hasPermission,
  //         error: hasPermission ? null : "Permission denied",
  //       });
  //     } catch (error) {
  //       logger.error("Error checking permission:", error);
  //       callback(null, {
  //         allowed: false,
  //         error: (error as Error).message,
  //       });
  //     }
  //   }
}
