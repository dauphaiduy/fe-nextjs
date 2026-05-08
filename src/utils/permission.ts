type Permissions = string[];

export function hasPermission(permissions: Permissions, required: string): boolean {
  return permissions.includes("*") || permissions.includes(required);
}

export function hasAnyPermission(permissions: Permissions, required: string[]): boolean {
  return required.some((p) => hasPermission(permissions, p));
}

export function hasAllPermissions(permissions: Permissions, required: string[]): boolean {
  return required.every((p) => hasPermission(permissions, p));
}
