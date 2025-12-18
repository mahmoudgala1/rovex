export const PERMISSIONS = {
  COMPANY_CREATE: "company.create",
  COMPANY_VIEW: "company.view",
  COMPANY_EDIT: "company.edit",
  COMPANY_DELETE: "company.delete",
  COMPANY_ALL: "company.*",

  USER_CREATE: "user.create",
  USER_VIEW: "user.view",
  USER_EDIT: "user.edit",
  USER_DELETE: "user.delete",
  USER_ALL: "user.*",

  FLEET_OPERATOR_CREATE: "fleet_operator.create",
  FLEET_OPERATOR_VIEW: "fleet_operator.view",
  FLEET_OPERATOR_EDIT: "fleet_operator.edit",
  FLEET_OPERATOR_DELETE: "fleet_operator.delete",
  FLEET_OPERATOR_ALL: "fleet_operator.*",

  ROVER_DEPLOY: "rover.deploy",

  ALL: "*",
};

export const ROLE_PERMISSIONS = {
  fleet_operator: {
    super_admin: [PERMISSIONS.ALL],

    fleet_manager: [
      PERMISSIONS.COMPANY_VIEW,
      PERMISSIONS.COMPANY_CREATE,
      PERMISSIONS.COMPANY_EDIT,
      PERMISSIONS.USER_VIEW,
      PERMISSIONS.FLEET_OPERATOR_VIEW,
    ],

    operations_manager: [
      PERMISSIONS.COMPANY_VIEW,
    ],

    support_engineer: [
      PERMISSIONS.COMPANY_VIEW,
    ],

    analyst: [
      PERMISSIONS.COMPANY_VIEW,
    ],
  },

  company: {
    company_admin: [
      PERMISSIONS.COMPANY_EDIT,
      PERMISSIONS.USER_ALL,
    ],

    dispatcher: [
    ],

    store_manager: [
    ],

    customer_support: [
    ],

    analyst: [
    ],
  },
};

export function getRolePermissions(
  role: string,
  roleType: "fleet_operator" | "company" = "company"
): string[] {
  let permissions: string[] = [];

  if (roleType === "fleet_operator") {
    const rolePerms =
      ROLE_PERMISSIONS.fleet_operator[
        role as keyof typeof ROLE_PERMISSIONS.fleet_operator
      ];
    permissions = rolePerms ? [...rolePerms] : [];
  } else {
    const rolePerms =
      ROLE_PERMISSIONS.company[role as keyof typeof ROLE_PERMISSIONS.company];
    permissions = rolePerms ? [...rolePerms] : [];
  }

  return permissions;
}

export function hasPermission(
  userPermissions: string[],
  requiredPermission: string
): boolean {
  if (userPermissions.includes(PERMISSIONS.ALL)) {
    return true;
  }

  if (userPermissions.includes(requiredPermission)) {
    return true;
  }

  const requiredParts = requiredPermission.split(".");
  const wildcardPermission = `${requiredParts[0]}.*`;

  return userPermissions.includes(wildcardPermission);
}

export function hasAnyPermission(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.some((permission) =>
    hasPermission(userPermissions, permission)
  );
}

export function hasAllPermissions(
  userPermissions: string[],
  requiredPermissions: string[]
): boolean {
  return requiredPermissions.every((permission) =>
    hasPermission(userPermissions, permission)
  );
}