import { apiClient } from "./api-client";
import type { Role, CreateRoleRequest, UpdateRoleRequest } from "@/types/role";

export const roleService = {
  list: () => apiClient.get<Role[]>("/roles"),

  getById: (id: number) => apiClient.get<Role>(`/roles/${id}`),

  create: (body: CreateRoleRequest) =>
    apiClient.post<Role>("/roles", body),

  update: (id: number, body: UpdateRoleRequest) =>
    apiClient.patch<Role>(`/roles/${id}`, body),

  delete: (id: number) => apiClient.delete<void>(`/roles/${id}`),
};
