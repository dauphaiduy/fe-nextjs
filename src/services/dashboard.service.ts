import { apiClient } from "./api-client";
import type { DashboardSummary, UserTrend, AuditLog } from "@/types/api";

export const dashboardService = {
  getSummary: () => apiClient.get<DashboardSummary>("/dashboard/summary"),

  getRecentLogs: (limit = 10) =>
    apiClient.get<AuditLog[]>(`/dashboard/recent-logs?limit=${limit}`),

  getUserTrend: (days = 7) =>
    apiClient.get<UserTrend[]>(`/dashboard/user-trend?days=${days}`),
};
