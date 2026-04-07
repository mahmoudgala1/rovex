import { Request, Response, NextFunction } from "express";
import FleetOperator from "../models/FleetOperator";
import { AppError } from "../utils/errors";
import { successResponse } from "../utils/responses";
import { logger } from "../utils/logger";
import AuditLog from "../models/AuditLog";
import { getRolePermissions, PERMISSIONS } from "../config/permissions";
import authService from "../services/auth.service";
import { env } from "../config/environment";
import { paginationMeta, parsePagination } from "../utils/helpers";
import RabbitMQPublisher from "../services/rabbitmq.service";

class FleetController {
  constructor() {
    this.createOperator = this.createOperator.bind(this);
    this.listOperators = this.listOperators.bind(this);
    this.getOperator = this.getOperator.bind(this);
    this.updateOperator = this.updateOperator.bind(this);
    this.deactivateOperator = this.deactivateOperator.bind(this);
  }

  async createOperator(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { email, name, role, phone, permissions } = req.body;

      const existingOperator = await FleetOperator.findOne({ email });
      if (existingOperator) {
        throw new AppError("Operator with this email already exists", 400);
      }

      const tempPassword = authService.generateTempPassword();

      const rolePermissions =getRolePermissions(role, "fleet_operator");

      const operator = await FleetOperator.create({
        email,
        name,
        role,
        phone,
        permissions: rolePermissions,
        password_hash: tempPassword,
        password_must_change: true,
        status: "active",
        two_factor_enabled: false,
      });

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "fleet_operator.create",
        resource_type: "fleet_operator",
        resource_id: operator.operator_id,
        ip_address: req.ip,
      });

      logger.info(`Fleet operator created: ${operator.operator_id}`);

      const roleInfo = this.getFleetRoleInfo(role);
      const permissionsHtml = roleInfo.permissionsList
        .map(
          (perm: any) =>
            `<li style="margin-bottom: 8px; color: #64748b;">${perm}</li>`
        )
        .join("");

      await RabbitMQPublisher.publishEvent("send-notification", {
        channels: ["email"],
        data: {
          email: email,
          subject: "Welcome to ROVEX Fleet Operations",
          template: "fleet_operator_welcome",
          theme: "light",
          data: {
            operator_name: name,
            email: email,
            temporary_password: tempPassword,
            role: role,
            role_display: roleInfo.display,
            role_description: roleInfo.description,
            permissions_html: permissionsHtml,
            login_url: `${env.DASHBOARD_URL}/login`,
            dashboard_url: env.DASHBOARD_URL,
            admin_email: req.user!.email,
          },
        },
        metadata: {
          timestamp: new Date().toLocaleString(),
        },
      });

      successResponse(
        res,
        {
          operator: {
            operator_id: operator.operator_id,
            email: operator.email,
            name: operator.name,
            role: operator.role,
            permissions: operator.permissions,
            status: operator.status,
          },
          credentials: {
            email: operator.email,
            temporary_password: tempPassword,
            reset_required: true,
          },
        },
        "Fleet operator created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async listOperators(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { role, status, page = 1, limit = 20 } = req.query;

      const filter: any = {};
      if (role) filter.role = role;
      if (status) filter.status = status;

      const { skip } = parsePagination(Number(page), Number(limit));

      const [operators, total] = await Promise.all([
        FleetOperator.find(filter)
          .select(["-password_hash", "-__v", "-_id"])
          .sort({ created_at: 1 })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        FleetOperator.countDocuments(filter),
      ]);

      successResponse(res, {
        operators,
        pagination: paginationMeta(total, Number(page), Number(limit)),
      });
    } catch (error) {
      next(error);
    }
  }

  async getOperator(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { operator_id } = req.params;

      const operator = await FleetOperator.findOne({ operator_id }).select([
        "-password_hash",
        "-__v",
        "-_id",
      ]);

      if (!operator) {
        throw new AppError("Operator not found", 404);
      }

      successResponse(res, { operator });
    } catch (error) {
      next(error);
    }
  }

  async updateOperator(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { operator_id } = req.params;
      const updates = req.body;

      delete updates.operator_id;
      delete updates.email;
      delete updates.password_hash;
      delete updates.status;
      delete updates.created_at;
      delete updates.updated_at;

      if (updates.role) {
        updates.permissions =
          updates.permissions ||
          getRolePermissions(updates.role, "fleet_operator");
      }

      const oldOperator = await FleetOperator.findOne({ operator_id });
      if (!oldOperator) {
        throw new AppError("Operator not found", 404);
      }

      const operator = await FleetOperator.findOneAndUpdate(
        { operator_id },
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-password_hash");

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "fleet_operator.update",
        resource_type: "fleet_operator",
        resource_id: operator_id,
        changes: {
          before: {
            name: oldOperator.name,
            role: oldOperator.role,
            permissions: oldOperator.permissions,
            phone: oldOperator.phone,
          },
          after: updates,
        },
        ip_address: req.ip,
      });

      logger.info(`Fleet operator updated: ${operator_id}`);

      successResponse(res, { operator }, "Operator updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateOperatorStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { operator_id } = req.params;
      const { status, reason } = req.body;

      const validStatuses = ["active", "suspended", "inactive"];
      if (!validStatuses.includes(status)) {
        throw new AppError(
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          400
        );
      }

      if (req.user!.user_id === operator_id && status !== "active") {
        throw new AppError(
          "Cannot deactivate or suspend your own account",
          400
        );
      }

      const operator = await FleetOperator.findOne({ operator_id });
      if (!operator) {
        throw new AppError("Operator not found", 404);
      }

      const oldStatus = operator.status;
      operator.status = status as any;
      await operator.save();

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: `fleet_operator.status_change.${status}`,
        resource_type: "fleet_operator",
        resource_id: operator_id,
        changes: {
          before: { status: oldStatus },
          after: { status, reason: reason || "No reason provided" },
        },
        ip_address: req.ip,
      });

      logger.info(
        `Fleet operator status changed: ${operator_id} from ${oldStatus} to ${status}`
      );

      successResponse(
        res,
        {
          operator: {
            operator_id: operator.operator_id,
            email: operator.email,
            name: operator.name,
            status: operator.status,
          },
        },
        `Operator ${
          status === "active"
            ? "activated"
            : status === "suspended"
            ? "suspended"
            : "deactivated"
        } successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  async activateOperator(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { operator_id } = req.params;

      const operator = await FleetOperator.findOneAndUpdate(
        { operator_id },
        { status: "active" },
        { new: true }
      ).select(["-password_hash", "-__v", "-_id"]);

      if (!operator) {
        throw new AppError("Operator not found", 404);
      }

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "fleet_operator.activate",
        resource_type: "fleet_operator",
        resource_id: operator_id,
        ip_address: req.ip,
      });

      logger.info(`Fleet operator activated: ${operator_id}`);

      successResponse(res, { operator }, "Operator activated successfully");
    } catch (error) {
      next(error);
    }
  }

  async suspendOperator(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { operator_id } = req.params;
      const { reason } = req.body;

      if (req.user!.user_id === operator_id) {
        throw new AppError("Cannot suspend your own account", 400);
      }

      const operator = await FleetOperator.findOneAndUpdate(
        { operator_id },
        { status: "suspended" },
        { new: true }
      ).select(["-password_hash", "-__v", "-_id"]);

      if (!operator) {
        throw new AppError("Operator not found", 404);
      }

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "fleet_operator.suspend",
        resource_type: "fleet_operator",
        resource_id: operator_id,
        changes: {
          reason: reason || "No reason provided",
        },
        ip_address: req.ip,
      });

      logger.info(
        `Fleet operator suspended: ${operator_id}. Reason: ${reason || "N/A"}`
      );

      successResponse(res, { operator }, "Operator suspended successfully");
    } catch (error) {
      next(error);
    }
  }

  async deactivateOperator(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { operator_id } = req.params;

      if (req.user!.user_id === operator_id) {
        throw new AppError("Cannot deactivate your own account", 400);
      }

      const operator = await FleetOperator.findOneAndUpdate(
        { operator_id },
        { status: "inactive" },
        { new: true }
      ).select(["-password_hash", "-__v", "-_id"]);

      if (!operator) {
        throw new AppError("Operator not found", 404);
      }

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "fleet_operator.deactivate",
        resource_type: "fleet_operator",
        resource_id: operator_id,
        ip_address: req.ip,
      });

      logger.info(`Fleet operator deactivated: ${operator_id}`);

      successResponse(res, { operator }, "Operator deactivated successfully");
    } catch (error) {
      next(error);
    }
  }

  getFleetRoleInfo(role: string) {
    const roleMap: any = {
      super_admin: {
        display: "Super Administrator",
        description:
          "Full system access with all permissions to manage companies, fleet, and operations",
        permissionsList: [
          "All system permissions",
          "Manage companies and subscriptions",
          "Manage fleet operators",
          "Configure platform settings",
          "Access all analytics and reports",
        ],
      },
      fleet_manager: {
        display: "Fleet Manager",
        description: "Manage rover fleet, deployments, and company operations",
        permissionsList: [
          "Manage rover fleet",
          "View and edit companies",
          "Deploy and maintain rovers",
          "Monitor delivery operations",
          "Access global analytics",
        ],
      },
      operations_manager: {
        display: "Operations Manager",
        description: "Oversee daily operations, incidents, and mission control",
        permissionsList: [
          "Monitor missions and deliveries",
          "Manage incidents and escalations",
          "Intervene in operations",
          "View company information",
          "Access operational reports",
        ],
      },
      support_engineer: {
        display: "Support Engineer",
        description: "Technical support and troubleshooting",
        permissionsList: [
          "View system information",
          "Monitor rover health",
          "Access support tickets",
          "View company details",
          "Generate diagnostic reports",
        ],
      },
      analyst: {
        display: "Analyst",
        description: "Data analysis and reporting",
        permissionsList: [
          "View all analytics",
          "Export reports and data",
          "Access company metrics",
          "View delivery statistics",
          "Generate insights",
        ],
      },
    };

    return (
      roleMap[role] || {
        display: role,
        description: "Fleet operator",
        permissionsList: [],
      }
    );
  }
}

export default new FleetController();
