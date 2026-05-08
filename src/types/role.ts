export interface Role {
  id: number;
  name: string;
  permissions?: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: string[];
}

export type UpdateRoleRequest = Partial<CreateRoleRequest>;
