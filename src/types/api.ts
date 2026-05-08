export interface ApiResponse<T> {
  success: true;
  statusCode: number;
  data: T;
  timestamp: string;
}

export interface ApiError {
  success: false;
  statusCode: number;
  message: string;
  errors?: string[];
  timestamp: string;
  path: string;
}

export interface PaginatedData<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditLog {
  id: number;
  userId?: number;
  action: string;
  resource: string;
  resourceId?: string;
  statusCode?: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: unknown;
  createdAt: string;
}

export interface AuditLogQuery {
  userId?: number;
  action?: string;
  resource?: string;
  statusCode?: number;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface DashboardSummary {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  totalRoles: number;
  totalAuditLogs: number;
}

export interface UserTrend {
  date: string;
  count: number;
}
