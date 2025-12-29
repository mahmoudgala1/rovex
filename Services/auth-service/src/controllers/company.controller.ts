import { Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import Company from "../models/Company";
import CompanyUser from "../models/CompanyUser";
import AuditLog from "../models/AuditLog";
import { AppError } from "../utils/errors";
import { successResponse } from "../utils/responses";
import { logger } from "../utils/logger";
import notificationService from "../services/notification.service";
import { generateId, paginationMeta, parsePagination } from "../utils/helpers";
import { env } from "../config/environment";
import { getRolePermissions } from "../config/permissions";

class CompanyController {
  constructor() {
    this.createCompany = this.createCompany.bind(this);
    this.listCompanies = this.listCompanies.bind(this);
    this.getCompany = this.getCompany.bind(this);
    this.updateCompany = this.updateCompany.bind(this);
    this.updateCompanyStatus = this.updateCompanyStatus.bind(this);
    this.activateCompany = this.activateCompany.bind(this);
    this.suspendCompany = this.suspendCompany.bind(this);
    this.cancelCompany = this.cancelCompany.bind(this);
    this.addLocation = this.addLocation.bind(this);
    this.updateLocation = this.updateLocation.bind(this);
    this.deleteLocation = this.deleteLocation.bind(this);
    this.assignRovers = this.assignRovers.bind(this);
    this.unassignRovers = this.unassignRovers.bind(this);
    this.regenerateApiCredentials = this.regenerateApiCredentials.bind(this);
    this.updateSettings = this.updateSettings.bind(this);
    this.getCompanyStats = this.getCompanyStats.bind(this);
    this.generateTempPassword = this.generateTempPassword.bind(this);
  }

  async createCompany(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        name,
        business_type,
        contact,
        subscription,
        locations,
        assigned_rovers,
        admin_user,
      } = req.body;

      const existingCompany = await Company.findOne({ name });
      if (existingCompany) {
        throw new AppError("Company with this name already exists", 400);
      }

      const existingUser = await CompanyUser.findOne({
        email: admin_user.email,
      });
      if (existingUser) {
        throw new AppError("Admin email already exists", 400);
      }

      const apiKey = `pk_${business_type}_${generateId("API")}`;
      const apiSecret = this.generateTempPassword(32);
      const apiSecretHash = await bcrypt.hash(apiSecret, 10);

      const locationsWithIds = locations.map((loc: any) => ({
        ...loc,
        location_id: generateId("LOC"),
      }));

      const trialDays = subscription.tier === "enterprise" ? 30 : 7;
      const renewalDate = new Date();
      renewalDate.setDate(renewalDate.getDate() + trialDays);

      const company = await Company.create({
        name,
        business_type,
        contact,
        subscription: {
          ...subscription,
          status: "trial",
          start_date: new Date(),
          renewal_date: renewalDate,
        },
        locations: locationsWithIds,
        api_credentials: {
          api_key: apiKey,
          api_secret_hash: apiSecretHash,
          rate_limit:
            subscription.tier === "starter"
              ? 60
              : subscription.tier === "professional"
              ? 300
              : 1000,
        },
        settings: {
          auto_dispatch: true,
          require_otp:
            business_type === "healthcare" || business_type === "campus",
          enable_face_detection: false,
          enable_weight_check: business_type === "healthcare",
          default_delivery_timeout: 30,
          notification_preferences: {
            email: true,
            sms: true,
            webhook: false,
          },
        },
        assigned_rovers: assigned_rovers || [],
        usage_limits: {
          max_concurrent_deliveries:
            subscription.tier === "starter"
              ? 5
              : subscription.tier === "professional"
              ? 20
              : 100,
          max_monthly_deliveries: subscription.pricing.included_deliveries,
          max_locations:
            subscription.tier === "starter"
              ? 1
              : subscription.tier === "professional"
              ? 5
              : 999,
          max_users:
            subscription.tier === "starter"
              ? 3
              : subscription.tier === "professional"
              ? 20
              : 999,
        },
        stats: {
          total_deliveries: 0,
          successful_deliveries: 0,
          failed_deliveries: 0,
          average_delivery_time: 0,
          customer_satisfaction: 0,
        },
        onboarded_by: req.user!.user_id,
        onboarded_at: new Date(),
        status: "trial",
      });

      let adminUser;
      let tempPassword;

      try {
        tempPassword = this.generateTempPassword(16);

        adminUser = await CompanyUser.create({
          company_id: company.company_id,
          email: admin_user.email,
          name: admin_user.name,
          phone: admin_user.phone,
          role: "company_admin",
          permissions: getRolePermissions("company_admin", "company"),
          password_hash: tempPassword,
          password_must_change: true,
          status: "active",
          created_by: req.user!.user_id,
        });
      } catch (adminError) {
        logger.error(
          `Failed to create admin user for company ${company.company_id}, rolling back...`,
          adminError
        );

        await Company.deleteOne({ company_id: company.company_id });

        logger.info(
          `Company ${company.company_id} deleted due to admin creation failure`
        );

        throw new AppError(
          "Failed to create admin user. Company creation rolled back.",
          500
        );
      }

      try {
        await notificationService.sendEmail({
          to: admin_user.email,
          subject: "Welcome to ROVEX Fleet Platform",
          template: "company_welcome",
          theme: "dark",
          data: {
            company_name: company.name,
            admin_name: admin_user.name,
            email: admin_user.email,
            temporary_password: tempPassword,
            api_key: apiKey,
            login_url: `${env.DASHBOARD_URL}/login`,
            support_email: env.SUPPORT_EMAIL,
          },
        });
      } catch (emailError) {
        logger.error("Failed to send welcome email:", emailError);
      }

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "company.create",
        resource_type: "company",
        resource_id: company.company_id,
        changes: {
          company_name: name,
          business_type,
          subscription_tier: subscription.tier,
        },
        ip_address: req.ip,
      });

      logger.info(
        `Company created: ${company.company_id} by ${req.user!.user_id}`
      );

      successResponse(
        res,
        {
          company: {
            company_id: company.company_id,
            name: company.name,
            business_type: company.business_type,
            status: company.status,
            subscription: {
              tier: company.subscription.tier,
              status: company.subscription.status,
              trial_ends: renewalDate,
            },
            locations: company.locations,
          },
          admin_credentials: {
            email: adminUser.email,
            temporary_password: tempPassword,
            reset_required: true,
          },
          api_credentials: {
            api_key: apiKey,
            api_secret: apiSecret,
            rate_limit: company.api_credentials.rate_limit,
          },
        },
        "Company created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async listCompanies(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const {
        business_type,
        status,
        tier,
        search,
        page = 1,
        limit = 20,
        sort_by = "created_at",
        sort_order = "desc",
      } = req.query;

      const filter: any = {};

      if (business_type) filter.business_type = business_type;
      if (status) filter.status = status;
      if (tier) filter["subscription.tier"] = tier;

      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { "contact.email": { $regex: search, $options: "i" } },
        ];
      }

      const { skip } = parsePagination(Number(page), Number(limit));
      const sortOrder = sort_order === "asc" ? 1 : -1;

      const [companies, total] = await Promise.all([
        Company.find(filter)
          .select("-api_credentials.api_secret_hash")
          .sort({ [sort_by as string]: sortOrder })
          .skip(skip)
          .limit(Number(limit))
          .lean(),
        Company.countDocuments(filter),
      ]);

      successResponse(res, {
        companies,
        pagination: paginationMeta(total, Number(page), Number(limit)),
      });
    } catch (error) {
      next(error);
    }
  }

  async getCompany(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { company_id } = req.params;

      const company = await Company.findOne({ company_id }).select(
        "-api_credentials.api_secret_hash"
      );

      if (!company) {
        throw new AppError("Company not found", 404);
      }

      const userCount = await CompanyUser.countDocuments({
        company_id,
        status: "active",
      });

      successResponse(res, {
        company: {
          ...company.toObject(),
          user_count: userCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async updateCompany(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { company_id } = req.params;
      const updates = req.body;

      delete updates.company_id;
      delete updates.api_credentials;
      delete updates.status;
      delete updates.subscription;
      delete updates.stats;
      delete updates.assigned_rovers;
      delete updates.created_at;
      delete updates.updated_at;

      const oldCompany = await Company.findOne({ company_id });
      if (!oldCompany) {
        throw new AppError("Company not found", 404);
      }

      const company = await Company.findOneAndUpdate(
        { company_id },
        { $set: updates },
        { new: true, runValidators: true }
      ).select("-api_credentials.api_secret_hash");

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "company.update",
        resource_type: "company",
        resource_id: company_id,
        changes: {
          before: {
            name: oldCompany.name,
            contact: oldCompany.contact,
          },
          after: updates,
        },
        ip_address: req.ip,
      });

      logger.info(`Company updated: ${company_id}`);

      successResponse(res, { company }, "Company updated successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateCompanyStatus(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { company_id } = req.params;
      const { status, reason } = req.body;

      const validStatuses = ["active", "trial", "suspended", "cancelled"];
      if (!validStatuses.includes(status)) {
        throw new AppError(
          `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
          400
        );
      }

      const company = await Company.findOne({ company_id });
      if (!company) {
        throw new AppError("Company not found", 404);
      }

      const oldStatus = company.status;
      company.status = status as any;
      company.subscription.status = status as any;

      await company.save();

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: `company.status_change.${status}`,
        resource_type: "company",
        resource_id: company_id,
        changes: {
          before: { status: oldStatus },
          after: { status, reason: reason || "No reason provided" },
        },
        ip_address: req.ip,
      });

      logger.info(
        `Company status changed: ${company_id} from ${oldStatus} to ${status}`
      );

      successResponse(
        res,
        {
          company: {
            company_id: company.company_id,
            name: company.name,
            status: company.status,
          },
        },
        `Company ${status} successfully`
      );
    } catch (error) {
      next(error);
    }
  }

  async activateCompany(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { company_id } = req.params;

      const company = await Company.findOneAndUpdate(
        { company_id },
        {
          status: "active",
          "subscription.status": "active",
        },
        { new: true }
      ).select("-api_credentials.api_secret_hash");

      if (!company) {
        throw new AppError("Company not found", 404);
      }

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "company.activate",
        resource_type: "company",
        resource_id: company_id,
        ip_address: req.ip,
      });

      logger.info(`Company activated: ${company_id}`);

      successResponse(res, { company }, "Company activated successfully");
    } catch (error) {
      next(error);
    }
  }

  async suspendCompany(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { company_id } = req.params;
      const { reason } = req.body;

      const company = await Company.findOneAndUpdate(
        { company_id },
        {
          status: "suspended",
          "subscription.status": "suspended",
        },
        { new: true }
      ).select("-api_credentials.api_secret_hash");

      if (!company) {
        throw new AppError("Company not found", 404);
      }

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "company.suspend",
        resource_type: "company",
        resource_id: company_id,
        changes: {
          reason: reason || "No reason provided",
        },
        ip_address: req.ip,
      });

      try {
        const adminUser = await CompanyUser.findOne({
          company_id,
          role: "company_admin",
          status: "active",
        });

        if (adminUser) {
          await notificationService.sendEmail({
            to: adminUser.email,
            subject: "ROVEX Account Suspended",
            template: "account_suspended",
            theme: "dark",
            data: {
              company_name: company.name,
              reason: reason || "Please contact support for details",
              support_email: env.SUPPORT_EMAIL || "support@rovex.com",
            },
          });
        }
      } catch (emailError) {
        logger.error("Failed to send suspension email:", emailError);
      }

      logger.info(
        `Company suspended: ${company_id}. Reason: ${reason || "N/A"}`
      );

      successResponse(res, { company }, "Company suspended successfully");
    } catch (error) {
      next(error);
    }
  }

  async cancelCompany(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { company_id } = req.params;

      const company = await Company.findOneAndUpdate(
        { company_id },
        {
          status: "cancelled",
          "subscription.status": "cancelled",
        },
        { new: true }
      ).select("-api_credentials.api_secret_hash");

      if (!company) {
        throw new AppError("Company not found", 404);
      }

      await CompanyUser.updateMany({ company_id }, { status: "inactive" });

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "company.cancel",
        resource_type: "company",
        resource_id: company_id,
        ip_address: req.ip,
      });

      logger.info(`Company cancelled: ${company_id}`);

      successResponse(res, { company }, "Company cancelled successfully");
    } catch (error) {
      next(error);
    }
  }

  async addLocation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { company_id } = req.params;
      const location = req.body;

      const company = await Company.findOne({ company_id });
      if (!company) {
        throw new AppError("Company not found", 404);
      }

      if (company.locations.length >= company.usage_limits.max_locations) {
        throw new AppError(
          "Maximum locations limit reached. Upgrade your plan.",
          400
        );
      }

      if (location.is_primary) {
        company.locations.forEach((loc) => {
          loc.is_primary = false;
        });
      } else {
        if (company.locations.length === 0) {
          location.is_primary = true;
        }
      }

      const newLocation = {
        ...location,
        location_id: generateId("LOC"),
      };

      company.locations.push(newLocation as any);
      await company.save();

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "company.location.add",
        resource_type: "company",
        resource_id: company_id,
        changes: { location: newLocation },
        ip_address: req.ip,
      });

      logger.info(
        `Location added to company ${company_id}: ${newLocation.location_id}`
      );

      successResponse(
        res,
        { location: newLocation },
        "Location added successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async updateLocation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { company_id, location_id } = req.params;
      const updates = req.body;

      delete updates.location_id;

      const company = await Company.findOne({ company_id });
      if (!company) {
        throw new AppError("Company not found", 404);
      }

      const locationIndex = company.locations.findIndex(
        (loc) => loc.location_id === location_id
      );

      if (locationIndex === -1) {
        throw new AppError("Location not found", 404);
      }

      if (updates.is_primary === true) {
        company.locations.forEach((loc, idx) => {
          if (idx !== locationIndex) {
            loc.is_primary = false;
          }
        });
      } else if (updates.is_primary === false) {
        if (company.locations[locationIndex].is_primary) {
          const hasAnotherPrimary = company.locations.some(
            (loc, idx) => idx !== locationIndex && loc.is_primary
          );
          if (!hasAnotherPrimary) {
            throw new AppError(
              "Cannot unset the only primary location. Set another location as primary first.",
              400
            );
          }
        }
      }

      const locationSubdoc = company.locations[locationIndex];
      Object.assign(locationSubdoc, updates);

      await company.save();

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "company.location.update",
        resource_type: "company",
        resource_id: company_id,
        changes: { location_id, updates },
        ip_address: req.ip,
      });

      logger.info(`Location updated: ${location_id} for company ${company_id}`);

      successResponse(
        res,
        {
          location: company.locations[locationIndex],
        },
        "Location updated successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  async deleteLocation(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { company_id, location_id } = req.params;

      const company = await Company.findOne({ company_id });
      if (!company) {
        throw new AppError("Company not found", 404);
      }

      const locationIndex = company.locations.findIndex(
        (loc) => loc.location_id === location_id
      );

      if (locationIndex === -1) {
        throw new AppError("Location not found", 404);
      }

      if (
        company.locations[locationIndex].is_primary &&
        company.locations.length === 1
      ) {
        throw new AppError("Cannot delete the only primary location", 400);
      }

      if (
        company.locations[locationIndex].is_primary &&
        company.locations.length > 1
      ) {
        const nextActiveLocation = company.locations.find(
          (loc, idx) => idx !== locationIndex && loc.active
        );
        if (nextActiveLocation) {
          nextActiveLocation.is_primary = true;
        }
      }

      company.locations.splice(locationIndex, 1);
      await company.save();

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "company.location.delete",
        resource_type: "company",
        resource_id: company_id,
        changes: { location_id },
        ip_address: req.ip,
      });

      logger.info(
        `Location deleted: ${location_id} from company ${company_id}`
      );

      successResponse(res, { message: "Location deleted successfully" });
    } catch (error) {
      next(error);
    }
  }

  async assignRovers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { company_id } = req.params;
      const { rover_ids } = req.body;

      if (!Array.isArray(rover_ids) || rover_ids.length === 0) {
        throw new AppError("rover_ids must be a non-empty array", 400);
      }

      const company = await Company.findOne({ company_id });
      if (!company) {
        throw new AppError("Company not found", 404);
      }

      const newRovers = rover_ids.filter(
        (id) => !company.assigned_rovers.includes(id)
      );

      company.assigned_rovers.push(...newRovers);
      await company.save();

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "company.rovers.assign",
        resource_type: "company",
        resource_id: company_id,
        changes: { rover_ids: newRovers },
        ip_address: req.ip,
      });

      logger.info(
        `Rovers assigned to company ${company_id}: ${newRovers.join(", ")}`
      );

      successResponse(
        res,
        {
          assigned_rovers: company.assigned_rovers,
        },
        "Rovers assigned successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  async unassignRovers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { company_id } = req.params;
      const { rover_ids } = req.body;

      if (!Array.isArray(rover_ids) || rover_ids.length === 0) {
        throw new AppError("rover_ids must be a non-empty array", 400);
      }

      const company = await Company.findOne({ company_id });
      if (!company) {
        throw new AppError("Company not found", 404);
      }

      company.assigned_rovers = company.assigned_rovers.filter(
        (id) => !rover_ids.includes(id)
      );
      await company.save();

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "company.rovers.unassign",
        resource_type: "company",
        resource_id: company_id,
        changes: { rover_ids },
        ip_address: req.ip,
      });

      logger.info(
        `Rovers unassigned from company ${company_id}: ${rover_ids.join(", ")}`
      );

      successResponse(
        res,
        {
          assigned_rovers: company.assigned_rovers,
        },
        "Rovers unassigned successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  async regenerateApiCredentials(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { company_id } = req.params;

      const company = await Company.findOne({ company_id });
      if (!company) {
        throw new AppError("Company not found", 404);
      }

      const apiKey = `pk_${company.business_type}_${generateId("API")}`;
      const apiSecret = this.generateTempPassword(32);
      const apiSecretHash = await bcrypt.hash(apiSecret, 10);

      company.api_credentials.api_key = apiKey;
      company.api_credentials.api_secret_hash = apiSecretHash;
      await company.save();

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "company.api_credentials.regenerate",
        resource_type: "company",
        resource_id: company_id,
        ip_address: req.ip,
      });

      logger.info(`API credentials regenerated for company ${company_id}`);

      successResponse(
        res,
        {
          api_credentials: {
            api_key: apiKey,
            api_secret: apiSecret,
            rate_limit: company.api_credentials.rate_limit,
          },
        },
        "API credentials regenerated successfully. Save the secret securely - it will not be shown again."
      );
    } catch (error) {
      next(error);
    }
  }

  async updateSettings(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { company_id } = req.params;
      const settings = req.body;

      const company = await Company.findOne({ company_id });
      if (!company) {
        throw new AppError("Company not found", 404);
      }

      company.settings = {
        ...company.settings,
        ...settings,
      } as any;

      await company.save();

      await AuditLog.create({
        actor_id: req.user!.user_id,
        actor_type: "fleet_operator",
        action: "company.settings.update",
        resource_type: "company",
        resource_id: company_id,
        changes: settings,
        ip_address: req.ip,
      });

      logger.info(`Settings updated for company ${company_id}`);

      successResponse(
        res,
        { settings: company.settings },
        "Settings updated successfully"
      );
    } catch (error) {
      next(error);
    }
  }

  async getCompanyStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { company_id } = req.params;

      const company = await Company.findOne({ company_id });
      if (!company) {
        throw new AppError("Company not found", 404);
      }

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const [activeUsers, monthlyDeliveries] = await Promise.all([
        CompanyUser.countDocuments({ company_id, status: "active" }),
        Promise.resolve(0),
      ]);

      successResponse(res, {
        stats: {
          total_deliveries: company.stats.total_deliveries,
          successful_deliveries: company.stats.successful_deliveries,
          failed_deliveries: company.stats.failed_deliveries,
          average_delivery_time: company.stats.average_delivery_time,
          customer_satisfaction: company.stats.customer_satisfaction,
          success_rate:
            company.stats.total_deliveries > 0
              ? Math.round(
                  (company.stats.successful_deliveries /
                    company.stats.total_deliveries) *
                    100
                )
              : 0,
          failure_rate:
            company.stats.total_deliveries > 0
              ? Math.round(
                  (company.stats.failed_deliveries /
                    company.stats.total_deliveries) *
                    100
                )
              : 0,
          active_users: activeUsers,
          monthly_deliveries: monthlyDeliveries,
          active_locations: company.locations.filter((loc) => loc.active)
            .length,
          total_locations: company.locations.length,
          assigned_rovers: company.assigned_rovers.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  private generateTempPassword(length: number = 16): string {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "Rovex";
    for (let i = 0; i < length - 5; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password + "2025!";
  }
}

export default new CompanyController();
