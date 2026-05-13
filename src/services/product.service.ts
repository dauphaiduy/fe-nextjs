import { apiClient } from "./api-client";
import type { Product, CreateProductRequest, UpdateProductRequest, ProductListQuery } from "@/types/product";
import type { PaginatedData } from "@/types/api";

export const productService = {
  list: (query?: ProductListQuery) => {
    const params = new URLSearchParams(
      Object.entries(query ?? {})
        .filter(([, v]) => v !== undefined && v !== "")
        .map(([k, v]) => [k, String(v)]),
    ).toString();
    return apiClient.get<PaginatedData<Product>>(`/products${params ? `?${params}` : ""}`);
  },

  getById: (id: number) => apiClient.get<Product>(`/products/${id}`),

  create: (body: CreateProductRequest) =>
    apiClient.post<Product>("/products", body),

  update: (id: number, body: UpdateProductRequest) =>
    apiClient.patch<Product>(`/products/${id}`, body),

  delete: (id: number) => apiClient.delete<void>(`/products/${id}`),
};
