import Joi from "joi";

export const changePasswordSchema = Joi.object({
  current_password: Joi.string().required(),
  new_password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
  confirm_password: Joi.string()
    .valid(Joi.ref("new_password"))
    .required()
    .messages({
      "any.only": "Passwords must match",
    }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  company_id: Joi.string().optional(),
});

export const resetPasswordSchema = Joi.object({
  user_id: Joi.string().required(),
  token: Joi.string().required(),
  new_password: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
    }),
});

export const logoutSchema = Joi.object({
  refresh_token: Joi.string().required().messages({
    "string.empty": "Refresh token is required",
    "any.required": "Refresh token is required",
  }),
});

export const createCompanySchema = Joi.object({
  name: Joi.string().min(2).max(200).required(),
  business_type: Joi.string()
    .valid("restaurant", "healthcare", "campus", "ecommerce", "logistics")
    .required(),
  contact: Joi.object({
    primary_contact: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    address: Joi.string().required(),
  }).required(),
  subscription: Joi.object({
    tier: Joi.string()
      .valid("starter", "professional", "enterprise")
      .required(),
    billing_cycle: Joi.string().valid("monthly", "yearly").required(),
    pricing: Joi.object({
      base_fee: Joi.number().min(0).required(),
      per_delivery_fee: Joi.number().min(0).required(),
      included_deliveries: Joi.number().min(0).required(),
      overage_rate: Joi.number().min(0).required(),
    }).required(),
  }).required(),
  locations: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        address: Joi.string().required(),
        coordinates: Joi.object({
          type: Joi.string().valid("Point").required(),
          coordinates: Joi.array().length(2).items(Joi.number()).required(),
        }).required(),
        operating_hours: Joi.object()
          .pattern(
            Joi.string(),
            Joi.object({
              open: Joi.string().required(),
              close: Joi.string().required(),
            })
          )
          .optional(),
        is_primary: Joi.boolean().optional(),
        active: Joi.boolean().optional(),
      })
    )
    .min(1)
    .required(),
  assigned_rovers: Joi.array().items(Joi.string()).optional(),
  admin_user: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().required(),
    role: Joi.string().valid("company_admin").required(),
  }).required(),
});

export const updateCompanySchema = Joi.object({
  name: Joi.string().min(2).max(200).optional(),
  contact: Joi.object({
    primary_contact: Joi.string().optional(),
    email: Joi.string().email().optional(),
    phone: Joi.string().optional(),
    address: Joi.string().optional(),
  }).optional(),
});

export const companyStatusSchema = Joi.object({
  status: Joi.string()
    .valid("active", "trial", "suspended", "cancelled")
    .required(),
  reason: Joi.string().max(500).optional(),
});

export const addLocationSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  coordinates: Joi.object({
    type: Joi.string().valid("Point").required(),
    coordinates: Joi.array().length(2).items(Joi.number()).required(),
  }).required(),
  operating_hours: Joi.object()
    .pattern(
      Joi.string(),
      Joi.object({
        open: Joi.string().required(),
        close: Joi.string().required(),
      })
    )
    .optional(),
  is_primary: Joi.boolean().optional(),
  active: Joi.boolean().optional(),
});

export const updateLocationSchema = Joi.object({
  name: Joi.string().optional(),
  address: Joi.string().optional(),
  coordinates: Joi.object({
    type: Joi.string().valid("Point").optional(),
    coordinates: Joi.array().length(2).items(Joi.number()).optional(),
  }).optional(),
  operating_hours: Joi.object()
    .pattern(
      Joi.string(),
      Joi.object({
        open: Joi.string().required(),
        close: Joi.string().required(),
      })
    )
    .optional(),
  is_primary: Joi.boolean().optional(),
  active: Joi.boolean().optional(),
});

export const assignRoversSchema = Joi.object({
  rover_ids: Joi.array().items(Joi.string()).min(1).required(),
});

export const updateSettingsSchema = Joi.object({
  auto_dispatch: Joi.boolean().optional(),
  require_otp: Joi.boolean().optional(),
  enable_face_detection: Joi.boolean().optional(),
  enable_weight_check: Joi.boolean().optional(),
  default_delivery_timeout: Joi.number().min(1).max(120).optional(),
  notification_preferences: Joi.object({
    email: Joi.boolean().optional(),
    sms: Joi.boolean().optional(),
    webhook: Joi.boolean().optional(),
  }).optional(),
});