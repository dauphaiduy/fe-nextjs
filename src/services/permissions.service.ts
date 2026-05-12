import { Permissions } from "@/modules/permissions/types";
import { apiClient } from "./api-client";

export const permissionsService = {
  list: () => apiClient.get<Permissions>("/permissions"),
};
