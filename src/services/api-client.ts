import axios from "axios";
import { getSession } from "next-auth/react";
import type { ApiResponse } from "@/types/api";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000/v1";

const instance = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

instance.interceptors.request.use(async (config) => {
  const session = await getSession();
  if (session?.accessToken) {
    config.headers["Authorization"] = `Bearer ${session.accessToken}`;
  }
  return config;
});

instance.interceptors.response.use(
  (res) => res,
  (err) => Promise.reject(err.response?.data ?? err),
);

export const apiClient = {
  get: <T>(path: string) =>
    instance.get<ApiResponse<T>>(path).then((r) => r.data),
  post: <T>(path: string, body: unknown) =>
    instance.post<ApiResponse<T>>(path, body).then((r) => r.data),
  patch: <T>(path: string, body: unknown) =>
    instance.patch<ApiResponse<T>>(path, body).then((r) => r.data),
  delete: <T>(path: string) =>
    instance.delete<ApiResponse<T>>(path).then((r) => r.data),
};
