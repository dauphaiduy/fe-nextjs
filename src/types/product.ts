export type ProductStatus = "ACTIVE" | "INACTIVE";

export interface Product {
  id: number;
  name: string;
  description?: string;
  price: string;
  stock: number;
  status: ProductStatus;
  images: string[];
  categoryId: number;
  category?: { id: number; name: string };
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  description?: string;
  price: number;
  stock?: number;
  status?: ProductStatus;
  images?: string[];
  categoryId: number;
}

export type UpdateProductRequest = Partial<CreateProductRequest>;

export interface ProductListQuery {
  name?: string;
  status?: ProductStatus;
  categoryId?: number;
  page?: number;
  limit?: number;
}
