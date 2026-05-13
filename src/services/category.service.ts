import { apiClient } from "./api-client";
import type { Category, CreateCategoryRequest, UpdateCategoryRequest } from "@/types/category";

export const categoryService = {
  list: () => apiClient.get<Category[]>("/categories"),

  getById: (id: number) => apiClient.get<Category>(`/categories/${id}`),

  create: (body: CreateCategoryRequest) =>
    apiClient.post<Category>("/categories", body),

  update: (id: number, body: UpdateCategoryRequest) =>
    apiClient.patch<Category>(`/categories/${id}`, body),

  delete: (id: number) => apiClient.delete<void>(`/categories/${id}`),
};
