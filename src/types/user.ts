export type AccountType = "LOCAL" | "GOOGLE" | "GITHUB";

export interface User {
  id: number;
  email: string;
  username?: string;
  name?: string;
  isActive: boolean;
  accountType: AccountType;
  roleId: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  email: string;
  username?: string;
  password: string;
  name?: string;
  accountType: AccountType;
  roleId: number;
}

export type UpdateUserRequest = Partial<Omit<CreateUserRequest, "password">> & {
  password?: string;
};

export interface UserListQuery {
  email?: string;
  username?: string;
  name?: string;
  isActive?: boolean;
  accountType?: AccountType;
  roleId?: number;
  page?: number;
  limit?: number;
}
