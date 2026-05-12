import { apiClient } from "./api-client";
import type { AuditLog, AuditLogQuery, PaginatedData } from "@/types/api";

export const auditLogService = {
  list: (query?: AuditLogQuery) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)]),
    ).toString();

    return apiClient.get<PaginatedData<AuditLog>>(
      `/audit-log${params ? `?${params}` : ""}`,
    );
  },
};
