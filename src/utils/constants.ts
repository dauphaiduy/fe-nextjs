export const API_PREFIX = "/v1";

export const ROUTES = {
  LOGIN: "/login",
  DASHBOARD: "/dashboard",
  USERS: "/users",
  ROLES: "/roles",
  PERMISSIONS: "/permissions",
  AUDIT_LOGS: "/audit-logs",
} as const;

export const ACCOUNT_TYPES = ["LOCAL", "GOOGLE", "GITHUB"] as const;

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
