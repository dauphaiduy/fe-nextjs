import { apiClient } from "./api-client";
import type { User, CreateUserRequest, UpdateUserRequest, UserListQuery } from "@/types/user";
import type { PaginatedData } from "@/types/api";

export const userService = {
  list: (query?: UserListQuery) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return apiClient.get<PaginatedData<User>>(`/user${params ? `?${params}` : ""}`);
  },

  create: (body: CreateUserRequest) =>
    apiClient.post<User>("/user", body),

  update: (id: number, body: UpdateUserRequest) =>
    apiClient.patch<User>(`/user/${id}`, body),
};
