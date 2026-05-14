import { apiClient } from "./api-client";
import type { AuthToken, LoginRequest, RegisterRequest } from "@/modules/auth/types";
import type { User } from "@/types/user";

export const authService = {
  adminLogin: (body: LoginRequest) =>
    apiClient.post<AuthToken>("/auth/admin/login", body),

  register: (body: RegisterRequest) =>
    apiClient.post<User>("/auth/register", body),
};
