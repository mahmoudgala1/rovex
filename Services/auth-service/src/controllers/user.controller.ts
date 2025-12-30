import { Request, Response, NextFunction } from "express";
import CompanyUser from "../models/CompanyUser";
import Company from "../models/Company";
import { AppError } from "../utils/errors";
import { successResponse } from "../utils/responses";
import authServices from "../services/auth.service";
import notificationService from "../services/notification.service";
import { logger } from "../utils/logger";
import { env } from "../config/environment";
import { getRolePermissions } from "../config/permissions";

export async function getCompanyUsers(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { status, role, search } = req.query;
    const { page = 1, limit = 20 } = req.query;

    const filter: any = { company_id: req.company_id };

    if (status) {
      filter.status = status;
    }

    if (role) {
      filter.role = role;
    }

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [users, total] = await Promise.all([
      CompanyUser.find(filter)
        .select("-password_hash -_id -token_version -__v")
        .sort({ created_at: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CompanyUser.countDocuments(filter),
    ]);

    successResponse(
      res,
      {
        users,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
      "Users retrieved successfully"
    );
  } catch (error) {
    next(error);
  }
}

export async function getCompanyUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user_id } = req.params;

    const user = await CompanyUser.findOne({
      user_id,
      company_id: req.company_id,
    }).select("-password_hash -_id -token_version -__v");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    successResponse(res, { user }, "User retrieved successfully");
  } catch (error) {
    next(error);
  }
}

export async function createCompanyUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, phone, role } = req.body;

    const company = await Company.findOne({ company_id: req.company_id });
    if (!company) {
      throw new AppError("Company not found", 404);
    }

    const userCount = await CompanyUser.countDocuments({
      company_id: req.company_id,
      status: "active",
    });

    if (userCount >= company.usage_limits.max_users) {
      throw new AppError(
        `Maximum user limit reached (${company.usage_limits.max_users}). Please upgrade your plan.`,
        400
      );
    }

    const existingUser = await CompanyUser.findOne({
      email,
      company_id: req.company_id,
    });

    if (existingUser) {
      throw new AppError("User with this email already exists", 400);
    }

    const tempPassword = authServices.generateTempPassword(16);

    const permissions = getRolePermissions(role, "company");

    const newUser = await CompanyUser.create({
      company_id: req.company_id,
      email,
      name,
      phone,
      role,
      permissions,
      password_hash: tempPassword,
      password_must_change: true,
      status: "active",
      created_by: req.user!.user_id,
    });

    const roleInfo = getRoleInfo(role);

    const permissionsHtml = roleInfo.permissionsList
      .map(
        (perm) => `<li style="margin-bottom: 8px; color: #64748b;">${perm}</li>`
      )
      .join("");

    try {
      await notificationService.sendEmail({
        to: email,
        subject: `Welcome to ${company.name} on ROVEX`,
        template: "company_user_welcome",
        theme: "dark",
        data: {
          user_name: name,
          email: email,
          temporary_password: tempPassword,
          company_name: company.name,
          role: role,
          role_display: roleInfo.display,
          role_description: roleInfo.description,
          permissions_html: permissionsHtml,
          login_url: `${env.DASHBOARD_URL}/login`,
          dashboard_url: env.DASHBOARD_URL,
          admin_email: req.user!.email,
        },
      });
    } catch (emailError) {
      logger.error("Failed to send welcome email:", emailError);
    }

    logger.info(
      `User ${newUser.user_id} created in company ${req.company_id} by ${
        req.user!.user_id
      }`
    );

    successResponse(
      res,
      {
        user: {
          user_id: newUser.user_id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          status: newUser.status,
        },
        temporary_password: tempPassword,
      },
      "User created successfully",
      201
    );
  } catch (error) {
    next(error);
  }
}

export async function updateCompanyUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user_id } = req.params;
    const { name, phone, role, permissions, status } = req.body;

    const user = await CompanyUser.findOne({
      user_id,
      company_id: req.company_id,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (
      user_id === req.user!.user_id &&
      ((role && role !== user.role) || (status && status !== user.status))
    ) {
      throw new AppError("Cannot change your own role or status", 400);
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (status) user.status = status;

    if (role && role !== user.role) {
      user.role = role;
      user.permissions = getRolePermissions(role, "company");
    } else if (permissions) {
      user.permissions = permissions;
    }

    user.updated_at = new Date();

    await user.save();

    logger.info(
      `User ${user_id} updated in company ${req.company_id} by ${
        req.user!.user_id
      }`
    );

    successResponse(
      res,
      {
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: user.permissions,
          status: user.status,
        },
      },
      "User updated successfully"
    );
  } catch (error) {
    next(error);
  }
}

export async function deleteCompanyUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user_id } = req.params;

    if (user_id === req.user!.user_id) {
      throw new AppError("Cannot delete your own account", 400);
    }

    const user = await CompanyUser.findOne({
      user_id,
      company_id: req.company_id,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.status = "inactive";
    user.updated_at = new Date();
    await user.save();

    logger.info(
      `User ${user_id} deactivated in company ${req.company_id} by ${
        req.user!.user_id
      }`
    );

    successResponse(res, null, "User deactivated successfully");
  } catch (error) {
    next(error);
  }
}

export async function reactivateCompanyUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { user_id } = req.params;

    const user = await CompanyUser.findOne({
      user_id,
      company_id: req.company_id,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    const company = await Company.findOne({ company_id: req.company_id });
    if (!company) {
      throw new AppError("Company not found", 404);
    }

    const activeUserCount = await CompanyUser.countDocuments({
      company_id: req.company_id,
      status: "active",
    });

    if (activeUserCount >= company.usage_limits.max_users) {
      throw new AppError(
        `Maximum user limit reached. Cannot reactivate user.`,
        400
      );
    }

    user.status = "active";
    user.updated_at = new Date();
    await user.save();

    logger.info(
      `User ${user_id} reactivated in company ${req.company_id} by ${
        req.user!.user_id
      }`
    );

    successResponse(res, { user }, "User reactivated successfully");
  } catch (error) {
    next(error);
  }
}

export async function getMyProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await CompanyUser.findOne({
      user_id: req.user!.user_id,
      company_id: req.company_id,
    }).select("-password_hash -_id -token_version -__v");

    if (!user) {
      throw new AppError("User not found", 404);
    }

    successResponse(res, { user }, "Profile retrieved successfully");
  } catch (error) {
    next(error);
  }
}

export async function updateMyProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, phone } = req.body;

    const user = await CompanyUser.findOne({
      user_id: req.user!.user_id,
      company_id: req.company_id,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    if (name) user.name = name;
    if (phone) user.phone = phone;
    user.updated_at = new Date();

    await user.save();

    successResponse(
      res,
      {
        user: {
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          role: user.role,
        },
      },
      "Profile updated successfully"
    );
  } catch (error) {
    next(error);
  }
}

function getRoleInfo(role: string) {
  const roleMap: Record<
    string,
    { display: string; description: string; permissionsList: string[] }
  > = {
    company_admin: {
      display: "Company Administrator",
      description:
        "Full access to manage all company operations, users, and settings",
      permissionsList: [
        "Manage all users and permissions",
        "Create and manage deliveries",
        "Assign and monitor rovers",
        "Access all analytics and reports",
        "Configure company settings",
        "Manage billing and subscriptions",
      ],
    },
    dispatcher: {
      display: "Dispatcher",
      description:
        "Create and manage deliveries, assign rovers, and monitor operations",
      permissionsList: [
        "Create and manage deliveries",
        "Assign rovers to missions",
        "Monitor delivery status",
        "View operational analytics",
        "Coordinate with customer support",
      ],
    },
    store_manager: {
      display: "Store Manager",
      description:
        "Manage deliveries for your store location and track performance",
      permissionsList: [
        "Create deliveries for your store",
        "View delivery status",
        "Monitor store performance",
        "Access store analytics",
        "View available rovers",
      ],
    },
    customer_support: {
      display: "Customer Support",
      description:
        "View deliveries, assist customers, and handle support requests",
      permissionsList: [
        "View delivery information",
        "Update customer details",
        "Handle support requests",
        "Track delivery issues",
        "Communicate with customers",
      ],
    },
    analyst: {
      display: "Analyst",
      description:
        "View reports, analytics, and export data for business insights",
      permissionsList: [
        "Access all reports",
        "View analytics dashboards",
        "Export data and insights",
        "Generate custom reports",
        "Monitor KPIs and metrics",
      ],
    },
  };

  return (
    roleMap[role] || {
      display: role,
      description: "Team member",
      permissionsList: ["Access basic features"],
    }
  );
}
