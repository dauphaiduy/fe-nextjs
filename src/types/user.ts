export type AccountType = "LOCAL" | "GOOGLE" | "GITHUB";
export type UserType = "ADMIN" | "STAFF" | "CUSTOMER";

export interface User {
  id: number;
  email: string;
  username?: string;
  name?: string;
  isActive: boolean;
  accountType: AccountType;
  userType: UserType;
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
  userType: UserType;
  roleId: number;
}

export type UpdateUserRequest = Partial<Omit<CreateUserRequest, "password">> & {
  password?: string;
  isActive?: boolean;
};

export interface UserListQuery {
  email?: string;
  username?: string;
  name?: string;
  isActive?: boolean;
  accountType?: AccountType;
  userType?: UserType;
  roleId?: number;
  page?: number;
  limit?: number;
}
